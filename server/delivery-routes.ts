import { Router, Request, Response } from "express";
import * as deliveryStorage from "./delivery-storage";
import { 
  insertCostCenterSchema, 
  insertStaffMemberSchema, 
  insertPartsDeliverySchema,
  updatePartsDeliverySchema,
  type StaffMember
} from "@shared/schema";
import { sendDeliveryConfirmationEmail } from "./email-service";

// Extend the Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        name: string;
        role: string;
      };
    }
  }
}
import multer from "multer";
import { join } from "path";
import { unlink } from "fs/promises";

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

// Create router
export const deliveryRouter = Router();

// -- Cost Centers Routes --

// Get all cost centers - no auth required for UI functionality
deliveryRouter.get("/cost-centers", async (_req: Request, res: Response) => {
  try {
    console.log("DIRECT ACCESS: Getting cost centers directly for UI fix");
    const centers = await deliveryStorage.getCostCenters();
    console.log(`DIRECT ACCESS: Returning ${centers.length} cost centers`);
    res.json(centers);
  } catch (error) {
    console.error("Error fetching cost centers:", error);
    res.status(500).json({ error: "Failed to fetch cost centers" });
  }
});

// Create a new cost center
deliveryRouter.post("/cost-centers", async (req: Request, res: Response) => {
  try {
    // Log important request details to help diagnose issues
    console.log("Create cost center request received", {
      user: req.user ? { id: req.user.id, role: req.user.role } : null, 
      hasSession: !!req.session,
      bodyKeys: Object.keys(req.body)
    });

    // Check if the user is authenticated and is admin or student
    if (!req.user) {
      console.error("Create cost center: No user in request");
      return res.status(403).json({ error: "Authentication required" });
    }

    if (req.user.role === 'controller') {
      return res.status(403).json({ 
        error: "You don't have permission to change this data", 
        message: "Controller accounts have read-only access. Please contact an administrator to make changes." 
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'student') {
      console.error(`Create cost center: User role ${req.user.role} not authorized`);
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    // Validate request body
    const parseResult = insertCostCenterSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.error("Create cost center: Invalid data", parseResult.error);
      return res.status(400).json({ error: "Invalid data", details: parseResult.error });
    }

    // Log the validated data
    console.log("Create cost center: Validated data", parseResult.data);

    try {
      const center = await deliveryStorage.createCostCenter(parseResult.data);
      console.log("Cost center created successfully", center);
      res.status(201).json(center);
    } catch (error: any) {
      console.error("Error creating cost center:", error);

      // Handle duplicate key violation specifically
      if (error.code === '23505' && error.constraint === 'cost_centers_code_key') {
        return res.status(400).json({ 
          error: "Code already exists", 
          message: `The cost center code "${parseResult.data.code}" already exists. Please use a different code.` 
        });
      }

      // Handle other database errors
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

// Update an existing cost center
deliveryRouter.put("/cost-centers/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Validate request body
    const parseResult = insertCostCenterSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid data", details: parseResult.error });
    }

    const updated = await deliveryStorage.updateCostCenter(id, parseResult.data);
    if (!updated) {
      return res.status(404).json({ error: "Cost center not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating cost center:", error);
    res.status(500).json({ error: "Failed to update cost center" });
  }
});

// Delete a cost center
deliveryRouter.delete("/cost-centers/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permission denied - admin access only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const success = await deliveryStorage.deleteCostCenter(id);
    if (!success) {
      return res.status(404).json({ error: "Cost center not found or could not be deleted" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting cost center:", error);
    res.status(500).json({ error: "Failed to delete cost center" });
  }
});

// Import cost centers from Excel
deliveryRouter.post("/cost-centers/import", upload.single("file"), async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permission denied - admin access only" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = join(process.cwd(), req.file.path);

    // Read cost centers from Excel
    const { costCenters, errors } = await deliveryStorage.readCostCentersFromExcel(filePath);

    // Clean up the uploaded file
    await unlink(filePath).catch(err => console.error("Error deleting temp file:", err));

    // Check if there are any cost centers to import
    if (costCenters.length === 0) {
      return res.status(400).json({ error: "No valid cost centers found in the file", errors });
    }

    // Import each cost center
    const importedCenters = [];
    for (const center of costCenters) {
      try {
        const imported = await deliveryStorage.createCostCenter(center);
        importedCenters.push(imported);
      } catch (error) {
        console.error(`Error importing cost center ${center.code}:`, error);
        errors.push({ row: -1, message: `Failed to import cost center ${center.code}: ${error instanceof Error ? error.message : String(error)}` });
      }
    }

    res.status(200).json({
      success: true,
      totalRows: costCenters.length,
      importedRows: importedCenters.length,
      errors
    });
  } catch (error) {
    console.error("Error importing cost centers:", error);
    res.status(500).json({ error: "Failed to import cost centers" });
  }
});

// Export cost centers to Excel
deliveryRouter.get("/cost-centers/export", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    console.log("Exporting cost centers to Excel...");
    const centers = await deliveryStorage.getCostCenters();
    console.log(`Found ${centers.length} cost centers to export`);

    try {
      const excel = deliveryStorage.generateCostCentersExcel(centers);
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

// Get cost centers template Excel
deliveryRouter.get("/cost-centers/template", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permission denied - admin access only" });
    }

    const excel = deliveryStorage.generateCostCentersTemplateExcel();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=cost-centers-template.xlsx");
    res.send(excel);
  } catch (error) {
    console.error("Error generating cost centers template:", error);
    res.status(500).json({ error: "Failed to generate cost centers template" });
  }
});

// Get a specific cost center - accessible to all authenticated users
deliveryRouter.get("/cost-centers/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(403).json({ error: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const center = await deliveryStorage.getCostCenter(id);
    if (!center) {
      return res.status(404).json({ error: "Cost center not found" });
    }

    res.json(center);
  } catch (error) {
    console.error("Error fetching cost center:", error);
    res.status(500).json({ error: "Failed to fetch cost center" });
  }
});

// -- Staff Members Routes --

// Get all staff members - accessible to all authenticated users
deliveryRouter.get("/staff", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(403).json({ error: "Authentication required" });
    }

    const staff = await deliveryStorage.getStaffMembers();
    res.json(staff);
  } catch (error) {
    console.error("Error fetching staff members:", error);
    res.status(500).json({ error: "Failed to fetch staff members" });
  }
});

