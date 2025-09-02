import { Request, Response, Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import * as toolStorage from "./tool-storage";

// Define middleware for route protection
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
};

// Role-based middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (req.session?.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
};

const router = Router();

// Get all tools with their current status
router.get("/tools", requireAuth, async (req: Request, res: Response) => {
  try {
    let tools = [];
    
    // If technician or student, show available tools and their checked out tools
    if (req.session?.user?.role === 'technician' || req.session?.user?.role === 'student') {
      const technicianId = req.session.user.id;
      const availableTools = await toolStorage.getAvailableTools();
      const technicianTools = await toolStorage.getToolsSignedOutByTechnician(technicianId);
      
      // Format the response to include current status
      tools = [
        ...availableTools.map((tool: any) => ({
          ...tool,
          status: 'available',
          technicianId: null,
          technicianName: null
        })),
        ...technicianTools
      ];
    } else {
      // If admin, show all tools with their current status
      const allTools = await toolStorage.getAllTools();
      // Get tool signout info for each tool
      for (const tool of allTools) {
        const currentSignout = await toolStorage.getCurrentToolSignout(tool.id);
        if (currentSignout && currentSignout.status === 'checked_out') {
          // Get technician info from database
          const [technician] = await db.select().from(users).where(eq(users.id, currentSignout.technicianId));
          
          tools.push({
            ...tool,
            status: 'checked_out',
            technicianId: currentSignout.technicianId,
            technicianName: technician ? technician.name : 'Unknown',
            signoutId: currentSignout.id,
            signedOutAt: currentSignout.signedOutAt
          });
        } else {
          tools.push({
            ...tool,
            status: 'available',
            technicianId: null,
            technicianName: null
          });
        }
      }
    }
    
    res.json(tools);
  } catch (error) {
    console.error("Error getting tools:", error);
    res.status(500).json({ error: "Failed to fetch tools" });
  }
});

