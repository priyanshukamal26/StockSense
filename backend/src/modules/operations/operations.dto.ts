import { z } from "zod";
import { OperationType, OperationStatus } from "@prisma/client";

export const createOperationDto = z.object({
  operationType: z.nativeEnum(OperationType),
  sourceLocationId: z.string().uuid("Invalid source location ID."),
  destinationLocationId: z.string().uuid("Invalid destination location ID."),
  contactId: z.string().uuid().nullable().optional(),
  scheduledDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Please choose a schedule date.",
  }),
  notes: z.string().optional(),
  warehouseId: z.string().uuid("Warehouse ID is required."),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid("Invalid product ID."),
        demandQty: z.number().positive("Quantity must be greater than zero."),
      })
    )
    .min(1, "At least one product line is required."),
});

export const updateOperationDto = z.object({
  contactId: z.string().uuid().nullable().optional(),
  scheduledDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)))
    .optional(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // existing line
        productId: z.string().uuid(),
        demandQty: z.number().positive(),
        _delete: z.boolean().optional(), // true to remove this line
      })
    )
    .optional(),
});

export const listOperationsQuery = z.object({
  type: z.nativeEnum(OperationType).optional(),
  status: z.nativeEnum(OperationStatus).optional(),
  warehouseId: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  view: z.enum(["list", "kanban"]).optional(),
});

export type CreateOperationDto = z.infer<typeof createOperationDto>;
export type UpdateOperationDto = z.infer<typeof updateOperationDto>;