// Find or create a staff member by name
deliveryRouter.post("/staff/find-or-create", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    // Validate input
    if (!req.body.name || typeof req.body.name !== 'string') {
      return res.status(400).json({ error: "Valid staff name is required" });
    }

    // Get all staff members
    const staffMembers = await deliveryStorage.getStaffMembers();

    // Try to find an exact match by name (case-insensitive)
    const staffName = req.body.name.trim();
    const existingStaff = staffMembers.find(
      s => s.name.toLowerCase() === staffName.toLowerCase()
    );

    if (existingStaff) {
      // Return the existing staff member
      return res.json(existingStaff);
    }

    // Create a new staff member with the provided name
    // Only include building and cost center if they're provided and valid
    let buildingId = null;
    let costCenterId = null;

    if (req.body.buildingId && !isNaN(parseInt(req.body.buildingId))) {
      buildingId = parseInt(req.body.buildingId);
    }

    if (req.body.costCenterId && !isNaN(parseInt(req.body.costCenterId))) {
      costCenterId = parseInt(req.body.costCenterId);
    }

    const newStaff = await deliveryStorage.createStaffMember({
      name: staffName,
      buildingId,
      costCenterId,
      email: typeof req.body.email === 'string' ? req.body.email : null,
      phone: typeof req.body.phone === 'string' ? req.body.phone : null,
      active: true
    });

    // Return the newly created staff member
    res.status(201).json(newStaff);
  } catch (error) {
    console.error("Error finding or creating staff member:", error);
    res.status(500).json({ error: "Failed to find or create staff member" });
  }
});

