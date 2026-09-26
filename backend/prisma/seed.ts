import { PrismaClient, UserRole, LocationType, ContactType, OperationType, OperationStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Users ───────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const mgrHash = await bcrypt.hash("Manager@1234", 12);
  const staffHash = await bcrypt.hash("Staff@1234", 12);

  const admin = await prisma.user.upsert({
    where: { loginId: "admin01" },
    update: {},
    create: {
      loginId: "admin01",
      email: "admin@stocksense.dev",
      passwordHash: adminHash,
      fullName: "Admin User",
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { loginId: "mgr001" },
    update: {},
    create: {
      loginId: "mgr001",
      email: "manager@stocksense.dev",
      passwordHash: mgrHash,
      fullName: "Inventory Manager",
      role: UserRole.INVENTORY_MANAGER,
    },
  });

  const staff = await prisma.user.upsert({
    where: { loginId: "staff01" },
    update: {},
    create: {
      loginId: "staff01",
      email: "staff@stocksense.dev",
      passwordHash: staffHash,
      fullName: "Warehouse Staff",
      role: UserRole.WAREHOUSE_STAFF,
    },
  });

  console.log(`✅ Users: admin01, mgr001, staff01`);

  // ─── Warehouse ────────────────────────────────────────────────────────────────
  const warehouse = await prisma.warehouse.upsert({
    where: { shortCode: "WH" },
    update: {},
    create: {
      name: "Main Warehouse",
      shortCode: "WH",
      address: "123 Industrial Area, Business Park",
    },
  });

  console.log(`✅ Warehouse: WH`);

  // ─── Locations ────────────────────────────────────────────────────────────────
  const stock1 = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: warehouse.id, shortCode: "Stock1" } },
    update: {},
    create: {
      name: "WH Stock 1",
      shortCode: "Stock1",
      warehouseId: warehouse.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const stock2 = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: warehouse.id, shortCode: "Stock2" } },
    update: {},
    create: {
      name: "WH Stock 2",
      shortCode: "Stock2",
      warehouseId: warehouse.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const prodRack = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: warehouse.id, shortCode: "ProdRack" } },
    update: {},
    create: {
      name: "Production Rack",
      shortCode: "ProdRack",
      warehouseId: warehouse.id,
      locationType: LocationType.INTERNAL,
    },
  });

  // Virtual locations (no warehouse)
  const vendorLoc = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: null as unknown as string, shortCode: "VENDOR" } },
    update: {},
    create: {
      name: "Vendor (Virtual)",
      shortCode: "VENDOR",
      warehouseId: null,
      locationType: LocationType.VENDOR,
    },
  }).catch(() => prisma.location.findFirst({ where: { locationType: LocationType.VENDOR } }));

  const customerLoc = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: null as unknown as string, shortCode: "CUSTOMER" } },
    update: {},
    create: {
      name: "Customer (Virtual)",
      shortCode: "CUSTOMER",
      warehouseId: null,
      locationType: LocationType.CUSTOMER,
    },
  }).catch(() => prisma.location.findFirst({ where: { locationType: LocationType.CUSTOMER } }));

  const inventoryLossLoc = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: null as unknown as string, shortCode: "INVLOSS" } },
    update: {},
    create: {
      name: "Inventory Loss (Virtual)",
      shortCode: "INVLOSS",
      warehouseId: null,
      locationType: LocationType.INVENTORY_LOSS,
    },
  }).catch(() => prisma.location.findFirst({ where: { locationType: LocationType.INVENTORY_LOSS } }));

  const vendor = vendorLoc!;
  const customer = customerLoc!;
  const invLoss = inventoryLossLoc!;

  console.log(`✅ Locations: Stock1, Stock2, ProdRack, VENDOR, CUSTOMER, INVLOSS`);

  // ─── Categories ───────────────────────────────────────────────────────────────
  const furnitureCategory = await prisma.productCategory.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture", description: "Office and home furniture" },
  });

  const rawMaterialsCategory = await prisma.productCategory.upsert({
    where: { name: "Raw Materials" },
    update: {},
    create: { name: "Raw Materials", description: "Raw materials for production" },
  });

  console.log(`✅ Categories: Furniture, Raw Materials`);

  // ─── Products ─────────────────────────────────────────────────────────────────
  const desk = await prisma.product.upsert({
    where: { sku: "DESK001" },
    update: {},
    create: {
      sku: "DESK001",
      name: "Desk",
      categoryId: furnitureCategory.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 3000,
      reorderPoint: 10,
      reorderQty: 20,
    },
  });

  const table = await prisma.product.upsert({
    where: { sku: "TABLE001" },
    update: {},
    create: {
      sku: "TABLE001",
      name: "Table",
      categoryId: furnitureCategory.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 3000,
      reorderPoint: 5,
      reorderQty: 10,
    },
  });

  const steel = await prisma.product.upsert({
    where: { sku: "STEEL001" },
    update: {},
    create: {
      sku: "STEEL001",
      name: "Steel Rod",
      categoryId: rawMaterialsCategory.id,
      unitOfMeasure: "KG",
      costPerUnit: 80,
      reorderPoint: 20,
      reorderQty: 100,
    },
  });

  console.log(`✅ Products: DESK001, TABLE001, STEEL001`);

  // ─── Initial stock quantities (wireframe examples) ────────────────────────────
  await prisma.stockQuantity.upsert({
    where: { productId_locationId: { productId: desk.id, locationId: stock1.id } },
    update: {},
    create: { productId: desk.id, locationId: stock1.id, onHandQty: 50 },
  });

  await prisma.stockQuantity.upsert({
    where: { productId_locationId: { productId: table.id, locationId: stock1.id } },
    update: {},
    create: { productId: table.id, locationId: stock1.id, onHandQty: 50 },
  });

  console.log(`✅ Initial stock: Desk×50, Table×50 at WH/Stock1`);

  // ─── Contact ──────────────────────────────────────────────────────────────────
  await prisma.contact.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Azure Interior",
      contactType: ContactType.BOTH,
      email: "contact@azureinterior.com",
      phone: "+91-9876543210",
      address: "456 Design Hub, Creative District",
    },
  });

  console.log(`✅ Contact: Azure Interior`);

  // ─── Demo Operations (wireframe rows: WH/IN/0001, WH/OUT/0001) ───────────────
  // Seed reference sequences so new ops start from 0002
  await prisma.referenceSequence.upsert({
    where: { warehouseId_operationType: { warehouseId: warehouse.id, operationType: OperationType.RECEIPT } },
    update: {},
    create: { warehouseId: warehouse.id, operationType: OperationType.RECEIPT, lastNumber: 1 },
  });

  await prisma.referenceSequence.upsert({
    where: { warehouseId_operationType: { warehouseId: warehouse.id, operationType: OperationType.DELIVERY } },
    update: {},
    create: { warehouseId: warehouse.id, operationType: OperationType.DELIVERY, lastNumber: 1 },
  });

  await prisma.referenceSequence.upsert({
    where: { warehouseId_operationType: { warehouseId: warehouse.id, operationType: OperationType.INTERNAL_TRANSFER } },
    update: {},
    create: { warehouseId: warehouse.id, operationType: OperationType.INTERNAL_TRANSFER, lastNumber: 0 },
  });

  await prisma.referenceSequence.upsert({
    where: { warehouseId_operationType: { warehouseId: warehouse.id, operationType: OperationType.ADJUSTMENT } },
    update: {},
    create: { warehouseId: warehouse.id, operationType: OperationType.ADJUSTMENT, lastNumber: 0 },
  });

  // Demo receipt WH/IN/0001 (Ready — matches wireframe)
  const demoReceipt = await prisma.operation.upsert({
    where: { reference: "WH/IN/0001" },
    update: {},
    create: {
      reference: "WH/IN/0001",
      operationType: OperationType.RECEIPT,
      sourceLocationId: vendor!.id,
      destinationLocationId: stock1.id,
      contactId: "00000000-0000-0000-0000-000000000001",
      responsibleUserId: manager.id,
      scheduledDate: new Date(),
      status: OperationStatus.READY,
      lines: {
        create: [{ productId: desk.id, demandQty: 20 }],
      },
    },
  });

  // Demo delivery WH/OUT/0001 (Ready — matches wireframe)
  await prisma.operation.upsert({
    where: { reference: "WH/OUT/0001" },
    update: {},
    create: {
      reference: "WH/OUT/0001",
      operationType: OperationType.DELIVERY,
      sourceLocationId: stock1.id,
      destinationLocationId: customer!.id,
      contactId: "00000000-0000-0000-0000-000000000001",
      responsibleUserId: manager.id,
      scheduledDate: new Date(),
      status: OperationStatus.READY,
      lines: {
        create: [{ productId: desk.id, demandQty: 10 }],
      },
    },
  });

  console.log(`✅ Demo operations: WH/IN/0001 (Ready), WH/OUT/0001 (Ready)`);
  console.log(`\n🎉 Seed complete!\n`);
  console.log(`Demo credentials:`);
  console.log(`  Admin:     loginId=admin01  password=Admin@1234`);
  console.log(`  Manager:   loginId=mgr001   password=Manager@1234`);
  console.log(`  Staff:     loginId=staff01  password=Staff@1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
