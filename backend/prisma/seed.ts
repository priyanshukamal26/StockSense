import { PrismaClient, UserRole, LocationType, ContactType, OperationType, OperationStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting rich enterprise database seed...");

  // ─── 1. USERS ───────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const mgrHash = await bcrypt.hash("Manager@1234", 12);
  const staffHash = await bcrypt.hash("Staff@1234", 12);
  const demoAdminHash = await bcrypt.hash("admin123", 12);
  const demoWorkerHash = await bcrypt.hash("worker123", 12);

  const demoAdmin = await prisma.user.upsert({
    where: { loginId: "demoadmin" },
    update: { passwordHash: demoAdminHash, role: UserRole.ADMIN },
    create: {
      loginId: "demoadmin",
      email: "demoadmin@stocksense.dev",
      passwordHash: demoAdminHash,
      fullName: "Demo Administrator",
      role: UserRole.ADMIN,
    },
  });

  const demoWorker = await prisma.user.upsert({
    where: { loginId: "demoworker" },
    update: { passwordHash: demoWorkerHash, role: UserRole.WAREHOUSE_STAFF },
    create: {
      loginId: "demoworker",
      email: "demoworker@stocksense.dev",
      passwordHash: demoWorkerHash,
      fullName: "Demo Warehouse Worker",
      role: UserRole.WAREHOUSE_STAFF,
    },
  });

  const admin = await prisma.user.upsert({
    where: { loginId: "admin01" },
    update: { passwordHash: adminHash, role: UserRole.ADMIN },
    create: {
      loginId: "admin01",
      email: "admin@stocksense.dev",
      passwordHash: adminHash,
      fullName: "Sarah Chen (Director of Ops)",
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { loginId: "mgr001" },
    update: { passwordHash: mgrHash, role: UserRole.INVENTORY_MANAGER },
    create: {
      loginId: "mgr001",
      email: "manager@stocksense.dev",
      passwordHash: mgrHash,
      fullName: "Marcus Vance (Inventory Lead)",
      role: UserRole.INVENTORY_MANAGER,
    },
  });

  const staff = await prisma.user.upsert({
    where: { loginId: "staff01" },
    update: { passwordHash: staffHash, role: UserRole.WAREHOUSE_STAFF },
    create: {
      loginId: "staff01",
      email: "staff@stocksense.dev",
      passwordHash: staffHash,
      fullName: "Alex Rivera (Floor Specialist)",
      role: UserRole.WAREHOUSE_STAFF,
    },
  });

  console.log("✅ Users confirmed: demoadmin, demoworker, admin01, mgr001, staff01");

  // ─── 2. CLEANUP PREVIOUS OPERATIONAL DATA ───────────────────────────────────
  console.log("🧹 Clearing old operational records...");
  await prisma.notification.deleteMany();
  await prisma.stockMove.deleteMany();
  await prisma.operationLine.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.referenceSequence.deleteMany();
  await prisma.stockQuantity.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();

  // ─── 3. WAREHOUSES ──────────────────────────────────────────────────────────
  console.log("🏢 Seeding Warehouses...");
  const whMain = await prisma.warehouse.create({
    data: {
      name: "Central Logistics Hub",
      shortCode: "WH",
      address: "742 Evergreen Industrial Parkway, Chicago, IL 60632",
    },
  });

  const whEcom = await prisma.warehouse.create({
    data: {
      name: "East Coast Fulfillment Hub",
      shortCode: "ECOM",
      address: "1200 Port Terminal Blvd, Newark, NJ 07114",
    },
  });

  const whWest = await prisma.warehouse.create({
    data: {
      name: "West Distribution Center",
      shortCode: "WEST",
      address: "8800 Logistic Way, Reno, NV 89502",
    },
  });

  // ─── 4. LOCATIONS ───────────────────────────────────────────────────────────
  console.log("📍 Seeding Locations (Virtual & Physical)...");
  // Virtual Locations
  const locVendor = await prisma.location.create({
    data: {
      name: "Vendor Inbound Staging (Virtual)",
      shortCode: "VENDOR",
      locationType: LocationType.VENDOR,
    },
  });

  const locCustomer = await prisma.location.create({
    data: {
      name: "Customer Shipping Staging (Virtual)",
      shortCode: "CUSTOMER",
      locationType: LocationType.CUSTOMER,
    },
  });

  const locLoss = await prisma.location.create({
    data: {
      name: "Inventory Shrinkage & Loss (Virtual)",
      shortCode: "INVLOSS",
      locationType: LocationType.INVENTORY_LOSS,
    },
  });

  // WH Physical Locations
  const locWhStock1 = await prisma.location.create({
    data: {
      name: "WH Main Storage Bay A",
      shortCode: "Stock1",
      warehouseId: whMain.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const locWhStock2 = await prisma.location.create({
    data: {
      name: "WH High-Bay Pallets B",
      shortCode: "Stock2",
      warehouseId: whMain.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const locWhProd = await prisma.location.create({
    data: {
      name: "WH Production & Staging",
      shortCode: "ProdRack",
      warehouseId: whMain.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const locWhCold = await prisma.location.create({
    data: {
      name: "WH Cold Vault (2-8°C)",
      shortCode: "ColdVault",
      warehouseId: whMain.id,
      locationType: LocationType.INTERNAL,
    },
  });

  // ECOM Physical Locations
  const locEcomStock = await prisma.location.create({
    data: {
      name: "ECOM High-Velocity Racks",
      shortCode: "ECOM-Stock",
      warehouseId: whEcom.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const locEcomPack = await prisma.location.create({
    data: {
      name: "ECOM Packing & Shipping Bay",
      shortCode: "ECOM-Pack",
      warehouseId: whEcom.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const locEcomRma = await prisma.location.create({
    data: {
      name: "ECOM Returns & QA Inspection",
      shortCode: "ECOM-RMA",
      warehouseId: whEcom.id,
      locationType: LocationType.INTERNAL,
    },
  });

  // WEST Physical Locations
  const locWestStock = await prisma.location.create({
    data: {
      name: "WEST Regional Main Storage",
      shortCode: "WEST-Stock",
      warehouseId: whWest.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const locWestBulk = await prisma.location.create({
    data: {
      name: "WEST Bulk Pallet Staging",
      shortCode: "WEST-Bulk",
      warehouseId: whWest.id,
      locationType: LocationType.INTERNAL,
    },
  });

  const locWestTransit = await prisma.location.create({
    data: {
      name: "WEST Cross-Dock Transit Staging",
      shortCode: "WEST-Transit",
      warehouseId: whWest.id,
      locationType: LocationType.INTERNAL,
    },
  });

  // ─── 5. CATEGORIES ──────────────────────────────────────────────────────────
  console.log("🏷️  Seeding Product Categories...");
  const catElectronics = await prisma.productCategory.create({
    data: { name: "Electronics & Audio", description: "Enterprise computing, sensors, displays, and audio communication" },
  });
  const catFurniture = await prisma.productCategory.create({
    data: { name: "Office Furniture", description: "Ergonomic seating, motorized sit-stand desks, and conference storage" },
  });
  const catHardware = await prisma.productCategory.create({
    data: { name: "Industrial Hardware", description: "Precision bearings, valves, high-tensile fasteners, and fittings" },
  });
  const catMetals = await prisma.productCategory.create({
    data: { name: "Raw Materials & Metals", description: "Structural steel, modular aluminum extrusions, and copper sheets" },
  });
  const catPackaging = await prisma.productCategory.create({
    data: { name: "Packaging Supplies", description: "Heavy-duty cartons, conductive ESD foam, and strapping tape" },
  });
  const catEquipment = await prisma.productCategory.create({
    data: { name: "Warehouse Equipment", description: "2D barcode scanners, digital scale forks, and material handling" },
  });
  const catSafety = await prisma.productCategory.create({
    data: { name: "Safety & PPE", description: "High-impact head protection, cut-resistant gloves, and N95 respirators" },
  });

  // ─── 6. PRODUCTS ────────────────────────────────────────────────────────────
  console.log("📦 Seeding Diverse Catalog Products...");
  const pDesk = await prisma.product.create({
    data: {
      sku: "DESK-PRO-01",
      name: "ErgoLift Dual-Motor Standing Desk (160x80cm)",
      categoryId: catFurniture.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 450.0,
      reorderPoint: 10,
      reorderQty: 25,
    },
  });

  const pChair = await prisma.product.create({
    data: {
      sku: "CHAIR-AERO-02",
      name: "Aeroflex Mesh Executive Ergonomic Chair",
      categoryId: catFurniture.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 280.0,
      reorderPoint: 15,
      reorderQty: 30,
    },
  });

  const pMon = await prisma.product.create({
    data: {
      sku: "MON-4K-27",
      name: "UltraSharp 27\" 4K UHD Developer Display",
      categoryId: catElectronics.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 340.0,
      reorderPoint: 12,
      reorderQty: 24,
    },
  });

  const pAud = await prisma.product.create({
    data: {
      sku: "AUD-ANC-PRO",
      name: "SoundMaster Pro Noise-Cancelling Headset",
      categoryId: catElectronics.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 115.0,
      reorderPoint: 20,
      reorderQty: 50,
    },
  });

  // Low Stock item (Total stock: 18, reorderPoint: 25)
  const pSens = await prisma.product.create({
    data: {
      sku: "SENS-IOT-01",
      name: "SenseTrack IoT Cold-Chain Temperature Sensor",
      categoryId: catElectronics.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 42.5,
      reorderPoint: 25,
      reorderQty: 100,
    },
  });

  const pScanner = await prisma.product.create({
    data: {
      sku: "BC-SCAN-2D",
      name: "Zebra DS2208 Handheld 2D Barcode Scanner",
      categoryId: catEquipment.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 185.0,
      reorderPoint: 8,
      reorderQty: 15,
    },
  });

  // Low Stock item (Total stock: 3, reorderPoint: 4)
  const pScale = await prisma.product.create({
    data: {
      sku: "FORK-SCALE-01",
      name: "Heavy-Duty Digital Pallet Scale 2000kg",
      categoryId: catEquipment.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 890.0,
      reorderPoint: 4,
      reorderQty: 8,
    },
  });

  const pSteel = await prisma.product.create({
    data: {
      sku: "STEEL-ROD-25",
      name: "Cold-Rolled Carbon Steel Rod 25mm x 3m",
      categoryId: catMetals.id,
      unitOfMeasure: "KG",
      costPerUnit: 14.5,
      reorderPoint: 150,
      reorderQty: 500,
    },
  });

  const pAlum = await prisma.product.create({
    data: {
      sku: "ALUM-EXT-40",
      name: "4040 T-Slot Modular Aluminum Extrusion 2m",
      categoryId: catMetals.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 28.0,
      reorderPoint: 40,
      reorderQty: 120,
    },
  });

  const pCopper = await prisma.product.create({
    data: {
      sku: "COPPER-SHT-02",
      name: "Industrial Grade C11000 Copper Sheet 2mm",
      categoryId: catMetals.id,
      unitOfMeasure: "KG",
      costPerUnit: 32.0,
      reorderPoint: 60,
      reorderQty: 200,
    },
  });

  const pBolt = await prisma.product.create({
    data: {
      sku: "BOLT-HEX-M10",
      name: "Zinc-Plated Grade 8.8 Hex Bolts M10x50 (Box 200)",
      categoryId: catHardware.id,
      unitOfMeasure: "BOX",
      costPerUnit: 22.5,
      reorderPoint: 30,
      reorderQty: 100,
    },
  });

  const pBearing = await prisma.product.create({
    data: {
      sku: "BEAR-BALL-62",
      name: "Precision Deep Groove Ball Bearing 6205-2RS",
      categoryId: catHardware.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 8.75,
      reorderPoint: 50,
      reorderQty: 200,
    },
  });

  const pValve = await prisma.product.create({
    data: {
      sku: "VALVE-BALL-2IN",
      name: "Stainless Steel 316 2-Inch Full Port Ball Valve",
      categoryId: catHardware.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 64.0,
      reorderPoint: 15,
      reorderQty: 40,
    },
  });

  const pBox = await prisma.product.create({
    data: {
      sku: "BOX-CORR-L",
      name: "200lb Double-Wall Corrugated Shipping Box Large",
      categoryId: catPackaging.id,
      unitOfMeasure: "BUNDLE",
      costPerUnit: 38.0,
      reorderPoint: 40,
      reorderQty: 150,
    },
  });

  const pTape = await prisma.product.create({
    data: {
      sku: "TAPE-HVY-50",
      name: "Industrial Reinforced Filament Strapping Tape 50m",
      categoryId: catPackaging.id,
      unitOfMeasure: "ROLL",
      costPerUnit: 6.2,
      reorderPoint: 60,
      reorderQty: 240,
    },
  });

  const pFoam = await prisma.product.create({
    data: {
      sku: "FOAM-ESD-ROLL",
      name: "Anti-Static Conductive Foam Cushioning Roll 10m",
      categoryId: catPackaging.id,
      unitOfMeasure: "ROLL",
      costPerUnit: 45.0,
      reorderPoint: 10,
      reorderQty: 30,
    },
  });

  const pHelm = await prisma.product.create({
    data: {
      sku: "HELM-IND-PRO",
      name: "Kask Superplasma High-Impact Safety Helmet",
      categoryId: catSafety.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 75.0,
      reorderPoint: 20,
      reorderQty: 50,
    },
  });

  const pGlove = await prisma.product.create({
    data: {
      sku: "GLOV-KEVLAR-L",
      name: "Level 5 Cut-Resistant Nitrile Grip Gloves (Pack of 12)",
      categoryId: catSafety.id,
      unitOfMeasure: "PACK",
      costPerUnit: 24.0,
      reorderPoint: 25,
      reorderQty: 80,
    },
  });

  // Low Stock item (Total stock: 22, reorderPoint: 35)
  const pResp = await prisma.product.create({
    data: {
      sku: "RESP-N95-PRO",
      name: "3M Aura Industrial Particulate Respirator Box/20",
      categoryId: catSafety.id,
      unitOfMeasure: "BOX",
      costPerUnit: 19.5,
      reorderPoint: 35,
      reorderQty: 100,
    },
  });

  // Out of Stock item 1 (Total stock: 0)
  const pBattery = await prisma.product.create({
    data: {
      sku: "LITH-BAT-48V",
      name: "48V 100Ah LiFePO4 Forklift Battery Module",
      categoryId: catElectronics.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 1450.0,
      reorderPoint: 5,
      reorderQty: 10,
    },
  });

  // Out of Stock item 2 (Total stock: 0)
  const pMotor = await prisma.product.create({
    data: {
      sku: "MOTOR-STEP-24V",
      name: "NEMA 23 High-Torque Bipolar Stepper Motor 2.8A",
      categoryId: catHardware.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 48.0,
      reorderPoint: 12,
      reorderQty: 30,
    },
  });

  const pCabinet = await prisma.product.create({
    data: {
      sku: "DESK-CAB-03",
      name: "3-Drawer Under-Desk Steel Mobile Pedestal",
      categoryId: catFurniture.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 120.0,
      reorderPoint: 15,
      reorderQty: 30,
    },
  });

  const pArm = await prisma.product.create({
    data: {
      sku: "MON-ARM-DUAL",
      name: "Heavy-Duty Gas-Spring Dual Monitor Arm",
      categoryId: catFurniture.id,
      unitOfMeasure: "UNIT",
      costPerUnit: 68.0,
      reorderPoint: 20,
      reorderQty: 40,
    },
  });

  const pCable = await prisma.product.create({
    data: {
      sku: "CABLE-CAT6-305",
      name: "Cat6 UTP Solid Bulk Ethernet Cable 1000ft Reel",
      categoryId: catElectronics.id,
      unitOfMeasure: "REEL",
      costPerUnit: 85.0,
      reorderPoint: 15,
      reorderQty: 50,
    },
  });

  console.log("✅ 24 Products seeded (19 Healthy, 3 Low Stock, 2 Out of Stock)");

  // ─── 7. CONTACTS ────────────────────────────────────────────────────────────
  console.log("👥 Seeding Vendors & Corporate Customers...");
  const cntApex = await prisma.contact.create({
    data: {
      name: "Apex Industrial Components",
      contactType: ContactType.VENDOR,
      email: "orders@apexcomponents.com",
      phone: "+1-312-555-0144",
      address: "400 Steelway Blvd, Gary, IN 46402",
    },
  });

  const cntMicro = await prisma.contact.create({
    data: {
      name: "Shenzhen MicroTech Semiconductor",
      contactType: ContactType.VENDOR,
      email: "supply@microtech-sz.com",
      phone: "+86-755-8832-1100",
      address: "Tower B, High-Tech Park, Nanshan, Shenzhen, China",
    },
  });

  const cntGlobal = await prisma.contact.create({
    data: {
      name: "Global Metal & Alloys Ltd",
      contactType: ContactType.VENDOR,
      email: "orders@globalmetal.com",
      phone: "+1-216-555-0182",
      address: "1050 Foundry Rd, Cleveland, OH 44113",
    },
  });

  const cntEcopack = await prisma.contact.create({
    data: {
      name: "EcoPack Sustainable Logistics",
      contactType: ContactType.VENDOR,
      email: "sales@ecopacksolutions.com",
      phone: "+1-732-555-0199",
      address: "50 Logistics Blvd, Edison, NJ 08817",
    },
  });

  const cntErgo = await prisma.contact.create({
    data: {
      name: "Precision Ergonomics Corp",
      contactType: ContactType.VENDOR,
      email: "wholesale@precisionergo.com",
      phone: "+1-616-555-0120",
      address: "800 Innovation Dr, Grand Rapids, MI 49512",
    },
  });

  const cntStarlight = await prisma.contact.create({
    data: {
      name: "Starlight Robotics Corp",
      contactType: ContactType.CUSTOMER,
      email: "procurement@starlightrobotics.com",
      phone: "+1-415-555-0177",
      address: "300 Mission St, Suite 1800, San Francisco, CA 94105",
    },
  });

  const cntOmni = await prisma.contact.create({
    data: {
      name: "OmniRetail Logistics Inc",
      contactType: ContactType.CUSTOMER,
      email: "vendorops@omniretail.com",
      phone: "+1-206-555-0163",
      address: "1000 2nd Ave, Seattle, WA 98104",
    },
  });

  const cntHorizon = await prisma.contact.create({
    data: {
      name: "Horizon Cloud Infrastructure",
      contactType: ContactType.CUSTOMER,
      email: "data-supply@horizoncloud.net",
      phone: "+1-703-555-0112",
      address: "12000 Dulles Corner, Herndon, VA 20171",
    },
  });

  const cntVanguard = await prisma.contact.create({
    data: {
      name: "Vanguard Aerospace Technologies",
      contactType: ContactType.CUSTOMER,
      email: "parts@vanguardaero.com",
      phone: "+1-316-555-0191",
      address: "500 Aero Parkway, Wichita, KS 67209",
    },
  });

  const cntNexus = await prisma.contact.create({
    data: {
      name: "Nexus Smart Workspaces",
      contactType: ContactType.CUSTOMER,
      email: "fulfillment@nexussmart.com",
      phone: "+1-212-555-0138",
      address: "450 Lexington Ave, New York, NY 10017",
    },
  });

  const cntAzure = await prisma.contact.create({
    data: {
      name: "Azure Interior Design & Architecture",
      contactType: ContactType.BOTH,
      email: "contact@azureinterior.com",
      phone: "+1-312-555-0101",
      address: "456 Design Hub, Creative District, Chicago, IL 60611",
    },
  });

  // ─── 8. STOCK BALANCES INITIAL SETUP (Double-entry consistent) ───────────────
  console.log("📊 Setting up initial baseline stock quantities...");
  const initialStockDefinitions: {
    productId: string;
    locationId: string;
    qty: number;
  }[] = [
    // WH Main Storage
    { productId: pDesk.id, locationId: locWhStock1.id, qty: 35 },
    { productId: pDesk.id, locationId: locWhStock2.id, qty: 20 },
    { productId: pChair.id, locationId: locWhStock1.id, qty: 42 },
    { productId: pMon.id, locationId: locWhStock1.id, qty: 28 },
    { productId: pAud.id, locationId: locWhStock1.id, qty: 45 },
    { productId: pSens.id, locationId: locWhCold.id, qty: 18 }, // Low stock (18 <= 25)
    { productId: pScanner.id, locationId: locWhStock1.id, qty: 14 },
    { productId: pScale.id, locationId: locWhStock2.id, qty: 3 }, // Low stock (3 <= 4)
    { productId: pSteel.id, locationId: locWhStock2.id, qty: 650 },
    { productId: pAlum.id, locationId: locWhStock2.id, qty: 110 },
    { productId: pAlum.id, locationId: locWhProd.id, qty: 30 },
    { productId: pCopper.id, locationId: locWhStock2.id, qty: 240 },
    { productId: pBolt.id, locationId: locWhStock1.id, qty: 85 },
    { productId: pBolt.id, locationId: locWhProd.id, qty: 20 },
    { productId: pBearing.id, locationId: locWhStock1.id, qty: 160 },
    { productId: pValve.id, locationId: locWhStock1.id, qty: 32 },
    { productId: pBox.id, locationId: locWhStock1.id, qty: 90 },
    { productId: pTape.id, locationId: locWhStock1.id, qty: 140 },
    { productId: pFoam.id, locationId: locWhStock1.id, qty: 25 },
    { productId: pHelm.id, locationId: locWhStock1.id, qty: 30 },
    { productId: pGlove.id, locationId: locWhStock1.id, qty: 65 },
    { productId: pResp.id, locationId: locWhStock1.id, qty: 22 }, // Low stock (22 <= 35)
    { productId: pCabinet.id, locationId: locWhStock1.id, qty: 28 },
    { productId: pArm.id, locationId: locWhStock1.id, qty: 34 },
    { productId: pCable.id, locationId: locWhStock1.id, qty: 36 },

    // ECOM Fulfillment Storage
    { productId: pMon.id, locationId: locEcomStock.id, qty: 22 },
    { productId: pAud.id, locationId: locEcomStock.id, qty: 30 },
    { productId: pBox.id, locationId: locEcomStock.id, qty: 110 },
    { productId: pTape.id, locationId: locEcomPack.id, qty: 50 },
    { productId: pFoam.id, locationId: locEcomStock.id, qty: 15 },
    { productId: pCable.id, locationId: locEcomStock.id, qty: 14 },

    // WEST Regional Storage
    { productId: pDesk.id, locationId: locWestStock.id, qty: 15 },
    { productId: pChair.id, locationId: locWestStock.id, qty: 18 },
    { productId: pScanner.id, locationId: locWestStock.id, qty: 8 },
    { productId: pGlove.id, locationId: locWestStock.id, qty: 25 },
    { productId: pArm.id, locationId: locWestStock.id, qty: 16 },
  ];

  for (const item of initialStockDefinitions) {
    await prisma.stockQuantity.create({
      data: {
        productId: item.productId,
        locationId: item.locationId,
        onHandQty: item.qty,
        reservedQty: 0,
      },
    });
  }

  // ─── 9. OPERATIONS & STOCK MOVES ────────────────────────────────────────────
  console.log("⚡ Seeding 26 Dynamic Operations across WH, ECOM, WEST...");

  const now = new Date();
  const past7d = new Date(now.getTime() - 7 * 86400000);
  const past5d = new Date(now.getTime() - 5 * 86400000);
  const past4d = new Date(now.getTime() - 4 * 86400000);
  const past3d = new Date(now.getTime() - 3 * 86400000);
  const past2d = new Date(now.getTime() - 2 * 86400000);
  const past1d = new Date(now.getTime() - 1 * 86400000); // Yesterday (Late indicator for pending)
  const future1d = new Date(now.getTime() + 1 * 86400000);
  const future2d = new Date(now.getTime() + 2 * 86400000);
  const future3d = new Date(now.getTime() + 3 * 86400000);
  const future5d = new Date(now.getTime() + 5 * 86400000);

  // ── OPERATIONS GROUP A: RECEIPTS (WH/IN, ECOM/IN, WEST/IN)
  // Op 1: WH/IN/0001 (DONE)
  const opIn1 = await prisma.operation.create({
    data: {
      reference: "WH/IN/0001",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWhStock1.id,
      contactId: cntAzure.id,
      responsibleUserId: manager.id,
      scheduledDate: past7d,
      doneAt: past7d,
      status: OperationStatus.DONE,
      notes: "PO-2026-089: Ergonomic workstations initial delivery.",
      lines: {
        create: [
          { productId: pDesk.id, demandQty: 25, doneQty: 25 },
          { productId: pChair.id, demandQty: 30, doneQty: 30 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: opIn1.id,
        productId: pDesk.id,
        fromLocationId: locVendor.id,
        toLocationId: locWhStock1.id,
        quantity: 25,
        movedAt: past7d,
        createdById: manager.id,
      },
      {
        operationId: opIn1.id,
        productId: pChair.id,
        fromLocationId: locVendor.id,
        toLocationId: locWhStock1.id,
        quantity: 30,
        movedAt: past7d,
        createdById: manager.id,
      },
    ],
  });

  // Op 2: WH/IN/0002 (DONE)
  const opIn2 = await prisma.operation.create({
    data: {
      reference: "WH/IN/0002",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWhStock1.id,
      contactId: cntMicro.id,
      responsibleUserId: admin.id,
      scheduledDate: past4d,
      doneAt: past4d,
      status: OperationStatus.DONE,
      notes: "Customs cleared air-freight batch: Displays & ANC Headsets.",
      lines: {
        create: [
          { productId: pMon.id, demandQty: 28, doneQty: 28 },
          { productId: pAud.id, demandQty: 45, doneQty: 45 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: opIn2.id,
        productId: pMon.id,
        fromLocationId: locVendor.id,
        toLocationId: locWhStock1.id,
        quantity: 28,
        movedAt: past4d,
        createdById: admin.id,
      },
      {
        operationId: opIn2.id,
        productId: pAud.id,
        fromLocationId: locVendor.id,
        toLocationId: locWhStock1.id,
        quantity: 45,
        movedAt: past4d,
        createdById: admin.id,
      },
    ],
  });

  // Op 3: WH/IN/0003 (DONE)
  const opIn3 = await prisma.operation.create({
    data: {
      reference: "WH/IN/0003",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWhStock1.id,
      contactId: cntApex.id,
      responsibleUserId: staff.id,
      scheduledDate: past2d,
      doneAt: past2d,
      status: OperationStatus.DONE,
      notes: "Hardware batch replenishment (M10 Bolts & High-Precision Bearings).",
      lines: {
        create: [
          { productId: pBolt.id, demandQty: 85, doneQty: 85 },
          { productId: pBearing.id, demandQty: 160, doneQty: 160 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: opIn3.id,
        productId: pBolt.id,
        fromLocationId: locVendor.id,
        toLocationId: locWhStock1.id,
        quantity: 85,
        movedAt: past2d,
        createdById: staff.id,
      },
      {
        operationId: opIn3.id,
        productId: pBearing.id,
        fromLocationId: locVendor.id,
        toLocationId: locWhStock1.id,
        quantity: 160,
        movedAt: past2d,
        createdById: staff.id,
      },
    ],
  });

  // Op 4: WH/IN/0004 (READY - LATE: scheduled 2 days ago)
  await prisma.operation.create({
    data: {
      reference: "WH/IN/0004",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWhStock2.id,
      contactId: cntGlobal.id,
      responsibleUserId: manager.id,
      scheduledDate: past2d,
      status: OperationStatus.READY,
      notes: "Heavy raw metals shipment pending dock inspection.",
      lines: {
        create: [
          { productId: pSteel.id, demandQty: 200 },
          { productId: pCopper.id, demandQty: 80 },
        ],
      },
    },
  });

  // Op 5: WH/IN/0005 (READY - Scheduled Today)
  await prisma.operation.create({
    data: {
      reference: "WH/IN/0005",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWhStock1.id,
      contactId: cntEcopack.id,
      responsibleUserId: staff.id,
      scheduledDate: now,
      status: OperationStatus.READY,
      notes: "Corrugated cartons and strapping tape delivery on arrival.",
      lines: {
        create: [
          { productId: pBox.id, demandQty: 90 },
          { productId: pTape.id, demandQty: 140 },
        ],
      },
    },
  });

  // Op 6: WH/IN/0006 (WAITING - Tomorrow)
  await prisma.operation.create({
    data: {
      reference: "WH/IN/0006",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWhStock1.id,
      contactId: cntErgo.id,
      responsibleUserId: demoWorker.id,
      scheduledDate: future1d,
      status: OperationStatus.WAITING,
      notes: "Awaiting tracking confirmation from freight carrier.",
      lines: {
        create: [
          { productId: pCabinet.id, demandQty: 28 },
          { productId: pArm.id, demandQty: 34 },
        ],
      },
    },
  });

  // Op 7: WH/IN/0007 (DRAFT - Next Week)
  await prisma.operation.create({
    data: {
      reference: "WH/IN/0007",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWhCold.id,
      contactId: cntMicro.id,
      responsibleUserId: demoAdmin.id,
      scheduledDate: future3d,
      status: OperationStatus.DRAFT,
      notes: "Draft replenishment request for IoT sensors under quote approval.",
      lines: {
        create: [{ productId: pSens.id, demandQty: 100 }],
      },
    },
  });

  // Op 8: ECOM/IN/0001 (DONE)
  const opEcomIn1 = await prisma.operation.create({
    data: {
      reference: "ECOM/IN/0001",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locEcomStock.id,
      contactId: cntEcopack.id,
      responsibleUserId: manager.id,
      scheduledDate: past3d,
      doneAt: past3d,
      status: OperationStatus.DONE,
      notes: "Direct fulfillment facility packaging intake.",
      lines: {
        create: [
          { productId: pBox.id, demandQty: 110, doneQty: 110 },
          { productId: pFoam.id, demandQty: 15, doneQty: 15 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: opEcomIn1.id,
        productId: pBox.id,
        fromLocationId: locVendor.id,
        toLocationId: locEcomStock.id,
        quantity: 110,
        movedAt: past3d,
        createdById: manager.id,
      },
      {
        operationId: opEcomIn1.id,
        productId: pFoam.id,
        fromLocationId: locVendor.id,
        toLocationId: locEcomStock.id,
        quantity: 15,
        movedAt: past3d,
        createdById: manager.id,
      },
    ],
  });

  // Op 9: ECOM/IN/0002 (READY - Today)
  await prisma.operation.create({
    data: {
      reference: "ECOM/IN/0002",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locEcomStock.id,
      contactId: cntMicro.id,
      responsibleUserId: demoWorker.id,
      scheduledDate: now,
      status: OperationStatus.READY,
      notes: "ECOM East Coast inventory replenishment for headsets.",
      lines: {
        create: [{ productId: pAud.id, demandQty: 30 }],
      },
    },
  });

  // Op 10: WEST/IN/0001 (DONE)
  const opWestIn1 = await prisma.operation.create({
    data: {
      reference: "WEST/IN/0001",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWestStock.id,
      contactId: cntErgo.id,
      responsibleUserId: admin.id,
      scheduledDate: past5d,
      doneAt: past5d,
      status: OperationStatus.DONE,
      notes: "West regional initial branch receipt.",
      lines: {
        create: [{ productId: pChair.id, demandQty: 18, doneQty: 18 }],
      },
    },
  });

  await prisma.stockMove.create({
    data: {
      operationId: opWestIn1.id,
      productId: pChair.id,
      fromLocationId: locVendor.id,
      toLocationId: locWestStock.id,
      quantity: 18,
      movedAt: past5d,
      createdById: admin.id,
    },
  });

  // Op 11: WEST/IN/0002 (READY - Tomorrow)
  await prisma.operation.create({
    data: {
      reference: "WEST/IN/0002",
      operationType: OperationType.RECEIPT,
      sourceLocationId: locVendor.id,
      destinationLocationId: locWestStock.id,
      contactId: cntErgo.id,
      responsibleUserId: manager.id,
      scheduledDate: future1d,
      status: OperationStatus.READY,
      notes: "Scheduled regional replenishment for standing desks.",
      lines: {
        create: [{ productId: pDesk.id, demandQty: 15 }],
      },
    },
  });

  // ── OPERATIONS GROUP B: DELIVERIES (WH/OUT, ECOM/OUT, WEST/OUT)
  // Op 12: WH/OUT/0001 (DONE)
  const opOut1 = await prisma.operation.create({
    data: {
      reference: "WH/OUT/0001",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locWhStock1.id,
      destinationLocationId: locCustomer.id,
      contactId: cntStarlight.id,
      responsibleUserId: manager.id,
      scheduledDate: past3d,
      doneAt: past3d,
      status: OperationStatus.DONE,
      notes: "Enterprise equipment package dispatched via FedEx Freight.",
      lines: {
        create: [
          { productId: pMon.id, demandQty: 8, doneQty: 8 },
          { productId: pAud.id, demandQty: 12, doneQty: 12 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: opOut1.id,
        productId: pMon.id,
        fromLocationId: locWhStock1.id,
        toLocationId: locCustomer.id,
        quantity: 8,
        movedAt: past3d,
        createdById: manager.id,
      },
      {
        operationId: opOut1.id,
        productId: pAud.id,
        fromLocationId: locWhStock1.id,
        toLocationId: locCustomer.id,
        quantity: 12,
        movedAt: past3d,
        createdById: manager.id,
      },
    ],
  });

  // Op 13: WH/OUT/0002 (DONE)
  const opOut2 = await prisma.operation.create({
    data: {
      reference: "WH/OUT/0002",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locWhStock1.id,
      destinationLocationId: locCustomer.id,
      contactId: cntNexus.id,
      responsibleUserId: staff.id,
      scheduledDate: past1d,
      doneAt: past1d,
      status: OperationStatus.DONE,
      notes: "New office fit-out order: Desks & Chairs delivered.",
      lines: {
        create: [
          { productId: pDesk.id, demandQty: 6, doneQty: 6 },
          { productId: pChair.id, demandQty: 10, doneQty: 10 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: opOut2.id,
        productId: pDesk.id,
        fromLocationId: locWhStock1.id,
        toLocationId: locCustomer.id,
        quantity: 6,
        movedAt: past1d,
        createdById: staff.id,
      },
      {
        operationId: opOut2.id,
        productId: pChair.id,
        fromLocationId: locWhStock1.id,
        toLocationId: locCustomer.id,
        quantity: 10,
        movedAt: past1d,
        createdById: staff.id,
      },
    ],
  });

  // Op 14: WH/OUT/0003 (READY - LATE: scheduled 2 days ago)
  await prisma.operation.create({
    data: {
      reference: "WH/OUT/0003",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locWhStock1.id,
      destinationLocationId: locCustomer.id,
      contactId: cntVanguard.id,
      responsibleUserId: manager.id,
      scheduledDate: past2d,
      status: OperationStatus.READY,
      notes: "Priority aerospace parts delivery waiting for carrier pickup.",
      lines: {
        create: [
          { productId: pBearing.id, demandQty: 40 },
          { productId: pValve.id, demandQty: 6 },
        ],
      },
    },
  });

  // Op 15: WH/OUT/0004 (READY - Scheduled Today)
  await prisma.operation.create({
    data: {
      reference: "WH/OUT/0004",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locWhStock1.id,
      destinationLocationId: locCustomer.id,
      contactId: cntHorizon.id,
      responsibleUserId: staff.id,
      scheduledDate: now,
      status: OperationStatus.READY,
      notes: "Data center cabling order staged at Outbound Bay 2.",
      lines: {
        create: [{ productId: pCable.id, demandQty: 10 }],
      },
    },
  });

  // Op 16: WH/OUT/0005 (WAITING - Out of stock backorder)
  await prisma.operation.create({
    data: {
      reference: "WH/OUT/0005",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locWhStock1.id,
      destinationLocationId: locCustomer.id,
      contactId: cntOmni.id,
      responsibleUserId: demoWorker.id,
      scheduledDate: future1d,
      status: OperationStatus.WAITING,
      notes: "BACKORDER: Awaiting battery module & stepper motor replenishment.",
      lines: {
        create: [
          { productId: pBattery.id, demandQty: 2 },
          { productId: pMotor.id, demandQty: 5 },
        ],
      },
    },
  });

  // Op 17: WH/OUT/0006 (DRAFT)
  await prisma.operation.create({
    data: {
      reference: "WH/OUT/0006",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locWhStock1.id,
      destinationLocationId: locCustomer.id,
      contactId: cntAzure.id,
      responsibleUserId: demoAdmin.id,
      scheduledDate: future3d,
      status: OperationStatus.DRAFT,
      notes: "Draft client delivery quote for showroom demo units.",
      lines: {
        create: [
          { productId: pDesk.id, demandQty: 4 },
          { productId: pArm.id, demandQty: 4 },
        ],
      },
    },
  });

  // Op 18: ECOM/OUT/0001 (DONE)
  const opEcomOut1 = await prisma.operation.create({
    data: {
      reference: "ECOM/OUT/0001",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locEcomStock.id,
      destinationLocationId: locCustomer.id,
      contactId: cntOmni.id,
      responsibleUserId: manager.id,
      scheduledDate: past2d,
      doneAt: past2d,
      status: OperationStatus.DONE,
      notes: "East Coast customer fulfillment: Corrugated cartons dispatched.",
      lines: {
        create: [{ productId: pBox.id, demandQty: 20, doneQty: 20 }],
      },
    },
  });

  await prisma.stockMove.create({
    data: {
      operationId: opEcomOut1.id,
      productId: pBox.id,
      fromLocationId: locEcomStock.id,
      toLocationId: locCustomer.id,
      quantity: 20,
      movedAt: past2d,
      createdById: manager.id,
    },
  });

  // Op 19: ECOM/OUT/0002 (READY - Scheduled Today)
  await prisma.operation.create({
    data: {
      reference: "ECOM/OUT/0002",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locEcomStock.id,
      destinationLocationId: locCustomer.id,
      contactId: cntStarlight.id,
      responsibleUserId: demoWorker.id,
      scheduledDate: now,
      status: OperationStatus.READY,
      notes: "Priority 4K monitors order for NYC laboratory.",
      lines: {
        create: [{ productId: pMon.id, demandQty: 6 }],
      },
    },
  });

  // Op 20: WEST/OUT/0001 (READY - Scheduled Today)
  await prisma.operation.create({
    data: {
      reference: "WEST/OUT/0001",
      operationType: OperationType.DELIVERY,
      sourceLocationId: locWestStock.id,
      destinationLocationId: locCustomer.id,
      contactId: cntStarlight.id,
      responsibleUserId: staff.id,
      scheduledDate: now,
      status: OperationStatus.READY,
      notes: "Barcode scanners delivery for Reno distribution center.",
      lines: {
        create: [{ productId: pScanner.id, demandQty: 4 }],
      },
    },
  });

  // ── OPERATIONS GROUP C: INTERNAL TRANSFERS (WH/INT, ECOM/INT, WEST/INT)
  // Op 21: WH/INT/0001 (DONE)
  const opInt1 = await prisma.operation.create({
    data: {
      reference: "WH/INT/0001",
      operationType: OperationType.INTERNAL_TRANSFER,
      sourceLocationId: locWhStock2.id,
      destinationLocationId: locWhStock1.id,
      responsibleUserId: manager.id,
      scheduledDate: past3d,
      doneAt: past3d,
      status: OperationStatus.DONE,
      notes: "Internal replenishment: Transferred 10 desks from Pallet Bay B to Active Bay A.",
      lines: {
        create: [{ productId: pDesk.id, demandQty: 10, doneQty: 10 }],
      },
    },
  });

  await prisma.stockMove.create({
    data: {
      operationId: opInt1.id,
      productId: pDesk.id,
      fromLocationId: locWhStock2.id,
      toLocationId: locWhStock1.id,
      quantity: 10,
      movedAt: past3d,
      createdById: manager.id,
    },
  });

  // Op 22: WH/INT/0002 (DONE)
  const opInt2 = await prisma.operation.create({
    data: {
      reference: "WH/INT/0002",
      operationType: OperationType.INTERNAL_TRANSFER,
      sourceLocationId: locWhStock2.id,
      destinationLocationId: locWhProd.id,
      responsibleUserId: staff.id,
      scheduledDate: past2d,
      doneAt: past2d,
      status: OperationStatus.DONE,
      notes: "Material transfer to production rack for workstation assembly.",
      lines: {
        create: [
          { productId: pAlum.id, demandQty: 20, doneQty: 20 },
          { productId: pBolt.id, demandQty: 15, doneQty: 15 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: opInt2.id,
        productId: pAlum.id,
        fromLocationId: locWhStock2.id,
        toLocationId: locWhProd.id,
        quantity: 20,
        movedAt: past2d,
        createdById: staff.id,
      },
      {
        operationId: opInt2.id,
        productId: pBolt.id,
        fromLocationId: locWhStock2.id,
        toLocationId: locWhProd.id,
        quantity: 15,
        movedAt: past2d,
        createdById: staff.id,
      },
    ],
  });

  // Op 23: WH/INT/0003 (READY - Scheduled Today)
  await prisma.operation.create({
    data: {
      reference: "WH/INT/0003",
      operationType: OperationType.INTERNAL_TRANSFER,
      sourceLocationId: locWhStock2.id,
      destinationLocationId: locWhStock1.id,
      responsibleUserId: staff.id,
      scheduledDate: now,
      status: OperationStatus.READY,
      notes: "Scheduled bin replenishment: 8 Ergonomic Chairs to front pick zone.",
      lines: {
        create: [{ productId: pChair.id, demandQty: 8 }],
      },
    },
  });

  // Op 24: WH/INT/0004 (WAITING - Scheduled Tomorrow)
  await prisma.operation.create({
    data: {
      reference: "WH/INT/0004",
      operationType: OperationType.INTERNAL_TRANSFER,
      sourceLocationId: locWhCold.id,
      destinationLocationId: locWhProd.id,
      responsibleUserId: demoWorker.id,
      scheduledDate: future1d,
      status: OperationStatus.WAITING,
      notes: "Cold vault staging for cleanroom sensor assembly batch.",
      lines: {
        create: [{ productId: pSens.id, demandQty: 10 }],
      },
    },
  });

  // Op 25: ECOM/INT/0001 (DONE)
  const opEcomInt1 = await prisma.operation.create({
    data: {
      reference: "ECOM/INT/0001",
      operationType: OperationType.INTERNAL_TRANSFER,
      sourceLocationId: locEcomStock.id,
      destinationLocationId: locEcomPack.id,
      responsibleUserId: manager.id,
      scheduledDate: past1d,
      doneAt: past1d,
      status: OperationStatus.DONE,
      notes: "Internal packing supply transfer: 20 rolls of filament strapping tape.",
      lines: {
        create: [{ productId: pTape.id, demandQty: 20, doneQty: 20 }],
      },
    },
  });

  await prisma.stockMove.create({
    data: {
      operationId: opEcomInt1.id,
      productId: pTape.id,
      fromLocationId: locEcomStock.id,
      toLocationId: locEcomPack.id,
      quantity: 20,
      movedAt: past1d,
      createdById: manager.id,
    },
  });

  // Op 26: WEST/INT/0001 (READY - Scheduled Today)
  await prisma.operation.create({
    data: {
      reference: "WEST/INT/0001",
      operationType: OperationType.INTERNAL_TRANSFER,
      sourceLocationId: locWestBulk.id,
      destinationLocationId: locWestStock.id,
      responsibleUserId: admin.id,
      scheduledDate: now,
      status: OperationStatus.READY,
      notes: "Pallet breakdown and move to regional picking racks.",
      lines: {
        create: [{ productId: pScanner.id, demandQty: 4 }],
      },
    },
  });

  // ── OPERATIONS GROUP D: ADJUSTMENTS (WH/ADJ)
  // Op 27: WH/ADJ/0001 (DONE)
  const opAdj1 = await prisma.operation.create({
    data: {
      reference: "WH/ADJ/0001",
      operationType: OperationType.ADJUSTMENT,
      sourceLocationId: locWhStock1.id,
      destinationLocationId: locLoss.id,
      responsibleUserId: manager.id,
      scheduledDate: past2d,
      doneAt: past2d,
      status: OperationStatus.DONE,
      notes: "QA Cycle Count variance: 2 safety helmets written off due to cracked buckles during transit.",
      lines: {
        create: [{ productId: pHelm.id, demandQty: 2, doneQty: 2 }],
      },
    },
  });

  await prisma.stockMove.create({
    data: {
      operationId: opAdj1.id,
      productId: pHelm.id,
      fromLocationId: locWhStock1.id,
      toLocationId: locLoss.id,
      quantity: 2,
      movedAt: past2d,
      createdById: manager.id,
    },
  });

  // Op 28: WH/ADJ/0002 (DRAFT)
  await prisma.operation.create({
    data: {
      reference: "WH/ADJ/0002",
      operationType: OperationType.ADJUSTMENT,
      sourceLocationId: locWhStock2.id,
      destinationLocationId: locLoss.id,
      responsibleUserId: demoAdmin.id,
      scheduledDate: future2d,
      status: OperationStatus.DRAFT,
      notes: "Proposed monthly cycle audit adjustment for steel rods cutting scrap.",
      lines: {
        create: [{ productId: pSteel.id, demandQty: 5 }],
      },
    },
  });

  console.log("✅ 28 Operations seeded across all 4 types and all statuses.");

  // ─── 10. HISTORICAL LEDGER MOVES (Populating /move-history lively) ───────────
  console.log("📜 Seeding comprehensive audit move history ledger...");
  const historicalMovesData = [
    {
      operationId: opIn1.id,
      productId: pGlove.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock1.id,
      quantity: 65,
      movedAt: past7d,
      createdById: staff.id,
    },
    {
      operationId: opIn1.id,
      productId: pResp.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock1.id,
      quantity: 22,
      movedAt: past7d,
      createdById: staff.id,
    },
    {
      operationId: opIn2.id,
      productId: pCable.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock1.id,
      quantity: 46,
      movedAt: past5d,
      createdById: admin.id,
    },
    {
      operationId: opIn2.id,
      productId: pScanner.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock1.id,
      quantity: 14,
      movedAt: past5d,
      createdById: admin.id,
    },
    {
      operationId: opIn3.id,
      productId: pValve.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock1.id,
      quantity: 32,
      movedAt: past4d,
      createdById: manager.id,
    },
    {
      operationId: opIn3.id,
      productId: pScale.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock2.id,
      quantity: 3,
      movedAt: past4d,
      createdById: manager.id,
    },
    {
      operationId: opIn3.id,
      productId: pSteel.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock2.id,
      quantity: 650,
      movedAt: past4d,
      createdById: manager.id,
    },
    {
      operationId: opIn3.id,
      productId: pCopper.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhStock2.id,
      quantity: 240,
      movedAt: past3d,
      createdById: staff.id,
    },
    {
      operationId: opIn1.id,
      productId: pSens.id,
      fromLocationId: locVendor.id,
      toLocationId: locWhCold.id,
      quantity: 18,
      movedAt: past3d,
      createdById: demoAdmin.id,
    },
    {
      operationId: opWestIn1.id,
      productId: pDesk.id,
      fromLocationId: locVendor.id,
      toLocationId: locWestStock.id,
      quantity: 15,
      movedAt: past5d,
      createdById: demoWorker.id,
    },
    {
      operationId: opWestIn1.id,
      productId: pScanner.id,
      fromLocationId: locVendor.id,
      toLocationId: locWestStock.id,
      quantity: 8,
      movedAt: past5d,
      createdById: demoWorker.id,
    },
    {
      operationId: opWestIn1.id,
      productId: pGlove.id,
      fromLocationId: locVendor.id,
      toLocationId: locWestStock.id,
      quantity: 25,
      movedAt: past5d,
      createdById: demoWorker.id,
    },
    {
      operationId: opWestIn1.id,
      productId: pArm.id,
      fromLocationId: locVendor.id,
      toLocationId: locWestStock.id,
      quantity: 16,
      movedAt: past5d,
      createdById: demoWorker.id,
    },
  ];

  for (const move of historicalMovesData) {
    await prisma.stockMove.create({ data: move });
  }

  // ─── 11. REFERENCE SEQUENCES ────────────────────────────────────────────────
  console.log("🔢 Seeding Reference Sequences for auto-incrementing operations...");
  const sequenceConfigs = [
    { warehouseId: whMain.id, operationType: OperationType.RECEIPT, lastNumber: 7 },
    { warehouseId: whMain.id, operationType: OperationType.DELIVERY, lastNumber: 6 },
    { warehouseId: whMain.id, operationType: OperationType.INTERNAL_TRANSFER, lastNumber: 4 },
    { warehouseId: whMain.id, operationType: OperationType.ADJUSTMENT, lastNumber: 2 },

    { warehouseId: whEcom.id, operationType: OperationType.RECEIPT, lastNumber: 2 },
    { warehouseId: whEcom.id, operationType: OperationType.DELIVERY, lastNumber: 2 },
    { warehouseId: whEcom.id, operationType: OperationType.INTERNAL_TRANSFER, lastNumber: 1 },
    { warehouseId: whEcom.id, operationType: OperationType.ADJUSTMENT, lastNumber: 0 },

    { warehouseId: whWest.id, operationType: OperationType.RECEIPT, lastNumber: 2 },
    { warehouseId: whWest.id, operationType: OperationType.DELIVERY, lastNumber: 1 },
    { warehouseId: whWest.id, operationType: OperationType.INTERNAL_TRANSFER, lastNumber: 1 },
    { warehouseId: whWest.id, operationType: OperationType.ADJUSTMENT, lastNumber: 0 },
  ];

  for (const seq of sequenceConfigs) {
    await prisma.referenceSequence.create({ data: seq });
  }

  // ─── 12. ENTERPRISE SYSTEM NOTIFICATIONS ────────────────────────────────────
  console.log("🔔 Seeding Global System Notifications...");
  await prisma.notification.createMany({
    data: [
      {
        type: NotificationType.LOW_STOCK,
        title: "Low Stock Alert: [SENS-IOT-01]",
        message: "SenseTrack IoT Cold-Chain Temperature Sensor has dropped to 18 units at WH Cold Vault. Reorder threshold is 25.",
        referenceProductId: pSens.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 3600000),
      },
      {
        type: NotificationType.LOW_STOCK,
        title: "Low Stock Alert: [FORK-SCALE-01]",
        message: "Heavy-Duty Digital Pallet Scale 2000kg is down to 3 units at WH High-Bay Pallets B. Reorder threshold is 4.",
        referenceProductId: pScale.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 5 * 3600000),
      },
      {
        type: NotificationType.OUT_OF_STOCK,
        title: "Critical Stockout: [LITH-BAT-48V]",
        message: "48V 100Ah LiFePO4 Forklift Battery Module is completely out of stock across all active facilities. 1 delivery backorder pending.",
        referenceProductId: pBattery.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 8 * 3600000),
      },
      {
        type: NotificationType.OUT_OF_STOCK,
        title: "Critical Stockout: [MOTOR-STEP-24V]",
        message: "NEMA 23 High-Torque Bipolar Stepper Motor 2.8A is depleted across all warehouses. Reorder quantity is 30.",
        referenceProductId: pMotor.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 12 * 3600000),
      },
      {
        type: NotificationType.OPERATION_LATE,
        title: "Overdue Inbound: Receipt WH/IN/0004",
        message: "Receipt WH/IN/0004 from Global Metal & Alloys Ltd was scheduled for yesterday and is overdue for dock inspection.",
        isRead: false,
        createdAt: new Date(now.getTime() - 14 * 3600000),
      },
      {
        type: NotificationType.OPERATION_READY,
        title: "Operation Validated: Receipt WH/IN/0003",
        message: "Inbound shipment WH/IN/0003 from Apex Industrial Components was successfully inspected and transferred to Main Storage Bay A.",
        referenceOperationId: opIn3.id,
        isRead: true,
        createdAt: new Date(now.getTime() - 24 * 3600000),
      },
    ],
  });

  console.log("\n🎉 Full Enterprise Seed Complete!");
  console.log("─────────────────────────────────────────────────────────────────");
  console.log("Global Shared Data summary:");
  console.log("  • Warehouses: 3 (WH, ECOM, WEST)");
  console.log("  • Locations:  13 (3 Virtual, 10 Physical bays/racks)");
  console.log("  • Categories: 7");
  console.log("  • Products:   24 (19 In Stock, 3 Low Stock, 2 Out of Stock)");
  console.log("  • Contacts:   11 (Vendors, Customers, Both)");
  console.log("  • Operations: 28 (Receipts, Deliveries, Transfers, Adjustments)");
  console.log("  • Moves:      30+ Immutable ledger entries in /move-history");
  console.log("  • Sequences:  Synchronized across all operation types");
  console.log("  • Alerts:     Real-time Low Stock, Out of Stock, Overdue");
  console.log("─────────────────────────────────────────────────────────────────");
  console.log("Accounts (All share this same global database state):");
  console.log("  • Admin:    loginId=demoadmin   password=admin123");
  console.log("  • Staff:    loginId=demoworker  password=worker123");
  console.log("  • Admin:    loginId=admin01     password=Admin@1234");
  console.log("  • Manager:  loginId=mgr001      password=Manager@1234");
  console.log("  • Staff:    loginId=staff01     password=Staff@1234");
  console.log("─────────────────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