// Create a new staff member
deliveryRouter.post("/staff", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    const user = req.user || req.session?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    // Validate request body
    const parseResult = insertStaffMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid data", details: parseResult.error });
    }

    // Check for duplicate staff name
    const existingStaff = await deliveryStorage.getStaffMembers();
    const isDuplicate = existingStaff.some(
      s => s.name.toLowerCase() === parseResult.data.name.toLowerCase()
    );

    if (isDuplicate) {
      return res.status(400).json({ error: "A staff member with this name already exists" });
    }

    const member = await deliveryStorage.createStaffMember(parseResult.data);
    res.status(201).json(member);
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// Update an existing staff member
deliveryRouter.put("/staff/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Validate request body
    const parseResult = insertStaffMemberSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid data", details: parseResult.error });
    }

    // If name is being updated, check for duplicates
    if (parseResult.data.name) {
      const existingStaff = await deliveryStorage.getStaffMembers();
      const isDuplicate = existingStaff.some(
        s => Number(s.id) !== id && s.name.toLowerCase() === parseResult.data.name!.toLowerCase()
      );

      if (isDuplicate) {
        return res.status(400).json({ error: "A staff member with this name already exists" });
      }
    }

    const updated = await deliveryStorage.updateStaffMember(id, parseResult.data);
    if (!updated) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating staff member:", error);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

// Delete a staff member
deliveryRouter.delete("/staff/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permission denied - admin access only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const success = await deliveryStorage.deleteStaffMember(id);
    if (!success) {
      return res.status(404).json({ error: "Staff member not found or could not be deleted" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting staff member:", error);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

// Import staff members from Excel
deliveryRouter.post("/staff/import", upload.single("file"), async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permission denied - admin access only" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = join(process.cwd(), req.file.path);

    // Read staff members from Excel
    const { staffMembers, errors } = await deliveryStorage.readStaffMembersFromExcel(filePath);

    // Clean up the uploaded file
    await unlink(filePath).catch(err => console.error("Error deleting temp file:", err));

    // Check if there are any staff members to import
    if (staffMembers.length === 0) {
      return res.status(400).json({ error: "No valid staff members found in the file", errors });
    }

    // Get existing staff for duplicate checks
    const existingStaff = await deliveryStorage.getStaffMembers();

    // Import each staff member
    const importedStaff = [];
    const duplicateErrors = [];

    for (const member of staffMembers) {
      try {
        // Check for duplicate name
        const isDuplicate = existingStaff.some(
          s => s.name.toLowerCase() === member.name.toLowerCase()
        );

        if (isDuplicate) {
          duplicateErrors.push({ row: -1, message: `Staff member "${member.name}" already exists and was skipped` });
          continue;
        }

        const imported = await deliveryStorage.createStaffMember(member);
        importedStaff.push(imported);

        // Add to existingStaff for future duplicate checks
        existingStaff.push(imported);
      } catch (error) {
        console.error(`Error importing staff member ${member.name}:`, error);
        errors.push({ row: -1, message: `Failed to import staff member ${member.name}: ${error instanceof Error ? error.message : String(error)}` });
      }
    }

    // Combine validation errors and duplicate errors
    const allErrors = [...errors, ...duplicateErrors];

    res.status(200).json({
      success: true,
      totalRows: staffMembers.length,
      importedRows: importedStaff.length,
      errors: allErrors
    });
  } catch (error) {
    console.error("Error importing staff members:", error);
    res.status(500).json({ error: "Failed to import staff members" });
  }
});

// Export staff members to Excel
deliveryRouter.get("/staff/export", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin, student, or controller
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student' && req.user.role !== 'controller')) {
      return res.status(403).json({ error: "Permission denied - admin, student, or controller access only" });
    }

    console.log("Exporting staff members to Excel...");
    const staff = await deliveryStorage.getStaffMembers();
    console.log(`Found ${staff.length} staff members to export`);

    try {
      const excel = await deliveryStorage.generateStaffMembersExcel(staff);
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

// Get staff members template Excel
deliveryRouter.get("/staff/template", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permission denied - admin access only" });
    }

    const excel = deliveryStorage.generateStaffMembersTemplateExcel();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=staff-members-template.xlsx");
    res.send(excel);
  } catch (error) {
    console.error("Error generating staff members template:", error);
    res.status(500).json({ error: "Failed to generate staff members template" });
  }
});

// Get a specific staff member by ID
// Note: This route MUST come after all specific /staff/* routes
deliveryRouter.get("/staff/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const member = await deliveryStorage.getStaffMember(id);
    if (!member) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.json(member);
  } catch (error) {
    console.error("Error fetching staff member:", error);
    res.status(500).json({ error: "Failed to fetch staff member" });
  }
});

// -- Parts Delivery Routes --

