import { Pool } from 'pg';
import { eq, and, isNull, or } from 'drizzle-orm';
import { db } from './db';
import {
  Tool,
  InsertTool,
  ToolSignout,
  InsertToolSignout,
  tools,
  toolSignouts,
  ToolWithStatus,
  ToolSignoutWithDetails,
  users
} from "@shared/schema";

/**
 * Get all permanent tools with their current status
 */
export async function getAllTools(): Promise<Tool[]> {
  try {
    const result = await db.select().from(tools).orderBy(tools.toolNumber);
    return result;
  } catch (error) {
    console.error("Error getting all tools:", error);
    return [];
  }
}

/**
 * Get available tools (those that are not currently checked out)
 */
export async function getAvailableTools(): Promise<Tool[]> {
  try {
    // First get all tools
    const allTools = await getAllTools();
    
    // For each tool, check if it's currently checked out
    const availableTools: Tool[] = [];
    
    for (const tool of allTools) {
      const currentSignout = await getCurrentToolSignout(tool.id);
      if (!currentSignout || currentSignout.status !== 'checked_out') {
        availableTools.push(tool);
      }
    }
    
    return availableTools;
  } catch (error) {
    console.error("Error getting available tools:", error);
    return [];
  }
}

/**
 * Get a specific tool by ID
 */
export async function getTool(id: number): Promise<Tool | undefined> {
  try {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  } catch (error) {
    console.error("Error getting tool by ID:", error);
    return undefined;
  }
}

/**
 * Create a new tool with a specified tool number
 */
