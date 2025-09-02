import { 
  costCenters, staffMembers, partsDelivery, parts, buildings, users,
  type CostCenter, type InsertCostCenter,
  type StaffMember, type InsertStaffMember, type StaffMemberWithRelations,
  type PartsDelivery, type InsertPartsDelivery, type UpdatePartsDelivery,
  type PartsDeliveryWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { readFile } from "fs/promises";
import * as XLSX from "xlsx";

/**
 * Get all cost centers
 */
export async function getCostCenters(): Promise<CostCenter[]> {
  try {
    const centers = await db.select()
      .from(costCenters)
      .orderBy(costCenters.code);
    
    return centers;
  } catch (error) {
    console.error("Error getting cost centers:", error);
    return [];
  }
}

/**
 * Get a specific cost center by ID
 */
export async function getCostCenter(id: number): Promise<CostCenter | undefined> {
  try {
    const [center] = await db.select()
      .from(costCenters)
      .where(eq(costCenters.id, id));
    
    return center;
  } catch (error) {
    console.error("Error getting cost center:", error);
    return undefined;
  }
}

/**
 * Create a new cost center
 */
export async function createCostCenter(center: InsertCostCenter): Promise<CostCenter> {
  try {
    const [newCenter] = await db.insert(costCenters)
      .values({
        ...center,
        createdAt: new Date()
      })
      .returning();
    
    return newCenter;
  } catch (error) {
    console.error("Error creating cost center:", error);
    throw error;
  }
}

/**
 * Update an existing cost center
 */
export async function updateCostCenter(id: number, center: Partial<InsertCostCenter>): Promise<CostCenter | undefined> {
  try {
    const [updated] = await db.update(costCenters)
      .set(center)
      .where(eq(costCenters.id, id))
      .returning();
    
    return updated;
  } catch (error) {
    console.error("Error updating cost center:", error);
    return undefined;
  }
}

/**
 * Delete a cost center
 */
export async function deleteCostCenter(id: number): Promise<boolean> {
  try {
    const result = await db.delete(costCenters)
      .where(eq(costCenters.id, id))
      .returning({ id: costCenters.id });
    
    return result.length > 0;
  } catch (error) {
    console.error("Error deleting cost center:", error);
    return false;
  }
}

/**
 * Get all staff members
 */
export async function getStaffMembers(): Promise<StaffMemberWithRelations[]> {
  try {
    // Get all staff members first
    const members = await db.select()
      .from(staffMembers)
      .orderBy(staffMembers.name);
    
    // For each staff member, fetch the associated building and cost center
    const staffWithDetails = await Promise.all(
      members.map(async (staff) => {
        // Get building if buildingId exists
        let building = undefined;
        if (staff.buildingId) {
          const [buildingResult] = await db.select()
            .from(buildings)
            .where(eq(buildings.id, staff.buildingId));
          building = buildingResult;
        }
        
        // Get cost center if costCenterId exists
        let costCenter = undefined;
        if (staff.costCenterId) {
          const [costCenterResult] = await db.select()
            .from(costCenters)
            .where(eq(costCenters.id, staff.costCenterId));
          costCenter = costCenterResult;
        }
        
        // Return staff with building and cost center information
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

/**
 * Get a specific staff member by ID
 */
export async function getStaffMember(id: number): Promise<StaffMemberWithRelations | undefined> {
  try {
    const [member] = await db.select()
      .from(staffMembers)
      .where(eq(staffMembers.id, id));
    
    if (!member) return undefined;
    
    // Get building if buildingId exists
    let building = undefined;
    if (member.buildingId) {
      const [buildingResult] = await db.select()
        .from(buildings)
        .where(eq(buildings.id, member.buildingId));
      building = buildingResult;
    }
    
    // Get cost center if costCenterId exists
    let costCenter = undefined;
    if (member.costCenterId) {
      const [costCenterResult] = await db.select()
        .from(costCenters)
        .where(eq(costCenters.id, member.costCenterId));
      costCenter = costCenterResult;
    }
    
    // Return member with building and cost center information
    return {
      ...member,
      building,
      costCenter
    };
  } catch (error) {
    console.error("Error getting staff member:", error);
    return undefined;
  }
}

/**
 * Create a new staff member
 */
export async function createStaffMember(member: InsertStaffMember): Promise<StaffMember> {
  try {
    const [newMember] = await db.insert(staffMembers)
      .values({
        ...member,
        createdAt: new Date()
      })
      .returning();
    
    return newMember;
  } catch (error) {
    console.error("Error creating staff member:", error);
    throw error;
  }
}

/**
 * Update an existing staff member
 */
export async function updateStaffMember(id: number, member: Partial<InsertStaffMember>): Promise<StaffMember | undefined> {
  try {
    const [updated] = await db.update(staffMembers)
      .set(member)
      .where(eq(staffMembers.id, id))
      .returning();
    
    return updated;
  } catch (error) {
    console.error("Error updating staff member:", error);
    return undefined;
  }
}

/**
 * Delete a staff member
 */
export async function deleteStaffMember(id: number): Promise<boolean> {
  try {
    const result = await db.delete(staffMembers)
      .where(eq(staffMembers.id, id))
      .returning({ id: staffMembers.id });
    
    return result.length > 0;
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return false;
  }
}

/**
 * Create a new parts delivery
 */
export async function createPartsDelivery(delivery: InsertPartsDelivery): Promise<PartsDelivery> {
  try {
    // Get the part to update its quantity
    const [part] = await db.select()
      .from(parts)
      .where(eq(parts.id, delivery.partId));
    
    if (!part) {
      throw new Error(`Part with ID ${delivery.partId} not found`);
    }
    
    // Check if there's enough quantity
    if (part.quantity < delivery.quantity) {
      throw new Error(`Not enough quantity available. Requested: ${delivery.quantity}, Available: ${part.quantity}`);
    }
    
    // Begin a transaction to ensure both operations succeed or fail together
    return await db.transaction(async (tx) => {
      // Deduct the quantity from the part
      await tx.update(parts)
        .set({ quantity: part.quantity - delivery.quantity })
        .where(eq(parts.id, delivery.partId));
      
      // Ensure deliveredAt is a proper Date object
      let deliveredAtDate: Date;
      if (delivery.deliveredAt) {
        if (typeof delivery.deliveredAt === 'string') {
          deliveredAtDate = new Date(delivery.deliveredAt + 'T16:00:00.000Z');
        } else if (delivery.deliveredAt instanceof Date) {
          deliveredAtDate = delivery.deliveredAt;
        } else {
          deliveredAtDate = new Date(delivery.deliveredAt);
        }
      } else {
        deliveredAtDate = new Date();
      }
      
      console.log("Creating delivery with parsed date:", deliveredAtDate.toISOString());
      
      // CRITICAL FIX: Copy the unit cost from the part at the time of delivery
      console.log(`Copying unit cost from part: ${part.unitCost || 'NULL'}`);
      
      const [newDelivery] = await tx.insert(partsDelivery)
        .values({
          ...delivery,
          deliveredAt: deliveredAtDate, // Use the properly parsed date
          unitCost: part.unitCost, // Copy the unit cost from the part
        })
        .returning();
      
      return newDelivery;
    });
  } catch (error) {
    console.error("Error creating parts delivery:", error);
    throw error;
  }
}

/**
 * Get delivery by ID with all related details
 */
export async function getPartsDeliveryWithDetails(id: number): Promise<PartsDeliveryWithDetails | undefined> {
  try {
    const [delivery] = await db.select()
      .from(partsDelivery)
      .where(eq(partsDelivery.id, id));
    
    if (!delivery) return undefined;
    
    // Get related data
    const [part] = await db.select().from(parts).where(eq(parts.id, delivery.partId));
    
    if (!part) {
      console.error(`Part with ID ${delivery.partId} not found for delivery ${delivery.id}`);
      return undefined;
    }
    
    // Get staff member - allow continuation even if staff not found
    let staffMember;
    try {
      [staffMember] = await db.select().from(staffMembers).where(eq(staffMembers.id, delivery.staffMemberId));
      
      // If staffMemberId exists but record not found, log error
      if (!staffMember) {
        console.error(`Staff member with ID ${delivery.staffMemberId} not found for delivery ${delivery.id}`);
      }
    } catch (error) {
      console.error(`Error fetching staff member with ID ${delivery.staffMemberId}:`, error);
    }
    
    // Get optional related data
    let costCenter = undefined;
    let building = undefined;
    let deliveredBy = undefined;
    
    if (delivery.costCenterId) {
      [costCenter] = await db.select().from(costCenters).where(eq(costCenters.id, delivery.costCenterId));
    }
    
    if (delivery.buildingId) {
      [building] = await db.select().from(buildings).where(eq(buildings.id, delivery.buildingId));
    }
    
    if (delivery.deliveredById) {
      [deliveredBy] = await db.select().from(users).where(eq(users.id, delivery.deliveredById));
    }
    
    // Create a default staffMember object if none was found
    // This prevents "Unknown Staff" in the UI and avoids TypeScript errors
    const defaultStaffMember: StaffMember = {
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
    return undefined;
  }
}

/**
 * Get pending deliveries with details (for active work list)
 * Optional date range filtering with startDate and endDate
 */
export async function getPendingPartsDeliveriesWithDetails(
  startDate?: Date,
  endDate?: Date
): Promise<PartsDeliveryWithDetails[]> {
  try {
    console.log('Filtering to show only pending deliveries');
    
    // Build where conditions - always filter for pending status
    let whereConditions = [eq(partsDelivery.status, 'pending')];
    
    // Add date filters if provided
    if (startDate && endDate) {
      console.log(`Also filtering pending deliveries between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      whereConditions.push(
        gte(partsDelivery.deliveredAt, startDate),
        lte(partsDelivery.deliveredAt, endDate)
      );
    }
    
    // Execute query with all conditions
    const allDeliveries = await db
      .select()
      .from(partsDelivery)
      .where(and(...whereConditions))
      .orderBy(desc(partsDelivery.deliveredAt));
    
    const deliveriesWithDetails: PartsDeliveryWithDetails[] = [];
    
    for (const delivery of allDeliveries) {
      const part = await db.select().from(parts).where(eq(parts.id, delivery.partId));
      
      if (part.length === 0) {
        console.error(`Part with ID ${delivery.partId} not found for delivery ${delivery.id}`);
        continue;
      }
      
      // Get staff member - allow continuation even if staff not found
      let staffMember;
      try {
        [staffMember] = await db.select().from(staffMembers).where(eq(staffMembers.id, delivery.staffMemberId));
      } catch (error) {
        console.error(`Error fetching staff member with ID ${delivery.staffMemberId}:`, error);
      }
      
      // If staffMemberId exists but record not found, create a default staff member
      if (!staffMember) {
        console.error(`Staff member with ID ${delivery.staffMemberId} not found for delivery ${delivery.id}`);
      }
      
      // Get optional related data
      let costCenter = undefined;
      let building = undefined;
      let deliveredBy = undefined;
      
      if (delivery.costCenterId) {
        [costCenter] = await db.select().from(costCenters).where(eq(costCenters.id, delivery.costCenterId));
      }
      
      if (delivery.buildingId) {
        [building] = await db.select().from(buildings).where(eq(buildings.id, delivery.buildingId));
      }
      
      if (delivery.deliveredById) {
        [deliveredBy] = await db.select().from(users).where(eq(users.id, delivery.deliveredById));
      }
      
      deliveriesWithDetails.push({
        ...delivery,
        part: part[0],
        staffMember,
        costCenter,
        building,
        deliveredBy
      });
    }
    
    console.log(`Found ${deliveriesWithDetails.length} pending deliveries with details`);
    return deliveriesWithDetails;
  } catch (error) {
    console.error("Error getting pending parts deliveries with details:", error);
    return [];
  }
}

/**
 * Get ALL deliveries with details (for reporting - includes pending and completed)
 * Optional date range filtering with startDate and endDate
 */
export async function getAllPartsDeliveriesWithDetails(
  startDate?: Date,
  endDate?: Date
): Promise<PartsDeliveryWithDetails[]> {
  try {
    console.log('FAST BULK EXPORT: Getting deliveries with single queries');
    
    // Get all deliveries with filters in one query
    let query = db.select().from(partsDelivery);
    
    if (startDate && endDate) {
      console.log(`FAST: Filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      query = query.where(
        and(
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
    
    // Get all related data in bulk (5 queries total instead of N+1)
    const [allParts, allStaff, allBuildings, allCostCenters, allUsers] = await Promise.all([
      db.select().from(parts),
      db.select().from(staffMembers), 
      db.select().from(buildings),
      db.select().from(costCenters),
      db.select().from(users)
    ]);
    
    console.log(`FAST: Loaded ${allParts.length} parts, ${allStaff.length} staff, ${allBuildings.length} buildings, ${allCostCenters.length} cost centers, ${allUsers.length} users`);
    
    // Create lookup maps
    const partsMap = new Map(allParts.map(p => [p.id, p]));
    const staffMap = new Map(allStaff.map(s => [s.id, s]));
    const buildingsMap = new Map(allBuildings.map(b => [b.id, b]));
    const costCentersMap = new Map(allCostCenters.map(c => [c.id, c]));
    const usersMap = new Map(allUsers.map(u => [u.id, u]));
    
    // Build results in memory (very fast)
    const results: PartsDeliveryWithDetails[] = deliveries.map(delivery => {
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

/**
 * Get recent deliveries with details (limited to a specific count)
 * Optional date range filtering with startDate and endDate
 */
export async function getRecentPartsDeliveriesWithDetails(
  limit: number,
  startDate?: Date,
  endDate?: Date
): Promise<PartsDeliveryWithDetails[]> {
  try {
    let query = db.select().from(partsDelivery);
    
    // Apply date filters if provided
    if (startDate && endDate) {
      console.log(`Filtering deliveries between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      
      query = query.where(
        and(
          gte(partsDelivery.deliveredAt, startDate),
          lte(partsDelivery.deliveredAt, endDate)
        )
      );
    }
    
    // Apply ordering and limit
    const recentDeliveries = await query
      .orderBy(desc(partsDelivery.deliveredAt))
      .limit(limit);
    
    console.log(`Found ${recentDeliveries.length} deliveries matching date criteria`);
    
    const deliveriesWithDetails: PartsDeliveryWithDetails[] = [];
    
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

/**
 * Get a specific parts delivery by ID with details
 */
export async function getPartsDeliveryById(id: number): Promise<PartsDeliveryWithDetails | undefined> {
  try {
    return await getPartsDeliveryWithDetails(id);
  } catch (error) {
    console.error("Error getting parts delivery by ID:", error);
    return undefined;
  }
}

/**
 * Update a parts delivery
 */
export async function updatePartsDelivery(id: number, deliveryData: Partial<UpdatePartsDelivery>): Promise<PartsDelivery | undefined> {
  try {
    // Get the original delivery to compare
    const [originalDelivery] = await db.select()
      .from(partsDelivery)
      .where(eq(partsDelivery.id, id));
    
    if (!originalDelivery) {
      return undefined;
    }
    
    // Process the delivery date if provided
    let dataToUpdate: any = { ...deliveryData };
    
    // If deliveredAt is a string, convert it to a proper Date object
    if (deliveryData.deliveredAt) {
      console.log("Update - Handling date:", deliveryData.deliveredAt, 
                "Type:", typeof deliveryData.deliveredAt);
      
      try {
        if (typeof deliveryData.deliveredAt === 'string') {
          // Parse ISO format or yyyy-MM-dd format
          if (deliveryData.deliveredAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Handle simple date format (yyyy-MM-dd)
            const [year, month, day] = deliveryData.deliveredAt.split('-').map(Number);
            dataToUpdate.deliveredAt = new Date(year, month - 1, day, 12, 0, 0);
          } else {
            // Handle ISO format or other date strings
            dataToUpdate.deliveredAt = new Date(deliveryData.deliveredAt);
          }
        }
        
        // Make sure it's valid
        if (dataToUpdate.deliveredAt instanceof Date && isNaN(dataToUpdate.deliveredAt.getTime())) {
          throw new Error("Invalid date conversion result");
        }
        
        console.log("Update - Converted date to:", dataToUpdate.deliveredAt);
      } catch (err) {
        console.error("Date conversion error:", err);
        // Default to current date if conversion fails
        dataToUpdate.deliveredAt = new Date();
      }
    }
    
    // If we're updating the part or quantity, we need to handle inventory properly
    if ((dataToUpdate.partId && dataToUpdate.partId !== originalDelivery.partId) ||
        (dataToUpdate.quantity && dataToUpdate.quantity !== originalDelivery.quantity)) {
      
      return await db.transaction(async (tx) => {
        // If changing the part, restore the old part's quantity
        if (originalDelivery.partId) {
          const [oldPart] = await tx.select().from(parts).where(eq(parts.id, originalDelivery.partId));
          if (oldPart) {
            await tx.update(parts)
              .set({ quantity: oldPart.quantity + originalDelivery.quantity })
              .where(eq(parts.id, originalDelivery.partId));
          }
        }
        
        // If a new part is specified, deduct from that part
        const partIdToUpdate = dataToUpdate.partId || originalDelivery.partId;
        const quantityToDeduct = dataToUpdate.quantity || originalDelivery.quantity;
        
        const [newPart] = await tx.select().from(parts).where(eq(parts.id, partIdToUpdate));
        if (!newPart) {
          throw new Error(`Part with ID ${partIdToUpdate} not found`);
        }
        
        if (newPart.quantity < quantityToDeduct) {
          throw new Error(`Not enough quantity available. Requested: ${quantityToDeduct}, Available: ${newPart.quantity}`);
        }
        
        await tx.update(parts)
          .set({ quantity: newPart.quantity - quantityToDeduct })
          .where(eq(parts.id, partIdToUpdate));
        
        // Update the delivery record
        console.log("Update - Setting delivery data in transaction:", dataToUpdate);
        const [updatedDelivery] = await tx.update(partsDelivery)
          .set(dataToUpdate)
          .where(eq(partsDelivery.id, id))
          .returning();
        
        return updatedDelivery;
      });
    } else {
      // Simple update without inventory changes
      console.log("Update - Setting delivery data without transaction:", dataToUpdate);
      const [updatedDelivery] = await db.update(partsDelivery)
        .set(dataToUpdate)
        .where(eq(partsDelivery.id, id))
        .returning();
      
      return updatedDelivery;
    }
  } catch (error) {
    console.error("Error updating parts delivery:", error);
    throw error;
  }
}

/**
 * Delete a parts delivery
 */
export async function deletePartsDelivery(id: number): Promise<boolean> {
  try {
    // Get the delivery to return the parts to inventory
    const [delivery] = await db.select()
      .from(partsDelivery)
      .where(eq(partsDelivery.id, id));
    
    if (!delivery) {
      return false;
    }
    
    return await db.transaction(async (tx) => {
      // Return the quantity to the part
      const [part] = await tx.select().from(parts).where(eq(parts.id, delivery.partId));
      
      if (part) {
        await tx.update(parts)
          .set({ quantity: part.quantity + delivery.quantity })
          .where(eq(parts.id, delivery.partId));
      }
      
      // Delete the delivery
      const deleted = await tx.delete(partsDelivery)
        .where(eq(partsDelivery.id, id))
        .returning({ id: partsDelivery.id });
      
      return deleted.length > 0;
    });
  } catch (error) {
    console.error("Error deleting parts delivery:", error);
    throw error;
  }
}

/**
 * Get monthly deliveries total value
 * Optional date range filtering with startDate and endDate
 */
export async function getMonthlyPartsDeliveriesTotal(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    // Start building the query 
    // Use the delivery's stored unitCost, not the current part's cost
    // This ensures reports use the actual cost at time of delivery
    let query = db.select({
      total: sql`SUM(${partsDelivery.quantity} * CAST(${partsDelivery.unitCost} AS DECIMAL))`.as('total')
    })
    .from(partsDelivery)
    .innerJoin(parts, eq(partsDelivery.partId, parts.id));
    
    // Apply date filters if provided
    if (startDate && endDate) {
      console.log(`Filtering monthly total between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      
      query = query.where(
        and(
          gte(partsDelivery.deliveredAt, startDate),
          lte(partsDelivery.deliveredAt, endDate)
        )
      );
    }
    
    // Execute the query
    const result = await query;
    
    // Get raw value from database
    const totalValue = result[0]?.total || 0;
    
    // Debug info
    console.log(`Monthly total value (in dollars): ${totalValue}`);
    
    // The values are already in dollars in the database
    return Math.round(Number(totalValue) * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error("Error calculating monthly deliveries total value:", error);
    return 0;
  }
}

/**
 * Read cost centers from Excel file
 */
export async function readCostCentersFromExcel(filePath: string): Promise<{ costCenters: InsertCostCenter[], errors: Array<{ row: number; message: string }> }> {
  try {
    const fileBuffer = await readFile(filePath);
    const workbook = XLSX.read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(worksheet);
    
    const costCenters: InsertCostCenter[] = [];
    const errors: Array<{ row: number; message: string }> = [];
    
    data.forEach((row, index) => {
      try {
        if (!row.code || !row.name) {
          errors.push({ row: index + 2, message: 'Missing required fields: code and name are required' });
          return;
        }
        
        const costCenter: InsertCostCenter = {
          code: row.code.toString(),
          name: row.name,
          description: row.description || null,
          active: row.active !== undefined ? row.active === true || row.active === 'true' || row.active === 1 : true
        };
        
        costCenters.push(costCenter);
      } catch (err) {
        errors.push({ row: index + 2, message: `Error parsing row: ${err instanceof Error ? err.message : String(err)}` });
      }
    });
    
    return { costCenters, errors };
  } catch (error) {
    console.error("Error reading cost centers from Excel:", error);
    return { costCenters: [], errors: [{ row: 0, message: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}` }] };
  }
}

/**
 * Read staff members from Excel file
 */
export async function readStaffMembersFromExcel(filePath: string): Promise<{ staffMembers: InsertStaffMember[], errors: Array<{ row: number; message: string }> }> {
  try {
    const fileBuffer = await readFile(filePath);
    const workbook = XLSX.read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(worksheet);
    
    const staffMembers: InsertStaffMember[] = [];
    const errors: Array<{ row: number; message: string }> = [];
    
    // Fetch existing buildings and cost centers for reference
    const allBuildings = await db.select().from(buildings);
    const allCostCenters = await db.select().from(costCenters);
    
    data.forEach((row, index) => {
      try {
        if (!row.name) {
          errors.push({ row: index + 2, message: 'Missing required field: name is required' });
          return;
        }
        
        // Try to find matching building and cost center
        let buildingId = null;
        if (row.building) {
          const building = allBuildings.find(b => b.name === row.building);
          if (building) {
            buildingId = building.id;
          } else {
            errors.push({ row: index + 2, message: `Building "${row.building}" not found in system` });
          }
        }
        
        let costCenterId = null;
        if (row.costCenter) {
          const costCenter = allCostCenters.find(c => c.code === row.costCenter || c.name === row.costCenter);
          if (costCenter) {
            costCenterId = costCenter.id;
          } else {
            errors.push({ row: index + 2, message: `Cost center "${row.costCenter}" not found in system` });
          }
        }
        
        const staffMember: InsertStaffMember = {
          name: row.name,
          buildingId: buildingId,
          costCenterId: costCenterId,
          email: row.email || null,
          phone: row.phone || null,
          active: row.active !== undefined ? row.active === true || row.active === 'true' || row.active === 1 : true
        };
        
        staffMembers.push(staffMember);
      } catch (err) {
        errors.push({ row: index + 2, message: `Error parsing row: ${err instanceof Error ? err.message : String(err)}` });
      }
    });
    
    return { staffMembers, errors };
  } catch (error) {
    console.error("Error reading staff members from Excel:", error);
    return { staffMembers: [], errors: [{ row: 0, message: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}` }] };
  }
}

/**
 * Generate Excel file from cost centers data
 */
export function generateCostCentersExcel(centers: CostCenter[]): Buffer {
  try {
    const worksheet = XLSX.utils.json_to_sheet(centers.map(center => ({
      code: center.code,
      name: center.name,
      description: center.description || '',
      active: center.active
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cost Centers');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error generating cost centers Excel:", error);
    throw error;
  }
}

/**
 * Generate template Excel file for cost centers import
 */
export function generateCostCentersTemplateExcel(): Buffer {
  try {
    const template = [
      {
        code: 'CC001',
        name: 'Example Cost Center',
        description: 'Example description',
        active: true
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cost Centers Template');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error generating cost centers template Excel:", error);
    throw error;
  }
}

/**
 * Generate Excel file from staff members data
 */
export async function generateStaffMembersExcel(members: StaffMember[]): Promise<Buffer> {
  try {
    // Get buildings and cost centers for lookup
    const allBuildings = await db.select().from(buildings);
    const allCostCenters = await db.select().from(costCenters);
    
    const data = await Promise.all(members.map(async (member) => {
      // Find building and cost center names
      const building = member.buildingId ? allBuildings.find(b => b.id === member.buildingId) : null;
      const costCenter = member.costCenterId ? allCostCenters.find(c => c.id === member.costCenterId) : null;
      
      return {
        name: member.name,
        building: building ? building.name : '',
        costCenter: costCenter ? costCenter.code : '',
        email: member.email || '',
        phone: member.phone || '',
        active: member.active
      };
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Members');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error generating staff members Excel:", error);
    throw error;
  }
}

/**
 * Generate template Excel file for staff members import
 */
export function generateStaffMembersTemplateExcel(): Buffer {
  try {
    const template = [
      {
        name: 'John Doe',
        building: 'Main Building',
        costCenter: 'CC001',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        active: true
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Members Template');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error generating staff members template Excel:", error);
    throw error;
  }
}

/**
 * Generate Excel file for deliveries report with ID column for export-edit-import workflow
 * @param deliveries Array of delivery details
 * @param monthParam Month in MM/YYYY format for the report title
 */
export async function generateDeliveriesExcel(deliveries: PartsDeliveryWithDetails[], monthParam?: string): Promise<Buffer> {
  try {
    // Calculate monthly total in dollars (prices already stored in dollars in DB)
    let monthlyTotal = 0;
    
    const data = deliveries.map(delivery => {
      // Use the unitCost from the delivery record, fall back to part's unitCost
      const unitCost = delivery.unitCost || delivery.part?.unitCost || 0;
      
      // Convert to a number if needed
      const unitCostNumber = typeof unitCost === 'string' ? parseFloat(unitCost) : Number(unitCost);
      
      // Calculate extended price in dollars
      const extendedPrice = delivery.quantity * unitCostNumber;
      
      // Add to monthly total
      monthlyTotal += extendedPrice;
      
      // Format for display
      const unitCostFormatted = `$${unitCostNumber.toFixed(2)}`;
      const extendedPriceFormatted = `$${extendedPrice.toFixed(2)}`;
      
      return {
        'id': delivery.id,
        'date': delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString('en-US') : '',
        'partid': delivery.partId,
        'partname': delivery.part?.name || '',
        'quantity': delivery.quantity,
        'unitcost': unitCostFormatted,
        'extendedprice': extendedPriceFormatted,
        'staffmember': delivery.staffMember?.name || '',
        'buildingid': delivery.buildingId,
        'buildingname': delivery.building?.name || '',
        'costcenterid': delivery.costCenterId,
        'costcentername': delivery.costCenter?.code || '',
        'notes': delivery.notes || ''
      };
    });
    
    // Create workbook using simple JSON to sheet conversion
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths for better formatting
    const colWidths = [
      { wch: 8 },   // ID
      { wch: 12 },  // Date
      { wch: 15 },  // Part Number
      { wch: 30 },  // Part Name
      { wch: 10 },  // Quantity
      { wch: 12 },  // Unit Cost
      { wch: 15 },  // Extended Price
      { wch: 25 },  // Staff Member
      { wch: 12 },  // Building ID
      { wch: 20 },  // Building Name
      { wch: 12 },  // Cost Center ID
      { wch: 15 },  // Cost Center Name
      { wch: 25 }   // Notes
    ];
    worksheet['!cols'] = colWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parts Deliveries');
    
    // Generate the Excel file
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error generating deliveries Excel:", error);
    throw error;
  }
}

/**
 * Helper function to list months that have delivery data
 * This helps users know which months they can export
 */
async function listMonthsWithData(worksheet: any): Promise<void> {
  try {
    // Get all deliveries
    const allDeliveries = await getAllPartsDeliveriesWithDetails();
    
    if (allDeliveries.length === 0) {
      worksheet['A7'] = { t: 's', v: 'No delivery data found in the system' };
      return;
    }
    
    // Group deliveries by month
    const monthsWithData = new Map<string, number>();
    
    for (const delivery of allDeliveries) {
      if (delivery.deliveredAt) {
        const date = new Date(delivery.deliveredAt);
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (monthsWithData.has(monthKey)) {
          monthsWithData.set(monthKey, monthsWithData.get(monthKey)! + 1);
        } else {
          monthsWithData.set(monthKey, 1);
        }
      }
    }
    
    // Sort months chronologically
    const sortedMonths = Array.from(monthsWithData.entries()).sort((a, b) => {
      const [monthA, yearA] = a[0].split('/').map(Number);
      const [monthB, yearB] = b[0].split('/').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
    
    // Add note in the worksheet
    worksheet['A7'] = { t: 's', v: 'NOTE: No data found for selected month. Months with data:' };
    
    // List months with data
    let row = 8;
    for (const [month, count] of sortedMonths) {
      worksheet[`A${row}`] = { t: 's', v: `${month} (${count} deliveries)` };
      row++;
    }
    
  } catch (error) {
    console.error("Error listing months with data:", error);
    worksheet['A7'] = { t: 's', v: 'Error listing months with data' };
  }
}