// Add a new tool (admin and student) - this creates a permanent tool record
// Students need to add tools to inventory, technicians sign them out for repairs
router.post("/tools/add", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
  // Allow both admin and student roles to add tools to inventory
  if (!["admin", "student"].includes(req.session?.user?.role)) {
    return res.status(403).json({ error: "UNAUTHORIZED: Only administrators and students can add new tools" });
  }
  try {
    const { toolName, notes } = req.body;
    
    console.log("Tool add request received:", { toolName, notes });
    
    // Validate the request data
    if (!toolName) {
      return res.status(400).json({ error: "Tool name is required" });
    }
    
    // Simply use the tool storage function but with more verbose logging
    try {
      // Get the list of existing tools to check numbers
      const existingTools = await toolStorage.getAllTools();
      const toolNumbers = existingTools.map(t => t.toolNumber);
      console.log("Existing tool numbers:", toolNumbers);
      
      // Force the toolStorage function to use a specific tool number
      // First find an available one
      let nextToolNumber = 1;
      
      if (toolNumbers.length > 0) {
        // Find gaps in the sequence
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
      
      // Now create the tool with this specific number
      const newTool = await toolStorage.createTool({
        toolName,
        notes: notes || null,
        toolNumber: nextToolNumber
      });
      
      console.log("Tool created successfully:", newTool);
      res.status(201).json(newTool);
    } catch (innerError) {
      console.error("Inner error adding tool:", innerError);
      throw innerError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error adding new tool:", error);
    // Add more detailed error information in the response
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ 
      error: "Failed to add new tool", 
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Admin sign out tool to specific technician
router.post("/tools/admin-signout", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    console.log("ADMIN SIGNOUT REQUEST:", req.body);
    const { toolId, technicianId, notes } = req.body;
    
    // Validate the request data
    if (!toolId || !technicianId) {
      console.log("VALIDATION ERROR - Missing data:", { toolId, technicianId });
      return res.status(400).json({ error: "Tool ID and Technician ID are required" });
    }
    
    // Verify this tool exists and is available
    const tool = await toolStorage.getTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }
    
    // Check if the tool is already checked out
    const isAvailable = await toolStorage.isToolAvailable(toolId);
    if (!isAvailable) {
      return res.status(400).json({ error: "This tool is already checked out" });
    }
    
    // Verify the technician exists
    console.log("LOOKING FOR TECHNICIAN WITH ID:", technicianId);
    const [technician] = await db.select().from(users).where(eq(users.id, technicianId));
    console.log("FOUND TECHNICIAN:", technician);
    if (!technician) {
      console.log("TECHNICIAN NOT FOUND - ID:", technicianId);
      return res.status(404).json({ error: "Technician not found" });
    }
    
    // Create a new sign-out record
    const signout = await toolStorage.signOutTool({
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

// Sign out a tool (adds a sign-out record)
router.post("/tools/signout", requireAuth, requireRole(["technician", "student"]), async (req: Request, res: Response) => {
  try {
    const { toolId, notes } = req.body;
    const technicianId = req.session?.user?.id;
    
    if (!technicianId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Validate the request data
    if (!toolId) {
      return res.status(400).json({ error: "Tool ID is required" });
    }
    
    // Verify this tool exists and is available
    const tool = await toolStorage.getTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }
    
    // Check if the tool is already checked out
    const isAvailable = await toolStorage.isToolAvailable(toolId);
    if (!isAvailable) {
      return res.status(400).json({ error: "This tool is already checked out" });
    }
    
    // Create a new sign-out record
    const signout = await toolStorage.signOutTool({
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

// Return a tool (updates the sign-out record)
router.patch("/tools/return/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const signoutId = parseInt(req.params.id);
    const { status, condition, notes } = req.body;
    
    // Get the current signout record
    const signout = await toolStorage.getToolSignout(signoutId);
    if (!signout) {
      return res.status(404).json({ error: "Tool sign-out record not found" });
    }
    
    // Check permissions - only admins or the technician/student who signed out the tool can return it
    if (req.session?.user?.role !== 'admin' && signout.technicianId !== req.session?.user?.id) {
      return res.status(403).json({ error: "You are not authorized to return this tool" });
    }
    
    // Update the sign-out record with return information
    const updatedSignout = await toolStorage.returnTool(signoutId, {
      status: status || 'returned',
      condition: condition || null,
      notes: notes || null,
      returnedAt: new Date()
    });
    
    res.json(updatedSignout);
  } catch (error) {
    console.error("Error returning tool:", error);
    res.status(500).json({ error: "Failed to return tool" });
  }
});

// Alternative endpoint - redirect to the main endpoint above
router.patch("/tools/return/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const signoutId = parseInt(req.params.id);
    const { status, condition, notes } = req.body;
    
    // Get the current signout record
    const signout = await toolStorage.getToolSignout(signoutId);
    if (!signout) {
      return res.status(404).json({ error: "Tool sign-out record not found" });
    }
    
    // Check permissions - only admins or the technician/student who signed out the tool can return it
    if (req.session?.user?.role !== 'admin' && signout.technicianId !== req.session?.user?.id) {
      return res.status(403).json({ error: "You are not authorized to return this tool" });
    }
    
    // Update the sign-out record with return information
    const updatedSignout = await toolStorage.returnTool(signoutId, {
      status: status || 'returned',
      condition: condition || null,
      notes: notes || null,
      returnedAt: new Date()
    });
    
    res.json(updatedSignout);
  } catch (error) {
    console.error("Error returning tool:", error);
    res.status(500).json({ error: "Failed to return tool" });
  }
});

// Get tool history (shows all signouts for a given tool)
router.get("/tools/:id/history", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const toolId = parseInt(req.params.id);
    const history = await toolStorage.getToolSignoutHistory(toolId);
    
    // Get technician names for each signout
    const historyWithNames = await Promise.all(history.map(async (record: any) => {
      const [technician] = await db.select().from(users).where(eq(users.id, record.technicianId));
      return {
        ...record,
        technicianName: technician ? technician.name : 'Unknown'
      };
    }));
    
    res.json(historyWithNames);
  } catch (error) {
    console.error("Error fetching tool history:", error);
    res.status(500).json({ error: "Failed to fetch tool history" });
  }
});

// Get tools by status (technicians can only see available tools)
router.get("/tools/status/:status", requireAuth, async (req: Request, res: Response) => {
  try {
    const status = req.params.status;
    // Validate the status parameter
    if (!["checked_out", "returned", "damaged", "missing", "available"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    // Only admins can see non-available tools
    if (status !== 'available' && req.session?.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    
    let tools = [];
    if (status === 'available') {
      tools = await toolStorage.getAvailableTools();
      tools = tools.map((tool: any) => ({
        ...tool,
        status: 'available',
        technicianId: null,
        technicianName: null
      }));
    } else {
      const signouts = await toolStorage.getToolSignoutsByStatus(status);
      
      for (const signout of signouts) {
        const tool = await toolStorage.getTool(signout.toolId);
        const [technician] = await db.select().from(users).where(eq(users.id, signout.technicianId));
        
        if (tool) {
          tools.push({
            ...tool,
            status: signout.status,
            technicianId: signout.technicianId,
            technicianName: technician ? technician.name : 'Unknown',
            signoutId: signout.id,
            signedOutAt: signout.signedOutAt,
            returnedAt: signout.returnedAt
          });
        }
      }
    }
    
    res.json(tools);
  } catch (error) {
    console.error("Error fetching tools by status:", error);
    res.status(500).json({ error: "Failed to fetch tools by status" });
  }
});

// Delete a tool (admin only) - this will delete the permanent tool record and all associated signouts
router.delete("/tools/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  // Double-check role to ensure only admins can delete tools
  if (req.session?.user?.role !== "admin") {
    return res.status(403).json({ error: "UNAUTHORIZED: Only administrators can delete tools" });
  }
  
  try {
    const toolId = parseInt(req.params.id);
    
    if (isNaN(toolId)) {
      return res.status(400).json({ error: "Invalid tool ID" });
    }
    
    // Check if the tool exists
    const tool = await toolStorage.getTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }
    
    // Check if the tool is currently checked out
    const currentSignout = await toolStorage.getCurrentToolSignout(toolId);
    if (currentSignout && currentSignout.status === 'checked_out') {
      return res.status(400).json({ 
        error: "Cannot delete a tool that is currently checked out. Please ensure the tool is returned before deleting." 
      });
    }
    
    // Delete the tool
    const deleted = await toolStorage.deleteTool(toolId);
    
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

export default router;