import prisma from "../../common/lib/prisma";
import { AppError } from "../../common/middleware/error-handler";
import { CreateOperationDto, UpdateOperationDto } from "./operations.dto";
import { OperationType, OperationStatus } from "@prisma/client";
import { emitStockUpdated, emitNotification } from "../../common/realtime/socket";

const OPERATION_INCLUDE = {
  sourceLocation: { include: { warehouse: true } },
  destinationLocation: { include: { warehouse: true } },
  contact: true,
  responsible: { select: { id: true, loginId: true, fullName: true } },
  lines: { include: { product: { include: { category: true } } } },
};

function isLate(op: { status: OperationStatus; scheduledDate: Date }) {
  if (op.status === OperationStatus.DONE || op.status === OperationStatus.CANCELLED) return false;
  return op.scheduledDate < new Date(new Date().setHours(0, 0, 0, 0));
}

export const OperationsService = {
  async list(query: {
    type?: OperationType;
    status?: OperationStatus;
    warehouseId?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = parseInt(query.page ?? "1");
    const pageSize = Math.min(parseInt(query.pageSize ?? "20"), 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (query.type) where.operationType = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: "insensitive" } },
        { contact: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    if (query.warehouseId) {
      where.OR = [
        { sourceLocation: { warehouseId: query.warehouseId } },
        { destinationLocation: { warehouseId: query.warehouseId } },
      ];
    }

    const [operations, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        include: {
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          contact: { select: { id: true, name: true } },
          responsible: { select: { id: true, fullName: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { scheduledDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.operation.count({ where }),
    ]);

    return {
      data: operations.map((op) => ({ ...op, isLate: isLate(op) })),
      meta: { page, pageSize, total },
    };
  },

  async create(dto: CreateOperationDto, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Generate reference
      const seq = await tx.referenceSequence.upsert({
        where: { warehouseId_operationType: { warehouseId: dto.warehouseId, operationType: dto.operationType } },
        create: { warehouseId: dto.warehouseId, operationType: dto.operationType, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const warehouse = await tx.warehouse.findUniqueOrThrow({ where: { id: dto.warehouseId } });
      const PREFIX: Record<OperationType, string> = { RECEIPT: "IN", DELIVERY: "OUT", INTERNAL_TRANSFER: "INT", ADJUSTMENT: "ADJ" };
      const ref = `${warehouse.shortCode}/${PREFIX[dto.operationType]}/${String(seq.lastNumber).padStart(4, "0")}`;

      const operation = await tx.operation.create({
        data: {
          reference: ref,
          operationType: dto.operationType,
          sourceLocationId: dto.sourceLocationId,
          destinationLocationId: dto.destinationLocationId,
          contactId: dto.contactId,
          responsibleUserId: userId,
          scheduledDate: new Date(dto.scheduledDate),
          notes: dto.notes,
          status: OperationStatus.DRAFT,
          lines: { create: dto.lines.map((l) => ({ productId: l.productId, demandQty: l.demandQty })) },
        },
        include: OPERATION_INCLUDE,
      });

      return operation;
    });
  },

  async getById(id: string) {
    const op = await prisma.operation.findUniqueOrThrow({
      where: { id },
      include: {
        ...OPERATION_INCLUDE,
        lines: {
          include: {
            product: {
              include: {
                category: true,
                stockQuantities: true,
              },
            },
          },
        },
      },
    });

    // For deliveries: compute insufficient stock flag per line
    const lines = await Promise.all(
      op.lines.map(async (line) => {
        const available = await prisma.stockQuantity.findUnique({
          where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
        });
        const freeToUseQty = Number(available?.onHandQty ?? 0) - Number(available?.reservedQty ?? 0);
        return {
          ...line,
          freeToUseQty,
          isInsufficient: op.operationType === OperationType.DELIVERY && Number(line.demandQty) > freeToUseQty,
        };
      })
    );

    return { ...op, lines, isLate: isLate(op) };
  },

  async update(id: string, dto: UpdateOperationDto) {
    const op = await prisma.operation.findUniqueOrThrow({ where: { id } });
    if (op.status !== OperationStatus.DRAFT && op.status !== OperationStatus.WAITING) {
      throw AppError.conflict("Cannot edit an operation that is not in Draft or Waiting status.");
    }

    return prisma.$transaction(async (tx) => {
      // Handle line updates
      if (dto.lines) {
        for (const line of dto.lines) {
          if (line._delete && line.id) {
            await tx.operationLine.delete({ where: { id: line.id } });
          } else if (line.id) {
            await tx.operationLine.update({
              where: { id: line.id },
              data: { productId: line.productId, demandQty: line.demandQty },
            });
          } else {
            await tx.operationLine.create({
              data: { operationId: id, productId: line.productId, demandQty: line.demandQty },
            });
          }
        }
      }

      const { lines: _lines, ...updateData } = dto;
      const updated = await tx.operation.update({
        where: { id },
        data: {
          ...updateData,
          scheduledDate: updateData.scheduledDate ? new Date(updateData.scheduledDate) : undefined,
        },
        include: OPERATION_INCLUDE,
      });

      return updated;
    });
  },

  /**
   * Mark-Todo: DRAFT → READY (or WAITING for Delivery if insufficient stock)
   */
  async markTodo(id: string) {
    const op = await prisma.operation.findUniqueOrThrow({
      where: { id },
      include: { lines: true },
    });

    if (op.status !== OperationStatus.DRAFT) {
      throw AppError.conflict("Only Draft operations can be moved to Ready.");
    }

    let newStatus: OperationStatus = OperationStatus.READY;

    if (op.operationType === OperationType.DELIVERY) {
      for (const line of op.lines) {
        const avail = await prisma.stockQuantity.findUnique({
          where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
        });
        const free = Number(avail?.onHandQty ?? 0) - Number(avail?.reservedQty ?? 0);
        if (Number(line.demandQty) > free) {
          newStatus = OperationStatus.WAITING;
          break;
        }
      }
    }

    return prisma.operation.update({
      where: { id },
      data: { status: newStatus },
      include: OPERATION_INCLUDE,
    });
  },

  /**
   * Validate: READY → DONE
   * Executes the transactional stock-move logic from docs/03 §5
   */
  async validate(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const op = await tx.operation.findUniqueOrThrow({
        where: { id },
        include: { lines: true },
      });

      if (op.status !== OperationStatus.READY) {
        throw AppError.conflict("Only Ready operations can be validated.");
      }

      // For deliveries: check stock availability
      if (op.operationType === OperationType.DELIVERY) {
        for (const line of op.lines) {
          const avail = await tx.stockQuantity.findUnique({
            where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
          });
          const free = Number(avail?.onHandQty ?? 0) - Number(avail?.reservedQty ?? 0);
          if (Number(line.demandQty) > free) {
            const product = await tx.product.findUnique({ where: { id: line.productId } });
            throw AppError.conflict(
              `Not enough stock for ${product?.name ?? line.productId} — this delivery will stay in Waiting.`
            );
          }
        }
      }

      // Create StockMoves and update StockQuantity for each line
      for (const line of op.lines) {
        const doneQty = line.doneQty ?? line.demandQty;

        // Create immutable ledger entry
        await tx.stockMove.create({
          data: {
            operationId: id,
            productId: line.productId,
            fromLocationId: op.sourceLocationId,
            toLocationId: op.destinationLocationId,
            quantity: doneQty,
            createdById: userId,
          },
        });

        // Update destination (+qty)
        await tx.stockQuantity.upsert({
          where: { productId_locationId: { productId: line.productId, locationId: op.destinationLocationId } },
          create: { productId: line.productId, locationId: op.destinationLocationId, onHandQty: Number(doneQty) },
          update: { onHandQty: { increment: Number(doneQty) } },
        });

        // Update source (−qty) for internal locations only
        const srcLocation = await tx.location.findUniqueOrThrow({ where: { id: op.sourceLocationId } });
        if (srcLocation.locationType === "INTERNAL") {
          await tx.stockQuantity.upsert({
            where: { productId_locationId: { productId: line.productId, locationId: op.sourceLocationId } },
            create: { productId: line.productId, locationId: op.sourceLocationId, onHandQty: -Number(doneQty) },
            update: { onHandQty: { decrement: Number(doneQty) } },
          });
        }

        // Update done_qty on line
        await tx.operationLine.update({ where: { id: line.id }, data: { doneQty } });
      }

      const done = await tx.operation.update({
        where: { id },
        data: { status: OperationStatus.DONE, doneAt: new Date() },
        include: OPERATION_INCLUDE,
      });

      return done;
    }).then(async (done) => {
      // Post-transaction: emit events and check low stock
      for (const line of done.lines) {
        emitStockUpdated(line.productId, done.destinationLocationId);

        const sq = await prisma.stockQuantity.findUnique({
          where: { productId_locationId: { productId: line.productId, locationId: done.destinationLocationId } },
          include: { product: true },
        });

        if (sq && Number(sq.product.reorderPoint) > 0 && Number(sq.onHandQty) <= Number(sq.product.reorderPoint)) {
          const notification = await prisma.notification.create({
            data: {
              type: Number(sq.onHandQty) <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
              title: `Low Stock: ${sq.product.name}`,
              message: `${sq.product.name} has only ${sq.onHandQty} ${sq.product.unitOfMeasure} remaining (reorder point: ${sq.product.reorderPoint}).`,
              referenceOperationId: done.id,
              referenceProductId: sq.productId,
            },
          });
          emitNotification(null, notification);
        }
      }

      return done;
    });
  },

  async cancel(id: string) {
    const op = await prisma.operation.findUniqueOrThrow({ where: { id } });
    if (op.status === OperationStatus.DONE) {
      throw AppError.conflict("Cannot cancel a completed operation.");
    }
    return prisma.operation.update({
      where: { id },
      data: { status: OperationStatus.CANCELLED },
      include: OPERATION_INCLUDE,
    });
  },
};