export async function createTool(data: Omit<InsertTool, 'toolNumber'> & { toolNumber?: number }): Promise<Tool> {
  try {
    // Use the provided number if available, otherwise get the next available
    const toolNumber = data.toolNumber || await getNextToolNumber();
    
    console.log(`Creating new tool with number ${toolNumber}:`, data);
    
    // Insert tool using the ORM
    const insertedTools = await db.insert(tools)
      .values({
        toolName: data.toolName,
        notes: data.notes || null,
        toolNumber: toolNumber,
        createdAt: new Date(),
        active: data.active !== undefined ? data.active : true
      })
      .returning();
      
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

/**
 * Get the next available tool number (sequential)
 */
export async function getNextToolNumber(): Promise<number> {
  try {
    // Get all existing tool numbers from the database
    const existingTools = await db.select({
      toolNumber: tools.toolNumber
    })
    .from(tools)
    .orderBy(tools.toolNumber, "asc");
    
    // If no tools exist, start from 1
    if (existingTools.length === 0) {
      return 1;
    }
    
    // Extract an array of existing tool numbers
    const existingNumbers = existingTools.map(t => t.toolNumber);
    console.log("Existing tool numbers:", existingNumbers);
    
    // Find the highest current tool number
    const maxNumber = existingNumbers[existingNumbers.length - 1];
    
    // Initialize nextNumber with the expected next sequential number
    let nextNumber = maxNumber + 1;
    
    // Check if there are any gaps in the sequence
    for (let i = 1; i <= maxNumber; i++) {
      if (!existingNumbers.includes(i)) {
        console.log(`Found available tool number in gap: ${i}`);
        return i; // Return the first available number in the sequence
      }
    }
    
    console.log(`Using next sequential tool number: ${nextNumber}`);
    return nextNumber;
  } catch (error) {
    console.error("Error getting next tool number:", error);
    return 1; // Default to 1 if error
  }
}

/**
 * Check if a tool is available for sign out
 */
export async function isToolAvailable(toolId: number): Promise<boolean> {
  try {
    const currentSignout = await getCurrentToolSignout(toolId);
    return !currentSignout || currentSignout.status !== 'checked_out';
  } catch (error) {
    console.error("Error checking if tool is available:", error);
    return false;
  }
}

/**
 * Get the current sign out record for a tool (if any)
 */
export async function getCurrentToolSignout(toolId: number): Promise<ToolSignout | undefined> {
  try {
    // Get the most recent sign out for this tool
    const [signout] = await db.select()
      .from(toolSignouts)
      .where(eq(toolSignouts.toolId, toolId))
      .orderBy(toolSignouts.signedOutAt, "desc")
      .limit(1);
    
    return signout;
  } catch (error) {
    console.error("Error getting current tool signout:", error);
    return undefined;
  }
}

/**
 * Sign out a tool to a technician
 */
export async function signOutTool(data: { toolId: number, technicianId: number, notes?: string | null }): Promise<ToolSignout> {
  try {
    // Create a new sign out record
    const [signout] = await db.insert(toolSignouts).values({
      toolId: data.toolId,
      technicianId: data.technicianId,
      status: 'checked_out',
      notes: data.notes || null,
      signedOutAt: new Date(),
    }).returning();
    
    return signout;
  } catch (error) {
    console.error("Error signing out tool:", error);
    throw error;
  }
}

/**
 * Get a specific tool sign out record
 */
export async function getToolSignout(id: number): Promise<ToolSignout | undefined> {
  try {
    const [signout] = await db.select().from(toolSignouts).where(eq(toolSignouts.id, id));
    return signout;
  } catch (error) {
    console.error("Error getting tool signout by ID:", error);
    return undefined;
  }
}

/**
 * Update a tool sign out record (for returns)
 */
export async function updateToolSignout(id: number, data: Partial<ToolSignout>): Promise<ToolSignout | undefined> {
  try {
    const [updated] = await db.update(toolSignouts)
      .set(data)
      .where(eq(toolSignouts.id, id))
      .returning();
    
    return updated;
  } catch (error) {
    console.error("Error updating tool signout:", error);
    return undefined;
  }
}

/**
 * Special function for returning a tool
 */
export async function returnTool(id: number, data: { status: string, condition?: string | null, notes?: string | null, returnedAt: Date }): Promise<ToolSignout | undefined> {
  return updateToolSignout(id, {
    status: data.status as any,
    condition: data.condition || null,
    notes: data.notes || null,
    returnedAt: data.returnedAt
  });
}

/**
 * Get all tools signed out by a technician
 */
export async function getToolsSignedOutByTechnician(technicianId: number): Promise<ToolWithStatus[]> {
  try {
    // Get all signouts for this technician
    const signouts = await db.select()
      .from(toolSignouts)
      .where(and(
        eq(toolSignouts.technicianId, technicianId),
        eq(toolSignouts.status, 'checked_out')
      ));
    
    // Get full tool details for each signout
    const toolsWithStatus: ToolWithStatus[] = [];
    
    for (const signout of signouts) {
      const tool = await getTool(signout.toolId);
      if (tool) {
        const technician = await db.select().from(users).where(eq(users.id, technicianId)).limit(1);
        
        toolsWithStatus.push({
          ...tool,
          status: signout.status,
          technicianId: technicianId,
          technicianName: technician.length > 0 ? technician[0].name : 'Unknown',
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

/**
 * Get tool sign outs filtered by status
 */
export async function getToolSignoutsByStatus(status: string): Promise<ToolSignout[]> {
  try {
    const signouts = await db.select()
      .from(toolSignouts)
      .where(eq(toolSignouts.status, status as any));
    
    return signouts;
  } catch (error) {
    console.error(`Error getting tool signouts by status ${status}:`, error);
    return [];
  }
}

/**
 * Get sign out history for a specific tool
 */
export async function getToolSignoutHistory(toolId: number): Promise<ToolSignout[]> {
  try {
    const history = await db.select()
      .from(toolSignouts)
      .where(eq(toolSignouts.toolId, toolId))
      .orderBy(toolSignouts.signedOutAt, "desc");
    
    return history;
  } catch (error) {
    console.error("Error getting tool signout history:", error);
    return [];
  }
}

/**
 * Delete a tool and all its associated signout records
 */
export async function deleteTool(id: number): Promise<boolean> {
  try {
    // Begin a transaction
    return await db.transaction(async (tx) => {
      // First, delete all associated signout records
      await tx.delete(toolSignouts).where(eq(toolSignouts.toolId, id));
      
      // Then delete the tool itself
      const deleteResult = await tx.delete(tools).where(eq(tools.id, id)).returning({ id: tools.id });
      
      // Check if the tool was actually deleted
      return deleteResult.length > 0;
    });
  } catch (error) {
    console.error("Error deleting tool:", error);
    return false;
  }
}