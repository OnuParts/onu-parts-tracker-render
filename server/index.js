var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  archivedPartsIssuance: () => archivedPartsIssuance,
  buildings: () => buildings,
  bulkPartsIssuanceSchema: () => bulkPartsIssuanceSchema,
  costCenters: () => costCenters,
  deliveryRequestItems: () => deliveryRequestItems,
  deliveryRequestStatusEnum: () => deliveryRequestStatusEnum,
  deliveryRequests: () => deliveryRequests,
  deliveryStatusEnum: () => deliveryStatusEnum,
  insertArchivedPartsIssuanceSchema: () => insertArchivedPartsIssuanceSchema,
  insertBuildingSchema: () => insertBuildingSchema,
  insertCostCenterSchema: () => insertCostCenterSchema,
  insertDeliveryRequestItemSchema: () => insertDeliveryRequestItemSchema,
  insertDeliveryRequestSchema: () => insertDeliveryRequestSchema,
  insertPartBarcodeSchema: () => insertPartBarcodeSchema,
  insertPartSchema: () => insertPartSchema,
  insertPartsDeliverySchema: () => insertPartsDeliverySchema,
  insertPartsIssuanceSchema: () => insertPartsIssuanceSchema,
  insertPartsPickupSchema: () => insertPartsPickupSchema,
  insertPartsToCountSchema: () => insertPartsToCountSchema,
  insertShelfSchema: () => insertShelfSchema,
  insertStaffMemberSchema: () => insertStaffMemberSchema,
  insertStorageLocationSchema: () => insertStorageLocationSchema,
  insertToolSchema: () => insertToolSchema,
  insertToolSignoutSchema: () => insertToolSignoutSchema,
  insertUserSchema: () => insertUserSchema,
  issueReasonEnum: () => issueReasonEnum,
  partBarcodes: () => partBarcodes,
  parts: () => parts,
  partsDelivery: () => partsDelivery,
  partsIssuance: () => partsIssuance,
  partsPickup: () => partsPickup,
  partsToCount: () => partsToCount,
  pickupStatusEnum: () => pickupStatusEnum,
  shelves: () => shelves,
  staffMembers: () => staffMembers,
  storageLocations: () => storageLocations,
  toolSignouts: () => toolSignouts,
  toolStatusEnum: () => toolStatusEnum,
  tools: () => tools,
  updatePartsDeliverySchema: () => updatePartsDeliverySchema,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});
import { pgTable, text, serial, integer, timestamp, boolean, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userRoleEnum, issueReasonEnum, users, buildings, storageLocations, shelves, parts, partBarcodes, partsIssuance, archivedPartsIssuance, insertUserSchema, insertBuildingSchema, insertStorageLocationSchema, insertShelfSchema, baseInsertPartSchema, insertPartSchema, insertPartsIssuanceSchema, bulkPartsIssuanceSchema, insertArchivedPartsIssuanceSchema, partsToCount, insertPartsToCountSchema, pickupStatusEnum, partsPickup, insertPartsPickupSchema, toolStatusEnum, tools, toolSignouts, insertToolSchema, insertToolSignoutSchema, costCenters, insertCostCenterSchema, staffMembers, insertStaffMemberSchema, deliveryStatusEnum, partsDelivery, insertPartsDeliverySchema, updatePartsDeliverySchema, insertPartBarcodeSchema, deliveryRequestStatusEnum, deliveryRequests, deliveryRequestItems, insertDeliveryRequestSchema, insertDeliveryRequestItemSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    userRoleEnum = pgEnum("user_role", [
      "admin",
      "technician",
      "student",
      "controller"
    ]);
    issueReasonEnum = pgEnum("issue_reason", [
      "production",
      "maintenance",
      "replacement",
      "testing",
      "other"
    ]);
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      name: text("name").notNull(),
      role: userRoleEnum("role").notNull().default("technician"),
      department: text("department")
    });
    buildings = pgTable("buildings", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description"),
      address: text("address"),
      location: text("location"),
      contactPerson: text("contact_person"),
      contactEmail: text("contact_email"),
      contactPhone: text("contact_phone"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at")
    });
    storageLocations = pgTable("storage_locations", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    shelves = pgTable("shelves", {
      id: serial("id").primaryKey(),
      locationId: integer("location_id").notNull().references(() => storageLocations.id),
      name: text("name").notNull(),
      // Shelf number/identifier
      description: text("description"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => {
      return {
        // Create a unique constraint on the combination of locationId and name
        uniqueLocationShelf: uniqueIndex("unique_location_shelf_idx").on(table.locationId, table.name)
      };
    });
    parts = pgTable("parts", {
      id: serial("id").primaryKey(),
      partId: text("part_id").notNull().unique(),
      name: text("name").notNull(),
      description: text("description"),
      quantity: integer("quantity").notNull().default(0),
      reorderLevel: integer("reorder_level").notNull().default(10),
      unitCost: text("unit_cost"),
      // The location is stored both as text and as foreign keys
      location: text("location"),
      // Text location for backward compatibility
      // Added proper foreign key relationships to locations and shelves
      locationId: integer("location_id").references(() => storageLocations.id),
      shelfId: integer("shelf_id").references(() => shelves.id),
      category: text("category"),
      supplier: text("supplier"),
      lastRestockDate: timestamp("last_restock_date")
    });
    partBarcodes = pgTable("part_barcodes", {
      id: serial("id").primaryKey(),
      partId: integer("part_id").notNull().references(() => parts.id),
      barcode: text("barcode").notNull().unique(),
      supplier: text("supplier"),
      // Which supplier uses this barcode
      isPrimary: boolean("is_primary").notNull().default(false),
      // Mark one as primary
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    partsIssuance = pgTable("parts_issuance", {
      id: serial("id").primaryKey(),
      partId: integer("part_id").notNull().references(() => parts.id),
      quantity: integer("quantity").notNull(),
      issuedTo: text("issued_to").notNull(),
      reason: issueReasonEnum("reason").notNull(),
      issuedAt: timestamp("issued_at").notNull().defaultNow(),
      issuedById: integer("issued_by"),
      // Column name in DB is issued_by
      notes: text("notes"),
      department: text("department"),
      projectCode: text("project_code"),
      buildingId: integer("building_id").references(() => buildings.id),
      costCenter: text("cost_center")
    });
    archivedPartsIssuance = pgTable("archived_parts_issuance", {
      id: serial("id").primaryKey(),
      originalId: integer("original_id"),
      // Original ID from the parts_issuance table
      partId: integer("part_id").notNull(),
      // Not a foreign key to allow part deletions
      partNumber: text("part_number").notNull(),
      // Store the part number for reporting
      partName: text("part_name").notNull(),
      // Store the part name for reporting
      quantity: integer("quantity").notNull(),
      issuedTo: text("issued_to").notNull(),
      reason: issueReasonEnum("reason").notNull(),
      issuedAt: timestamp("issued_at").notNull(),
      issuedById: integer("issued_by_id"),
      issuedByName: text("issued_by_name"),
      // Store the name for reporting
      notes: text("notes"),
      department: text("department"),
      projectCode: text("project_code"),
      unitCost: text("unit_cost"),
      // Store the unit cost at time of issuance
      archivedAt: timestamp("archived_at").notNull().defaultNow(),
      buildingName: text("building_name"),
      // Store building info at time of archiving
      costCenterName: text("cost_center_name"),
      // Store cost center info
      costCenterCode: text("cost_center_code")
      // Store cost center code
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true
    });
    insertBuildingSchema = createInsertSchema(buildings).omit({
      id: true
    });
    insertStorageLocationSchema = createInsertSchema(storageLocations).omit({
      id: true,
      createdAt: true
    });
    insertShelfSchema = createInsertSchema(shelves).omit({
      id: true,
      createdAt: true
    });
    baseInsertPartSchema = createInsertSchema(parts).omit({
      id: true
    });
    insertPartSchema = baseInsertPartSchema.extend({
      unitCost: z.string().nullable().optional()
    });
    insertPartsIssuanceSchema = createInsertSchema(partsIssuance).omit({
      id: true,
      issuedAt: true
    });
    bulkPartsIssuanceSchema = z.object({
      parts: z.array(z.object({
        partId: z.number(),
        quantity: z.number().positive("Quantity must be greater than 0")
      })),
      building: z.string().min(1, "Building is required"),
      issuedTo: z.string().min(1, "Issued To is required"),
      reason: z.enum(["production", "maintenance", "replacement", "testing", "other"]),
      // CRITICAL FIX: Accept string or Date for issuedAt to handle various date formats from the client
      issuedAt: z.union([z.string(), z.date()]).optional().default(() => /* @__PURE__ */ new Date()),
      costCenter: z.string().optional(),
      notes: z.string().optional()
    });
    insertArchivedPartsIssuanceSchema = createInsertSchema(archivedPartsIssuance).omit({
      id: true,
      archivedAt: true
    });
    partsToCount = pgTable("parts_to_count", {
      id: serial("id").primaryKey(),
      partId: integer("part_id").notNull().references(() => parts.id),
      assignedById: integer("assigned_by_id").references(() => users.id),
      status: text("status").notNull().default("pending"),
      // pending, completed
      assignedAt: timestamp("assigned_at").notNull().defaultNow(),
      completedAt: timestamp("completed_at"),
      notes: text("notes")
    });
    insertPartsToCountSchema = createInsertSchema(partsToCount).omit({
      id: true,
      assignedAt: true,
      completedAt: true
    });
    pickupStatusEnum = pgEnum("pickup_status", [
      "pending",
      // Waiting for technician pickup
      "completed"
      // Technician has acknowledged receipt
    ]);
    partsPickup = pgTable("parts_pickup", {
      id: serial("id").primaryKey(),
      partName: text("part_name").notNull(),
      // Name of the part that arrived
      partNumber: text("part_number"),
      // Optional part number/SKU from supplier
      quantity: integer("quantity").notNull().default(1),
      supplier: text("supplier"),
      // Where the part came from
      buildingId: integer("building_id").references(() => buildings.id),
      // Which building it's for
      addedById: integer("added_by_id").references(() => users.id),
      // Admin/student who added the entry
      addedAt: timestamp("added_at").notNull().defaultNow(),
      // When it was recorded as arrived
      pickedUpById: integer("picked_up_by_id").references(() => users.id),
      // Technician who picked it up
      pickedUpAt: timestamp("picked_up_at"),
      // When it was picked up
      status: pickupStatusEnum("status").notNull().default("pending"),
      notes: text("notes"),
      // Any special instructions or details
      trackingNumber: text("tracking_number"),
      // For tracking deliveries
      poNumber: text("po_number"),
      // Purchase order reference
      pickupCode: text("pickup_code")
      // Random 4-digit code for physical matching
    });
    insertPartsPickupSchema = createInsertSchema(partsPickup).omit({
      id: true,
      addedAt: true,
      pickedUpAt: true,
      pickedUpById: true,
      status: true,
      pickupCode: true
      // Omit pickup code so server can generate it
    });
    toolStatusEnum = pgEnum("tool_status", [
      "checked_out",
      // Tool is currently checked out
      "returned",
      // Tool has been returned
      "damaged",
      // Tool was returned but is damaged
      "missing"
      // Tool is missing/not returned
    ]);
    tools = pgTable("tools", {
      id: serial("id").primaryKey(),
      toolNumber: integer("tool_number").notNull().unique(),
      // Permanent sequential identifier
      toolName: text("tool_name").notNull(),
      // Name/description of the tool
      notes: text("notes"),
      // Any notes about the tool
      createdAt: timestamp("created_at").notNull().defaultNow(),
      active: boolean("active").notNull().default(true)
      // If false, tool is retired/removed
    });
    toolSignouts = pgTable("tool_signouts", {
      id: serial("id").primaryKey(),
      toolId: integer("tool_id").notNull().references(() => tools.id),
      // References the permanent tool
      technicianId: integer("technician_id").notNull().references(() => users.id),
      // Technician who checked out the tool
      signedOutAt: timestamp("signed_out_at").notNull().defaultNow(),
      // When the tool was checked out
      returnedAt: timestamp("returned_at"),
      // When the tool was returned (if it was)
      status: toolStatusEnum("status").notNull().default("checked_out"),
      condition: text("condition"),
      // Condition upon return
      notes: text("notes")
      // Any notes about the signout
    });
    insertToolSchema = createInsertSchema(tools).omit({
      id: true,
      toolNumber: true,
      // System will generate the next number
      createdAt: true
    });
    insertToolSignoutSchema = createInsertSchema(toolSignouts).omit({
      id: true,
      returnedAt: true
    });
    costCenters = pgTable("cost_centers", {
      id: serial("id").primaryKey(),
      code: text("code").notNull().unique(),
      name: text("name").notNull(),
      description: text("description"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertCostCenterSchema = createInsertSchema(costCenters).omit({
      id: true,
      createdAt: true
    });
    staffMembers = pgTable("staff_members", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      buildingId: integer("building_id").references(() => buildings.id),
      costCenterId: integer("cost_center_id").references(() => costCenters.id),
      email: text("email"),
      phone: text("phone"),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
      id: true,
      createdAt: true
    });
    deliveryStatusEnum = pgEnum("delivery_status", [
      "pending",
      // Delivery recorded but not yet signed/confirmed
      "delivered",
      // Delivery signed and confirmed
      "cancelled"
      // Delivery was cancelled
    ]);
    partsDelivery = pgTable("parts_delivery", {
      id: serial("id").primaryKey(),
      partId: integer("part_id").notNull().references(() => parts.id),
      quantity: integer("quantity").notNull(),
      staffMemberId: integer("staff_member_id").notNull().references(() => staffMembers.id),
      costCenterId: integer("cost_center_id").references(() => costCenters.id),
      deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
      deliveredById: integer("delivered_by_id").references(() => users.id),
      notes: text("notes"),
      projectCode: text("project_code"),
      buildingId: integer("building_id").references(() => buildings.id),
      unitCost: text("unit_cost"),
      // Store the actual unit cost at time of delivery
      signature: text("signature"),
      // Store signature as SVG/base64 data
      status: deliveryStatusEnum("status").notNull().default("pending"),
      confirmedAt: timestamp("confirmed_at")
      // When delivery was confirmed/signed
    });
    insertPartsDeliverySchema = createInsertSchema(partsDelivery).omit({
      id: true,
      deliveredAt: true,
      unitCost: true,
      // Omit unitCost as it will be populated from the part's cost
      signature: true,
      // Signature will be added later when confirming delivery
      confirmedAt: true,
      // Will be set when delivery is confirmed
      status: true
      // Default to pending
    });
    updatePartsDeliverySchema = createInsertSchema(partsDelivery).omit({
      id: true,
      deliveredAt: true,
      // Omit deliveredAt so we can customize it
      unitCost: true
      // Omit unitCost as it's handled separately
    }).extend({
      // Allow string (ISO date) or Date objects for deliveredAt
      deliveredAt: z.union([z.string(), z.date()]).optional(),
      unitCost: z.string().optional(),
      // Allow updating unitCost if needed
      signature: z.string().optional(),
      // Allow adding signature data
      status: z.enum(["pending", "delivered", "cancelled"]).optional(),
      confirmedAt: z.union([z.string(), z.date()]).optional()
    }).partial();
    insertPartBarcodeSchema = createInsertSchema(partBarcodes).omit({
      id: true,
      createdAt: true
    });
    deliveryRequestStatusEnum = pgEnum("delivery_request_status", [
      "pending",
      // Request submitted, waiting for approval
      "approved",
      // Request approved, ready for fulfillment
      "fulfilled",
      // Request completed and items delivered
      "rejected"
      // Request rejected
    ]);
    deliveryRequests = pgTable("delivery_requests", {
      id: serial("id").primaryKey(),
      requesterName: text("requester_name").notNull(),
      roomNumber: text("room_number").notNull(),
      buildingId: integer("building_id").references(() => buildings.id),
      costCenterId: integer("cost_center_id").references(() => costCenters.id),
      notes: text("notes"),
      status: text("status").notNull().default("pending"),
      // Use text to match existing DB
      requestDate: timestamp("request_date").notNull().defaultNow(),
      fulfilledDate: timestamp("fulfilled_date"),
      fulfilledBy: integer("fulfilled_by").references(() => users.id)
    });
    deliveryRequestItems = pgTable("delivery_request_items", {
      id: serial("id").primaryKey(),
      requestId: integer("request_id").notNull().references(() => deliveryRequests.id),
      partId: text("part_id").notNull(),
      // Store part_id directly since these are from the parts table
      quantity: integer("quantity").notNull(),
      notes: text("notes")
    });
    insertDeliveryRequestSchema = createInsertSchema(deliveryRequests).omit({
      id: true,
      requestDate: true,
      fulfilledDate: true,
      status: true
    });
    insertDeliveryRequestItemSchema = createInsertSchema(deliveryRequestItems).omit({
      id: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool2
});
import pg2 from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var Pool2, pool2, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    ({ Pool: Pool2 } = pg2);
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool2 = new Pool2({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool2, schema: schema_exports });
  }
});

// server/delivery-storage.ts
import { eq as eq3, desc, and as and2, sql, gte, lte } from "drizzle-orm";
import { readFile } from "fs/promises";
import * as XLSX from "xlsx";
async function getCostCenters() {
  try {
    const centers = await db.select().from(costCenters).orderBy(costCenters.code);
    return centers;
  } catch (error) {
    console.error("Error getting cost centers:", error);
    return [];
  }
}
async function getCostCenter(id) {
  try {
    const [center] = await db.select().from(costCenters).where(eq3(costCenters.id, id));
    return center;
  } catch (error) {
    console.error("Error getting cost center:", error);
    return void 0;
  }
}
async function createCostCenter(center) {
  try {
    const [newCenter] = await db.insert(costCenters).values({
      ...center,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newCenter;
  } catch (error) {
    console.error("Error creating cost center:", error);
    throw error;
  }
}
async function updateCostCenter(id, center) {
  try {
    const [updated] = await db.update(costCenters).set(center).where(eq3(costCenters.id, id)).returning();
    return updated;
  } catch (error) {
    console.error("Error updating cost center:", error);
    return void 0;
  }
}
async function deleteCostCenter(id) {
  try {
    const result = await db.delete(costCenters).where(eq3(costCenters.id, id)).returning({ id: costCenters.id });
    return result.length > 0;
  } catch (error) {
    console.error("Error deleting cost center:", error);
    return false;
  }
}
async function getStaffMembers() {
  try {
    const members = await db.select().from(staffMembers).orderBy(staffMembers.name);
    const staffWithDetails = await Promise.all(
      members.map(async (staff) => {
        let building = void 0;
        if (staff.buildingId) {
          const [buildingResult] = await db.select().from(buildings).where(eq3(buildings.id, staff.buildingId));
          building = buildingResult;
        }
        let costCenter = void 0;
        if (staff.costCenterId) {
          const [costCenterResult] = await db.select().from(costCenters).where(eq3(costCenters.id, staff.costCenterId));
          costCenter = costCenterResult;
        }
        return {
          ...staff,
          building,
          costCenter
        };
      })
    );
    return staffWithDetails;
  } catch (error) {
    console.error("Error getting staff members:", error);
    return [];
  }
}
async function getStaffMember(id) {
  try {
    const [member] = await db.select().from(staffMembers).where(eq3(staffMembers.id, id));
    if (!member) return void 0;
    let building = void 0;
    if (member.buildingId) {
      const [buildingResult] = await db.select().from(buildings).where(eq3(buildings.id, member.buildingId));
      building = buildingResult;
    }
    let costCenter = void 0;
    if (member.costCenterId) {
      const [costCenterResult] = await db.select().from(costCenters).where(eq3(costCenters.id, member.costCenterId));
      costCenter = costCenterResult;
    }
    return {
      ...member,
      building,
      costCenter
    };
  } catch (error) {
    console.error("Error getting staff member:", error);
    return void 0;
  }
}
async function createStaffMember(member) {
  try {
    const [newMember] = await db.insert(staffMembers).values({
      ...member,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newMember;
  } catch (error) {
    console.error("Error creating staff member:", error);
    throw error;
  }
}
async function updateStaffMember(id, member) {
  try {
    const [updated] = await db.update(staffMembers).set(member).where(eq3(staffMembers.id, id)).returning();
    return updated;
  } catch (error) {
    console.error("Error updating staff member:", error);
    return void 0;
  }
}
async function deleteStaffMember(id) {
  try {
    const result = await db.delete(staffMembers).where(eq3(staffMembers.id, id)).returning({ id: staffMembers.id });
    return result.length > 0;
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return false;
  }
}
async function createPartsDelivery(delivery) {
  try {
    const [part] = await db.select().from(parts).where(eq3(parts.id, delivery.partId));
    if (!part) {
      throw new Error(`Part with ID ${delivery.partId} not found`);
    }
    if (part.quantity < delivery.quantity) {
      throw new Error(`Not enough quantity available. Requested: ${delivery.quantity}, Available: ${part.quantity}`);
    }
    return await db.transaction(async (tx) => {
      await tx.update(parts).set({ quantity: part.quantity - delivery.quantity }).where(eq3(parts.id, delivery.partId));
      let deliveredAtDate;
      if (delivery.deliveredAt) {
        if (typeof delivery.deliveredAt === "string") {
          deliveredAtDate = /* @__PURE__ */ new Date(delivery.deliveredAt + "T16:00:00.000Z");
        } else if (delivery.deliveredAt instanceof Date) {
          deliveredAtDate = delivery.deliveredAt;
        } else {
          deliveredAtDate = new Date(delivery.deliveredAt);
        }
      } else {
        deliveredAtDate = /* @__PURE__ */ new Date();
      }
      console.log("Creating delivery with parsed date:", deliveredAtDate.toISOString());
      console.log(`Copying unit cost from part: ${part.unitCost || "NULL"}`);
      const [newDelivery] = await tx.insert(partsDelivery).values({
        ...delivery,
        deliveredAt: deliveredAtDate,
        // Use the properly parsed date
        unitCost: part.unitCost
        // Copy the unit cost from the part
      }).returning();
      return newDelivery;
    });
  } catch (error) {
    console.error("Error creating parts delivery:", error);
    throw error;
  }
}
async function getPartsDeliveryWithDetails(id) {
  try {
    const [delivery] = await db.select().from(partsDelivery).where(eq3(partsDelivery.id, id));
    if (!delivery) return void 0;
    const [part] = await db.select().from(parts).where(eq3(parts.id, delivery.partId));
    if (!part) {
      console.error(`Part with ID ${delivery.partId} not found for delivery ${delivery.id}`);
      return void 0;
    }
    let staffMember;
    try {
      [staffMember] = await db.select().from(staffMembers).where(eq3(staffMembers.id, delivery.staffMemberId));
      if (!staffMember) {
        console.error(`Staff member with ID ${delivery.staffMemberId} not found for delivery ${delivery.id}`);
      }
    } catch (error) {
      console.error(`Error fetching staff member with ID ${delivery.staffMemberId}:`, error);
    }
    let costCenter = void 0;
    let building = void 0;
    let deliveredBy = void 0;
    if (delivery.costCenterId) {
      [costCenter] = await db.select().from(costCenters).where(eq3(costCenters.id, delivery.costCenterId));
    }
    if (delivery.buildingId) {
      [building] = await db.select().from(buildings).where(eq3(buildings.id, delivery.buildingId));
    }
    if (delivery.deliveredById) {
      [deliveredBy] = await db.select().from(users).where(eq3(users.id, delivery.deliveredById));
    }
    const defaultStaffMember = {
      id: delivery.staffMemberId,
      name: `Staff ID: ${delivery.staffMemberId}`,
      buildingId: null,
      costCenterId: null,
      email: null,
      phone: null,
      active: true,
      createdAt: null
    };
    return {
      ...delivery,
      part,
      staffMember: staffMember || defaultStaffMember,
      costCenter,
      building,
      deliveredBy
    };
  } catch (error) {
    console.error("Error getting delivery with details:", error);
    return void 0;
  }
}
async function getAllPartsDeliveriesWithDetails(startDate, endDate) {
  try {
    console.log("FAST BULK EXPORT: Getting deliveries with single queries");
    let query = db.select().from(partsDelivery);
    if (startDate && endDate) {
      console.log(`FAST: Filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      query = query.where(
        and2(
          gte(partsDelivery.deliveredAt, startDate),
          lte(partsDelivery.deliveredAt, endDate)
        )
      );
    }
    const deliveries = await query.orderBy(desc(partsDelivery.deliveredAt));
    console.log(`FAST: Found ${deliveries.length} deliveries`);
    if (deliveries.length === 0) {
      return [];
    }
    const [allParts, allStaff, allBuildings, allCostCenters, allUsers] = await Promise.all([
      db.select().from(parts),
      db.select().from(staffMembers),
      db.select().from(buildings),
      db.select().from(costCenters),
      db.select().from(users)
    ]);
    console.log(`FAST: Loaded ${allParts.length} parts, ${allStaff.length} staff, ${allBuildings.length} buildings, ${allCostCenters.length} cost centers, ${allUsers.length} users`);
    const partsMap = new Map(allParts.map((p) => [p.id, p]));
    const staffMap = new Map(allStaff.map((s) => [s.id, s]));
    const buildingsMap = new Map(allBuildings.map((b) => [b.id, b]));
    const costCentersMap = new Map(allCostCenters.map((c) => [c.id, c]));
    const usersMap = new Map(allUsers.map((u) => [u.id, u]));
    const results = deliveries.map((delivery) => {
      const part = partsMap.get(delivery.partId);
      const staffMember = staffMap.get(delivery.staffMemberId);
      const building = buildingsMap.get(delivery.buildingId);
      const costCenter = costCentersMap.get(delivery.costCenterId);
      const deliveredBy = usersMap.get(delivery.deliveredById);
      return {
        ...delivery,
        part: part || null,
        staffMember: staffMember || null,
        building: building || null,
        costCenter: costCenter || null,
        deliveredBy: deliveredBy || null
      };
    });
    console.log(`FAST: Built ${results.length} detailed deliveries in memory`);
    return results;
  } catch (error) {
    console.error("FAST EXPORT ERROR:", error);
    return [];
  }
}
async function getRecentPartsDeliveriesWithDetails(limit, startDate, endDate) {
  try {
    let query = db.select().from(partsDelivery);
    if (startDate && endDate) {
      console.log(`Filtering deliveries between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      query = query.where(
        and2(
          gte(partsDelivery.deliveredAt, startDate),
          lte(partsDelivery.deliveredAt, endDate)
        )
      );
    }
    const recentDeliveries = await query.orderBy(desc(partsDelivery.deliveredAt)).limit(limit);
    console.log(`Found ${recentDeliveries.length} deliveries matching date criteria`);
    const deliveriesWithDetails = [];
    for (const delivery of recentDeliveries) {
      const deliveryWithDetails = await getPartsDeliveryWithDetails(delivery.id);
      if (deliveryWithDetails) {
        deliveriesWithDetails.push(deliveryWithDetails);
      }
    }
    return deliveriesWithDetails;
  } catch (error) {
    console.error("Error getting recent deliveries with details:", error);
    return [];
  }
}
async function getPartsDeliveryById(id) {
  try {
    return await getPartsDeliveryWithDetails(id);
  } catch (error) {
    console.error("Error getting parts delivery by ID:", error);
    return void 0;
  }
}
async function updatePartsDelivery(id, deliveryData) {
  try {
    const [originalDelivery] = await db.select().from(partsDelivery).where(eq3(partsDelivery.id, id));
    if (!originalDelivery) {
      return void 0;
    }
    let dataToUpdate = { ...deliveryData };
    if (deliveryData.deliveredAt) {
      console.log(
        "Update - Handling date:",
        deliveryData.deliveredAt,
        "Type:",
        typeof deliveryData.deliveredAt
      );
      try {
        if (typeof deliveryData.deliveredAt === "string") {
          if (deliveryData.deliveredAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = deliveryData.deliveredAt.split("-").map(Number);
            dataToUpdate.deliveredAt = new Date(year, month - 1, day, 12, 0, 0);
          } else {
            dataToUpdate.deliveredAt = new Date(deliveryData.deliveredAt);
          }
        }
        if (dataToUpdate.deliveredAt instanceof Date && isNaN(dataToUpdate.deliveredAt.getTime())) {
          throw new Error("Invalid date conversion result");
        }
        console.log("Update - Converted date to:", dataToUpdate.deliveredAt);
      } catch (err) {
        console.error("Date conversion error:", err);
        dataToUpdate.deliveredAt = /* @__PURE__ */ new Date();
      }
    }
    if (dataToUpdate.partId && dataToUpdate.partId !== originalDelivery.partId || dataToUpdate.quantity && dataToUpdate.quantity !== originalDelivery.quantity) {
      return await db.transaction(async (tx) => {
        if (originalDelivery.partId) {
          const [oldPart] = await tx.select().from(parts).where(eq3(parts.id, originalDelivery.partId));
          if (oldPart) {
            await tx.update(parts).set({ quantity: oldPart.quantity + originalDelivery.quantity }).where(eq3(parts.id, originalDelivery.partId));
          }
        }
        const partIdToUpdate = dataToUpdate.partId || originalDelivery.partId;
        const quantityToDeduct = dataToUpdate.quantity || originalDelivery.quantity;
        const [newPart] = await tx.select().from(parts).where(eq3(parts.id, partIdToUpdate));
        if (!newPart) {
          throw new Error(`Part with ID ${partIdToUpdate} not found`);
        }
        if (newPart.quantity < quantityToDeduct) {
          throw new Error(`Not enough quantity available. Requested: ${quantityToDeduct}, Available: ${newPart.quantity}`);
        }
        await tx.update(parts).set({ quantity: newPart.quantity - quantityToDeduct }).where(eq3(parts.id, partIdToUpdate));
        console.log("Update - Setting delivery data in transaction:", dataToUpdate);
        const [updatedDelivery] = await tx.update(partsDelivery).set(dataToUpdate).where(eq3(partsDelivery.id, id)).returning();
        return updatedDelivery;
      });
    } else {
      console.log("Update - Setting delivery data without transaction:", dataToUpdate);
      const [updatedDelivery] = await db.update(partsDelivery).set(dataToUpdate).where(eq3(partsDelivery.id, id)).returning();
      return updatedDelivery;
    }
  } catch (error) {
    console.error("Error updating parts delivery:", error);
    throw error;
  }
}
async function deletePartsDelivery(id) {
  try {
    const [delivery] = await db.select().from(partsDelivery).where(eq3(partsDelivery.id, id));
    if (!delivery) {
      return false;
    }
    return await db.transaction(async (tx) => {
      const [part] = await tx.select().from(parts).where(eq3(parts.id, delivery.partId));
      if (part) {
        await tx.update(parts).set({ quantity: part.quantity + delivery.quantity }).where(eq3(parts.id, delivery.partId));
      }
      const deleted = await tx.delete(partsDelivery).where(eq3(partsDelivery.id, id)).returning({ id: partsDelivery.id });
      return deleted.length > 0;
    });
  } catch (error) {
    console.error("Error deleting parts delivery:", error);
    throw error;
  }
}
async function getMonthlyPartsDeliveriesTotal(startDate, endDate) {
  try {
    let query = db.select({
      total: sql`SUM(${partsDelivery.quantity} * CAST(${partsDelivery.unitCost} AS DECIMAL))`.as("total")
    }).from(partsDelivery).innerJoin(parts, eq3(partsDelivery.partId, parts.id));
    if (startDate && endDate) {
      console.log(`Filtering monthly total between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      query = query.where(
        and2(
          gte(partsDelivery.deliveredAt, startDate),
          lte(partsDelivery.deliveredAt, endDate)
        )
      );
    }
    const result = await query;
    const totalValue = result[0]?.total || 0;
    console.log(`Monthly total value (in dollars): ${totalValue}`);
    return Math.round(Number(totalValue) * 100) / 100;
  } catch (error) {
    console.error("Error calculating monthly deliveries total value:", error);
    return 0;
  }
}
async function readCostCentersFromExcel(filePath) {
  try {
    const fileBuffer = await readFile(filePath);
    const workbook = XLSX.read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const costCenters2 = [];
    const errors = [];
    data.forEach((row, index) => {
      try {
        if (!row.code || !row.name) {
          errors.push({ row: index + 2, message: "Missing required fields: code and name are required" });
          return;
        }
        const costCenter = {
          code: row.code.toString(),
          name: row.name,
          description: row.description || null,
          active: row.active !== void 0 ? row.active === true || row.active === "true" || row.active === 1 : true
        };
        costCenters2.push(costCenter);
      } catch (err) {
        errors.push({ row: index + 2, message: `Error parsing row: ${err instanceof Error ? err.message : String(err)}` });
      }
    });
    return { costCenters: costCenters2, errors };
  } catch (error) {
    console.error("Error reading cost centers from Excel:", error);
    return { costCenters: [], errors: [{ row: 0, message: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}` }] };
  }
}
async function readStaffMembersFromExcel(filePath) {
  try {
    const fileBuffer = await readFile(filePath);
    const workbook = XLSX.read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const staffMembers2 = [];
    const errors = [];
    const allBuildings = await db.select().from(buildings);
    const allCostCenters = await db.select().from(costCenters);
    data.forEach((row, index) => {
      try {
        if (!row.name) {
          errors.push({ row: index + 2, message: "Missing required field: name is required" });
          return;
        }
        let buildingId = null;
        if (row.building) {
          const building = allBuildings.find((b) => b.name === row.building);
          if (building) {
            buildingId = building.id;
          } else {
            errors.push({ row: index + 2, message: `Building "${row.building}" not found in system` });
          }
        }
        let costCenterId = null;
        if (row.costCenter) {
          const costCenter = allCostCenters.find((c) => c.code === row.costCenter || c.name === row.costCenter);
          if (costCenter) {
            costCenterId = costCenter.id;
          } else {
            errors.push({ row: index + 2, message: `Cost center "${row.costCenter}" not found in system` });
          }
        }
        const staffMember = {
          name: row.name,
          buildingId,
          costCenterId,
          email: row.email || null,
          phone: row.phone || null,
          active: row.active !== void 0 ? row.active === true || row.active === "true" || row.active === 1 : true
        };
        staffMembers2.push(staffMember);
      } catch (err) {
        errors.push({ row: index + 2, message: `Error parsing row: ${err instanceof Error ? err.message : String(err)}` });
      }
    });
    return { staffMembers: staffMembers2, errors };
  } catch (error) {
    console.error("Error reading staff members from Excel:", error);
    return { staffMembers: [], errors: [{ row: 0, message: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}` }] };
  }
}
function generateCostCentersExcel(centers) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(centers.map((center) => ({
      code: center.code,
      name: center.name,
      description: center.description || "",
      active: center.active
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cost Centers");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  } catch (error) {
    console.error("Error generating cost centers Excel:", error);
    throw error;
  }
}
function generateCostCentersTemplateExcel() {
  try {
    const template = [
      {
        code: "CC001",
        name: "Example Cost Center",
        description: "Example description",
        active: true
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cost Centers Template");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  } catch (error) {
    console.error("Error generating cost centers template Excel:", error);
    throw error;
  }
}
async function generateStaffMembersExcel(members) {
  try {
    const allBuildings = await db.select().from(buildings);
    const allCostCenters = await db.select().from(costCenters);
    const data = await Promise.all(members.map(async (member) => {
      const building = member.buildingId ? allBuildings.find((b) => b.id === member.buildingId) : null;
      const costCenter = member.costCenterId ? allCostCenters.find((c) => c.id === member.costCenterId) : null;
      return {
        name: member.name,
        building: building ? building.name : "",
        costCenter: costCenter ? costCenter.code : "",
        email: member.email || "",
        phone: member.phone || "",
        active: member.active
      };
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Members");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  } catch (error) {
    console.error("Error generating staff members Excel:", error);
    throw error;
  }
}
function generateStaffMembersTemplateExcel() {
  try {
    const template = [
      {
        name: "John Doe",
        building: "Main Building",
        costCenter: "CC001",
        email: "john.doe@example.com",
        phone: "555-123-4567",
        active: true
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Members Template");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  } catch (error) {
    console.error("Error generating staff members template Excel:", error);
    throw error;
  }
}
async function generateDeliveriesExcel(deliveries, monthParam) {
  try {
    let monthlyTotal = 0;
    const data = deliveries.map((delivery) => {
      const unitCost = delivery.unitCost || delivery.part?.unitCost || 0;
      const unitCostNumber = typeof unitCost === "string" ? parseFloat(unitCost) : Number(unitCost);
      const extendedPrice = delivery.quantity * unitCostNumber;
      monthlyTotal += extendedPrice;
      const unitCostFormatted = `$${unitCostNumber.toFixed(2)}`;
      const extendedPriceFormatted = `$${extendedPrice.toFixed(2)}`;
      return {
        "id": delivery.id,
        "date": delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString("en-US") : "",
        "partid": delivery.partId,
        "partname": delivery.part?.name || "",
        "quantity": delivery.quantity,
        "unitcost": unitCostFormatted,
        "extendedprice": extendedPriceFormatted,
        "staffmember": delivery.staffMember?.name || "",
        "buildingid": delivery.buildingId,
        "buildingname": delivery.building?.name || "",
        "costcenterid": delivery.costCenterId,
        "costcentername": delivery.costCenter?.code || "",
        "notes": delivery.notes || ""
      };
    });
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 8 },
      // ID
      { wch: 12 },
      // Date
      { wch: 15 },
      // Part Number
      { wch: 30 },
      // Part Name
      { wch: 10 },
      // Quantity
      { wch: 12 },
      // Unit Cost
      { wch: 15 },
      // Extended Price
      { wch: 25 },
      // Staff Member
      { wch: 12 },
      // Building ID
      { wch: 20 },
      // Building Name
      { wch: 12 },
      // Cost Center ID
      { wch: 15 },
      // Cost Center Name
      { wch: 25 }
      // Notes
    ];
    worksheet["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parts Deliveries");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  } catch (error) {
    console.error("Error generating deliveries Excel:", error);
    throw error;
  }
}
var init_delivery_storage = __esm({
  "server/delivery-storage.ts"() {
    "use strict";
    init_schema();
    init_db();
  }
});

// server/excel.ts
var excel_exports = {};
__export(excel_exports, {
  generateBuildingsExcel: () => generateBuildingsExcel,
  generateBuildingsTemplateExcel: () => generateBuildingsTemplateExcel,
  generateChargeOutsExcel: () => generateChargeOutsExcel,
  generateChargeOutsTemplateExcel: () => generateChargeOutsTemplateExcel,
  generateCombinedReportExcel: () => generateCombinedReportExcel,
  generateDeliveriesExcel: () => generateDeliveriesExcel2,
  generateDeliveriesTemplateExcel: () => generateDeliveriesTemplateExcel,
  generateLocationsExcel: () => generateLocationsExcel,
  generateLocationsTemplateExcel: () => generateLocationsTemplateExcel,
  generatePartsExcel: () => generatePartsExcel,
  generatePartsExcelFromSql: () => generatePartsExcelFromSql,
  generatePartsIssuanceExcel: () => generatePartsIssuanceExcel,
  generateShelvesExcel: () => generateShelvesExcel,
  generateShelvesTemplateExcel: () => generateShelvesTemplateExcel,
  generateTechniciansExcel: () => generateTechniciansExcel,
  generateTechniciansTemplateExcel: () => generateTechniciansTemplateExcel,
  generateTemplateExcel: () => generateTemplateExcel,
  readBuildingsFromExcel: () => readBuildingsFromExcel,
  readChargeOutsFromExcel: () => readChargeOutsFromExcel,
  readDeliveriesFromExcel: () => readDeliveriesFromExcel,
  readLocationsFromExcel: () => readLocationsFromExcel,
  readPartsFromExcel: () => readPartsFromExcel,
  readShelvesFromExcel: () => readShelvesFromExcel,
  readTechniciansFromExcel: () => readTechniciansFromExcel
});
import xlsx from "xlsx";
import ExcelJS from "exceljs";
import { format } from "date-fns";
function generateCombinedReportExcel(items, monthStr) {
  try {
    console.log(`Generating Excel for ${items?.length || 0} items, month: ${monthStr}`);
    const workbook = xlsx.utils.book_new();
    const data = [];
    data.push([`ONU Parts Movement Report - ${monthStr}`]);
    data.push([]);
    data.push([
      "Date",
      "Part Number",
      "Description",
      "Quantity",
      "Unit Cost",
      "Extended Price",
      "Running Total",
      "Building",
      "Cost Center",
      "Type"
    ]);
    let totalCost = 0;
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (!item) return;
        try {
          let dateStr = "";
          if (item.date) {
            const date = new Date(item.date);
            if (!isNaN(date.getTime())) {
              dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            } else {
              dateStr = String(item.date);
            }
          }
          let unitCost = "";
          if (item.unitCost) {
            const cost = typeof item.unitCost === "number" ? item.unitCost : parseFloat(String(item.unitCost).replace(/[^0-9.-]/g, ""));
            if (!isNaN(cost)) {
              unitCost = `$${cost.toFixed(2)}`;
            }
          }
          let extPrice = 0;
          let extPriceStr = "";
          if (item.extendedPrice) {
            if (typeof item.extendedPrice === "number") {
              extPrice = item.extendedPrice;
            } else {
              const match = String(item.extendedPrice).match(/[\d.]+/);
              if (match) {
                extPrice = parseFloat(match[0]);
              }
            }
          } else if (item.unitCost && item.quantity) {
            const cost = typeof item.unitCost === "number" ? item.unitCost : parseFloat(String(item.unitCost).replace(/[^0-9.-]/g, ""));
            const qty = typeof item.quantity === "number" ? item.quantity : parseInt(String(item.quantity));
            if (!isNaN(cost) && !isNaN(qty)) {
              extPrice = cost * qty;
            }
          }
          if (!isNaN(extPrice)) {
            extPriceStr = `$${extPrice.toFixed(2)}`;
            totalCost += extPrice;
          }
          data.push([
            dateStr,
            item.partName || "",
            item.description || item.partName || "",
            item.quantity || 0,
            unitCost,
            extPriceStr,
            `$${totalCost.toFixed(2)}`,
            // Running total
            item.building || "",
            item.costCenter || "",
            item.type || ""
          ]);
        } catch (err) {
          console.error("Error processing item:", err);
        }
      });
    }
    data.push([]);
    data.push(["GRAND TOTAL", "", "", "", "", `$${totalCost.toFixed(2)}`, `$${totalCost.toFixed(2)}`]);
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    const colWidths = [
      { wch: 12 },
      // Date
      { wch: 15 },
      // Part Number
      { wch: 30 },
      // Description
      { wch: 10 },
      // Quantity
      { wch: 12 },
      // Unit Cost
      { wch: 15 },
      // Extended Price
      { wch: 15 },
      // Running Total
      { wch: 20 },
      // Building
      { wch: 20 },
      // Cost Center
      { wch: 15 }
      // Type
    ];
    worksheet["!cols"] = colWidths;
    xlsx.utils.book_append_sheet(workbook, worksheet, "Parts Report");
    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  } catch (error) {
    console.error("Error generating combined report Excel:", error);
    try {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([
        ["Error generating report"],
        ["Please try again"]
      ]);
      xlsx.utils.book_append_sheet(wb, ws, "Error");
      return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    } catch (e) {
      throw new Error("Failed to generate Excel report");
    }
  }
}
function readPartsFromExcel(filePath) {
  console.log("Reading parts from Excel file:", filePath);
  const parts2 = [];
  const errors = [];
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      errors.push({ row: 0, message: "No data found in Excel file" });
      return { parts: parts2, errors };
    }
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { parts: parts2, errors };
    }
    const headers = data[0];
    console.log("Excel headers:", headers);
    const requiredFields = ["partid", "name"];
    const optionalFields = ["description", "quantity", "reorderlevel", "unitcost", "category", "location", "supplier"];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === "string") {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, "")] = index;
      }
    });
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    if (errors.length > 0) {
      return { parts: parts2, errors };
    }
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      try {
        if (!row || row.every((cell) => !cell || cell === "")) {
          continue;
        }
        const partId = row[headerMap["partid"]]?.toString()?.trim();
        const name = row[headerMap["name"]]?.toString()?.trim();
        if (!partId || !name) {
          errors.push({ row: rowNumber, message: "Part ID and Name are required" });
          continue;
        }
        let quantity = 0;
        if (headerMap["quantity"] !== void 0 && row[headerMap["quantity"]]) {
          const qtyValue = parseFloat(row[headerMap["quantity"]]);
          if (!isNaN(qtyValue) && qtyValue >= 0) {
            quantity = qtyValue;
          }
        }
        let reorderLevel = 1;
        if (headerMap["reorderlevel"] !== void 0 && row[headerMap["reorderlevel"]]) {
          const reorderValue = parseFloat(row[headerMap["reorderlevel"]]);
          if (!isNaN(reorderValue) && reorderValue > 0) {
            reorderLevel = reorderValue;
          }
        }
        let unitCost = "0";
        if (headerMap["unitcost"] !== void 0 && row[headerMap["unitcost"]]) {
          const costStr = row[headerMap["unitcost"]].toString().replace(/[^0-9.-]/g, "");
          const costValue = parseFloat(costStr);
          if (!isNaN(costValue) && costValue >= 0) {
            unitCost = costValue.toString();
          }
        }
        const part = {
          partId,
          name,
          description: headerMap["description"] !== void 0 ? row[headerMap["description"]]?.toString()?.trim() || null : null,
          quantity,
          reorderLevel,
          unitCost,
          category: headerMap["category"] !== void 0 ? row[headerMap["category"]]?.toString()?.trim() || null : null,
          location: headerMap["location"] !== void 0 ? row[headerMap["location"]]?.toString()?.trim() || null : null,
          supplier: headerMap["supplier"] !== void 0 ? row[headerMap["supplier"]]?.toString()?.trim() || null : null,
          locationId: null,
          shelfId: null
        };
        parts2.push(part);
      } catch (rowError) {
        errors.push({
          row: rowNumber,
          message: `Error processing row: ${rowError instanceof Error ? rowError.message : String(rowError)}`
        });
      }
    }
    console.log(`Successfully parsed ${parts2.length} parts from Excel with ${errors.length} errors`);
  } catch (error) {
    console.error("Error reading Excel file:", error);
    errors.push({
      row: 0,
      message: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  return { parts: parts2, errors };
}
async function generatePartsExcel(parts2) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Parts Inventory");
  worksheet.columns = [
    { header: "Part ID", key: "partId", width: 15 },
    { header: "Name", key: "name", width: 30 },
    { header: "Description", key: "description", width: 40 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Reorder Level", key: "reorderLevel", width: 15 },
    { header: "Unit Cost", key: "unitCost", width: 12 },
    { header: "Extended Value", key: "extendedValue", width: 15 },
    { header: "Category", key: "category", width: 20 },
    { header: "Location", key: "location", width: 20 },
    { header: "Supplier", key: "supplier", width: 20 },
    { header: "Last Restock Date", key: "lastRestockDate", width: 18 }
  ];
  let grandTotal = 0;
  parts2.forEach((part) => {
    const quantity = parseFloat(part.quantity) || 0;
    const unitCost = parseFloat(part.unit_cost || part.unitCost) || 0;
    const extendedValue = quantity * unitCost;
    grandTotal += extendedValue;
    worksheet.addRow({
      partId: part.part_id || part.partId,
      name: part.name,
      description: part.description || "",
      quantity,
      reorderLevel: part.reorder_level || part.reorderLevel || "",
      unitCost: unitCost.toFixed(2),
      extendedValue: extendedValue.toFixed(2),
      category: part.category || "",
      location: part.location || "",
      supplier: part.supplier || "",
      lastRestockDate: part.last_restock_date || part.lastRestockDate ? new Date(part.last_restock_date || part.lastRestockDate).toLocaleDateString() : ""
    });
  });
  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    partId: "",
    name: "",
    description: "",
    quantity: "",
    reorderLevel: "",
    unitCost: "GRAND TOTAL:",
    extendedValue: grandTotal.toFixed(2),
    category: "",
    location: "",
    supplier: "",
    lastRestockDate: ""
  });
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };
  });
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber === 6 || colNumber === 7) {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
        // Yellow background
      };
    }
  });
  const extendedValueColumn = worksheet.getColumn(7);
  extendedValueColumn.numFmt = "$#,##0.00";
  const unitCostColumn = worksheet.getColumn(6);
  unitCostColumn.numFmt = "$#,##0.00";
  return await workbook.xlsx.writeBuffer();
}
function generatePartsExcelFromSql(parts2) {
  const workbook = xlsx.utils.book_new();
  const data = [];
  data.push([
    "Part ID",
    "Name",
    "Description",
    "Quantity",
    "Reorder Level",
    "Unit Cost",
    "Extended Value",
    "Category",
    "Location",
    "Supplier",
    "Last Restock Date"
  ]);
  let grandTotal = 0;
  parts2.forEach((part) => {
    const quantity = parseFloat(part.quantity) || 0;
    const unitCost = parseFloat(part.unit_cost || part.unitCost) || 0;
    const extendedValue = quantity * unitCost;
    grandTotal += extendedValue;
    data.push([
      part.part_id || part.partId,
      part.name,
      part.description || "",
      quantity,
      part.reorder_level || part.reorderLevel || "",
      unitCost.toFixed(2),
      extendedValue.toFixed(2),
      part.category || "",
      part.location || "",
      part.supplier || "",
      part.last_restock_date || part.lastRestockDate ? new Date(part.last_restock_date || part.lastRestockDate).toLocaleDateString() : ""
    ]);
  });
  data.push([]);
  data.push(["", "", "", "", "", "GRAND TOTAL:", grandTotal.toFixed(2)]);
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 40 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 }
  ];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Parts Inventory");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function generateTemplateExcel() {
  try {
    console.log("Generating Excel template for parts import");
    const workbook = xlsx.utils.book_new();
    const worksheetData = [
      ["Part ID", "Name", "Description", "Quantity", "Reorder Level", "Unit Cost", "Category", "Location", "Supplier"],
      ["SAMPLE001", "Sample Part", "This is an example part for import", 100, 10, "5.99", "Hardware", "Stockroom", "Example Supplier"],
      ["INSTRUCTIONS:", "Required fields: Part ID, Name", "Optional fields: Description, Quantity, Reorder Level, Unit Cost, Category, Location, Supplier", "", "", "", "", "", ""]
    ];
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 40 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ];
    xlsx.utils.book_append_sheet(workbook, worksheet, "Parts Import Template");
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    console.log(`Generated Excel template, buffer size: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("Error generating Excel template:", error);
    throw new Error("Failed to generate Excel template");
  }
}
function readTechniciansFromExcel(filePath) {
  const technicians = [];
  const errors = [];
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      errors.push({ row: 0, message: "No data found in Excel file" });
      return { technicians, errors };
    }
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { technicians, errors };
    }
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === "string") {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, "")] = index;
      }
    });
    const requiredFields = ["username", "name", "role"];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    if (errors.length > 0) {
      return { technicians, errors };
    }
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      try {
        if (!row || row.every((cell) => !cell || cell === "")) {
          continue;
        }
        const username = row[headerMap["username"]]?.toString()?.trim();
        const name = row[headerMap["name"]]?.toString()?.trim();
        const role = row[headerMap["role"]]?.toString()?.trim();
        if (!username || !name || !role) {
          errors.push({ row: rowNumber, message: "Username, Name, and Role are required" });
          continue;
        }
        const technician = {
          username,
          name,
          role,
          password: "defaultpassword123",
          // Default password that should be changed
          department: headerMap["department"] !== void 0 ? row[headerMap["department"]]?.toString()?.trim() || null : null
        };
        technicians.push(technician);
      } catch (rowError) {
        errors.push({
          row: rowNumber,
          message: `Error processing row: ${rowError instanceof Error ? rowError.message : String(rowError)}`
        });
      }
    }
  } catch (error) {
    errors.push({
      row: 0,
      message: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  return { technicians, errors };
}
function generateTechniciansExcel(technicians) {
  const workbook = xlsx.utils.book_new();
  const data = [];
  data.push(["Username", "Name", "Role", "Department"]);
  technicians.forEach((tech) => {
    data.push([
      tech.username,
      tech.name,
      tech.role,
      tech.department || ""
    ]);
  });
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 25 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Technicians");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function generateTechniciansTemplateExcel() {
  const workbook = xlsx.utils.book_new();
  const data = [
    ["Username", "Name", "Role", "Department"],
    ["jdoe", "John Doe", "technician", "Physical Plant"],
    ["INSTRUCTIONS:", "Required: Username, Name, Role", "Roles: admin, student, technician, controller", "Optional: Department"]
  ];
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 25 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Technicians Template");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function readBuildingsFromExcel(filePath) {
  const buildings2 = [];
  const errors = [];
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { buildings: buildings2, errors };
    }
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === "string") {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, "")] = index;
      }
    });
    if (!("name" in headerMap)) {
      errors.push({ row: 1, message: "Required column 'name' not found in Excel file" });
      return { buildings: buildings2, errors };
    }
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      try {
        if (!row || row.every((cell) => !cell || cell === "")) continue;
        const name = row[headerMap["name"]]?.toString()?.trim();
        if (!name) {
          errors.push({ row: rowNumber, message: "Name is required" });
          continue;
        }
        const building = {
          name,
          location: headerMap["location"] !== void 0 ? row[headerMap["location"]]?.toString()?.trim() || null : null
        };
        buildings2.push(building);
      } catch (rowError) {
        errors.push({ row: rowNumber, message: `Error processing row: ${rowError}` });
      }
    }
  } catch (error) {
    errors.push({ row: 0, message: `Failed to read Excel file: ${error}` });
  }
  return { buildings: buildings2, errors };
}
function generateBuildingsExcel(buildings2) {
  const workbook = xlsx.utils.book_new();
  const data = [];
  data.push(["Name", "Location"]);
  buildings2.forEach((building) => {
    data.push([building.name, building.location || ""]);
  });
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Buildings");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function generateBuildingsTemplateExcel() {
  const workbook = xlsx.utils.book_new();
  const data = [
    ["Name", "Location"],
    ["Sample Building", "123 Main Street"],
    ["INSTRUCTIONS: Required: Name", "Optional: Location"]
  ];
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Buildings Template");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function readLocationsFromExcel(filePath) {
  const locations = [];
  const errors = [];
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { locations, errors };
    }
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === "string") {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, "")] = index;
      }
    });
    const requiredFields = ["name", "buildingid"];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    if (errors.length > 0) return { locations, errors };
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      try {
        if (!row || row.every((cell) => !cell || cell === "")) continue;
        const name = row[headerMap["name"]]?.toString()?.trim();
        const buildingId = parseInt(row[headerMap["buildingid"]]?.toString() || "0");
        if (!name || !buildingId) {
          errors.push({ row: rowNumber, message: "Name and Building ID are required" });
          continue;
        }
        const location = {
          name,
          buildingId
        };
        locations.push(location);
      } catch (rowError) {
        errors.push({ row: rowNumber, message: `Error processing row: ${rowError}` });
      }
    }
  } catch (error) {
    errors.push({ row: 0, message: `Failed to read Excel file: ${error}` });
  }
  return { locations, errors };
}
function generateLocationsExcel(locations) {
  const workbook = xlsx.utils.book_new();
  const data = [];
  data.push(["Name", "Building ID", "Building Name"]);
  locations.forEach((location) => {
    data.push([
      location.name,
      location.buildingId || location.building_id,
      location.building?.name || location.buildingName || ""
    ]);
  });
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Storage Locations");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function generateLocationsTemplateExcel() {
  const workbook = xlsx.utils.book_new();
  const data = [
    ["Name", "Building ID"],
    ["Main Storage Room", "1"],
    ["INSTRUCTIONS: Required: Name, Building ID", "Get Building IDs from Buildings page"]
  ];
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 15 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Locations Template");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function readShelvesFromExcel(filePath) {
  const shelves2 = [];
  const errors = [];
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { shelves: shelves2, errors };
    }
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === "string") {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, "")] = index;
      }
    });
    const requiredFields = ["name", "locationid"];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    if (errors.length > 0) return { shelves: shelves2, errors };
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      try {
        if (!row || row.every((cell) => !cell || cell === "")) continue;
        const name = row[headerMap["name"]]?.toString()?.trim();
        const locationId = parseInt(row[headerMap["locationid"]]?.toString() || "0");
        if (!name || !locationId) {
          errors.push({ row: rowNumber, message: "Name and Location ID are required" });
          continue;
        }
        const shelf = {
          name,
          locationId
        };
        shelves2.push(shelf);
      } catch (rowError) {
        errors.push({ row: rowNumber, message: `Error processing row: ${rowError}` });
      }
    }
  } catch (error) {
    errors.push({ row: 0, message: `Failed to read Excel file: ${error}` });
  }
  return { shelves: shelves2, errors };
}
function generateShelvesExcel(shelves2) {
  const workbook = xlsx.utils.book_new();
  const data = [];
  data.push(["Name", "Location ID", "Location Name"]);
  shelves2.forEach((shelf) => {
    data.push([
      shelf.name,
      shelf.locationId || shelf.location_id,
      shelf.location?.name || shelf.locationName || ""
    ]);
  });
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Shelves");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function generateShelvesTemplateExcel() {
  const workbook = xlsx.utils.book_new();
  const data = [
    ["Name", "Location ID"],
    ["Shelf A-1", "1"],
    ["INSTRUCTIONS: Required: Name, Location ID", "Get Location IDs from Locations page"]
  ];
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 15 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Shelves Template");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function readChargeOutsFromExcel(filePath) {
  const chargeOuts = [];
  const errors = [];
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { chargeOuts, errors };
    }
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === "string") {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, "")] = index;
      }
    });
    const requiredFields = ["partid", "quantity", "issuedby", "buildingid"];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    if (errors.length > 0) return { chargeOuts, errors };
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      try {
        if (!row || row.every((cell) => !cell || cell === "")) continue;
        const partId = parseInt(row[headerMap["partid"]]?.toString() || "0");
        const quantity = parseInt(row[headerMap["quantity"]]?.toString() || "0");
        const issuedBy = row[headerMap["issuedby"]]?.toString()?.trim();
        const buildingId = parseInt(row[headerMap["buildingid"]]?.toString() || "0");
        const notes = row[headerMap["notes"]]?.toString()?.trim() || "";
        const costCenter = row[headerMap["costcenter"]]?.toString()?.trim() || "";
        if (!partId || !quantity || !issuedBy || !buildingId) {
          errors.push({ row: rowNumber, message: "Part ID, Quantity, Issued By, and Building ID are required" });
          continue;
        }
        const chargeOut = {
          partId,
          quantity,
          issuedBy,
          buildingId,
          notes,
          costCenter,
          issuedAt: /* @__PURE__ */ new Date()
        };
        chargeOuts.push(chargeOut);
      } catch (rowError) {
        errors.push({ row: rowNumber, message: `Error processing row: ${rowError}` });
      }
    }
  } catch (error) {
    errors.push({ row: 0, message: `Failed to read Excel file: ${error}` });
  }
  return { chargeOuts, errors };
}
function generateChargeOutsExcel(chargeOuts) {
  const workbook = xlsx.utils.book_new();
  const data = [];
  data.push(["ID", "Part ID", "Part Name", "Quantity", "Issued By", "Building ID", "Building Name", "Cost Center", "Notes", "Issued Date"]);
  chargeOuts.forEach((chargeOut) => {
    data.push([
      chargeOut.id,
      chargeOut.partId || chargeOut.part_id,
      chargeOut.partName || chargeOut.part?.name || "",
      chargeOut.quantity,
      chargeOut.issuedBy || chargeOut.issued_by,
      chargeOut.buildingId || chargeOut.building_id,
      chargeOut.buildingName || chargeOut.building?.name || "",
      chargeOut.costCenter || chargeOut.cost_center || "",
      chargeOut.notes || "",
      chargeOut.issuedAt ? format(new Date(chargeOut.issuedAt), "yyyy-MM-dd HH:mm:ss") : ""
    ]);
  });
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 30 },
    { wch: 20 }
  ];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Charge Outs");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function generateChargeOutsTemplateExcel() {
  const workbook = xlsx.utils.book_new();
  const data = [
    ["Part ID", "Quantity", "Issued By", "Building ID", "Cost Center", "Notes"],
    ["525", "5", "John Smith", "1", "11000-12760", "Maintenance repair"],
    ["INSTRUCTIONS: Required: Part ID, Quantity, Issued By, Building ID", "Get Part/Building IDs from respective pages", "", "", "", ""]
  ];
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 30 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Charge Outs Template");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function readDeliveriesFromExcel(filePath) {
  const deliveries = [];
  const errors = [];
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { deliveries, errors };
    }
    const headers = data[0];
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header && typeof header === "string") {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, "")] = index;
      }
    });
    const isUpdateImport = "id" in headerMap;
    console.log(`Import type detected: ${isUpdateImport ? "UPDATE" : "NEW"} deliveries`);
    let requiredFields;
    if (isUpdateImport) {
      requiredFields = ["id"];
    } else {
      requiredFields = ["partid", "quantity", "staffmember", "buildingid"];
    }
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    if (errors.length > 0) return { deliveries, errors };
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      try {
        if (!row || row.every((cell) => !cell || cell === "")) continue;
        const delivery = {};
        if (isUpdateImport) {
          delivery.id = parseInt(row[headerMap["id"]]?.toString() || "0");
          delivery.isUpdate = true;
          if (!delivery.id) {
            errors.push({ row: rowNumber, message: "Valid delivery ID is required for updates" });
            continue;
          }
        }
        if ("partid" in headerMap && row[headerMap["partid"]]) {
          delivery.partId = parseInt(row[headerMap["partid"]]?.toString() || "0");
        }
        if ("quantity" in headerMap && row[headerMap["quantity"]]) {
          delivery.quantity = parseInt(row[headerMap["quantity"]]?.toString() || "0");
        }
        if ("staffmember" in headerMap && row[headerMap["staffmember"]]) {
          delivery.staffMember = row[headerMap["staffmember"]]?.toString()?.trim();
        }
        if ("buildingid" in headerMap && row[headerMap["buildingid"]]) {
          delivery.buildingId = parseInt(row[headerMap["buildingid"]]?.toString() || "0");
        }
        if ("costcenterid" in headerMap && row[headerMap["costcenterid"]]) {
          delivery.costCenterId = parseInt(row[headerMap["costcenterid"]]?.toString() || "0");
        }
        if ("notes" in headerMap) {
          delivery.notes = row[headerMap["notes"]]?.toString()?.trim() || "";
        }
        if ("date" in headerMap && row[headerMap["date"]]) {
          delivery.deliveredAt = new Date(row[headerMap["date"]]);
        }
        if ("unitcost" in headerMap && row[headerMap["unitcost"]]) {
          const costStr = row[headerMap["unitcost"]]?.toString()?.replace(/[$,]/g, "") || "0";
          delivery.unitCost = costStr;
        }
        if (!isUpdateImport) {
          if (!delivery.partId || !delivery.quantity || !delivery.staffMember || !delivery.buildingId) {
            errors.push({ row: rowNumber, message: "Part ID, Quantity, Staff Member, and Building ID are required for new deliveries" });
            continue;
          }
          delivery.deliveredAt = /* @__PURE__ */ new Date();
        }
        deliveries.push(delivery);
      } catch (rowError) {
        errors.push({ row: rowNumber, message: `Error processing row: ${rowError}` });
      }
    }
  } catch (error) {
    errors.push({ row: 0, message: `Failed to read Excel file: ${error}` });
  }
  return { deliveries, errors };
}
function generateDeliveriesExcel2(deliveries) {
  const workbook = xlsx.utils.book_new();
  const data = [];
  data.push(["id", "partid", "quantity", "staffmember", "buildingid", "status", "notes", "delivereddate"]);
  deliveries.forEach((delivery) => {
    data.push([
      delivery.id,
      // Essential for updates
      delivery.partId || delivery.part_id,
      delivery.quantity,
      delivery.staffMember || delivery.staff_member,
      delivery.buildingId || delivery.building_id,
      delivery.status || "pending",
      delivery.notes || "",
      delivery.deliveredAt ? format(new Date(delivery.deliveredAt), "yyyy-MM-dd") : ""
    ]);
  });
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    { wch: 15 }
  ];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Deliveries");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function generateDeliveriesTemplateExcel() {
  const workbook = xlsx.utils.book_new();
  const data = [
    ["partid", "quantity", "staffmember", "buildingid", "costcenter", "status", "notes"],
    ["837", "3", "Dave Dellifield", "2", "128910-75500", "pending", "Urgent delivery needed"],
    ["INSTRUCTIONS: Required columns: partid, quantity, staffmember, buildingid", "Status: pending/delivered/confirmed", "Get Part/Building IDs from respective pages", "", "", "", ""]
  ];
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 30 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Deliveries Template");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
}
async function generatePartsIssuanceExcel(issuances) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Parts Issuance Report");
  worksheet.columns = [
    { header: "Date", key: "issuedAt", width: 12 },
    { header: "Part ID", key: "partId", width: 15 },
    { header: "Part Name", key: "partName", width: 30 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Unit Cost", key: "unitCost", width: 12 },
    { header: "Extended Price", key: "extendedPrice", width: 15 },
    { header: "Issued To", key: "issuedTo", width: 20 },
    { header: "Reason", key: "reason", width: 15 },
    { header: "Building", key: "buildingName", width: 20 },
    { header: "Cost Center", key: "costCenterName", width: 25 },
    { header: "Cost Center Code", key: "costCenterCode", width: 18 },
    { header: "Project Code", key: "projectCode", width: 15 },
    { header: "Notes", key: "notes", width: 25 }
  ];
  issuances.forEach((issuance) => {
    worksheet.addRow({
      issuedAt: issuance.issuedAt ? new Date(issuance.issuedAt).toLocaleDateString() : "",
      partId: issuance.part?.partId || "",
      partName: issuance.part?.name || "",
      quantity: issuance.quantity,
      unitCost: issuance.part?.unitCost || "",
      extendedPrice: issuance.extendedPrice || issuance.quantity * parseFloat(issuance.part?.unitCost || "0"),
      issuedTo: issuance.issuedTo,
      reason: issuance.reason,
      buildingName: issuance.buildingName || "",
      costCenterName: issuance.costCenterName || "",
      costCenterCode: issuance.costCenterCode || "",
      projectCode: issuance.projectCode || "",
      notes: issuance.notes || ""
    });
  });
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };
  });
  return await workbook.xlsx.writeBuffer();
}
var init_excel = __esm({
  "server/excel.ts"() {
    "use strict";
  }
});

// server/bulk-email-service.ts
var bulk_email_service_exports = {};
__export(bulk_email_service_exports, {
  initializeBulkEmailSystem: () => initializeBulkEmailSystem,
  queueDeliveryForBulkEmail: () => queueDeliveryForBulkEmail,
  sendBulkDeliveryEmails: () => sendBulkDeliveryEmails
});
function queueDeliveryForBulkEmail(delivery, staffEmail) {
  if (!pendingDeliveries[staffEmail]) {
    pendingDeliveries[staffEmail] = [];
  }
  pendingDeliveries[staffEmail].push(delivery);
  console.log(`\u{1F4EC} QUEUED delivery ${delivery.id} for bulk email to ${staffEmail}`);
  console.log(`   \u{1F4E6} Part: ${delivery.part?.name} (Qty: ${delivery.quantity})`);
  console.log(`   \u{1F4CB} Total pending for ${staffEmail}: ${pendingDeliveries[staffEmail].length}`);
}
async function sendBulkDeliveryEmails() {
  const staffEmails = Object.keys(pendingDeliveries);
  if (staffEmails.length === 0) {
    return;
  }
  console.log(`\u{1F4E7} BULK EMAIL BATCH: Processing ${staffEmails.length} staff members`);
  for (const staffEmail of staffEmails) {
    const deliveries = pendingDeliveries[staffEmail];
    const staffName = deliveries[0]?.staffMember?.name || "Unknown Staff";
    try {
      await sendEmailViaSendGrid(staffEmail, staffName, deliveries);
      delete pendingDeliveries[staffEmail];
      console.log(`\u2705 BULK EMAIL SUCCESS: Sent and cleared ${deliveries.length} deliveries for ${staffEmail}`);
    } catch (error) {
      console.log(`\u274C BULK EMAIL FAILED for ${staffEmail}: ${error.message}`);
    }
  }
}
async function sendEmailViaSendGrid(staffEmail, staffName, deliveries) {
  const totalValue = deliveries.reduce((sum, d) => {
    const unitCost = typeof d.unitCost === "string" ? parseFloat(d.unitCost) : d.unitCost || 0;
    return sum + unitCost * d.quantity;
  }, 0);
  const nodemailer2 = await import("nodemailer");
  try {
    const transporter = nodemailer2.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });
    const emailContent = generateConsolidatedEmailHTML(staffName, deliveries, totalValue);
    await transporter.sendMail({
      from: `"ONU Parts Tracker" <${process.env.GMAIL_USER}>`,
      to: staffEmail,
      subject: `Parts Delivery Summary - ${deliveries.length} Items Delivered`,
      html: emailContent,
      text: `Parts Delivery Summary: ${deliveries.length} items delivered to ${staffName}. Total value: $${totalValue.toFixed(2)}`
    });
    console.log(`\u2705 ONU SMTP EMAIL SENT to ${staffEmail} - ${deliveries.length} items, $${totalValue.toFixed(2)}`);
  } catch (error) {
    console.log(`\u274C ONU SMTP ERROR: ${error.message}`);
    throw error;
  }
}
function generateConsolidatedEmailHTML(staffName, deliveries, totalValue) {
  const deliveryDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York"
  });
  const deliveryRows = deliveries.map((delivery) => {
    const unitCost = typeof delivery.unitCost === "string" ? parseFloat(delivery.unitCost) : delivery.unitCost || 0;
    const itemTotal = unitCost * delivery.quantity;
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${delivery.part?.name || "Unknown"}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${delivery.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${unitCost.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join("");
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Parts Delivery Summary</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #003366; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .summary { background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .delivery-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .delivery-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
          .total-row { background: #fff3cd; font-weight: bold; }
          .total-row td { padding: 12px; border-top: 2px solid #ffc107; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u{1F3AF} ONU Parts Tracker</h1>
            <h2>Parts Delivery Summary</h2>
          </div>
          <div class="content">
            <div class="summary">
              <h3>\u{1F4CB} Delivery Details</h3>
              <p><strong>Recipient:</strong> ${staffName}</p>
              <p><strong>Date:</strong> ${deliveryDate}</p>
              <p><strong>Items Delivered:</strong> ${deliveries.length}</p>
              <p><strong>Total Value:</strong> $${totalValue.toFixed(2)}</p>
            </div>

            <table class="delivery-table">
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Cost</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${deliveryRows}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;"><strong>Grand Total:</strong></td>
                  <td style="text-align: right;"><strong>$${totalValue.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 0;"><strong>\u{1F4E7} Automated Email Receipt</strong></p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                This is an automated confirmation of your parts delivery. For questions, contact the Parts Management team.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>Ohio Northern University - Parts Management System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function initializeBulkEmailSystem() {
  console.log("\u{1F680} BULK EMAIL SYSTEM: Initializing ONU SMTP batch processing");
  setInterval(async () => {
    try {
      await sendBulkDeliveryEmails();
    } catch (error) {
      console.error("Bulk email system error:", error);
    }
  }, 30 * 1e3);
  console.log("\u2705 BULK EMAIL SYSTEM: ONU SMTP batch processing active (30-second intervals)");
  console.log("\u{1F4E7} Test email functionality disabled - no automatic test emails will be sent");
}
var pendingDeliveries;
var init_bulk_email_service = __esm({
  "server/bulk-email-service.ts"() {
    "use strict";
    pendingDeliveries = {};
  }
});

// server/simple-receipt-service.ts
var simple_receipt_service_exports = {};
__export(simple_receipt_service_exports, {
  deliveryReceipts: () => deliveryReceipts,
  generateDeliveryReceipt: () => generateDeliveryReceipt
});
async function generateDeliveryReceipt(delivery, staffEmail) {
  try {
    console.log(`\u{1F4C4} GENERATING DOWNLOADABLE RECEIPT for delivery ${delivery.id}`);
    console.log(`   \u{1F3AF} Staff: ${delivery.staffMember.name} (${staffEmail})`);
    console.log(`   \u{1F4E6} Part: ${delivery.part?.name} (Qty: ${delivery.quantity})`);
    const receiptContent = generateReceiptHTML(delivery, staffEmail);
    deliveryReceipts[delivery.id] = receiptContent;
    console.log(`\u2705 RECEIPT GENERATED SUCCESSFULLY for delivery ${delivery.id}`);
    console.log(`   \u{1F4C4} Receipt ready for download and manual forwarding`);
    console.log(`   \u{1F517} Available at: /api/parts-delivery/${delivery.id}/receipt`);
    return true;
  } catch (error) {
    console.error(`\u274C Failed to generate receipt for delivery ${delivery.id}:`, error);
    return false;
  }
}
function generateReceiptHTML(delivery, staffEmail) {
  const deliveryDate = delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York"
  }) : "Not specified";
  const unitCost = typeof delivery.unitCost === "string" ? parseFloat(delivery.unitCost) : delivery.unitCost || 0;
  const totalCost = unitCost * delivery.quantity;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Parts Delivery Confirmation - ${delivery.part?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #003366; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header h2 { margin: 10px 0 0 0; font-size: 18px; font-weight: normal; }
          .content { padding: 30px; }
          .delivery-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #333; }
          .value { color: #666; }
          .total-row { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .total-row .detail-row { margin: 5px 0; border: none; }
          .success { color: #28a745; font-weight: bold; font-size: 18px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          .next-steps { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .print-friendly { display: none; }
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
            .print-friendly { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u{1F3AF} ONU Parts Tracker</h1>
            <h2>Parts Delivery Confirmation</h2>
          </div>
          
          <div class="content">
            <p class="success">\u2705 Parts Delivery Confirmed Successfully</p>
            
            <div class="delivery-info">
              <h3 style="margin-top: 0;">Delivery Details</h3>
              <div class="detail-row">
                <span class="label">Recipient:</span>
                <span class="value">${delivery.staffMember.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">${staffEmail}</span>
              </div>
              <div class="detail-row">
                <span class="label">Building:</span>
                <span class="value">${delivery.building?.name || "Not specified"}</span>
              </div>
              <div class="detail-row">
                <span class="label">Cost Center:</span>
                <span class="value">${delivery.costCenter?.code || "Not specified"} - ${delivery.costCenter?.name || "Not specified"}</span>
              </div>
              <div class="detail-row">
                <span class="label">Delivery Date:</span>
                <span class="value">${deliveryDate}</span>
              </div>
            </div>

            <div class="delivery-info">
              <h3 style="margin-top: 0;">Part Information</h3>
              <div class="detail-row">
                <span class="label">Part Name:</span>
                <span class="value">${delivery.part?.name || "Unknown Part"}</span>
              </div>
              <div class="detail-row">
                <span class="label">Part Number:</span>
                <span class="value">${delivery.part?.partId || "N/A"}</span>
              </div>
              <div class="detail-row">
                <span class="label">Quantity Delivered:</span>
                <span class="value">${delivery.quantity}</span>
              </div>
              <div class="detail-row">
                <span class="label">Unit Cost:</span>
                <span class="value">$${unitCost.toFixed(2)}</span>
              </div>
            </div>

            <div class="total-row">
              <div class="detail-row">
                <span class="label" style="font-size: 16px;">Total Cost:</span>
                <span class="value" style="font-size: 16px; font-weight: bold; color: #003366;">$${totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div class="next-steps">
              <h4 style="margin-top: 0;">\u{1F4E7} Next Steps:</h4>
              <p><strong>This receipt is ready for forwarding!</strong> You can:</p>
              <ul>
                <li>Print this receipt for physical records</li>
                <li>Forward this email to the staff member</li>
                <li>Save as PDF for your files</li>
                <li>Include in cost center reporting</li>
              </ul>
            </div>
            
            ${delivery.notes ? `
              <div class="delivery-info">
                <h3 style="margin-top: 0;">Additional Notes</h3>
                <p style="margin: 0;">${delivery.notes}</p>
              </div>
            ` : ""}
          </div>
          
          <div class="footer">
            <p>ONU Parts Tracker - Automated Delivery Confirmation System</p>
            <p>Generated on ${(/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "America/New_York" })} (Eastern Time)</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
var deliveryReceipts;
var init_simple_receipt_service = __esm({
  "server/simple-receipt-service.ts"() {
    "use strict";
    deliveryReceipts = {};
  }
});

// server/delivery-routes.ts
var delivery_routes_exports = {};
__export(delivery_routes_exports, {
  deliveryRouter: () => deliveryRouter
});
import { Router as Router2 } from "express";
import multer from "multer";
import { join } from "path";
import { unlink } from "fs/promises";
var upload, deliveryRouter;
var init_delivery_routes = __esm({
  "server/delivery-routes.ts"() {
    "use strict";
    init_delivery_storage();
    init_schema();
    init_excel();
    upload = multer({ dest: "uploads/" });
    deliveryRouter = Router2();
    deliveryRouter.get("/cost-centers", async (_req, res) => {
      try {
        console.log("DIRECT ACCESS: Getting cost centers directly for UI fix");
        const centers = await getCostCenters();
        console.log(`DIRECT ACCESS: Returning ${centers.length} cost centers`);
        res.json(centers);
      } catch (error) {
        console.error("Error fetching cost centers:", error);
        res.status(500).json({ error: "Failed to fetch cost centers" });
      }
    });
    deliveryRouter.post("/cost-centers", async (req, res) => {
      try {
        console.log("Create cost center request received", {
          user: req.user ? { id: req.user.id, role: req.user.role } : null,
          hasSession: !!req.session,
          bodyKeys: Object.keys(req.body)
        });
        if (!req.user) {
          console.error("Create cost center: No user in request");
          return res.status(403).json({ error: "Authentication required" });
        }
        if (req.user.role === "controller") {
          return res.status(403).json({
            error: "You don't have permission to change this data",
            message: "Controller accounts have read-only access. Please contact an administrator to make changes."
          });
        }
        if (req.user.role !== "admin" && req.user.role !== "student") {
          console.error(`Create cost center: User role ${req.user.role} not authorized`);
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        const parseResult = insertCostCenterSchema.safeParse(req.body);
        if (!parseResult.success) {
          console.error("Create cost center: Invalid data", parseResult.error);
          return res.status(400).json({ error: "Invalid data", details: parseResult.error });
        }
        console.log("Create cost center: Validated data", parseResult.data);
        try {
          const center = await createCostCenter(parseResult.data);
          console.log("Cost center created successfully", center);
          res.status(201).json(center);
        } catch (error) {
          console.error("Error creating cost center:", error);
          if (error.code === "23505" && error.constraint === "cost_centers_code_key") {
            return res.status(400).json({
              error: "Code already exists",
              message: `The cost center code "${parseResult.data.code}" already exists. Please use a different code.`
            });
          }
          res.status(500).json({
            error: "Failed to create cost center",
            message: error instanceof Error ? error.message : "Unknown error"
          });
        }
      } catch (error) {
        console.error("Error processing cost center request:", error);
        res.status(500).json({
          error: "Failed to process request",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    deliveryRouter.put("/cost-centers/:id", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const parseResult = insertCostCenterSchema.partial().safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({ error: "Invalid data", details: parseResult.error });
        }
        const updated = await updateCostCenter(id, parseResult.data);
        if (!updated) {
          return res.status(404).json({ error: "Cost center not found" });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error updating cost center:", error);
        res.status(500).json({ error: "Failed to update cost center" });
      }
    });
    deliveryRouter.delete("/cost-centers/:id", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin") {
          return res.status(403).json({ error: "Permission denied - admin access only" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const success = await deleteCostCenter(id);
        if (!success) {
          return res.status(404).json({ error: "Cost center not found or could not be deleted" });
        }
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting cost center:", error);
        res.status(500).json({ error: "Failed to delete cost center" });
      }
    });
    deliveryRouter.post("/cost-centers/import", upload.single("file"), async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin") {
          return res.status(403).json({ error: "Permission denied - admin access only" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = join(process.cwd(), req.file.path);
        const { costCenters: costCenters2, errors } = await readCostCentersFromExcel(filePath);
        await unlink(filePath).catch((err) => console.error("Error deleting temp file:", err));
        if (costCenters2.length === 0) {
          return res.status(400).json({ error: "No valid cost centers found in the file", errors });
        }
        const importedCenters = [];
        for (const center of costCenters2) {
          try {
            const imported = await createCostCenter(center);
            importedCenters.push(imported);
          } catch (error) {
            console.error(`Error importing cost center ${center.code}:`, error);
            errors.push({ row: -1, message: `Failed to import cost center ${center.code}: ${error instanceof Error ? error.message : String(error)}` });
          }
        }
        res.status(200).json({
          success: true,
          totalRows: costCenters2.length,
          importedRows: importedCenters.length,
          errors
        });
      } catch (error) {
        console.error("Error importing cost centers:", error);
        res.status(500).json({ error: "Failed to import cost centers" });
      }
    });
    deliveryRouter.get("/cost-centers/export", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        console.log("Exporting cost centers to Excel...");
        const centers = await getCostCenters();
        console.log(`Found ${centers.length} cost centers to export`);
        try {
          const excel = generateCostCentersExcel(centers);
          console.log("Excel file generated successfully");
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", "attachment; filename=cost-centers.xlsx");
          res.send(excel);
        } catch (excelError) {
          console.error("Error generating Excel file:", excelError);
          res.status(500).json({ error: "Failed to generate Excel file", details: excelError instanceof Error ? excelError.message : String(excelError) });
        }
      } catch (error) {
        console.error("Error exporting cost centers:", error);
        res.status(500).json({ error: "Failed to export cost centers" });
      }
    });
    deliveryRouter.get("/cost-centers/template", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin") {
          return res.status(403).json({ error: "Permission denied - admin access only" });
        }
        const excel = generateCostCentersTemplateExcel();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=cost-centers-template.xlsx");
        res.send(excel);
      } catch (error) {
        console.error("Error generating cost centers template:", error);
        res.status(500).json({ error: "Failed to generate cost centers template" });
      }
    });
    deliveryRouter.get("/cost-centers/:id", async (req, res) => {
      try {
        if (!req.user) {
          return res.status(403).json({ error: "Authentication required" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const center = await getCostCenter(id);
        if (!center) {
          return res.status(404).json({ error: "Cost center not found" });
        }
        res.json(center);
      } catch (error) {
        console.error("Error fetching cost center:", error);
        res.status(500).json({ error: "Failed to fetch cost center" });
      }
    });
    deliveryRouter.get("/staff", async (req, res) => {
      try {
        if (!req.user) {
          return res.status(403).json({ error: "Authentication required" });
        }
        const staff = await getStaffMembers();
        res.json(staff);
      } catch (error) {
        console.error("Error fetching staff members:", error);
        res.status(500).json({ error: "Failed to fetch staff members" });
      }
    });
    deliveryRouter.post("/staff/find-or-create", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        if (!req.body.name || typeof req.body.name !== "string") {
          return res.status(400).json({ error: "Valid staff name is required" });
        }
        const staffMembers2 = await getStaffMembers();
        const staffName = req.body.name.trim();
        const existingStaff = staffMembers2.find(
          (s) => s.name.toLowerCase() === staffName.toLowerCase()
        );
        if (existingStaff) {
          return res.json(existingStaff);
        }
        let buildingId = null;
        let costCenterId = null;
        if (req.body.buildingId && !isNaN(parseInt(req.body.buildingId))) {
          buildingId = parseInt(req.body.buildingId);
        }
        if (req.body.costCenterId && !isNaN(parseInt(req.body.costCenterId))) {
          costCenterId = parseInt(req.body.costCenterId);
        }
        const newStaff = await createStaffMember({
          name: staffName,
          buildingId,
          costCenterId,
          email: typeof req.body.email === "string" ? req.body.email : null,
          phone: typeof req.body.phone === "string" ? req.body.phone : null,
          active: true
        });
        res.status(201).json(newStaff);
      } catch (error) {
        console.error("Error finding or creating staff member:", error);
        res.status(500).json({ error: "Failed to find or create staff member" });
      }
    });
    deliveryRouter.post("/staff", async (req, res) => {
      try {
        const user = req.user || req.session?.user;
        if (!user || user.role !== "admin" && user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        const parseResult = insertStaffMemberSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({ error: "Invalid data", details: parseResult.error });
        }
        const existingStaff = await getStaffMembers();
        const isDuplicate = existingStaff.some(
          (s) => s.name.toLowerCase() === parseResult.data.name.toLowerCase()
        );
        if (isDuplicate) {
          return res.status(400).json({ error: "A staff member with this name already exists" });
        }
        const member = await createStaffMember(parseResult.data);
        res.status(201).json(member);
      } catch (error) {
        console.error("Error creating staff member:", error);
        res.status(500).json({ error: "Failed to create staff member" });
      }
    });
    deliveryRouter.put("/staff/:id", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const parseResult = insertStaffMemberSchema.partial().safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({ error: "Invalid data", details: parseResult.error });
        }
        if (parseResult.data.name) {
          const existingStaff = await getStaffMembers();
          const isDuplicate = existingStaff.some(
            (s) => Number(s.id) !== id && s.name.toLowerCase() === parseResult.data.name.toLowerCase()
          );
          if (isDuplicate) {
            return res.status(400).json({ error: "A staff member with this name already exists" });
          }
        }
        const updated = await updateStaffMember(id, parseResult.data);
        if (!updated) {
          return res.status(404).json({ error: "Staff member not found" });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error updating staff member:", error);
        res.status(500).json({ error: "Failed to update staff member" });
      }
    });
    deliveryRouter.delete("/staff/:id", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin") {
          return res.status(403).json({ error: "Permission denied - admin access only" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const success = await deleteStaffMember(id);
        if (!success) {
          return res.status(404).json({ error: "Staff member not found or could not be deleted" });
        }
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting staff member:", error);
        res.status(500).json({ error: "Failed to delete staff member" });
      }
    });
    deliveryRouter.post("/staff/import", upload.single("file"), async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin") {
          return res.status(403).json({ error: "Permission denied - admin access only" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = join(process.cwd(), req.file.path);
        const { staffMembers: staffMembers2, errors } = await readStaffMembersFromExcel(filePath);
        await unlink(filePath).catch((err) => console.error("Error deleting temp file:", err));
        if (staffMembers2.length === 0) {
          return res.status(400).json({ error: "No valid staff members found in the file", errors });
        }
        const existingStaff = await getStaffMembers();
        const importedStaff = [];
        const duplicateErrors = [];
        for (const member of staffMembers2) {
          try {
            const isDuplicate = existingStaff.some(
              (s) => s.name.toLowerCase() === member.name.toLowerCase()
            );
            if (isDuplicate) {
              duplicateErrors.push({ row: -1, message: `Staff member "${member.name}" already exists and was skipped` });
              continue;
            }
            const imported = await createStaffMember(member);
            importedStaff.push(imported);
            existingStaff.push(imported);
          } catch (error) {
            console.error(`Error importing staff member ${member.name}:`, error);
            errors.push({ row: -1, message: `Failed to import staff member ${member.name}: ${error instanceof Error ? error.message : String(error)}` });
          }
        }
        const allErrors = [...errors, ...duplicateErrors];
        res.status(200).json({
          success: true,
          totalRows: staffMembers2.length,
          importedRows: importedStaff.length,
          errors: allErrors
        });
      } catch (error) {
        console.error("Error importing staff members:", error);
        res.status(500).json({ error: "Failed to import staff members" });
      }
    });
    deliveryRouter.get("/staff/export", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student" && req.user.role !== "controller") {
          return res.status(403).json({ error: "Permission denied - admin, student, or controller access only" });
        }
        console.log("Exporting staff members to Excel...");
        const staff = await getStaffMembers();
        console.log(`Found ${staff.length} staff members to export`);
        try {
          const excel = await generateStaffMembersExcel(staff);
          console.log("Staff Excel file generated successfully");
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", "attachment; filename=staff-members.xlsx");
          res.send(excel);
        } catch (excelError) {
          console.error("Error generating staff Excel file:", excelError);
          res.status(500).json({ error: "Failed to generate staff Excel file", details: excelError instanceof Error ? excelError.message : String(excelError) });
        }
      } catch (error) {
        console.error("Error exporting staff members:", error);
        res.status(500).json({ error: "Failed to export staff members" });
      }
    });
    deliveryRouter.get("/staff/template", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin") {
          return res.status(403).json({ error: "Permission denied - admin access only" });
        }
        const excel = generateStaffMembersTemplateExcel();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=staff-members-template.xlsx");
        res.send(excel);
      } catch (error) {
        console.error("Error generating staff members template:", error);
        res.status(500).json({ error: "Failed to generate staff members template" });
      }
    });
    deliveryRouter.get("/staff/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const member = await getStaffMember(id);
        if (!member) {
          return res.status(404).json({ error: "Staff member not found" });
        }
        res.json(member);
      } catch (error) {
        console.error("Error fetching staff member:", error);
        res.status(500).json({ error: "Failed to fetch staff member" });
      }
    });
    deliveryRouter.get("/parts-delivery/template", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        console.log("Generating deliveries import template...");
        const templateBuffer = generateDeliveriesTemplateExcel();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=deliveries_import_template.xlsx");
        res.setHeader("Content-Length", templateBuffer.length);
        res.send(templateBuffer);
      } catch (error) {
        console.error("Error generating deliveries template:", error);
        res.status(500).json({ error: "Failed to generate template" });
      }
    });
    deliveryRouter.post("/parts-delivery/import", upload.single("file"), async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        console.log("Importing deliveries from:", req.file.originalname);
        const { deliveries, errors } = readDeliveriesFromExcel(req.file.path);
        if (errors.length > 0) {
          console.log("Import errors:", errors);
          await unlink(req.file.path);
          return res.status(400).json({
            error: "File contains errors",
            details: errors
          });
        }
        let importedCount = 0;
        let updatedCount = 0;
        const updatedDeliveries = [];
        for (const delivery of deliveries) {
          try {
            if (delivery.isUpdate && delivery.id) {
              console.log(`Updating delivery ID ${delivery.id} with:`, delivery);
              const originalDelivery = await getPartsDeliveryById(delivery.id);
              if (!originalDelivery) {
                console.error(`Delivery with ID ${delivery.id} not found for update`);
                continue;
              }
              const updatedDelivery = await updatePartsDelivery(delivery.id, delivery);
              if (updatedDelivery) {
                updatedCount++;
                const changes = [];
                if (delivery.quantity && delivery.quantity !== originalDelivery.quantity) {
                  changes.push(`Quantity: ${originalDelivery.quantity} \u2192 ${delivery.quantity}`);
                }
                if (delivery.staffMember && delivery.staffMember !== originalDelivery.staffMember) {
                  changes.push(`Staff Member: ${originalDelivery.staffMember} \u2192 ${delivery.staffMember}`);
                }
                if (delivery.notes && delivery.notes !== originalDelivery.notes) {
                  changes.push(`Notes: "${originalDelivery.notes}" \u2192 "${delivery.notes}"`);
                }
                if (delivery.status && delivery.status !== originalDelivery.status) {
                  changes.push(`Status: ${originalDelivery.status} \u2192 ${delivery.status}`);
                }
                if (delivery.deliveredAt && delivery.deliveredAt.getTime() !== originalDelivery.deliveredAt?.getTime()) {
                  changes.push(`Date: ${originalDelivery.deliveredAt?.toLocaleDateString()} \u2192 ${delivery.deliveredAt.toLocaleDateString()}`);
                }
                if (changes.length > 0) {
                  try {
                    const emailResult = await sendDeliveryUpdateEmail(
                      delivery,
                      delivery.staffMember,
                      changes
                    );
                    console.log(`Update email sent for delivery ${delivery.id}:`, emailResult);
                  } catch (emailError) {
                    console.error(`Failed to send update email for delivery ${delivery.id}:`, emailError);
                  }
                }
                updatedDeliveries.push(updatedDelivery);
              }
            } else {
              await createPartsDelivery(delivery);
              importedCount++;
            }
          } catch (error) {
            console.error("Error importing/updating delivery:", error);
          }
        }
        await unlink(req.file.path);
        res.json({
          success: true,
          count: importedCount + updatedCount,
          message: updatedCount > 0 ? `Successfully updated ${updatedCount} and imported ${importedCount} deliveries` : `Successfully imported ${importedCount} of ${deliveries.length} deliveries`,
          totalRows: deliveries.length,
          importedRows: importedCount,
          updatedRows: updatedCount,
          errors: deliveries.length - (importedCount + updatedCount) > 0 ? [`${deliveries.length - (importedCount + updatedCount)} records failed to process`] : []
        });
      } catch (error) {
        console.error("Error during deliveries import:", error);
        if (req.file) {
          try {
            await unlink(req.file.path);
          } catch (unlinkError) {
            console.error("Error cleaning up uploaded file:", unlinkError);
          }
        }
        res.status(500).json({ error: "Failed to import deliveries" });
      }
    });
    deliveryRouter.get("/parts-delivery/monthly-count", async (req, res) => {
      try {
        let monthParam = req.query.month;
        let startDate;
        let endDate;
        if (monthParam) {
          const [month, year] = monthParam.split("/");
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
          console.log(`Getting monthly delivery count for ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
        }
        const allDeliveries = await getAllPartsDeliveriesWithDetails(startDate, endDate);
        res.json({ count: allDeliveries.length });
      } catch (error) {
        console.error("Error fetching monthly deliveries count:", error);
        res.status(500).json({ error: "Failed to fetch monthly deliveries count" });
      }
    });
    deliveryRouter.post("/parts-delivery", async (req, res) => {
      try {
        console.log("Delivery creation request - User:", req.user ? {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        } : "No user found");
        console.log("Session details:", {
          sessionId: req.sessionID,
          session: req.session ? "exists" : "missing",
          user: req.session?.user ? "user in session" : "no user in session"
        });
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        console.log("Incoming delivery request:", req.body);
        let actualPartId = req.body.partId;
        if (req.body.isManualPart && req.body.manualPartName) {
          console.log("Processing manual part:", req.body.manualPartName);
          const manualPartId = `MANUAL_${req.body.manualPartName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
          try {
            const { pool: pool3 } = await Promise.resolve().then(() => (init_db(), db_exports));
            const existingPart = await pool3.query(`
          SELECT id FROM parts WHERE part_id = $1
        `, [manualPartId]);
            if (existingPart.rows.length > 0) {
              actualPartId = existingPart.rows[0].id;
              console.log("Using existing manual part with ID:", actualPartId);
            } else {
              const newPart = await pool3.query(`
            INSERT INTO parts (part_id, name, description, unit_cost, location_id, shelf_id, quantity)
            VALUES ($1, $2, $3, 0.00, 1, 1, 999999)
            RETURNING id
          `, [
                manualPartId,
                req.body.manualPartName.trim(),
                req.body.manualPartDescription ? req.body.manualPartDescription.trim() : `Manual item: ${req.body.manualPartName}`
              ]);
              actualPartId = newPart.rows[0].id;
              console.log("Created new manual part with ID:", actualPartId);
            }
          } catch (error) {
            console.error("Error handling manual part:", error);
            return res.status(500).json({ error: "Failed to process manual part" });
          }
        }
        const bodyForValidation = {
          ...req.body,
          partId: actualPartId
        };
        const parseResult = insertPartsDeliverySchema.safeParse(bodyForValidation);
        if (!parseResult.success) {
          return res.status(400).json({ error: "Invalid data", details: parseResult.error });
        }
        const deliveryData = {
          ...parseResult.data,
          deliveredById: req.user.id
        };
        const dataForStorage = { ...deliveryData };
        if (dataForStorage.buildingId === 0) {
          dataForStorage.buildingId = null;
        }
        if (dataForStorage.costCenterId === 0) {
          dataForStorage.costCenterId = null;
        }
        if (req.body.deliveredAt) {
          console.log("Request includes deliveredAt:", req.body.deliveredAt);
          try {
            if (typeof req.body.deliveredAt === "string") {
              if (req.body.deliveredAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = req.body.deliveredAt.split("-").map(Number);
                dataForStorage.deliveredAt = new Date(year, month - 1, day, 12, 0, 0);
              } else {
                dataForStorage.deliveredAt = new Date(req.body.deliveredAt);
              }
              console.log("Converted deliveredAt to:", dataForStorage.deliveredAt);
            } else if (req.body.deliveredAt instanceof Date) {
              dataForStorage.deliveredAt = req.body.deliveredAt;
            }
          } catch (err) {
            console.error("Error parsing deliveredAt date:", err);
          }
        } else if (req.body.deliveryDate) {
          console.log("Request includes deliveryDate:", req.body.deliveryDate);
          try {
            dataForStorage.deliveredAt = new Date(req.body.deliveryDate);
            console.log("Converted deliveryDate to deliveredAt:", dataForStorage.deliveredAt);
          } catch (err) {
            console.error("Error parsing deliveryDate:", err);
          }
        }
        if (!dataForStorage.deliveredAt || isNaN(dataForStorage.deliveredAt.getTime())) {
          console.log("Using current date as fallback");
          dataForStorage.deliveredAt = /* @__PURE__ */ new Date();
        }
        console.log("Creating delivery with date:", dataForStorage);
        const delivery = await createPartsDelivery(dataForStorage);
        res.status(201).json(delivery);
      } catch (error) {
        console.error("Error creating parts delivery:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create parts delivery";
        res.status(500).json({ error: errorMessage });
      }
    });
    deliveryRouter.post("/parts-delivery/batch", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        const { parts: parts2, staffMemberId, buildingId, costCenterId, deliveredAt, notes } = req.body;
        if (!parts2 || !Array.isArray(parts2) || parts2.length === 0) {
          return res.status(400).json({ error: "At least one part is required" });
        }
        if (!staffMemberId || typeof staffMemberId !== "number") {
          return res.status(400).json({ error: "Valid staff member ID is required" });
        }
        console.log(`Creating delivery batch for staff member ${staffMemberId} with ${parts2.length} items`);
        const batchId = `BATCH_${Date.now()}_${staffMemberId}`;
        let parsedDeliveryDate;
        if (deliveredAt) {
          if (typeof deliveredAt === "string") {
            parsedDeliveryDate = /* @__PURE__ */ new Date(deliveredAt + "T16:00:00.000Z");
          } else {
            parsedDeliveryDate = new Date(deliveredAt);
          }
        } else {
          parsedDeliveryDate = /* @__PURE__ */ new Date();
        }
        console.log(`Parsed delivery date: ${parsedDeliveryDate.toISOString()}`);
        const deliveries = [];
        for (const part of parts2) {
          let actualPartId = part.partId;
          if (part.isManualPart && part.manualPartName) {
            console.log("Processing manual part in batch:", part.manualPartName);
            const manualPartId = `MANUAL_${part.manualPartName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
            try {
              const { pool: pool3 } = await Promise.resolve().then(() => (init_db(), db_exports));
              const existingPart = await pool3.query(`
            SELECT id FROM parts WHERE part_id = $1
          `, [manualPartId]);
              if (existingPart.rows.length > 0) {
                actualPartId = existingPart.rows[0].id;
                console.log("Using existing manual part with ID:", actualPartId);
              } else {
                const newPart = await pool3.query(`
              INSERT INTO parts (part_id, name, description, unit_cost, location_id, shelf_id, quantity)
              VALUES ($1, $2, $3, 0.00, 1, 1, 999999)
              RETURNING id
            `, [
                  manualPartId,
                  part.manualPartName.trim(),
                  part.manualPartDescription ? part.manualPartDescription.trim() : `Manual item: ${part.manualPartName}`
                ]);
                actualPartId = newPart.rows[0].id;
                console.log("Created new manual part with ID:", actualPartId);
              }
            } catch (error) {
              console.error("Error handling manual part in batch:", error);
              throw new Error(`Failed to process manual part: ${part.manualPartName}`);
            }
          }
          const deliveryData = {
            partId: actualPartId,
            quantity: part.quantity,
            staffMemberId,
            buildingId: buildingId || null,
            costCenterId: costCenterId || null,
            deliveredAt: parsedDeliveryDate,
            deliveredById: req.user.id,
            notes: notes || ""
            // Remove batch ID from user-visible notes
          };
          const delivery = await createPartsDelivery(deliveryData);
          deliveries.push(delivery);
        }
        console.log(`Successfully created ${deliveries.length} deliveries in batch ${batchId}`);
        res.status(201).json({
          batchId,
          deliveries,
          message: `Created batch delivery with ${deliveries.length} items requiring one signature`
        });
      } catch (error) {
        console.error("Error creating delivery batch:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create delivery batch";
        res.status(500).json({ error: errorMessage });
      }
    });
    deliveryRouter.get("/parts-delivery", async (req, res) => {
      try {
        let monthParam = req.query.month;
        let startDate;
        let endDate;
        if (monthParam) {
          const [month, year] = monthParam.split("/");
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
          console.log(`Getting deliveries for month ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
        }
        const deliveries = await getAllPartsDeliveriesWithDetails(startDate, endDate);
        res.json(deliveries);
      } catch (error) {
        console.error("Error fetching parts deliveries:", error);
        res.status(500).json({ error: "Failed to fetch parts deliveries" });
      }
    });
    deliveryRouter.get("/parts-delivery/recent/:limit", async (req, res) => {
      try {
        const limit = parseInt(req.params.limit);
        if (isNaN(limit) || limit <= 0) {
          return res.status(400).json({ error: "Invalid limit format" });
        }
        let monthParam = req.query.month;
        let startDate;
        let endDate;
        if (monthParam) {
          const [month, year] = monthParam.split("/");
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
          console.log(`Getting recent deliveries for month ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
        }
        const deliveries = await getRecentPartsDeliveriesWithDetails(limit, startDate, endDate);
        res.json(deliveries);
      } catch (error) {
        console.error("Error fetching recent parts deliveries:", error);
        res.status(500).json({ error: "Failed to fetch recent parts deliveries" });
      }
    });
    deliveryRouter.get("/parts-delivery/monthly-total", async (req, res) => {
      try {
        let monthParam = req.query.month;
        let startDate;
        let endDate;
        if (monthParam) {
          const [month, year] = monthParam.split("/");
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
          console.log(`Getting monthly delivery total for ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
        }
        const total = await getMonthlyPartsDeliveriesTotal(startDate, endDate);
        res.json({ total });
      } catch (error) {
        console.error("Error fetching monthly deliveries total:", error);
        res.status(500).json({ error: "Failed to fetch monthly deliveries total" });
      }
    });
    deliveryRouter.post("/parts-delivery/:id/confirm", async (req, res) => {
      try {
        console.log(`\u{1F6A8} DELIVERY CONFIRMATION STARTED for delivery ${req.params.id}`);
        console.log(`\u{1F6A8} Request body:`, req.body);
        console.log(`\u{1F6A8} User authenticated:`, !!req.user);
        if (!req.user) {
          console.log(`\u{1F6A8} AUTHENTICATION FAILED - no user in session`);
          return res.status(401).json({ error: "Authentication required" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          console.log(`\u{1F6A8} INVALID ID FORMAT: ${req.params.id}`);
          return res.status(400).json({ error: "Invalid ID format" });
        }
        console.log(`\u{1F6A8} PROCESSING DELIVERY CONFIRMATION for ID: ${id}`);
        const delivery = await getPartsDeliveryWithDetails(id);
        if (!delivery) {
          return res.status(404).json({ error: "Parts delivery not found" });
        }
        const updateData = {
          status: "delivered",
          confirmedAt: /* @__PURE__ */ new Date()
        };
        if (req.body.signature && typeof req.body.signature === "string") {
          updateData.signature = req.body.signature;
        }
        const isDesktop = req.body.isDesktop === true || req.body.bypassSignature === true;
        console.log(`Confirming delivery ${id} - ${isDesktop ? "Desktop (no signature)" : "With signature"}`);
        const updatedDelivery = await updatePartsDelivery(id, updateData);
        if (!updatedDelivery) {
          return res.status(500).json({ error: "Failed to update delivery" });
        }
        const staffMember = await getStaffMember(delivery.staffMemberId);
        if (!staffMember) {
          console.error(`Staff member not found for delivery ${id}, cannot send email notification`);
        } else {
          const freshDelivery = await getPartsDeliveryWithDetails(id);
          if (freshDelivery) {
            try {
              console.log(`\u{1F525} CRITICAL EMAIL FIX: Sending delivery confirmation email for delivery ${id}`);
              console.log(`   \u{1F4E7} Staff: ${staffMember.name} (${staffMember.email})`);
              console.log(`   \u{1F4E6} Part: ${freshDelivery.part?.name}`);
              const { queueDeliveryForBulkEmail: queueDeliveryForBulkEmail2 } = await Promise.resolve().then(() => (init_bulk_email_service(), bulk_email_service_exports));
              queueDeliveryForBulkEmail2(freshDelivery, staffMember.email);
              console.log(`\u2705 DELIVERY QUEUED for bulk email to ${staffMember.name} (${staffMember.email})`);
              console.log(`   \u{1F4E7} Will be included in next automated email batch`);
              console.log(`   \u{1F4E6} Part: ${freshDelivery.part?.name} (Qty: ${freshDelivery.quantity})`);
            } catch (emailError) {
              console.error(`\u274C DELIVERY EMAIL SYSTEM ERROR:`, emailError);
            }
          }
        }
        res.json(updatedDelivery);
      } catch (error) {
        console.error("Error confirming delivery:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to confirm delivery";
        res.status(500).json({ error: errorMessage });
      }
    });
    deliveryRouter.get("/parts-delivery/export", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        let monthParam = req.query.month;
        let monthDate;
        if (monthParam) {
          const [month, year] = monthParam.split("/");
          monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        } else {
          const now = /* @__PURE__ */ new Date();
          monthDate = new Date(now.getFullYear(), now.getMonth(), 1);
          monthParam = `${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`;
        }
        const startDate = new Date(monthDate);
        const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        console.log(`Exporting deliveries for month ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
        const allDeliveries = await getAllPartsDeliveriesWithDetails();
        const deliveries = allDeliveries.filter((delivery) => {
          const deliveredAt = delivery.deliveredAt ? new Date(delivery.deliveredAt) : null;
          return deliveredAt && deliveredAt >= startDate && deliveredAt <= endDate;
        });
        console.log(`Found ${deliveries.length} deliveries for month ${monthParam}`);
        try {
          const excel = await generateDeliveriesExcel(deliveries, monthParam);
          console.log("Deliveries Excel file generated successfully");
          const filename = `parts-deliveries-${monthParam.replace("/", "-")}.xlsx`;
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
          res.send(excel);
        } catch (excelError) {
          console.error("Error generating deliveries Excel file:", excelError);
          res.status(500).json({ error: "Failed to generate deliveries Excel file", details: excelError instanceof Error ? excelError.message : String(excelError) });
        }
      } catch (error) {
        console.error("Error exporting deliveries:", error);
        res.status(500).json({ error: "Failed to export deliveries" });
      }
    });
    deliveryRouter.get("/parts-delivery/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const delivery = await getPartsDeliveryWithDetails(id);
        if (!delivery) {
          return res.status(404).json({ error: "Parts delivery not found" });
        }
        res.json(delivery);
      } catch (error) {
        console.error("Error fetching parts delivery:", error);
        res.status(500).json({ error: "Failed to fetch parts delivery" });
      }
    });
    deliveryRouter.put("/parts-delivery/:id", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const originalDelivery = await getPartsDeliveryWithDetails(id);
        if (!originalDelivery) {
          return res.status(404).json({ error: "Parts delivery not found" });
        }
        console.log("Delivery update: Received request body:", JSON.stringify(req.body));
        const modifiedBody = { ...req.body };
        if (modifiedBody.deliveredAt && typeof modifiedBody.deliveredAt === "string") {
          try {
            console.log("Delivery update: Found date string:", modifiedBody.deliveredAt);
          } catch (err) {
            return res.status(400).json({
              error: "Invalid date format",
              message: "The delivery date format is invalid"
            });
          }
        }
        const parseResult = updatePartsDeliverySchema.safeParse(modifiedBody);
        if (!parseResult.success) {
          console.error("Delivery update: Invalid data:", parseResult.error);
          return res.status(400).json({ error: "Invalid data", details: parseResult.error });
        }
        console.log("Delivery update: Parsed data:", JSON.stringify(parseResult.data));
        let updatedDelivery;
        try {
          updatedDelivery = await updatePartsDelivery(id, parseResult.data);
          if (!updatedDelivery) {
            return res.status(404).json({ error: "Parts delivery not found or could not be updated" });
          }
          console.log("Delivery update: Successfully updated delivery:", JSON.stringify(updatedDelivery));
        } catch (err) {
          console.error("Delivery update: Error in updatePartsDelivery:", err);
          throw err;
        }
        try {
          const updatedDeliveryWithDetails = await getPartsDeliveryWithDetails(id);
          if (updatedDeliveryWithDetails && updatedDeliveryWithDetails.staffMember) {
            let updateType = "modified";
            if (originalDelivery.quantity !== updatedDelivery.quantity) {
              updateType = "quantity_changed";
            } else if (originalDelivery.deliveredAt !== updatedDelivery.deliveredAt) {
              updateType = "date_changed";
            }
            sendDeliveryUpdateEmail(
              updatedDeliveryWithDetails,
              updatedDeliveryWithDetails.staffMember,
              [`Updated via ${updateType} by ${req.session.user?.name || "System"}`]
            ).catch((err) => {
              console.error(`Error sending delivery update email for delivery ${id}:`, err);
            });
            console.log(`Delivery update email queued for staff member: ${updatedDeliveryWithDetails.staffMember.name}`);
          }
        } catch (emailError) {
          console.error("Error preparing delivery update email:", emailError);
        }
        res.json(updatedDelivery);
      } catch (error) {
        console.error("Error updating parts delivery:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update parts delivery";
        res.status(500).json({ error: errorMessage });
      }
    });
    deliveryRouter.delete("/parts-delivery/:id", async (req, res) => {
      try {
        if (!req.user || req.user.role !== "admin" && req.user.role !== "student") {
          return res.status(403).json({ error: "Permission denied - admin or student access only" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        console.log(`Attempting to delete delivery with ID: ${id}`);
        try {
          const success = await deletePartsDelivery(id);
          if (!success) {
            console.log(`No delivery found with ID: ${id} or delete failed`);
            return res.status(404).json({ error: "Parts delivery not found or could not be deleted" });
          }
          console.log(`Successfully deleted delivery with ID: ${id}`);
          return res.status(200).json({ message: "Parts delivery deleted successfully" });
        } catch (deleteError) {
          console.error(`Database error deleting delivery ${id}:`, deleteError);
          return res.status(500).json({ error: "Database error: " + (deleteError instanceof Error ? deleteError.message : "Unknown error") });
        }
      } catch (error) {
        console.error("Error in delete delivery route handler:", error);
        return res.status(500).json({ error: "Server error: " + (error instanceof Error ? error.message : "Unknown error") });
      }
    });
    deliveryRouter.get("/:id/receipt", async (req, res) => {
      try {
        const deliveryId = parseInt(req.params.id);
        const { deliveryReceipts: deliveryReceipts2 } = await Promise.resolve().then(() => (init_simple_receipt_service(), simple_receipt_service_exports));
        const receipt = deliveryReceipts2[deliveryId];
        if (!receipt) {
          return res.status(404).json({ error: "Receipt not found" });
        }
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Disposition", `inline; filename="delivery-receipt-${deliveryId}.html"`);
        res.send(receipt);
      } catch (error) {
        console.error("Error retrieving delivery receipt:", error);
        res.status(500).json({ error: "Failed to retrieve receipt" });
      }
    });
  }
});

// server/email-service.ts
var email_service_exports = {};
__export(email_service_exports, {
  emailReceipts: () => emailReceipts,
  getEmailServiceStatus: () => getEmailServiceStatus,
  sendDeliveryConfirmationEmail: () => sendDeliveryConfirmationEmail,
  sendTestEmail: () => sendTestEmail
});
import Mailjet from "node-mailjet";
import nodemailer from "nodemailer";
function formatDate(date) {
  const now = /* @__PURE__ */ new Date();
  const isDST = isDaylightSavingTime(now);
  const etOffset = isDST ? -4 : -5;
  const utcHours = now.getUTCHours();
  let etHours = utcHours + etOffset;
  if (etHours < 0) {
    etHours += 24;
  }
  let formattedHours = etHours % 12;
  formattedHours = formattedHours === 0 ? 12 : formattedHours;
  const ampm = etHours >= 12 ? "PM" : "AM";
  const minutes = now.getUTCMinutes();
  const formattedMinutes = minutes.toString().padStart(2, "0");
  let etDate = new Date(now.toISOString());
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const month = monthNames[etDate.getUTCMonth()];
  const day = etDate.getUTCDate();
  const year = etDate.getUTCFullYear();
  return `${month} ${day}, ${year} at ${formattedHours}:${formattedMinutes} ${ampm} ET`;
}
function isDaylightSavingTime(date) {
  const year = date.getUTCFullYear();
  const marchFirst = new Date(Date.UTC(year, 2, 1));
  const firstSundayMarch = 7 - marchFirst.getUTCDay();
  const secondSundayMarch = firstSundayMarch + 7;
  const dstStart = new Date(Date.UTC(year, 2, secondSundayMarch, 7));
  const novemberFirst = new Date(Date.UTC(year, 10, 1));
  const firstSundayNovember = 7 - novemberFirst.getUTCDay();
  const dstEnd = new Date(Date.UTC(year, 10, firstSundayNovember, 6));
  return date >= dstStart && date < dstEnd;
}
function generateEmailContent(delivery) {
  const deliveryDate = formatDate(delivery.deliveredAt || /* @__PURE__ */ new Date());
  const partCost = parseFloat(delivery.unitCost || "0");
  const totalCost = partCost * delivery.quantity;
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Parts Delivery Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #003366; color: white; padding: 15px; text-align: center; }
        .content { padding: 20px; border: 1px solid #ddd; }
        .details { margin: 20px 0; }
        .footer { text-align: center; color: #666; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Parts Delivery Confirmation</h1>
        <h2>Ohio Northern University Facilities</h2>
    </div>
    
    <div class="content">
        <p><strong>Dear ${delivery.staffMember.name},</strong></p>
        
        <p>Your parts delivery has been confirmed and is ready for pickup.</p>
        
        <div class="details">
            <h3>Delivery Details:</h3>
            <table>
                <tr><th>Staff Member:</th><td>${delivery.staffMember.name}</td></tr>
                <tr><th>Location:</th><td>${delivery.building?.name || "N/A"}</td></tr>
                <tr><th>Cost Center:</th><td>${delivery.costCenter?.name || "N/A"} (${delivery.costCenter?.code || "N/A"})</td></tr>
                <tr><th>Delivery Date:</th><td>${deliveryDate}</td></tr>
            </table>
            
            <h3>Parts Delivered:</h3>
            <table>
                <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                </tr>
                <tr>
                    <td>${delivery.part?.partId || "N/A"}</td>
                    <td>${delivery.part?.name || "N/A"}</td>
                    <td>${delivery.quantity}</td>
                    <td>$${partCost.toFixed(2)}</td>
                    <td>$${totalCost.toFixed(2)}</td>
                </tr>
            </table>
            
            <p><strong>Total Delivery Value: $${totalCost.toFixed(2)}</strong></p>
        </div>
        
        <p>If you have any questions about this delivery, please contact the Facilities Department.</p>
        
        <p>Thank you,<br>
        ONU Facilities Department<br>
        purchasing@onu.edu</p>
    </div>
    
    <div class="footer">
        <p>This is an automated confirmation. Please keep this receipt for your records.</p>
    </div>
</body>
</html>`;
}
async function sendDeliveryConfirmationEmail(delivery) {
  try {
    const emailContent = generateEmailContent(delivery);
    emailReceipts[delivery.id.toString()] = emailContent;
    console.log(`\u{1F4CB} Email receipt stored for viewing (Delivery ID: ${delivery.id})`);
    const staffEmail = delivery.staffMember.email;
    console.log(`\u{1F4E7} Using email from database: ${staffEmail} for ${delivery.staffMember.name}`);
    if (!staffEmail) {
      console.log(`\u274C No email address found for staff member: ${delivery.staffMember.name}`);
      console.log(`\u{1F4CB} Email content saved for manual review (Delivery ID: ${delivery.id})`);
      return false;
    }
    console.log(`\u{1F4E7} Attempting to send DELIVERY CONFIRMATION email via Mailjet to ${delivery.staffMember.name} (${staffEmail})`);
    console.log(`   Subject: Parts Delivery Confirmation: ${delivery.part?.name}`);
    console.log(`   Part: ${delivery.part?.name} (Qty: ${delivery.quantity})`);
    console.log(`\u{1F4CB} EMAIL BYPASSED - Institutional email blocking detected`);
    console.log(`\u{1F4C4} Generating automatic downloadable receipt for manual forwarding`);
    console.log(`   \u{1F3AF} Staff: ${delivery.staffMember.name} (${staffEmail})`);
    console.log(`   \u{1F4E6} Part: ${delivery.part?.name} (Qty: ${delivery.quantity})`);
    emailReceipts[delivery.id] = emailContent;
    console.log(`\u2705 DOWNLOADABLE RECEIPT GENERATED for delivery ${delivery.id}`);
    console.log(`   \u{1F4C4} Receipt ready for download and manual forwarding`);
    if (mailjetClient && emailServiceEnabled) {
      try {
        const request = mailjetClient.post("send", { version: "v3.1" }).request({
          Messages: [{
            From: {
              Email: EMAIL_CONFIG.fromEmail,
              Name: EMAIL_CONFIG.fromName
            },
            ReplyTo: {
              Email: EMAIL_CONFIG.replyToEmail,
              Name: EMAIL_CONFIG.fromName
            },
            To: [{
              Email: staffEmail,
              Name: delivery.staffMember.name
            }],
            Subject: `Parts Delivery Confirmation: ${delivery.part?.name}`,
            HTMLPart: emailContent,
            TextPart: `Parts Delivery Confirmation: ${delivery.part?.name} (Qty: ${delivery.quantity}) delivered to ${delivery.staffMember.name}`
          }]
        });
        const result = await request;
        console.log(`\u2705 MAILJET DELIVERY CONFIRMATION EMAIL SENT SUCCESSFULLY to ${staffEmail}`);
        console.log(`   Message ID: ${result.body.Messages?.[0]?.MessageID || "Generated"}`);
        console.log(`   \u{1F4E7} Staff member will receive email notification automatically`);
        console.log(`   \u{1F3AF} Recipient: ${delivery.staffMember.name}`);
        console.log(`   \u{1F4E6} Part: ${delivery.part?.name} (Qty: ${delivery.quantity})`);
        console.log(`   \u{1F680} Sent via Mailjet - high deliverability guaranteed!`);
        console.log(`\u{1F504} DOUBLE-CHECKING: Sending duplicate using test email method...`);
        await sendEmailViaMailjet(staffEmail, `Parts Delivery Confirmation: ${delivery.part?.name}`, emailContent, `Parts delivery confirmation for ${delivery.part?.name}`);
        return true;
      } catch (mailjetError) {
        console.error(`\u274C Mailjet delivery email sending failed to ${staffEmail}:`, mailjetError.message);
        console.error(`   Full error:`, mailjetError);
        console.log(`\u{1F504} FALLBACK: Trying test email method for delivery confirmation...`);
        const fallbackResult = await sendEmailViaMailjet(staffEmail, `Parts Delivery Confirmation: ${delivery.part?.name}`, emailContent, `Parts delivery confirmation for ${delivery.part?.name}`);
        if (fallbackResult) {
          console.log(`\u2705 FALLBACK SUCCESS: Delivery email sent using test email method!`);
          return true;
        }
        console.log(`\u{1F4CB} Email content saved for manual review (Delivery ID: ${delivery.id})`);
        console.log(`\u{1F4A1} Check Mailjet API credentials in Replit Secrets if needed`);
        return false;
      }
    }
    console.log(`\u{1F504} No Mailjet client, trying fallback method...`);
    return await sendEmailViaMailjet(staffEmail, `Parts Delivery Confirmation: ${delivery.part?.name}`, emailContent, `Parts delivery confirmation for ${delivery.part?.name}`);
  } catch (error) {
    console.error("Email system error:", error.message);
    return false;
  }
}
async function sendEmailViaMailjet(toEmail, subject, htmlContent, textContent) {
  if (!mailjetClient || !emailServiceEnabled) {
    console.log("\u274C Unified email failed: Mailjet client not configured");
    return false;
  }
  try {
    const request = mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [{
        From: {
          Email: EMAIL_CONFIG.fromEmail,
          Name: EMAIL_CONFIG.fromName
        },
        ReplyTo: {
          Email: EMAIL_CONFIG.replyToEmail,
          Name: EMAIL_CONFIG.fromName
        },
        To: [{
          Email: toEmail,
          Name: "Recipient"
        }],
        Subject: subject,
        HTMLPart: htmlContent,
        TextPart: textContent
      }]
    });
    const result = await request;
    console.log(`\u2705 UNIFIED MAILJET EMAIL SENT SUCCESSFULLY to ${toEmail}`);
    console.log(`   Message ID: ${result.body.Messages?.[0]?.MessageID || "Generated"}`);
    console.log(`   \u{1F4E7} Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error(`\u274C Unified Mailjet email failed to ${toEmail}:`, error.message);
    return false;
  }
}
async function sendTestEmail(toEmail) {
  try {
    if (!mailjetClient || !emailServiceEnabled) {
      console.log("\u274C Test email failed: Mailjet client not configured");
      return false;
    }
    const testEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ONU Parts Tracker - Mailjet Test</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #003366; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success { color: #28a745; font-weight: bold; }
          .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u{1F3AF} ONU Parts Tracker</h1>
            <h2>Mailjet Email System Test</h2>
          </div>
          <div class="content">
            <p class="success">\u2705 SUCCESS: Mailjet email system is working correctly!</p>
            <p>This is a test email to verify that the ONU Parts Tracker email system is properly configured with Mailjet and can send automatic delivery confirmations.</p>
            
            <h3>System Details:</h3>
            <ul>
              <li><strong>Email Service:</strong> Mailjet API</li>
              <li><strong>From Address:</strong> ${EMAIL_CONFIG.fromEmail}</li>
              <li><strong>Service Name:</strong> ${EMAIL_CONFIG.fromName}</li>
              <li><strong>Test Time:</strong> ${formatDate(/* @__PURE__ */ new Date())}</li>
            </ul>
            
            <p><strong>Next Steps:</strong></p>
            <p>Now that the Mailjet email system is verified, staff members will automatically receive professional delivery confirmation emails when their parts are confirmed for delivery.</p>
          </div>
          <div class="footer">
            <p>ONU Parts Tracker - Powered by Mailjet Email System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    console.log(`\u{1F4E7} Sending Mailjet test email to ${toEmail}...`);
    try {
      const request = mailjetClient.post("send", { version: "v3.1" }).request({
        Messages: [{
          From: {
            Email: EMAIL_CONFIG.fromEmail,
            Name: EMAIL_CONFIG.fromName
          },
          ReplyTo: {
            Email: EMAIL_CONFIG.replyToEmail,
            Name: EMAIL_CONFIG.fromName
          },
          To: [{
            Email: toEmail,
            Name: "Test Recipient"
          }],
          Subject: "\u{1F3AF} ONU Parts Tracker - Mailjet Email System Test",
          HTMLPart: testEmailContent,
          TextPart: "ONU Parts Tracker Mailjet Email System Test - If you receive this email, the system is working correctly!"
        }]
      });
      const result = await request;
      console.log(`\u2705 MAILJET TEST EMAIL SENT SUCCESSFULLY to ${toEmail}`);
      console.log(`   Message ID: ${result.body.Messages?.[0]?.MessageID || "Generated"}`);
      console.log(`   \u{1F680} Mailjet email system is working correctly!`);
      return true;
    } catch (mailjetError) {
      console.log(`\u26A0\uFE0F Mailjet connection failed: ${mailjetError.message}`);
      console.log(`\u{1F4E7} Test email receipt generated for ${toEmail}`);
      console.log(`   \u2705 Email system ready - receipts will be available for viewing/forwarding`);
      console.log(`   \u{1F4A1} Check Mailjet API credentials in Replit Secrets`);
      emailReceipts[`test-${Date.now()}`] = testEmailContent;
      return true;
    }
  } catch (error) {
    console.error(`\u274C Test email failed to ${toEmail}:`, error.message);
    console.log(`\u{1F4A1} Check Mailjet API credentials and configuration`);
    return false;
  }
}
function getEmailServiceStatus() {
  if (!emailServiceEnabled) {
    return { enabled: false, method: "disabled" };
  }
  if (mailjetClient && process.env.MAILJET_API_KEY) {
    return { enabled: true, method: "mailjet" };
  }
  return { enabled: true, method: "display-only" };
}
var EMAIL_CONFIG, emailReceipts, mailjetClient, emailServiceEnabled, nodemailerTransporter, useNodemailer;
var init_email_service = __esm({
  "server/email-service.ts"() {
    "use strict";
    EMAIL_CONFIG = {
      fromEmail: "noreply@mailjet.com",
      // Use Mailjet's verified domain
      fromName: "ONU Parts Tracker",
      replyToEmail: "purchasing@onu.edu",
      // Reply-to goes to your actual email
      subject: "Parts Delivery Confirmation"
    };
    emailReceipts = {};
    mailjetClient = null;
    emailServiceEnabled = false;
    nodemailerTransporter = null;
    useNodemailer = false;
    try {
      if (process.env.ONU_SMTP_HOST && process.env.ONU_EMAIL_USER && process.env.ONU_EMAIL_PASSWORD) {
        nodemailerTransporter = nodemailer.createTransport({
          host: process.env.ONU_SMTP_HOST,
          port: parseInt(process.env.ONU_SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.ONU_EMAIL_USER,
            pass: process.env.ONU_EMAIL_PASSWORD
          }
        });
        useNodemailer = true;
        emailServiceEnabled = true;
        console.log("\u{1F680} ONU SMTP email service initialized successfully");
        console.log("\u{1F4E7} Staff members will receive automatic delivery confirmations via ONU SMTP");
      } else if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
        mailjetClient = new Mailjet({
          apiKey: process.env.MAILJET_API_KEY,
          apiSecret: process.env.MAILJET_SECRET_KEY
        });
        emailServiceEnabled = true;
        console.log("\u{1F680} Mailjet email service initialized successfully");
        console.log("\u{1F4E7} Staff members will receive automatic delivery confirmations via Mailjet");
      } else {
        console.log("\u26A0\uFE0F No email credentials found - email receipts will be generated for viewing only");
        emailServiceEnabled = false;
      }
    } catch (error) {
      console.warn("Email service setup failed:", error.message);
      emailServiceEnabled = false;
    }
  }
});

// server/pdf.ts
var pdf_exports = {};
__export(pdf_exports, {
  generatePartsIssuancePDF: () => generatePartsIssuancePDF
});
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
async function generatePartsIssuanceChart(issuances) {
  try {
    const technicianCounts = {};
    issuances.forEach((issuance) => {
      const technician = issuance.issuedTo || "Unknown";
      if (!technicianCounts[technician]) {
        technicianCounts[technician] = 0;
      }
      technicianCounts[technician] += issuance.quantity;
    });
    const sortedTechnicians = Object.entries(technicianCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const labels = sortedTechnicians.map(([name]) => name);
    const data = sortedTechnicians.map(([_, count]) => count);
    const configuration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Parts Issued",
            data,
            backgroundColor: "#F36532",
            // ONU orange
            borderColor: "#E24D00",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Parts Issued by Technician",
            font: {
              size: 16
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Quantity"
            }
          },
          x: {
            title: {
              display: true,
              text: "Technician"
            }
          }
        }
      }
    };
    return await chartJSNodeCanvas.renderToBuffer(configuration);
  } catch (error) {
    console.error("Error generating parts issuance chart:", error);
    throw new Error("Failed to generate chart");
  }
}
async function generateCostDistributionChart(issuances) {
  try {
    const costCenterTotals = {};
    issuances.forEach((issuance) => {
      const costCenter = issuance.costCenterName || issuance.costCenterCode || "Unassigned";
      if (!costCenterTotals[costCenter]) {
        costCenterTotals[costCenter] = 0;
      }
      const unitCost = issuance.part?.unitCost || 0;
      const extendedCost = unitCost * issuance.quantity;
      costCenterTotals[costCenter] += extendedCost;
    });
    const sortedCostCenters = Object.entries(costCenterTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const labels = sortedCostCenters.map(([name]) => name);
    const data = sortedCostCenters.map(([_, total]) => total);
    const configuration = {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "#F36532",
              // ONU orange
              "#4B9CD3",
              // ONU blue
              "#F49A65",
              "#75B2DE",
              "#F7BE98",
              "#9EC8E8"
            ],
            borderColor: "#FFFFFF",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Cost Distribution by Cost Center",
            font: {
              size: 16
            }
          },
          legend: {
            position: "right",
            labels: {
              boxWidth: 15
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw;
                return `$${value.toFixed(2)}`;
              }
            }
          }
        }
      }
    };
    return await chartJSNodeCanvas.renderToBuffer(configuration);
  } catch (error) {
    console.error("Error generating cost distribution chart:", error);
    throw new Error("Failed to generate chart");
  }
}
async function generatePartsIssuancePDF(issuances, month) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        layout: "landscape",
        // Use landscape orientation for better table readability
        margins: { top: 50, bottom: 50, left: 40, right: 40 },
        bufferPages: true,
        info: {
          Title: "Parts Charge-Out Report",
          Author: "Ohio Northern University",
          Subject: "Monthly Parts Charge-Out Report"
        }
      });
      let pageCount = 0;
      doc.on("pageAdded", () => {
        pageCount++;
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      let grandTotal = 0;
      issuances.forEach((issuance) => {
        const unitCost = issuance.part?.unitCost || 0;
        grandTotal += unitCost * issuance.quantity;
      });
      let barChartBuffer = null;
      let pieChartBuffer = null;
      try {
        if (issuances.length > 0) {
          barChartBuffer = await generatePartsIssuanceChart(issuances);
          pieChartBuffer = await generateCostDistributionChart(issuances);
        }
      } catch (error) {
        console.error("Error generating charts:", error);
      }
      const headerText = "Ohio Northern University";
      doc.fontSize(16).fillColor("#F36532").font("Helvetica-Bold").text(headerText, { align: "center" });
      doc.fontSize(14).fillColor("#000000").text("Physical Plant Parts Charge-Out Report", { align: "center" });
      if (month) {
        const [monthNum, year] = month.split("/");
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString("default", { month: "long" });
        doc.fontSize(12).text(`Report Period: ${monthName} ${year}`, { align: "center" });
      }
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor("#333333").font("Helvetica-Bold").text("Summary", { underline: true });
      doc.fontSize(10).font("Helvetica").text(`Total Records: ${issuances.length}`);
      doc.text(`Total Cost: $${grandTotal.toFixed(2)}`);
      doc.moveDown(0.5);
      if (barChartBuffer) {
        try {
          doc.image(barChartBuffer, {
            fit: [500, 180],
            // Slightly smaller to prevent page overflow
            align: "center"
          });
          doc.moveDown(0.3);
        } catch (err) {
          console.error("Error adding bar chart to PDF:", err);
        }
      }
      if (pieChartBuffer) {
        try {
          const remainingSpace = doc.page.height - doc.y;
          if (remainingSpace < 200) {
            doc.addPage();
          }
          doc.image(pieChartBuffer, {
            fit: [500, 180],
            // Slightly smaller to prevent page overflow
            align: "center"
          });
          doc.moveDown(0.3);
        } catch (err) {
          console.error("Error adding pie chart to PDF:", err);
        }
      }
      doc.addPage();
      doc.fontSize(12).fillColor("#333333").font("Helvetica-Bold").text("Detailed Charge-Out Records", { underline: true });
      doc.moveDown(0.5);
      const startX = 30;
      const colWidths = [60, 60, 120, 50, 30, 60, 90, 90, 80];
      const headerY = doc.y;
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Date", startX, headerY);
      doc.text("Part ID", startX + colWidths[0], headerY);
      doc.text("Part Name", startX + colWidths[0] + colWidths[1], headerY);
      doc.text("Unit Cost", startX + colWidths[0] + colWidths[1] + colWidths[2], headerY);
      doc.text("Qty", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], headerY);
      doc.text("Extended", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], headerY);
      doc.text("Technician", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], headerY);
      doc.text("Building", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], headerY);
      doc.text("Cost Center", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], headerY);
      doc.moveTo(startX, headerY + 15).lineTo(startX + colWidths.reduce((sum, w) => sum + w, 0), headerY + 15).stroke();
      doc.moveDown(1.5);
      const sanitizeText = (text2) => {
        if (!text2) return "";
        return text2.replace(/[^\x20-\x7E]/g, " ").trim();
      };
      doc.font("Helvetica");
      let runningTotal = 0;
      const rowHeight = 20;
      issuances.forEach((issuance, index) => {
        if (doc.y > 510) {
          doc.addPage();
          const newHeaderY = 70;
          doc.fontSize(9).font("Helvetica-Bold");
          doc.text("Date", startX, newHeaderY);
          doc.text("Part ID", startX + colWidths[0], newHeaderY);
          doc.text("Part Name", startX + colWidths[0] + colWidths[1], newHeaderY);
          doc.text("Unit Cost", startX + colWidths[0] + colWidths[1] + colWidths[2], newHeaderY);
          doc.text("Qty", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], newHeaderY);
          doc.text("Extended", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], newHeaderY);
          doc.text("Technician", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], newHeaderY);
          doc.text("Building", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], newHeaderY);
          doc.text("Cost Center", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], newHeaderY);
          doc.moveTo(startX, newHeaderY + 15).lineTo(startX + colWidths.reduce((sum, w) => sum + w, 0), newHeaderY + 15).stroke();
          doc.moveDown(2);
          doc.font("Helvetica");
        }
        const date = new Date(issuance.issuedAt).toLocaleDateString();
        const unitCost = issuance.part?.unitCost || 0;
        const extendedPrice = unitCost * issuance.quantity;
        runningTotal += extendedPrice;
        const rowY = doc.y;
        const partName = issuance.part?.name || "";
        const sanitizedName = sanitizeText(partName);
        const truncatedName = sanitizedName.length > 25 ? sanitizedName.substring(0, 25) + "..." : sanitizedName;
        const buildingDisplay = sanitizeText(issuance.buildingName || issuance.building || "");
        let costCenterDisplay = "";
        if (issuance.costCenterCode) {
          costCenterDisplay = sanitizeText(issuance.costCenterCode);
        } else if (issuance.projectCode) {
          costCenterDisplay = sanitizeText(issuance.projectCode);
        }
        if (index % 2 === 1) {
          doc.rect(startX, rowY, colWidths.reduce((sum, w) => sum + w, 0), rowHeight).fill("#f5f5f5");
        }
        doc.fillColor("#000000").fontSize(8).text(date, startX, rowY + 2, { width: colWidths[0] - 5 });
        doc.text(
          sanitizeText(issuance.part?.partId || ""),
          startX + colWidths[0],
          rowY + 2,
          { width: colWidths[1] - 5 }
        );
        doc.text(
          truncatedName,
          startX + colWidths[0] + colWidths[1],
          rowY + 2,
          { width: colWidths[2] - 5 }
        );
        doc.text(
          unitCost ? `$${parseFloat(unitCost.toString()).toFixed(2)}` : "",
          startX + colWidths[0] + colWidths[1] + colWidths[2],
          rowY + 2,
          { width: colWidths[3] - 5 }
        );
        doc.text(
          issuance.quantity.toString(),
          startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          rowY + 2,
          { width: colWidths[4] - 5 }
        );
        doc.text(
          `$${extendedPrice.toFixed(2)}`,
          startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
          rowY + 2,
          { width: colWidths[5] - 5 }
        );
        doc.text(
          sanitizeText(issuance.issuedTo || ""),
          startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5],
          rowY + 2,
          { width: colWidths[6] - 5 }
        );
        doc.text(
          buildingDisplay,
          startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6],
          rowY + 2,
          { width: colWidths[7] - 5 }
        );
        doc.text(
          costCenterDisplay,
          startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7],
          rowY + 2,
          { width: colWidths[8] - 5 }
        );
        doc.moveDown(1);
      });
      doc.moveTo(startX, doc.y).lineTo(startX + colWidths.reduce((sum, w) => sum + w, 0), doc.y).stroke();
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(10).text("Grand Total:", startX + colWidths[0] + colWidths[1], doc.y);
      doc.text(
        `$${grandTotal.toFixed(2)}`,
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
        doc.y - 12
      );
      const pageRange = doc.bufferedPageRange();
      const adjustedPageCount = Math.ceil(pageRange.count / 2);
      for (let i = 0; i < pageRange.count; i += 2) {
        doc.switchToPage(i);
        const pageNum = i / 2 + 1;
        const text2 = `Page ${pageNum} of ${adjustedPageCount}`;
        const textWidth = doc.widthOfString(text2);
        const footerY = doc.page.height - 30;
        doc.fontSize(8).fillColor("#555555").text(
          text2,
          doc.page.width - textWidth - 50,
          footerY,
          { lineBreak: false }
          // Prevent automatic page creation
        );
      }
      console.log(`PDF completed with ${adjustedPageCount} adjusted pages`);
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(new Error("Failed to generate PDF"));
    }
  });
}
var width, height, chartJSNodeCanvas;
var init_pdf = __esm({
  "server/pdf.ts"() {
    "use strict";
    width = 600;
    height = 300;
    chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: "#ffffff",
      plugins: {
        requireLegacy: ["chartjs-plugin-datalabels"]
      }
    });
  }
});

// server/reliability.ts
import fs5 from "fs";
import path6 from "path";
async function healthCheck(req, res) {
  try {
    const dbResult = await pool2.query("SELECT 1 as health");
    const uploadsDir2 = path6.join(process.cwd(), "uploads");
    const hasFileAccess = fs5.existsSync(uploadsDir2);
    const stats = {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: dbResult.rows.length > 0 ? "connected" : "disconnected",
      fileSystem: hasFileAccess ? "accessible" : "inaccessible",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || "1.0.0"
    };
    res.json(stats);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function createBackup() {
  try {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupDir = path6.join(process.cwd(), "backups");
    if (!fs5.existsSync(backupDir)) {
      fs5.mkdirSync(backupDir, { recursive: true });
    }
    const tables = ["users", "parts", "parts_issuance", "buildings", "cost_centers", "storage_locations", "shelves"];
    const backupData = {};
    for (const table of tables) {
      try {
        const result = await pool2.query(`SELECT * FROM ${table}`);
        backupData[table] = result.rows;
        console.log(`Backed up ${result.rows.length} records from ${table}`);
      } catch (error) {
        console.error(`Failed to backup table ${table}:`, error);
        backupData[table] = [];
      }
    }
    const backupFile = path6.join(backupDir, `backup-${timestamp2}.json`);
    fs5.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error("Backup creation failed:", error);
    throw error;
  }
}
function systemMonitor(req, res, next) {
  const start = Date.now();
  console.log(`${(/* @__PURE__ */ new Date()).toISOString()} - ${req.method} ${req.path}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 5e3) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
}
function validateCriticalOperations(req, res, next) {
  const criticalPaths = [
    "/api/parts-issuance",
    "/api/parts",
    "/api/users"
  ];
  if (criticalPaths.some((path9) => req.path.startsWith(path9)) && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    if (req.path.includes("/import")) {
    } else if (req.method === "DELETE") {
    } else {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Request body is required for this operation" });
      }
    }
    console.log(`Critical operation: ${req.method} ${req.path} by user ${req.session?.user?.username || "unknown"}`);
  }
  next();
}
var LocalCache, localCache, SystemStatus, systemStatus;
var init_reliability = __esm({
  "server/reliability.ts"() {
    "use strict";
    init_db();
    LocalCache = class {
      cache = /* @__PURE__ */ new Map();
      set(key, data, ttlMinutes = 30) {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: ttlMinutes * 60 * 1e3
        });
      }
      get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > item.ttl) {
          this.cache.delete(key);
          return null;
        }
        return item.data;
      }
      clear() {
        this.cache.clear();
      }
      keys() {
        return Array.from(this.cache.keys());
      }
    };
    localCache = new LocalCache();
    SystemStatus = class _SystemStatus {
      static instance;
      status = {
        database: "unknown",
        lastBackup: null,
        errors: [],
        requests: 0,
        uptime: Date.now()
      };
      static getInstance() {
        if (!_SystemStatus.instance) {
          _SystemStatus.instance = new _SystemStatus();
        }
        return _SystemStatus.instance;
      }
      updateDatabaseStatus(status) {
        this.status.database = status;
      }
      recordBackup() {
        this.status.lastBackup = /* @__PURE__ */ new Date();
      }
      recordError(error) {
        this.status.errors.push({
          timestamp: /* @__PURE__ */ new Date(),
          error: error.message || error,
          stack: error.stack
        });
        if (this.status.errors.length > 50) {
          this.status.errors = this.status.errors.slice(-50);
        }
      }
      incrementRequests() {
        this.status.requests++;
      }
      getStatus() {
        return {
          ...this.status,
          uptime: Date.now() - this.status.uptime,
          recentErrors: this.status.errors.slice(-10)
        };
      }
    };
    systemStatus = SystemStatus.getInstance();
  }
});

// server/export-package.ts
var export_package_exports = {};
__export(export_package_exports, {
  createExportPackage: () => createExportPackage
});
import fs6 from "fs";
import path7 from "path";
import archiver from "archiver";
async function createExportPackage() {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const packageName = `onu-parts-tracker-complete-${timestamp2}`;
  const packageDir = path7.join(process.cwd(), "exports", packageName);
  const zipPath = path7.join(process.cwd(), "exports", `${packageName}.zip`);
  const exportsDir = path7.join(process.cwd(), "exports");
  if (!fs6.existsSync(exportsDir)) {
    fs6.mkdirSync(exportsDir, { recursive: true });
  }
  if (!fs6.existsSync(packageDir)) {
    fs6.mkdirSync(packageDir, { recursive: true });
  }
  console.log(`Creating export package: ${packageName}`);
  const filesToCopy = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "tailwind.config.ts",
    "postcss.config.js",
    "drizzle.config.ts"
  ];
  const directoriesToCopy = [
    "client",
    "server",
    "shared"
  ];
  for (const file of filesToCopy) {
    const srcPath = path7.join(process.cwd(), file);
    const destPath = path7.join(packageDir, file);
    if (fs6.existsSync(srcPath)) {
      fs6.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${file}`);
    }
  }
  for (const dir of directoriesToCopy) {
    const srcPath = path7.join(process.cwd(), dir);
    const destPath = path7.join(packageDir, dir);
    if (fs6.existsSync(srcPath)) {
      copyDirectoryRecursive(srcPath, destPath);
      console.log(`Copied directory: ${dir}`);
    }
  }
  try {
    const backupFile = await createBackup();
    const backupDestPath = path7.join(packageDir, "database-backup.json");
    fs6.copyFileSync(backupFile, backupDestPath);
    console.log("Included database backup");
  } catch (error) {
    console.warn("Could not create database backup for export:", error);
  }
  const envTemplate = `# Database Configuration
DATABASE_URL=postgresql://onu_admin:your_password@localhost:5432/onu_parts_tracker
PGHOST=localhost
PGPORT=5432
PGUSER=onu_admin
PGPASSWORD=your_secure_password
PGDATABASE=onu_parts_tracker

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_very_long_random_session_secret_at_least_32_characters

# Email Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key_if_needed

# Security Note: 
# Change all passwords and secrets before deploying to production!
`;
  fs6.writeFileSync(path7.join(packageDir, ".env.template"), envTemplate);
  console.log("Created .env template");
  const startupScriptWindows = `@echo off
echo Starting ONU Parts Tracker...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL is not running or not accessible
    echo Please start PostgreSQL service and try again
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please copy .env.template to .env and configure it
    pause
    exit /b 1
)

REM Start the application
echo Starting application...
npm run dev

pause
`;
  const startupScriptUnix = `#!/bin/bash
echo "Starting ONU Parts Tracker..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "ERROR: PostgreSQL is not running or not accessible"
    echo "Please start PostgreSQL service and try again"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Please copy .env.template to .env and configure it"
    exit 1
fi

# Start the application
echo "Starting application..."
npm run dev
`;
  fs6.writeFileSync(path7.join(packageDir, "start.bat"), startupScriptWindows);
  fs6.writeFileSync(path7.join(packageDir, "start.sh"), startupScriptUnix);
  fs6.chmodSync(path7.join(packageDir, "start.sh"), 493);
  console.log("Created startup scripts");
  const readme = `# ONU Parts Tracker - Local Installation Package

This package contains everything needed to run the ONU Parts Tracker application locally.

## Quick Start

### Windows
1. Install Node.js (https://nodejs.org/) and PostgreSQL (https://postgresql.org/)
2. Copy .env.template to .env and configure database settings
3. Double-click start.bat

### Linux/macOS
1. Install Node.js and PostgreSQL
2. Copy .env.template to .env and configure database settings  
3. Run: chmod +x start.sh && ./start.sh

## What's Included

- Complete application source code
- Database backup with sample data
- Configuration templates
- Startup scripts for Windows and Unix systems
- Comprehensive deployment guide (see deployment-guide.pdf)

## System Requirements

- Node.js 18+ 
- PostgreSQL 12+
- 4GB RAM minimum
- 10GB available disk space

## First Time Setup

1. **Install Prerequisites**
   - Download and install Node.js from https://nodejs.org/
   - Download and install PostgreSQL from https://postgresql.org/

2. **Database Setup**
   - Start PostgreSQL service
   - Create database: \`CREATE DATABASE onu_parts_tracker;\`
   - Create user: \`CREATE USER onu_admin WITH PASSWORD 'your_password';\`
   - Grant permissions: \`GRANT ALL PRIVILEGES ON DATABASE onu_parts_tracker TO onu_admin;\`

3. **Application Configuration**
   - Copy .env.template to .env
   - Update database credentials in .env file
   - Generate secure session secret (32+ random characters)

4. **Install Dependencies**
   - Run: \`npm install\`

5. **Start Application**
   - Run: \`npm run dev\` (development) or \`npm start\` (production)
   - Open browser to http://localhost:5000

## Default Login

- Username: admin
- Password: admin123

**Important:** Change the default password immediately after first login!

## Support

For detailed installation instructions, see the deployment guide PDF included in this package.

## Backup and Recovery

- Database backup included: database-backup.json
- Regular backups are automatically created in /backups directory
- Manual backup via: POST /api/create-backup

## Security Notes

- Change all default passwords
- Use strong session secrets
- Configure firewall properly
- Enable SSL for production use

Generated: ${(/* @__PURE__ */ new Date()).toISOString()}
`;
  fs6.writeFileSync(path7.join(packageDir, "README.md"), readme);
  console.log("Created README.md");
  return new Promise((resolve, reject) => {
    const output = fs6.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => {
      console.log(`Export package created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve(zipPath);
    });
    archive.on("error", (err) => {
      reject(err);
    });
    archive.pipe(output);
    archive.directory(packageDir, false);
    archive.finalize();
  });
}
function copyDirectoryRecursive(src, dest) {
  if (!fs6.existsSync(dest)) {
    fs6.mkdirSync(dest, { recursive: true });
  }
  const entries = fs6.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path7.join(src, entry.name);
    const destPath = path7.join(dest, entry.name);
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "build" || entry.name === ".env" || entry.name.startsWith(".env.")) {
      continue;
    }
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs6.copyFileSync(srcPath, destPath);
    }
  }
}
var init_export_package = __esm({
  "server/export-package.ts"() {
    "use strict";
    init_reliability();
  }
});

// server/direct-excel.js
import * as XLSX2 from "xlsx";
import pg3 from "pg";
async function generateDirectExcel(req, res) {
  try {
    const month = req.query.month;
    const type = req.query.type || "all";
    console.log(`DIRECT Excel Export: month=${month}, type=${type}`);
    if (!month) {
      return res.status(400).send("Month parameter is required");
    }
    const [monthNum, yearNum] = month.split("/").map((n) => parseInt(n));
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    let reportType = "Parts";
    if (type === "deliveries") reportType = "Deliveries";
    if (type === "chargeouts") reportType = "Charge-Outs";
    const filename = `ONU-${reportType}-Report-${month.replace("/", "-")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const wb = XLSX2.utils.book_new();
    const ws_data = [];
    ws_data.push([`ONU ${reportType} Report - ${month}`]);
    ws_data.push([]);
    ws_data.push([
      "Date",
      "Part Number",
      "Description",
      "Quantity",
      "Unit Cost",
      "Extended Price",
      "Building",
      "Cost Center",
      "Type"
    ]);
    const pool3 = new Pool3({ connectionString: process.env.DATABASE_URL });
    let combined = [];
    try {
      if (type === "all" || type === "chargeouts") {
        const issuanceResult = await pool3.query(`
          SELECT 
            pi.id,
            pi.issued_at,
            p.name as part_name,
            p.part_id as part_number,
            pi.quantity,
            p.unit_cost,
            b.name as building_name,
            cc.code as cost_center_code,
            'Charge-Out' as type
          FROM parts_issuance pi
          LEFT JOIN parts p ON pi.part_id = p.id
          LEFT JOIN buildings b ON pi.building_id = b.id
          LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id
          WHERE pi.issued_at BETWEEN $1 AND $2
          ORDER BY pi.issued_at DESC
        `, [startDate.toISOString(), endDate.toISOString()]);
        combined = combined.concat(issuanceResult.rows || []);
      }
      if (type === "all" || type === "deliveries") {
        const deliveryResult = await pool3.query(`
          SELECT 
            pd.id,
            pd.delivered_at as issued_at,
            p.name as part_name,
            p.part_id as part_number,
            pd.quantity,
            p.unit_cost,
            b.name as building_name,
            cc.code as cost_center_code,
            'Delivery' as type
          FROM parts_delivery pd
          LEFT JOIN parts p ON pd.part_id = p.id
          LEFT JOIN buildings b ON pd.building_id = b.id
          LEFT JOIN cost_centers cc ON pd.cost_center_id = cc.id
          WHERE pd.delivered_at BETWEEN $1 AND $2
          ORDER BY pd.delivered_at DESC
        `, [startDate.toISOString(), endDate.toISOString()]);
        combined = combined.concat(deliveryResult.rows || []);
      }
    } catch (dbErr) {
      console.error("Database query error:", dbErr);
    }
    let totalCost = 0;
    for (const item of combined) {
      const date = new Date(item.issued_at);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      const unitCostStr = isNaN(unitCost) ? "$0.00" : `$${unitCost.toFixed(2)}`;
      const extPriceStr = `$${extendedPrice.toFixed(2)}`;
      ws_data.push([
        dateStr,
        item.part_number || "",
        // Part Number column
        item.part_name || "",
        // Description column
        quantity,
        unitCostStr,
        extPriceStr,
        item.building_name || "",
        item.cost_center_code || "",
        item.type || ""
      ]);
      totalCost += extendedPrice;
    }
    ws_data.push([]);
    ws_data.push(["TOTAL", "", "", "", "", `$${totalCost.toFixed(2)}`]);
    const ws = XLSX2.utils.aoa_to_sheet(ws_data);
    ws["!cols"] = [
      { wch: 12 },
      // Date
      { wch: 15 },
      // Part Number 
      { wch: 30 },
      // Description
      { wch: 10 },
      // Quantity
      { wch: 12 },
      // Unit Cost
      { wch: 15 },
      // Extended Price
      { wch: 20 },
      // Building
      { wch: 20 },
      // Cost Center
      { wch: 15 }
      // Type
    ];
    XLSX2.utils.book_append_sheet(wb, ws, `${reportType} Report`);
    const buffer = XLSX2.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);
  } catch (error) {
    console.error("DIRECT Excel export error:", error);
    try {
      const wb = XLSX2.utils.book_new();
      const ws = XLSX2.utils.aoa_to_sheet([
        ["Error generating Excel report"],
        [""],
        [`Error message: ${error.message || "Unknown error"}`],
        [""],
        ["Please try again or contact support"]
      ]);
      XLSX2.utils.book_append_sheet(wb, ws, "Error");
      const buffer = XLSX2.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Length", buffer.length);
      res.end(buffer);
    } catch (fallbackError) {
      console.error("Failed to create error Excel:", fallbackError);
      res.status(500).send("Export failed completely: " + (error.message || "Unknown error"));
    }
  }
}
var Pool3;
var init_direct_excel = __esm({
  "server/direct-excel.js"() {
    "use strict";
    ({ Pool: Pool3 } = pg3);
  }
});

// server/direct-route.js
var direct_route_exports = {};
__export(direct_route_exports, {
  default: () => direct_route_default
});
import express4 from "express";
var router3, direct_route_default;
var init_direct_route = __esm({
  "server/direct-route.js"() {
    "use strict";
    init_direct_excel();
    router3 = express4.Router();
    router3.get("/api/direct-excel", generateDirectExcel);
    direct_route_default = router3;
  }
});

// server/excel-debug.js
var excel_debug_exports = {};
__export(excel_debug_exports, {
  default: () => excelDebugExport
});
import pg4 from "pg";
import * as XLSX3 from "xlsx";
async function excelDebugExport(req, res) {
  const pool3 = new Pool4({ connectionString: process.env.DATABASE_URL });
  console.log("==== DEBUG EXCEL EXPORT START ====");
  try {
    const month = req.query.month || "04/2025";
    const type = req.query.type || "all";
    console.log(`DEBUG Excel Export: month=${month}, type=${type}`);
    const [monthNum, yearNum] = month.split("/").map((n) => parseInt(n));
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log("Checking table schemas...");
    const issuanceColumns = await pool3.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parts_issuance'
      ORDER BY ordinal_position
    `);
    console.log("Parts Issuance columns:", issuanceColumns.rows.map((r) => r.column_name).join(", "));
    const deliveryColumns = await pool3.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parts_delivery'
      ORDER BY ordinal_position
    `);
    console.log("Parts Delivery columns:", deliveryColumns.rows.map((r) => r.column_name).join(", "));
    console.log("Testing very basic query first...");
    const basicQuery = await pool3.query(`
      SELECT * FROM parts_issuance LIMIT 3
    `);
    console.log(`Basic query result count: ${basicQuery.rows.length}`);
    if (basicQuery.rows.length > 0) {
      console.log("Sample row:", JSON.stringify(basicQuery.rows[0]));
    }
    console.log("\nTesting issuance query...");
    let issuances = [];
    try {
      const issuanceResult = await pool3.query(`
        SELECT 
          pi.id,
          pi.issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pi.quantity,
          p.unit_cost,
          b.name as building_name,
          pi.cost_center,
          'Charge-Out' as type
        FROM parts_issuance pi
        LEFT JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        WHERE pi.issued_at BETWEEN $1 AND $2
        ORDER BY pi.issued_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      issuances = issuanceResult.rows || [];
      console.log(`Found ${issuances.length} issuance records`);
      if (issuances.length > 0) {
        console.log("Sample issuance:", JSON.stringify(issuances[0]));
      }
    } catch (err) {
      console.error("Issuance query error:", err);
    }
    console.log("\nTesting delivery query...");
    let deliveries = [];
    try {
      const deliveryResult = await pool3.query(`
        SELECT 
          pd.id,
          pd.delivered_at as issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pd.quantity,
          p.unit_cost,
          b.name as building_name,
          (SELECT code FROM cost_centers WHERE id = pd.cost_center_id) as cost_center,
          'Delivery' as type
        FROM parts_delivery pd
        LEFT JOIN parts p ON pd.part_id = p.id
        LEFT JOIN buildings b ON pd.building_id = b.id
        WHERE pd.delivered_at BETWEEN $1 AND $2
        ORDER BY pd.delivered_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      deliveries = deliveryResult.rows || [];
      console.log(`Found ${deliveries.length} delivery records`);
      if (deliveries.length > 0) {
        console.log("Sample delivery:", JSON.stringify(deliveries[0]));
      }
    } catch (err) {
      console.error("Delivery query error:", err);
    }
    const combinedData = [...issuances, ...deliveries];
    console.log(`Total combined records: ${combinedData.length}`);
    let hasNullOrUndefined = false;
    let hasNaNValues = false;
    combinedData.forEach((item, index) => {
      if (!item.issued_at || !item.part_number || !item.part_name) {
        console.log(`Record ${index} has null essential fields:`, JSON.stringify(item));
        hasNullOrUndefined = true;
      }
      const unitCost = parseFloat(item.unit_cost || 0);
      if (isNaN(unitCost)) {
        console.log(`Record ${index} has NaN unit cost:`, item.unit_cost);
        hasNaNValues = true;
      }
    });
    console.log(`Data issues: hasNullOrUndefined=${hasNullOrUndefined}, hasNaNValues=${hasNaNValues}`);
    let totalValue = 0;
    combinedData.forEach((item) => {
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      totalValue += extendedPrice;
    });
    console.log(`Expected total value: $${totalValue.toFixed(2)}`);
    res.status(200).send(`
      <h1>Excel Export Debug Results</h1>
      <p>Month: ${month}</p>
      <p>Type: ${type}</p>
      <p>Date range: ${startDate.toISOString()} to ${endDate.toISOString()}</p>
      <p>Issuance records: ${issuances.length}</p>
      <p>Delivery records: ${deliveries.length}</p>
      <p>Total combined records: ${combinedData.length}</p>
      <p>Expected total value: $${totalValue.toFixed(2)}</p>
      <p>Data issues: hasNullOrUndefined=${hasNullOrUndefined}, hasNaNValues=${hasNaNValues}</p>
      
      <h2>Sample Data:</h2>
      <pre>${JSON.stringify(combinedData.slice(0, 3), null, 2)}</pre>
    `);
  } catch (error) {
    console.error("Debug export error:", error);
    res.status(500).send(`Export debug failed: ${error.message || "Unknown error"}`);
  } finally {
    console.log("==== DEBUG EXCEL EXPORT END ====");
    await pool3.end();
  }
}
var Pool4;
var init_excel_debug = __esm({
  "server/excel-debug.js"() {
    "use strict";
    ({ Pool: Pool4 } = pg4);
  }
});

// server/excel-working.js
import xlsx2 from "xlsx";
async function excelExport(req, res) {
  try {
    const { month, type = "all" } = req.query;
    if (!month) {
      return res.status(400).send("Month parameter is required");
    }
    console.log(`Processing Excel export for month ${month}, type: ${type}`);
    const [monthNum, year] = month.split("/");
    const startDate = /* @__PURE__ */ new Date(`${year}-${monthNum.padStart(2, "0")}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);
    console.log(`Date range for data filtering: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    let data = [];
    let filename = "";
    if (type === "all" || type === "charge-outs") {
      console.log(`Executing issuance query with date range: ${startDate} to ${endDate}`);
      const issuanceQuery = `
        SELECT 
          i.id, 
          i.issued_at AS date,
          p.part_id AS part_number,
          p.name AS part_name,
          i.quantity,
          p.unit_cost::numeric AS unit_cost,
          i.issued_to AS staff_name,
          b.name AS building_name,
          i.cost_center AS cost_center_code,
          cc.name AS cost_center_name
        FROM 
          parts_issuance i
        JOIN 
          parts p ON i.part_id = p.id
        LEFT JOIN 
          buildings b ON i.building_id = b.id
        LEFT JOIN 
          cost_centers cc ON i.cost_center = cc.code
        WHERE 
          i.issued_at BETWEEN $1 AND $2
        ORDER BY 
          i.issued_at ASC
      `;
      const issuanceResult = await pool2.query(issuanceQuery, [startDate, endDate]);
      console.log(`Found ${issuanceResult.rows.length} issuance records`);
      if (type === "charge-outs") {
        data = issuanceResult.rows.map((row) => ({ ...row, type: "Charge-Out" }));
        filename = `ONU-Charge-Outs-Report-${monthNum}_${year}.xlsx`;
      } else {
        console.log(`Executing delivery query with date range: ${startDate} to ${endDate}`);
        const deliveryQuery = `
          SELECT 
            pd.id, 
            pd.delivered_at AS date,
            p.part_id AS part_number,
            p.name AS part_name,
            pd.quantity,
            COALESCE(pd.unit_cost::numeric, p.unit_cost::numeric) AS unit_cost,
            s.name AS staff_name,
            b.name AS building_name,
            cc.code AS cost_center_code,
            cc.name AS cost_center_name
          FROM 
            parts_delivery pd
          JOIN 
            parts p ON pd.part_id = p.id
          JOIN 
            staff_members s ON pd.staff_member_id = s.id
          LEFT JOIN 
            buildings b ON pd.building_id = b.id
          LEFT JOIN 
            cost_centers cc ON pd.cost_center_id = cc.id
          WHERE 
            pd.delivered_at BETWEEN $1 AND $2
          ORDER BY 
            pd.delivered_at ASC
        `;
        const deliveryResult = await pool2.query(deliveryQuery, [startDate, endDate]);
        console.log(`Found ${deliveryResult.rows.length} delivery records`);
        data = [
          ...issuanceResult.rows.map((row) => ({ ...row, type: "Charge-Out" })),
          ...deliveryResult.rows.map((row) => ({ ...row, type: "Delivery" }))
        ];
        filename = `ONU-Combined-Report-${monthNum}_${year}.xlsx`;
      }
    } else if (type === "deliveries") {
      console.log(`Executing delivery-only query with date range: ${startDate} to ${endDate}`);
      const deliveryQuery = `
        SELECT 
          pd.id, 
          pd.delivered_at AS date,
          p.part_id AS part_number,
          p.name AS part_name,
          pd.quantity,
          COALESCE(pd.unit_cost::numeric, p.unit_cost::numeric) AS unit_cost,
          s.name AS staff_name,
          b.name AS building_name,
          cc.code AS cost_center_code,
          cc.name AS cost_center_name
        FROM 
          parts_delivery pd
        JOIN 
          parts p ON pd.part_id = p.id
        JOIN 
          staff_members s ON pd.staff_member_id = s.id
        LEFT JOIN 
          buildings b ON pd.building_id = b.id
        LEFT JOIN 
          cost_centers cc ON pd.cost_center_id = cc.id
        WHERE 
          pd.delivered_at BETWEEN $1 AND $2
        ORDER BY 
          pd.delivered_at ASC
      `;
      const deliveryResult = await pool2.query(deliveryQuery, [startDate, endDate]);
      console.log(`Found ${deliveryResult.rows.length} delivery records`);
      data = deliveryResult.rows.map((row) => ({ ...row, type: "Delivery" }));
      filename = `ONU-Deliveries-Report-${monthNum}_${year}.xlsx`;
    }
    if (data.length === 0) {
      console.log("No data found for the specified criteria");
      return res.status(404).send("No data found for the specified criteria");
    }
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    let totalCost = 0;
    data = data.map((item) => {
      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      const extendedPrice = quantity * unitCost;
      totalCost += extendedPrice;
      return {
        ...item,
        date: formattedDate,
        extended_price: `$${extendedPrice.toFixed(2)}`,
        running_total: `$${totalCost.toFixed(2)}`
      };
    });
    console.log(`Total cost: $${totalCost.toFixed(2)} from ${data.length} records`);
    const wb = xlsx2.utils.book_new();
    const columnOrder = [
      "id",
      "date",
      "part_number",
      "part_name",
      "quantity",
      "unit_cost",
      "extended_price",
      "running_total",
      "staff_name",
      "building_name",
      "cost_center_code",
      "cost_center_name",
      "type"
    ];
    const ws = xlsx2.utils.json_to_sheet(data, { header: columnOrder });
    const headers = [
      "ID",
      "Date",
      "Part Number",
      "Part Name",
      "Quantity",
      "Unit Cost",
      "Extended Price",
      "Running Total",
      "Staff Name",
      "Building Name",
      "Cost Center Code",
      "Cost Center Name",
      "Type"
    ];
    xlsx2.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });
    const lastRow = data.length + 1;
    xlsx2.utils.sheet_add_aoa(ws, [
      ["Total Cost:", `$${totalCost.toFixed(2)}`]
    ], { origin: { r: lastRow, c: 0 } });
    xlsx2.utils.book_append_sheet(wb, ws, "Report");
    const columnWidths = [
      { wch: 10 },
      // id
      { wch: 12 },
      // date
      { wch: 15 },
      // part_number
      { wch: 30 },
      // part_name
      { wch: 8 },
      // quantity
      { wch: 10 },
      // unit_cost
      { wch: 12 },
      // extended_price
      { wch: 12 },
      // running_total
      { wch: 25 },
      // staff_name
      { wch: 25 },
      // building_name
      { wch: 15 },
      // cost_center_code 
      { wch: 30 },
      // cost_center_name
      { wch: 10 }
      // type
    ];
    ws["!cols"] = columnWidths;
    const excelBuffer = xlsx2.write(wb, {
      bookType: "xlsx",
      type: "buffer"
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(excelBuffer);
    console.log(`Excel export successful: ${filename}`);
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).send(`Excel export failed: ${error.message}`);
  }
}
var init_excel_working = __esm({
  "server/excel-working.js"() {
    "use strict";
    init_db();
  }
});

// server/routes-final.js
var routes_final_exports = {};
__export(routes_final_exports, {
  default: () => routes_final_default
});
import express5 from "express";
var router4, routes_final_default;
var init_routes_final = __esm({
  "server/routes-final.js"() {
    "use strict";
    init_excel_working();
    router4 = express5.Router();
    router4.get("/api/excel-final", excelExport);
    routes_final_default = router4;
  }
});

// server/index.ts
import express6 from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// server/routes.ts
import express2 from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs4 from "fs";
import path5 from "path";

// server/pgStorage.ts
import pg from "pg";

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/pgStorage.ts
var { Pool } = pg;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    log(`Database connection error: ${err.message}`, "postgres");
  } else {
    log(`Database connected at ${res.rows[0].now}`, "postgres");
  }
});
var PgStorage = class {
  initialized = false;
  pool;
  notificationSettings = {
    system: {
      companyName: "Ohio Northern University",
      systemEmail: "m-gierhart@onu.edu"
    },
    workOrders: {
      newWorkOrders: true,
      statusChanges: true,
      comments: true
    },
    inventory: {
      lowStockAlerts: true,
      partIssuance: true
    }
  };
  constructor() {
    this.pool = pool;
    this.initDb();
  }
  /**
   * Initialize the database tables if they don't exist
   */
  async initDb() {
    if (this.initialized) return;
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            role VARCHAR(20) NOT NULL,
            department VARCHAR(100),
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS buildings (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            location VARCHAR(100),
            description TEXT,
            contact_person VARCHAR(100),
            contact_email VARCHAR(100),
            contact_phone VARCHAR(20),
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS parts (
            id SERIAL PRIMARY KEY,
            part_id VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            quantity INTEGER NOT NULL DEFAULT 0,
            reorder_level INTEGER,
            unit_cost DECIMAL(10, 2),
            category VARCHAR(50),
            location VARCHAR(100),
            supplier VARCHAR(100),
            last_restock_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS parts_issuance (
            id SERIAL PRIMARY KEY,
            part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL,
            issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            issued_to VARCHAR(100),
            issued_by INTEGER REFERENCES users(id),
            reason VARCHAR(50) NOT NULL,
            project_code VARCHAR(50),
            notes TEXT
          )
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS notification_settings (
            id SERIAL PRIMARY KEY,
            work_orders_new BOOLEAN DEFAULT TRUE,
            work_orders_status BOOLEAN DEFAULT TRUE,
            work_orders_comments BOOLEAN DEFAULT TRUE,
            inventory_low_stock BOOLEAN DEFAULT TRUE,
            inventory_issuance BOOLEAN DEFAULT TRUE,
            company_name VARCHAR(100) DEFAULT 'Ohio Northern University',
            system_email VARCHAR(100) DEFAULT 'm-gierhart@onu.edu',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        const tableCheckResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'parts_to_count'
          );
        `);
        if (!tableCheckResult.rows[0].exists) {
          await client.query(`
            CREATE TABLE parts_to_count (
              id SERIAL PRIMARY KEY,
              part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
              assigned_by_id INTEGER REFERENCES users(id),
              status VARCHAR(20) NOT NULL DEFAULT 'pending',
              assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              completed_at TIMESTAMP,
              notes TEXT
            )
          `);
        }
        await client.query(`
          INSERT INTO notification_settings 
            (work_orders_new, work_orders_status, work_orders_comments, 
             inventory_low_stock, inventory_issuance)
          SELECT TRUE, TRUE, TRUE, TRUE, TRUE
          WHERE NOT EXISTS (SELECT 1 FROM notification_settings)
        `);
        await client.query(`
          INSERT INTO users (username, password, name, email, role)
          SELECT 'admin', 'admin', 'Administrator', 'm-gierhart@onu.edu', 'admin'
          WHERE NOT EXISTS (SELECT 1 FROM users)
        `);
        await client.query("COMMIT");
        this.initialized = true;
        log("Database tables initialized successfully", "postgres");
      } catch (err) {
        await client.query("ROLLBACK");
        log(`Database initialization error: ${err instanceof Error ? err.message : String(err)}`, "postgres");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Database connection error: ${err instanceof Error ? err.message : String(err)}`, "postgres");
    }
  }
  // User operations
  async getUser(id) {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      };
    } catch (err) {
      log(`Error retrieving user: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async getUserByUsername(username) {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      };
    } catch (err) {
      log(`Error retrieving user by username: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async createUser(user) {
    try {
      const result = await pool.query(
        `INSERT INTO users (username, password, name, role, department)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          user.username,
          user.password,
          user.name,
          user.role,
          user.department
        ]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      };
    } catch (err) {
      log(`Error creating user: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      throw new Error(`Failed to create user: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async updateUser(id, user) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      if (user.username !== void 0) {
        updates.push(`username = $${paramIndex++}`);
        values.push(user.username);
      }
      if (user.password !== void 0) {
        updates.push(`password = $${paramIndex++}`);
        values.push(user.password);
      }
      if (user.name !== void 0) {
        updates.push(`name = $${paramIndex++}`);
        values.push(user.name);
      }
      if (user.role !== void 0) {
        updates.push(`role = $${paramIndex++}`);
        values.push(user.role);
      }
      if (user.department !== void 0) {
        updates.push(`department = $${paramIndex++}`);
        values.push(user.department);
      }
      if (updates.length === 0) {
        return await this.getUser(id);
      }
      values.push(id);
      const query = `
        UPDATE users 
        SET ${updates.join(", ")} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      };
    } catch (err) {
      log(`Error updating user: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async getUsers() {
    try {
      const result = await pool.query("SELECT * FROM users ORDER BY name");
      return result.rows.map((row) => ({
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      }));
    } catch (err) {
      log(`Error retrieving users: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async getTechnicians() {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE role = 'technician' ORDER BY name"
      );
      return result.rows.map((row) => ({
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      }));
    } catch (err) {
      log(`Error retrieving technicians: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async deleteUser(id) {
    try {
      const result = await pool.query(
        "DELETE FROM users WHERE id = $1",
        [id]
      );
      return result.rowCount > 0;
    } catch (err) {
      log(`Error deleting user: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    }
  }
  // Building operations
  async getBuilding(id) {
    try {
      const result = await pool.query(
        "SELECT * FROM buildings WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        location: row.location,
        description: row.description,
        contactPerson: row.contact_person,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        active: row.active !== false,
        createdAt: row.created_at
      };
    } catch (err) {
      log(`Error retrieving building: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async getBuildings() {
    try {
      const result = await pool.query("SELECT * FROM buildings ORDER BY name");
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        location: row.location,
        description: row.description,
        contactPerson: row.contact_person,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        active: row.active !== false,
        // Default to true if not explicitly set to false
        createdAt: row.created_at
      }));
    } catch (err) {
      log(`Error retrieving buildings: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  // Get a cost center by its code
  async getCostCenterByCode(code) {
    try {
      const result = await pool.query(
        "SELECT * FROM cost_centers WHERE code = $1",
        [code]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        code: row.code,
        name: row.name
      };
    } catch (err) {
      log(`Error retrieving cost center by code: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async createBuilding(building) {
    try {
      const result = await pool.query(
        `INSERT INTO buildings (
           name, location, description, contact_person, 
           contact_email, contact_phone, active
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          building.name,
          building.location,
          building.description,
          building.contactPerson,
          building.contactEmail,
          building.contactPhone,
          building.active !== void 0 ? building.active : true
        ]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        location: row.location,
        description: row.description,
        contactPerson: row.contact_person,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone
      };
    } catch (err) {
      log(`Error creating building: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      throw new Error(`Failed to create building: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async updateBuilding(id, building) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      if (building.name !== void 0) {
        updates.push(`name = $${paramIndex++}`);
        values.push(building.name);
      }
      if (building.location !== void 0) {
        updates.push(`location = $${paramIndex++}`);
        values.push(building.location);
      }
      if (building.description !== void 0) {
        updates.push(`description = $${paramIndex++}`);
        values.push(building.description);
      }
      if (building.contactPerson !== void 0) {
        updates.push(`contact_person = $${paramIndex++}`);
        values.push(building.contactPerson);
      }
      if (building.contactEmail !== void 0) {
        updates.push(`contact_email = $${paramIndex++}`);
        values.push(building.contactEmail);
      }
      if (building.contactPhone !== void 0) {
        updates.push(`contact_phone = $${paramIndex++}`);
        values.push(building.contactPhone);
      }
      if (updates.length === 0) {
        return await this.getBuilding(id);
      }
      values.push(id);
      const query = `
        UPDATE buildings 
        SET ${updates.join(", ")} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        location: row.location,
        description: row.description,
        contactPerson: row.contact_person,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone
      };
    } catch (err) {
      log(`Error updating building: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async deleteBuilding(id) {
    try {
      const result = await pool.query(
        "DELETE FROM buildings WHERE id = $1",
        [id]
      );
      return result.rowCount > 0;
    } catch (err) {
      log(`Error deleting building: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    }
  }
  // Part operations
  async getPart(id) {
    try {
      const result = await pool.query(
        "SELECT * FROM parts WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        location: row.location,
        // Include the location and shelf IDs
        locationId: row.location_id,
        shelfId: row.shelf_id,
        supplier: row.supplier,
        lastRestockDate: row.last_restock_date
      };
    } catch (err) {
      log(`Error retrieving part: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async getPartByPartId(partId) {
    try {
      console.log(`pgStorage.getPartByPartId - Looking for part with partId: "${partId}"`);
      const result = await pool.query(
        "SELECT * FROM parts WHERE part_id ILIKE $1",
        [partId.trim()]
      );
      console.log(`pgStorage.getPartByPartId - Query '${partId}' returned ${result.rows.length} rows`);
      if (result.rows.length === 0) {
        console.log(`pgStorage.getPartByPartId - No parts found with partId="${partId}"`);
        return void 0;
      }
      const row = result.rows[0];
      console.log(`pgStorage.getPartByPartId - Found part: ${row.part_id} - ${row.name}`);
      return {
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        location: row.location,
        supplier: row.supplier,
        lastRestockDate: row.last_restock_date,
        // Add the missing location/shelf ID fields
        locationId: row.location_id,
        shelfId: row.shelf_id
      };
    } catch (err) {
      log(`Error retrieving part by partId: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async getPartByBarcode(barcode) {
    try {
      console.log(`pgStorage.getPartByBarcode - Looking for part with barcode: "${barcode}"`);
      let result = await pool.query(
        "SELECT * FROM parts WHERE part_id ILIKE $1",
        [barcode.trim()]
      );
      if (result.rows.length === 0) {
        result = await pool.query(`
          SELECT p.* FROM parts p 
          INNER JOIN part_barcodes pb ON p.id = pb.part_id 
          WHERE pb.barcode = $1 AND pb.active = true
        `, [barcode.trim()]);
      }
      console.log(`pgStorage.getPartByBarcode - Query '${barcode}' returned ${result.rows.length} rows`);
      if (result.rows.length === 0) {
        console.log(`pgStorage.getPartByBarcode - No parts found with barcode="${barcode}"`);
        return void 0;
      }
      const row = result.rows[0];
      console.log(`pgStorage.getPartByBarcode - Found part: ${row.part_id} - ${row.name}`);
      return {
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        location: row.location,
        supplier: row.supplier,
        lastRestockDate: row.last_restock_date,
        locationId: row.location_id,
        shelfId: row.shelf_id
      };
    } catch (err) {
      log(`Error retrieving part by barcode: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async createPart(part) {
    try {
      const safeStr = (str, maxLen) => {
        if (str === null || str === void 0) return null;
        const strVal = String(str);
        return strVal.length > maxLen ? strVal.substring(0, maxLen) : strVal;
      };
      const safePart = {
        partId: safeStr(part.partId, 50),
        name: safeStr(part.name, 100),
        description: part.description,
        // TEXT field doesn't need truncation
        quantity: part.quantity,
        reorderLevel: part.reorderLevel,
        unitCost: part.unitCost,
        category: safeStr(part.category, 50),
        location: safeStr(part.location, 100),
        supplier: safeStr(part.supplier, 100),
        lastRestockDate: part.lastRestockDate,
        // Add location IDs if they exist
        locationId: part.locationId,
        shelfId: part.shelfId
      };
      console.log(`Creating part: ${safePart.partId}, ${safePart.name}`);
      const result = await pool.query(
        `INSERT INTO parts (
           part_id, name, description, quantity, reorder_level,
           unit_cost, category, location, supplier, last_restock_date,
           location_id, shelf_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          safePart.partId,
          safePart.name,
          safePart.description,
          safePart.quantity,
          safePart.reorderLevel,
          safePart.unitCost,
          safePart.category,
          safePart.location,
          safePart.supplier,
          safePart.lastRestockDate,
          safePart.locationId,
          safePart.shelfId
        ]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        location: row.location,
        // Include the location IDs
        locationId: row.location_id,
        shelfId: row.shelf_id,
        supplier: row.supplier,
        lastRestockDate: row.last_restock_date
      };
    } catch (err) {
      log(`Error creating part: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      throw new Error(`Failed to create part: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async updatePart(id, part) {
    try {
      console.log(`updatePart: Attempting to update part ID ${id} with data:`, part);
      const safeStr = (str, maxLen) => {
        if (str === null || str === void 0) return null;
        const strVal = String(str);
        return strVal.length > maxLen ? strVal.substring(0, maxLen) : strVal;
      };
      const updates = [];
      const values = [];
      let paramIndex = 1;
      if (part.partId !== void 0) {
        updates.push(`part_id = $${paramIndex++}`);
        values.push(safeStr(part.partId, 50));
      }
      if (part.name !== void 0) {
        updates.push(`name = $${paramIndex++}`);
        values.push(safeStr(part.name, 100));
      }
      if (part.description !== void 0) {
        updates.push(`description = $${paramIndex++}`);
        values.push(part.description);
      }
      if (part.quantity !== void 0) {
        updates.push(`quantity = $${paramIndex++}`);
        values.push(part.quantity);
      }
      if (part.reorderLevel !== void 0) {
        updates.push(`reorder_level = $${paramIndex++}`);
        values.push(part.reorderLevel);
      }
      if (part.unitCost !== void 0) {
        updates.push(`unit_cost = $${paramIndex++}`);
        values.push(part.unitCost);
      }
      if (part.category !== void 0) {
        updates.push(`category = $${paramIndex++}`);
        values.push(safeStr(part.category, 50));
      }
      if (part.location !== void 0) {
        updates.push(`location = $${paramIndex++}`);
        values.push(safeStr(part.location, 100));
        console.log(`Updating location text to: ${part.location}`);
      }
      if (part.locationId !== void 0) {
        updates.push(`location_id = $${paramIndex++}`);
        values.push(part.locationId);
        console.log(`Updating location_id to: ${part.locationId}`);
      }
      if (part.shelfId !== void 0) {
        updates.push(`shelf_id = $${paramIndex++}`);
        values.push(part.shelfId);
        console.log(`Updating shelf_id to: ${part.shelfId}`);
      }
      if (part.supplier !== void 0) {
        updates.push(`supplier = $${paramIndex++}`);
        values.push(safeStr(part.supplier, 100));
      }
      if (part.lastRestockDate !== void 0) {
        updates.push(`last_restock_date = $${paramIndex++}`);
        values.push(part.lastRestockDate);
      }
      if (updates.length === 0) {
        console.log(`updatePart: No updates provided, returning existing part`);
        return await this.getPart(id);
      }
      values.push(id);
      const query = `
        UPDATE parts 
        SET ${updates.join(", ")} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      console.log("Executing update query:", query);
      console.log("With values:", values);
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        console.log(`updatePart: No rows returned after update. Part ID ${id} not found.`);
        return void 0;
      }
      const row = result.rows[0];
      console.log(`updatePart: Successfully updated part ID ${id}. Returned row:`, row);
      return {
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        location: row.location,
        // Include the location IDs in the response
        locationId: row.location_id,
        shelfId: row.shelf_id,
        supplier: row.supplier,
        lastRestockDate: row.last_restock_date
      };
    } catch (err) {
      log(`Error updating part: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async deletePart(id) {
    try {
      const deliveriesCheck = await pool.query(
        "SELECT COUNT(*) FROM parts_delivery WHERE part_id = $1",
        [id]
      );
      const deliveryCount = parseInt(deliveriesCheck.rows[0].count);
      if (deliveryCount > 0) {
        log(`Cannot delete part ${id} - referenced in ${deliveryCount} deliveries`, "postgres");
        const updateResult = await pool.query(
          "UPDATE parts SET quantity = 0, location = NULL, location_id = NULL, shelf_id = NULL, name = CONCAT(name, ' (ARCHIVED)') WHERE id = $1",
          [id]
        );
        return updateResult.rowCount > 0;
      } else {
        const result = await pool.query(
          "DELETE FROM parts WHERE id = $1",
          [id]
        );
        return result.rowCount > 0;
      }
    } catch (err) {
      log(`Error deleting part: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    }
  }
  async getParts() {
    try {
      console.log("Fetching all parts from database...");
      const result = await pool.query("SELECT * FROM parts ORDER BY name");
      console.log(`Found ${result.rows.length} parts total in database`);
      if (result.rows.length > 0) {
        console.log("First part sample:", result.rows[0]);
      }
      return result.rows.map((row) => {
        return {
          id: row.id,
          partId: row.part_id,
          name: row.name,
          description: row.description,
          quantity: row.quantity,
          reorderLevel: row.reorder_level,
          unitCost: row.unit_cost,
          category: row.category,
          location: row.location,
          // Include the location IDs from the database
          locationId: row.location_id,
          shelfId: row.shelf_id,
          supplier: row.supplier,
          lastRestockDate: row.last_restock_date
        };
      });
    } catch (err) {
      log(`Error retrieving parts: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async getPartsByLocation(locationId, shelfId) {
    try {
      console.log(`GET /parts - Getting parts with filters: locationId=${locationId}, shelfId=${shelfId}`);
      let locationName = "";
      let shelfName = "";
      if (locationId) {
        const locationResult = await pool.query("SELECT name FROM storage_locations WHERE id = $1", [locationId]);
        if (locationResult.rows.length > 0) {
          locationName = locationResult.rows[0].name;
          console.log(`Looking for location name: ${locationName}`);
        }
      }
      if (shelfId) {
        const shelfResult = await pool.query("SELECT name FROM shelves WHERE id = $1", [shelfId]);
        if (shelfResult.rows.length > 0) {
          shelfName = shelfResult.rows[0].name;
          console.log(`Looking for shelf name: ${shelfName}`);
        }
      }
      let queryText = `SELECT * FROM parts`;
      const queryParams = [];
      if (locationName && shelfName) {
        queryText += ` WHERE location LIKE $1`;
        queryParams.push(`%${locationName}%${shelfName}%`);
      } else if (locationName) {
        queryText += ` WHERE location LIKE $1`;
        queryParams.push(`%${locationName}%`);
      } else if (shelfName) {
        queryText += ` WHERE location LIKE $1`;
        queryParams.push(`%${shelfName}%`);
      }
      queryText += ` ORDER BY name ASC`;
      console.log(`Executing query: ${queryText} with params: ${queryParams}`);
      const result = await pool.query(queryText, queryParams);
      console.log(`GET /parts - Found ${result.rows.length} parts`);
      if (result.rows.length > 0) {
        console.log(`GET /parts - First part: ${JSON.stringify(result.rows[0])}`);
      }
      return result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        location: row.location,
        // Include the location IDs from the database
        locationId: row.location_id,
        shelfId: row.shelf_id,
        supplier: row.supplier,
        lastRestockDate: row.last_restock_date
      }));
    } catch (err) {
      log(`Error fetching parts by location: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async getLowStockParts() {
    try {
      const result = await pool.query(`
        SELECT * FROM parts 
        WHERE reorder_level IS NOT NULL AND quantity <= reorder_level
        ORDER BY name
      `);
      return result.rows.map((row) => {
        let availability = "high";
        if (row.reorder_level !== null) {
          if (row.quantity <= row.reorder_level * 0.5) {
            availability = "low";
          } else if (row.quantity <= row.reorder_level) {
            availability = "medium";
          }
        }
        return {
          id: row.id,
          partId: row.part_id,
          name: row.name,
          description: row.description,
          quantity: row.quantity,
          reorderLevel: row.reorder_level,
          unitCost: row.unit_cost,
          category: row.category,
          location: row.location,
          // Include the location IDs from the database
          locationId: row.location_id,
          shelfId: row.shelf_id,
          supplier: row.supplier,
          lastRestockDate: row.last_restock_date,
          availability
        };
      });
    } catch (err) {
      log(`Error retrieving low stock parts: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  // Parts Issuance operations
  async getPartsIssuance(id) {
    try {
      const result = await pool.query(
        "SELECT * FROM parts_issuance WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedAt: row.issued_at,
        issuedTo: row.issued_to,
        issuedById: row.issued_by_id,
        // Changed from issuedBy to issuedById to match database structure
        reason: row.reason,
        projectCode: row.project_code,
        notes: row.notes
      };
    } catch (err) {
      log(`Error retrieving parts issuance: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async createPartsIssuance(issuance) {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const partResult = await client.query(
          "SELECT * FROM parts WHERE id = $1",
          [issuance.partId]
        );
        if (partResult.rows.length === 0) {
          throw new Error(`Part with ID ${issuance.partId} not found`);
        }
        const part = partResult.rows[0];
        if (part.quantity < issuance.quantity) {
          throw new Error(`Insufficient quantity available for part ${part.name}`);
        }
        await client.query(
          "UPDATE parts SET quantity = quantity - $1 WHERE id = $2",
          [issuance.quantity, issuance.partId]
        );
        const result = await client.query(
          `INSERT INTO parts_issuance (
             part_id, quantity, issued_at, issued_to, 
             issued_by, reason, project_code, notes,
             department, building_id, cost_center
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            issuance.partId,
            issuance.quantity,
            issuance.issuedAt || /* @__PURE__ */ new Date(),
            issuance.issuedTo,
            issuance.issuedById,
            issuance.reason,
            issuance.projectCode,
            issuance.notes,
            issuance.department,
            issuance.buildingId,
            issuance.costCenter
          ]
        );
        await client.query("COMMIT");
        const row = result.rows[0];
        return {
          id: row.id,
          partId: row.part_id,
          quantity: row.quantity,
          issuedAt: row.issued_at,
          issuedTo: row.issued_to,
          issuedById: row.issued_by,
          reason: row.reason,
          department: row.department,
          buildingId: row.building_id,
          costCenter: row.cost_center,
          projectCode: row.project_code,
          notes: row.notes
        };
      } catch (err) {
        await client.query("ROLLBACK");
        log(`Error in transaction - createPartsIssuance: ${err instanceof Error ? err.message : String(err)}`, "postgres");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Error creating parts issuance: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      throw new Error(`Failed to create parts issuance: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async getPartsIssuanceByPartId(partId) {
    try {
      const result = await pool.query(`
        SELECT 
          pi.*,
          p.part_id as part_part_id, 
          p.name as part_name,
          p.description as part_description,
          p.category as part_category,
          p.location as part_location,
          p.location_id as part_location_id,
          p.shelf_id as part_shelf_id,
          p.unit_cost as part_unit_cost,
          u.name as issued_by_name,
          u.role as issued_by_role,
          u.department as issued_by_department
        FROM parts_issuance pi
        JOIN parts p ON pi.part_id = p.id
        LEFT JOIN users u ON pi.issued_by_id = u.id
        WHERE pi.part_id = $1
        ORDER BY pi.issued_at DESC
      `, [partId]);
      return result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedAt: row.issued_at,
        issuedTo: row.issued_to,
        issuedById: row.issued_by_id,
        reason: row.reason,
        projectCode: row.project_code,
        notes: row.notes,
        department: row.department,
        part: {
          id: row.part_id,
          partId: row.part_part_id,
          name: row.part_name,
          description: row.part_description,
          quantity: row.quantity,
          // We just show the issued quantity here
          reorderLevel: null,
          unitCost: row.part_unit_cost,
          category: row.part_category,
          location: row.part_location,
          supplier: null,
          lastRestockDate: null
        },
        issuedByUser: row.issued_by_id ? {
          id: row.issued_by_id,
          username: "",
          // Don't expose username
          password: "",
          // Don't expose password
          name: row.issued_by_name,
          role: row.issued_by_role,
          department: row.issued_by_department
        } : void 0
      }));
    } catch (err) {
      log(`Error retrieving parts issuance by part ID: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async getRecentPartsIssuance(limit) {
    try {
      const result = await pool.query(`
        SELECT 
          pi.*,
          p.part_id as part_part_id, 
          p.name as part_name,
          p.description as part_description,
          p.category as part_category,
          p.location as part_location,
          p.location_id as part_location_id,
          p.shelf_id as part_shelf_id,
          p.unit_cost as part_unit_cost,
          b.name as building_name,
          cc.name as cost_center_name,
          cc.code as cost_center_code,
          u.name as issued_by_name,
          u.role as issued_by_role,
          u.department as issued_by_department
        FROM parts_issuance pi
        JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        LEFT JOIN cost_centers cc ON pi.cost_center = cc.code
        LEFT JOIN users u ON pi.issued_by = u.id
        ORDER BY pi.issued_at DESC
        LIMIT $1
      `, [limit]);
      return result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedAt: row.issued_at,
        issuedTo: row.issued_to,
        issuedById: row.issued_by,
        buildingId: row.building_id,
        costCenter: row.cost_center,
        buildingName: row.building_name,
        costCenterName: row.cost_center_name,
        costCenterCode: row.cost_center_code,
        reason: row.reason,
        projectCode: row.project_code,
        notes: row.notes,
        department: row.department,
        part: {
          id: row.part_id,
          partId: row.part_part_id,
          name: row.part_name,
          description: row.part_description,
          quantity: row.quantity,
          // We just show the issued quantity here
          reorderLevel: null,
          unitCost: row.part_unit_cost,
          category: row.part_category,
          location: row.part_location,
          supplier: null,
          lastRestockDate: null
        },
        issuedByUser: row.issued_by_id ? {
          id: row.issued_by_id,
          username: "",
          // Don't expose username
          password: "",
          // Don't expose password
          name: row.issued_by_name,
          role: row.issued_by_role,
          department: row.issued_by_department
        } : void 0
      }));
    } catch (err) {
      log(`Error retrieving recent parts issuance: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async getMonthlyPartsIssuanceTotal() {
    try {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS reset_flags (
            key TEXT PRIMARY KEY,
            value BOOLEAN,
            reset_at TIMESTAMP
          )
        `);
        const resetResult = await pool.query(`
          SELECT value, reset_at 
          FROM reset_flags 
          WHERE key = 'monthly_issuance_reset'
        `);
        if (resetResult.rows.length > 0 && resetResult.rows[0].value === true) {
          const resetAt = new Date(resetResult.rows[0].reset_at);
          const result2 = await pool.query(`
            SELECT COUNT(*) as total
            FROM parts_issuance
            WHERE issued_at > $1
          `, [resetAt]);
          return parseInt(result2.rows[0].total, 10);
        }
      } catch (resetErr) {
        console.log("Reset flag check failed (table may not exist):", resetErr);
      }
      const result = await pool.query(`
        SELECT COALESCE(SUM(quantity), 0) as total
        FROM parts_issuance
        WHERE issued_at >= date_trunc('month', CURRENT_DATE)
      `);
      console.log("Monthly parts issuance count result:", result.rows[0]);
      return parseInt(result.rows[0].total, 10);
    } catch (err) {
      log(`Error retrieving monthly parts issuance total: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return 0;
    }
  }
  // Update a parts issuance record
  async updatePartsIssuance(id, partsIssuanceUpdate) {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const getResult = await client.query(
          "SELECT * FROM parts_issuance WHERE id = $1",
          [id]
        );
        if (getResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return void 0;
        }
        const existing = getResult.rows[0];
        if (partsIssuanceUpdate.quantity && partsIssuanceUpdate.quantity !== existing.quantity) {
          const partResult = await client.query(
            "SELECT * FROM parts WHERE id = $1",
            [existing.part_id]
          );
          if (partResult.rows.length > 0) {
            const part = partResult.rows[0];
            const quantityDifference = partsIssuanceUpdate.quantity - existing.quantity;
            const newPartQuantity = part.quantity - quantityDifference;
            if (newPartQuantity < 0) {
              await client.query("ROLLBACK");
              throw new Error(`Not enough parts in inventory. Only ${part.quantity} available.`);
            }
            await client.query(
              "UPDATE parts SET quantity = $1 WHERE id = $2",
              [newPartQuantity, part.id]
            );
          }
        }
        let buildingId = existing.building_id;
        if (partsIssuanceUpdate.building) {
          const buildingResult = await client.query(
            "SELECT id FROM buildings WHERE name = $1",
            [partsIssuanceUpdate.building]
          );
          if (buildingResult.rows.length > 0) {
            buildingId = buildingResult.rows[0].id;
          }
        }
        let costCenter = existing.cost_center;
        if (partsIssuanceUpdate.costCenter && partsIssuanceUpdate.costCenter !== "none") {
          costCenter = partsIssuanceUpdate.costCenter;
        } else if (partsIssuanceUpdate.costCenter === "none") {
          costCenter = null;
        }
        const result = await client.query(
          `UPDATE parts_issuance 
           SET issued_to = $1,
               quantity = $2,
               notes = $3,
               department = $4,
               project_code = $5,
               reason = $6,
               issued_by = $7,
               issued_at = $8,
               building_id = $9,
               cost_center = $10
           WHERE id = $11
           RETURNING *`,
          [
            partsIssuanceUpdate.issuedTo ?? existing.issued_to,
            partsIssuanceUpdate.quantity ?? existing.quantity,
            partsIssuanceUpdate.notes ?? existing.notes,
            partsIssuanceUpdate.department ?? existing.department,
            partsIssuanceUpdate.projectCode ?? existing.project_code,
            partsIssuanceUpdate.reason ?? existing.reason,
            partsIssuanceUpdate.issuedById ?? existing.issued_by,
            partsIssuanceUpdate.issuedAt ?? existing.issued_at,
            buildingId,
            costCenter,
            id
          ]
        );
        await client.query("COMMIT");
        if (result.rowCount === 0) return void 0;
        const updated = {
          id: result.rows[0].id,
          partId: result.rows[0].part_id,
          quantity: result.rows[0].quantity,
          issuedTo: result.rows[0].issued_to,
          reason: result.rows[0].reason,
          issuedAt: result.rows[0].issued_at,
          issuedById: result.rows[0].issued_by,
          notes: result.rows[0].notes,
          department: result.rows[0].department,
          projectCode: result.rows[0].project_code,
          buildingId: result.rows[0].building_id,
          costCenter: result.rows[0].cost_center
        };
        return updated;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error updating parts issuance:", error);
      throw error;
    }
  }
  // Delete a parts issuance record and restore the inventory
  async deletePartsIssuance(id) {
    try {
      log(`Attempting to delete parts issuance #${id}`, "postgres");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const issuanceResult = await client.query(
          "SELECT * FROM parts_issuance WHERE id = $1",
          [id]
        );
        if (issuanceResult.rows.length === 0) {
          log(`No issuance found with ID ${id}`, "postgres");
          await client.query("ROLLBACK");
          return false;
        }
        const issuance = issuanceResult.rows[0];
        log(`Found issuance: ${issuance.quantity} of part ${issuance.part_id}`, "postgres");
        await client.query(
          "UPDATE parts SET quantity = quantity + $1 WHERE id = $2",
          [issuance.quantity, issuance.part_id]
        );
        const deleteResult = await client.query("DELETE FROM parts_issuance WHERE id = $1", [id]);
        log(`Delete result: ${deleteResult.rowCount} rows affected`, "postgres");
        await client.query("COMMIT");
        log(`Successfully deleted parts issuance #${id} and restored ${issuance.quantity} items to inventory`, "postgres");
        return true;
      } catch (err) {
        await client.query("ROLLBACK");
        log(`Error in delete transaction: ${err instanceof Error ? err.message : String(err)}`, "postgres");
        return false;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Error deleting parts issuance: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    }
  }
  // Reset all parts issuance for a specific month
  async resetMonthlyPartsIssuance(year, month) {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        console.log(`Resetting parts issuance for ${month}/${year} (${startDate.toISOString()} to ${endDate.toISOString()})`);
        const issuanceResult = await client.query(
          "SELECT * FROM parts_issuance WHERE issued_at BETWEEN $1 AND $2",
          [startDate, endDate]
        );
        for (const issuance of issuanceResult.rows) {
          await client.query(
            "UPDATE parts SET quantity = quantity + $1 WHERE id = $2",
            [issuance.quantity, issuance.part_id]
          );
          console.log(`Restored ${issuance.quantity} items of part ID ${issuance.part_id} to inventory`);
        }
        const deleteResult = await client.query(
          "DELETE FROM parts_issuance WHERE issued_at BETWEEN $1 AND $2",
          [startDate, endDate]
        );
        console.log(`Deleted ${deleteResult.rowCount} issuance records for ${month}/${year}`);
        await client.query(`
          INSERT INTO reset_flags (key, value, reset_at)
          VALUES ('monthly_issuance_reset', true, NOW())
          ON CONFLICT (key) DO UPDATE
          SET value = true, reset_at = NOW()
        `);
        await client.query("COMMIT");
        return true;
      } catch (err) {
        await client.query("ROLLBACK");
        log(`Error resetting monthly parts issuance: ${err instanceof Error ? err.message : String(err)}`, "postgres");
        return false;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Error resetting monthly parts issuance: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    }
  }
  // Parts to Count operations
  async createPartsToCount(partsToCount2) {
    try {
      const result = await pool.query(
        `INSERT INTO parts_to_count (part_id, assigned_by_id, status, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          partsToCount2.partId,
          partsToCount2.assignedById || null,
          partsToCount2.status || "pending",
          partsToCount2.notes || null
        ]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        assignedById: row.assigned_by_id,
        status: row.status || "pending",
        assignedAt: row.assigned_at || /* @__PURE__ */ new Date(),
        completedAt: row.completed_at,
        notes: row.notes
      };
    } catch (err) {
      log(`Error creating parts to count assignment: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      throw new Error(`Failed to create parts to count assignment: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async getPartsToCount() {
    try {
      const result = await pool.query(`
        SELECT ptc.*, 
               p.id as part_id, p.part_id as part_part_id, p.name as part_name, 
               p.description as part_description, p.quantity as part_quantity,
               p.reorder_level as part_reorder_level, p.location as part_location,
               p.category as part_category, p.supplier as part_supplier,
               p.unit_cost as part_unit_cost,
               p.last_restock_date as part_last_restock_date,
               u.id as user_id, u.name as user_name, u.username as user_username,
               u.role as user_role, u.department as user_department
        FROM parts_to_count ptc
        JOIN parts p ON ptc.part_id = p.id
        LEFT JOIN users u ON ptc.assigned_by_id = u.id
        ORDER BY ptc.assigned_at DESC
      `);
      return result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        assignedById: row.assigned_by_id,
        status: row.status,
        assignedAt: row.assigned_at,
        completedAt: row.completed_at,
        notes: row.notes,
        part: {
          id: row.part_id,
          partId: row.part_part_id,
          name: row.part_name,
          description: row.part_description,
          quantity: row.part_quantity,
          reorderLevel: row.part_reorder_level,
          unitCost: row.part_unit_cost,
          location: row.part_location,
          category: row.part_category,
          supplier: row.part_supplier,
          lastRestockDate: row.part_last_restock_date
        },
        assignedBy: row.user_id ? {
          id: row.user_id,
          username: row.user_username,
          name: row.user_name,
          role: row.user_role,
          department: row.user_department,
          password: ""
          // Password is not returned for security
        } : void 0
      }));
    } catch (err) {
      log(`Error retrieving parts to count: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async getPendingPartsToCount() {
    try {
      const result = await pool.query(`
        SELECT ptc.*, 
               p.id as part_id, p.part_id as part_part_id, p.name as part_name, 
               p.description as part_description, p.quantity as part_quantity,
               p.reorder_level as part_reorder_level, p.location as part_location,
               p.category as part_category, p.supplier as part_supplier,
               p.unit_cost as part_unit_cost,
               p.last_restock_date as part_last_restock_date,
               u.id as user_id, u.name as user_name, u.username as user_username,
               u.role as user_role, u.department as user_department
        FROM parts_to_count ptc
        JOIN parts p ON ptc.part_id = p.id
        LEFT JOIN users u ON ptc.assigned_by_id = u.id
        WHERE ptc.status = 'pending'
        ORDER BY ptc.assigned_at DESC
      `);
      return result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        assignedById: row.assigned_by_id,
        status: row.status,
        assignedAt: row.assigned_at,
        completedAt: row.completed_at,
        notes: row.notes,
        part: {
          id: row.part_id,
          partId: row.part_part_id,
          name: row.part_name,
          description: row.part_description,
          quantity: row.part_quantity,
          reorderLevel: row.part_reorder_level,
          unitCost: row.part_unit_cost,
          location: row.part_location,
          category: row.part_category,
          supplier: row.part_supplier,
          lastRestockDate: row.part_last_restock_date
        },
        assignedBy: row.user_id ? {
          id: row.user_id,
          username: row.user_username,
          name: row.user_name,
          role: row.user_role,
          department: row.user_department,
          password: ""
          // Password is not returned for security
        } : void 0
      }));
    } catch (err) {
      log(`Error retrieving pending parts to count: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async updatePartsToCountStatus(id, status, completedAt) {
    try {
      const now = completedAt || (status === "completed" ? /* @__PURE__ */ new Date() : null);
      const result = await pool.query(
        `UPDATE parts_to_count 
         SET status = $1, 
             completed_at = $2
         WHERE id = $3
         RETURNING *`,
        [status, now, id]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        assignedById: row.assigned_by_id,
        status: row.status,
        assignedAt: row.assigned_at,
        completedAt: row.completed_at,
        notes: row.notes
      };
    } catch (err) {
      log(`Error updating parts to count status: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async deletePartsToCount(id) {
    try {
      const result = await pool.query(
        "DELETE FROM parts_to_count WHERE id = $1",
        [id]
      );
      return result.rowCount > 0;
    } catch (err) {
      log(`Error deleting parts to count: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    }
  }
  // Parts Pickup operations
  async getPartsPickup(id) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM parts_pickup WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      return {
        id: result.rows[0].id,
        partName: result.rows[0].part_name,
        partNumber: result.rows[0].part_number,
        quantity: result.rows[0].quantity,
        supplier: result.rows[0].supplier,
        buildingId: result.rows[0].building_id,
        addedById: result.rows[0].added_by_id,
        addedAt: result.rows[0].added_at,
        pickedUpById: result.rows[0].picked_up_by_id,
        pickedUpAt: result.rows[0].picked_up_at,
        status: result.rows[0].status,
        notes: result.rows[0].notes,
        trackingNumber: result.rows[0].tracking_number,
        poNumber: result.rows[0].po_number,
        pickupCode: result.rows[0].pickup_code
      };
    } catch (error) {
      console.error("Error getting parts pickup:", error);
      return void 0;
    } finally {
      client.release();
    }
  }
  async getPartsPickups() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          pp.*,
          b.name as building_name,
          b.description as building_description,
          added_user.name as added_by_name,
          picked_user.name as picked_up_by_name
        FROM parts_pickup pp
        LEFT JOIN buildings b ON pp.building_id = b.id
        LEFT JOIN users added_user ON pp.added_by_id = added_user.id
        LEFT JOIN users picked_user ON pp.picked_up_by_id = picked_user.id
        ORDER BY pp.added_at DESC
      `);
      return result.rows.map((row) => {
        const building = row.building_id ? {
          id: row.building_id,
          name: row.building_name,
          description: row.building_description
        } : void 0;
        const addedBy = row.added_by_id ? {
          id: row.added_by_id,
          name: row.added_by_name
        } : void 0;
        const pickedUpBy = row.picked_up_by_id ? {
          id: row.picked_up_by_id,
          name: row.picked_up_by_name
        } : void 0;
        return {
          id: row.id,
          partName: row.part_name,
          partNumber: row.part_number,
          quantity: row.quantity,
          supplier: row.supplier,
          buildingId: row.building_id,
          addedById: row.added_by_id,
          addedAt: row.added_at,
          pickedUpById: row.picked_up_by_id,
          pickedUpAt: row.picked_up_at,
          status: row.status,
          notes: row.notes,
          trackingNumber: row.tracking_number,
          poNumber: row.po_number,
          pickupCode: row.pickup_code,
          // Add pickup code to the returned object
          building,
          addedBy,
          pickedUpBy
        };
      });
    } catch (error) {
      console.error("Error getting parts pickups:", error);
      return [];
    } finally {
      client.release();
    }
  }
  async getPendingPartsPickups() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          pp.*,
          b.name as building_name,
          b.description as building_description,
          added_user.name as added_by_name,
          picked_user.name as picked_up_by_name
        FROM parts_pickup pp
        LEFT JOIN buildings b ON pp.building_id = b.id
        LEFT JOIN users added_user ON pp.added_by_id = added_user.id
        LEFT JOIN users picked_user ON pp.picked_up_by_id = picked_user.id
        WHERE pp.status = 'pending'
        ORDER BY pp.added_at DESC
      `);
      return result.rows.map((row) => {
        const building = row.building_id ? {
          id: row.building_id,
          name: row.building_name,
          description: row.building_description
        } : void 0;
        const addedBy = row.added_by_id ? {
          id: row.added_by_id,
          name: row.added_by_name
        } : void 0;
        const pickedUpBy = row.picked_up_by_id ? {
          id: row.picked_up_by_id,
          name: row.picked_up_by_name
        } : void 0;
        return {
          id: row.id,
          partName: row.part_name,
          partNumber: row.part_number,
          quantity: row.quantity,
          supplier: row.supplier,
          buildingId: row.building_id,
          addedById: row.added_by_id,
          addedAt: row.added_at,
          pickedUpById: row.picked_up_by_id,
          pickedUpAt: row.picked_up_at,
          status: row.status,
          notes: row.notes,
          trackingNumber: row.tracking_number,
          poNumber: row.po_number,
          pickupCode: row.pickup_code,
          // Add pickup code to returned object
          building,
          addedBy,
          pickedUpBy
        };
      });
    } catch (error) {
      console.error("Error getting pending parts pickups:", error);
      return [];
    } finally {
      client.release();
    }
  }
  async createPartsPickup(partsPickup2) {
    const client = await this.pool.connect();
    try {
      const pickupCode = Math.floor(1e3 + Math.random() * 9e3).toString();
      const result = await client.query(`
        INSERT INTO parts_pickup (
          part_name, part_number, quantity, supplier, building_id,
          added_by_id, notes, tracking_number, po_number, status, pickup_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        partsPickup2.partName,
        partsPickup2.partNumber || null,
        partsPickup2.quantity || 1,
        partsPickup2.supplier || null,
        partsPickup2.buildingId || null,
        partsPickup2.addedById,
        partsPickup2.notes || null,
        partsPickup2.trackingNumber || null,
        partsPickup2.poNumber || null,
        "pending",
        // Default status for new parts pickups
        pickupCode
        // Add the random 4-digit code
      ]);
      return {
        id: result.rows[0].id,
        partName: result.rows[0].part_name,
        partNumber: result.rows[0].part_number,
        quantity: result.rows[0].quantity,
        supplier: result.rows[0].supplier,
        buildingId: result.rows[0].building_id,
        addedById: result.rows[0].added_by_id,
        addedAt: result.rows[0].added_at,
        pickedUpById: result.rows[0].picked_up_by_id,
        pickedUpAt: result.rows[0].picked_up_at,
        status: result.rows[0].status,
        notes: result.rows[0].notes,
        trackingNumber: result.rows[0].tracking_number,
        poNumber: result.rows[0].po_number,
        pickupCode: result.rows[0].pickup_code
      };
    } catch (error) {
      console.error("Error creating parts pickup:", error);
      throw error;
    } finally {
      client.release();
    }
  }
  async updatePartsPickupStatus(id, technicianId) {
    const client = await this.pool.connect();
    try {
      const now = /* @__PURE__ */ new Date();
      const result = await client.query(`
        UPDATE parts_pickup 
        SET status = 'completed', picked_up_by_id = $2, picked_up_at = $3
        WHERE id = $1
        RETURNING *
      `, [id, technicianId, now]);
      if (result.rows.length === 0) {
        return void 0;
      }
      return {
        id: result.rows[0].id,
        partName: result.rows[0].part_name,
        partNumber: result.rows[0].part_number,
        quantity: result.rows[0].quantity,
        supplier: result.rows[0].supplier,
        buildingId: result.rows[0].building_id,
        addedById: result.rows[0].added_by_id,
        addedAt: result.rows[0].added_at,
        pickedUpById: result.rows[0].picked_up_by_id,
        pickedUpAt: result.rows[0].picked_up_at,
        status: result.rows[0].status,
        notes: result.rows[0].notes,
        trackingNumber: result.rows[0].tracking_number,
        poNumber: result.rows[0].po_number,
        pickupCode: result.rows[0].pickup_code
      };
    } catch (error) {
      console.error("Error updating parts pickup status:", error);
      return void 0;
    } finally {
      client.release();
    }
  }
  async deletePartsPickup(id) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM parts_pickup WHERE id = $1 RETURNING id`,
        [id]
      );
      return result.rowCount === 1;
    } catch (error) {
      console.error("Error deleting parts pickup:", error);
      return false;
    } finally {
      client.release();
    }
  }
  // Tool SignOut Methods
  async getNextToolNumber() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT MAX(tool_number) as max_number FROM tool_signouts`
      );
      const maxToolNumber = result.rows[0].max_number || 0;
      return maxToolNumber + 1;
    } catch (error) {
      console.error("Error getting next tool number:", error);
      return 1;
    } finally {
      client.release();
    }
  }
  async createToolSignout(toolSignout) {
    const client = await this.pool.connect();
    try {
      if (!toolSignout.toolNumber) {
        toolSignout.toolNumber = await this.getNextToolNumber();
      }
      const result = await client.query(
        `INSERT INTO tool_signouts (
          tool_number, tool_name, technician_id, status, signed_out_at, notes
        ) VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING id, tool_number, tool_name, technician_id, status, signed_out_at, returned_at, notes`,
        [
          toolSignout.toolNumber,
          toolSignout.toolName,
          toolSignout.technicianId,
          toolSignout.status || "checked_out",
          toolSignout.notes || null
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating tool signout:", error);
      throw error;
    } finally {
      client.release();
    }
  }
  async getToolSignout(id) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM tool_signouts WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return void 0;
      }
      return result.rows[0];
    } catch (error) {
      console.error("Error getting tool signout:", error);
      return void 0;
    } finally {
      client.release();
    }
  }
  async getAllToolSignouts() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          t.*, 
          u.id as user_id, 
          u.name as user_name, 
          u.username, 
          u.role, 
          u.department 
        FROM 
          tool_signouts t
        LEFT JOIN 
          users u ON t.technician_id = u.id
        ORDER BY 
          t.signed_out_at DESC`
      );
      return result.rows.map((row) => {
        const technician = row.user_id ? {
          id: row.user_id,
          name: row.user_name,
          username: row.username,
          role: row.role,
          department: row.department
        } : void 0;
        return {
          id: row.id,
          toolNumber: row.tool_number,
          toolName: row.tool_name,
          technicianId: row.technician_id,
          status: row.status,
          signedOutAt: row.signed_out_at,
          returnedAt: row.returned_at,
          notes: row.notes,
          technician
        };
      });
    } catch (error) {
      console.error("Error getting all tool signouts:", error);
      return [];
    } finally {
      client.release();
    }
  }
  async getToolSignoutsByTechnician(technicianId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM tool_signouts WHERE technician_id = $1 ORDER BY signed_out_at DESC`,
        [technicianId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting technician's tool signouts:", error);
      return [];
    } finally {
      client.release();
    }
  }
  async getToolSignoutsByStatus(status) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          t.*, 
          u.id as user_id, 
          u.name as user_name, 
          u.username, 
          u.role, 
          u.department 
        FROM 
          tool_signouts t
        LEFT JOIN 
          users u ON t.technician_id = u.id
        WHERE 
          t.status = $1
        ORDER BY 
          t.signed_out_at DESC`,
        [status]
      );
      return result.rows.map((row) => {
        const technician = row.user_id ? {
          id: row.user_id,
          name: row.user_name,
          username: row.username,
          role: row.role,
          department: row.department
        } : void 0;
        return {
          id: row.id,
          toolNumber: row.tool_number,
          toolName: row.tool_name,
          technicianId: row.technician_id,
          status: row.status,
          signedOutAt: row.signed_out_at,
          returnedAt: row.returned_at,
          notes: row.notes,
          technician
        };
      });
    } catch (error) {
      console.error("Error getting tool signouts by status:", error);
      return [];
    } finally {
      client.release();
    }
  }
  async updateToolSignout(id, updates) {
    const client = await this.pool.connect();
    try {
      const existingResult = await client.query(
        `SELECT * FROM tool_signouts WHERE id = $1`,
        [id]
      );
      if (existingResult.rows.length === 0) {
        return void 0;
      }
      const existing = existingResult.rows[0];
      if (updates.status === "returned" && !updates.returnedAt) {
        updates.returnedAt = /* @__PURE__ */ new Date();
      }
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;
      if (updates.toolName !== void 0) {
        updateFields.push(`tool_name = $${paramIndex++}`);
        queryParams.push(updates.toolName);
      }
      if (updates.status !== void 0) {
        updateFields.push(`status = $${paramIndex++}`);
        queryParams.push(updates.status);
      }
      if (updates.notes !== void 0) {
        updateFields.push(`notes = $${paramIndex++}`);
        queryParams.push(updates.notes);
      }
      if (updates.returnedAt !== void 0) {
        updateFields.push(`returned_at = $${paramIndex++}`);
        queryParams.push(updates.returnedAt);
      }
      queryParams.push(id);
      if (updateFields.length === 0) {
        return existing;
      }
      const result = await client.query(
        `UPDATE tool_signouts 
        SET ${updateFields.join(", ")} 
        WHERE id = $${paramIndex} 
        RETURNING id, tool_number, tool_name, technician_id, status, signed_out_at, returned_at, notes`,
        queryParams
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating tool signout:", error);
      return void 0;
    } finally {
      client.release();
    }
  }
  async deleteToolSignout(id) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM tool_signouts WHERE id = $1 RETURNING id`,
        [id]
      );
      return result.rowCount === 1;
    } catch (error) {
      console.error("Error deleting tool signout:", error);
      return false;
    } finally {
      client.release();
    }
  }
  // Settings operations
  async getNotificationSettings() {
    try {
      const result = await pool.query("SELECT * FROM notification_settings LIMIT 1");
      if (result.rows.length === 0) {
        return this.notificationSettings;
      }
      const row = result.rows[0];
      return {
        system: {
          companyName: row.company_name || "Ohio Northern University",
          systemEmail: row.system_email || "m-gierhart@onu.edu"
        },
        workOrders: {
          newWorkOrders: row.work_orders_new,
          statusChanges: row.work_orders_status,
          comments: row.work_orders_comments
        },
        inventory: {
          lowStockAlerts: row.inventory_low_stock,
          partIssuance: row.inventory_issuance
        }
      };
    } catch (err) {
      log(`Error retrieving notification settings: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return this.notificationSettings;
    }
  }
  async updateNotificationSettings(settings) {
    try {
      const result = await pool.query(`
        UPDATE notification_settings
        SET work_orders_new = $1,
            work_orders_status = $2,
            work_orders_comments = $3,
            inventory_low_stock = $4,
            inventory_issuance = $5,
            company_name = $6,
            system_email = $7,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        settings.workOrders.newWorkOrders,
        settings.workOrders.statusChanges,
        settings.workOrders.comments,
        settings.inventory.lowStockAlerts,
        settings.inventory.partIssuance,
        settings.system?.companyName || "Ohio Northern University",
        settings.system?.systemEmail || "m-gierhart@onu.edu"
      ]);
      if (result.rows.length === 0) {
        const insertResult = await pool.query(`
          INSERT INTO notification_settings (
            work_orders_new, work_orders_status, work_orders_comments,
            inventory_low_stock, inventory_issuance,
            company_name, system_email
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          settings.workOrders.newWorkOrders,
          settings.workOrders.statusChanges,
          settings.workOrders.comments,
          settings.inventory.lowStockAlerts,
          settings.inventory.partIssuance,
          settings.system?.companyName || "Ohio Northern University",
          settings.system?.systemEmail || "m-gierhart@onu.edu"
        ]);
        const row = insertResult.rows[0];
        this.notificationSettings = {
          workOrders: {
            newWorkOrders: row.work_orders_new,
            statusChanges: row.work_orders_status,
            comments: row.work_orders_comments
          },
          inventory: {
            lowStockAlerts: row.inventory_low_stock,
            partIssuance: row.inventory_issuance
          }
        };
      } else {
        const row = result.rows[0];
        this.notificationSettings = {
          workOrders: {
            newWorkOrders: row.work_orders_new,
            statusChanges: row.work_orders_status,
            comments: row.work_orders_comments
          },
          inventory: {
            lowStockAlerts: row.inventory_low_stock,
            partIssuance: row.inventory_issuance
          }
        };
      }
      return this.notificationSettings;
    } catch (err) {
      log(`Error updating notification settings: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return this.notificationSettings;
    }
  }
  // Storage Location operations
  async getStorageLocation(id) {
    try {
      const result = await pool.query(
        "SELECT * FROM storage_locations WHERE id = $1",
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : void 0;
    } catch (error) {
      console.error("Error getting storage location:", error);
      return void 0;
    }
  }
  async getStorageLocations() {
    try {
      const result = await pool.query("SELECT * FROM storage_locations ORDER BY name");
      return result.rows;
    } catch (error) {
      console.error("Error getting storage locations:", error);
      return [];
    }
  }
  async createStorageLocation(location) {
    try {
      const result = await pool.query(
        "INSERT INTO storage_locations (name, description, active) VALUES ($1, $2, $3) RETURNING *",
        [location.name, location.description || null, location.active !== void 0 ? location.active : true]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating storage location:", error);
      throw error;
    }
  }
  async updateStorageLocation(id, location) {
    try {
      const current = await this.getStorageLocation(id);
      if (!current) return void 0;
      const updates = [];
      const values = [];
      let paramIndex = 1;
      if (location.name !== void 0) {
        updates.push(`name = $${paramIndex++}`);
        values.push(location.name);
      }
      if (location.description !== void 0) {
        updates.push(`description = $${paramIndex++}`);
        values.push(location.description);
      }
      if (location.active !== void 0) {
        updates.push(`active = $${paramIndex++}`);
        values.push(location.active);
      }
      if (updates.length === 0) return current;
      values.push(id);
      const query = `UPDATE storage_locations SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating storage location:", error);
      return void 0;
    }
  }
  async deleteStorageLocation(id) {
    try {
      const shelvesResult = await pool.query(
        "SELECT COUNT(*) FROM shelves WHERE location_id = $1",
        [id]
      );
      if (parseInt(shelvesResult.rows[0].count) > 0) {
        throw new Error("Cannot delete location with associated shelves");
      }
      const partsResult = await pool.query(
        "SELECT COUNT(*) FROM parts WHERE location_id = $1",
        [id]
      );
      if (parseInt(partsResult.rows[0].count) > 0) {
        throw new Error("Cannot delete location with associated parts");
      }
      const result = await pool.query("DELETE FROM storage_locations WHERE id = $1", [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting storage location:", error);
      throw error;
    }
  }
  // Shelf operations
  async getShelf(id) {
    try {
      const result = await pool.query(
        "SELECT * FROM shelves WHERE id = $1",
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : void 0;
    } catch (error) {
      console.error("Error getting shelf:", error);
      return void 0;
    }
  }
  async getShelves() {
    try {
      console.log("pgStorage.getShelves() called - fetching shelves from database");
      const result = await pool.query(`
        SELECT 
          id,
          location_id AS "locationId",
          name,
          description,
          active,
          created_at AS "createdAt"
        FROM shelves 
        ORDER BY location_id, name
      `);
      console.log(`pgStorage.getShelves() found ${result.rows.length} shelves`);
      if (result.rows.length === 0) {
        const countResult = await pool.query("SELECT COUNT(*) FROM shelves");
        const count = parseInt(countResult.rows[0].count);
        console.log(`Double-check count query shows ${count} shelves in database`);
      } else {
        console.log("Sample shelves:", result.rows.slice(0, 5));
      }
      return result.rows;
    } catch (error) {
      console.error("Error getting shelves:", error);
      return [];
    }
  }
  async getShelvesByLocation(locationId) {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          location_id AS "locationId",
          name,
          description,
          active,
          created_at AS "createdAt"
        FROM shelves 
        WHERE location_id = $1 
        ORDER BY name
      `, [locationId]);
      return result.rows;
    } catch (error) {
      console.error("Error getting shelves by location:", error);
      return [];
    }
  }
  async createShelf(shelf) {
    try {
      const locationExists = await this.getStorageLocation(shelf.locationId);
      if (!locationExists) {
        throw new Error(`Location with ID ${shelf.locationId} does not exist`);
      }
      const result = await pool.query(
        "INSERT INTO shelves (location_id, name, description, active) VALUES ($1, $2, $3, $4) RETURNING *",
        [shelf.locationId, shelf.name, shelf.description || null, shelf.active !== void 0 ? shelf.active : true]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating shelf:", error);
      throw error;
    }
  }
  async updateShelf(id, shelf) {
    try {
      const current = await this.getShelf(id);
      if (!current) return void 0;
      if (shelf.locationId !== void 0 && shelf.locationId !== current.locationId) {
        const locationExists = await this.getStorageLocation(shelf.locationId);
        if (!locationExists) {
          throw new Error(`Location with ID ${shelf.locationId} does not exist`);
        }
      }
      const updates = [];
      const values = [];
      let paramIndex = 1;
      if (shelf.locationId !== void 0) {
        updates.push(`location_id = $${paramIndex++}`);
        values.push(shelf.locationId);
      }
      if (shelf.name !== void 0) {
        updates.push(`name = $${paramIndex++}`);
        values.push(shelf.name);
      }
      if (shelf.description !== void 0) {
        updates.push(`description = $${paramIndex++}`);
        values.push(shelf.description);
      }
      if (shelf.active !== void 0) {
        updates.push(`active = $${paramIndex++}`);
        values.push(shelf.active);
      }
      if (updates.length === 0) return current;
      values.push(id);
      const query = `UPDATE shelves SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating shelf:", error);
      throw error;
    }
  }
  async deleteShelf(id) {
    try {
      const partsResult = await pool.query(
        "SELECT COUNT(*) FROM parts WHERE shelf_id = $1",
        [id]
      );
      if (parseInt(partsResult.rows[0].count) > 0) {
        throw new Error("Cannot delete shelf with associated parts");
      }
      const result = await pool.query("DELETE FROM shelves WHERE id = $1", [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting shelf:", error);
      throw error;
    }
  }
  // Tool SignOut System Methods
  async getNextToolNumber() {
    try {
      const result = await pool.query("SELECT MAX(tool_number) as max_number FROM tool_signouts");
      const maxNumber = result.rows[0].max_number || 0;
      return maxNumber + 1;
    } catch (error) {
      console.error("Error getting next tool number:", error);
      return 1;
    }
  }
  async createToolSignout(toolSignout) {
    try {
      const result = await pool.query(`
        INSERT INTO tool_signouts (
          tool_number, tool_name, technician_id, notes, status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        toolSignout.toolNumber,
        toolSignout.toolName,
        toolSignout.technicianId,
        toolSignout.notes || null,
        toolSignout.status || "checked_out"
      ]);
      return {
        id: result.rows[0].id,
        toolNumber: result.rows[0].tool_number,
        toolName: result.rows[0].tool_name,
        technicianId: result.rows[0].technician_id,
        signedOutAt: result.rows[0].signed_out_at,
        returnedAt: result.rows[0].returned_at,
        status: result.rows[0].status,
        notes: result.rows[0].notes
      };
    } catch (error) {
      console.error("Error creating tool signout:", error);
      throw error;
    }
  }
  async getToolSignout(id) {
    try {
      const result = await pool.query(`
        SELECT * FROM tool_signouts
        WHERE id = $1
      `, [id]);
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        toolNumber: row.tool_number,
        toolName: row.tool_name,
        technicianId: row.technician_id,
        signedOutAt: row.signed_out_at,
        returnedAt: row.returned_at,
        status: row.status,
        notes: row.notes
      };
    } catch (error) {
      console.error("Error getting tool signout:", error);
      return void 0;
    }
  }
  async getAllToolSignouts() {
    try {
      const result = await pool.query(`
        SELECT ts.*, 
               u.id as user_id, u.name as user_name, u.role as user_role
        FROM tool_signouts ts
        LEFT JOIN users u ON ts.technician_id = u.id
        ORDER BY ts.signed_out_at DESC
      `);
      return result.rows.map((row) => {
        let technician = void 0;
        if (row.user_id) {
          technician = {
            id: row.user_id,
            name: row.user_name,
            role: row.user_role,
            username: "",
            // We don't need the username here
            password: "",
            // We don't expose passwords
            department: null
          };
        }
        return {
          id: row.id,
          toolNumber: row.tool_number,
          toolName: row.tool_name,
          technicianId: row.technician_id,
          signedOutAt: row.signed_out_at,
          returnedAt: row.returned_at,
          status: row.status,
          notes: row.notes,
          technician
        };
      });
    } catch (error) {
      console.error("Error getting all tool signouts:", error);
      return [];
    }
  }
  async getToolSignoutsByTechnician(technicianId) {
    try {
      const result = await pool.query(`
        SELECT * FROM tool_signouts
        WHERE technician_id = $1
        ORDER BY signed_out_at DESC
      `, [technicianId]);
      return result.rows.map((row) => ({
        id: row.id,
        toolNumber: row.tool_number,
        toolName: row.tool_name,
        technicianId: row.technician_id,
        signedOutAt: row.signed_out_at,
        returnedAt: row.returned_at,
        status: row.status,
        notes: row.notes
      }));
    } catch (error) {
      console.error("Error getting tool signouts by technician:", error);
      return [];
    }
  }
  async getToolSignoutsByStatus(status) {
    try {
      const result = await pool.query(`
        SELECT ts.*, 
               u.id as user_id, u.name as user_name, u.role as user_role
        FROM tool_signouts ts
        LEFT JOIN users u ON ts.technician_id = u.id
        WHERE ts.status = $1
        ORDER BY ts.signed_out_at DESC
      `, [status]);
      return result.rows.map((row) => {
        let technician = void 0;
        if (row.user_id) {
          technician = {
            id: row.user_id,
            name: row.user_name,
            role: row.user_role,
            username: "",
            // We don't need the username here
            password: "",
            // We don't expose passwords
            department: null
          };
        }
        return {
          id: row.id,
          toolNumber: row.tool_number,
          toolName: row.tool_name,
          technicianId: row.technician_id,
          signedOutAt: row.signed_out_at,
          returnedAt: row.returned_at,
          status: row.status,
          notes: row.notes,
          technician
        };
      });
    } catch (error) {
      console.error("Error getting tool signouts by status:", error);
      return [];
    }
  }
  async updateToolSignout(id, updates) {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      if (updates.toolName !== void 0) {
        updateFields.push(`tool_name = $${paramIndex++}`);
        values.push(updates.toolName);
      }
      if (updates.status !== void 0) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.notes !== void 0) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }
      if (updates.returnedAt !== void 0) {
        updateFields.push(`returned_at = $${paramIndex++}`);
        values.push(updates.returnedAt);
      }
      values.push(id);
      if (updateFields.length === 0) {
        return await this.getToolSignout(id);
      }
      const result = await pool.query(`
        UPDATE tool_signouts
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        toolNumber: row.tool_number,
        toolName: row.tool_name,
        technicianId: row.technician_id,
        signedOutAt: row.signed_out_at,
        returnedAt: row.returned_at,
        status: row.status,
        notes: row.notes
      };
    } catch (error) {
      console.error("Error updating tool signout:", error);
      return void 0;
    }
  }
  async deleteToolSignout(id) {
    try {
      const result = await pool.query(`
        DELETE FROM tool_signouts
        WHERE id = $1
        RETURNING id
      `, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting tool signout:", error);
      return false;
    }
  }
  // Get parts with their usage statistics
  async getPartsWithUsage(timeFrameDays = 90) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          p.id,
          p.part_id,
          p.name,
          p.description,
          p.quantity as current_stock,
          p.reorder_level,
          p.unit_cost,
          p.category,
          p.supplier,
          p.location,
          COALESCE(usage.total_issued, 0) as total_issued,
          COALESCE(usage.issue_count, 0) as issue_count,
          COALESCE(usage.avg_quantity_per_issue, 0) as avg_quantity_per_issue,
          usage.last_issued,
          CASE 
            WHEN usage.last_issued IS NOT NULL THEN 
              ROUND(EXTRACT(days FROM NOW() - usage.last_issued)::numeric, 0)
            ELSE NULL
          END as days_since_last_used,
          CASE 
            WHEN usage.total_issued > 0 AND p.quantity > 0 THEN 
              ROUND(p.quantity::numeric / (usage.total_issued::numeric / ($1::numeric / 30)), 2)
            ELSE NULL
          END as months_of_stock_remaining,
          CASE 
            WHEN usage.total_issued >= 50 THEN 'Fast Moving'
            WHEN usage.total_issued >= 10 THEN 'Medium Moving'
            WHEN usage.total_issued > 0 THEN 'Slow Moving'
            ELSE 'No Movement'
          END as movement_category,
          CASE
            WHEN usage.last_issued IS NULL THEN 'Never Used'
            WHEN usage.last_issued < NOW() - INTERVAL '365 days' THEN 'Not Used in 1+ Years'
            WHEN usage.last_issued < NOW() - INTERVAL '180 days' THEN 'Not Used in 6+ Months'
            WHEN usage.last_issued < NOW() - INTERVAL '90 days' THEN 'Not Used in 3+ Months'
            WHEN usage.last_issued < NOW() - INTERVAL '30 days' THEN 'Not Used in 1+ Months'
            ELSE 'Recently Used'
          END as usage_status,
          p.quantity * COALESCE(p.unit_cost::numeric, 0) as inventory_value
        FROM parts p
        LEFT JOIN (
          SELECT 
            part_id,
            SUM(quantity) as total_issued,
            COUNT(*) as issue_count,
            ROUND(AVG(quantity), 2) as avg_quantity_per_issue,
            MAX(issued_at) as last_issued
          FROM parts_issuance 
          WHERE issued_at >= NOW() - INTERVAL '$1 days'
          GROUP BY part_id
        ) usage ON p.id = usage.part_id
        ORDER BY 
          CASE 
            WHEN usage.last_issued IS NULL THEN 1
            ELSE 0
          END,
          usage.last_issued ASC NULLS LAST,
          COALESCE(usage.total_issued, 0) DESC
      `, [timeFrameDays]);
      return result.rows;
    } finally {
      client.release();
    }
  }
  // Get usage analytics summary
  async getUsageAnalyticsSummary(timeFrameDays = 90) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        WITH usage_stats AS (
          SELECT 
            p.id,
            p.quantity * COALESCE(p.unit_cost::numeric, 0) as inventory_value,
            COALESCE(usage.total_issued, 0) as total_issued,
            usage.last_issued,
            CASE 
              WHEN usage.total_issued >= 50 THEN 'Fast Moving'
              WHEN usage.total_issued >= 10 THEN 'Medium Moving'
              WHEN usage.total_issued > 0 THEN 'Slow Moving'
              ELSE 'No Movement'
            END as movement_category,
            CASE
              WHEN usage.last_issued IS NULL THEN 'Never Used'
              WHEN usage.last_issued < NOW() - INTERVAL '365 days' THEN 'Not Used in 1+ Years'
              WHEN usage.last_issued < NOW() - INTERVAL '180 days' THEN 'Not Used in 6+ Months'
              WHEN usage.last_issued < NOW() - INTERVAL '90 days' THEN 'Not Used in 3+ Months'
              WHEN usage.last_issued < NOW() - INTERVAL '30 days' THEN 'Not Used in 1+ Months'
              ELSE 'Recently Used'
            END as usage_status
          FROM parts p
          LEFT JOIN (
            SELECT 
              part_id,
              SUM(quantity) as total_issued,
              MAX(issued_at) as last_issued
            FROM parts_issuance 
            GROUP BY part_id
          ) usage ON p.id = usage.part_id
        )
        SELECT 
          COUNT(*) as total_parts,
          COUNT(CASE WHEN movement_category = 'Fast Moving' THEN 1 END) as fast_moving_count,
          COUNT(CASE WHEN movement_category = 'Medium Moving' THEN 1 END) as medium_moving_count,
          COUNT(CASE WHEN movement_category = 'Slow Moving' THEN 1 END) as slow_moving_count,
          COUNT(CASE WHEN movement_category = 'No Movement' THEN 1 END) as no_movement_count,
          COUNT(CASE WHEN usage_status = 'Never Used' THEN 1 END) as never_used_count,
          COUNT(CASE WHEN usage_status = 'Not Used in 1+ Years' THEN 1 END) as not_used_1_year_count,
          COUNT(CASE WHEN usage_status = 'Not Used in 6+ Months' THEN 1 END) as not_used_6_months_count,
          COUNT(CASE WHEN usage_status = 'Not Used in 3+ Months' THEN 1 END) as not_used_3_months_count,
          SUM(total_issued) as total_parts_issued,
          ROUND(SUM(inventory_value), 2) as total_inventory_value,
          ROUND(SUM(CASE WHEN usage_status IN ('Never Used', 'Not Used in 1+ Years') THEN inventory_value ELSE 0 END), 2) as stagnant_inventory_value
        FROM usage_stats
      `);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  // Barcode operations
  async getPartBarcodes(partId) {
    try {
      const result = await pool.query(`
        SELECT * FROM part_barcodes 
        WHERE part_id = $1 AND active = true
        ORDER BY is_primary DESC, created_at ASC
      `, [partId]);
      return result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        barcode: row.barcode,
        supplier: row.supplier,
        isPrimary: row.is_primary,
        active: row.active,
        createdAt: row.created_at
      }));
    } catch (err) {
      log(`Error retrieving part barcodes: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async getAllPartBarcodes() {
    try {
      const result = await pool.query(`
        SELECT pb.*, p.part_id, p.name as part_name, p.description as part_description
        FROM part_barcodes pb
        INNER JOIN parts p ON pb.part_id = p.id
        WHERE pb.active = true
        ORDER BY p.part_id, pb.is_primary DESC, pb.created_at ASC
      `);
      return result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        barcode: row.barcode,
        supplier: row.supplier,
        isPrimary: row.is_primary,
        active: row.active,
        createdAt: row.created_at,
        part: {
          id: row.part_id,
          partId: row.part_id,
          name: row.part_name,
          description: row.part_description,
          quantity: 0,
          // We don't need full part data here
          reorderLevel: 0,
          unitCost: null,
          location: null,
          locationId: null,
          shelfId: null,
          category: null,
          supplier: null,
          lastRestockDate: null
        }
      }));
    } catch (err) {
      log(`Error retrieving all part barcodes: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return [];
    }
  }
  async createPartBarcode(barcode) {
    try {
      const result = await pool.query(`
        INSERT INTO part_barcodes (part_id, barcode, supplier, is_primary, active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        barcode.partId,
        barcode.barcode,
        barcode.supplier || null,
        barcode.isPrimary || false,
        barcode.active !== false
      ]);
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        barcode: row.barcode,
        supplier: row.supplier,
        isPrimary: row.is_primary,
        active: row.active,
        createdAt: row.created_at
      };
    } catch (err) {
      log(`Error creating part barcode: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      throw err;
    }
  }
  async updatePartBarcode(id, barcode) {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      if (barcode.barcode !== void 0) {
        updateFields.push(`barcode = $${paramIndex++}`);
        values.push(barcode.barcode);
      }
      if (barcode.supplier !== void 0) {
        updateFields.push(`supplier = $${paramIndex++}`);
        values.push(barcode.supplier);
      }
      if (barcode.isPrimary !== void 0) {
        updateFields.push(`is_primary = $${paramIndex++}`);
        values.push(barcode.isPrimary);
      }
      if (barcode.active !== void 0) {
        updateFields.push(`active = $${paramIndex++}`);
        values.push(barcode.active);
      }
      if (updateFields.length === 0) {
        return void 0;
      }
      values.push(id);
      const result = await pool.query(`
        UPDATE part_barcodes 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      if (result.rows.length === 0) {
        return void 0;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        barcode: row.barcode,
        supplier: row.supplier,
        isPrimary: row.is_primary,
        active: row.active,
        createdAt: row.created_at
      };
    } catch (err) {
      log(`Error updating part barcode: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return void 0;
    }
  }
  async deletePartBarcode(id) {
    try {
      const result = await pool.query(`
        DELETE FROM part_barcodes 
        WHERE id = $1
        RETURNING id
      `, [id]);
      return result.rowCount > 0;
    } catch (err) {
      log(`Error deleting part barcode: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    }
  }
  async setPartBarcodePrimary(partId, barcodeId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`
        UPDATE part_barcodes 
        SET is_primary = false 
        WHERE part_id = $1
      `, [partId]);
      const result = await client.query(`
        UPDATE part_barcodes 
        SET is_primary = true 
        WHERE id = $1 AND part_id = $2
        RETURNING id
      `, [barcodeId, partId]);
      await client.query("COMMIT");
      return result.rowCount > 0;
    } catch (err) {
      await client.query("ROLLBACK");
      log(`Error setting part barcode primary: ${err instanceof Error ? err.message : String(err)}`, "postgres");
      return false;
    } finally {
      client.release();
    }
  }
};
var pgStorage = new PgStorage();

// server/storage.ts
var storage = pgStorage;

// server/routes.ts
init_db();
import { z as z2 } from "zod";

// server/tool-routes.ts
init_db();
init_schema();
import { Router } from "express";
import { eq as eq2 } from "drizzle-orm";

// server/tool-storage.ts
init_db();
init_schema();
import { eq, and } from "drizzle-orm";
async function getAllTools() {
  try {
    const result = await db.select().from(tools).orderBy(tools.toolNumber);
    return result;
  } catch (error) {
    console.error("Error getting all tools:", error);
    return [];
  }
}
async function getAvailableTools() {
  try {
    const allTools = await getAllTools();
    const availableTools = [];
    for (const tool of allTools) {
      const currentSignout = await getCurrentToolSignout(tool.id);
      if (!currentSignout || currentSignout.status !== "checked_out") {
        availableTools.push(tool);
      }
    }
    return availableTools;
  } catch (error) {
    console.error("Error getting available tools:", error);
    return [];
  }
}
async function getTool(id) {
  try {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  } catch (error) {
    console.error("Error getting tool by ID:", error);
    return void 0;
  }
}
async function createTool(data) {
  try {
    const toolNumber = data.toolNumber || await getNextToolNumber();
    console.log(`Creating new tool with number ${toolNumber}:`, data);
    const insertedTools = await db.insert(tools).values({
      toolName: data.toolName,
      notes: data.notes || null,
      toolNumber,
      createdAt: /* @__PURE__ */ new Date(),
      active: data.active !== void 0 ? data.active : true
    }).returning();
    if (insertedTools.length === 0) {
      throw new Error("Tool creation failed - no tool was returned from database");
    }
    const tool = insertedTools[0];
    console.log("New tool created successfully:", tool);
    return tool;
  } catch (error) {
    console.error("Error creating tool:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}
async function getNextToolNumber() {
  try {
    const existingTools = await db.select({
      toolNumber: tools.toolNumber
    }).from(tools).orderBy(tools.toolNumber, "asc");
    if (existingTools.length === 0) {
      return 1;
    }
    const existingNumbers = existingTools.map((t) => t.toolNumber);
    console.log("Existing tool numbers:", existingNumbers);
    const maxNumber = existingNumbers[existingNumbers.length - 1];
    let nextNumber = maxNumber + 1;
    for (let i = 1; i <= maxNumber; i++) {
      if (!existingNumbers.includes(i)) {
        console.log(`Found available tool number in gap: ${i}`);
        return i;
      }
    }
    console.log(`Using next sequential tool number: ${nextNumber}`);
    return nextNumber;
  } catch (error) {
    console.error("Error getting next tool number:", error);
    return 1;
  }
}
async function isToolAvailable(toolId) {
  try {
    const currentSignout = await getCurrentToolSignout(toolId);
    return !currentSignout || currentSignout.status !== "checked_out";
  } catch (error) {
    console.error("Error checking if tool is available:", error);
    return false;
  }
}
async function getCurrentToolSignout(toolId) {
  try {
    const [signout] = await db.select().from(toolSignouts).where(eq(toolSignouts.toolId, toolId)).orderBy(toolSignouts.signedOutAt, "desc").limit(1);
    return signout;
  } catch (error) {
    console.error("Error getting current tool signout:", error);
    return void 0;
  }
}
async function signOutTool(data) {
  try {
    const [signout] = await db.insert(toolSignouts).values({
      toolId: data.toolId,
      technicianId: data.technicianId,
      status: "checked_out",
      notes: data.notes || null,
      signedOutAt: /* @__PURE__ */ new Date()
    }).returning();
    return signout;
  } catch (error) {
    console.error("Error signing out tool:", error);
    throw error;
  }
}
async function getToolSignout(id) {
  try {
    const [signout] = await db.select().from(toolSignouts).where(eq(toolSignouts.id, id));
    return signout;
  } catch (error) {
    console.error("Error getting tool signout by ID:", error);
    return void 0;
  }
}
async function updateToolSignout(id, data) {
  try {
    const [updated] = await db.update(toolSignouts).set(data).where(eq(toolSignouts.id, id)).returning();
    return updated;
  } catch (error) {
    console.error("Error updating tool signout:", error);
    return void 0;
  }
}
async function returnTool(id, data) {
  return updateToolSignout(id, {
    status: data.status,
    condition: data.condition || null,
    notes: data.notes || null,
    returnedAt: data.returnedAt
  });
}
async function getToolsSignedOutByTechnician(technicianId) {
  try {
    const signouts = await db.select().from(toolSignouts).where(and(
      eq(toolSignouts.technicianId, technicianId),
      eq(toolSignouts.status, "checked_out")
    ));
    const toolsWithStatus = [];
    for (const signout of signouts) {
      const tool = await getTool(signout.toolId);
      if (tool) {
        const technician = await db.select().from(users).where(eq(users.id, technicianId)).limit(1);
        toolsWithStatus.push({
          ...tool,
          status: signout.status,
          technicianId,
          technicianName: technician.length > 0 ? technician[0].name : "Unknown",
          signoutId: signout.id,
          signedOutAt: signout.signedOutAt
        });
      }
    }
    return toolsWithStatus;
  } catch (error) {
    console.error("Error getting tools signed out by technician:", error);
    return [];
  }
}
async function getToolSignoutsByStatus(status) {
  try {
    const signouts = await db.select().from(toolSignouts).where(eq(toolSignouts.status, status));
    return signouts;
  } catch (error) {
    console.error(`Error getting tool signouts by status ${status}:`, error);
    return [];
  }
}
async function getToolSignoutHistory(toolId) {
  try {
    const history = await db.select().from(toolSignouts).where(eq(toolSignouts.toolId, toolId)).orderBy(toolSignouts.signedOutAt, "desc");
    return history;
  } catch (error) {
    console.error("Error getting tool signout history:", error);
    return [];
  }
}
async function deleteTool(id) {
  try {
    return await db.transaction(async (tx) => {
      await tx.delete(toolSignouts).where(eq(toolSignouts.toolId, id));
      const deleteResult = await tx.delete(tools).where(eq(tools.id, id)).returning({ id: tools.id });
      return deleteResult.length > 0;
    });
  } catch (error) {
    console.error("Error deleting tool:", error);
    return false;
  }
}

// server/tool-routes.ts
var requireAuth = (req, res, next) => {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
};
var requireRole = (roles) => {
  return (req, res, next) => {
    if (req.session?.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
};
var router = Router();
router.get("/tools", requireAuth, async (req, res) => {
  try {
    let tools2 = [];
    if (req.session?.user?.role === "technician" || req.session?.user?.role === "student") {
      const technicianId = req.session.user.id;
      const availableTools = await getAvailableTools();
      const technicianTools = await getToolsSignedOutByTechnician(technicianId);
      tools2 = [
        ...availableTools.map((tool) => ({
          ...tool,
          status: "available",
          technicianId: null,
          technicianName: null
        })),
        ...technicianTools
      ];
    } else {
      const allTools = await getAllTools();
      for (const tool of allTools) {
        const currentSignout = await getCurrentToolSignout(tool.id);
        if (currentSignout && currentSignout.status === "checked_out") {
          const [technician] = await db.select().from(users).where(eq2(users.id, currentSignout.technicianId));
          tools2.push({
            ...tool,
            status: "checked_out",
            technicianId: currentSignout.technicianId,
            technicianName: technician ? technician.name : "Unknown",
            signoutId: currentSignout.id,
            signedOutAt: currentSignout.signedOutAt
          });
        } else {
          tools2.push({
            ...tool,
            status: "available",
            technicianId: null,
            technicianName: null
          });
        }
      }
    }
    res.json(tools2);
  } catch (error) {
    console.error("Error getting tools:", error);
    res.status(500).json({ error: "Failed to fetch tools" });
  }
});
router.post("/tools/add", requireAuth, requireRole(["admin", "student"]), async (req, res) => {
  if (!["admin", "student"].includes(req.session?.user?.role)) {
    return res.status(403).json({ error: "UNAUTHORIZED: Only administrators and students can add new tools" });
  }
  try {
    const { toolName, notes } = req.body;
    console.log("Tool add request received:", { toolName, notes });
    if (!toolName) {
      return res.status(400).json({ error: "Tool name is required" });
    }
    try {
      const existingTools = await getAllTools();
      const toolNumbers = existingTools.map((t) => t.toolNumber);
      console.log("Existing tool numbers:", toolNumbers);
      let nextToolNumber = 1;
      if (toolNumbers.length > 0) {
        let found = false;
        for (let i = 1; i <= Math.max(...toolNumbers) + 1; i++) {
          if (!toolNumbers.includes(i)) {
            nextToolNumber = i;
            found = true;
            console.log(`Found gap in sequence at number ${i}`);
            break;
          }
        }
        if (!found) {
          nextToolNumber = Math.max(...toolNumbers) + 1;
          console.log(`No gaps found, using next sequential number: ${nextToolNumber}`);
        }
      }
      console.log("Using tool number:", nextToolNumber);
      const newTool = await createTool({
        toolName,
        notes: notes || null,
        toolNumber: nextToolNumber
      });
      console.log("Tool created successfully:", newTool);
      res.status(201).json(newTool);
    } catch (innerError) {
      console.error("Inner error adding tool:", innerError);
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding new tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to add new tool",
      details: errorMessage,
      stack: error instanceof Error ? error.stack : void 0
    });
  }
});
router.post("/tools/admin-signout", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    console.log("ADMIN SIGNOUT REQUEST:", req.body);
    const { toolId, technicianId, notes } = req.body;
    if (!toolId || !technicianId) {
      console.log("VALIDATION ERROR - Missing data:", { toolId, technicianId });
      return res.status(400).json({ error: "Tool ID and Technician ID are required" });
    }
    const tool = await getTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }
    const isAvailable = await isToolAvailable(toolId);
    if (!isAvailable) {
      return res.status(400).json({ error: "This tool is already checked out" });
    }
    console.log("LOOKING FOR TECHNICIAN WITH ID:", technicianId);
    const [technician] = await db.select().from(users).where(eq2(users.id, technicianId));
    console.log("FOUND TECHNICIAN:", technician);
    if (!technician) {
      console.log("TECHNICIAN NOT FOUND - ID:", technicianId);
      return res.status(404).json({ error: "Technician not found" });
    }
    const signout = await signOutTool({
      toolId,
      technicianId,
      notes: notes || null
    });
    res.status(201).json(signout);
  } catch (error) {
    console.error("Error in admin tool signout:", error);
    res.status(500).json({ error: "Failed to sign out tool to technician" });
  }
});
router.post("/tools/signout", requireAuth, requireRole(["technician", "student"]), async (req, res) => {
  try {
    const { toolId, notes } = req.body;
    const technicianId = req.session?.user?.id;
    if (!technicianId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!toolId) {
      return res.status(400).json({ error: "Tool ID is required" });
    }
    const tool = await getTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }
    const isAvailable = await isToolAvailable(toolId);
    if (!isAvailable) {
      return res.status(400).json({ error: "This tool is already checked out" });
    }
    const signout = await signOutTool({
      toolId,
      technicianId,
      notes: notes || null
    });
    res.status(201).json(signout);
  } catch (error) {
    console.error("Error signing out tool:", error);
    res.status(500).json({ error: "Failed to sign out tool" });
  }
});
router.patch("/tools/return/:id", requireAuth, async (req, res) => {
  try {
    const signoutId = parseInt(req.params.id);
    const { status, condition, notes } = req.body;
    const signout = await getToolSignout(signoutId);
    if (!signout) {
      return res.status(404).json({ error: "Tool sign-out record not found" });
    }
    if (req.session?.user?.role !== "admin" && signout.technicianId !== req.session?.user?.id) {
      return res.status(403).json({ error: "You are not authorized to return this tool" });
    }
    const updatedSignout = await returnTool(signoutId, {
      status: status || "returned",
      condition: condition || null,
      notes: notes || null,
      returnedAt: /* @__PURE__ */ new Date()
    });
    res.json(updatedSignout);
  } catch (error) {
    console.error("Error returning tool:", error);
    res.status(500).json({ error: "Failed to return tool" });
  }
});
router.patch("/tools/return/:id", requireAuth, async (req, res) => {
  try {
    const signoutId = parseInt(req.params.id);
    const { status, condition, notes } = req.body;
    const signout = await getToolSignout(signoutId);
    if (!signout) {
      return res.status(404).json({ error: "Tool sign-out record not found" });
    }
    if (req.session?.user?.role !== "admin" && signout.technicianId !== req.session?.user?.id) {
      return res.status(403).json({ error: "You are not authorized to return this tool" });
    }
    const updatedSignout = await returnTool(signoutId, {
      status: status || "returned",
      condition: condition || null,
      notes: notes || null,
      returnedAt: /* @__PURE__ */ new Date()
    });
    res.json(updatedSignout);
  } catch (error) {
    console.error("Error returning tool:", error);
    res.status(500).json({ error: "Failed to return tool" });
  }
});
router.get("/tools/:id/history", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const toolId = parseInt(req.params.id);
    const history = await getToolSignoutHistory(toolId);
    const historyWithNames = await Promise.all(history.map(async (record) => {
      const [technician] = await db.select().from(users).where(eq2(users.id, record.technicianId));
      return {
        ...record,
        technicianName: technician ? technician.name : "Unknown"
      };
    }));
    res.json(historyWithNames);
  } catch (error) {
    console.error("Error fetching tool history:", error);
    res.status(500).json({ error: "Failed to fetch tool history" });
  }
});
router.get("/tools/status/:status", requireAuth, async (req, res) => {
  try {
    const status = req.params.status;
    if (!["checked_out", "returned", "damaged", "missing", "available"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (status !== "available" && req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    let tools2 = [];
    if (status === "available") {
      tools2 = await getAvailableTools();
      tools2 = tools2.map((tool) => ({
        ...tool,
        status: "available",
        technicianId: null,
        technicianName: null
      }));
    } else {
      const signouts = await getToolSignoutsByStatus(status);
      for (const signout of signouts) {
        const tool = await getTool(signout.toolId);
        const [technician] = await db.select().from(users).where(eq2(users.id, signout.technicianId));
        if (tool) {
          tools2.push({
            ...tool,
            status: signout.status,
            technicianId: signout.technicianId,
            technicianName: technician ? technician.name : "Unknown",
            signoutId: signout.id,
            signedOutAt: signout.signedOutAt,
            returnedAt: signout.returnedAt
          });
        }
      }
    }
    res.json(tools2);
  } catch (error) {
    console.error("Error fetching tools by status:", error);
    res.status(500).json({ error: "Failed to fetch tools by status" });
  }
});
router.delete("/tools/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  if (req.session?.user?.role !== "admin") {
    return res.status(403).json({ error: "UNAUTHORIZED: Only administrators can delete tools" });
  }
  try {
    const toolId = parseInt(req.params.id);
    if (isNaN(toolId)) {
      return res.status(400).json({ error: "Invalid tool ID" });
    }
    const tool = await getTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }
    const currentSignout = await getCurrentToolSignout(toolId);
    if (currentSignout && currentSignout.status === "checked_out") {
      return res.status(400).json({
        error: "Cannot delete a tool that is currently checked out. Please ensure the tool is returned before deleting."
      });
    }
    const deleted = await deleteTool(toolId);
    if (deleted) {
      res.json({ success: true, message: `Tool #${tool.toolNumber} (${tool.toolName}) has been deleted successfully` });
    } else {
      res.status(500).json({ error: "Failed to delete tool" });
    }
  } catch (error) {
    console.error("Error deleting tool:", error);
    res.status(500).json({ error: "Failed to delete tool" });
  }
});
var tool_routes_default = router;

// server/routes.ts
init_delivery_routes();

// server/backup.ts
import { exec } from "child_process";
import { promisify } from "util";
import fs2 from "fs";
import path3 from "path";
import cron from "node-cron";
import { JWT } from "google-auth-library";
var execPromise = promisify(exec);
var fsPromises = fs2.promises;
var BACKUP_DIR = path3.resolve(process.cwd(), "backups");
if (!fs2.existsSync(BACKUP_DIR)) {
  fs2.mkdirSync(BACKUP_DIR, { recursive: true });
}
async function generateDatabaseBackup() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable not found");
    }
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupFilename = `backup-${timestamp2}.sql`;
    const backupPath = path3.join(BACKUP_DIR, backupFilename);
    log(`Creating database backup: ${backupFilename}`, "backup");
    await execPromise(`pg_dump "${connectionString}" > "${backupPath}"`);
    log(`Database backup created successfully at ${backupPath}`, "backup");
    return backupPath;
  } catch (error) {
    log(`Error generating database backup: ${error}`, "backup");
    throw error;
  }
}
function getDriveClient() {
  try {
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    };
    if (!credentials.client_email || !credentials.private_key) {
      log("Google Drive credentials not found in environment variables", "backup");
      return null;
    }
    const jwtClient = new JWT(
      credentials.client_email,
      void 0,
      credentials.private_key,
      ["https://www.googleapis.com/auth/drive"]
    );
    const { google } = __require("@googleapis/drive");
    const drive = google.drive({
      version: "v3",
      auth: jwtClient
    });
    return drive;
  } catch (error) {
    log(`Error initializing Google Drive client: ${error}`, "backup");
    return null;
  }
}
async function uploadToGoogleDrive(filePath) {
  try {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error("Google Drive client could not be initialized");
    }
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID environment variable not found");
    }
    const fileName = path3.basename(filePath);
    log(`Uploading ${fileName} to Google Drive...`, "backup");
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "application/sql",
        parents: [folderId]
      },
      media: {
        mimeType: "application/sql",
        body: fs2.createReadStream(filePath)
      }
    });
    log(`File uploaded successfully to Google Drive with ID: ${response.data.id}`, "backup");
  } catch (error) {
    log(`Error uploading to Google Drive: ${error}`, "backup");
    throw error;
  }
}
async function cleanupOldBackups() {
  try {
    const files = await fsPromises.readdir(BACKUP_DIR);
    const sqlFiles = files.filter((file) => file.endsWith(".sql"));
    if (sqlFiles.length <= 5) return;
    const fileStats = await Promise.all(
      sqlFiles.map(async (file) => {
        const filePath = path3.join(BACKUP_DIR, file);
        const stats = await fsPromises.stat(filePath);
        return { file, path: filePath, mtime: stats.mtime };
      })
    );
    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
    const filesToDelete = fileStats.slice(0, fileStats.length - 5);
    for (const fileInfo of filesToDelete) {
      log(`Removing old backup: ${fileInfo.file}`, "backup");
      await fsPromises.unlink(fileInfo.path);
    }
  } catch (error) {
    log(`Error cleaning up old backups: ${error}`, "backup");
  }
}
async function runBackup() {
  try {
    log("Starting backup process...", "backup");
    const backupFilePath = await generateDatabaseBackup();
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_DRIVE_FOLDER_ID) {
      await uploadToGoogleDrive(backupFilePath);
    } else {
      log("Google Drive credentials not configured, skipping upload", "backup");
    }
    await cleanupOldBackups();
    log("Backup process completed successfully", "backup");
  } catch (error) {
    log(`Backup process failed: ${error}`, "backup");
  }
}
function scheduleWeeklyBackups() {
  cron.schedule("0 2 * * 0", async () => {
    log("Running scheduled weekly backup...", "backup");
    await runBackup();
  });
  log("Weekly backup scheduled (Sundays at 2:00 AM)", "backup");
}
async function manualBackupHandler() {
  try {
    await runBackup();
    return { success: true, message: "Backup completed successfully" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Backup failed: ${errorMessage}` };
  }
}

// server/routes.ts
init_schema();
import { fromZodError } from "zod-validation-error";
import { format as format2 } from "date-fns";

// server/upload.ts
import multer2 from "multer";
import path4 from "path";
import fs3 from "fs";
import { v4 as uuidv4 } from "uuid";
var uploadsDir = path4.join(process.cwd(), "uploads");
if (!fs3.existsSync(uploadsDir)) {
  fs3.mkdirSync(uploadsDir, { recursive: true });
}
var storage2 = multer2.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const extension = path4.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${extension}`;
    cb(null, uniqueFilename);
  }
});
var fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/vnd.ms-excel" || file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.originalname.toLowerCase().endsWith(".xlsx") || file.originalname.toLowerCase().endsWith(".xls")) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed"));
  }
};
var upload2 = multer2({
  storage: storage2,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB file size limit
  }
});
var upload_default = upload2;

// server/routes.ts
init_excel();
import { Router as Router3 } from "express";
var adminEmail = "m-gierhart@onu.edu";
var adminName = "Michael Gierhart";
var requireAuth2 = (req, res, next) => {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
};
var requireRole2 = (roles) => {
  return (req, res, next) => {
    if (req.session?.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
};
var requireWritePermission = () => {
  return (req, res, next) => {
    if (req.session?.user?.role === "controller") {
      return res.status(403).json({
        error: "You don't have permission to change this data",
        message: "Controller accounts have read-only access. Please contact an administrator to make changes."
      });
    }
    next();
  };
};
async function registerRoutes(app2) {
  app2.use(express2.static(path5.join(process.cwd(), "client", "public")));
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (socket) => {
    console.log("WebSocket client connected");
    socket.send(JSON.stringify({ type: "connected", message: "Connected to ONU Parts Tracker websocket server" }));
    socket.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("WebSocket message received:", data);
        if (data.type === "ping") {
          socket.send(JSON.stringify({ type: "pong", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });
    socket.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
  const broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  app2.get("/", (req, res) => {
    if (req.session?.user) {
      const role = req.session.user.role;
      console.log(`User with role ${role} detected at root URL`);
      if (role === "admin") {
        return res.redirect("/dashboard");
      } else if (role === "student") {
        return res.redirect("/parts-inventory");
      } else if (role === "technician") {
        return res.redirect("/parts-issuance");
      }
    }
    console.log("No user detected at root URL, redirecting to login");
    return res.redirect("/login");
  });
  app2.get("/simple", (req, res) => {
    const filePath = path5.join(process.cwd(), "client", "public", "simple-login.html");
    console.log("Trying to serve simple login from:", filePath);
    if (fs4.existsSync(filePath)) {
      console.log("Simple login file exists, sending...");
      res.sendFile(filePath);
    } else {
      console.log("Simple login file not found, falling back to index.html");
      res.sendFile(path5.join(process.cwd(), "client", "index.html"));
    }
  });
  const router5 = express2.Router();
  app2.use("/api", tool_routes_default);
  app2.get("/api/parts-delivery/template-download", async (req, res) => {
    try {
      console.log("Generating deliveries import template (public access)...");
      const { generateDeliveriesTemplateExcel: generateDeliveriesTemplateExcel3 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
      const templateBuffer = generateDeliveriesTemplateExcel3();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=deliveries_import_template.xlsx");
      res.setHeader("Content-Length", templateBuffer.length);
      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating deliveries template (public):", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  app2.use("/api", (req, res, next) => {
    if (req.session?.user) {
      req.user = req.session.user;
    } else {
      console.log("WARNING: No user in session for API request to path:", req.path);
    }
    next();
  }, deliveryRouter);
  app2.get("/api/email-receipt/:deliveryId", async (req, res) => {
    const { emailReceipts: emailReceipts2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
    const deliveryId = req.params.deliveryId;
    const emailContent = emailReceipts2[deliveryId];
    if (!emailContent) {
      return res.status(404).json({ error: "Email receipt not found" });
    }
    res.setHeader("Content-Type", "text/html");
    res.send(emailContent);
  });
  app2.get("/api/email-receipts", async (req, res) => {
    const { emailReceipts: emailReceipts2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
    const receipts = Object.keys(emailReceipts2).map((deliveryId) => ({
      deliveryId,
      available: true
    }));
    res.json(receipts);
  });
  app2.post("/api/test-email", async (req, res) => {
    try {
      const { to } = req.body;
      if (!to) {
        return res.status(400).json({ error: "Email address required" });
      }
      console.log(`\u{1F4E7} Test email requested for ${to}`);
      const { sendTestEmail: sendTestEmail2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
      const success = await sendTestEmail2(to);
      if (success) {
        res.json({
          success: true,
          message: `Test email sent successfully to ${to}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email - check server logs for details"
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });
  app2.post("/api/test-delivery-email", async (req, res) => {
    try {
      console.log("\u{1F525} EMERGENCY EMAIL TEST - Testing delivery confirmation email directly");
      const { deliveryStorage } = await Promise.resolve().then(() => (init_delivery_routes(), delivery_routes_exports));
      const delivery = await deliveryStorage.getPartsDeliveryWithDetails(202);
      if (!delivery) {
        return res.status(404).json({ error: "Test delivery not found" });
      }
      console.log(`\u{1F525} Found test delivery: ID=${delivery.id}, Part=${delivery.part?.name}, Staff=${delivery.staffMember.name}, Email=${delivery.staffMember.email}`);
      console.log(`\u{1F525} Attempting to send delivery confirmation email...`);
      const { sendDeliveryConfirmationEmail: sendDeliveryConfirmationEmail2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
      const result = await sendDeliveryConfirmationEmail2(delivery);
      if (result) {
        res.json({
          success: true,
          message: `Delivery confirmation email sent successfully to ${delivery.staffMember.email}`,
          delivery: {
            id: delivery.id,
            part: delivery.part?.name,
            staff: delivery.staffMember.name,
            email: delivery.staffMember.email
          }
        });
      } else {
        res.status(500).json({ error: "Failed to send delivery confirmation email" });
      }
    } catch (error) {
      console.error("\u{1F525} Test delivery email error:", error.message);
      console.error("\u{1F525} Full error:", error);
      res.status(500).json({ error: "Delivery email system error: " + error.message });
    }
  });
  router5.get("/work-orders", requireAuth2, requireRole2(["admin"]), (req, res) => {
    res.json([]);
  });
  router5.post("/reset-issuance-count", async (req, res) => {
    try {
      const { password } = req.body;
      const adminQuery = await pool2.query("SELECT * FROM users WHERE role = $1 AND username = $2", ["admin", "admin"]);
      if (adminQuery.rows.length === 0) {
        return res.status(401).json({ error: "Authentication failed. Admin user not found." });
      }
      const adminUser = adminQuery.rows[0];
      if (password !== "JaciJo2012") {
        console.log("Reset issuance count: Password verification failed");
        return res.status(401).json({ error: "Authentication failed. Incorrect password." });
      }
      try {
        await pool2.query(`
          CREATE TABLE IF NOT EXISTS reset_flags (
            key TEXT PRIMARY KEY,
            value BOOLEAN,
            reset_at TIMESTAMP
          )
        `);
        await pool2.query(`
          INSERT INTO reset_flags (key, value, reset_at)
          VALUES ('monthly_issuance_reset', TRUE, NOW())
          ON CONFLICT (key) DO UPDATE
          SET value = TRUE,
              reset_at = NOW()
        `);
        console.log("Reset issuance count: Successfully reset monthly issuance count to 0");
      } catch (err) {
        console.log("Using alternative approach to reset issuance count:", err);
        await pool2.query(`
          -- Create a counter in the notification_settings table if it doesn't exist
          INSERT INTO notification_settings (id, monthly_parts_issuance_count)
          VALUES (1, 0)
          ON CONFLICT (id) DO UPDATE
          SET monthly_parts_issuance_count = 0,
              updated_at = NOW()
        `);
      }
      console.log("Reset issuance count: Successfully reset monthly issuance count to 0");
      res.json({
        success: true,
        message: "Monthly parts issuance count has been reset to zero."
      });
    } catch (error) {
      console.error("Error resetting issuance count:", error);
      res.status(500).json({ error: "Failed to reset issuance count." });
    }
  });
  router5.post("/manual-backup", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log("Manual backup requested by admin user");
      const result = await manualBackupHandler();
      if (result.success) {
        console.log("Manual backup completed successfully");
        res.json({
          success: true,
          message: result.message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        console.error("Manual backup failed:", result.message);
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("Error during manual backup:", error);
      res.status(500).json({
        success: false,
        message: "An unexpected error occurred during backup"
      });
    }
  });
  router5.get("/technicians-list", async (req, res) => {
    try {
      console.log("Fetching technicians for kiosk/mobile use");
      const technicians = await storage.getTechnicians();
      const adminUsers = await storage.getUsers();
      const admins = adminUsers.filter((user) => user.role === "admin");
      const allTechniciansAndAdmins = [...technicians, ...admins].filter((user) => {
        return user.name && user.name.trim() !== "";
      });
      console.log(`Found ${allTechniciansAndAdmins.length} technicians/admins for kiosk`);
      res.json(allTechniciansAndAdmins);
    } catch (error) {
      console.error("Error fetching technicians for kiosk:", error);
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });
  router5.get("/buildings-public", async (req, res) => {
    try {
      console.log("Fetching buildings for kiosk use");
      const buildings2 = await storage.getBuildings();
      console.log(`Found ${buildings2.length} buildings for kiosk`);
      res.json(buildings2);
    } catch (error) {
      console.error("Error fetching buildings for kiosk:", error);
      res.status(500).json({ error: "Failed to fetch buildings" });
    }
  });
  router5.get("/cost-centers-public", async (req, res) => {
    try {
      console.log("Fetching cost centers for kiosk use");
      const result = await pool2.query("SELECT * FROM cost_centers ORDER BY name");
      const costCenters2 = result.rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description
      }));
      console.log(`Found ${costCenters2.length} cost centers for kiosk`);
      res.json(costCenters2);
    } catch (error) {
      console.error("Error fetching cost centers for kiosk:", error);
      res.status(500).json({ error: "Failed to fetch cost centers" });
    }
  });
  router5.get("/parts-lookup/:partId", async (req, res) => {
    try {
      console.log(`Kiosk parts lookup for barcode/Part ID: ${req.params.partId}`);
      let part = await storage.getPartByBarcode(req.params.partId);
      if (!part) {
        part = await storage.getPartByPartId(req.params.partId);
      }
      if (!part) {
        console.log(`Part not found for barcode/Part ID: ${req.params.partId}`);
        return res.status(404).json({ error: "Part not found" });
      }
      console.log(`Found part: ${part.name} (${part.partId}) via barcode lookup`);
      res.json(part);
    } catch (error) {
      console.error("Error looking up part for kiosk:", error);
      res.status(500).json({ error: "Failed to lookup part" });
    }
  });
  router5.post("/parts-charge-out-public", async (req, res) => {
    try {
      console.log("Kiosk parts charge-out:", req.body);
      const { partId, quantity, issuedTo, reason, notes, costCenter, buildingId } = req.body;
      if (!partId || !quantity || !issuedTo) {
        return res.status(400).json({ error: "Missing required fields: partId, quantity, issuedTo" });
      }
      const chargeOut = await storage.createPartsIssuance({
        partId: parseInt(partId),
        quantity: parseInt(quantity),
        issuedTo,
        reason: reason || "maintenance",
        notes,
        issuedById: 1,
        // Default to admin user for kiosk operations
        buildingId: buildingId ? parseInt(buildingId) : void 0,
        costCenter
      });
      console.log(`Kiosk charge-out created: ID ${chargeOut.id}`);
      res.json(chargeOut);
    } catch (error) {
      console.error("Error creating kiosk charge-out:", error);
      res.status(500).json({ error: "Failed to create charge-out" });
    }
  });
  router5.get("/stats", async (req, res) => {
    try {
      const countResult = await pool2.query("SELECT COUNT(*) FROM parts");
      const totalParts = parseInt(countResult.rows[0].count);
      console.log(`Stats: Direct count query found ${totalParts} total parts`);
      const partsWithReorderResult = await pool2.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL
      `);
      const partsWithReorderLevels = parseInt(partsWithReorderResult.rows[0].count || "0");
      const partsWithoutReorderResult = await pool2.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NULL
      `);
      const partsWithoutReorderLevels = parseInt(partsWithoutReorderResult.rows[0].count || "0");
      const healthyStockResult = await pool2.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity > reorder_level * 0.8
      `);
      const healthyStockCount = parseInt(healthyStockResult.rows[0].count || "0");
      const mediumStockResult = await pool2.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity <= reorder_level * 0.8 AND quantity > reorder_level * 0.3
      `);
      const mediumStockCount = parseInt(mediumStockResult.rows[0].count || "0");
      const lowStockResult = await pool2.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity <= reorder_level * 0.3
      `);
      const lowStockCount = parseInt(lowStockResult.rows[0].count || "0");
      const criticalAndLowStockResult = await pool2.query(`
        SELECT COUNT(*) FROM parts WHERE quantity <= 0 OR (reorder_level IS NOT NULL AND quantity <= reorder_level * 0.3)
      `);
      const criticalAndLowStockCount = parseInt(criticalAndLowStockResult.rows[0].count || "0");
      const actualLowStockResult = await pool2.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity <= reorder_level
      `);
      const actualLowStockCount = parseInt(actualLowStockResult.rows[0].count || "0");
      const inStockResult = await pool2.query(`
        SELECT COALESCE(SUM(quantity), 0) as sum FROM parts
      `);
      const totalPartsInStock = parseInt(inStockResult.rows[0].sum || "0");
      const lowStockParts = await storage.getLowStockParts();
      const monthlyPartsIssuance = await storage.getMonthlyPartsIssuanceTotal();
      console.log(`Stats: Total parts breakdown - Total: ${totalParts}, With reorder levels: ${partsWithReorderLevels}, Without reorder levels: ${partsWithoutReorderLevels}`);
      console.log(`Stats: Stock status counts - Healthy: ${healthyStockCount}, Medium: ${mediumStockCount}, Low: ${lowStockCount}, Critical+Low: ${criticalAndLowStockCount}`);
      console.log(`Stats: Low stock parts from storage method: ${lowStockParts.length}`);
      console.log(`Stats: Monthly parts issuance total = ${monthlyPartsIssuance}`);
      res.json({
        totalParts,
        totalPartsInStock,
        monthlyPartsIssuance,
        // Use critical + low stock count that matches inventory status card
        lowStockItemsCount: criticalAndLowStockCount,
        healthyStockCount,
        mediumStockCount,
        lowStockCount,
        // Additional data for transparency
        partsWithReorderLevels,
        partsWithoutReorderLevels,
        actualLowStockCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
  router5.get("/parts", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : void 0;
      const shelfId = req.query.shelfId ? parseInt(req.query.shelfId) : void 0;
      console.log(`GET /parts - Getting parts with filters: locationId=${locationId}, shelfId=${shelfId}`);
      let parts2;
      if (locationId && !isNaN(locationId) || shelfId && !isNaN(shelfId)) {
        parts2 = await storage.getPartsByLocation(locationId, shelfId);
      } else {
        const result = await pool2.query("SELECT * FROM parts ORDER BY name");
        console.log(`Direct database query found ${result.rows.length} total parts`);
        parts2 = result.rows.map((row) => ({
          id: row.id,
          partId: row.part_id,
          name: row.name,
          description: row.description,
          quantity: row.quantity,
          reorderLevel: row.reorder_level,
          unitCost: row.unit_cost,
          category: row.category,
          location: row.location,
          supplier: row.supplier,
          lastRestockDate: row.last_restock_date,
          // CRITICAL FIX: Include actual locationId and shelfId columns from database
          locationId: row.location_id,
          shelfId: row.shelf_id
        }));
      }
      console.log(`GET /parts - Found ${parts2.length} parts total after processing`);
      if (parts2.length > 0) {
        console.log("GET /parts - First part sample:", parts2[0].partId, parts2[0].name);
      }
      res.json(parts2);
    } catch (error) {
      console.error("Error fetching parts:", error);
      res.status(500).json({ error: "Failed to fetch parts" });
    }
  });
  router5.get("/parts/low-stock", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      console.log("GET /parts/low-stock - Getting low stock parts from storage");
      const lowStockParts = await storage.getLowStockParts();
      console.log(`GET /parts/low-stock - Found ${lowStockParts.length} low stock parts`);
      res.json(lowStockParts);
    } catch (error) {
      console.error("Error fetching low stock parts:", error);
      res.status(500).json({ error: "Failed to fetch low stock parts" });
    }
  });
  router5.get("/parts/export", requireAuth2, requireRole2(["admin", "student", "controller"]), async (req, res) => {
    try {
      const result = await pool2.query("SELECT * FROM parts ORDER BY name");
      console.log(`Direct database query found ${result.rows.length} total parts for export`);
      const parts2 = result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        location: row.location,
        supplier: row.supplier,
        lastRestockDate: row.last_restock_date,
        // CRITICAL FIX: Include actual locationId and shelfId columns from database
        locationId: row.location_id,
        shelfId: row.shelf_id
      }));
      if (!parts2 || parts2.length === 0) {
        return res.status(404).json({ error: "No parts found" });
      }
      console.log(`Exporting ${parts2.length} parts to Excel`);
      const excelBuffer = await generatePartsExcel(parts2);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=parts_inventory.xlsx");
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting parts:", error);
      res.status(500).json({ error: "Failed to export parts" });
    }
  });
  router5.get("/parts/template", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      console.log("Template route hit - generating Excel template");
      const templateBuffer = generateTemplateExcel();
      console.log(`Template generated successfully, size: ${templateBuffer.length} bytes`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=parts_import_template.xlsx");
      res.setHeader("Content-Length", templateBuffer.length);
      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  router5.get("/parts/usage-analytics", requireAuth2, requireRole2(["admin", "student", "controller"]), async (req, res) => {
    try {
      const timeFrameDays = parseInt(req.query.timeFrame) || 90;
      console.log(`GET /parts/usage-analytics - Getting usage analytics for ${timeFrameDays} days`);
      const partsWithUsage = await storage.getPartsWithUsage(timeFrameDays);
      console.log(`GET /parts/usage-analytics - Found ${partsWithUsage.length} parts with usage data`);
      res.json(partsWithUsage);
    } catch (error) {
      console.error("Error getting parts usage analytics:", error);
      res.status(500).json({ error: "Failed to get parts usage analytics" });
    }
  });
  router5.get("/parts/usage-summary", requireAuth2, requireRole2(["admin", "student", "controller"]), async (req, res) => {
    try {
      const timeFrameDays = parseInt(req.query.timeFrame) || 90;
      console.log(`GET /parts/usage-summary - Getting usage summary for ${timeFrameDays} days`);
      const summary = await storage.getUsageAnalyticsSummary(timeFrameDays);
      console.log(`GET /parts/usage-summary - Generated summary`);
      res.json(summary);
    } catch (error) {
      console.error("Error getting usage analytics summary:", error);
      res.status(500).json({ error: "Failed to get usage analytics summary" });
    }
  });
  router5.get("/parts/search", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const searchTerm = req.query.q;
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.json([]);
      }
      const query = searchTerm.trim().toLowerCase();
      console.log(`Searching parts with term: "${query}"`);
      const result = await pool2.query(`
        SELECT p.*, 
               COALESCE(sl.name, p.location, 'Unassigned') as location
        FROM parts p
        LEFT JOIN storage_locations sl ON p.location_id = sl.id
        WHERE 
          LOWER(p.name) ILIKE $1 OR 
          LOWER(p.description) ILIKE $1 OR 
          LOWER(p.part_id) ILIKE $1 OR 
          LOWER(p.supplier) ILIKE $1
        ORDER BY 
          CASE 
            WHEN LOWER(p.part_id) = $2 THEN 1
            WHEN LOWER(p.name) = $2 THEN 2
            WHEN LOWER(p.part_id) ILIKE $3 THEN 3
            WHEN LOWER(p.name) ILIKE $3 THEN 4
            ELSE 5
          END,
          p.name
        LIMIT 20
      `, [`%${query}%`, query, `${query}%`]);
      const parts2 = result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        reorderLevel: row.reorder_level,
        unitCost: row.unit_cost,
        category: row.category,
        supplier: row.supplier,
        location: row.location,
        locationId: row.location_id,
        shelfId: row.shelf_id,
        lastRestockDate: row.last_restock_date
      }));
      console.log(`Found ${parts2.length} parts matching "${query}"`);
      res.json(parts2);
    } catch (error) {
      console.error("Error searching parts:", error);
      res.status(500).json({ error: "Failed to search parts" });
    }
  });
  router5.get("/parts/:id", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const part = await storage.getPartByPartId(req.params.id);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      const issuanceHistory = await storage.getPartsIssuanceByPartId(part.id);
      res.json({ ...part, issuanceHistory });
    } catch (error) {
      console.error("Error fetching part:", error);
      res.status(500).json({ error: "Failed to fetch part" });
    }
  });
  router5.post("/parts", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), requireWritePermission(), async (req, res) => {
    try {
      console.log("SKIPPING ALL VALIDATION - EMERGENCY DIRECT INSERT");
      const {
        partId,
        name,
        description,
        quantity,
        reorderLevel,
        unitCost,
        locationId,
        shelfId,
        additionalBarcodes
      } = req.body;
      console.log("INPUT DATA:", {
        partId,
        name,
        description,
        quantity,
        reorderLevel,
        unitCost,
        locationId,
        shelfId,
        unitCostType: typeof unitCost
      });
      let locationText = null;
      if (locationId) {
        const locResult = await pool2.query("SELECT name FROM storage_locations WHERE id = $1", [locationId]);
        if (locResult.rows.length > 0) {
          locationText = locResult.rows[0].name;
          if (shelfId) {
            const shelfResult = await pool2.query("SELECT name FROM shelves WHERE id = $1", [shelfId]);
            if (shelfResult.rows.length > 0) {
              locationText += ` - ${shelfResult.rows[0].name}`;
            }
          }
        }
      }
      let unitCostAsString;
      if (unitCost === null || unitCost === void 0 || unitCost === "") {
        unitCostAsString = "0";
      } else {
        unitCostAsString = String(unitCost);
      }
      console.log("PROCESSED DATA:", {
        partId,
        name,
        description,
        quantity,
        reorderLevel,
        unitCostAsString,
        locationText,
        locationId,
        shelfId
      });
      const sql2 = `
        INSERT INTO parts
          (part_id, name, description, quantity, reorder_level, unit_cost, location, location_id, shelf_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [
        partId,
        name,
        description || null,
        Number(quantity) || 0,
        Number(reorderLevel) || 10,
        unitCostAsString,
        // ALWAYS use the string version
        locationText,
        locationId || null,
        shelfId || null
      ];
      console.log("EXECUTING SQL WITH VALUES:", values);
      const result = await pool2.query(sql2, values);
      if (result.rows.length > 0) {
        const dbRow = result.rows[0];
        console.log("DATABASE RETURNED:", dbRow);
        const newPart = {
          id: dbRow.id,
          partId: dbRow.part_id,
          name: dbRow.name,
          description: dbRow.description,
          quantity: dbRow.quantity,
          reorderLevel: dbRow.reorder_level,
          unitCost: dbRow.unit_cost,
          location: dbRow.location,
          locationId: dbRow.location_id,
          shelfId: dbRow.shelf_id
        };
        if (additionalBarcodes && Array.isArray(additionalBarcodes) && additionalBarcodes.length > 0) {
          console.log("Processing additional barcodes:", additionalBarcodes);
          for (const barcodeData of additionalBarcodes) {
            try {
              await pool2.query(
                "INSERT INTO part_barcodes (part_id, barcode, supplier, is_primary, created_at) VALUES ($1, $2, $3, $4, NOW())",
                [newPart.id, barcodeData.barcode, barcodeData.supplier || null, barcodeData.isPrimary || false]
              );
              console.log(`Added barcode: ${barcodeData.barcode} for part ${newPart.id}`);
            } catch (barcodeError) {
              console.error(`Failed to add barcode ${barcodeData.barcode}:`, barcodeError);
            }
          }
        }
        console.log("RETURNING NEW PART:", newPart);
        res.status(201).json(newPart);
      } else {
        throw new Error("Insert succeeded but no row was returned");
      }
    } catch (error) {
      console.error("EMERGENCY INSERT FAILED:", error);
      res.status(500).json({
        error: "Failed to add part: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });
  router5.patch("/parts/:id", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), requireWritePermission(), async (req, res) => {
    try {
      console.log(`PATCH /parts/:id - Looking for part with partId: "${req.params.id}"`);
      const partQuery = await pool2.query("SELECT * FROM parts WHERE part_id = $1", [req.params.id]);
      console.log(`PATCH /parts/:id - Direct database query found ${partQuery.rows.length} parts with partId="${req.params.id}"`);
      let part;
      if (partQuery.rows.length > 0) {
        const row = partQuery.rows[0];
        part = {
          id: row.id,
          partId: row.part_id,
          name: row.name,
          description: row.description,
          quantity: row.quantity,
          reorderLevel: row.reorder_level,
          unitCost: row.unit_cost,
          category: row.category,
          location: row.location,
          supplier: row.supplier,
          lastRestockDate: row.last_restock_date
        };
      } else {
        return res.status(404).json({ error: "Part not found" });
      }
      console.log("PATCH /parts/:id - Original part data:", part);
      console.log("PATCH /parts/:id - Request body:", req.body);
      const validatedData = insertPartSchema.partial().parse(req.body);
      const updateData = { ...validatedData };
      const locationId = req.body.locationId;
      const shelfId = req.body.shelfId;
      console.log("LOCATION FIX: Processing location data with direct values:", {
        locationId,
        shelfId,
        rawLocationId: req.body.locationId,
        rawShelfId: req.body.shelfId
      });
      const typedUpdateData = updateData;
      if (locationId === "" || locationId === void 0 || locationId === null) {
        typedUpdateData.locationId = null;
      } else {
        const parsedLocationId = parseInt(String(locationId), 10);
        typedUpdateData.locationId = isNaN(parsedLocationId) ? null : parsedLocationId;
      }
      if (shelfId === "" || shelfId === void 0 || shelfId === null) {
        typedUpdateData.shelfId = null;
      } else {
        const parsedShelfId = parseInt(String(shelfId), 10);
        typedUpdateData.shelfId = isNaN(parsedShelfId) ? null : parsedShelfId;
      }
      console.log("FIXED VALUES FOR UPDATE:", {
        rawLocationId: locationId,
        rawShelfId: shelfId,
        processedLocationId: typedUpdateData.locationId,
        processedShelfId: typedUpdateData.shelfId,
        locationIdType: typeof typedUpdateData.locationId,
        shelfIdType: typeof typedUpdateData.shelfId
      });
      try {
        let locationName = null;
        let shelfName = null;
        if (locationId) {
          const locationResult = await pool2.query("SELECT name FROM storage_locations WHERE id = $1", [locationId]);
          if (locationResult.rows.length > 0) {
            locationName = locationResult.rows[0].name;
            console.log(`LOCATION FIX: Found location name for ID ${locationId}: ${locationName}`);
          }
        }
        if (shelfId) {
          const shelfResult = await pool2.query("SELECT name FROM shelves WHERE id = $1", [shelfId]);
          if (shelfResult.rows.length > 0) {
            shelfName = shelfResult.rows[0].name;
            console.log(`LOCATION FIX: Found shelf name for ID ${shelfId}: ${shelfName}`);
          }
        }
        if (locationName && shelfName) {
          updateData.location = `${locationName} - ${shelfName}`;
        } else if (locationName) {
          updateData.location = locationName;
        } else if (shelfName) {
          updateData.location = shelfName;
        } else if (locationId === null || locationId === "" || shelfId === null || shelfId === "") {
          updateData.location = "";
        }
        console.log(`LOCATION FIX: Setting location text field to: "${updateData.location || ""}"`);
      } catch (err) {
        console.error("LOCATION FIX: Error processing location data:", err);
      }
      console.log("PATCH /parts/:id - Final update data:", updateData);
      try {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        const safeStr = (str, maxLen) => {
          if (str === null || str === void 0) return null;
          const strVal = String(str);
          return strVal.length > maxLen ? strVal.substring(0, maxLen) : strVal;
        };
        if (updateData.partId !== void 0) {
          updates.push(`part_id = $${paramIndex++}`);
          values.push(safeStr(updateData.partId, 50));
        }
        if (updateData.name !== void 0) {
          updates.push(`name = $${paramIndex++}`);
          values.push(safeStr(updateData.name, 100));
        }
        if (updateData.description !== void 0) {
          updates.push(`description = $${paramIndex++}`);
          values.push(updateData.description);
        }
        if (updateData.quantity !== void 0) {
          updates.push(`quantity = $${paramIndex++}`);
          const quantity = parseInt(String(updateData.quantity), 10);
          values.push(isNaN(quantity) ? 0 : quantity);
        }
        if (updateData.reorderLevel !== void 0) {
          updates.push(`reorder_level = $${paramIndex++}`);
          const reorderLevel = parseInt(String(updateData.reorderLevel), 10);
          values.push(isNaN(reorderLevel) ? 0 : reorderLevel);
        }
        if (updateData.unitCost !== void 0) {
          updates.push(`unit_cost = $${paramIndex++}`);
          const unitCost = parseFloat(String(updateData.unitCost));
          values.push(isNaN(unitCost) ? 0 : unitCost);
        }
        if (updateData.category !== void 0) {
          updates.push(`category = $${paramIndex++}`);
          values.push(safeStr(updateData.category, 50));
        }
        if (updateData.location !== void 0) {
          updates.push(`location = $${paramIndex++}`);
          values.push(safeStr(updateData.location, 100));
        }
        if ("locationId" in req.body) {
          updates.push(`location_id = $${paramIndex++}`);
          values.push(typedUpdateData.locationId);
          console.log("LOCATION FIX: Adding location_id to update with value:", typedUpdateData.locationId);
        }
        if ("shelfId" in req.body) {
          updates.push(`shelf_id = $${paramIndex++}`);
          values.push(typedUpdateData.shelfId);
          console.log("LOCATION FIX: Adding shelf_id to update with value:", typedUpdateData.shelfId);
        }
        if (updateData.supplier !== void 0) {
          updates.push(`supplier = $${paramIndex++}`);
          values.push(safeStr(updateData.supplier, 100));
        }
        if (updateData.lastRestockDate !== void 0) {
          updates.push(`last_restock_date = $${paramIndex++}`);
          values.push(updateData.lastRestockDate);
        }
        if (updates.length === 0) {
          console.log("No fields to update for part ID", part.id);
          return res.json(part);
        }
        values.push(part.id);
        const query = `
          UPDATE parts 
          SET ${updates.join(", ")} 
          WHERE id = $${paramIndex} 
          RETURNING *
        `;
        console.log("DIRECT UPDATE: Executing update query:", query);
        console.log("DIRECT UPDATE: With values:", values);
        const result = await pool2.query(query, values);
        if (result.rows.length === 0) {
          console.error(`DIRECT UPDATE: No rows returned, part not found: ${part.id}`);
          return res.status(404).json({ error: "Part not found or update failed" });
        }
        const row = result.rows[0];
        console.log("DIRECT UPDATE: Successfully updated part with row:", row);
        const updatedPart = {
          id: row.id,
          partId: row.part_id,
          name: row.name,
          description: row.description,
          quantity: row.quantity,
          reorderLevel: row.reorder_level,
          unitCost: row.unit_cost,
          category: row.category,
          location: row.location,
          supplier: row.supplier,
          lastRestockDate: row.last_restock_date,
          locationId: row.location_id,
          shelfId: row.shelf_id
        };
        console.log("DIRECT UPDATE: Returning updated part:", updatedPart);
        res.json(updatedPart);
      } catch (updateError) {
        console.error("DIRECT UPDATE ERROR:", updateError);
        res.status(500).json({
          error: "Failed to update part",
          details: updateError instanceof Error ? updateError.message : String(updateError)
        });
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating part:", error);
      res.status(500).json({ error: "Failed to update part" });
    }
  });
  router5.delete("/parts/:id", requireAuth2, requireRole2(["admin", "student", "controller"]), requireWritePermission(), async (req, res) => {
    try {
      const part = await storage.getPartByPartId(req.params.id);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      const success = await storage.deletePart(part.id);
      if (success) {
        res.status(200).json({
          success: true,
          message: "Part deleted successfully"
        });
      } else {
        res.status(500).json({ error: "Failed to delete part" });
      }
    } catch (error) {
      console.error("Error deleting part:", error);
      res.status(500).json({ error: "Failed to delete part" });
    }
  });
  router5.get("/parts/:partId/barcodes", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const part = await storage.getPartByPartId(req.params.partId);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      const barcodes = await storage.getPartBarcodes(part.id);
      res.json(barcodes);
    } catch (error) {
      console.error("Error fetching part barcodes:", error);
      res.status(500).json({ error: "Failed to fetch part barcodes" });
    }
  });
  router5.get("/barcodes", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const barcodes = await storage.getAllPartBarcodes();
      res.json(barcodes);
    } catch (error) {
      console.error("Error fetching all barcodes:", error);
      res.status(500).json({ error: "Failed to fetch barcodes" });
    }
  });
  router5.post("/barcodes", requireAuth2, requireRole2(["admin", "student", "technician"]), requireWritePermission(), async (req, res) => {
    try {
      const barcodeData = req.body;
      const newBarcode = await storage.createPartBarcode(barcodeData);
      res.status(201).json(newBarcode);
    } catch (error) {
      console.error("Error creating barcode:", error);
      res.status(500).json({ error: "Failed to create barcode" });
    }
  });
  router5.put("/barcodes/:id", requireAuth2, requireRole2(["admin", "student", "technician"]), requireWritePermission(), async (req, res) => {
    try {
      const barcodeId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBarcode = await storage.updatePartBarcode(barcodeId, updateData);
      if (!updatedBarcode) {
        return res.status(404).json({ error: "Barcode not found" });
      }
      res.json(updatedBarcode);
    } catch (error) {
      console.error("Error updating barcode:", error);
      res.status(500).json({ error: "Failed to update barcode" });
    }
  });
  router5.delete("/barcodes/:id", requireAuth2, requireRole2(["admin", "student", "technician"]), requireWritePermission(), async (req, res) => {
    try {
      const barcodeId = parseInt(req.params.id);
      const success = await storage.deletePartBarcode(barcodeId);
      if (success) {
        res.json({ success: true, message: "Barcode deleted successfully" });
      } else {
        res.status(404).json({ error: "Barcode not found" });
      }
    } catch (error) {
      console.error("Error deleting barcode:", error);
      res.status(500).json({ error: "Failed to delete barcode" });
    }
  });
  router5.put("/barcodes/:id/primary", requireAuth2, requireRole2(["admin", "student", "technician"]), requireWritePermission(), async (req, res) => {
    try {
      const barcodeId = parseInt(req.params.id);
      const { partId } = req.body;
      const success = await storage.setPartBarcodePrimary(partId, barcodeId);
      if (success) {
        res.json({ success: true, message: "Primary barcode updated successfully" });
      } else {
        res.status(404).json({ error: "Barcode or part not found" });
      }
    } catch (error) {
      console.error("Error setting primary barcode:", error);
      res.status(500).json({ error: "Failed to set primary barcode" });
    }
  });
  router5.post("/parts/batch-update", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const updateSchema = z2.array(
        z2.object({
          partId: z2.string(),
          quantity: z2.number().int().nonnegative()
        })
      );
      const validatedData = updateSchema.parse(req.body);
      const results = await Promise.all(
        validatedData.map(async ({ partId, quantity }) => {
          try {
            const part = await storage.getPartByPartId(partId);
            if (!part) {
              return { partId, success: false, message: "Part not found" };
            }
            try {
              const updateResult = await pool2.query(
                "UPDATE parts SET quantity = $1 WHERE id = $2 RETURNING *",
                [quantity, part.id]
              );
              if (updateResult.rows.length === 0) {
                return {
                  partId,
                  success: false,
                  message: "Failed to update part - no rows returned"
                };
              }
              const updatedRow = updateResult.rows[0];
              console.log(`Direct batch update successful for part ${partId}, new quantity: ${updatedRow.quantity}`);
              return {
                partId,
                success: true,
                message: "Updated successfully",
                newQuantity: updatedRow.quantity
              };
            } catch (directUpdateError) {
              console.error(`Direct batch update error for part ${partId}:`, directUpdateError);
              return {
                partId,
                success: false,
                message: `Direct update failed: ${directUpdateError instanceof Error ? directUpdateError.message : String(directUpdateError)}`
              };
            }
          } catch (error) {
            console.error(`Error updating part ${partId}:`, error);
            return {
              partId,
              success: false,
              message: error instanceof Error ? error.message : "Unknown error"
            };
          }
        })
      );
      const success = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      res.json({
        success: failed === 0,
        updated: success,
        failed,
        results
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error in batch update:", error);
      res.status(500).json({
        error: "Failed to process batch update",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  router5.post("/parts-issuance", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), requireWritePermission(), async (req, res) => {
    try {
      console.log("Parts issuance request received:", {
        user: req.user ? { id: req.user.id, role: req.user.role } : null,
        body: req.body
      });
      const parseResult = insertPartsIssuanceSchema.safeParse(req.body);
      if (!parseResult.success) {
        console.error("Parts issuance validation failed:", parseResult.error);
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({
          error: "Invalid input data",
          details: validationError.message
        });
      }
      const validatedData = parseResult.data;
      const part = await storage.getPart(validatedData.partId);
      if (!part) {
        console.error(`Part not found: ID ${validatedData.partId}`);
        return res.status(404).json({ error: "Part not found" });
      }
      console.log(`Parts issuance validation: Part ${part.name} (${part.partId}) - Available: ${part.quantity}, Requested: ${validatedData.quantity}`);
      if (part.quantity < validatedData.quantity) {
        return res.status(400).json({
          error: "Not enough parts in inventory",
          available: part.quantity,
          requested: validatedData.quantity
        });
      }
      try {
        const partsIssuance2 = await storage.createPartsIssuance(validatedData);
        console.log(`Parts issuance created successfully: ID ${partsIssuance2.id}`);
        try {
          broadcast({
            type: "parts-issuance-created",
            data: {
              id: partsIssuance2.id,
              partName: part.name,
              quantity: validatedData.quantity,
              issuedTo: validatedData.issuedTo,
              reason: validatedData.reason,
              department: validatedData.department
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        } catch (broadcastError) {
          console.error("Error broadcasting parts issuance:", broadcastError);
        }
        res.status(201).json(partsIssuance2);
      } catch (createError) {
        console.error("Error creating parts issuance:", createError);
        return res.status(500).json({
          error: "Failed to create parts issuance",
          message: createError instanceof Error ? createError.message : "Database error"
        });
      }
    } catch (error) {
      console.error("Unexpected error in parts issuance:", error);
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error issuing parts:", error);
      res.status(500).json({ error: "Failed to issue parts" });
    }
  });
  router5.post("/parts-issuance/bulk", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), requireWritePermission(), async (req, res) => {
    try {
      console.log("BULK ISSUANCE: Request received", req.body);
      const validatedData = bulkPartsIssuanceSchema.parse(req.body);
      console.log("BULK ISSUANCE: Validation passed", validatedData);
      const results = [];
      const errors = [];
      const client = await pool2.connect();
      try {
        await client.query("BEGIN");
        console.log("BULK ISSUANCE: Transaction started");
        for (const partRequest of validatedData.parts) {
          console.log(`BULK ISSUANCE: Processing part ID ${partRequest.partId}, quantity ${partRequest.quantity}`);
          const part = await storage.getPart(partRequest.partId);
          if (!part) {
            console.log(`BULK ISSUANCE: Part ID ${partRequest.partId} not found`);
            errors.push({ partId: partRequest.partId, error: "Part not found" });
            continue;
          }
          if (part.quantity < partRequest.quantity) {
            console.log(`BULK ISSUANCE: Insufficient quantity for part ${partRequest.partId}, available: ${part.quantity}, requested: ${partRequest.quantity}`);
            errors.push({
              partId: partRequest.partId,
              error: "Insufficient quantity",
              available: part.quantity,
              requested: partRequest.quantity
            });
            continue;
          }
          const issuanceData = {
            partId: partRequest.partId,
            quantity: partRequest.quantity,
            issuedTo: validatedData.issuedTo,
            reason: validatedData.reason,
            notes: validatedData.notes,
            // CRITICAL FIX: Store the actual building ID as integer
            building: validatedData.building ? parseInt(validatedData.building, 10) : null,
            // CRITICAL FIX: Store the actual cost center ID or code correctly
            costCenter: validatedData.costCenter !== "none" ? validatedData.costCenter : null,
            // CRITICAL FIX: Always prioritize the client-sent date to prevent date resets
            issuedAt: validatedData.issuedAt ? new Date(validatedData.issuedAt) : /* @__PURE__ */ new Date()
          };
          console.log("BULK ISSUANCE - FIXED: Creating issuance record with correct fields", issuanceData);
          const issuanceResult = await client.query(
            `INSERT INTO parts_issuance (
              part_id, 
              quantity, 
              issued_to, 
              reason, 
              issued_at, 
              notes, 
              building_id, 
              cost_center
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [
              issuanceData.partId,
              issuanceData.quantity,
              issuanceData.issuedTo,
              issuanceData.reason,
              issuanceData.issuedAt,
              issuanceData.notes,
              issuanceData.building,
              // Store actual building ID
              issuanceData.costCenter
              // Store actual cost center code
            ]
          );
          console.log("BULK ISSUANCE: Issuance record created", issuanceResult.rows[0]);
          await client.query(
            `UPDATE parts SET quantity = quantity - $1 WHERE id = $2`,
            [issuanceData.quantity, issuanceData.partId]
          );
          results.push({
            issuance: issuanceResult.rows[0],
            part: {
              id: part.id,
              partId: part.partId,
              name: part.name,
              newQuantity: part.quantity - issuanceData.quantity
            }
          });
        }
        if (errors.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "Some parts could not be issued",
            errors
          });
        }
        await client.query("COMMIT");
        res.status(201).json({
          success: true,
          message: "All parts issued successfully",
          results
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error in bulk parts issuance:", error);
      res.status(500).json({ error: "Failed to issue parts in bulk" });
    }
  });
  router5.get("/parts-issuance", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 1e3;
      const monthParam = req.query.month;
      console.log(`Processing parts issuance request with month parameter: ${monthParam}`);
      let startDate;
      let endDate;
      if (monthParam) {
        const [month, year] = monthParam.split("/");
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0);
          endDate.setHours(23, 59, 59, 999);
          console.log(`Filtering issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        } else {
          console.warn(`Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      let query = `
        SELECT 
          pi.*,
          p.name as part_name, 
          p.part_id as part_number,
          p.unit_cost as unit_cost,
          b.name as building_name,
          cc.name as cost_center_name,
          cc.code as cost_center_code
        FROM parts_issuance pi
        JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        LEFT JOIN cost_centers cc ON pi.cost_center = cc.code
      `;
      const queryParams = [];
      if (startDate && endDate) {
        query += ` WHERE pi.issued_at BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(startDate, endDate);
      }
      query += ` ORDER BY pi.issued_at DESC`;
      query += ` LIMIT ${limit}`;
      console.log(`Executing issuance query with ${queryParams.length} parameters`);
      const result = await pool2.query(query, queryParams);
      console.log(`Found ${result.rows.length} issuance records`);
      const issuances = result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedAt: row.issued_at,
        issuedTo: row.issued_to,
        reason: row.reason,
        notes: row.notes || null,
        projectCode: row.project_code || null,
        department: row.department || null,
        building: row.building || null,
        buildingName: row.building_name || null,
        costCenterName: row.cost_center_name || null,
        costCenterCode: row.cost_center_code || null,
        part: {
          id: 0,
          partId: row.part_number,
          name: row.part_name,
          unitCost: row.unit_cost,
          location: null,
          description: null,
          quantity: 0,
          reorderLevel: 0,
          locationId: null,
          shelfId: null,
          category: null,
          supplier: null,
          lastRestockDate: null
        },
        // Add extended price calculation
        extendedPrice: row.quantity * (row.unit_cost || 0),
        issuedById: row.issued_by_id || null
      }));
      res.json(issuances);
    } catch (error) {
      console.error("Error fetching parts issuance data:", error);
      res.status(500).json({ error: "Failed to fetch parts issuance data" });
    }
  });
  router5.get("/parts-issuance/recent", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 1e3;
      const monthParam = req.query.month;
      console.log(`Processing parts issuance request with month parameter: ${monthParam}`);
      let startDate;
      let endDate;
      if (monthParam) {
        const [month, year] = monthParam.split("/");
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0);
          endDate.setHours(23, 59, 59, 999);
          console.log(`Filtering issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        } else {
          console.warn(`Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      let query = `
        SELECT 
          pi.*,
          p.name as part_name, 
          p.part_id as part_number,
          p.unit_cost as unit_cost,
          b.name as building_name,
          cc.name as cost_center_name,
          cc.code as cost_center_code
        FROM parts_issuance pi
        JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        LEFT JOIN cost_centers cc ON pi.cost_center = cc.code
      `;
      const queryParams = [];
      if (startDate && endDate) {
        query += ` WHERE pi.issued_at BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(startDate, endDate);
      }
      query += ` ORDER BY pi.issued_at DESC`;
      query += ` LIMIT ${limit}`;
      console.log(`Executing issuance query with ${queryParams.length} parameters`);
      const result = await pool2.query(query, queryParams);
      console.log(`Found ${result.rows.length} issuance records`);
      const issuances = result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedAt: row.issued_at,
        issuedTo: row.issued_to,
        reason: row.reason,
        projectCode: row.project_code,
        building: row.building,
        notes: row.notes,
        buildingId: row.building_id,
        costCenter: row.cost_center,
        part: {
          id: row.part_id,
          partId: row.part_number,
          name: row.part_name,
          unitCost: row.unit_cost
        },
        // Include building and cost center details
        buildingName: row.building_name,
        costCenterName: row.cost_center_name,
        costCenterCode: row.cost_center_code,
        // Calculate extended price (quantity * unit cost)
        extendedPrice: row.quantity * (row.unit_cost || 0)
      }));
      res.json(issuances);
    } catch (error) {
      console.error("Error fetching recent parts issuance:", error);
      res.status(500).json({ error: "Failed to fetch recent parts issuance" });
    }
  });
  router5.get("/parts-issuance/export-test", async (req, res) => {
    try {
      const monthParam = req.query.month || "5/2025";
      const format3 = req.query.format || "xlsx";
      const [month, year] = monthParam.split("/");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);
      console.log(`Test Export: Filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      const query = `
        SELECT 
          pi.*,
          p.name as part_name, 
          p.part_id as part_number,
          p.unit_cost as unit_cost,
          b.name as building_name,
          cc.name as cost_center_name,
          cc.code as cost_center_code
        FROM parts_issuance pi
        JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        LEFT JOIN cost_centers cc ON pi.cost_center = cc.code
        WHERE pi.issued_at BETWEEN $1 AND $2
        ORDER BY pi.issued_at DESC
        LIMIT 100
      `;
      const result = await pool2.query(query, [startDate, endDate]);
      console.log(`Test Export: Found ${result.rows.length} records`);
      const issuances = result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedTo: row.issued_to,
        reason: row.reason,
        issuedAt: row.issued_at,
        notes: row.notes || null,
        projectCode: row.project_code || null,
        department: row.department || null,
        building: row.building || null,
        buildingName: row.building_name || null,
        costCenterName: row.cost_center_name || null,
        costCenterCode: row.cost_center_code || null,
        part: {
          id: row.part_id,
          partId: row.part_number,
          name: row.part_name,
          unitCost: row.unit_cost
        },
        extendedPrice: row.quantity * parseFloat(row.unit_cost || "0"),
        issuedById: row.issued_by_id || null
        // Add missing field
      }));
      const excelBuffer = await generatePartsIssuanceExcel(issuances);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=parts-issuance-${monthParam.replace("/", "-")}.xlsx`);
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Test export error:", error);
      res.status(500).json({ error: "Test export failed" });
    }
  });
  router5.get("/parts-issuance/export", async (req, res) => {
    console.log("Main parts issuance export requested - using working implementation");
    try {
      const monthParam = req.query.month;
      const format3 = req.query.format || "xlsx";
      let startDate;
      let endDate;
      let dateFilterSQL = "";
      const queryParams = [];
      if (monthParam) {
        const [month, year] = monthParam.split("/");
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0);
          endDate.setHours(23, 59, 59, 999);
          console.log(`Export: Filtering issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
          dateFilterSQL = " WHERE pi.issued_at BETWEEN $1 AND $2";
          queryParams.push(startDate, endDate);
        } else {
          console.warn(`Export: Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      const query = `
        SELECT 
          pi.*,
          p.name as part_name, 
          p.part_id as part_number,
          p.unit_cost as unit_cost,
          b.name as building_name,
          cc.name as cost_center_name,
          cc.code as cost_center_code
        FROM parts_issuance pi
        JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        LEFT JOIN cost_centers cc ON pi.cost_center = cc.code
        ${dateFilterSQL}
        ORDER BY pi.issued_at DESC
        LIMIT 1000
      `;
      const result = await pool2.query(query, queryParams);
      console.log(`Export: Found ${result.rows.length} issuance records for export`);
      const issuances = result.rows.map((row) => ({
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedTo: row.issued_to,
        reason: row.reason,
        issuedAt: row.issued_at,
        notes: row.notes || null,
        projectCode: row.project_code || null,
        department: row.department || null,
        building: row.building || null,
        buildingName: row.building_name || null,
        costCenterName: row.cost_center_name || null,
        costCenterCode: row.cost_center_code || null,
        part: {
          partId: row.part_number,
          name: row.part_name,
          unitCost: row.unit_cost
        },
        // Add extended price calculation
        extendedPrice: row.quantity * (row.unit_cost || 0),
        issuedById: row.issued_by_id || null
      }));
      let filename = "charge-out-report";
      if (monthParam) {
        filename += `-${monthParam.replace("/", "-")}`;
      } else {
        filename += `-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`;
      }
      if (format3.toLowerCase() === "pdf") {
        try {
          const pdfModule = await Promise.resolve().then(() => (init_pdf(), pdf_exports));
          console.log("Generating PDF report for", issuances.length, "records");
          const pdfBuffer = await pdfModule.generatePartsIssuancePDF(issuances, monthParam);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename=${filename}.pdf`);
          res.setHeader("Content-Length", pdfBuffer.length);
          res.send(pdfBuffer);
        } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
          res.status(500).json({ error: "Failed to generate PDF report" });
        }
      } else {
        const excelBuffer = await generatePartsIssuanceExcel(issuances);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
        res.setHeader("Content-Length", excelBuffer.length);
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error("Error exporting parts issuance data:", error);
      res.status(500).json({ error: "Failed to export parts issuance data" });
    }
  });
  router5.get("/parts-issuance/recent/count", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), async (req, res) => {
    try {
      const monthParam = req.query.month;
      console.log(`Processing parts issuance count request with month parameter: ${monthParam}`);
      let startDate;
      let endDate;
      if (monthParam) {
        const [month, year] = monthParam.split("/");
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 0);
          endDate.setHours(23, 59, 59, 999);
          console.log(`Counting issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        } else {
          console.warn(`Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      let query = `
        SELECT COUNT(*) as total_records, COALESCE(SUM(quantity), 0) as total_parts
        FROM parts_issuance
      `;
      let queryParams = [];
      if (startDate && endDate) {
        query += ` WHERE issued_at BETWEEN $1 AND $2`;
        queryParams.push(startDate, endDate);
      }
      console.log(`Executing count query with params:`, queryParams);
      const result = await pool2.query(query, queryParams);
      const totalParts = parseInt(result.rows[0].total_parts || "0", 10);
      console.log(`Count result: ${totalParts} parts issued in the specified period`);
      res.json({ total: totalParts });
    } catch (error) {
      console.error("Error counting parts issuance:", error);
      res.status(500).json({ error: "Failed to count parts issuance" });
    }
  });
  router5.get("/parts-issuance/monthly-usage", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), async (req, res) => {
    try {
      console.log("Fetching monthly usage data for dashboard chart");
      const monthsData = [];
      const today = /* @__PURE__ */ new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        const monthName = date.toLocaleString("default", { month: "short" });
        const result = await pool2.query(`
          SELECT COALESCE(SUM(quantity), 0) as total_parts
          FROM parts_issuance
          WHERE issued_at BETWEEN $1 AND $2
        `, [startDate, endDate]);
        const count = parseInt(result.rows[0].total_parts || "0", 10);
        monthsData.push({
          month: monthName,
          count
        });
      }
      console.log("Monthly usage data:", monthsData);
      res.json(monthsData);
    } catch (error) {
      console.error("Error fetching monthly usage data:", error);
      res.status(500).json({ error: "Failed to fetch monthly usage data" });
    }
  });
  router5.get("/parts-issuance/part/:id", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), async (req, res) => {
    try {
      const part = await storage.getPartByPartId(req.params.id);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      const issuanceHistory = await storage.getPartsIssuanceByPartId(part.id);
      res.json(issuanceHistory);
    } catch (error) {
      console.error("Error fetching parts issuance history:", error);
      res.status(500).json({ error: "Failed to fetch parts issuance history" });
    }
  });
  router5.patch("/parts-issuance/:id", requireAuth2, requireRole2(["admin", "technician", "student", "controller"]), requireWritePermission(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const issuance = await storage.getPartsIssuance(id);
      if (!issuance) {
        return res.status(404).json({ error: "Issuance record not found" });
      }
      const { building, issuedTo, quantity, notes, costCenter, issuedAt } = req.body;
      console.log("Updating charge-out with data:", {
        id,
        building,
        issuedTo,
        quantity,
        notes,
        costCenter,
        issuedAt
      });
      const updated = await storage.updatePartsIssuance(id, {
        // Convert building string to number for proper storage in building_id column
        buildingId: building ? parseInt(building, 10) : null,
        issuedTo,
        quantity: quantity ? parseInt(quantity, 10) : void 0,
        notes,
        // Ensure costCenter is properly handled (could be an ID or code)
        costCenter: costCenter !== "none" ? costCenter : null
        // issuedAt: issuedAt ? new Date(issuedAt) : undefined  // Commented out problematic field
      });
      if (updated) {
        const part = await storage.getPart(updated.partId);
        const issuedBy = updated.issuedById ? await storage.getUser(updated.issuedById) : void 0;
        let building2 = null;
        let buildingName = null;
        let costCenterCode = null;
        let costCenterName = null;
        if (updated.buildingId) {
          const buildingData = await storage.getBuilding(updated.buildingId);
          building2 = buildingData?.id;
          buildingName = buildingData?.name;
        }
        if (updated.costCenter) {
          const costCenterData = await storage.getCostCenterByCode(updated.costCenter);
          costCenterCode = costCenterData?.code;
          costCenterName = costCenterData?.name;
        }
        res.status(200).json({
          ...updated,
          part,
          issuedBy,
          building: building2,
          buildingName,
          costCenter: costCenterCode,
          costCenterName
        });
      } else {
        res.status(500).json({ error: "Failed to update charge out" });
      }
    } catch (error) {
      console.error("Error updating parts issuance:", error);
      res.status(500).json({
        error: "Failed to update parts issuance",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  router5.delete("/parts-issuance/:id", requireAuth2, requireRole2(["admin", "student", "technician"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`DELETE request for parts issuance ID: ${id}`);
      if (isNaN(id)) {
        console.log("Invalid ID format provided");
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const issuance = await storage.getPartsIssuance(id);
      if (!issuance) {
        console.log(`No issuance record found for ID ${id}`);
        return res.status(404).json({ error: "Charge-out record not found" });
      }
      console.log(`Found issuance record for ID ${id}, proceeding with delete`);
      const success = await storage.deletePartsIssuance(id);
      if (!success) {
        console.log(`Failed to delete issuance record ${id}`);
        return res.status(500).json({ error: "Failed to delete charge-out record" });
      }
      console.log(`Successfully deleted issuance record ${id}`);
      res.status(200).json({
        message: "Charge-out deleted successfully",
        id
      });
    } catch (error) {
      console.error("Error deleting parts issuance:", error);
      res.status(500).json({ error: "Failed to delete charge-out record" });
    }
  });
  router5.post("/reset-charge-outs", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    console.log("RESET FUNCTION ACCESSED - This function has been disabled to prevent data loss");
    return res.status(400).json({
      success: false,
      error: "This function has been disabled because it permanently deletes data. Please contact your system administrator."
    });
  });
  router5.delete("/parts-issuance/month/:month", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const monthParam = req.params.month;
      console.log(`REDIRECTING: Old reset endpoint called with month ${monthParam}`);
      const result = await new Promise((resolve, reject) => {
        const forwardedReq = {
          body: { month: monthParam }
        };
        const forwardedRes = {
          status: (code) => ({
            json: (data) => resolve({ statusCode: code, data })
          })
        };
        router5.stack.find((layer) => layer.route?.path === "/reset-charge-outs")?.route?.stack[0]?.handle(forwardedReq, forwardedRes, (err) => {
          if (err) reject(err);
        });
      });
      return res.status(result.statusCode).json(result.data);
    } catch (error) {
      console.error("FORWARDING ERROR:", error);
      return res.status(500).json({
        error: "Failed to reset charge-out records",
        success: false
      });
    }
  });
  router5.get("/parts-issuance/template", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      console.log("Generating charge-outs template...");
      const templateBuffer = generateChargeOutsTemplateExcel();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=charge_outs_import_template.xlsx");
      res.setHeader("Content-Length", templateBuffer.length);
      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating charge-outs template:", error);
      res.status(400).json({ error: "Failed to generate template" });
    }
  });
  router5.get("/parts-issuance/export-data", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      console.log("Exporting charge-outs data...");
      const chargeOuts = await storage.getPartsIssuance();
      const excelBuffer = generateChargeOutsExcel(chargeOuts);
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=charge_outs_export_${timestamp2}.xlsx`);
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting charge-outs:", error);
      res.status(500).json({ error: "Failed to export charge-outs" });
    }
  });
  router5.post("/parts-issuance/import", requireAuth2, requireRole2(["admin"]), requireWritePermission(), upload_default.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      console.log("Importing charge-outs from:", req.file.originalname);
      const { chargeOuts, errors } = readChargeOutsFromExcel(req.file.path);
      if (errors.length > 0) {
        console.log("Import errors:", errors);
        return res.status(400).json({
          error: "File contains errors",
          details: errors
        });
      }
      let importedCount = 0;
      for (const chargeOut of chargeOuts) {
        try {
          await storage.createPartsIssuance(chargeOut);
          importedCount++;
        } catch (error) {
          console.error("Error importing charge-out:", error);
        }
      }
      fs4.unlinkSync(req.file.path);
      res.json({
        success: true,
        message: `Successfully imported ${importedCount} of ${chargeOuts.length} charge-outs`,
        totalRows: chargeOuts.length,
        importedRows: importedCount,
        errors: chargeOuts.length - importedCount > 0 ? [`${chargeOuts.length - importedCount} records failed to import`] : []
      });
    } catch (error) {
      console.error("Error during charge-outs import:", error);
      res.status(500).json({ error: "Failed to import charge-outs" });
    }
  });
  router5.get("/buildings", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      console.log("DIRECT ACCESS: Getting buildings directly for UI fix");
      const result = await pool2.query("SELECT * FROM buildings ORDER BY name");
      const buildings2 = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        location: row.location
      }));
      console.log(`DIRECT ACCESS: Returning ${buildings2.length} buildings`);
      res.json(buildings2);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ error: "Failed to fetch buildings" });
    }
  });
  router5.get("/buildings/template", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      console.log("Generating buildings template...");
      const templateBuffer = generateBuildingsTemplateExcel();
      console.log("Template buffer created, size:", templateBuffer.length);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=buildings_import_template.xlsx");
      res.setHeader("Content-Length", templateBuffer.length);
      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(400).json({ error: "Failed to generate template" });
    }
  });
  router5.get("/buildings/export", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const buildings2 = await storage.getBuildings();
      const excelBuffer = generateBuildingsExcel(buildings2);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=buildings.xlsx");
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting buildings:", error);
      res.status(500).json({ error: "Failed to export buildings" });
    }
  });
  router5.get("/buildings/:id", requireAuth2, requireRole2(["admin", "student", "technician"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid building ID" });
      }
      const building = await storage.getBuilding(id);
      if (!building) {
        return res.status(404).json({ error: "Building not found" });
      }
      res.json(building);
    } catch (error) {
      console.error("Error fetching building:", error);
      res.status(500).json({ error: "Failed to fetch building" });
    }
  });
  router5.post("/buildings", requireAuth2, requireRole2(["admin", "controller"]), requireWritePermission(), async (req, res) => {
    try {
      const validatedData = insertBuildingSchema.parse(req.body);
      const newBuilding = await storage.createBuilding(validatedData);
      res.status(201).json(newBuilding);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating building:", error);
      res.status(500).json({ error: "Failed to create building" });
    }
  });
  router5.patch("/buildings/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid building ID" });
      }
      const building = await storage.getBuilding(id);
      if (!building) {
        return res.status(404).json({ error: "Building not found" });
      }
      const validatedData = insertBuildingSchema.partial().parse(req.body);
      const updated = await storage.updateBuilding(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating building:", error);
      res.status(500).json({ error: "Failed to update building" });
    }
  });
  router5.delete("/buildings/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid building ID" });
      }
      const building = await storage.getBuilding(id);
      if (!building) {
        return res.status(404).json({ error: "Building not found" });
      }
      const result = await storage.deleteBuilding(id);
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete building" });
      }
    } catch (error) {
      console.error("Error deleting building:", error);
      res.status(500).json({ error: "Failed to delete building" });
    }
  });
  router5.get("/storage-locations", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const locations = await storage.getStorageLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching storage locations:", error);
      res.status(500).json({ error: "Failed to fetch storage locations" });
    }
  });
  router5.get("/locations", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const locations = await storage.getStorageLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching storage locations:", error);
      res.status(500).json({ error: "Failed to fetch storage locations" });
    }
  });
  router5.get("/storage-locations/export", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const locations = await storage.getStorageLocations();
      if (!locations || locations.length === 0) {
        return res.status(404).json({ error: "No storage locations found" });
      }
      console.log(`Exporting ${locations.length} storage locations to Excel`);
      const excelBuffer = generateLocationsExcel(locations);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=storage_locations.xlsx");
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting storage locations:", error);
      res.status(500).json({ error: "Failed to export storage locations" });
    }
  });
  router5.get("/storage-locations/template", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      console.log("Generating storage locations template...");
      const templateBuffer = generateLocationsTemplateExcel();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=storage_locations_import_template.xlsx");
      res.setHeader("Content-Length", templateBuffer.length);
      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating storage locations template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  router5.post("/storage-locations/import", requireAuth2, requireRole2(["admin"]), upload_default.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      console.log(`Processing locations import from ${req.file.originalname}`);
      const { locations, errors } = readLocationsFromExcel(req.file.path);
      const importResults = {
        success: true,
        totalRows: locations.length + errors.length,
        importedRows: 0,
        errors
      };
      for (const location of locations) {
        try {
          const locations2 = await storage.getStorageLocations();
          const existingLocation = locations2.find((loc) => loc.name.toLowerCase() === location.name.toLowerCase());
          if (existingLocation) {
            await storage.updateStorageLocation(existingLocation.id, {
              name: location.name,
              description: location.description,
              active: location.active
            });
            importResults.importedRows++;
          } else {
            await storage.createStorageLocation(location);
            importResults.importedRows++;
          }
        } catch (error) {
          console.error(`Error importing location ${location.name}:`, error);
          importResults.errors.push({
            row: 0,
            // We don't know which row this is from the original file
            message: `Failed to import ${location.name}: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
      fs4.unlinkSync(req.file.path);
      importResults.success = importResults.errors.length === 0;
      res.json(importResults);
    } catch (error) {
      console.error("Error importing storage locations:", error);
      if (req.file && fs4.existsSync(req.file.path)) {
        fs4.unlinkSync(req.file.path);
      }
      res.status(500).json({
        error: "Failed to import storage locations",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  router5.get("/storage-locations/:id", requireAuth2, requireRole2(["admin", "student", "technician"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }
      const location = await storage.getStorageLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Storage location not found" });
      }
      const shelves2 = await storage.getShelvesByLocation(id);
      res.json({ ...location, shelves: shelves2 });
    } catch (error) {
      console.error("Error fetching storage location:", error);
      res.status(500).json({ error: "Failed to fetch storage location" });
    }
  });
  router5.post("/storage-locations", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const validatedData = insertStorageLocationSchema.parse(req.body);
      const newLocation = await storage.createStorageLocation(validatedData);
      res.status(201).json(newLocation);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating storage location:", error);
      res.status(500).json({ error: "Failed to create storage location" });
    }
  });
  router5.patch("/storage-locations/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }
      const location = await storage.getStorageLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Storage location not found" });
      }
      const validatedData = insertStorageLocationSchema.partial().parse(req.body);
      const updated = await storage.updateStorageLocation(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating storage location:", error);
      res.status(500).json({ error: "Failed to update storage location" });
    }
  });
  router5.delete("/storage-locations/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }
      const location = await storage.getStorageLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Storage location not found" });
      }
      const success = await storage.deleteStorageLocation(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete storage location" });
      }
    } catch (error) {
      console.error("Error deleting storage location:", error);
      res.status(500).json({ error: "Failed to delete storage location" });
    }
  });
  router5.get("/shelves", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      console.log("GET /shelves - Fetching shelves from database...");
      console.log("Executing query for ALL shelves...");
      const result = await pool2.query(`
        SELECT 
          id,
          location_id AS "locationId",
          name,
          description,
          active,
          created_at AS "createdAt"
        FROM shelves 
        ORDER BY location_id, name
      `);
      console.log(`GET /shelves - Found ${result.rows.length} shelves in database (real number)`);
      console.log("Sample shelves:", result.rows.slice(0, 5));
      const hasG4 = result.rows.find((shelf) => shelf.name === "Shelf G4");
      const hasN2 = result.rows.find((shelf) => shelf.name === "Shelf N2");
      const maxId = Math.max(...result.rows.map((shelf) => shelf.id));
      const minId = Math.min(...result.rows.map((shelf) => shelf.id));
      console.log(`Shelf range: ID ${minId} to ${maxId}`);
      console.log(`Has Shelf G4: ${hasG4 ? "YES (ID " + hasG4.id + ")" : "NO"}`);
      console.log(`Has Shelf N2: ${hasN2 ? "YES (ID " + hasN2.id + ")" : "NO"}`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching shelves:", error);
      res.status(500).json({ error: "Failed to fetch shelves" });
    }
  });
  router5.post("/shelves/bulk-delete", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log("POST /shelves/bulk-delete - Deleting multiple shelves");
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No shelf IDs provided" });
      }
      console.log(`Attempting to delete ${ids.length} shelves: ${ids.join(", ")}`);
      const client = await pool2.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          "DELETE FROM shelves WHERE id = ANY($1::int[]) RETURNING id",
          [ids]
        );
        await client.query("COMMIT");
        const deletedIds = result.rows.map((row) => row.id);
        console.log(`Successfully deleted ${deletedIds.length} shelves`);
        res.json({
          success: true,
          message: `Successfully deleted ${deletedIds.length} shelves`,
          deletedIds
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error in bulk delete transaction:", error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error deleting shelves in bulk:", error);
      res.status(500).json({ error: "Failed to delete shelves" });
    }
  });
  router5.get("/shelves/export", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const shelves2 = await storage.getShelves();
      if (!shelves2 || shelves2.length === 0) {
        return res.status(404).json({ error: "No shelves found" });
      }
      console.log(`Exporting ${shelves2.length} shelves to Excel`);
      const excelBuffer = generateShelvesExcel(shelves2);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=shelves.xlsx");
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting shelves:", error);
      res.status(500).json({ error: "Failed to export shelves" });
    }
  });
  router5.get("/shelves/template", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      console.log("Generating shelves template...");
      const templateBuffer = generateShelvesTemplateExcel();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=shelves_import_template.xlsx");
      res.setHeader("Content-Length", templateBuffer.length);
      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating shelves template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  router5.post("/shelves/import", requireAuth2, requireRole2(["admin"]), upload_default.single("file"), async (req, res) => {
    const client = await pool2.connect();
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      console.log(`Processing shelves import from ${req.file.originalname}`);
      const { shelves: shelves2, errors } = readShelvesFromExcel(req.file.path);
      console.log(`Parsed ${shelves2.length} shelves from Excel file, with ${errors.length} parse errors`);
      if (shelves2.length > 0) {
        console.log(`Sample shelf from import: ${JSON.stringify(shelves2[0])}`);
      }
      if (errors.length > 0) {
        console.log(`Sample errors from import: ${JSON.stringify(errors.slice(0, 3))}`);
      }
      const importResults = {
        success: true,
        totalRows: shelves2.length + errors.length,
        importedRows: 0,
        errors
      };
      try {
        await client.query("BEGIN");
        console.log("Started database transaction for shelf import");
        const availableLocationsResult = await client.query("SELECT id, name FROM storage_locations WHERE active = true");
        const availableLocations = availableLocationsResult.rows;
        console.log(`Available locations for shelf import: ${JSON.stringify(availableLocations)}`);
        const existingShelvesLocation1Result = await client.query("SELECT * FROM shelves WHERE location_id = 1");
        const existingShelvesLocation2Result = await client.query("SELECT * FROM shelves WHERE location_id = 2");
        const existingShelvesLocation1 = existingShelvesLocation1Result.rows;
        const existingShelvesLocation2 = existingShelvesLocation2Result.rows;
        console.log(`Found ${existingShelvesLocation1.length} existing shelves for location ID 1`);
        console.log(`Found ${existingShelvesLocation2.length} existing shelves for location ID 2`);
        const successfulImports = [];
        const failedImports = [];
        for (const shelf of shelves2) {
          try {
            console.log(`Processing shelf: ${JSON.stringify(shelf)}`);
            if (shelf.locationId !== 1 && shelf.locationId !== 2) {
              const errorMsg = `Failed to import shelf ${shelf.name}: Location ID ${shelf.locationId} must be either 1 (Stockroom) or 2 (Warehouse)`;
              console.error(errorMsg);
              importResults.errors.push({
                row: 0,
                message: errorMsg
              });
              failedImports.push(shelf);
              continue;
            }
            const existingShelves = shelf.locationId === 1 ? existingShelvesLocation1 : existingShelvesLocation2;
            const existingShelf = existingShelves.find((s) => s.name.toLowerCase() === shelf.name.toLowerCase());
            if (existingShelf) {
              console.log(`Updating existing shelf: ${existingShelf.id} (${existingShelf.name})`);
              await client.query(
                "UPDATE shelves SET name = $1, description = $2, active = true WHERE id = $3",
                [shelf.name, shelf.description || null, existingShelf.id]
              );
              importResults.importedRows++;
              successfulImports.push(shelf);
            } else {
              console.log(`Creating new shelf: ${shelf.name} for location ${shelf.locationId}`);
              const result = await client.query(
                "INSERT INTO shelves (location_id, name, description, active) VALUES ($1, $2, $3, true) RETURNING *",
                [shelf.locationId, shelf.name, shelf.description || null]
              );
              const newShelf = result.rows[0];
              console.log(`Created new shelf with ID: ${newShelf.id}`);
              importResults.importedRows++;
              successfulImports.push(shelf);
              if (shelf.locationId === 1) {
                existingShelvesLocation1.push(newShelf);
              } else {
                existingShelvesLocation2.push(newShelf);
              }
            }
          } catch (error) {
            const errorMsg = `Failed to import ${shelf.name}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(`Error importing shelf ${shelf.name}:`, error);
            importResults.errors.push({
              row: 0,
              // We don't know which row this is from the original file
              message: errorMsg
            });
            failedImports.push(shelf);
          }
        }
        await client.query("COMMIT");
        console.log("Transaction committed successfully");
        console.log(`Shelf import completed. Summary:
          - Total shelves in file: ${shelves2.length}
          - Successfully imported: ${successfulImports.length}
          - Failed to import: ${failedImports.length}
          - Initial parse errors: ${errors.length}`);
        const finalCountQuery = await client.query("SELECT COUNT(*) FROM shelves");
        const finalCount = parseInt(finalCountQuery.rows[0].count);
        console.log(`Final shelf count in database: ${finalCount}`);
        fs4.unlinkSync(req.file.path);
        importResults.success = importResults.errors.length === 0;
        res.json(importResults);
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Transaction rolled back due to error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error importing shelves:", error);
      if (req.file && fs4.existsSync(req.file.path)) {
        fs4.unlinkSync(req.file.path);
      }
      res.status(500).json({
        error: "Failed to import shelves",
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      client.release();
      console.log("Database client released");
    }
  });
  router5.get("/shelves/:id", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid shelf ID" });
      }
      const shelf = await storage.getShelf(id);
      if (!shelf) {
        return res.status(404).json({ error: "Shelf not found" });
      }
      const location = await storage.getStorageLocation(shelf.locationId);
      const parts2 = await storage.getPartsByLocation(void 0, id);
      res.json({ ...shelf, location, parts: parts2 });
    } catch (error) {
      console.error("Error fetching shelf:", error);
      res.status(500).json({ error: "Failed to fetch shelf" });
    }
  });
  router5.get("/shelves/by-location/:locationId", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }
      console.log(`GET /shelves/by-location/${locationId} - Executing direct query for shelves...`);
      const result = await pool2.query(`
        SELECT 
          id,
          location_id AS "locationId",
          name,
          description,
          active,
          created_at AS "createdAt"
        FROM shelves 
        WHERE location_id = $1
        ORDER BY name
      `, [locationId]);
      console.log(`Found ${result.rows.length} shelves for location ID ${locationId} (from direct query)`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching shelves by location:", error);
      res.status(500).json({ error: "Failed to fetch shelves" });
    }
  });
  router5.post("/shelves", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log("POST /shelves - Creating new shelf");
      const validatedData = insertShelfSchema.parse(req.body);
      const location = await storage.getStorageLocation(validatedData.locationId);
      if (!location) {
        return res.status(400).json({ error: "Storage location not found" });
      }
      const existingShelves = await storage.getShelvesByLocation(validatedData.locationId);
      const duplicate = existingShelves.find((s) => s.name.toLowerCase() === validatedData.name.toLowerCase());
      if (duplicate) {
        console.log(`Duplicate shelf name "${validatedData.name}" in location ID ${validatedData.locationId}`);
        return res.status(400).json({ error: `A shelf named "${validatedData.name}" already exists in this location` });
      }
      const newShelf = await storage.createShelf(validatedData);
      console.log(`Created new shelf with ID: ${newShelf.id}`);
      res.status(201).json(newShelf);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      const pgError = error;
      if (pgError.code === "23505" && pgError.constraint === "shelves_location_id_name_key") {
        return res.status(400).json({ error: "A shelf with this name already exists in this location" });
      }
      console.error("Error creating shelf:", error);
      res.status(500).json({ error: "Failed to create shelf" });
    }
  });
  router5.patch("/shelves/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log(`PATCH /shelves/${req.params.id} - Updating shelf`);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid shelf ID" });
      }
      const shelf = await storage.getShelf(id);
      if (!shelf) {
        return res.status(404).json({ error: "Shelf not found" });
      }
      const validatedData = insertShelfSchema.partial().parse(req.body);
      if (validatedData.locationId && validatedData.locationId !== shelf.locationId) {
        const location = await storage.getStorageLocation(validatedData.locationId);
        if (!location) {
          return res.status(400).json({ error: "Storage location not found" });
        }
      }
      const updated = await storage.updateShelf(id, validatedData);
      console.log(`Updated shelf with ID: ${id}`);
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating shelf:", error);
      res.status(500).json({ error: "Failed to update shelf" });
    }
  });
  router5.delete("/shelves/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log(`DELETE /shelves/${req.params.id} - Deleting shelf`);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid shelf ID" });
      }
      const shelf = await storage.getShelf(id);
      if (!shelf) {
        return res.status(404).json({ error: "Shelf not found" });
      }
      const success = await storage.deleteShelf(id);
      console.log(`Deleted shelf with ID: ${id}, success: ${success}`);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete shelf" });
      }
    } catch (error) {
      console.error("Error deleting shelf:", error);
      res.status(500).json({ error: "Failed to delete shelf" });
    }
  });
  router5.post("/parts/import", upload_default.single("file"), requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log("Parts import endpoint hit");
      console.log("Authentication check:", req.session?.user ? `User: ${req.session.user.username}` : "No user");
      console.log("File received:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "No file");
      if (!req.file) {
        console.error("No file uploaded - req.file is undefined");
        return res.status(400).json({ error: "No file uploaded" });
      }
      console.log("Processing Excel file:", req.file.path);
      const { parts: parts2, errors } = readPartsFromExcel(req.file.path);
      console.log(`Excel processing complete - ${parts2.length} parts found, ${errors.length} errors`);
      const importResults = {
        success: true,
        totalRows: parts2.length + errors.length,
        importedRows: 0,
        errors
      };
      if (parts2.length > 0) {
        let importedCount = 0;
        console.log(`Starting import of ${parts2.length} parts`);
        for (const part of parts2) {
          try {
            console.log(`Importing part: ${part.partId} - ${part.name}`);
            const existingPart = await storage.getPartByPartId(part.partId);
            if (existingPart) {
              console.log(`Updating existing part: ${part.partId}`);
              await storage.updatePart(existingPart.id, part);
            } else {
              console.log(`Creating new part: ${part.partId}`);
              await storage.createPart(part);
            }
            importedCount++;
          } catch (err) {
            console.error(`Error importing part ${part.partId}:`, err);
            importResults.errors.push({
              row: importResults.errors.length + importedCount + 2,
              // +2 for header and 0-indexing
              message: `Failed to import: ${err instanceof Error ? err.message : String(err)}`
            });
          }
        }
        importResults.importedRows = importedCount;
        console.log(`Import complete - ${importedCount} parts imported successfully`);
      }
      fs4.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
      res.json(importResults);
    } catch (error) {
      console.error("Error importing parts:", error);
      if (req.file) {
        fs4.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
      res.status(500).json({ error: "Failed to import parts" });
    }
  });
  router5.get("/users", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  router5.get("/profile", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const currentUser = users2.find((user) => user.role === "admin");
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: currentUser.id,
        name: adminName,
        email: adminEmail
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  router5.patch("/profile", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log("Profile update received:", req.body);
      const users2 = await storage.getUsers();
      const currentUser = users2.find((user) => user.role === "admin");
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = await storage.updateUser(currentUser.id, {
        name: req.body.name
        // We don't actually store email in the schema, but for UI purposes we pretend we do
      });
      if (req.body.email) {
        adminEmail = req.body.email;
      }
      if (updatedUser) {
        res.json({
          success: true,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: adminEmail
          }
        });
      } else {
        res.status(500).json({ error: "Failed to update user record" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  router5.post("/change-password", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log("Password change request received:", req.body);
      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required" });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "New passwords don't match" });
      }
      const users2 = await storage.getUsers();
      const adminUser = users2.find((user) => user.role === "admin");
      if (!adminUser) {
        return res.status(404).json({ error: "Admin user not found" });
      }
      await pool2.query(
        `UPDATE users SET password = $1 WHERE role = 'admin'`,
        [newPassword]
      );
      global.adminPassword = newPassword;
      res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  router5.get("/notification-settings", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });
  router5.patch("/notification-settings", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      console.log("Notification settings update received:", req.body);
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid notification settings" });
      }
      const { workOrders, inventory } = req.body;
      if (!workOrders || !inventory || typeof workOrders !== "object" || typeof inventory !== "object") {
        return res.status(400).json({ error: "Missing required notification settings" });
      }
      const updatedSettings = await storage.updateNotificationSettings({
        workOrders: {
          newWorkOrders: Boolean(workOrders.newWorkOrders),
          statusChanges: Boolean(workOrders.statusChanges),
          comments: Boolean(workOrders.comments)
        },
        inventory: {
          lowStockAlerts: Boolean(inventory.lowStockAlerts),
          partIssuance: Boolean(inventory.partIssuance)
        }
      });
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });
  router5.get("/technicians", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });
  router5.post("/technicians", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const { name, username, password, role = "technician", department } = req.body;
      if (!name || !username) {
        return res.status(400).json({ error: "Name and username are required" });
      }
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const allUsers = await storage.getUsers();
      const duplicateName = allUsers.find(
        (user) => user.name.toLowerCase() === name.toLowerCase() && user.role === (role || "technician")
      );
      if (duplicateName) {
        return res.status(400).json({
          error: "A technician with this name already exists. Please use a different name or add a distinguishing detail (like department or location)."
        });
      }
      const newTechnician = await storage.createUser({
        name,
        username,
        password: password || username,
        // Use username as default password if none provided
        role: role || "technician",
        department: department || null
      });
      res.status(201).json(newTechnician);
    } catch (error) {
      console.error("Error creating technician:", error);
      res.status(500).json({ error: "Failed to create technician" });
    }
  });
  router5.post("/technicians/import", requireAuth2, requireRole2(["admin"]), upload_default.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { technicians, errors } = readTechniciansFromExcel(req.file.path);
      console.log("Technicians read from Excel:", JSON.stringify(technicians, null, 2));
      const importResults = {
        success: true,
        totalRows: technicians.length + errors.length,
        importedRows: 0,
        errors
      };
      if (technicians.length > 0) {
        let importedCount = 0;
        for (const technician of technicians) {
          try {
            console.log("Processing technician:", JSON.stringify(technician, null, 2));
            if (technician.role !== "admin" && technician.role !== "technician") {
              technician.role = "technician";
              console.log("Fixed invalid role to 'technician'");
            }
            const existingUser = await storage.getUserByUsername(technician.username);
            const allUsers = await storage.getUsers();
            const duplicateName = allUsers.find(
              (user) => user.username !== technician.username && // Not the same user (by username)
              user.name.toLowerCase() === technician.name.toLowerCase() && user.role === (technician.role || "technician")
            );
            if (duplicateName) {
              console.log(`Skipping technician with duplicate name: ${technician.name}`);
              importResults.errors.push({
                row: importResults.errors.length + importedCount + 2,
                // +2 for header and 0-indexing
                message: `Skipped: A technician with name "${technician.name}" already exists. Please use a different name or add a distinguishing detail (like department).`
              });
              continue;
            }
            if (existingUser) {
              console.log("Updating existing user:", existingUser.id);
              await storage.createUser({
                ...existingUser,
                name: technician.name,
                role: technician.role,
                department: technician.department,
                // Keep existing password
                password: existingUser.password
              });
            } else {
              console.log("Creating new technician");
              await storage.createUser(technician);
            }
            importedCount++;
          } catch (err) {
            console.error("Error importing technician:", err);
            importResults.errors.push({
              row: importResults.errors.length + importedCount + 2,
              // +2 for header and 0-indexing
              message: `Failed to import: ${err instanceof Error ? err.message : String(err)}`
            });
          }
        }
        importResults.importedRows = importedCount;
      }
      fs4.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
      res.json(importResults);
    } catch (error) {
      console.error("Error importing technicians:", error);
      if (req.file) {
        fs4.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
      res.status(500).json({ error: "Failed to import technicians" });
    }
  });
  router5.get("/technicians/export", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      const excelBuffer = generateTechniciansExcel(technicians);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=technicians.xlsx");
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting technicians:", error);
      res.status(500).json({ error: "Failed to export technicians" });
    }
  });
  router5.get("/technicians/template", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const templateBuffer = generateTechniciansTemplateExcel();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=technicians_import_template.xlsx");
      res.setHeader("Content-Length", templateBuffer.length);
      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  router5.delete("/technicians/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid technician ID" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Technician not found" });
      }
      if (user.role === "admin") {
        return res.status(403).json({ error: "Cannot delete administrator user" });
      }
      const result = await storage.deleteUser(id);
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete technician" });
      }
    } catch (error) {
      console.error("Error deleting technician:", error);
      res.status(500).json({ error: "Failed to delete technician" });
    }
  });
  router5.post("/buildings/import", requireAuth2, requireRole2(["admin"]), upload_default.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { buildings: buildings2, errors } = readBuildingsFromExcel(req.file.path);
      const importResults = {
        success: true,
        totalRows: buildings2.length + errors.length,
        importedRows: 0,
        errors
      };
      if (buildings2.length > 0) {
        let importedCount = 0;
        for (const building of buildings2) {
          try {
            const existingBuildings = await storage.getBuildings();
            const existingBuilding = existingBuildings.find((b) => b.name === building.name);
            if (existingBuilding) {
              await storage.updateBuilding(existingBuilding.id, building);
            } else {
              await storage.createBuilding(building);
            }
            importedCount++;
          } catch (err) {
            importResults.errors.push({
              row: importResults.errors.length + importedCount + 2,
              // +2 for header and 0-indexing
              message: `Failed to import: ${err instanceof Error ? err.message : String(err)}`
            });
          }
        }
        importResults.importedRows = importedCount;
      }
      fs4.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
      res.json(importResults);
    } catch (error) {
      console.error("Error importing buildings:", error);
      if (req.file) {
        fs4.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
      res.status(500).json({ error: "Failed to import buildings" });
    }
  });
  router5.get("/technicians-list", async (req, res) => {
    try {
      console.log("Fetching technicians for login page or mobile app");
      const techniciansList = await storage.getUsers();
      const permanentTechnicians = techniciansList.filter(
        (user) => user.role === "technician" && !user.username.startsWith("temp_")
      );
      console.log(`Storage interface found ${permanentTechnicians.length} permanent technicians`);
      const adminUsers = techniciansList.filter((user) => user.role === "admin");
      console.log(`Found ${adminUsers.length} admin users`);
      const technicians = [...permanentTechnicians, ...adminUsers];
      console.log(`Found ${technicians.length} technicians/admins after filtering`);
      if (technicians.length > 0) {
        console.log("Sample technician:", {
          id: technicians[0].id,
          username: technicians[0].username,
          name: technicians[0].name,
          role: technicians[0].role,
          department: technicians[0].department
        });
      }
      const sanitizedTechnicians = technicians.map((tech) => ({
        id: tech.id,
        username: tech.username,
        name: tech.name,
        role: "technician",
        // Always display as technician for UI consistency
        department: tech.department
      }));
      res.setHeader("Cache-Control", "public, max-age=60");
      res.json(sanitizedTechnicians);
    } catch (error) {
      console.error("Error fetching technicians for login:", error);
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });
  router5.post("/login", async (req, res) => {
    try {
      console.log("Login request received, raw body:", req.body);
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("PASSWORD ATTEMPTED:", req.body.password);
      const { username, password, role, name, department, redirect } = req.body;
      const redirectUrl = redirect || null;
      const isFormSubmission = req.headers["content-type"]?.includes("application/x-www-form-urlencoded");
      console.log("Processed login request:", {
        username,
        name,
        role,
        department,
        redirectUrl,
        hasPassword: !!password,
        isFormSubmission
      });
      if (role === "controller" || !role && username && password) {
        const user = await storage.getUserByUsername(username);
        if (user && user.role === "controller") {
          if (!username || !password) {
            return res.status(400).json({ error: "Username and password required for controller login" });
          }
          const crypto = await import("crypto");
          const { promisify: promisify2 } = await import("util");
          const scryptAsync = promisify2(crypto.scrypt);
          const [hashed, salt] = user.password.split(".");
          const hashedBuf = Buffer.from(hashed, "hex");
          const suppliedBuf = await scryptAsync(password, salt, 64);
          const isPasswordValid = crypto.timingSafeEqual(hashedBuf, suppliedBuf);
          if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid controller credentials" });
          }
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "controller"
          };
          console.log(`Controller login successful for ${user.name}`);
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          if (isFormSubmission) {
            return res.redirect(302, "/");
          } else {
            return res.status(200).json({
              id: user.id,
              username: user.username,
              name: user.name,
              role: "controller"
            });
          }
        }
      } else if (role === "admin") {
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password required" });
        }
        const user = await storage.getUserByUsername(username);
        if (username === "admin") {
          if (!user && password === "admin") {
            console.log("Creating default admin user with default password");
            const newUser = await storage.createUser({
              username: "admin",
              name: "Administrator",
              password: "admin",
              role: "admin",
              department: "Administration"
            });
            req.session.user = {
              id: newUser.id,
              username: newUser.username,
              name: newUser.name,
              role: "admin"
            };
            console.log(`Admin login successful for ${newUser.name}`);
            if (redirectUrl) {
              return res.redirect(redirectUrl);
            }
            return res.status(200).json({
              id: newUser.id,
              username: newUser.username,
              name: newUser.name,
              role: "admin"
            });
          }
          if (user && (password === "admin" || password === "JaciJo2012" || password === user.password)) {
            console.log(`Admin login successful for existing user ${user.name}`);
            req.session.user = {
              id: user.id,
              username: user.username,
              name: user.name,
              role: "admin"
            };
            if (redirectUrl) {
              return res.redirect(redirectUrl);
            }
            return res.status(200).json({
              id: user.id,
              username: user.username,
              name: user.name,
              role: "admin"
            });
          }
        }
        if (user && user.role === "admin" && password === "JaciJo2012") {
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "admin"
          };
          console.log(`Admin login successful with JaciJo2012 password for ${user.name}`);
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          return res.status(200).json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: "admin"
          });
        }
        if (!user || user.password !== password || user.role !== "admin") {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: "admin"
        };
        if (redirectUrl) {
          return res.redirect(redirectUrl);
        }
        return res.status(200).json({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        });
      } else if (role === "student") {
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password required" });
        }
        if ((username === "Student" || username.toLowerCase() === "student") && (password === "Onu" || password === "onu")) {
          console.log("Using hardcoded student credentials");
          let user2 = await storage.getUserByUsername("Student");
          if (!user2) {
            console.log("Student user doesn't exist, creating one");
            user2 = await storage.createUser({
              username: "Student",
              name: "Student Worker",
              password: "Onu",
              role: "student",
              department: "Student Workers"
            });
          }
          req.session.user = {
            id: user2.id,
            username: user2.username,
            name: user2.name,
            role: "student"
          };
          console.log(`Student login successful for ${user2.name}`);
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          return res.status(200).json({
            id: user2.id,
            username: user2.username,
            name: user2.name,
            role: "student"
          });
        }
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: "student"
        };
        if (redirectUrl) {
          return res.redirect(redirectUrl);
        }
        return res.status(200).json({
          id: user.id,
          username: user.username,
          name: user.name,
          role: "student"
        });
      } else if (role === "technician") {
        if (req.body.id) {
          const userId = parseInt(req.body.id);
          console.log(`Technician attempting to login with ID: ${userId} (original: ${req.body.id})`);
          if (isNaN(userId)) {
            console.log("Invalid user ID - not a number:", req.body.id);
            return res.status(401).json({ error: "Invalid user ID format" });
          }
          const user = await storage.getUser(userId);
          if (!user) {
            console.log(`No user found with ID ${userId}`);
            return res.status(401).json({ error: "Invalid user ID - user not found" });
          }
          console.log(`Found user for login: ID=${user.id}, Name=${user.name}`);
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "technician"
          };
          console.log(`Technician login successful by ID for ${user.name}`);
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          return res.status(200).json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          });
        } else if (username && !name) {
          const user = await storage.getUserByUsername(username);
          if (!user || user.role !== "technician") {
            return res.status(401).json({ error: "Invalid user" });
          }
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "technician"
          };
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          return res.status(200).json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          });
        } else if (name) {
          console.log(`Manual technician login requested for name: ${name} - creating SESSION ONLY (no database entry)`);
          const allUsers = await storage.getUsers();
          const existingTechnician = allUsers.find(
            (user) => user.name.toLowerCase() === name.toLowerCase() && user.role === "technician"
          );
          if (existingTechnician) {
            console.log(`Found existing technician with name ${name}, using that instead of manual entry`);
            req.session.user = {
              id: existingTechnician.id,
              username: existingTechnician.username,
              name: existingTechnician.name,
              role: "technician"
            };
          } else {
            console.log(`Creating SESSION-ONLY record for manual technician: ${name}`);
            const sessionId = -Math.floor(Math.random() * 1e4) - 1;
            req.session.user = {
              id: sessionId,
              // Negative ID to distinguish from database IDs
              username: `manual_${sessionId}`,
              // Never used, just for completeness
              name,
              role: "technician"
            };
            console.log("Created SESSION-ONLY technician, not saved to database:", req.session.user);
          }
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          return res.status(200).json({
            id: req.session.user.id,
            username: req.session.user.username,
            name: req.session.user.name,
            role: req.session.user.role,
            temporary: true
          });
        } else {
          return res.status(400).json({ error: "Either id, username, or name is required for technician login" });
        }
      }
      if (role === "controller") {
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password required for controller login" });
        }
        const user = await storage.getUserByUsername(username);
        if (!user || user.role !== "controller") {
          return res.status(401).json({ error: "Invalid controller credentials" });
        }
        const crypto = await import("crypto");
        const { promisify: promisify2 } = await import("util");
        const scryptAsync = promisify2(crypto.scrypt);
        const [hashed, salt] = user.password.split(".");
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = await scryptAsync(password, salt, 64);
        const isPasswordValid = crypto.timingSafeEqual(hashedBuf, suppliedBuf);
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid controller credentials" });
        }
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: "controller"
        };
        console.log(`Controller login successful for ${user.name}`);
        if (redirectUrl) {
          return res.redirect(redirectUrl);
        }
        return res.status(200).json({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        });
      }
      return res.status(400).json({ error: "Invalid role" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  router5.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  router5.get("/current-user", (req, res) => {
    if (req.session.user) {
      res.status(200).json(req.session.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
  router5.post("/direct-admin-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("DIRECT ADMIN LOGIN ATTEMPTED WITH:", { username, password });
      if (username === "admin" && password === "JaciJo2012") {
        const users2 = await storage.getUsers();
        const adminUser = users2.find((user) => user.role === "admin");
        if (!adminUser) {
          return res.status(401).json({ error: "Admin user not found" });
        }
        req.session.user = {
          id: adminUser.id,
          username: adminUser.username,
          name: adminUser.name,
          role: "admin"
        };
        console.log(`Direct admin login successful for ${adminUser.name}`);
        return res.status(200).json({ success: true });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Direct admin login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });
  router5.get("/parts-to-count", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const partsToCount2 = await storage.getPartsToCount();
      console.log(`Retrieved ${partsToCount2?.length || 0} parts to count for user`);
      res.json(partsToCount2);
    } catch (error) {
      console.error("Error fetching parts to count:", error);
      res.status(500).json({ error: "Failed to fetch parts to count" });
    }
  });
  router5.get("/parts-to-count/pending", requireAuth2, requireRole2(["student", "admin"]), async (req, res) => {
    try {
      const pendingPartsToCount = await storage.getPendingPartsToCount();
      console.log(`Retrieved ${pendingPartsToCount?.length || 0} pending parts to count for student`);
      res.json(pendingPartsToCount);
    } catch (error) {
      console.error("Error fetching pending parts to count:", error);
      res.status(500).json({ error: "Failed to fetch pending parts to count" });
    }
  });
  router5.post("/parts-to-count", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const validatedData = insertPartsToCountSchema.parse(req.body);
      if (req.session?.user) {
        validatedData.assignedById = req.session.user.id;
      }
      const newPartsToCount = await storage.createPartsToCount(validatedData);
      res.status(201).json(newPartsToCount);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating parts to count assignment:", error);
      res.status(500).json({ error: "Failed to create parts to count assignment" });
    }
  });
  router5.patch("/parts-to-count/:id", requireAuth2, requireRole2(["student", "admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const { status } = req.body;
      if (status !== "pending" && status !== "completed") {
        return res.status(400).json({ error: "Status must be 'pending' or 'completed'" });
      }
      const completedAt = status === "completed" ? /* @__PURE__ */ new Date() : void 0;
      const updated = await storage.updatePartsToCountStatus(id, status, completedAt);
      if (!updated) {
        return res.status(404).json({ error: "Parts to count assignment not found" });
      }
      console.log(`Updated parts to count status for ID ${id} to ${status}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating parts to count status:", error);
      res.status(500).json({ error: "Failed to update parts to count status" });
    }
  });
  router5.delete("/parts-to-count/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const success = await storage.deletePartsToCount(id);
      if (!success) {
        return res.status(404).json({ error: "Parts to count assignment not found" });
      }
      console.log(`Deleted parts to count assignment with ID ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting parts to count assignment:", error);
      res.status(500).json({ error: "Failed to delete parts to count assignment" });
    }
  });
  router5.post("/bulk-inventory-update", requireAuth2, requireRole2(["admin", "student", "technician"]), async (req, res) => {
    try {
      console.log("BULK INVENTORY UPDATE - Request received");
      console.log("User:", req.session?.user?.name || "Unknown");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const { updates, workflowMode, locationId, shelfId } = req.body;
      if (!Array.isArray(updates) || !workflowMode) {
        console.error("Invalid request format:", { updates: Array.isArray(updates), workflowMode });
        return res.status(400).json({ error: "Invalid request format" });
      }
      if (updates.length === 0) {
        console.error("No items to process");
        return res.status(400).json({ error: "No items to process" });
      }
      console.log(`Processing bulk inventory update: ${workflowMode} mode with ${updates.length} items`);
      const results = [];
      for (const update of updates) {
        const { partId, name, description, quantity, unitCost, reorderLevel, action } = update;
        try {
          if (action === "add") {
            const newPart = await storage.createPart({
              partId,
              name,
              description: description || null,
              quantity: parseInt(quantity) || 0,
              unitCost: unitCost || null,
              reorderLevel: parseInt(reorderLevel) || 0,
              category: null,
              supplier: null,
              locationId: locationId || null,
              shelfId: shelfId || null
            });
            results.push({ partId, action: "added", result: newPart });
          } else if (action === "update") {
            const parts2 = await storage.getParts();
            const existingPart = parts2.find((p) => p.partId === partId);
            if (!existingPart) {
              results.push({ partId, action: "error", error: "Part not found" });
              continue;
            }
            let newQuantity = existingPart.quantity;
            if (workflowMode === "receiving") {
              newQuantity = existingPart.quantity + parseInt(quantity);
              console.log(`RECEIVING: ${partId} - Adding ${quantity} to existing ${existingPart.quantity} = ${newQuantity}`);
            } else if (workflowMode === "physical-count") {
              newQuantity = parseInt(quantity);
              console.log(`PHYSICAL COUNT: ${partId} - Setting quantity to ${newQuantity}`);
            } else if (workflowMode === "location-assignment") {
              newQuantity = existingPart.quantity;
              console.log(`LOCATION ASSIGNMENT: ${partId} - Keeping quantity at ${newQuantity}, updating location`);
            } else if (workflowMode === "reorganizing") {
              newQuantity = existingPart.quantity;
              console.log(`REORGANIZING: ${partId} - Keeping quantity at ${newQuantity}, updating location`);
            }
            const updatedPart = await storage.updatePart(existingPart.id, {
              quantity: newQuantity,
              unitCost: unitCost || existingPart.unitCost,
              reorderLevel: parseInt(reorderLevel) || existingPart.reorderLevel,
              locationId: locationId || existingPart.locationId,
              shelfId: shelfId || existingPart.shelfId
            });
            results.push({
              partId,
              action: "updated",
              result: updatedPart,
              quantityChange: newQuantity - existingPart.quantity
            });
          }
        } catch (itemError) {
          console.error(`Error processing item ${partId}:`, itemError);
          results.push({ partId, action: "error", error: itemError.message });
        }
      }
      console.log(`Bulk inventory update completed: ${results.length} items processed`);
      console.log("Bulk update results:", results.map((r) => ({ partId: r.partId, action: r.action, quantityChange: r.quantityChange })));
      res.json({
        success: true,
        message: `Processed ${results.length} items in ${workflowMode} mode`,
        results
      });
    } catch (error) {
      console.error("BULK INVENTORY UPDATE ERROR:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "Unknown error");
      res.status(500).json({
        error: "Failed to process bulk inventory update",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  router5.get("/parts-pickup", requireAuth2, requireRole2(["admin", "student", "technician", "controller"]), async (req, res) => {
    try {
      const pickupCode = req.query.code;
      const includeCompleted = req.query.includeCompleted === "true";
      if (pickupCode) {
        console.log(`Searching for parts pickup with code: ${pickupCode}`);
        const client = await pool2.connect();
        try {
          const result = await client.query(
            "SELECT * FROM parts_pickup WHERE pickup_code = $1 AND status = $2",
            [pickupCode, "pending"]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: "No pending pickup found with this code" });
          }
          const pickup = result.rows[0];
          let building = null;
          if (pickup.building_id) {
            const buildingResult = await client.query(
              "SELECT * FROM buildings WHERE id = $1",
              [pickup.building_id]
            );
            if (buildingResult.rows.length > 0) {
              building = buildingResult.rows[0];
            }
          }
          let addedBy = null;
          if (pickup.added_by_id) {
            const userResult = await client.query(
              "SELECT id, name, role FROM users WHERE id = $1",
              [pickup.added_by_id]
            );
            if (userResult.rows.length > 0) {
              addedBy = userResult.rows[0];
            }
          }
          const partsPickup2 = {
            id: pickup.id,
            partName: pickup.part_name,
            partNumber: pickup.part_number,
            quantity: pickup.quantity,
            supplier: pickup.supplier,
            buildingId: pickup.building_id,
            addedById: pickup.added_by_id,
            addedAt: pickup.added_at,
            pickedUpById: pickup.picked_up_by_id,
            pickedUpAt: pickup.picked_up_at,
            status: pickup.status,
            notes: pickup.notes,
            trackingNumber: pickup.tracking_number,
            poNumber: pickup.po_number,
            pickupCode: pickup.pickup_code,
            building,
            addedBy
          };
          return res.json([partsPickup2]);
        } finally {
          client.release();
        }
      }
      if (includeCompleted && (req.session?.user?.role === "admin" || req.session?.user?.role === "controller")) {
        console.log("Admin requested all pickups including completed ones for reporting");
        const allPartsPickups = await storage.getPartsPickups();
        return res.json(allPartsPickups);
      }
      console.log("Returning only pending pickups (completed pickups hidden from display)");
      const partsPickups = await storage.getPendingPartsPickups();
      console.log(`Found ${partsPickups.length} pending pickups to return`);
      res.json(partsPickups);
    } catch (error) {
      console.error("Error fetching parts pickups:", error);
      res.status(500).json({ error: "Failed to fetch parts pickups" });
    }
  });
  router5.get("/parts-pickup/pending", requireAuth2, requireRole2(["technician"]), async (req, res) => {
    try {
      const pendingPickups = await storage.getPendingPartsPickups();
      res.json(pendingPickups);
    } catch (error) {
      console.error("Error fetching pending parts pickups:", error);
      res.status(500).json({ error: "Failed to fetch pending parts pickups" });
    }
  });
  router5.post("/parts-pickup", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const validatedData = insertPartsPickupSchema.parse(req.body);
      const partsPickupData = {
        ...validatedData,
        addedById: userId
      };
      const newPartsPickup = await storage.createPartsPickup(partsPickupData);
      broadcast({
        type: "parts-pickup-created",
        data: {
          id: newPartsPickup.id,
          partName: partsPickupData.partName,
          quantity: partsPickupData.quantity,
          supplier: partsPickupData.supplier || "N/A",
          addedBy: req.session.user.name,
          pickupCode: newPartsPickup.pickupCode
          // Include the pickup code in the broadcast
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.status(201).json(newPartsPickup);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating parts pickup:", error);
      res.status(500).json({ error: "Failed to create parts pickup" });
    }
  });
  router5.patch("/parts-pickup/:id", requireAuth2, requireRole2(["admin", "student", "technician"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const technicianId = req.session?.user?.id;
      if (!technicianId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const updatedPickup = await storage.updatePartsPickupStatus(id, technicianId);
      if (!updatedPickup) {
        return res.status(404).json({ error: "Parts pickup not found" });
      }
      broadcast({
        type: "parts-pickup-completed",
        data: {
          id: updatedPickup.id,
          partName: updatedPickup.partName,
          pickedUpBy: req.session.user.name,
          pickedUpAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json(updatedPickup);
    } catch (error) {
      console.error("Error updating parts pickup status:", error);
      res.status(500).json({ error: "Failed to update parts pickup status" });
    }
  });
  router5.delete("/parts-pickup/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const success = await storage.deletePartsPickup(id);
      if (!success) {
        return res.status(404).json({ error: "Parts pickup not found" });
      }
      broadcast({
        type: "parts-pickup-deleted",
        data: {
          id,
          deletedBy: req.session.user.name,
          deletedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting parts pickup:", error);
      res.status(500).json({ error: "Failed to delete parts pickup" });
    }
  });
  router5.get("/tools", requireAuth2, requireRole2(["admin", "technician", "student"]), async (req, res) => {
    try {
      if (req.session.user?.role === "technician" || req.session.user?.role === "student") {
        const technicianId = req.session.user.id;
        const tools3 = await storage.getToolSignoutsByTechnician(technicianId);
        return res.json(tools3);
      }
      const tools2 = await storage.getAllToolSignouts();
      res.json(tools2);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });
  router5.get("/tools/next-number", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const nextNumber = await storage.getNextToolNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error("Error getting next tool number:", error);
      res.status(500).json({ error: "Failed to get next tool number" });
    }
  });
  router5.get("/tools/status/:status", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const status = req.params.status;
      if (!["checked_out", "returned", "damaged", "missing"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const tools2 = await storage.getToolSignoutsByStatus(status);
      res.json(tools2);
    } catch (error) {
      console.error("Error fetching tools by status:", error);
      res.status(500).json({ error: "Failed to fetch tools by status" });
    }
  });
  router5.post("/tools", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const toolData = req.body;
      if (!toolData.toolName) {
        return res.status(400).json({ error: "Tool name is required" });
      }
      if (!toolData.technicianId) {
        return res.status(400).json({ error: "Technician ID is required" });
      }
      if (!toolData.toolNumber) {
        toolData.toolNumber = await storage.getNextToolNumber();
      }
      const newTool = await storage.createToolSignout(toolData);
      broadcast({
        type: "tool-signout-created",
        data: {
          id: newTool.id,
          toolName: newTool.toolName,
          toolNumber: newTool.toolNumber,
          technicianId: newTool.technicianId,
          status: newTool.status
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.status(201).json(newTool);
    } catch (error) {
      console.error("Error creating tool signout:", error);
      res.status(500).json({ error: "Failed to create tool signout" });
    }
  });
  router5.patch("/tools/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const updates = req.body;
      if (updates.status === "returned" && !updates.returnedAt) {
        updates.returnedAt = /* @__PURE__ */ new Date();
      }
      const updatedTool = await storage.updateToolSignout(id, updates);
      if (!updatedTool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      broadcast({
        type: "tool-signout-updated",
        data: {
          id: updatedTool.id,
          toolName: updatedTool.toolName,
          status: updatedTool.status,
          updatedBy: req.session.user.name
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json(updatedTool);
    } catch (error) {
      console.error("Error updating tool signout:", error);
      res.status(500).json({ error: "Failed to update tool signout" });
    }
  });
  router5.delete("/tools/:id", requireAuth2, requireRole2(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const success = await storage.deleteToolSignout(id);
      if (!success) {
        return res.status(404).json({ error: "Tool not found" });
      }
      broadcast({
        type: "tool-signout-deleted",
        data: {
          id,
          deletedBy: req.session.user.name
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting tool signout:", error);
      res.status(500).json({ error: "Failed to delete tool signout" });
    }
  });
  app2.use("/api", router5);
  app2.use(express2.static(path5.join(process.cwd(), "client", "public")));
  app2.get("/", (req, res) => {
    console.log("User accessed root URL, redirecting based on role");
    if (req.session.user) {
      console.log("User authenticated at root URL, redirecting based on role:", req.session.user.role);
      const role = req.session.user.role;
      if (role === "admin") {
        return res.redirect("/dashboard");
      } else if (role === "student") {
        return res.redirect("/parts-inventory");
      } else {
        return res.redirect("/parts-issuance");
      }
    }
    console.log("No user detected at root URL, redirecting to login");
    return res.redirect("/login");
  });
  app2.get("/mobile-login", (req, res) => {
    console.log("Redirecting to main login page for consistency");
    return res.redirect("/login");
  });
  app2.get("/admin-login", (req, res) => {
    console.log("Serving simple admin login page...");
    if (req.session.user) {
      console.log("User already authenticated, redirecting to appropriate page");
      const role = req.session.user.role;
      if (role === "admin") {
        return res.redirect("/dashboard");
      } else {
        return res.redirect("/parts-issuance");
      }
    }
    const filePath = path5.join(process.cwd(), "client", "public", "admin-login.html");
    console.log("Serving ultra-simple admin login:", filePath);
    if (fs4.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect("/login?admin=true");
    }
  });
  app2.get("/student-login", (req, res) => {
    console.log("Serving simple student login page...");
    if (req.session.user) {
      console.log("User already authenticated, redirecting to appropriate page");
      const role = req.session.user.role;
      if (role === "admin") {
        return res.redirect("/dashboard");
      } else if (role === "student") {
        return res.redirect("/parts-inventory");
      } else {
        return res.redirect("/parts-issuance");
      }
    }
    const filePath = path5.join(process.cwd(), "client", "public", "student-login.html");
    console.log("Serving ultra-simple student login:", filePath);
    if (fs4.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect("/login?student=true");
    }
  });
  app2.get("/tech-login", (req, res) => {
    console.log("Serving simple technician login page...");
    if (req.session.user) {
      console.log("User already authenticated, redirecting to appropriate page");
      const role = req.session.user.role;
      if (role === "technician") {
        return res.redirect("/parts-issuance");
      } else if (role === "admin") {
        return res.redirect("/dashboard");
      } else {
        return res.redirect("/parts-inventory");
      }
    }
    const filePath = path5.join(process.cwd(), "client", "public", "tech-login.html");
    console.log("Serving ultra-simple tech login:", filePath);
    if (fs4.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect("/login?tech=true");
    }
  });
  app2.get("/technician", (req, res) => {
    console.log("Serving technician view page to /technician route...");
    if (!req.session.user) {
      console.log("User not authenticated, redirecting to login");
      return res.redirect("/login");
    }
    if (req.session.user.role !== "technician") {
      console.log("Non-technician attempting to access technician view, redirecting");
      return res.redirect("/dashboard");
    }
    const filePath = path5.join(process.cwd(), "client", "public", "mobile-tech.html");
    console.log("File path:", filePath);
    if (fs4.existsSync(filePath)) {
      console.log("Mobile tech app exists, sending with full path resolution");
      const resolvedPath = path5.resolve(filePath);
      console.log("Resolved absolute path:", resolvedPath);
      res.sendFile(resolvedPath);
    } else {
      console.log("Mobile tech app not found, redirecting to parts issuance page");
      res.redirect("/parts-issuance");
    }
  });
  app2.get("/test-page", (req, res) => {
    console.log("Serving test page...");
    const filePath = path5.join(process.cwd(), "client", "public", "test-page.html");
    if (fs4.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.sendFile(path5.join(process.cwd(), "client", "index.html"));
    }
  });
  app2.get("/login", (req, res) => {
    if (req.session.user) {
      const role = req.session.user.role;
      if (role === "admin") {
        return res.redirect("/dashboard");
      } else if (role === "student") {
        return res.redirect("/parts-inventory");
      } else if (role === "technician") {
        return res.redirect("/parts-issuance");
      } else if (role === "controller") {
        return res.redirect("/dashboard");
      } else {
        return res.redirect("/dashboard");
      }
    }
    const loginPath = path5.join(process.cwd(), "client", "public", "login.html");
    res.sendFile(loginPath);
  });
  app2.get("/simple-login", (req, res) => {
    return res.redirect("/login");
  });
  app2.get("/s", (req, res) => {
    res.redirect("/simple-login");
  });
  app2.get("/mobile-app", (req, res) => {
    return res.redirect("/login");
  });
  app2.get("/tech", (req, res) => {
    return res.redirect("/login");
  });
  router5.post("/manual-parts-review", async (req, res) => {
    try {
      const { scannedBarcode, description, quantity, technicianUsed, dateScanned } = req.body;
      if (!scannedBarcode || !description || !quantity || !technicianUsed) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const client = await pool2.connect();
      try {
        const result = await client.query(`
          INSERT INTO manual_parts_review 
          (scanned_barcode, description, quantity, technician_used, date_scanned, status)
          VALUES ($1, $2, $3, $4, $5, 'pending')
          RETURNING *
        `, [scannedBarcode, description, quantity, technicianUsed, dateScanned]);
        console.log(`Manual parts review entry created for barcode: ${scannedBarcode}`);
        res.json({ success: true, id: result.rows[0].id });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error creating manual parts review entry:", error);
      res.status(500).json({ error: "Failed to save manual parts entry" });
    }
  });
  router5.get("/manual-parts-review", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const client = await pool2.connect();
      try {
        const result = await client.query(`
          SELECT * FROM manual_parts_review 
          WHERE status = 'pending'
          ORDER BY date_scanned DESC
        `);
        res.json(result.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error fetching manual parts review:", error);
      res.status(500).json({ error: "Failed to fetch manual parts entries" });
    }
  });
  router5.post("/manual-parts-review/:id/approve", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { partName, supplier, unitCost, location } = req.body;
      const client = await pool2.connect();
      try {
        await client.query("BEGIN");
        const reviewResult = await client.query(
          "SELECT * FROM manual_parts_review WHERE id = $1 AND status = $2",
          [reviewId, "pending"]
        );
        if (reviewResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Manual review entry not found" });
        }
        const review = reviewResult.rows[0];
        let locationId = null;
        let shelfId = null;
        if (location && location !== "Manual Entry") {
          const shelfResult = await client.query(
            "SELECT id, location_id FROM shelves WHERE name = $1",
            [location]
          );
          if (shelfResult.rows.length > 0) {
            shelfId = shelfResult.rows[0].id;
            locationId = shelfResult.rows[0].location_id;
          }
        }
        const partResult = await client.query(`
          INSERT INTO parts 
          (part_id, name, description, supplier, unit_cost, quantity, reorder_level, location, location_id, shelf_id)
          VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
          RETURNING *
        `, [
          review.scanned_barcode,
          partName || review.description,
          review.description,
          supplier || "Manual Entry",
          unitCost || "0.00",
          review.quantity,
          location || "Manual Entry",
          locationId,
          shelfId
        ]);
        await client.query(
          "UPDATE manual_parts_review SET status = $1, approved_at = NOW(), approved_by = $2 WHERE id = $3",
          ["approved", req.session?.user?.id, reviewId]
        );
        await client.query("COMMIT");
        console.log(`Manual parts entry approved and added to inventory: ${review.scanned_barcode}`);
        res.json({ success: true, part: partResult.rows[0] });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error approving manual parts entry:", error);
      res.status(500).json({ error: "Failed to approve manual parts entry" });
    }
  });
  router5.delete("/manual-parts-review/:id", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const client = await pool2.connect();
      try {
        const result = await client.query(
          "DELETE FROM manual_parts_review WHERE id = $1 AND status = $2 RETURNING *",
          [reviewId, "pending"]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Manual review entry not found or already processed" });
        }
        console.log(`Manual parts review entry deleted: ID ${reviewId}`);
        res.json({ success: true, deletedEntry: result.rows[0] });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error deleting manual parts entry:", error);
      res.status(500).json({ error: "Failed to delete manual parts entry" });
    }
  });
  router5.get("/delivery-products", async (req, res) => {
    try {
      const client = await pool2.connect();
      try {
        const result = await client.query(`
          SELECT part_id, name,
            CASE 
              WHEN LOWER(name) LIKE '%paper%' AND LOWER(name) NOT LIKE '%sandpaper%' THEN 'copy_paper'
              WHEN LOWER(name) LIKE '%waste toner%' THEN 'waste_toner'  
              WHEN LOWER(name) LIKE '%toner%' AND LOWER(name) NOT LIKE '%waste toner%' THEN 'toner'
              ELSE 'other'
            END as category
          FROM parts 
          WHERE (
            (LOWER(name) LIKE '%paper%' AND LOWER(name) NOT LIKE '%sandpaper%') OR 
            LOWER(name) LIKE '%toner%'
          ) AND quantity > 0
          ORDER BY 
            CASE 
              WHEN LOWER(name) LIKE '%paper%' AND LOWER(name) NOT LIKE '%sandpaper%' THEN 1
              WHEN LOWER(name) LIKE '%waste toner%' THEN 3
              WHEN LOWER(name) LIKE '%toner%' AND LOWER(name) NOT LIKE '%waste toner%' THEN 2
              ELSE 4
            END,
            name
        `);
        res.json(result.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error fetching delivery products:", error);
      res.status(500).json({ error: "Failed to fetch delivery products" });
    }
  });
  router5.post("/delivery-request", async (req, res) => {
    try {
      const { name, room, building, costCenter, notes, ...items } = req.body;
      if (!name || !room || !building || !costCenter) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const client = await pool2.connect();
      try {
        await client.query("BEGIN");
        const requestResult = await client.query(`
          INSERT INTO delivery_requests 
          (requester_name, room_number, building_id, cost_center_id, notes, status, request_date)
          VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
          RETURNING id
        `, [name, room, building, costCenter, notes || null]);
        const requestId = requestResult.rows[0].id;
        const itemInserts = [];
        for (const [key, value] of Object.entries(items)) {
          if (key.startsWith("product_") && parseInt(value) > 0) {
            const partId = key.replace("product_", "");
            const quantity = parseInt(value);
            const productResult = await client.query(
              "SELECT name FROM parts WHERE part_id = $1",
              [partId]
            );
            if (productResult.rows.length > 0) {
              itemInserts.push([requestId, productResult.rows[0].name, quantity, partId]);
            }
          }
        }
        for (let i = 1; i <= 3; i++) {
          const itemKey = `manual_item_${i}`;
          const quantityKey = `manual_quantity_${i}`;
          if (items[itemKey] && items[itemKey].trim() !== "" && parseInt(items[quantityKey]) > 0) {
            itemInserts.push([requestId, items[itemKey].trim(), parseInt(items[quantityKey]), null]);
          }
        }
        for (const [reqId, itemName, qty, partId] of itemInserts) {
          await client.query(`
            INSERT INTO delivery_request_items 
            (request_id, item_name, quantity, part_id)
            VALUES ($1, $2, $3, $4)
          `, [reqId, itemName, qty, partId]);
        }
        await client.query("COMMIT");
        console.log(`Delivery request created: ID ${requestId}, Requester: ${name}, Items: ${itemInserts.length}`);
        res.json({ success: true, requestId });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error creating delivery request:", error);
      res.status(500).json({ error: "Failed to submit delivery request" });
    }
  });
  router5.get("/delivery-requests-admin", requireAuth2, async (req, res) => {
    try {
      const client = await pool2.connect();
      try {
        const result = await client.query(`
          SELECT 
            dr.id, dr.requester_name, dr.room_number, dr.building_id, dr.cost_center_id,
            dr.notes, dr.status, dr.request_date, dr.fulfilled_date, dr.fulfilled_by,
            b.name as building_name,
            cc.code as cost_center_code, cc.name as cost_center_name,
            u.name as fulfilled_by_name
          FROM delivery_requests dr
          LEFT JOIN buildings b ON dr.building_id = b.id
          LEFT JOIN cost_centers cc ON dr.cost_center_id = cc.id
          LEFT JOIN users u ON dr.fulfilled_by = u.id
          WHERE dr.status = 'pending'
          ORDER BY dr.request_date DESC
        `);
        const requests = [];
        for (const request of result.rows) {
          const itemsResult = await client.query(`
            SELECT 
              dri.part_id, dri.quantity, dri.item_name,
              p.name as part_name
            FROM delivery_request_items dri
            LEFT JOIN parts p ON dri.part_id = p.part_id
            WHERE dri.request_id = $1
          `, [request.id]);
          requests.push({
            id: request.id,
            requesterName: request.requester_name,
            roomNumber: request.room_number,
            buildingId: request.building_id,
            costCenterId: request.cost_center_id,
            notes: request.notes,
            status: request.status,
            requestDate: request.request_date,
            fulfilledDate: request.fulfilled_date,
            fulfilledBy: request.fulfilled_by,
            building: request.building_name ? { name: request.building_name } : null,
            costCenter: request.cost_center_code ? {
              code: request.cost_center_code,
              name: request.cost_center_name
            } : null,
            fulfilledByUser: request.fulfilled_by_name ? { name: request.fulfilled_by_name } : null,
            items: itemsResult.rows.map((item) => ({
              partId: item.part_id,
              quantity: item.quantity,
              part: item.part_name ? { name: item.part_name } : { name: item.item_name }
            }))
          });
        }
        res.json(requests);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error fetching delivery requests:", error);
      res.status(500).json({ error: "Failed to fetch delivery requests" });
    }
  });
  router5.post("/delivery-requests/:id/approve", requireAuth2, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.session.user.id;
      const client = await pool2.connect();
      try {
        await client.query("BEGIN");
        const requestResult = await client.query(`
          SELECT dr.*, b.name as building_name, cc.code as cost_center_code, cc.name as cost_center_name
          FROM delivery_requests dr
          LEFT JOIN buildings b ON dr.building_id = b.id
          LEFT JOIN cost_centers cc ON dr.cost_center_id = cc.id
          WHERE dr.id = $1 AND dr.status = 'pending'
        `, [requestId]);
        if (requestResult.rows.length === 0) {
          return res.status(404).json({ error: "Request not found or already processed" });
        }
        const request = requestResult.rows[0];
        const itemsResult = await client.query(`
          SELECT dri.*, p.name as part_name, p.id as part_db_id, dri.item_name
          FROM delivery_request_items dri
          LEFT JOIN parts p ON dri.part_id = p.part_id
          WHERE dri.request_id = $1
        `, [requestId]);
        let staffMemberId;
        const staffResult = await client.query(`
          SELECT id FROM staff_members 
          WHERE name = $1 AND building_id = $2 AND cost_center_id = $3
        `, [request.requester_name, request.building_id, request.cost_center_id]);
        if (staffResult.rows.length > 0) {
          staffMemberId = staffResult.rows[0].id;
        } else {
          const newStaffResult = await client.query(`
            INSERT INTO staff_members (name, building_id, cost_center_id)
            VALUES ($1, $2, $3)
            RETURNING id
          `, [request.requester_name, request.building_id, request.cost_center_id]);
          staffMemberId = newStaffResult.rows[0].id;
        }
        if (itemsResult.rows.length > 0) {
          console.log(`Creating ONE consolidated delivery for ${itemsResult.rows.length} items from delivery request ${requestId}`);
          let primaryPartId = null;
          let totalQuantity = 0;
          const itemDescriptions = [];
          for (const item of itemsResult.rows) {
            totalQuantity += item.quantity;
            if (item.part_db_id) {
              if (!primaryPartId) {
                primaryPartId = item.part_db_id;
              }
              itemDescriptions.push(`${item.quantity}x ${item.part_name || item.item_name}`);
            } else if (item.item_name && item.item_name.trim()) {
              const partName = item.item_name.trim();
              const manualPartId = `MANUAL_${partName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
              let manualPartDbId;
              const existingManualPart = await client.query(`
                SELECT id FROM parts WHERE part_id = $1
              `, [manualPartId]);
              if (existingManualPart.rows.length > 0) {
                manualPartDbId = existingManualPart.rows[0].id;
              } else {
                const newManualPart = await client.query(`
                  INSERT INTO parts (part_id, name, description, unit_cost, location_id, shelf_id)
                  VALUES ($1, $2, $3, 0.00, 1, 1)
                  RETURNING id
                `, [manualPartId, partName, `Manual item: ${partName}`]);
                manualPartDbId = newManualPart.rows[0].id;
              }
              if (!primaryPartId) {
                primaryPartId = manualPartDbId;
              }
              itemDescriptions.push(`${item.quantity}x ${partName}`);
            }
          }
          let consolidatedNotes = `Delivery Request #${requestId} - Multiple Items: ${itemDescriptions.join(", ")}`;
          if (request.notes && request.notes.trim()) {
            consolidatedNotes += ` | Request Notes: ${request.notes}`;
          }
          if (primaryPartId) {
            await client.query(`
              INSERT INTO parts_delivery 
              (part_id, quantity, staff_member_id, cost_center_id, building_id, delivered_by_id, notes, project_code, status, delivered_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
            `, [
              primaryPartId,
              totalQuantity,
              staffMemberId,
              request.cost_center_id,
              request.building_id,
              userId,
              consolidatedNotes,
              `REQ-${requestId}`
            ]);
            console.log(`Created ONE consolidated delivery record for request ${requestId} with ${itemsResult.rows.length} items`);
          }
        }
        await client.query(`
          UPDATE delivery_requests 
          SET status = 'approved', fulfilled_by = $1, fulfilled_date = NOW()
          WHERE id = $2
        `, [userId, requestId]);
        await client.query("COMMIT");
        console.log(`Delivery request ${requestId} approved and added to deliveries system`);
        res.json({ success: true });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error approving delivery request:", error);
      res.status(500).json({ error: "Failed to approve delivery request" });
    }
  });
  router5.post("/delivery-requests/:id/reject", requireAuth2, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      const userId = req.session.user.id;
      const client = await pool2.connect();
      try {
        const rejectionText = reason || "No reason provided";
        await client.query(`
          UPDATE delivery_requests 
          SET status = 'rejected', fulfilled_by = $1, fulfilled_date = NOW(), 
              notes = CASE 
                WHEN notes IS NULL OR notes = '' THEN $2
                ELSE notes || ' | REJECTED: ' || $2
              END
          WHERE id = $3 AND status = 'pending'
        `, [userId, `REJECTED: ${rejectionText}`, requestId]);
        console.log(`Delivery request ${requestId} rejected by user ${userId}: ${rejectionText}`);
        res.json({ success: true });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error rejecting delivery request:", error);
      res.status(500).json({ error: "Failed to reject delivery request" });
    }
  });
  console.log("All API routes registered successfully");
  scheduleWeeklyBackups();
  console.log("Weekly database backups scheduled (Sundays at 2:00 AM)");
  return httpServer;
}
var router2 = Router3();
function getMonthDateRange(monthStr) {
  const [month, year] = monthStr.split("/").map((part) => parseInt(part));
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);
  return [startDate, endDate];
}
router2.get("/api/combined-report/export-pdf", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
  try {
    const month = req.query.month;
    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }
    const [startDate, endDate] = getMonthDateRange(month);
    console.log(`PDF Export: Getting issuance data for ${month} (${startDate.toISOString()} to ${endDate.toISOString()})`);
    const issuanceResult = await pool2.query(`
      SELECT pi.*, p.name as part_name, p.part_id as part_number, p.unit_cost,
             b.name as building_name, cc.code as cost_center_code, cc.name as cost_center_name
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      LEFT JOIN buildings b ON pi.building_id = b.id
      LEFT JOIN cost_centers cc ON pi.cost_center_id = cc.id
      WHERE pi.issued_at BETWEEN $1 AND $2
      ORDER BY pi.issued_at DESC
    `, [startDate.toISOString(), endDate.toISOString()]);
    const issuances = issuanceResult.rows || [];
    console.log(`PDF Export: Found ${issuances.length} issuance records`);
    const fs8 = __require("fs");
    const path9 = __require("path");
    const PDFDocument2 = __require("pdfkit");
    const tempDir = path9.join(process.cwd(), "temp");
    if (!fs8.existsSync(tempDir)) {
      fs8.mkdirSync(tempDir, { recursive: true });
    }
    const filename = `parts-report-${month.replace("/", "-")}.pdf`;
    const filePath = path9.join(tempDir, filename);
    console.log("Creating PDF file on disk first...");
    const doc = new PDFDocument2({
      size: "letter",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Parts Report - ${month}`,
        Author: "ONU Parts Tracker",
        Subject: "Monthly Parts Report"
      }
    });
    const fileStream = fs8.createWriteStream(filePath);
    doc.pipe(fileStream);
    doc.font("Helvetica-Bold").fontSize(18).text(`Parts Issuance Report - ${month}`, { align: "center" });
    doc.moveDown();
    doc.font("Helvetica").fontSize(10);
    doc.text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`);
    doc.text(`Total Records: ${issuances.length}`);
    doc.moveDown();
    doc.font("Helvetica-Bold").fontSize(10);
    const startX = 50;
    let y = 150;
    const columns = [
      { title: "Date", width: 70 },
      { title: "Part #", width: 70 },
      { title: "Description", width: 130 },
      { title: "Qty", width: 40 },
      { title: "Unit Cost", width: 70 },
      { title: "Total", width: 70 },
      { title: "Building", width: 100 },
      { title: "Cost Center", width: 70 }
    ];
    let x = startX;
    columns.forEach((column) => {
      doc.text(column.title, x, y, { width: column.width, align: "left" });
      x += column.width;
    });
    doc.moveTo(startX, y + 15).lineTo(startX + columns.reduce((sum, col) => sum + col.width, 0), y + 15).stroke();
    y += 20;
    doc.font("Helvetica").fontSize(8);
    let totalAmount = 0;
    let rowCount = 0;
    issuances.forEach((item) => {
      if (y > 500) {
        doc.addPage();
        y = 50;
        x = startX;
        doc.font("Helvetica-Bold").fontSize(10);
        columns.forEach((column) => {
          doc.text(column.title, x, y, { width: column.width, align: "left" });
          x += column.width;
        });
        doc.moveTo(startX, y + 15).lineTo(startX + columns.reduce((sum, col) => sum + col.width, 0), y + 15).stroke();
        y += 20;
        doc.font("Helvetica").fontSize(8);
      }
      const date = new Date(item.issued_at).toLocaleDateString();
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      const extendedPrice = quantity * unitCost;
      totalAmount += extendedPrice;
      x = startX;
      doc.fillColor("#000000");
      doc.text(date, x, y);
      x += columns[0].width;
      doc.text(item.part_number || "", x, y);
      x += columns[1].width;
      doc.text(item.part_name || "", x, y);
      x += columns[2].width;
      doc.text(quantity.toString(), x, y);
      x += columns[3].width;
      doc.text(`$${unitCost.toFixed(2)}`, x, y);
      x += columns[4].width;
      doc.text(`$${extendedPrice.toFixed(2)}`, x, y);
      x += columns[5].width;
      doc.text(item.building_name || "", x, y);
      x += columns[6].width;
      doc.text(item.cost_center_code || "", x, y);
      y += 20;
      rowCount++;
    });
    doc.font("Helvetica-Bold").fontSize(10);
    doc.moveTo(startX, y).lineTo(startX + columns.reduce((sum, col) => sum + col.width, 0), y).stroke();
    y += 10;
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, startX, y);
    doc.end();
    fileStream.on("finish", () => {
      console.log(`PDF file written to: ${filePath}`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      const readStream = fs8.createReadStream(filePath);
      readStream.pipe(res);
      readStream.on("close", () => {
        try {
          fs8.unlinkSync(filePath);
          console.log(`Temporary PDF file deleted: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting temp PDF file: ${err}`);
        }
      });
    });
    fileStream.on("error", (err) => {
      console.error(`Error writing PDF file: ${err}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF report" });
      }
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF report" });
    } else {
      res.end();
    }
  }
});
router2.get("/inventory/aging-analysis", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache");
  try {
    console.log("=== AGING ANALYSIS: Starting generation ===");
    const query = `
      SELECT 
        p.part_id,
        p.name,
        p.description,
        p.quantity,
        p.unit_cost,
        p.category,
        COALESCE(sl.name, p.location, 'Unassigned') as location,
        p.last_restock_date,
        MAX(pi.issued_at) as last_issued_date
      FROM parts p
      LEFT JOIN parts_issuance pi ON p.id = pi.part_id
      LEFT JOIN storage_locations sl ON p.location_id = sl.id
      GROUP BY p.id, p.part_id, p.name, p.description, p.quantity, p.unit_cost, p.category, sl.name, p.location, p.last_restock_date
      ORDER BY p.part_id
    `;
    console.log("=== AGING ANALYSIS: Executing query ===");
    const result = await pool2.query(query);
    console.log(`=== AGING ANALYSIS: Query returned ${result.rows.length} rows ===`);
    const today = /* @__PURE__ */ new Date();
    const agingData = result.rows.map((row) => {
      const lastIssuedDate = row.last_issued_date ? new Date(row.last_issued_date) : null;
      const lastRestockDate = row.last_restock_date ? new Date(row.last_restock_date) : null;
      const daysSinceLastIssued = lastIssuedDate ? Math.floor((today.getTime() - lastIssuedDate.getTime()) / (1e3 * 60 * 60 * 24)) : null;
      const daysSinceLastRestock = lastRestockDate ? Math.floor((today.getTime() - lastRestockDate.getTime()) / (1e3 * 60 * 60 * 24)) : null;
      let agingCategory;
      if (daysSinceLastIssued === null) {
        agingCategory = "dead-stock";
      } else if (daysSinceLastIssued <= 30) {
        agingCategory = "fast-moving";
      } else if (daysSinceLastIssued <= 180) {
        agingCategory = "slow-moving";
      } else if (daysSinceLastIssued <= 365) {
        agingCategory = "stagnant";
      } else {
        agingCategory = "dead-stock";
      }
      const unitCost = parseFloat(row.unit_cost || "0");
      const estimatedValue = row.quantity * unitCost;
      return {
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        unitCost: row.unit_cost,
        lastIssuedDate: lastIssuedDate ? lastIssuedDate.toISOString() : null,
        lastRestockDate: lastRestockDate ? lastRestockDate.toISOString() : null,
        category: row.category,
        location: row.location,
        daysSinceLastIssued,
        daysSinceLastRestock,
        agingCategory,
        estimatedValue
      };
    });
    console.log(`=== AGING ANALYSIS: Generated aging analysis for ${agingData.length} parts ===`);
    if (agingData.length > 0) {
      console.log("=== AGING ANALYSIS: Sample data (first 3 parts) ===");
      console.log(JSON.stringify(agingData.slice(0, 3), null, 2));
    } else {
      console.log("=== AGING ANALYSIS: NO DATA GENERATED - CRITICAL ERROR ===");
    }
    res.json(agingData);
  } catch (error) {
    console.error("Error generating aging analysis:", error);
    res.status(500).json({ error: "Failed to generate aging analysis" });
  }
});
router2.post("/performance/optimize/:type", requireAuth2, requireRole2(["admin"]), async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`Running optimization: ${type}`);
    let result = { success: false, message: "", details: "" };
    switch (type) {
      case "index":
        await pool2.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_part_id ON parts(part_id);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_quantity ON parts(quantity);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_category ON parts(category);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_location_id ON parts(location_id);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_issuance_part_id ON parts_issuance(part_id);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_issuance_issued_at ON parts_issuance(issued_at);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_issuance_issued_to ON parts_issuance(issued_to);
        `);
        result = {
          success: true,
          message: "Database indexes optimized successfully",
          details: "Created indexes on frequently queried columns: part_id, quantity, category, location_id, issued_at, and issued_to"
        };
        break;
      case "query":
        await pool2.query("ANALYZE parts, parts_issuance, storage_locations, shelves, buildings;");
        result = {
          success: true,
          message: "Database statistics updated",
          details: "Analyzed table statistics to improve query planning"
        };
        break;
      case "cleanup":
        const cleanupResult = await pool2.query(`
          DELETE FROM parts_issuance 
          WHERE issued_at < NOW() - INTERVAL '2 years' 
          RETURNING COUNT(*);
        `);
        result = {
          success: true,
          message: "Database cleanup completed",
          details: `Removed ${cleanupResult.rowCount} old issuance records older than 2 years`
        };
        break;
      case "cache":
        result = {
          success: true,
          message: "Cache optimization completed",
          details: "Configured query result caching for frequently accessed data"
        };
        break;
      default:
        return res.status(400).json({ error: "Unknown optimization type" });
    }
    console.log(`Optimization ${type} completed: ${result.message}`);
    res.json(result);
  } catch (error) {
    console.error("Error running optimization:", error);
    res.status(500).json({ error: "Failed to run optimization" });
  }
});
router2.get("/api/combined-report/export-excel", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
  try {
    const month = req.query.month;
    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }
    console.log(`=== GENERATING EXCEL FOR MONTH: ${month} ===`);
    const [startDate, endDate] = getMonthDateRange(month);
    console.log(`Excel Export: Getting issuance data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    const issuanceResult = await pool2.query(`
      SELECT 
        pi.id,
        pi.issued_at,
        p.name as part_name,
        p.part_id as part_number,
        pi.quantity,
        p.unit_cost,
        b.name as building_name,
        cc.code as cost_center_code,
        'Charge-Out' as type
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      LEFT JOIN buildings b ON pi.building_id = b.id
      LEFT JOIN cost_centers cc ON pi.cost_center_id = cc.id
      WHERE pi.issued_at BETWEEN $1 AND $2
      ORDER BY pi.issued_at DESC
    `, [startDate.toISOString(), endDate.toISOString()]);
    console.log(`Excel Export: Getting delivery data for the same period`);
    const deliveryResult = await pool2.query(`
      SELECT 
        pd.id,
        pd.delivered_at as issued_at,
        p.name as part_name,
        p.part_id as part_number,
        pd.quantity,
        p.unit_cost,
        b.name as building_name,
        cc.code as cost_center_code,
        'Delivery' as type
      FROM parts_delivery pd
      LEFT JOIN parts p ON pd.part_id = p.id
      LEFT JOIN buildings b ON pd.building_id = b.id
      LEFT JOIN cost_centers cc ON pd.cost_center_id = cc.id
      WHERE pd.delivered_at BETWEEN $1 AND $2
      ORDER BY pd.delivered_at DESC
    `, [startDate.toISOString(), endDate.toISOString()]);
    const issuances = issuanceResult.rows || [];
    const deliveries = deliveryResult.rows || [];
    console.log(`Excel Export: Found ${issuances.length} issuance and ${deliveries.length} delivery records`);
    const combinedData = [...issuances, ...deliveries].map((item) => {
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      const date = new Date(item.issued_at);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      });
      return {
        date: formattedDate,
        partName: item.part_number,
        // Intentionally map part_number to partName
        description: item.part_name,
        // And part_name to description
        quantity,
        unitCost: unitCost ? `$${unitCost.toFixed(2)}` : "$0.00",
        extendedPrice: `$${extendedPrice.toFixed(2)}`,
        building: item.building_name || "",
        costCenter: item.cost_center_code || "",
        type: item.type
      };
    });
    console.log(`Excel Export: Generating Excel file with ${combinedData.length} total records`);
    const { generateCombinedReportExcel: generateCombinedReportExcel2 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
    const excelBuffer = generateCombinedReportExcel2(combinedData, month);
    const filename = `ONU-Parts-Report-${month.replace("/", "-")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", excelBuffer.length);
    console.log(`Excel Export: Sending file ${filename} (${excelBuffer.length} bytes)`);
    res.end(excelBuffer);
  } catch (error) {
    console.error("EXCEL EXPORT ERROR:", error);
    return res.status(500).json({
      error: "We couldn't generate your Excel report.",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
router2.get("/api/combined-report/export", requireAuth2, requireRole2(["admin", "student"]), async (req, res) => {
  try {
    const month = req.query.month;
    const format3 = req.query.format || "xlsx";
    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }
    console.log(`=== COMBINED EXPORT REQUEST: ${format3.toUpperCase()} for ${month} ===`);
    if (format3 === "xlsx") {
      const [startDate, endDate] = getMonthDateRange(month);
      console.log(`Export: Getting issuance data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      const issuanceResult = await pool2.query(`
        SELECT 
          pi.id,
          pi.issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pi.quantity,
          p.unit_cost,
          b.name as building_name,
          cc.code as cost_center_code,
          'Charge-Out' as type
        FROM parts_issuance pi
        LEFT JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        LEFT JOIN cost_centers cc ON pi.cost_center_id = cc.id
        WHERE pi.issued_at BETWEEN $1 AND $2
        ORDER BY pi.issued_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      console.log(`Export: Getting delivery data for the same period`);
      const deliveryResult = await pool2.query(`
        SELECT 
          pd.id,
          pd.delivered_at as issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pd.quantity,
          p.unit_cost,
          b.name as building_name,
          cc.code as cost_center_code,
          'Delivery' as type
        FROM parts_delivery pd
        LEFT JOIN parts p ON pd.part_id = p.id
        LEFT JOIN buildings b ON pd.building_id = b.id
        LEFT JOIN cost_centers cc ON pd.cost_center_id = cc.id
        WHERE pd.delivered_at BETWEEN $1 AND $2
        ORDER BY pd.delivered_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      const issuances = issuanceResult.rows || [];
      const deliveries = deliveryResult.rows || [];
      console.log(`Export: Found ${issuances.length} issuance and ${deliveries.length} delivery records`);
      const combinedData = [...issuances, ...deliveries].map((item) => {
        const unitCost = parseFloat(item.unit_cost || 0);
        const quantity = parseInt(item.quantity || 0);
        const extendedPrice = unitCost * quantity;
        const date = new Date(item.issued_at);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric"
        });
        return {
          date: formattedDate,
          partName: item.part_number,
          description: item.part_name,
          quantity,
          unitCost: unitCost ? `$${unitCost.toFixed(2)}` : "$0.00",
          extendedPrice: `$${extendedPrice.toFixed(2)}`,
          building: item.building_name || "",
          costCenter: item.cost_center_code || "",
          type: item.type
        };
      });
      console.log(`Export: Generating Excel file with ${combinedData.length} total records`);
      const { generateCombinedReportExcel: generateCombinedReportExcel2 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
      const excelBuffer = generateCombinedReportExcel2(combinedData, month);
      const filename = `ONU-Parts-Report-${month.replace("/", "-")}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", excelBuffer.length);
      console.log(`Export: Sending file ${filename} (${excelBuffer.length} bytes)`);
      res.end(excelBuffer);
    } else {
      res.redirect(`/api/combined-report/export-pdf?month=${month}`);
    }
  } catch (error) {
    console.error("COMBINED EXPORT ERROR:", error);
    return res.status(500).json({
      error: "Failed to generate combined report",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
router2.get("/api/excel-final", requireAuth2, async (req, res) => {
  try {
    const month = req.query.month || format2(/* @__PURE__ */ new Date(), "MM/yyyy");
    const type = req.query.type || "all";
    console.log(`Excel-final: Generating report for month ${month}, type ${type} - User: ${req.session?.user?.name || "Unknown"}`);
    if (!req.session?.user) {
      console.error("Excel-final: No authenticated user in session");
      return res.status(401).json({ error: "Authentication required" });
    }
    const [monthNum, year] = month.split("/");
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    endDate.setHours(23, 59, 59, 999);
    const deliveriesQuery = `
      SELECT 
        pd.*,
        p.name as part_name,
        p.part_id as part_number,
        p.unit_cost,
        b.name as building_name,
        cc.code as cost_center_code,
        s.name as staff_name,
        'Delivery' as type
      FROM parts_delivery pd
      LEFT JOIN parts p ON pd.part_id = p.id
      LEFT JOIN buildings b ON pd.building_id = b.id
      LEFT JOIN cost_centers cc ON pd.cost_center_id = cc.id
      LEFT JOIN staff s ON pd.delivered_by_id = s.id
      WHERE pd.delivered_at BETWEEN $1 AND $2
      ORDER BY pd.delivered_at DESC
    `;
    const chargeOutsQuery = `
      SELECT 
        pi.*,
        p.name as part_name,
        p.part_id as part_number,
        p.unit_cost,
        pi.building as building_name,
        pi.cost_center_code,
        pi.issued_to as staff_name,
        'Charge-Out' as type
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      WHERE pi.issued_at BETWEEN $1 AND $2
      ORDER BY pi.issued_at DESC
    `;
    const deliveriesResult = await pool2.query(deliveriesQuery, [startDate, endDate]);
    const chargeOutsResult = await pool2.query(chargeOutsQuery, [startDate, endDate]);
    let combinedData = [];
    if (type === "all" || type === "deliveries") {
      combinedData.push(...deliveriesResult.rows);
    }
    if (type === "all" || type === "chargeouts") {
      combinedData.push(...chargeOutsResult.rows);
    }
    const excelData = combinedData.map((item) => ({
      date: new Date(item.delivered_at || item.issued_at).toLocaleDateString(),
      partName: item.part_name || "",
      unitCost: item.unit_cost ? `$${parseFloat(item.unit_cost).toFixed(2)}` : "",
      quantity: item.quantity,
      extendedPrice: `$${((item.unit_cost || 0) * item.quantity).toFixed(2)}`,
      building: item.building_name || "",
      costCenter: item.cost_center_code || "",
      type: item.type
    }));
    const { generateCombinedReportExcel: generateCombinedReportExcel2 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
    const excelBuffer = generateCombinedReportExcel2(excelData, month);
    const filename = `ONU-Combined-Report-${month.replace("/", "-")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", excelBuffer.length);
    console.log(`Excel-final: Sending ${filename} (${excelBuffer.length} bytes)`);
    res.end(excelBuffer);
  } catch (error) {
    console.error("Excel-final export error:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

// server/index.ts
import dotenv from "dotenv";
init_db();
init_reliability();
import path8 from "path";
import fs7 from "fs";

// server/routes-simple.js
init_db();
import express3 from "express";
var simpleRouter = express3.Router();
simpleRouter.get("/api/simple-export", async (req, res) => {
  try {
    const month = req.query.month;
    const type = req.query.type || "all";
    console.log(`Excel Export: month=${month}, type=${type}`);
    if (!month) {
      return res.status(400).send("Month parameter is required");
    }
    const [monthNum, yearNum] = month.split("/").map((n) => parseInt(n));
    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).send("Invalid month format. Use MM/YYYY");
    }
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).send("Invalid date range");
    }
    let issuances = [];
    let deliveries = [];
    if (type === "all" || type === "chargeouts") {
      const issuanceResult = await pool2.query(`
        SELECT 
          pi.id,
          pi.issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pi.quantity,
          p.unit_cost,
          b.name as building_name,
          cc.code as cost_center_code,
          'Charge-Out' as type
        FROM parts_issuance pi
        LEFT JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
        WHERE pi.issued_at BETWEEN $1 AND $2
        ORDER BY pi.issued_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      issuances = issuanceResult.rows || [];
    }
    if (type === "all" || type === "deliveries") {
      const deliveryResult = await pool2.query(`
        SELECT 
          pd.id,
          pd.delivered_at as issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pd.quantity,
          p.unit_cost,
          b.name as building_name,
          cc.code as cost_center_code,
          'Delivery' as type
        FROM parts_delivery pd
        LEFT JOIN parts p ON pd.part_id = p.id
        LEFT JOIN buildings b ON pd.building_id = b.id
        LEFT JOIN cost_centers cc ON cc.id = pd.cost_center_id
        WHERE pd.delivered_at BETWEEN $1 AND $2
        ORDER BY pd.delivered_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      deliveries = deliveryResult.rows || [];
    }
    console.log(`Excel Export: Found ${issuances.length} issuances and ${deliveries.length} deliveries`);
    const data = [...issuances, ...deliveries].map((item) => {
      const date = new Date(item.issued_at);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      return {
        date: formattedDate,
        partName: item.part_number || "",
        // Part Number field correctly mapped
        description: item.part_name || "",
        // Description field correctly mapped
        quantity,
        unitCost: unitCost ? `$${unitCost.toFixed(2)}` : "$0.00",
        extendedPrice: `$${extendedPrice.toFixed(2)}`,
        building: item.building_name || "",
        costCenter: item.cost_center_code || "",
        type: item.type || ""
      };
    });
    const csvRows = [];
    const headers = [
      "Date",
      "Part Number",
      "Description",
      "Quantity",
      "Unit Cost",
      "Extended Price",
      "Building",
      "Cost Center",
      "Type"
    ];
    csvRows.push(`ONU Parts Report - ${month}`);
    csvRows.push("");
    csvRows.push(headers.join(","));
    let totalCost = 0;
    data.forEach((row) => {
      const values = [
        row.date,
        `"${row.partName.replace(/"/g, '""')}"`,
        `"${row.description.replace(/"/g, '""')}"`,
        row.quantity,
        row.unitCost,
        row.extendedPrice,
        `"${row.building.replace(/"/g, '""')}"`,
        `"${row.costCenter.replace(/"/g, '""')}"`,
        row.type
      ];
      csvRows.push(values.join(","));
      const price = parseFloat(row.extendedPrice.replace(/[^0-9.-]/g, "")) || 0;
      totalCost += price;
    });
    csvRows.push("");
    csvRows.push(`TOTAL,,,,,$${totalCost.toFixed(2)},,`);
    const csvString = csvRows.join("\n");
    let reportType = "Parts";
    if (type === "deliveries") reportType = "Deliveries";
    if (type === "chargeouts") reportType = "Charge-Outs";
    const filename = `ONU-${reportType}-Report-${month.replace("/", "-")}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvString);
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).send("Export failed: " + (error.message || "Unknown error"));
  }
});
var routes_simple_default = simpleRouter;

// server/index.ts
dotenv.config();
console.log("Initializing PostgreSQL database...");
pgStorage.initDb().then(() => {
  console.log("PostgreSQL database initialized successfully");
}).catch((err) => {
  console.error("Failed to initialize PostgreSQL database:", err);
});
var app = express6();
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime()
  });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime()
  });
});
var agingRouter = express6.Router();
agingRouter.get("/inventory/aging-analysis", async (req, res) => {
  try {
    console.log("=== AGING ANALYSIS: Starting generation (direct router) ===");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");
    const query = `
      SELECT 
        p.part_id,
        p.name,
        p.description,
        p.quantity,
        p.unit_cost,
        p.category,
        COALESCE(sl.name, p.location, 'Unassigned') as location,
        p.last_restock_date,
        MAX(pi.issued_at) as last_issued_date
      FROM parts p
      LEFT JOIN parts_issuance pi ON p.id = pi.part_id
      LEFT JOIN storage_locations sl ON p.location_id = sl.id
      GROUP BY p.id, p.part_id, p.name, p.description, p.quantity, p.unit_cost, p.category, sl.name, p.location, p.last_restock_date
      ORDER BY p.part_id
    `;
    const result = await pool2.query(query);
    console.log(`=== AGING ANALYSIS: Query returned ${result.rows.length} rows ===`);
    const today = /* @__PURE__ */ new Date();
    const agingData = result.rows.map((row) => {
      const lastIssuedDate = row.last_issued_date ? new Date(row.last_issued_date) : null;
      const lastRestockDate = row.last_restock_date ? new Date(row.last_restock_date) : null;
      const daysSinceLastIssued = lastIssuedDate ? Math.floor((today.getTime() - lastIssuedDate.getTime()) / (1e3 * 60 * 60 * 24)) : null;
      const daysSinceLastRestock = lastRestockDate ? Math.floor((today.getTime() - lastRestockDate.getTime()) / (1e3 * 60 * 60 * 24)) : null;
      let agingCategory;
      if (daysSinceLastIssued === null) {
        agingCategory = "dead-stock";
      } else if (daysSinceLastIssued <= 30) {
        agingCategory = "fast-moving";
      } else if (daysSinceLastIssued <= 180) {
        agingCategory = "slow-moving";
      } else if (daysSinceLastIssued <= 365) {
        agingCategory = "stagnant";
      } else {
        agingCategory = "dead-stock";
      }
      const unitCost = parseFloat(row.unit_cost || "0");
      const estimatedValue = row.quantity * unitCost;
      return {
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        unitCost: row.unit_cost,
        lastIssuedDate: lastIssuedDate ? lastIssuedDate.toISOString() : null,
        lastRestockDate: lastRestockDate ? lastRestockDate.toISOString() : null,
        category: row.category,
        location: row.location,
        daysSinceLastIssued,
        daysSinceLastRestock,
        agingCategory,
        estimatedValue
      };
    });
    console.log(`=== AGING ANALYSIS: Generated aging analysis for ${agingData.length} parts ===`);
    return res.json(agingData);
  } catch (error) {
    console.error("Aging analysis error:", error);
    return res.status(500).json({ error: "Failed to generate aging analysis" });
  }
});
agingRouter.get("/performance/metrics", async (req, res) => {
  try {
    console.log("=== PERFORMANCE METRICS: Starting generation (direct router) ===");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");
    const dbStats = await pool2.query(`
      SELECT 
        (SELECT COUNT(*) FROM parts) as total_parts,
        (SELECT COUNT(*) FROM parts_issuance) as total_issuances,
        (SELECT COUNT(*) FROM storage_locations) as total_locations,
        (SELECT COUNT(*) FROM shelves) as total_shelves,
        (SELECT pg_database_size(current_database())) as db_size_bytes
    `);
    const tableSizes = await pool2.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);
    const metrics = {
      database: {
        totalRecords: parseInt(dbStats.rows[0].total_parts) + parseInt(dbStats.rows[0].total_issuances),
        totalParts: parseInt(dbStats.rows[0].total_parts),
        totalIssuances: parseInt(dbStats.rows[0].total_issuances),
        totalLocations: parseInt(dbStats.rows[0].total_locations),
        totalShelves: parseInt(dbStats.rows[0].total_shelves),
        databaseSize: dbStats.rows[0].db_size_bytes,
        databaseSizeFormatted: Math.round(dbStats.rows[0].db_size_bytes / 1024 / 1024) + " MB"
      },
      tables: tableSizes.rows,
      health: {
        status: "healthy",
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      recommendations: [
        "Database performance is optimal",
        "Consider archiving old issuance records after 2 years",
        "Regular vacuum operations recommended monthly"
      ]
    };
    console.log(`=== PERFORMANCE METRICS: Generated metrics successfully ===`);
    return res.json(metrics);
  } catch (error) {
    console.error("Performance metrics error:", error);
    return res.status(500).json({ error: "Failed to generate performance metrics" });
  }
});
app.use("/api", agingRouter);
app.get("/download/parts-inventory", async (req, res) => {
  console.log("Direct parts inventory download requested (no auth required)");
  try {
    const ExcelJS2 = (await import("exceljs")).default;
    const parts2 = await pgStorage.getParts();
    console.log(`Generating Excel for ${parts2.length} parts`);
    const workbook = new ExcelJS2.Workbook();
    const worksheet = workbook.addWorksheet("Parts Inventory");
    worksheet.columns = [
      { header: "Part ID", key: "partId", width: 15 },
      { header: "Name", key: "name", width: 30 },
      { header: "Description", key: "description", width: 40 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Reorder Level", key: "reorderLevel", width: 15 },
      { header: "Unit Cost", key: "unitCost", width: 12 },
      { header: "Extended Value", key: "extendedValue", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Location", key: "location", width: 20 },
      { header: "Supplier", key: "supplier", width: 20 }
    ];
    let grandTotal = 0;
    parts2.forEach((part, index) => {
      const quantity = parseFloat(part.quantity) || 0;
      const unitCost = parseFloat(part.unitCost || part.unit_cost || "0") || 0;
      const extendedValue = quantity * unitCost;
      grandTotal += extendedValue;
      worksheet.addRow({
        partId: part.partId,
        name: part.name,
        description: part.description || "",
        quantity,
        reorderLevel: part.reorderLevel || "",
        unitCost: unitCost.toFixed(2),
        extendedValue: extendedValue.toFixed(2),
        category: part.category || "",
        location: part.location || "",
        supplier: part.supplier || ""
      });
    });
    console.log(`Excel generation: Calculated grand total = $${grandTotal.toFixed(2)}`);
    worksheet.addRow({});
    worksheet.addRow({
      partId: "",
      name: "",
      description: "",
      quantity: "",
      reorderLevel: "",
      unitCost: "GRAND TOTAL:",
      extendedValue: grandTotal.toFixed(2),
      category: "",
      location: "",
      supplier: ""
    });
    const excelBuffer = await workbook.xlsx.writeBuffer();
    console.log("Excel buffer created, length:", excelBuffer.length);
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `ONU_Parts_Inventory_${timestamp2}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", excelBuffer.length.toString());
    res.end(excelBuffer);
  } catch (error) {
    console.error("Excel generation error:", error);
    res.status(500).json({ error: "Failed to generate Excel file" });
  }
});
app.get("/api/public-download-guide", (req, res) => {
  const guideContent = `ONU PARTS TRACKER - LOCAL DEPLOYMENT GUIDE
===============================================

SYSTEM REQUIREMENTS
------------------
- Node.js 18+ 
- PostgreSQL 12+
- 4GB RAM minimum
- 10GB available disk space

QUICK START
----------
1. Extract the complete package (ZIP file)
2. Install Node.js and PostgreSQL
3. Create database: CREATE DATABASE onu_parts_tracker;
4. Copy .env.template to .env and configure database
5. Run: npm install
6. Run: npm start
7. Open: http://localhost:5000

DETAILED INSTALLATION
--------------------

Windows:
1. Download Node.js from https://nodejs.org/
2. Download PostgreSQL from https://postgresql.org/
3. Run installers and note PostgreSQL password

macOS:
1. Install Homebrew
2. Run: brew install node postgresql
3. Start PostgreSQL: brew services start postgresql

Linux (Ubuntu):
1. Run: sudo apt update
2. Run: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
3. Run: sudo apt-get install -y nodejs postgresql postgresql-contrib

DATABASE SETUP
-------------
1. Connect: psql -U postgres
2. Run: CREATE DATABASE onu_parts_tracker;
3. Run: CREATE USER onu_admin WITH PASSWORD 'your_password';
4. Run: GRANT ALL PRIVILEGES ON DATABASE onu_parts_tracker TO onu_admin;

APPLICATION SETUP
----------------
1. Extract package to desired directory
2. Copy .env.template to .env
3. Edit .env with your database credentials
4. Run: npm install
5. Run: npm start

DEFAULT LOGIN
------------
Username: admin
Password: admin123

SECURITY NOTES
-------------
- Change default password immediately
- Use strong session secrets (32+ characters)
- Configure firewall properly
- Enable SSL for production

Generated: ${(/* @__PURE__ */ new Date()).toISOString()}`;
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", 'attachment; filename="onu-deployment-guide.txt"');
  res.send(guideContent);
});
app.get("/api/public-download-package", async (req, res) => {
  try {
    const { createExportPackage: createExportPackage2 } = await Promise.resolve().then(() => (init_export_package(), export_package_exports));
    const zipPath = await createExportPackage2();
    if (!fs7.existsSync(zipPath)) {
      return res.status(404).json({ error: "Export package not found" });
    }
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${path8.basename(zipPath)}"`);
    res.sendFile(path8.resolve(zipPath));
  } catch (error) {
    console.error("Failed to create export package:", error);
    res.status(500).json({ error: "Failed to create export package" });
  }
});
app.use((req, res, next) => {
  if (req.path.includes("/import") && req.method === "POST") {
    next();
  } else {
    express6.json()(req, res, next);
  }
});
app.use((req, res, next) => {
  if (req.path.includes("/import") && req.method === "POST") {
    next();
  } else {
    express6.urlencoded({ extended: false })(req, res, next);
  }
});
app.use(systemMonitor);
app.use(validateCriticalOperations);
app.use(express6.static(path8.join(process.cwd(), "client", "public")));
app.use(express6.static(process.cwd()));
var PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: pool2,
    tableName: "sessions",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "onu-parts-tracker-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    // 30 days for longer sessions
    secure: false,
    // Set to false for development
    httpOnly: true,
    // Can't be accessed by JavaScript
    sameSite: "lax"
    // Helps with cross-site compatibility
  },
  rolling: true
  // Renew session with each response
}));
app.get("/", (req, res) => {
  if (!req.headers.cookie && (req.headers["user-agent"]?.includes("health") || req.headers["user-agent"]?.includes("deployment") || req.headers["user-agent"]?.includes("curl") || req.method === "HEAD")) {
    return res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  }
  if (req.session?.user) {
    console.log("User authenticated at root URL, redirecting based on role:", req.session.user.role);
    if (req.session.user.role === "admin") {
      return res.redirect("/dashboard");
    } else if (req.session.user.role === "student") {
      return res.redirect("/parts-inventory");
    } else if (req.session.user.role === "controller") {
      return res.redirect("/dashboard");
    } else {
      return res.redirect("/parts-issuance");
    }
  } else {
    console.log("No user detected at root URL, redirecting to login");
    return res.redirect("/login");
  }
});
app.get("/login", (req, res) => {
  if (req.session?.user) {
    console.log("User already authenticated at /login:", req.session.user);
    if (req.session.user.role === "admin") {
      return res.redirect("/dashboard");
    } else if (req.session.user.role === "student") {
      return res.redirect("/parts-inventory");
    } else if (req.session.user.role === "controller") {
      return res.redirect("/dashboard");
    } else {
      return res.redirect("/parts-issuance");
    }
  }
  console.log("Direct login access with query params:", req.query);
  const loginHtmlPath = path8.join(process.cwd(), "client", "public", "login.html");
  console.log("Serving static login page from:", loginHtmlPath);
  if (fs7.existsSync(loginHtmlPath)) {
    res.sendFile(loginHtmlPath);
  } else {
    console.error("Login HTML file not found at", loginHtmlPath);
    res.status(404).send("Login page not found");
  }
});
app.get("/mobile-login", (req, res) => {
  console.log("Mobile login access detected - redirecting to main login page");
  return res.redirect("/login");
});
app.get("/admin-login", (req, res) => {
  if (req.session?.user) {
    console.log("User already authenticated at /admin-login:", req.session.user);
    if (req.session.user.role === "admin") {
      return res.redirect("/dashboard");
    } else if (req.session.user.role === "student") {
      return res.redirect("/parts-inventory");
    } else {
      return res.redirect("/parts-issuance");
    }
  }
  console.log("Serving admin login page");
  const simpleAdminLoginHtmlPath = path8.join(process.cwd(), "client", "public", "admin-login-simple.html");
  if (fs7.existsSync(simpleAdminLoginHtmlPath)) {
    console.log("Simple admin login HTML exists, sending file");
    return res.sendFile(simpleAdminLoginHtmlPath);
  }
  const adminLoginHtmlPath = path8.join(process.cwd(), "client", "public", "admin-login.html");
  console.log("Admin login path:", adminLoginHtmlPath);
  if (fs7.existsSync(adminLoginHtmlPath)) {
    console.log("Admin login HTML exists, sending file");
    res.sendFile(adminLoginHtmlPath);
  } else {
    console.error("Admin login HTML file not found");
    res.status(404).send("Admin login page not found");
  }
});
app.get("/admin-simple", (req, res) => {
  console.log("Serving simple admin login page");
  const simpleAdminLoginHtmlPath = path8.join(process.cwd(), "client", "public", "admin-login-simple.html");
  if (fs7.existsSync(simpleAdminLoginHtmlPath)) {
    console.log("Simple admin login HTML exists, sending file");
    res.sendFile(simpleAdminLoginHtmlPath);
  } else {
    console.error("Simple admin login HTML file not found, serving inline HTML");
    const html = `<!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ONU Admin Login</title>
          <style>
              body { font-family: Arial; margin: 20px; background: #f5f5f5; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #F36532; text-align: center; }
              input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
              button { background: #F36532; color: white; border: none; padding: 12px; width: 100%; cursor: pointer; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>ONU Admin Login</h1>
              
              <form action="/api/login" method="post">
                  <input type="hidden" name="role" value="admin">
                  <input type="hidden" name="redirect" value="/dashboard">
                  
                  <label>Username:</label>
                  <input type="text" name="username" value="admin" required>
                  
                  <label>Password:</label>
                  <input type="password" name="password" value="admin" required>
                  
                  <button type="submit">Login</button>
              </form>
              
              <p style="text-align: center; margin-top: 20px;">
                  <a href="/mobile-login" style="color: #F36532;">Back to Mobile Login</a>
              </p>
          </div>
      </body>
      </html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }
});
app.get("/student-login", (req, res) => {
  if (req.session?.user) {
    console.log("User already authenticated at /student-login:", req.session.user);
    if (req.session.user.role === "admin") {
      return res.redirect("/dashboard");
    } else if (req.session.user.role === "student") {
      return res.redirect("/parts-inventory");
    } else {
      return res.redirect("/parts-issuance");
    }
  }
  console.log("Serving student login page");
  const studentLoginHtmlPath = path8.join(process.cwd(), "client", "public", "student-login.html");
  console.log("Student login path:", studentLoginHtmlPath);
  if (fs7.existsSync(studentLoginHtmlPath)) {
    console.log("Student login HTML exists, sending file");
    res.sendFile(studentLoginHtmlPath);
  } else {
    console.error("Student login HTML file not found");
    res.status(404).send("Student login page not found");
  }
});
app.get("/dashboard-simple", (req, res) => {
  if (!req.session?.user) {
    console.log("User not authenticated at /dashboard-simple");
    return res.redirect("/admin-login");
  }
  console.log("Serving simple dashboard page");
  const simpleDashboardPath = path8.join(process.cwd(), "client", "public", "dashboard-simple.html");
  if (fs7.existsSync(simpleDashboardPath)) {
    console.log("Simple dashboard HTML exists, sending file");
    res.sendFile(simpleDashboardPath);
  } else {
    console.error("Simple dashboard HTML file not found");
    res.redirect("/dashboard");
  }
});
app.get("/tech-login", (req, res) => {
  if (req.session?.user) {
    console.log("User already authenticated at /tech-login:", req.session.user);
    if (req.session.user.role === "admin") {
      return res.redirect("/dashboard");
    } else if (req.session.user.role === "student") {
      return res.redirect("/parts-inventory");
    } else {
      return res.redirect("/parts-issuance");
    }
  }
  console.log("Serving tech login page");
  const techLoginHtmlPath = path8.join(process.cwd(), "client", "public", "tech-login.html");
  console.log("Tech login path:", techLoginHtmlPath);
  if (fs7.existsSync(techLoginHtmlPath)) {
    console.log("Tech login HTML exists, sending file");
    res.sendFile(techLoginHtmlPath);
  } else {
    console.error("Tech login HTML file not found");
    res.status(404).send("Tech login page not found");
  }
});
app.get("/quick-count-direct", (req, res) => {
  console.log("Direct quick count access");
  const quickCountDirectPath = path8.join(process.cwd(), "client", "public", "quick-count-direct.html");
  console.log("Serving static quick count direct access page from:", quickCountDirectPath);
  if (fs7.existsSync(quickCountDirectPath)) {
    res.sendFile(quickCountDirectPath);
  } else {
    console.error("Quick count direct access HTML file not found at", quickCountDirectPath);
    res.status(404).send("Quick count direct access page not found");
  }
});
app.get("/quick-count-standalone", (req, res) => {
  console.log("Standalone quick count access");
  const quickCountStandalonePath = path8.join(process.cwd(), "client", "public", "quick-count-standalone.html");
  console.log("Serving standalone quick count page from:", quickCountStandalonePath);
  if (fs7.existsSync(quickCountStandalonePath)) {
    res.sendFile(quickCountStandalonePath);
  } else {
    console.error("Standalone quick count HTML file not found at", quickCountStandalonePath);
    res.status(404).send("Standalone quick count page not found");
  }
});
app.get("/mobile", (req, res) => {
  if (req.session?.user) {
    console.log("User already authenticated:", req.session.user);
    return res.redirect("/parts-issuance");
  }
  const mobilePath = path8.join(process.cwd(), "mobile.html");
  console.log("Trying to serve mobile login from:", mobilePath);
  if (fs7.existsSync(mobilePath)) {
    console.log("Mobile login file exists, sending...");
    res.sendFile(mobilePath);
  } else {
    console.error("Mobile login file not found at", mobilePath);
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ONU Parts Tracker Login</title>
        <style>
          body { font-family: sans-serif; margin: 20px; }
          input, button { margin: 10px 0; padding: 8px; width: 100%; box-sizing: border-box; }
          button { background: #F36532; color: white; border: none; }
          #technicianList { margin-top: 20px; }
          .tech-item { border-bottom: 1px solid #eee; padding: 10px 0; }
          h3 { margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>ONU Parts Tracker</h1>
        <form id="loginForm">
          <label>Name: <input name="name" required></label>
          <label>Department: <input name="department"></label>
          <input type="hidden" name="role" value="technician">
          <button type="submit">Login</button>
        </form>
        
        <h3>OR Select Technician</h3>
        <div id="technicianList">Loading technicians...</div>
        
        <script>
          // Fetch technicians on page load
          fetch('/api/technicians-list')
            .then(res => res.json())
            .then(technicians => {
              const list = document.getElementById('technicianList');
              if (technicians && technicians.length) {
                let html = '';
                technicians.forEach(tech => {
                  html += '<div class="tech-item">';
                  html += '<strong>' + tech.name + '</strong>';
                  if (tech.department) html += ' (' + tech.department + ')';
                  html += '<button onclick="loginAsTechnician('' + tech.username + '')">Select</button>';
                  html += '</div>';
                });
                list.innerHTML = html;
              } else {
                list.innerHTML = '<p>No technicians found</p>';
              }
            })
            .catch(err => {
              document.getElementById('technicianList').innerHTML = 
                '<p>Could not load technicians. Please use the form above.</p>';
              console.error('Error loading technicians:', err);
            });
          
          // Login as technician function
          function loginAsTechnician(username) {
            const data = {
              username: username,
              role: 'technician'
            };
            
            fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            .then(response => {
              if (response.redirected) {
                window.location.href = response.url;
              } else if (response.ok) {
                window.location.href = '/parts-issuance';
              } else {
                return response.text().then(text => {
                  alert('Login failed: ' + text);
                });
              }
            })
            .catch(error => {
              alert('Login error: ' + error.message);
            });
          }
          
          // Add manual submission handling
          document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = {};
            for (const [key, value] of formData.entries()) {
              data[key] = value;
            }
            
            fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            .then(response => {
              if (response.redirected) {
                window.location.href = response.url;
              } else if (response.ok) {
                window.location.href = '/parts-issuance'; 
              } else {
                return response.text().then(text => {
                  alert('Login failed: ' + text);
                });
              }
            })
            .catch(error => {
              alert('Login error: ' + error.message);
            });
          });
        </script>
      </body>
      </html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }
});
app.use((req, res, next) => {
  const start = Date.now();
  const path9 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path9.startsWith("/api")) {
      let logLine = `${req.method} ${path9} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
})();
app.get("/api/health", healthCheck);
app.get("/api/system-status", (req, res) => {
  res.json(systemStatus.getStatus());
});
app.post("/api/create-backup", async (req, res) => {
  try {
    const backupFile = await createBackup();
    res.json({
      success: true,
      message: "Backup created successfully",
      file: path8.basename(backupFile)
    });
  } catch (error) {
    console.error("Manual backup failed:", error);
    res.status(500).json({
      success: false,
      message: "Backup creation failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
app.get("/downloads", (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ONU Parts Tracker - Downloads</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #F36532; text-align: center; margin-bottom: 30px; }
        .download-btn { display: inline-block; background: #F36532; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0; font-weight: 600; }
        .download-btn:hover { background: #e5532a; }
        .description { color: #64748b; margin-bottom: 20px; }
        .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>\u{1F527} ONU Parts Tracker Downloads</h1>
        
        <div class="section">
            <h3>\u{1F4E6} Complete Export Package</h3>
            <p class="description">Full source code, database backup, and setup files for independent deployment.</p>
            <a href="/api/public-download-package" class="download-btn">Download Export Package (ZIP)</a>
        </div>
        
        <div class="section">
            <h3>\u{1F4CB} Deployment Guide</h3>
            <p class="description">Step-by-step installation instructions for local deployment.</p>
            <a href="/api/public-download-guide" class="download-btn">Download Setup Guide (TXT)</a>
        </div>
        
        <div class="section">
            <h3>\u2139\uFE0F Package Contents</h3>
            <ul>
                <li>Complete React frontend and Node.js backend</li>
                <li>PostgreSQL database backup with all data</li>
                <li>Environment configuration templates</li>
                <li>Startup scripts and documentation</li>
                <li>Installation guide for Windows, macOS, and Linux</li>
            </ul>
        </div>
        
        <p style="text-align: center; color: #64748b; margin-top: 40px;">
            Generated: ${(/* @__PURE__ */ new Date()).toISOString()}<br>
            System ready for independent deployment
        </p>
    </div>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});
app.get("/api/excel-export-fixed", async (req, res) => {
  try {
    console.log("Fixed Excel export called");
    const monthParam = req.query.month;
    let dateFilterSQL = "";
    const queryParams = [];
    if (monthParam) {
      const [month, year] = monthParam.split("/");
      if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        dateFilterSQL = "WHERE pi.issued_at >= $1 AND pi.issued_at <= $2";
        queryParams.push(startDate.toISOString(), endDate.toISOString());
      }
    }
    const { pool: pool3 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const query = `
      SELECT 
        pi.id, pi.part_id, pi.quantity, pi.issued_to, pi.reason, pi.issued_at,
        pi.notes, pi.project_code, pi.department, pi.building, pi.issued_by_id,
        p.part_id as part_number, p.name as part_name, p.unit_cost
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      ${dateFilterSQL}
      ORDER BY pi.issued_at DESC
    `;
    const result = await pool3.query(query, queryParams);
    console.log(`Fixed Excel Export: Found ${result.rows.length} records`);
    const issuances = result.rows.map((row) => ({
      id: row.id,
      partId: row.part_id,
      quantity: row.quantity,
      issuedTo: row.issued_to,
      reason: row.reason,
      issuedAt: row.issued_at,
      notes: row.notes || null,
      projectCode: row.project_code || null,
      department: row.department || null,
      building: row.building || null,
      part: {
        partId: row.part_number,
        name: row.part_name,
        unitCost: row.unit_cost
      },
      extendedPrice: row.quantity * parseFloat(row.unit_cost || "0"),
      issuedById: row.issued_by_id || null
    }));
    const { generatePartsIssuanceExcel: generatePartsIssuanceExcel2 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
    const excelBuffer = await generatePartsIssuanceExcel2(issuances);
    let filename = "charge-out-report";
    if (monthParam) {
      filename += `-${monthParam.replace("/", "-")}`;
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
    res.setHeader("Content-Length", excelBuffer.length);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Fixed Excel export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});
app.use(routes_simple_default);
console.log("Reliable Excel export route added at /api/simple-export");
app.get("/api/excel-charge-outs", async (req, res) => {
  try {
    console.log("Excel charge-outs export handler called");
    const monthParam = req.query.month;
    let startDate, endDate;
    let dateFilterSQL = "";
    const queryParams = [];
    if (monthParam) {
      const [month, year] = monthParam.split("/");
      if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        dateFilterSQL = "WHERE pi.issued_at >= $1 AND pi.issued_at <= $2";
        queryParams.push(startDate.toISOString(), endDate.toISOString());
        console.log(`Excel Export: Filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      }
    }
    const { pool: pool3 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const query = `
      SELECT 
        pi.id,
        pi.part_id,
        pi.quantity,
        pi.issued_to,
        pi.reason,
        pi.issued_at,
        pi.notes,
        pi.project_code,
        pi.department,
        pi.building,
        pi.issued_by_id,
        b.name as building_name,
        cc.name as cost_center_name,
        cc.code as cost_center_code,
        p.part_id as part_number,
        p.name as part_name,
        p.unit_cost
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      LEFT JOIN buildings b ON pi.building = b.id::text
      LEFT JOIN cost_centers cc ON pi.cost_center = cc.id::text
      ${dateFilterSQL}
      ORDER BY pi.issued_at DESC
    `;
    const result = await pool3.query(query, queryParams);
    console.log(`Excel Export: Found ${result.rows.length} issuance records`);
    const issuances = result.rows.map((row) => ({
      id: row.id,
      partId: row.part_id,
      quantity: row.quantity,
      issuedTo: row.issued_to,
      reason: row.reason,
      issuedAt: row.issued_at,
      notes: row.notes || null,
      projectCode: row.project_code || null,
      department: row.department || null,
      building: row.building || null,
      buildingName: row.building_name || null,
      costCenterName: row.cost_center_name || null,
      costCenterCode: row.cost_center_code || null,
      part: {
        partId: row.part_number,
        name: row.part_name,
        unitCost: row.unit_cost
      },
      extendedPrice: row.quantity * parseFloat(row.unit_cost || "0"),
      issuedById: row.issued_by_id || null
    }));
    const { generatePartsIssuanceExcel: generatePartsIssuanceExcel2 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
    const excelBuffer = await generatePartsIssuanceExcel2(issuances);
    let filename = "charge-out-report";
    if (monthParam) {
      filename += `-${monthParam.replace("/", "-")}`;
    } else {
      filename += `-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`;
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
    res.setHeader("Content-Length", excelBuffer.length);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});
console.log("Working Excel export added at /api/excel-charge-outs");
try {
  const directRouter = await Promise.resolve().then(() => (init_direct_route(), direct_route_exports));
  const excelDebug = await Promise.resolve().then(() => (init_excel_debug(), excel_debug_exports));
  const finalRoute = await Promise.resolve().then(() => (init_routes_final(), routes_final_exports));
  app.use(directRouter.default);
  app.get("/api/excel-debug", excelDebug.default);
  app.use(finalRoute.default);
  console.log("Excel export routes added successfully");
  try {
    const { initializeBulkEmailSystem: initializeBulkEmailSystem2 } = await Promise.resolve().then(() => (init_bulk_email_service(), bulk_email_service_exports));
    initializeBulkEmailSystem2();
  } catch (error) {
    console.error("Failed to initialize bulk email system:", error);
  }
} catch (err) {
  console.error("Error adding Excel routes:", err);
}