// Generate deliveries template for import (MUST BE FIRST - no ID conflicts)
deliveryRouter.get("/parts-delivery/template", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and has proper permissions
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    console.log("Generating deliveries import template...");
    const templateBuffer = generateDeliveriesTemplateExcel();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=deliveries_import_template.xlsx');
    res.setHeader('Content-Length', templateBuffer.length);

    res.send(templateBuffer);
  } catch (error) {
    console.error("Error generating deliveries template:", error);
    res.status(500).json({ error: "Failed to generate template" });
  }
});



// Import deliveries from Excel file (MUST BE SECOND - no ID conflicts)
deliveryRouter.post("/parts-delivery/import", upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Importing deliveries from:", req.file.originalname);
    const { deliveries, errors } = readDeliveriesFromExcel(req.file.path);

    if (errors.length > 0) {
      console.log("Import errors:", errors);
      // Clean up uploaded file
      await unlink(req.file.path);
      return res.status(400).json({ 
        error: "File contains errors", 
        details: errors 
      });
    }

    // Import or update deliveries to database
    let importedCount = 0;
    let updatedCount = 0;
    const updatedDeliveries = [];

    for (const delivery of deliveries) {
      try {
        if (delivery.isUpdate && delivery.id) {
          // UPDATE existing delivery
          console.log(`Updating delivery ID ${delivery.id} with:`, delivery);

          // Get the original delivery for comparison
          const originalDelivery = await deliveryStorage.getPartsDeliveryById(delivery.id);
          if (!originalDelivery) {
            console.error(`Delivery with ID ${delivery.id} not found for update`);
            continue;
          }

          // Update the delivery
          const updatedDelivery = await deliveryStorage.updatePartsDelivery(delivery.id, delivery);
          if (updatedDelivery) {
            updatedCount++;

            // Check what changed and send email if needed
            const changes = [];
            if (delivery.quantity && delivery.quantity !== originalDelivery.quantity) {
              changes.push(`Quantity: ${originalDelivery.quantity} → ${delivery.quantity}`);
            }
            if (delivery.staffMember && delivery.staffMember !== originalDelivery.staffMember) {
              changes.push(`Staff Member: ${originalDelivery.staffMember} → ${delivery.staffMember}`);
            }
            if (delivery.notes && delivery.notes !== originalDelivery.notes) {
              changes.push(`Notes: "${originalDelivery.notes}" → "${delivery.notes}"`);
            }
            if (delivery.status && delivery.status !== originalDelivery.status) {
              changes.push(`Status: ${originalDelivery.status} → ${delivery.status}`);
            }
            if (delivery.deliveredAt && delivery.deliveredAt.getTime() !== originalDelivery.deliveredAt?.getTime()) {
              changes.push(`Date: ${originalDelivery.deliveredAt?.toLocaleDateString()} → ${delivery.deliveredAt.toLocaleDateString()}`);
            }

            // Send email notification if there were changes
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
          // CREATE new delivery
          await deliveryStorage.createPartsDelivery(delivery);
          importedCount++;
        }
      } catch (error) {
        console.error("Error importing/updating delivery:", error);
      }
    }

    // Clean up uploaded file
    await unlink(req.file.path);

    res.json({
      success: true,
      count: importedCount + updatedCount,
      message: updatedCount > 0 
        ? `Successfully updated ${updatedCount} and imported ${importedCount} deliveries` 
        : `Successfully imported ${importedCount} of ${deliveries.length} deliveries`,
      totalRows: deliveries.length,
      importedRows: importedCount,
      updatedRows: updatedCount,
      errors: deliveries.length - (importedCount + updatedCount) > 0 ? [`${deliveries.length - (importedCount + updatedCount)} records failed to process`] : []
    });
  } catch (error) {
    console.error("Error during deliveries import:", error);

    // Clean up uploaded file if it exists
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

// Get monthly deliveries count (for reporting) - MUST BE FIRST to avoid conflicts
deliveryRouter.get("/parts-delivery/monthly-count", async (req: Request, res: Response) => {
  try {
    // Get month parameter (format: MM/YYYY) or default to current month
    let monthParam = req.query.month as string;
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // If month parameter is provided, filter by that month
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-based in JS
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999); // Last day of month

      console.log(`Getting monthly delivery count for ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
    }

    // Get ALL deliveries (pending + completed) for count
    const allDeliveries = await deliveryStorage.getAllPartsDeliveriesWithDetails(startDate, endDate);
    res.json({ count: allDeliveries.length });
  } catch (error) {
    console.error("Error fetching monthly deliveries count:", error);
    res.status(500).json({ error: "Failed to fetch monthly deliveries count" });
  }
});

// Create a new parts delivery
deliveryRouter.post("/parts-delivery", async (req: Request, res: Response) => {
  try {
    // Log authentication status for debugging
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

    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    // Log the incoming request for debugging
    console.log("Incoming delivery request:", req.body);

    // Handle manual parts - create them in the parts table if needed
    let actualPartId = req.body.partId;

    if (req.body.isManualPart && req.body.manualPartName) {
      console.log("Processing manual part:", req.body.manualPartName);

      // Generate a unique part ID for the manual item
      const manualPartId = `MANUAL_${req.body.manualPartName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

      try {
        // Check if this manual part already exists
        const { pool } = await import("./db");
        const existingPart = await pool.query(`
          SELECT id FROM parts WHERE part_id = $1
        `, [manualPartId]);

        if (existingPart.rows.length > 0) {
          // Use existing manual part
          actualPartId = existingPart.rows[0].id;
          console.log("Using existing manual part with ID:", actualPartId);
        } else {
          // Create new manual part
          const newPart = await pool.query(`
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

    // Update the request body with the actual part ID
    const bodyForValidation = {
      ...req.body,
      partId: actualPartId
    };

    // Validate request body
    const parseResult = insertPartsDeliverySchema.safeParse(bodyForValidation);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid data", details: parseResult.error });
    }

    // Add the user ID as the deliverer and process the delivery date if provided
    const deliveryData = {
      ...parseResult.data,
      deliveredById: req.user.id
    };

    // Create a properly typed object to pass to the storage function
    const dataForStorage: any = { ...deliveryData };

    // Fix building_id and cost_center_id - convert 0 to null for optional foreign keys
    if (dataForStorage.buildingId === 0) {
      dataForStorage.buildingId = null;
    }
    if (dataForStorage.costCenterId === 0) {
      dataForStorage.costCenterId = null;
    }

    // Handle the date: priority order: 1. deliveredAt (from direct API calls), 2. deliveryDate (from forms), 3. current date
    if (req.body.deliveredAt) {
      console.log("Request includes deliveredAt:", req.body.deliveredAt);
      try {
        if (typeof req.body.deliveredAt === 'string') {
          // Parse ISO format or yyyy-MM-dd format
          if (req.body.deliveredAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Handle simple date format (yyyy-MM-dd)
            const [year, month, day] = req.body.deliveredAt.split('-').map(Number);
            dataForStorage.deliveredAt = new Date(year, month - 1, day, 12, 0, 0);
          } else {
            // Handle ISO format or other date strings
            dataForStorage.deliveredAt = new Date(req.body.deliveredAt);
          }
          console.log("Converted deliveredAt to:", dataForStorage.deliveredAt);
        } else if (req.body.deliveredAt instanceof Date) {
          dataForStorage.deliveredAt = req.body.deliveredAt;
        }
      } catch (err) {
        console.error("Error parsing deliveredAt date:", err);
        // Will fall back to current date below if parsing fails
      }
    } else if (req.body.deliveryDate) {
      console.log("Request includes deliveryDate:", req.body.deliveryDate);
      try {
        dataForStorage.deliveredAt = new Date(req.body.deliveryDate);
        console.log("Converted deliveryDate to deliveredAt:", dataForStorage.deliveredAt);
      } catch (err) {
        console.error("Error parsing deliveryDate:", err);
        // Will fall back to current date below if parsing fails
      }
    }

    // Ensure we have a valid date (default to current if not provided or parsing failed)
    if (!dataForStorage.deliveredAt || isNaN(dataForStorage.deliveredAt.getTime())) {
      console.log("Using current date as fallback");
      dataForStorage.deliveredAt = new Date();
    }

    console.log("Creating delivery with date:", dataForStorage);
    const delivery = await deliveryStorage.createPartsDelivery(dataForStorage);
    res.status(201).json(delivery);
  } catch (error) {
    console.error("Error creating parts delivery:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create parts delivery";
    res.status(500).json({ error: errorMessage });
  }
});

// Create a batch delivery (multiple items, one signature)
deliveryRouter.post("/parts-delivery/batch", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    const { parts, staffMemberId, buildingId, costCenterId, deliveredAt, notes } = req.body;

    // Validate that we have parts and a staff member
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({ error: "At least one part is required" });
    }

    if (!staffMemberId || typeof staffMemberId !== 'number') {
      return res.status(400).json({ error: "Valid staff member ID is required" });
    }

    console.log(`Creating delivery batch for staff member ${staffMemberId} with ${parts.length} items`);

    // Create a batch ID using timestamp to group related deliveries
    const batchId = `BATCH_${Date.now()}_${staffMemberId}`;

    // Parse the delivery date properly
    let parsedDeliveryDate: Date;
    if (deliveredAt) {
      if (typeof deliveredAt === 'string') {
        // If it's a date string like '2025-05-27', convert it to a proper Date
        parsedDeliveryDate = new Date(deliveredAt + 'T16:00:00.000Z');
      } else {
        parsedDeliveryDate = new Date(deliveredAt);
      }
    } else {
      parsedDeliveryDate = new Date();
    }

    console.log(`Parsed delivery date: ${parsedDeliveryDate.toISOString()}`);

    // Create individual deliveries for each part but with a shared batch identifier in notes
    const deliveries = [];
    for (const part of parts) {
      let actualPartId = part.partId;

      // Handle manual parts
      if (part.isManualPart && part.manualPartName) {
        console.log("Processing manual part in batch:", part.manualPartName);

        // Generate a unique part ID for the manual item
        const manualPartId = `MANUAL_${part.manualPartName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

        try {
          // Check if this manual part already exists
          const { pool } = await import("./db");
          const existingPart = await pool.query(`
            SELECT id FROM parts WHERE part_id = $1
          `, [manualPartId]);

          if (existingPart.rows.length > 0) {
            // Use existing manual part
            actualPartId = existingPart.rows[0].id;
            console.log("Using existing manual part with ID:", actualPartId);
          } else {
            // Create new manual part
            const newPart = await pool.query(`
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
        notes: notes || ''  // Remove batch ID from user-visible notes
      };

      const delivery = await deliveryStorage.createPartsDelivery(deliveryData);
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

// Get all parts deliveries with details
deliveryRouter.get("/parts-delivery", async (req: Request, res: Response) => {
  try {
    // Get month parameter (format: MM/YYYY) or default to current month
    let monthParam = req.query.month as string;
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // If month parameter is provided, filter by that month
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-based in JS
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999); // Last day of month

      console.log(`Getting deliveries for month ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
    }

    // Use all deliveries for the main list to show complete history
    const deliveries = await deliveryStorage.getAllPartsDeliveriesWithDetails(startDate, endDate);
    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching parts deliveries:", error);
    res.status(500).json({ error: "Failed to fetch parts deliveries" });
  }
});

// Get recent parts deliveries with details
deliveryRouter.get("/parts-delivery/recent/:limit", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.params.limit);
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ error: "Invalid limit format" });
    }

    // Get month parameter (format: MM/YYYY) or default to current month
    let monthParam = req.query.month as string;
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // If month parameter is provided, filter by that month
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-based in JS
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999); // Last day of month

      console.log(`Getting recent deliveries for month ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
    }

    // Get recent deliveries with date range filter if provided
    const deliveries = await deliveryStorage.getRecentPartsDeliveriesWithDetails(limit, startDate, endDate);
    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching recent parts deliveries:", error);
    res.status(500).json({ error: "Failed to fetch recent parts deliveries" });
  }
});

// Get monthly deliveries total (for dashboard)
deliveryRouter.get("/parts-delivery/monthly-total", async (req: Request, res: Response) => {
  try {
    // Get month parameter (format: MM/YYYY) or default to current month
    let monthParam = req.query.month as string;
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // If month parameter is provided, filter by that month
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-based in JS
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999); // Last day of month

      console.log(`Getting monthly delivery total for ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
    }

    // Get total with date range filter if provided
    const total = await deliveryStorage.getMonthlyPartsDeliveriesTotal(startDate, endDate);
    res.json({ total });
  } catch (error) {
    console.error("Error fetching monthly deliveries total:", error);
    res.status(500).json({ error: "Failed to fetch monthly deliveries total" });
  }
});

// Confirm delivery with signature
deliveryRouter.post("/parts-delivery/:id/confirm", async (req: Request, res: Response) => {
  try {
    console.log(`🚨 DELIVERY CONFIRMATION STARTED for delivery ${req.params.id}`);
    console.log(`🚨 Request body:`, req.body);
    console.log(`🚨 User authenticated:`, !!req.user);
    
    // Check if the user is authenticated
    if (!req.user) {
      console.log(`🚨 AUTHENTICATION FAILED - no user in session`);
      return res.status(401).json({ error: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      console.log(`🚨 INVALID ID FORMAT: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    console.log(`🚨 PROCESSING DELIVERY CONFIRMATION for ID: ${id}`);

    // Get the original delivery
    const delivery = await deliveryStorage.getPartsDeliveryWithDetails(id);
    if (!delivery) {
      return res.status(404).json({ error: "Parts delivery not found" });
    }

    // Create update object with properly typed status
    const updateData: any = {
      status: 'delivered' as 'pending' | 'delivered' | 'cancelled',
      confirmedAt: new Date()
    };

    // Add signature if provided (optional, especially on desktop)
    if (req.body.signature && typeof req.body.signature === 'string') {
      updateData.signature = req.body.signature;
    }

    // Check if this is a desktop confirmation (no signature)
    const isDesktop = req.body.isDesktop === true || req.body.bypassSignature === true;

    // Log the confirmation method
    console.log(`Confirming delivery ${id} - ${isDesktop ? 'Desktop (no signature)' : 'With signature'}`);

    // Update the delivery with signature and mark as delivered
    const updatedDelivery = await deliveryStorage.updatePartsDelivery(id, updateData);
    if (!updatedDelivery) {
      return res.status(500).json({ error: "Failed to update delivery" });
    }

    // Get the complete staff member details with relations
    const staffMember = await deliveryStorage.getStaffMember(delivery.staffMemberId);
    if (!staffMember) {
      console.error(`Staff member not found for delivery ${id}, cannot send email notification`);
    } else {
      // Get a fresh copy of the delivery with all details
      const freshDelivery = await deliveryStorage.getPartsDeliveryWithDetails(id);
      if (freshDelivery) {
        // Send email notification synchronously - FIXED to pass only delivery object
        try {
          console.log(`🔥 CRITICAL EMAIL FIX: Sending delivery confirmation email for delivery ${id}`);
          console.log(`   📧 Staff: ${staffMember.name} (${staffMember.email})`);
          console.log(`   📦 Part: ${freshDelivery.part?.name}`);
          
          const { queueDeliveryForBulkEmail } = await import('./bulk-email-service');
          queueDeliveryForBulkEmail(freshDelivery, staffMember.email);
          console.log(`✅ DELIVERY QUEUED for bulk email to ${staffMember.name} (${staffMember.email})`);
          console.log(`   📧 Will be included in next automated email batch`);
          console.log(`   📦 Part: ${freshDelivery.part?.name} (Qty: ${freshDelivery.quantity})`);
        } catch (emailError) {
          console.error(`❌ DELIVERY EMAIL SYSTEM ERROR:`, emailError);
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

// Export deliveries to Excel
deliveryRouter.get("/parts-delivery/export", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and has proper permissions
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    // Get month parameter (format: MM/YYYY) or default to current month
    let monthParam = req.query.month as string;
    let monthDate: Date;

    // Parse month parameter or use current month
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      monthDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-based in JS
    } else {
      const now = new Date();
      monthDate = new Date(now.getFullYear(), now.getMonth(), 1);
      monthParam = `${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`; // Format as MM/YYYY
    }

    // Get the start and end dates for filtering
    const startDate = new Date(monthDate);
    const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log(`Exporting deliveries for month ${monthParam} (${startDate.toISOString()} to ${endDate.toISOString()})...`);

    const allDeliveries = await deliveryStorage.getAllPartsDeliveriesWithDetails();

    // Filter deliveries by month
    const deliveries = allDeliveries.filter(delivery => {
      const deliveredAt = delivery.deliveredAt ? new Date(delivery.deliveredAt) : null;
      return deliveredAt && deliveredAt >= startDate && deliveredAt <= endDate;
    });

    console.log(`Found ${deliveries.length} deliveries for month ${monthParam}`);

    try {
      // Pass the month parameter to the Excel generation function
      const excel = await deliveryStorage.generateDeliveriesExcel(deliveries, monthParam);
      console.log("Deliveries Excel file generated successfully");

      // Set a better filename with the month included
      const filename = `parts-deliveries-${monthParam.replace('/', '-')}.xlsx`;

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



// Get a specific parts delivery with details
deliveryRouter.get("/parts-delivery/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const delivery = await deliveryStorage.getPartsDeliveryWithDetails(id);
    if (!delivery) {
      return res.status(404).json({ error: "Parts delivery not found" });
    }

    res.json(delivery);
  } catch (error) {
    console.error("Error fetching parts delivery:", error);
    res.status(500).json({ error: "Failed to fetch parts delivery" });
  }
});

// Update a parts delivery
deliveryRouter.put("/parts-delivery/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Get the original delivery to compare quantities
    const originalDelivery = await deliveryStorage.getPartsDeliveryWithDetails(id);
    if (!originalDelivery) {
      return res.status(404).json({ error: "Parts delivery not found" });
    }

    // Validate request body - with debug logging
    console.log("Delivery update: Received request body:", JSON.stringify(req.body));

    // Create a modified request body where we preprocess the date
    const modifiedBody = { ...req.body };

    // Handle date conversion for update (more flexible validation)
    if (modifiedBody.deliveredAt && typeof modifiedBody.deliveredAt === 'string') {
      try {
        // Don't try to validate as a date yet, we'll convert it later in storage
        console.log("Delivery update: Found date string:", modifiedBody.deliveredAt);
        // Keep it as a string - we'll convert in the storage function
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

    // Update the delivery
    let updatedDelivery;
    try {
      updatedDelivery = await deliveryStorage.updatePartsDelivery(id, parseResult.data);
      if (!updatedDelivery) {
        return res.status(404).json({ error: "Parts delivery not found or could not be updated" });
      }

      console.log("Delivery update: Successfully updated delivery:", JSON.stringify(updatedDelivery));
    } catch (err) {
      console.error("Delivery update: Error in updatePartsDelivery:", err);
      throw err;
    }

    // Send update email notification to staff member
    try {
      // Get the updated delivery with details for email
      const updatedDeliveryWithDetails = await deliveryStorage.getPartsDeliveryWithDetails(id);
      if (updatedDeliveryWithDetails && updatedDeliveryWithDetails.staffMember) {

        // Determine the type of update for better email messaging
        let updateType: 'modified' | 'quantity_changed' | 'date_changed' | 'general' = 'modified';

        if (originalDelivery.quantity !== updatedDelivery.quantity) {
          updateType = 'quantity_changed';
        } else if (originalDelivery.deliveredAt !== updatedDelivery.deliveredAt) {
          updateType = 'date_changed';
        }

        // Send update email (don't wait for it to complete)
        sendDeliveryUpdateEmail(
          updatedDeliveryWithDetails,
          updatedDeliveryWithDetails.staffMember,
          [`Updated via ${updateType} by ${req.session.user?.name || 'System'}`]
        ).catch(err => {
          console.error(`Error sending delivery update email for delivery ${id}:`, err);
        });

        console.log(`Delivery update email queued for staff member: ${updatedDeliveryWithDetails.staffMember.name}`);
      }
    } catch (emailError) {
      console.error("Error preparing delivery update email:", emailError);
      // Don't fail the update if email fails
    }

    res.json(updatedDelivery);
  } catch (error) {
    console.error("Error updating parts delivery:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update parts delivery";
    res.status(500).json({ error: errorMessage });
  }
});

// Delete a parts delivery
deliveryRouter.delete("/parts-delivery/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and is admin or student
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ error: "Permission denied - admin or student access only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    console.log(`Attempting to delete delivery with ID: ${id}`);

    try {
      const success = await deliveryStorage.deletePartsDelivery(id);
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

// Get downloadable receipt for a delivery
deliveryRouter.get("/:id/receipt", async (req: Request, res: Response) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const { deliveryReceipts } = await import('./simple-receipt-service');
    
    const receipt = deliveryReceipts[deliveryId];
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // Return HTML receipt for viewing/downloading
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="delivery-receipt-${deliveryId}.html"`);
    res.send(receipt);
  } catch (error) {
    console.error("Error retrieving delivery receipt:", error);
    res.status(500).json({ error: "Failed to retrieve receipt" });
  }
});

// Delivery Import/Export Routes
import { 
  readDeliveriesFromExcel, 
  generateDeliveriesExcel, 
  generateDeliveriesTemplateExcel 
} from "./excel";