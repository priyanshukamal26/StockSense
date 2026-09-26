import { OperationType } from "@prisma/client";
import prisma from "./prisma";

const PREFIX: Record<OperationType, string> = {
  RECEIPT: "IN",
  DELIVERY: "OUT",
  INTERNAL_TRANSFER: "INT",
  ADJUSTMENT: "ADJ",
};

/**
 * Generates the next reference number for an operation type within a warehouse.
 * Must be called inside a Prisma $transaction to be concurrency-safe.
 * Example: WH/IN/0001
 */
export async function nextReference(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  warehouseId: string,
  type: OperationType
): Promise<string> {
  const seq = await tx.referenceSequence.upsert({
    where: {
      warehouseId_operationType: { warehouseId, operationType: type },
    },
    create: { warehouseId, operationType: type, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  const warehouse = await tx.warehouse.findUniqueOrThrow({
    where: { id: warehouseId },
    select: { shortCode: true },
  });

  const padded = String(seq.lastNumber).padStart(4, "0");
  return `${warehouse.shortCode}/${PREFIX[type]}/${padded}`;
}
