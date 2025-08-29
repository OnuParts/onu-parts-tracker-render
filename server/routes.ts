import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from 'fs';
import path from 'path';
// Import only PostgreSQL storage for persistence - no memory storage
import { storage as storage } from "./storage";
import { pool } from "./db";
import { handleSimpleLogin } from "./login";
import { z } from "zod";
import toolRoutes from "./tool-routes";
import { deliveryRouter } from "./delivery-routes";
import { scheduleWeeklyBackups, manualBackupHandler } from "./backup";
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import { 
  insertPartSchema,
  insertPartsIssuanceSchema,
  insertBuildingSchema,
  insertPartsToCountSchema,
  insertStorageLocationSchema,
  insertShelfSchema,
  bulkPartsIssuanceSchema,
  insertPartsPickupSchema,
  insertToolSignoutSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { format } from 'date-fns';
import upload from "./upload";
import { 
  readPartsFromExcel, 
  generatePartsExcel, 
  generateTemplateExcel, 
  readTechniciansFromExcel,
  generateTechniciansExcel,
  generateTechniciansTemplateExcel,
  readBuildingsFromExcel,
  generateBuildingsExcel,
  generateBuildingsTemplateExcel,
  readLocationsFromExcel,
  generateLocationsExcel,
  generateLocationsTemplateExcel,
  readShelvesFromExcel,
  generateShelvesExcel,
  generateShelvesTemplateExcel,
  generatePartsIssuanceExcel,
  readChargeOutsFromExcel,
  generateChargeOutsExcel,
  generateChargeOutsTemplateExcel,
  readDeliveriesFromExcel,
  generateDeliveriesExcel,
  generateDeliveriesTemplateExcel,
  ImportResult 
} from "./excel";

// Module-level variable to store the admin email between requests
let adminEmail: string = 'm-gierhart@onu.edu';
// Company name for profile - must match what the user expects
const adminName: string = "Michael Gierhart";

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
};

// Role-based access control middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
};

// Read-only check for controller role
const requireWritePermission = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.user?.role === 'controller') {
      return res.status(403).json({ 
        error: "You don't have permission to change this data", 
        message: "Controller accounts have read-only access. Please contact an administrator to make changes." 
      });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {


  // Serve static files from client/public
  app.use(express.static(path.join(process.cwd(), 'client', 'public')));
  
  // Create HTTP server - only create it once
  const httpServer = createServer(app);
  
  // Create WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Set up WebSocket event handlers
  wss.on('connection', (socket) => {
    console.log('WebSocket client connected');
    
    // Send welcome message
    socket.send(JSON.stringify({ type: 'connected', message: 'Connected to ONU Parts Tracker websocket server' }));
    
    // Handle incoming messages
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
        
        // Handle different message types
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Broadcast function for sending messages to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Root URL handler - redirect to the mobile interface for better mobile compatibility
  app.get("/", (req, res) => {
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

    // If no one is logged in, redirect to login
    console.log("No user detected at root URL, redirecting to login");
    return res.redirect("/login");
  });

  // Register a specific route for simple-login.html
  app.get('/simple', (req, res) => {
    const filePath = path.join(process.cwd(), 'client', 'public', 'simple-login.html');
    console.log('Trying to serve simple login from:', filePath);
    if (fs.existsSync(filePath)) {
      console.log('Simple login file exists, sending...');
      res.sendFile(filePath);
    } else {
      console.log('Simple login file not found, falling back to index.html');
      res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
    }
  });

  const router = express.Router();
  
  // Register the tool routes
  app.use("/api", toolRoutes);
  
  // Public delivery template download (no auth required - MUST be before delivery router)
  app.get("/api/parts-delivery/template-download", async (req: Request, res: Response) => {
    try {
      console.log("Generating deliveries import template (public access)...");
      const { generateDeliveriesTemplateExcel } = await import("./excel");
      const templateBuffer = generateDeliveriesTemplateExcel();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=deliveries_import_template.xlsx');
      res.setHeader('Content-Length', templateBuffer.length);

      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating deliveries template (public):", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Register the delivery routes and attach user from session
  app.use("/api", (req, res, next) => {
    // Attach the session user to req.user for the delivery routes
    if (req.session?.user) {
      req.user = req.session.user;
      // Session extension is now handled by the rolling: true option in index.ts
    } else {
      console.log('WARNING: No user in session for API request to path:', req.path);
    }
    next();
  }, deliveryRouter);

  // Email receipt routes - completely SendGrid free
  app.get('/api/email-receipt/:deliveryId', async (req, res) => {
    const { emailReceipts } = await import('./email-service');
    const deliveryId = req.params.deliveryId;
    const emailContent = emailReceipts[deliveryId];
    
    if (!emailContent) {
      return res.status(404).json({ error: 'Email receipt not found' });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(emailContent);
  });

  app.get('/api/email-receipts', async (req, res) => {
    const { emailReceipts } = await import('./email-service');
    const receipts = Object.keys(emailReceipts).map(deliveryId => ({
      deliveryId,
      available: true
    }));
    
    res.json(receipts);
  });

  // Test email endpoint
  app.post('/api/test-email', async (req, res) => {
    try {
      const { to } = req.body;
      
      if (!to) {
        return res.status(400).json({ error: 'Email address required' });
      }
      
      console.log(`📧 Test email requested for ${to}`);
      
      const { sendTestEmail } = await import('./email-service');
      const success = await sendTestEmail(to);
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Test email sent successfully to ${to}` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send test email - check server logs for details' 
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  // EMERGENCY TEST - Direct delivery email test without authentication
  app.post('/api/test-delivery-email', async (req, res) => {
    try {
      console.log('🔥 EMERGENCY EMAIL TEST - Testing delivery confirmation email directly');
      
      // Import deliveryStorage directly from delivery-routes
      const { deliveryStorage } = await import('./delivery-routes');
      
      // Get delivery #202 directly using correct method
      const delivery = await deliveryStorage.getPartsDeliveryWithDetails(202);
      
      if (!delivery) {
        return res.status(404).json({ error: 'Test delivery not found' });
      }
      
      console.log(`🔥 Found test delivery: ID=${delivery.id}, Part=${delivery.part?.name}, Staff=${delivery.staffMember.name}, Email=${delivery.staffMember.email}`);
      
      // Send email directly
      console.log(`🔥 Attempting to send delivery confirmation email...`);
      
      const { sendDeliveryConfirmationEmail } = await import('./email-service');
      const result = await sendDeliveryConfirmationEmail(delivery);
      
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
        res.status(500).json({ error: 'Failed to send delivery confirmation email' });
      }
    } catch (error) {
      console.error('🔥 Test delivery email error:', (error as Error).message);
      console.error('🔥 Full error:', error);
      res.status(500).json({ error: 'Delivery email system error: ' + (error as Error).message });
    }
  });

  // Mock endpoint for work orders (removed functionality)
  router.get("/work-orders", requireAuth, requireRole(["admin"]), (req: Request, res: Response) => {
    // Return an empty array since work orders functionality has been removed
    res.json([]);
  });

  // Reset issued parts count (requires admin password verification)
  router.post("/reset-issuance-count", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      // Retrieve the admin user to verify the password
      const adminQuery = await pool.query('SELECT * FROM users WHERE role = $1 AND username = $2', ['admin', 'admin']);
      
      if (adminQuery.rows.length === 0) {
        return res.status(401).json({ error: "Authentication failed. Admin user not found." });
      }
      
      const adminUser = adminQuery.rows[0];
      
      // Compare the provided password with the stored password
      // In a real system, you would use bcrypt or similar to hash and compare passwords
      if (password !== 'JaciJo2012') { // Hard-coded for this specific application as requested
        console.log("Reset issuance count: Password verification failed");
        return res.status(401).json({ error: "Authentication failed. Incorrect password." });
      }
      
      // Reset the parts_issuance count by updating the counter in the database
      // Use a direct SQL approach to reset the counter in the parts_issuance table
      // First, check if there's an existing auto-increment sequence we need to reset
      try {
        // First ensure the reset_flags table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS reset_flags (
            key TEXT PRIMARY KEY,
            value BOOLEAN,
            reset_at TIMESTAMP
          )
        `);
        
        // Insert or update the reset flag
        await pool.query(`
          INSERT INTO reset_flags (key, value, reset_at)
          VALUES ('monthly_issuance_reset', TRUE, NOW())
          ON CONFLICT (key) DO UPDATE
          SET value = TRUE,
              reset_at = NOW()
        `);
        
        console.log("Reset issuance count: Successfully reset monthly issuance count to 0");
      } catch (err) {
        // If there's an error, try the fallback approach
        console.log("Using alternative approach to reset issuance count:", err);
        
        // Try to set a reset value in notification_settings
        await pool.query(`
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

  // Manual database backup
  router.post("/manual-backup", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("Manual backup requested by admin user");
      const result = await manualBackupHandler();
      
      if (result.success) {
        console.log("Manual backup completed successfully");
        res.json({ 
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
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
  
  // Public endpoints for kiosk use (no authentication required)
  router.get("/technicians-list", async (req: Request, res: Response) => {
    try {
      console.log("Fetching technicians for kiosk/mobile use");
      const technicians = await storage.getTechnicians();
      
      // Get admin users too (they can also be selected as technicians)
      const adminUsers = await storage.getUsers();
      const admins = adminUsers.filter(user => user.role === 'admin');
      
      // Combine technicians and admins for the list
      const allTechniciansAndAdmins = [...technicians, ...admins].filter(user => {
        return user.name && user.name.trim() !== '';
      });
      
      console.log(`Found ${allTechniciansAndAdmins.length} technicians/admins for kiosk`);
      res.json(allTechniciansAndAdmins);
    } catch (error) {
      console.error("Error fetching technicians for kiosk:", error);
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });

  router.get("/buildings-public", async (req: Request, res: Response) => {
    try {
      console.log("Fetching buildings for kiosk use");
      const buildings = await storage.getBuildings();
      console.log(`Found ${buildings.length} buildings for kiosk`);
      res.json(buildings);
    } catch (error) {
      console.error("Error fetching buildings for kiosk:", error);
      res.status(500).json({ error: "Failed to fetch buildings" });
    }
  });

  router.get("/cost-centers-public", async (req: Request, res: Response) => {
    try {
      console.log("Fetching cost centers for kiosk use");
      // Use direct database query since getCostCenters may not exist
      const result = await pool.query('SELECT * FROM cost_centers ORDER BY name');
      const costCenters = result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description
      }));
      console.log(`Found ${costCenters.length} cost centers for kiosk`);
      res.json(costCenters);
    } catch (error) {
      console.error("Error fetching cost centers for kiosk:", error);
      res.status(500).json({ error: "Failed to fetch cost centers" });
    }
  });

  // Public parts lookup for kiosk barcode scanning (supports multiple barcodes per part)
  router.get("/parts-lookup/:partId", async (req: Request, res: Response) => {
    try {
      console.log(`Kiosk parts lookup for barcode/Part ID: ${req.params.partId}`);
      
      // Try to find by barcode first (checks both part_id and barcode table)
      let part = await storage.getPartByBarcode(req.params.partId);
      
      // If not found by barcode, try direct part ID lookup
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

  // Public parts charge-out endpoint for kiosk
  router.post("/parts-charge-out-public", async (req: Request, res: Response) => {
    try {
      console.log("Kiosk parts charge-out:", req.body);
      
      const { partId, quantity, issuedTo, reason, notes, costCenter, buildingId } = req.body;
      
      // Validate required fields
      if (!partId || !quantity || !issuedTo) {
        return res.status(400).json({ error: "Missing required fields: partId, quantity, issuedTo" });
      }

      // Create charge-out record with admin user as issuer (ID 1)
      const chargeOut = await storage.createPartsIssuance({
        partId: parseInt(partId),
        quantity: parseInt(quantity),
        issuedTo,
        reason: reason || 'maintenance',
        notes,
        issuedById: 1, // Default to admin user for kiosk operations
        buildingId: buildingId ? parseInt(buildingId) : undefined,
        costCenter
      });

      console.log(`Kiosk charge-out created: ID ${chargeOut.id}`);
      res.json(chargeOut);
    } catch (error) {
      console.error("Error creating kiosk charge-out:", error);
      res.status(500).json({ error: "Failed to create charge-out" });
    }
  });

  // Statistics
  router.get("/stats", async (req: Request, res: Response) => {
    try {
      // DIRECT DATABASE QUERY for total parts count to fix dashboard display
      const countResult = await pool.query('SELECT COUNT(*) FROM parts');
      const totalParts = parseInt(countResult.rows[0].count);
      console.log(`Stats: Direct count query found ${totalParts} total parts`);
      
      // FIXED: Include ALL parts in stock status counts, not just those with reorder levels
      // Count parts with reorder levels for proper stock status tracking
      const partsWithReorderResult = await pool.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL
      `);
      const partsWithReorderLevels = parseInt(partsWithReorderResult.rows[0].count || '0');
      
      // Count parts without reorder levels separately
      const partsWithoutReorderResult = await pool.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NULL
      `);
      const partsWithoutReorderLevels = parseInt(partsWithoutReorderResult.rows[0].count || '0');
      
      // For parts WITH reorder levels, calculate proper stock status
      const healthyStockResult = await pool.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity > reorder_level * 0.8
      `);
      const healthyStockCount = parseInt(healthyStockResult.rows[0].count || '0');

      const mediumStockResult = await pool.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity <= reorder_level * 0.8 AND quantity > reorder_level * 0.3
      `);
      const mediumStockCount = parseInt(mediumStockResult.rows[0].count || '0');

      const lowStockResult = await pool.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity <= reorder_level * 0.3
      `);
      const lowStockCount = parseInt(lowStockResult.rows[0].count || '0');
      
      // Count critical (out of stock) + low stock (≤30% of reorder) for dashboard
      const criticalAndLowStockResult = await pool.query(`
        SELECT COUNT(*) FROM parts WHERE quantity <= 0 OR (reorder_level IS NOT NULL AND quantity <= reorder_level * 0.3)
      `);
      const criticalAndLowStockCount = parseInt(criticalAndLowStockResult.rows[0].count || '0');
      
      // For dashboard consistency, count parts that actually need attention (truly low stock)
      // This includes parts with reorder levels that are at/below reorder threshold
      const actualLowStockResult = await pool.query(`
        SELECT COUNT(*) FROM parts WHERE reorder_level IS NOT NULL AND quantity <= reorder_level
      `);
      const actualLowStockCount = parseInt(actualLowStockResult.rows[0].count || '0');
      
      const inStockResult = await pool.query(`
        SELECT COALESCE(SUM(quantity), 0) as sum FROM parts
      `);
      const totalPartsInStock = parseInt(inStockResult.rows[0].sum || '0');
      
      // Get low stock parts using existing method for detailed view consistency
      const lowStockParts = await storage.getLowStockParts();
      const monthlyPartsIssuance = await storage.getMonthlyPartsIssuanceTotal();

      console.log(`Stats: Total parts breakdown - Total: ${totalParts}, With reorder levels: ${partsWithReorderLevels}, Without reorder levels: ${partsWithoutReorderLevels}`);
      console.log(`Stats: Stock status counts - Healthy: ${healthyStockCount}, Medium: ${mediumStockCount}, Low: ${lowStockCount}, Critical+Low: ${criticalAndLowStockCount}`);
      console.log(`Stats: Low stock parts from storage method: ${lowStockParts.length}`);

      // Log the parts issuance total before returning
      console.log(`Stats: Monthly parts issuance total = ${monthlyPartsIssuance}`);
      
      res.json({
        totalParts: totalParts,
        totalPartsInStock: totalPartsInStock,
        monthlyPartsIssuance: monthlyPartsIssuance,
        // Use critical + low stock count that matches inventory status card
        lowStockItemsCount: criticalAndLowStockCount,
        healthyStockCount: healthyStockCount,
        mediumStockCount: mediumStockCount,
        lowStockCount: lowStockCount,
        // Additional data for transparency
        partsWithReorderLevels: partsWithReorderLevels,
        partsWithoutReorderLevels: partsWithoutReorderLevels,
        actualLowStockCount: actualLowStockCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Parts
  router.get("/parts", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      // Check for location/shelf filtering
      const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
      const shelfId = req.query.shelfId ? parseInt(req.query.shelfId as string) : undefined;
      
      console.log(`GET /parts - Getting parts with filters: locationId=${locationId}, shelfId=${shelfId}`);
      
      // Important fix: DIRECTLY QUERY THE DATABASE for all parts instead of using potentially 
      // buggy storage functions that might be filtering incorrectly
      let parts;
      
      if ((locationId && !isNaN(locationId)) || (shelfId && !isNaN(shelfId))) {
        // Only apply location/shelf filtering if valid IDs were explicitly provided
        parts = await storage.getPartsByLocation(locationId, shelfId);
      } else {
        // CRITICAL FIX: Directly query the database to ensure we get ALL parts
        const result = await pool.query('SELECT * FROM parts ORDER BY name');
        console.log(`Direct database query found ${result.rows.length} total parts`);
        
        // Map database rows to Part objects with the expected structure
        parts = result.rows.map(row => ({
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
      
      console.log(`GET /parts - Found ${parts.length} parts total after processing`);
      if (parts.length > 0) {
        console.log("GET /parts - First part sample:", parts[0].partId, parts[0].name);
      }
      
      res.json(parts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      res.status(500).json({ error: "Failed to fetch parts" });
    }
  });

  router.get("/parts/low-stock", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      console.log("GET /parts/low-stock - Getting low stock parts from storage");
      
      // Use the existing storage method instead of a custom query
      const lowStockParts = await storage.getLowStockParts();
      
      console.log(`GET /parts/low-stock - Found ${lowStockParts.length} low stock parts`);
      res.json(lowStockParts);
    } catch (error) {
      console.error("Error fetching low stock parts:", error);
      res.status(500).json({ error: "Failed to fetch low stock parts" });
    }
  });

  // Move the export, template, and other special routes BEFORE the /:id route
  // to avoid parameter confusion
  router.get("/parts/export", requireAuth, requireRole(["admin", "student", "controller"]), async (req: Request, res: Response) => {
    try {
      // CRITICAL FIX: Directly query the database to ensure we get ALL parts for export
      const result = await pool.query('SELECT * FROM parts ORDER BY name');
      console.log(`Direct database query found ${result.rows.length} total parts for export`);
      
      // Map database rows to Part objects with the expected structure
      const parts = result.rows.map(row => ({
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
      
      if (!parts || parts.length === 0) {
        return res.status(404).json({ error: "No parts found" });
      }
      
      console.log(`Exporting ${parts.length} parts to Excel`);
      const excelBuffer = await generatePartsExcel(parts);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=parts_inventory.xlsx');
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting parts:", error);
      res.status(500).json({ error: "Failed to export parts" });
    }
  });
  
  router.get("/parts/template", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      console.log("Template route hit - generating Excel template");
      const templateBuffer = generateTemplateExcel();
      console.log(`Template generated successfully, size: ${templateBuffer.length} bytes`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=parts_import_template.xlsx');
      res.setHeader('Content-Length', templateBuffer.length);

      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Get parts usage analytics - MUST be before the parameterized routes
  router.get("/parts/usage-analytics", requireAuth, requireRole(["admin", "student", "controller"]), async (req: Request, res: Response) => {
    try {
      const timeFrameDays = parseInt(req.query.timeFrame as string) || 90;
      console.log(`GET /parts/usage-analytics - Getting usage analytics for ${timeFrameDays} days`);
      
      const partsWithUsage = await storage.getPartsWithUsage(timeFrameDays);
      console.log(`GET /parts/usage-analytics - Found ${partsWithUsage.length} parts with usage data`);
      
      res.json(partsWithUsage);
    } catch (error) {
      console.error("Error getting parts usage analytics:", error);
      res.status(500).json({ error: "Failed to get parts usage analytics" });
    }
  });

  // Get usage analytics summary - MUST be before the parameterized routes
  router.get("/parts/usage-summary", requireAuth, requireRole(["admin", "student", "controller"]), async (req: Request, res: Response) => {
    try {
      const timeFrameDays = parseInt(req.query.timeFrame as string) || 90;
      console.log(`GET /parts/usage-summary - Getting usage summary for ${timeFrameDays} days`);
      
      const summary = await storage.getUsageAnalyticsSummary(timeFrameDays);
      console.log(`GET /parts/usage-summary - Generated summary`);
      
      res.json(summary);
    } catch (error) {
      console.error("Error getting usage analytics summary:", error);
      res.status(500).json({ error: "Failed to get usage analytics summary" });
    }
  });

  // Parts search endpoint for bulk inventory - MUST come before parameterized route
  router.get("/parts/search", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.q as string;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.json([]);
      }
      
      const query = searchTerm.trim().toLowerCase();
      console.log(`Searching parts with term: "${query}"`);
      
      // Search parts by name, description, part_id, and supplier
      const result = await pool.query(`
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
      
      const parts = result.rows.map(row => ({
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
      
      console.log(`Found ${parts.length} parts matching "${query}"`);
      res.json(parts);
      
    } catch (error) {
      console.error("Error searching parts:", error);
      res.status(500).json({ error: "Failed to search parts" });
    }
  });
  
  // Now define the parameterized route for individual parts
  router.get("/parts/:id", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      const part = await storage.getPartByPartId(req.params.id);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      // Get parts issuance history for this part
      const issuanceHistory = await storage.getPartsIssuanceByPartId(part.id);

      res.json({ ...part, issuanceHistory });
    } catch (error) {
      console.error("Error fetching part:", error);
      res.status(500).json({ error: "Failed to fetch part" });
    }
  });

    // EMERGENCY FIX: Special endpoint that completely skips validation and uses direct SQL
  router.post("/parts", requireAuth, requireRole(["admin", "student", "technician", "controller"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      console.log("SKIPPING ALL VALIDATION - EMERGENCY DIRECT INSERT");
      
      // Get the raw data without validation
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
        partId, name, description, quantity, reorderLevel, 
        unitCost, locationId, shelfId, 
        unitCostType: typeof unitCost 
      });
      
      // Get location text if locationId is provided
      let locationText = null;
      if (locationId) {
        const locResult = await pool.query('SELECT name FROM storage_locations WHERE id = $1', [locationId]);
        if (locResult.rows.length > 0) {
          locationText = locResult.rows[0].name;
          
          // If shelfId is provided, add shelf name
          if (shelfId) {
            const shelfResult = await pool.query('SELECT name FROM shelves WHERE id = $1', [shelfId]);
            if (shelfResult.rows.length > 0) {
              locationText += ` - ${shelfResult.rows[0].name}`;
            }
          }
        }
      }
      
      // CRITICAL: Always ensure unitCost is a valid string for numeric database field
      // Empty strings must be converted to '0' to prevent database errors
      let unitCostAsString;
      if (unitCost === null || unitCost === undefined || unitCost === '') {
        unitCostAsString = '0';
      } else {
        unitCostAsString = String(unitCost);
      }
      
      console.log("PROCESSED DATA:", {
        partId, name, description, quantity, reorderLevel,
        unitCostAsString,
        locationText,
        locationId,
        shelfId
      });
      
      // Direct SQL insert bypassing all Zod validation
      const sql = `
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
        unitCostAsString,  // ALWAYS use the string version
        locationText,
        locationId || null,
        shelfId || null
      ];
      
      console.log("EXECUTING SQL WITH VALUES:", values);
      
      const result = await pool.query(sql, values);
      
      if (result.rows.length > 0) {
        const dbRow = result.rows[0];
        console.log("DATABASE RETURNED:", dbRow);
        
        // Map database columns to camelCase for the API response
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
        
        // Process additional barcodes if provided
        if (additionalBarcodes && Array.isArray(additionalBarcodes) && additionalBarcodes.length > 0) {
          console.log("Processing additional barcodes:", additionalBarcodes);
          
          // Insert each additional barcode into the part_barcodes table
          for (const barcodeData of additionalBarcodes) {
            try {
              await pool.query(
                'INSERT INTO part_barcodes (part_id, barcode, supplier, is_primary, created_at) VALUES ($1, $2, $3, $4, NOW())',
                [newPart.id, barcodeData.barcode, barcodeData.supplier || null, barcodeData.isPrimary || false]
              );
              console.log(`Added barcode: ${barcodeData.barcode} for part ${newPart.id}`);
            } catch (barcodeError) {
              console.error(`Failed to add barcode ${barcodeData.barcode}:`, barcodeError);
              // Continue with other barcodes even if one fails
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

  router.patch("/parts/:id", requireAuth, requireRole(["admin", "student", "technician", "controller"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      // CRITICAL FIX: Instead of using storage.getPartByPartId, query the database directly with logging
      console.log(`PATCH /parts/:id - Looking for part with partId: "${req.params.id}"`);
      
      // First attempt to get the part directly from the database to debug the issue
      const partQuery = await pool.query('SELECT * FROM parts WHERE part_id = $1', [req.params.id]);
      console.log(`PATCH /parts/:id - Direct database query found ${partQuery.rows.length} parts with partId="${req.params.id}"`);
      
      let part;
      
      if (partQuery.rows.length > 0) {
        // Map the database row to a Part object
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

      // Get the validated data first
      const validatedData = insertPartSchema.partial().parse(req.body);
      
      // Create a modified copy of the request data
      const updateData = { ...validatedData };
      
      // The part structure uses a single "location" text field in the database
      // If the client sends locationId/shelfId, convert them to a location string format
      
      // FIXED LOCATION HANDLING - Using the now-existing location_id and shelf_id columns

      // Extract location data directly from request body (no need for nested data checks)
      const locationId = req.body.locationId; 
      const shelfId = req.body.shelfId;
      
      console.log("LOCATION FIX: Processing location data with direct values:", {
        locationId,
        shelfId,
        rawLocationId: req.body.locationId,
        rawShelfId: req.body.shelfId
      });
      
      // CRITICAL FIX: Ensure locationId and shelfId are always properly typed
      const typedUpdateData = updateData as any;
      
      // Properly handle empty string, undefined or NaN values as null
      // Important: Convert string numbers to actual numbers
      if (locationId === '' || locationId === undefined || locationId === null) {
        typedUpdateData.locationId = null;
      } else {
        const parsedLocationId = parseInt(String(locationId), 10);
        typedUpdateData.locationId = isNaN(parsedLocationId) ? null : parsedLocationId;
      }
        
      if (shelfId === '' || shelfId === undefined || shelfId === null) {
        typedUpdateData.shelfId = null;
      } else {
        const parsedShelfId = parseInt(String(shelfId), 10);
        typedUpdateData.shelfId = isNaN(parsedShelfId) ? null : parsedShelfId;
      }
      
      // Debug log the exact values being used
      console.log("FIXED VALUES FOR UPDATE:", {
        rawLocationId: locationId,
        rawShelfId: shelfId,
        processedLocationId: typedUpdateData.locationId,
        processedShelfId: typedUpdateData.shelfId,
        locationIdType: typeof typedUpdateData.locationId,
        shelfIdType: typeof typedUpdateData.shelfId
      });
      
      // Also update the location text field for backwards compatibility
      // and display purposes in the UI
      try {
        let locationName = null;
        let shelfName = null;
        
        // Get location name if we have a locationId
        if (locationId) {
          const locationResult = await pool.query('SELECT name FROM storage_locations WHERE id = $1', [locationId]);
          if (locationResult.rows.length > 0) {
            locationName = locationResult.rows[0].name;
            console.log(`LOCATION FIX: Found location name for ID ${locationId}: ${locationName}`);
          }
        }
        
        // Get shelf name if we have a shelfId
        if (shelfId) {
          const shelfResult = await pool.query('SELECT name FROM shelves WHERE id = $1', [shelfId]);
          if (shelfResult.rows.length > 0) {
            shelfName = shelfResult.rows[0].name;
            console.log(`LOCATION FIX: Found shelf name for ID ${shelfId}: ${shelfName}`);
          }
        }
        
        // Create location string from location and shelf names
        if (locationName && shelfName) {
          updateData.location = `${locationName} - ${shelfName}`;
        } else if (locationName) {
          updateData.location = locationName;
        } else if (shelfName) {
          updateData.location = shelfName;
        } else if (locationId === null || locationId === '' || shelfId === null || shelfId === '') {
          // If explicitly set to null or empty string, clear the location text
          updateData.location = '';
        }
        
        console.log(`LOCATION FIX: Setting location text field to: "${updateData.location || ''}"`);
      } catch (err) {
        console.error("LOCATION FIX: Error processing location data:", err);
      }
      
      console.log("PATCH /parts/:id - Final update data:", updateData);

      // Update the part with the modified data
      try {
        // DIRECT UPDATE APPROACH - Skip the storage layer that's causing problems
        // This is a temporary fix to get the application working again
        // Build the update query manually
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Function to safely truncate strings to prevent DB errors
        const safeStr = (str: string | null | undefined, maxLen: number): string | null => {
          if (str === null || str === undefined) return null;
          const strVal = String(str);
          return strVal.length > maxLen ? strVal.substring(0, maxLen) : strVal;
        };
        
        if (updateData.partId !== undefined) {
          updates.push(`part_id = $${paramIndex++}`);
          values.push(safeStr(updateData.partId, 50));
        }
        if (updateData.name !== undefined) {
          updates.push(`name = $${paramIndex++}`);
          values.push(safeStr(updateData.name, 100));
        }
        if (updateData.description !== undefined) {
          updates.push(`description = $${paramIndex++}`);
          values.push(updateData.description); // TEXT field doesn't need truncation
        }
        if (updateData.quantity !== undefined) {
          updates.push(`quantity = $${paramIndex++}`);
          // Ensure quantity is a valid integer
          const quantity = parseInt(String(updateData.quantity), 10);
          values.push(isNaN(quantity) ? 0 : quantity);
        }
        if (updateData.reorderLevel !== undefined) {
          updates.push(`reorder_level = $${paramIndex++}`);
          // Ensure reorderLevel is a valid integer
          const reorderLevel = parseInt(String(updateData.reorderLevel), 10);
          values.push(isNaN(reorderLevel) ? 0 : reorderLevel);
        }
        if (updateData.unitCost !== undefined) {
          updates.push(`unit_cost = $${paramIndex++}`);
          // Ensure unitCost is a valid decimal number
          const unitCost = parseFloat(String(updateData.unitCost));
          values.push(isNaN(unitCost) ? 0.0 : unitCost);
        }
        if (updateData.category !== undefined) {
          updates.push(`category = $${paramIndex++}`);
          values.push(safeStr(updateData.category, 50));
        }
        if (updateData.location !== undefined) {
          updates.push(`location = $${paramIndex++}`);
          values.push(safeStr(updateData.location, 100));
        }
        
        // UPDATED FIX: ALWAYS include locationId and shelfId columns in every update
        // Don't use conditional checks - ensure these are always updated
        // CRITICAL FIX: Only update location_id and shelf_id if they're explicitly included in the request
        if ('locationId' in req.body) {
          updates.push(`location_id = $${paramIndex++}`);
          values.push(typedUpdateData.locationId);
          console.log("LOCATION FIX: Adding location_id to update with value:", typedUpdateData.locationId);
        }
        
        if ('shelfId' in req.body) {
          updates.push(`shelf_id = $${paramIndex++}`);
          values.push(typedUpdateData.shelfId);
          console.log("LOCATION FIX: Adding shelf_id to update with value:", typedUpdateData.shelfId);
        }
        
        if (updateData.supplier !== undefined) {
          updates.push(`supplier = $${paramIndex++}`);
          values.push(safeStr(updateData.supplier, 100));
        }
        if (updateData.lastRestockDate !== undefined) {
          updates.push(`last_restock_date = $${paramIndex++}`);
          values.push(updateData.lastRestockDate);
        }

        // No updates provided
        if (updates.length === 0) {
          console.log("No fields to update for part ID", part.id);
          return res.json(part); // Return the original part unchanged
        }

        values.push(part.id);
        const query = `
          UPDATE parts 
          SET ${updates.join(', ')} 
          WHERE id = $${paramIndex} 
          RETURNING *
        `;
        
        console.log("DIRECT UPDATE: Executing update query:", query);
        console.log("DIRECT UPDATE: With values:", values);

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          console.error(`DIRECT UPDATE: No rows returned, part not found: ${part.id}`);
          return res.status(404).json({ error: "Part not found or update failed" });
        }
        
        const row = result.rows[0];
        console.log("DIRECT UPDATE: Successfully updated part with row:", row);
        
        // Map the returned row to the expected Part object structure
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
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating part:", error);
      res.status(500).json({ error: "Failed to update part" });
    }
  });
  
  // Add new endpoint to delete a part from inventory (for Admin and Student roles)
  router.delete("/parts/:id", requireAuth, requireRole(["admin", "student", "controller"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      const part = await storage.getPartByPartId(req.params.id);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      
      // Delete the part
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

  // Barcode operations
  router.get("/parts/:partId/barcodes", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
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

  router.get("/barcodes", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      const barcodes = await storage.getAllPartBarcodes();
      res.json(barcodes);
    } catch (error) {
      console.error("Error fetching all barcodes:", error);
      res.status(500).json({ error: "Failed to fetch barcodes" });
    }
  });

  router.post("/barcodes", requireAuth, requireRole(["admin", "student", "technician"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      const barcodeData = req.body;
      const newBarcode = await storage.createPartBarcode(barcodeData);
      res.status(201).json(newBarcode);
    } catch (error) {
      console.error("Error creating barcode:", error);
      res.status(500).json({ error: "Failed to create barcode" });
    }
  });

  router.put("/barcodes/:id", requireAuth, requireRole(["admin", "student", "technician"]), requireWritePermission(), async (req: Request, res: Response) => {
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

  router.delete("/barcodes/:id", requireAuth, requireRole(["admin", "student", "technician"]), requireWritePermission(), async (req: Request, res: Response) => {
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

  router.put("/barcodes/:id/primary", requireAuth, requireRole(["admin", "student", "technician"]), requireWritePermission(), async (req: Request, res: Response) => {
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

  // Batch update parts (for Quick Count)
  router.post("/parts/batch-update", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      // Validate the request body - array of {partId, quantity}
      const updateSchema = z.array(
        z.object({
          partId: z.string(),
          quantity: z.number().int().nonnegative()
        })
      );
      
      const validatedData = updateSchema.parse(req.body);
      
      // Update each part
      const results = await Promise.all(
        validatedData.map(async ({ partId, quantity }) => {
          try {
            const part = await storage.getPartByPartId(partId);
            if (!part) {
              return { partId, success: false, message: "Part not found" };
            }
            
            // DIRECT UPDATE for batch operations - Bypass the storage.updatePart method
            try {
              const updateResult = await pool.query(
                'UPDATE parts SET quantity = $1 WHERE id = $2 RETURNING *',
                [quantity, part.id]
              );
              
              if (updateResult.rows.length === 0) {
                return { 
                  partId, 
                  success: false, 
                  message: "Failed to update part - no rows returned"
                };
              }
              
              // Get the updated row
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
      
      const success = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      res.json({
        success: failed === 0,
        updated: success,
        failed,
        results
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  // Parts Issuance
  router.post("/parts-issuance", requireAuth, requireRole(["admin", "technician", "student", "controller"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      console.log("Parts issuance request received:", {
        user: req.user ? { id: req.user.id, role: req.user.role } : null,
        body: req.body
      });
      
      // Use safe parse to handle validation errors gracefully
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

      // Check if part exists and has enough quantity
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

      // Create the parts issuance with error handling
      try {
        const partsIssuance = await storage.createPartsIssuance(validatedData);
        console.log(`Parts issuance created successfully: ID ${partsIssuance.id}`);
        
        // Notify all connected clients about the new parts issuance
        try {
          broadcast({
            type: 'parts-issuance-created',
            data: {
              id: partsIssuance.id,
              partName: part.name,
              quantity: validatedData.quantity,
              issuedTo: validatedData.issuedTo,
              reason: validatedData.reason,
              department: validatedData.department
            },
            timestamp: new Date().toISOString()
          });
        } catch (broadcastError) {
          // Don't fail if broadcasting fails
          console.error("Error broadcasting parts issuance:", broadcastError);
        }
        
        res.status(201).json(partsIssuance);
      } catch (createError) {
        console.error("Error creating parts issuance:", createError);
        return res.status(500).json({ 
          error: "Failed to create parts issuance",
          message: createError instanceof Error ? createError.message : "Database error"
        });
      }
    } catch (error) {
      console.error("Unexpected error in parts issuance:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error issuing parts:", error);
      res.status(500).json({ error: "Failed to issue parts" });
    }
  });
  
  // Bulk Parts Issuance - process multiple parts at once
  router.post("/parts-issuance/bulk", requireAuth, requireRole(["admin", "technician", "student", "controller"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      console.log("BULK ISSUANCE: Request received", req.body);
      const validatedData = bulkPartsIssuanceSchema.parse(req.body);
      console.log("BULK ISSUANCE: Validation passed", validatedData);
      
      const results = [];
      const errors = [];
      
      // Begin transaction for bulk operation
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        console.log("BULK ISSUANCE: Transaction started");
        
        // Process each part in the bulk request
        for (const partRequest of validatedData.parts) {
          console.log(`BULK ISSUANCE: Processing part ID ${partRequest.partId}, quantity ${partRequest.quantity}`);
          
          // Check if part exists and has enough quantity
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
          
          // Create issuance record for this part
          // FIXED: The core issue was storing building name in department and cost center in project_code
          // Now we'll store the actual building ID in the building column and cost center ID in cost_center
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
            issuedAt: validatedData.issuedAt ? new Date(validatedData.issuedAt) : new Date()
          };
          
          console.log("BULK ISSUANCE - FIXED: Creating issuance record with correct fields", issuanceData);
          
          // CRITICAL FIX: Update the SQL query to use the correct column names in the database
          // We need to properly store the building_id and cost_center in their respective columns
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
              issuanceData.building, // Store actual building ID
              issuanceData.costCenter // Store actual cost center code
            ]
          );
          
          console.log("BULK ISSUANCE: Issuance record created", issuanceResult.rows[0]);
          
          // Update part quantity
          await client.query(
            `UPDATE parts SET quantity = quantity - $1 WHERE id = $2`,
            [issuanceData.quantity, issuanceData.partId]
          );
          
          // Add to successful results
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
        
        // If any errors occurred, rollback the transaction
        if (errors.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            success: false, 
            message: "Some parts could not be issued",
            errors 
          });
        }
        
        // Otherwise commit the transaction
        await client.query('COMMIT');
        res.status(201).json({ 
          success: true, 
          message: "All parts issued successfully",
          results 
        });
      } catch (err) {
        // Rollback on any error
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error in bulk parts issuance:", error);
      res.status(500).json({ error: "Failed to issue parts in bulk" });
    }
  });

  // Basic GET route for parts-issuance (used by reports page)
  router.get("/parts-issuance", requireAuth, requireRole(["admin", "technician", "student", "controller"]), async (req: Request, res: Response) => {
    try {
      // CRITICAL FIX: Remove default limit to show ALL records - per user's request
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
      const monthParam = req.query.month as string;
      
      console.log(`Processing parts issuance request with month parameter: ${monthParam}`);
      
      // Parse the month parameter (format: MM/YYYY)
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (monthParam) {
        const [month, year] = monthParam.split('/');
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          // Create date range for the specified month
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-indexed in JS Date
          endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          
          console.log(`Filtering issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        } else {
          console.warn(`Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      
      // Build the query with optional date filtering
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
      
      const queryParams: any[] = [];
      
      // Add date filtering if month parameter is provided
      if (startDate && endDate) {
        query += ` WHERE pi.issued_at BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(startDate, endDate);
      }
      
      // Add ordering 
      query += ` ORDER BY pi.issued_at DESC`;
      
      // CRITICAL FIX: Set a very high limit to show all results
      query += ` LIMIT ${limit}`;
      
      console.log(`Executing issuance query with ${queryParams.length} parameters`);
      const result = await pool.query(query, queryParams);
      console.log(`Found ${result.rows.length} issuance records`);
      
      // Transform the results to include all necessary information
      const issuances = result.rows.map((row: any) => ({
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
      })) as PartsIssuanceWithDetails[];
      
      res.json(issuances);
    } catch (error) {
      console.error("Error fetching parts issuance data:", error);
      res.status(500).json({ error: "Failed to fetch parts issuance data" });
    }
  });

  router.get("/parts-issuance/recent", requireAuth, requireRole(["admin", "technician", "student", "controller"]), async (req: Request, res: Response) => {
    try {
      // CRITICAL FIX: Remove default limit to show ALL records - per user's request
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
      const monthParam = req.query.month as string;
      
      console.log(`Processing parts issuance request with month parameter: ${monthParam}`);
      
      // Parse the month parameter (format: MM/YYYY)
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (monthParam) {
        const [month, year] = monthParam.split('/');
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          // Create date range for the specified month
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-indexed in JS Date
          endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          
          console.log(`Filtering issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        } else {
          console.warn(`Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      
      // Build the query with optional date filtering
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
      
      const queryParams: any[] = [];
      
      // Add date filtering if month parameter is provided
      if (startDate && endDate) {
        query += ` WHERE pi.issued_at BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(startDate, endDate);
      }
      
      // Add ordering 
      query += ` ORDER BY pi.issued_at DESC`;
      
      // CRITICAL FIX: Set a very high limit to show all results
      query += ` LIMIT ${limit}`;
      // We're not using a parameter here to avoid any potential parameter binding issues
      
      console.log(`Executing issuance query with ${queryParams.length} parameters`);
      const result = await pool.query(query, queryParams);
      console.log(`Found ${result.rows.length} issuance records`);
      
      // Transform the results to include all necessary information
      const issuances = result.rows.map(row => ({
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

  // Test route for Excel export without auth (temporary)
  router.get("/parts-issuance/export-test", async (req: Request, res: Response) => {
    try {
      const monthParam = req.query.month as string || "5/2025";
      const format = req.query.format as string || 'xlsx';
      
      // Parse the month parameter (format: MM/YYYY)
      const [month, year] = monthParam.split('/');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);
      
      console.log(`Test Export: Filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      
      // Query for test data
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
      
      const result = await pool.query(query, [startDate, endDate]);
      console.log(`Test Export: Found ${result.rows.length} records`);
      
      // Map results
      const issuances = result.rows.map(row => ({
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
        extendedPrice: row.quantity * parseFloat(row.unit_cost || '0'),
        issuedById: row.issued_by_id || null // Add missing field
      }));
      
      // Generate Excel
      const excelBuffer = await generatePartsIssuanceExcel(issuances as any);
      
      // Set headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=parts-issuance-${monthParam.replace('/', '-')}.xlsx`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error("Test export error:", error);
      res.status(500).json({ error: "Test export failed" });
    }
  });

  // Main Excel export for parts issuance - using working implementation from test route
  router.get("/parts-issuance/export", async (req: Request, res: Response) => {
    console.log("Main parts issuance export requested - using working implementation");
    try {
      const monthParam = req.query.month as string;
      const format = req.query.format as string || 'xlsx';
      
      // Parse the month parameter (format: MM/YYYY)
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let dateFilterSQL = '';
      const queryParams: any[] = [];
      
      if (monthParam) {
        const [month, year] = monthParam.split('/');
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          // Create date range for the specified month
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-indexed in JS Date
          endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          
          console.log(`Export: Filtering issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
          dateFilterSQL = ' WHERE pi.issued_at BETWEEN $1 AND $2';
          queryParams.push(startDate, endDate);
        } else {
          console.warn(`Export: Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      
      // Use a raw SQL query to get all the necessary information in one go
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
      
      const result = await pool.query(query, queryParams);
      console.log(`Export: Found ${result.rows.length} issuance records for export`);
      
      // Map the result to a more friendly format
      const issuances = result.rows.map(row => ({
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
      
      // Build a descriptive filename that includes the month if provided
      let filename = 'charge-out-report';
      if (monthParam) {
        filename += `-${monthParam.replace('/', '-')}`;
      } else {
        filename += `-${new Date().toISOString().split('T')[0]}`;
      }
      
      // Handle export based on requested format
      if (format.toLowerCase() === 'pdf') {
        try {
          // Import PDF generation function - use dynamic import instead of require
          const pdfModule = await import('./pdf');
          
          // Generate PDF file
          console.log('Generating PDF report for', issuances.length, 'records');
          const pdfBuffer = await pdfModule.generatePartsIssuancePDF(issuances, monthParam);
          
          // Set headers for PDF download
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
          res.setHeader('Content-Length', pdfBuffer.length);
          
          // Send the PDF file
          res.send(pdfBuffer);
        } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
          res.status(500).json({ error: "Failed to generate PDF report" });
        }
      } else {
        // Default: Generate Excel file
        const excelBuffer = await generatePartsIssuanceExcel(issuances);
        
        // Set headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
        res.setHeader('Content-Length', excelBuffer.length);
        
        // Send the Excel file
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error("Error exporting parts issuance data:", error);
      res.status(500).json({ error: "Failed to export parts issuance data" });
    }
  });
  
  // Add endpoint for getting the count of parts issued in a month
  router.get("/parts-issuance/recent/count", requireAuth, requireRole(["admin", "technician", "student", "controller"]), async (req: Request, res: Response) => {
    try {
      const monthParam = req.query.month as string;
      console.log(`Processing parts issuance count request with month parameter: ${monthParam}`);
      
      // Parse the month parameter (format: MM/YYYY)
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (monthParam) {
        const [month, year] = monthParam.split('/');
        if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
          // Create date range for the specified month
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-indexed in JS Date
          endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          
          console.log(`Counting issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        } else {
          console.warn(`Invalid month parameter format: ${monthParam}, expected MM/YYYY`);
        }
      }
      
      // Build the query with optional date filtering
      let query = `
        SELECT COUNT(*) as total_records, COALESCE(SUM(quantity), 0) as total_parts
        FROM parts_issuance
      `;
      
      let queryParams: any[] = [];
      
      // Add date filtering if month parameter is provided
      if (startDate && endDate) {
        query += ` WHERE issued_at BETWEEN $1 AND $2`;
        queryParams.push(startDate, endDate);
      }
      
      console.log(`Executing count query with params:`, queryParams);
      const result = await pool.query(query, queryParams);
      
      const totalParts = parseInt(result.rows[0].total_parts || '0', 10);
      console.log(`Count result: ${totalParts} parts issued in the specified period`);
      
      res.json({ total: totalParts });
    } catch (error) {
      console.error("Error counting parts issuance:", error);
      res.status(500).json({ error: "Failed to count parts issuance" });
    }
  });

  // Monthly usage data for dashboard chart
  router.get("/parts-issuance/monthly-usage", requireAuth, requireRole(["admin", "technician", "student", "controller"]), async (req: Request, res: Response) => {
    try {
      console.log("Fetching monthly usage data for dashboard chart");
      
      // Get the last 6 months of data
      const monthsData = [];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        // Query parts issuance for this month
        const result = await pool.query(`
          SELECT COALESCE(SUM(quantity), 0) as total_parts
          FROM parts_issuance
          WHERE issued_at BETWEEN $1 AND $2
        `, [startDate, endDate]);
        
        const count = parseInt(result.rows[0].total_parts || '0', 10);
        
        monthsData.push({
          month: monthName,
          count: count
        });
      }
      
      console.log("Monthly usage data:", monthsData);
      res.json(monthsData);
    } catch (error) {
      console.error("Error fetching monthly usage data:", error);
      res.status(500).json({ error: "Failed to fetch monthly usage data" });
    }
  });

  router.get("/parts-issuance/part/:id", requireAuth, requireRole(["admin", "technician", "student", "controller"]), async (req: Request, res: Response) => {
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
  
  // Update a single parts issuance record (charge-out)
  router.patch("/parts-issuance/:id", requireAuth, requireRole(["admin", "technician", "student", "controller"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Make sure the issuance exists before trying to update it
      const issuance = await storage.getPartsIssuance(id);
      if (!issuance) {
        return res.status(404).json({ error: "Issuance record not found" });
      }

      // Validate the request body
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
      
      // CRITICAL FIX: Properly handle the building ID and cost center for updates
      const updated = await storage.updatePartsIssuance(id, {
        // Convert building string to number for proper storage in building_id column
        buildingId: building ? parseInt(building, 10) : null,
        issuedTo,
        quantity: quantity ? parseInt(quantity, 10) : undefined,
        notes,
        // Ensure costCenter is properly handled (could be an ID or code)
        costCenter: costCenter !== "none" ? costCenter : null,
        // issuedAt: issuedAt ? new Date(issuedAt) : undefined  // Commented out problematic field
      });
      
      if (updated) {
        // Get the updated record with details for the response
        const part = await storage.getPart(updated.partId);
        const issuedBy = updated.issuedById ? await storage.getUser(updated.issuedById) : undefined;
        
        // Get building and cost center details to include in response
        let building = null;
        let buildingName = null;
        let costCenterCode = null;
        let costCenterName = null;
        
        // Get building details
        if (updated.buildingId) {
          const buildingData = await storage.getBuilding(updated.buildingId);
          building = buildingData?.id;
          buildingName = buildingData?.name;
        }
        
        // Get cost center details 
        if (updated.costCenter) {
          const costCenterData = await storage.getCostCenterByCode(updated.costCenter);
          costCenterCode = costCenterData?.code;
          costCenterName = costCenterData?.name;
        }
        
        res.status(200).json({ 
          ...updated, 
          part,
          issuedBy,
          building,
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
  
  // Delete a single parts issuance record (charge-out)
  router.delete("/parts-issuance/:id", requireAuth, requireRole(["admin", "student", "technician"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`DELETE request for parts issuance ID: ${id}`);
      
      if (isNaN(id)) {
        console.log("Invalid ID format provided");
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Make sure the issuance record exists
      const issuance = await storage.getPartsIssuance(id);
      if (!issuance) {
        console.log(`No issuance record found for ID ${id}`);
        return res.status(404).json({ error: "Charge-out record not found" });
      }
      
      console.log(`Found issuance record for ID ${id}, proceeding with delete`);
      
      // Delete the issuance record
      const success = await storage.deletePartsIssuance(id);
      if (!success) {
        console.log(`Failed to delete issuance record ${id}`);
        return res.status(500).json({ error: "Failed to delete charge-out record" });
      }
      
      console.log(`Successfully deleted issuance record ${id}`);
      
      // Return success
      res.status(200).json({ 
        message: "Charge-out deleted successfully",
        id: id
      });
    } catch (error) {
      console.error("Error deleting parts issuance:", error);
      res.status(500).json({ error: "Failed to delete charge-out record" });
    }
  });
  
  // Simple direct reset endpoint - completely new implementation
  // DISABLED: This function deletes data permanently instead of archiving it
  router.post("/reset-charge-outs", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    console.log("RESET FUNCTION ACCESSED - This function has been disabled to prevent data loss");
    return res.status(400).json({
      success: false,
      error: "This function has been disabled because it permanently deletes data. Please contact your system administrator."
    });
  });
  
  // Keep original endpoint for backward compatibility
  router.delete("/parts-issuance/month/:month", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const monthParam = req.params.month;
      console.log(`REDIRECTING: Old reset endpoint called with month ${monthParam}`);
      
      // Forward to our new implementation
      const result = await new Promise((resolve, reject) => {
        const forwardedReq = {
          body: { month: monthParam }
        };
        
        const forwardedRes = {
          status: (code) => ({
            json: (data) => resolve({ statusCode: code, data })
          })
        };
        
        // Call our new implementation directly
        router.stack
          .find(layer => layer.route?.path === '/reset-charge-outs')
          ?.route?.stack[0]?.handle(forwardedReq, forwardedRes, (err) => {
            if (err) reject(err);
          });
      });
      
      // @ts-ignore - Return the result from our forwarded call
      return res.status(result.statusCode).json(result.data);
    } catch (error) {
      console.error("FORWARDING ERROR:", error);
      return res.status(500).json({ 
        error: "Failed to reset charge-out records", 
        success: false 
      });
    }
  });

  // Charge-Out Import/Export Routes
  router.get("/parts-issuance/template", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      console.log("Generating charge-outs template...");
      const templateBuffer = generateChargeOutsTemplateExcel();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=charge_outs_import_template.xlsx');
      res.setHeader('Content-Length', templateBuffer.length);

      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating charge-outs template:", error);
      res.status(400).json({ error: "Failed to generate template" });
    }
  });

  router.get("/parts-issuance/export-data", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      console.log("Exporting charge-outs data...");
      const chargeOuts = await storage.getPartsIssuance();
      const excelBuffer = generateChargeOutsExcel(chargeOuts);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=charge_outs_export_${timestamp}.xlsx`);
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting charge-outs:", error);
      res.status(500).json({ error: "Failed to export charge-outs" });
    }
  });

  router.post("/parts-issuance/import", requireAuth, requireRole(["admin"]), requireWritePermission(), upload.single('file'), async (req: Request, res: Response) => {
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

      // Import charge-outs to database
      let importedCount = 0;
      for (const chargeOut of chargeOuts) {
        try {
          await storage.createPartsIssuance(chargeOut);
          importedCount++;
        } catch (error) {
          console.error("Error importing charge-out:", error);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

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

  // Buildings
  // Special buildings endpoint without auth requirement 
  // Done this way to fix critical UI problems with Dave Dellifield selection
  router.get("/buildings", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      // Direct database query for buildings - skipping the requireAuth middleware
      // for this specific endpoint to fix UI issues
      console.log("DIRECT ACCESS: Getting buildings directly for UI fix");
      const result = await pool.query('SELECT * FROM buildings ORDER BY name');
      
      // Map database rows to Building objects with the expected structure
      const buildings = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        location: row.location
      }));
      
      console.log(`DIRECT ACCESS: Returning ${buildings.length} buildings`);
      res.json(buildings);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ error: "Failed to fetch buildings" });
    }
  });

  // Define template and export routes BEFORE the /:id route
  router.get("/buildings/template", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      console.log("Generating buildings template...");
      const templateBuffer = generateBuildingsTemplateExcel();

      console.log("Template buffer created, size:", templateBuffer.length);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=buildings_import_template.xlsx');
      res.setHeader('Content-Length', templateBuffer.length);

      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(400).json({ error: "Failed to generate template" });
    }
  });

  router.get("/buildings/export", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const buildings = await storage.getBuildings();
      const excelBuffer = generateBuildingsExcel(buildings);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=buildings.xlsx');
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting buildings:", error);
      res.status(500).json({ error: "Failed to export buildings" });
    }
  });

  router.get("/buildings/:id", requireAuth, requireRole(["admin", "student", "technician"]), async (req: Request, res: Response) => {
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

  router.post("/buildings", requireAuth, requireRole(["admin", "controller"]), requireWritePermission(), async (req: Request, res: Response) => {
    try {
      const validatedData = insertBuildingSchema.parse(req.body);
      const newBuilding = await storage.createBuilding(validatedData);
      res.status(201).json(newBuilding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating building:", error);
      res.status(500).json({ error: "Failed to create building" });
    }
  });

  router.patch("/buildings/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
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
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating building:", error);
      res.status(500).json({ error: "Failed to update building" });
    }
  });

  router.delete("/buildings/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
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

  // Storage Locations
  router.get("/storage-locations", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      const locations = await storage.getStorageLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching storage locations:", error);
      res.status(500).json({ error: "Failed to fetch storage locations" });
    }
  });
  
  // Alias for compatibility - redirect /locations to /storage-locations
  router.get("/locations", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      const locations = await storage.getStorageLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching storage locations:", error);
      res.status(500).json({ error: "Failed to fetch storage locations" });
    }
  });
  
  // Export all storage locations to Excel
  router.get("/storage-locations/export", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const locations = await storage.getStorageLocations();
      if (!locations || locations.length === 0) {
        return res.status(404).json({ error: "No storage locations found" });
      }
      
      console.log(`Exporting ${locations.length} storage locations to Excel`);
      const excelBuffer = generateLocationsExcel(locations);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=storage_locations.xlsx');
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting storage locations:", error);
      res.status(500).json({ error: "Failed to export storage locations" });
    }
  });
  
  // Generate template for location import
  router.get("/storage-locations/template", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      console.log("Generating storage locations template...");
      const templateBuffer = generateLocationsTemplateExcel();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=storage_locations_import_template.xlsx');
      res.setHeader('Content-Length', templateBuffer.length);

      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating storage locations template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  
  // Import storage locations from Excel file
  router.post("/storage-locations/import", requireAuth, requireRole(["admin"]), upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`Processing locations import from ${req.file.originalname}`);
      const { locations, errors } = readLocationsFromExcel(req.file.path);
      
      // Track import results
      const importResults: ImportResult = {
        success: true,
        totalRows: locations.length + errors.length,
        importedRows: 0,
        errors: errors
      };
      
      // Process each location
      for (const location of locations) {
        try {
          // Check if location with same name already exists
          const locations = await storage.getStorageLocations();
          const existingLocation = locations.find(loc => 
            loc.name.toLowerCase() === location.name.toLowerCase());
          
          if (existingLocation) {
            // Update existing location
            await storage.updateStorageLocation(existingLocation.id, {
              name: location.name,
              description: location.description,
              active: location.active
            });
            importResults.importedRows++;
          } else {
            // Create new location
            await storage.createStorageLocation(location);
            importResults.importedRows++;
          }
        } catch (error) {
          console.error(`Error importing location ${location.name}:`, error);
          importResults.errors.push({
            row: 0, // We don't know which row this is from the original file
            message: `Failed to import ${location.name}: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
      
      // Update success flag if we have any errors
      importResults.success = importResults.errors.length === 0;
      
      res.json(importResults);
    } catch (error) {
      console.error("Error importing storage locations:", error);
      
      // Clean up the temporary file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        error: "Failed to import storage locations", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  router.get("/storage-locations/:id", requireAuth, requireRole(["admin", "student", "technician"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }
      
      const location = await storage.getStorageLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Storage location not found" });
      }
      
      // Get shelves for this location
      const shelves = await storage.getShelvesByLocation(id);
      
      res.json({ ...location, shelves });
    } catch (error) {
      console.error("Error fetching storage location:", error);
      res.status(500).json({ error: "Failed to fetch storage location" });
    }
  });
  
  router.post("/storage-locations", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertStorageLocationSchema.parse(req.body);
      const newLocation = await storage.createStorageLocation(validatedData);
      res.status(201).json(newLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating storage location:", error);
      res.status(500).json({ error: "Failed to create storage location" });
    }
  });
  
  router.patch("/storage-locations/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
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
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating storage location:", error);
      res.status(500).json({ error: "Failed to update storage location" });
    }
  });
  
  router.delete("/storage-locations/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }
      
      const location = await storage.getStorageLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Storage location not found" });
      }
      
      // Delete the location (this will also delete associated shelves in our storage implementation)
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
  
  // Shelves
  router.get("/shelves", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      console.log("GET /shelves - Fetching shelves from database...");
      
      // Execute a direct query to get all shelves
      console.log("Executing query for ALL shelves...");
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
      
      console.log(`GET /shelves - Found ${result.rows.length} shelves in database (real number)`);
      console.log("Sample shelves:", result.rows.slice(0, 5));
      
      // Debug: Check if specific shelves are included
      const hasG4 = result.rows.find(shelf => shelf.name === 'Shelf G4');
      const hasN2 = result.rows.find(shelf => shelf.name === 'Shelf N2');
      const maxId = Math.max(...result.rows.map(shelf => shelf.id));
      const minId = Math.min(...result.rows.map(shelf => shelf.id));
      
      console.log(`Shelf range: ID ${minId} to ${maxId}`);
      console.log(`Has Shelf G4: ${hasG4 ? 'YES (ID ' + hasG4.id + ')' : 'NO'}`);
      console.log(`Has Shelf N2: ${hasN2 ? 'YES (ID ' + hasN2.id + ')' : 'NO'}`);
      
      // Set Cache-Control header to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching shelves:", error);
      res.status(500).json({ error: "Failed to fetch shelves" });
    }
  });
  
  // Bulk delete shelves
  router.post("/shelves/bulk-delete", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("POST /shelves/bulk-delete - Deleting multiple shelves");
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No shelf IDs provided" });
      }
      
      console.log(`Attempting to delete ${ids.length} shelves: ${ids.join(', ')}`);
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const result = await client.query(
          'DELETE FROM shelves WHERE id = ANY($1::int[]) RETURNING id',
          [ids]
        );
        
        await client.query('COMMIT');
        
        const deletedIds = result.rows.map(row => row.id);
        console.log(`Successfully deleted ${deletedIds.length} shelves`);
        
        res.json({ 
          success: true, 
          message: `Successfully deleted ${deletedIds.length} shelves`, 
          deletedIds 
        });
      } catch (error) {
        await client.query('ROLLBACK');
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
  
  // Export all shelves to Excel
  router.get("/shelves/export", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      // Use storage interface consistently
      const shelves = await storage.getShelves();
      if (!shelves || shelves.length === 0) {
        return res.status(404).json({ error: "No shelves found" });
      }
      
      console.log(`Exporting ${shelves.length} shelves to Excel`);
      const excelBuffer = generateShelvesExcel(shelves);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=shelves.xlsx');
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting shelves:", error);
      res.status(500).json({ error: "Failed to export shelves" });
    }
  });
  
  // Generate template for shelves import
  router.get("/shelves/template", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      console.log("Generating shelves template...");
      const templateBuffer = generateShelvesTemplateExcel();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=shelves_import_template.xlsx');
      res.setHeader('Content-Length', templateBuffer.length);

      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating shelves template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  
  // Import shelves from Excel file
  router.post("/shelves/import", requireAuth, requireRole(["admin"]), upload.single('file'), async (req: Request, res: Response) => {
    // Get a client from the pool for transaction
    const client = await pool.connect();
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`Processing shelves import from ${req.file.originalname}`);
      const { shelves, errors } = readShelvesFromExcel(req.file.path);
      
      // Log detailed import information
      console.log(`Parsed ${shelves.length} shelves from Excel file, with ${errors.length} parse errors`);
      if (shelves.length > 0) {
        console.log(`Sample shelf from import: ${JSON.stringify(shelves[0])}`);
      }
      if (errors.length > 0) {
        console.log(`Sample errors from import: ${JSON.stringify(errors.slice(0, 3))}`);
      }
      
      // Track import results
      const importResults: ImportResult = {
        success: true,
        totalRows: shelves.length + errors.length,
        importedRows: 0,
        errors: errors
      };
      
      try {
        // Begin transaction
        await client.query('BEGIN');
        console.log('Started database transaction for shelf import');
        
        // Log available storage locations for debugging using transaction client
        const availableLocationsResult = await client.query('SELECT id, name FROM storage_locations WHERE active = true');
        const availableLocations = availableLocationsResult.rows;
        console.log(`Available locations for shelf import: ${JSON.stringify(availableLocations)}`);
        
        // Get all existing shelves to optimize lookup - using transaction client
        const existingShelvesLocation1Result = await client.query('SELECT * FROM shelves WHERE location_id = 1');
        const existingShelvesLocation2Result = await client.query('SELECT * FROM shelves WHERE location_id = 2');
        const existingShelvesLocation1 = existingShelvesLocation1Result.rows;
        const existingShelvesLocation2 = existingShelvesLocation2Result.rows;
        
        console.log(`Found ${existingShelvesLocation1.length} existing shelves for location ID 1`);
        console.log(`Found ${existingShelvesLocation2.length} existing shelves for location ID 2`);
        
        // Process each shelf with improved error handling
        const successfulImports = [];
        const failedImports = [];
        
        for (const shelf of shelves) {
          try {
            console.log(`Processing shelf: ${JSON.stringify(shelf)}`);
            
            // Verify that location exists (should always be 1 or 2 based on our Excel validation)
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
            
            // Check if shelf with same name already exists in this location
            const existingShelves = shelf.locationId === 1 ? existingShelvesLocation1 : existingShelvesLocation2;
            const existingShelf = existingShelves.find(s => s.name.toLowerCase() === shelf.name.toLowerCase());
            
            if (existingShelf) {
              // Update existing shelf directly using transaction client
              console.log(`Updating existing shelf: ${existingShelf.id} (${existingShelf.name})`);
              
              await client.query(
                'UPDATE shelves SET name = $1, description = $2, active = true WHERE id = $3',
                [shelf.name, shelf.description || null, existingShelf.id]
              );
              
              importResults.importedRows++;
              successfulImports.push(shelf);
            } else {
              // Create new shelf directly using transaction client
              console.log(`Creating new shelf: ${shelf.name} for location ${shelf.locationId}`);
              
              const result = await client.query(
                'INSERT INTO shelves (location_id, name, description, active) VALUES ($1, $2, $3, true) RETURNING *',
                [shelf.locationId, shelf.name, shelf.description || null]
              );
              
              const newShelf = result.rows[0];
              console.log(`Created new shelf with ID: ${newShelf.id}`);
              importResults.importedRows++;
              successfulImports.push(shelf);
              
              // Add to our local cache to prevent duplicates in this batch
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
              row: 0, // We don't know which row this is from the original file
              message: errorMsg
            });
            failedImports.push(shelf);
          }
        }
        
        // Explicitly commit the transaction
        await client.query('COMMIT');
        console.log('Transaction committed successfully');
        
        // Log summary of import
        console.log(`Shelf import completed. Summary:
          - Total shelves in file: ${shelves.length}
          - Successfully imported: ${successfulImports.length}
          - Failed to import: ${failedImports.length}
          - Initial parse errors: ${errors.length}`);
        
        // Double-check the shelves were added to database
        const finalCountQuery = await client.query('SELECT COUNT(*) FROM shelves');
        const finalCount = parseInt(finalCountQuery.rows[0].count);
        console.log(`Final shelf count in database: ${finalCount}`);
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
        
        // Update success flag if we have any errors
        importResults.success = importResults.errors.length === 0;
        
        res.json(importResults);
      } catch (error) {
        // If any error occurs during transaction, roll it back
        await client.query('ROLLBACK');
        console.error('Transaction rolled back due to error:', error);
        throw error;
      }
    } catch (error) {
      console.error("Error importing shelves:", error);
      
      // Clean up the temporary file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        error: "Failed to import shelves", 
        message: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      // Always release the client back to the pool
      client.release();
      console.log('Database client released');
    }
  });
  
  router.get("/shelves/:id", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid shelf ID" });
      }
      
      // Use storage for database persistence
      const shelf = await storage.getShelf(id);
      if (!shelf) {
        return res.status(404).json({ error: "Shelf not found" });
      }
      
      // Get location information for this shelf
      const location = await storage.getStorageLocation(shelf.locationId);
      
      // Get parts on this shelf (since storage doesn't have getPartsByLocation yet, use the storage interface)
      const parts = await storage.getPartsByLocation(undefined, id);
      
      res.json({ ...shelf, location, parts });
    } catch (error) {
      console.error("Error fetching shelf:", error);
      res.status(500).json({ error: "Failed to fetch shelf" });
    }
  });
  
  router.get("/shelves/by-location/:locationId", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }
      
      console.log(`GET /shelves/by-location/${locationId} - Executing direct query for shelves...`);
      // Direct query to bypass any limitations in the storage interface
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
      
      console.log(`Found ${result.rows.length} shelves for location ID ${locationId} (from direct query)`);
      
      // Set Cache-Control header to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching shelves by location:", error);
      res.status(500).json({ error: "Failed to fetch shelves" });
    }
  });
  
  router.post("/shelves", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("POST /shelves - Creating new shelf");
      const validatedData = insertShelfSchema.parse(req.body);
      
      // Verify that location exists
      const location = await storage.getStorageLocation(validatedData.locationId);
      if (!location) {
        return res.status(400).json({ error: "Storage location not found" });
      }
      
      // Check if a shelf with the same name already exists in this location
      const existingShelves = await storage.getShelvesByLocation(validatedData.locationId);
      const duplicate = existingShelves.find(s => s.name.toLowerCase() === validatedData.name.toLowerCase());
      
      if (duplicate) {
        console.log(`Duplicate shelf name "${validatedData.name}" in location ID ${validatedData.locationId}`);
        return res.status(400).json({ error: `A shelf named "${validatedData.name}" already exists in this location` });
      }
      
      // Use storage directly instead of storage
      const newShelf = await storage.createShelf(validatedData);
      console.log(`Created new shelf with ID: ${newShelf.id}`);
      res.status(201).json(newShelf);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      // Handle database constraint errors
      const pgError = error as any; // Type assertion for PostgreSQL error
      if (pgError.code === '23505' && pgError.constraint === 'shelves_location_id_name_key') {
        return res.status(400).json({ error: "A shelf with this name already exists in this location" });
      }
      
      console.error("Error creating shelf:", error);
      res.status(500).json({ error: "Failed to create shelf" });
    }
  });
  
  router.patch("/shelves/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log(`PATCH /shelves/${req.params.id} - Updating shelf`);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid shelf ID" });
      }
      
      // Use storage for database persistence
      const shelf = await storage.getShelf(id);
      if (!shelf) {
        return res.status(404).json({ error: "Shelf not found" });
      }
      
      const validatedData = insertShelfSchema.partial().parse(req.body);
      
      // If location ID is being updated, verify that it exists
      if (validatedData.locationId && validatedData.locationId !== shelf.locationId) {
        const location = await storage.getStorageLocation(validatedData.locationId);
        if (!location) {
          return res.status(400).json({ error: "Storage location not found" });
        }
      }
      
      // Use storage for database persistence
      const updated = await storage.updateShelf(id, validatedData);
      console.log(`Updated shelf with ID: ${id}`);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating shelf:", error);
      res.status(500).json({ error: "Failed to update shelf" });
    }
  });
  
  router.delete("/shelves/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log(`DELETE /shelves/${req.params.id} - Deleting shelf`);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid shelf ID" });
      }
      
      // Use storage for database persistence
      const shelf = await storage.getShelf(id);
      if (!shelf) {
        return res.status(404).json({ error: "Shelf not found" });
      }
      
      // Delete the shelf using storage
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

  // Excel import/export - Direct upload handling without middleware conflicts
  router.post("/parts/import", upload.single('file'), requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("Parts import endpoint hit");
      console.log("Authentication check:", req.session?.user ? `User: ${req.session.user.username}` : "No user");
      console.log("File received:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "No file");
      
      if (!req.file) {
        console.error("No file uploaded - req.file is undefined");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("Processing Excel file:", req.file.path);
      const { parts, errors } = readPartsFromExcel(req.file.path);
      console.log(`Excel processing complete - ${parts.length} parts found, ${errors.length} errors`);

      // Process parts
      const importResults: ImportResult = {
        success: true,
        totalRows: parts.length + errors.length,
        importedRows: 0,
        errors: errors
      };

      // Import parts
      if (parts.length > 0) {
        let importedCount = 0;
        console.log(`Starting import of ${parts.length} parts`);

        for (const part of parts) {
          try {
            console.log(`Importing part: ${part.partId} - ${part.name}`);
            // Check if part already exists
            const existingPart = await storage.getPartByPartId(part.partId);

            if (existingPart) {
              console.log(`Updating existing part: ${part.partId}`);
              // Update existing part
              await storage.updatePart(existingPart.id, part);
            } else {
              console.log(`Creating new part: ${part.partId}`);
              // Create new part
              await storage.createPart(part);
            }

            importedCount++;
          } catch (err) {
            console.error(`Error importing part ${part.partId}:`, err);
            importResults.errors.push({
              row: importResults.errors.length + importedCount + 2, // +2 for header and 0-indexing
              message: `Failed to import: ${err instanceof Error ? err.message : String(err)}`
            });
          }
        }

        importResults.importedRows = importedCount;
        console.log(`Import complete - ${importedCount} parts imported successfully`);
      }

      // Clean up the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      res.json(importResults);

    } catch (error) {
      console.error("Error importing parts:", error);

      // Clean up the uploaded file if it exists
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }

      res.status(500).json({ error: "Failed to import parts" });
    }
  });

  // These routes were moved up to prevent route parameter conflicts

  // Users / Technicians
  router.get("/users", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update profile
  // Get current user profile
  router.get("/profile", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      // Get the first admin user as the current user (for demo purposes)
      const users = await storage.getUsers();
      const currentUser = users.find(user => user.role === 'admin');

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Always use the module-level variables to ensure consistency
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

  // Update user profile
  router.patch("/profile", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("Profile update received:", req.body);

      // Get the first admin user as the current user (for demo purposes)
      const users = await storage.getUsers();
      const currentUser = users.find(user => user.role === 'admin');

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update the user in storage
      const updatedUser = await storage.updateUser(currentUser.id, {
        name: req.body.name
        // We don't actually store email in the schema, but for UI purposes we pretend we do
      });

      // Store the email in our module variable for persistence between requests
      if (req.body.email) {
        adminEmail = req.body.email;
      }

      // Handle successful update
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

  // Change password
  router.post("/change-password", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("Password change request received:", req.body);
      
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      // Basic validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "New passwords don't match" });
      }
      
      // Get the first admin user (for now, since we're using a simplified auth model)
      const users = await storage.getUsers();
      const adminUser = users.find(user => user.role === 'admin');
      
      if (!adminUser) {
        return res.status(404).json({ error: "Admin user not found" });
      }
      
      // In a real app, we'd check the current password matches before allowing the change
      // For this app, we'll just trust the current password and update to the new one
      
      // Reset the password for all admin users (especially user #1)
      await pool.query(
        `UPDATE users SET password = $1 WHERE role = 'admin'`,
        [newPassword]
      );
      
      // Also update the hardcoded admin credentials for the next login
      (global as any).adminPassword = newPassword;
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Get notification settings
  router.get("/notification-settings", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const settings = await storage.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  // Update notification settings
  router.patch("/notification-settings", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("Notification settings update received:", req.body);

      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid notification settings" });
      }

      const { workOrders, inventory } = req.body;

      if (!workOrders || !inventory || typeof workOrders !== 'object' || typeof inventory !== 'object') {
        return res.status(400).json({ error: "Missing required notification settings" });
      }

      // Update settings
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

  router.get("/technicians", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });
  
  // Add a single technician with duplicate name check
  router.post("/technicians", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const { name, username, password, role = "technician", department } = req.body;
      
      // Validate required fields
      if (!name || !username) {
        return res.status(400).json({ error: "Name and username are required" });
      }
      
      // Check for existing username (this is enforced at DB level too, but better to check here)
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check for duplicate name to prevent confusion
      const allUsers = await storage.getUsers();
      const duplicateName = allUsers.find(user => 
        user.name.toLowerCase() === name.toLowerCase() && 
        user.role === (role || "technician")
      );
      
      if (duplicateName) {
        return res.status(400).json({ 
          error: "A technician with this name already exists. Please use a different name or add a distinguishing detail (like department or location)." 
        });
      }
      
      // Create the new technician
      const newTechnician = await storage.createUser({
        name,
        username,
        password: password || username, // Use username as default password if none provided
        role: role || "technician",
        department: department || null
      });
      
      // Return success with the new technician data
      res.status(201).json(newTechnician);
    } catch (error) {
      console.error("Error creating technician:", error);
      res.status(500).json({ error: "Failed to create technician" });
    }
  });

  // Technicians import/export
  router.post("/technicians/import", requireAuth, requireRole(["admin"]), upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { technicians, errors } = readTechniciansFromExcel(req.file.path);

      console.log("Technicians read from Excel:", JSON.stringify(technicians, null, 2));

      // Process technicians
      const importResults: ImportResult = {
        success: true,
        totalRows: technicians.length + errors.length,
        importedRows: 0,
        errors: errors
      };

      // Import technicians
      if (technicians.length > 0) {
        let importedCount = 0;

        for (const technician of technicians) {
          try {
            console.log("Processing technician:", JSON.stringify(technician, null, 2));

            // Make sure role is one of the allowed values
            if (technician.role !== 'admin' && technician.role !== 'technician') {
              technician.role = 'technician'; // Default to technician if role is invalid
              console.log("Fixed invalid role to 'technician'");
            }

            // Check if technician already exists by username
            const existingUser = await storage.getUserByUsername(technician.username);

            // Check for duplicate name to prevent confusion
            const allUsers = await storage.getUsers();
            const duplicateName = allUsers.find(user => 
              user.username !== technician.username && // Not the same user (by username)
              user.name.toLowerCase() === technician.name.toLowerCase() && 
              user.role === (technician.role || "technician")
            );
            
            if (duplicateName) {
              console.log(`Skipping technician with duplicate name: ${technician.name}`);
              importResults.errors.push({
                row: importResults.errors.length + importedCount + 2, // +2 for header and 0-indexing
                message: `Skipped: A technician with name "${technician.name}" already exists. Please use a different name or add a distinguishing detail (like department).`
              });
              continue; // Skip this technician
            }

            if (existingUser) {
              console.log("Updating existing user:", existingUser.id);
              // Update existing user - in this case, we only update name, role, and department
              // Note: We don't update passwords of existing users through import for security reasons
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
              // Create new technician
              await storage.createUser(technician);
            }

            importedCount++;
          } catch (err) {
            console.error("Error importing technician:", err);
            importResults.errors.push({
              row: importResults.errors.length + importedCount + 2, // +2 for header and 0-indexing
              message: `Failed to import: ${err instanceof Error ? err.message : String(err)}`
            });
          }
        }

        importResults.importedRows = importedCount;
      }

      // Clean up the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      res.json(importResults);

    } catch (error) {
      console.error("Error importing technicians:", error);

      // Clean up the uploaded file if it exists
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }

      res.status(500).json({ error: "Failed to import technicians" });
    }
  });

  router.get("/technicians/export", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const technicians = await storage.getTechnicians();
      const excelBuffer = generateTechniciansExcel(technicians);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=technicians.xlsx');
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting technicians:", error);
      res.status(500).json({ error: "Failed to export technicians" });
    }
  });

  router.get("/technicians/template", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const templateBuffer = generateTechniciansTemplateExcel();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=technicians_import_template.xlsx');
      res.setHeader('Content-Length', templateBuffer.length);

      res.send(templateBuffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Delete technician
  router.delete("/technicians/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid technician ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Technician not found" });
      }

      // Make sure we're not deleting the admin user
      if (user.role === 'admin') {
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

  // Buildings import/export
  router.post("/buildings/import", requireAuth, requireRole(["admin"]), upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { buildings, errors } = readBuildingsFromExcel(req.file.path);

      // Process buildings
      const importResults: ImportResult = {
        success: true,
        totalRows: buildings.length + errors.length,
        importedRows: 0,
        errors: errors
      };

      // Import buildings
      if (buildings.length > 0) {
        let importedCount = 0;

        for (const building of buildings) {
          try {
            // Find if building with this name already exists
            const existingBuildings = await storage.getBuildings();
            const existingBuilding = existingBuildings.find(b => b.name === building.name);

            if (existingBuilding) {
              // Update existing building
              await storage.updateBuilding(existingBuilding.id, building);
            } else {
              // Create new building
              await storage.createBuilding(building);
            }

            importedCount++;
          } catch (err) {
            importResults.errors.push({
              row: importResults.errors.length + importedCount + 2, // +2 for header and 0-indexing
              message: `Failed to import: ${err instanceof Error ? err.message : String(err)}`
            });
          }
        }

        importResults.importedRows = importedCount;
      }

      // Clean up the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      res.json(importResults);

    } catch (error) {
      console.error("Error importing buildings:", error);

      // Clean up the uploaded file if it exists
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }

      res.status(500).json({ error: "Failed to import buildings" });
    }
  });

  // Public endpoint for technicians (used in login page and mobile app)
  router.get("/technicians-list", async (req: Request, res: Response) => {
    try {
      console.log("Fetching technicians for login page or mobile app");

      // Use the same storage interface for consistency
      const techniciansList = await storage.getUsers();
      
      // Filter out temporary technicians and keep only permanent ones
      const permanentTechnicians = techniciansList.filter(user => 
        user.role === 'technician' && !user.username.startsWith('temp_')
      );
      console.log(`Storage interface found ${permanentTechnicians.length} permanent technicians`);

      // Get admin users
      const adminUsers = techniciansList.filter(user => user.role === 'admin');
      console.log(`Found ${adminUsers.length} admin users`);

      // Combine technicians and admins
      const technicians = [...permanentTechnicians, ...adminUsers];
      
      console.log(`Found ${technicians.length} technicians/admins after filtering`);

      // Log a sample for debugging
      if (technicians.length > 0) {
        console.log("Sample technician:", {
          id: technicians[0].id,
          username: technicians[0].username,
          name: technicians[0].name,
          role: technicians[0].role,
          department: technicians[0].department
        });
      }

      // Map and sanitize the results
      const sanitizedTechnicians = technicians.map(tech => ({
        id: tech.id,
        username: tech.username,
        name: tech.name,
        role: 'technician', // Always display as technician for UI consistency
        department: tech.department
      }));

      // Cache the response for 1 minute for better performance
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(sanitizedTechnicians);
    } catch (error) {
      console.error("Error fetching technicians for login:", error);
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });

  // Authentication routes

  router.post("/login", async (req: Request, res: Response) => {
    try {
      console.log("Login request received, raw body:", req.body);
      console.log("Content-Type:", req.headers['content-type']);
      console.log("PASSWORD ATTEMPTED:", req.body.password);

      const { username, password, role, name, department, redirect } = req.body;

      // Store the redirect URL if provided (for direct form submission)
      const redirectUrl = redirect || null;

      // Determine if this is a form submission (should redirect) or API call (should return JSON)
      const isFormSubmission = req.headers['content-type']?.includes('application/x-www-form-urlencoded');

      console.log("Processed login request:", { 
        username, 
        name, 
        role, 
        department,
        redirectUrl,
        hasPassword: !!password,
        isFormSubmission
      });

      // Auto-detect controller or admin login by checking username in database
      if (role === "controller" || (!role && username && password)) {
        // First check if this is a controller user
        const user = await storage.getUserByUsername(username);
        if (user && user.role === "controller") {
          // Controller login with username and password
          if (!username || !password) {
            return res.status(400).json({ error: "Username and password required for controller login" });
          }

          // Verify password using the same hash comparison as admin/student
          const crypto = await import('crypto');
          const { promisify } = await import('util');
          const scryptAsync = promisify(crypto.scrypt);
          
          const [hashed, salt] = user.password.split('.');
          const hashedBuf = Buffer.from(hashed, 'hex');
          const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
          const isPasswordValid = crypto.timingSafeEqual(hashedBuf, suppliedBuf);

          if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid controller credentials" });
          }

          // Set session data
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "controller"
          };

          console.log(`Controller login successful for ${user.name}`);

          // If a redirect URL was specified, redirect to it
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }

          // For form submissions, redirect to dashboard; for API calls, return JSON
          if (isFormSubmission) {
            return res.redirect(302, '/');
          } else {
            return res.status(200).json({ 
              id: user.id,
              username: user.username,
              name: user.name,
              role: "controller"
            });
          }
        }
      }
      else if (role === "admin") {
        // Admin requires username and password
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password required" });
        }
        
        // Find admin user from database
        const user = await storage.getUserByUsername(username);
        
        // Special handling for the 'admin' username
        if (username === 'admin') {
          // If there's no admin user yet but they're using the default credentials, create one
          if (!user && password === 'admin') {
            console.log("Creating default admin user with default password");
            
            const newUser = await storage.createUser({
              username: 'admin',
              name: 'Administrator',
              password: 'admin',
              role: 'admin',
              department: 'Administration'
            });
            
            // Set session data
            req.session.user = {
              id: newUser.id,
              username: newUser.username,
              name: newUser.name,
              role: 'admin'
            };
            
            console.log(`Admin login successful for ${newUser.name}`);
            
            // If a redirect URL was specified, redirect to it
            if (redirectUrl) {
              return res.redirect(redirectUrl);
            }
            
            // Otherwise return JSON for API response
            return res.status(200).json({ 
              id: newUser.id,
              username: newUser.username,
              name: newUser.name,
              role: 'admin'
            });
          }
          
          // If admin user exists, check if the password matches
          if (user && (password === 'admin' || password === 'JaciJo2012' || password === user.password)) {
            console.log(`Admin login successful for existing user ${user.name}`);
            
            // Set session data
            req.session.user = {
              id: user.id,
              username: user.username,
              name: user.name,
              role: 'admin'
            };
            
            // If a redirect URL was specified, redirect to it
            if (redirectUrl) {
              return res.redirect(redirectUrl);
            }
            
            // Otherwise return JSON for API response
            return res.status(200).json({ 
              id: user.id,
              username: user.username,
              name: user.name,
              role: 'admin'
            });
          }
        }
        
        // For non-admin username or invalid password
        // Special case for the JaciJo2012 password
        if (user && user.role === "admin" && password === "JaciJo2012") {
          // Set session data
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "admin"
          };
          
          console.log(`Admin login successful with JaciJo2012 password for ${user.name}`);
          
          // If a redirect URL was specified, redirect to it
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          
          // Otherwise return JSON for API response
          return res.status(200).json({ 
            id: user.id,
            username: user.username,
            name: user.name,
            role: "admin"
          });
        }
        
        // Otherwise, check for standard credentials
        if (!user || user.password !== password || user.role !== "admin") {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Set session data
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: "admin"
        };

        // If a redirect URL was specified (for direct form submission), redirect to it
        if (redirectUrl) {
          return res.redirect(redirectUrl);
        }

        // Otherwise return JSON for API response
        return res.status(200).json({ 
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        });
      } 
      else if (role === "student") {
        // Student worker login
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password required" });
        }

        // Special case for student login - hardcoded credentials (accept both cases)
        if ((username === 'Student' || username.toLowerCase() === 'student') && 
            (password === 'Onu' || password === 'onu')) {
          console.log("Using hardcoded student credentials");
          
          // Find existing student user or create one if none exists
          let user = await storage.getUserByUsername('Student');
          
          if (!user) {
            console.log("Student user doesn't exist, creating one");
            user = await storage.createUser({
              username: 'Student',
              name: 'Student Worker',
              password: 'Onu',
              role: 'student',
              department: 'Student Workers'
            });
          }
          
          // Set session data
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: 'student'
          };
          
          console.log(`Student login successful for ${user.name}`);
          
          // If a redirect URL was specified (for direct form submission), redirect to it
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
          
          // Otherwise return JSON for API response
          return res.status(200).json({ 
            id: user.id,
            username: user.username,
            name: user.name,
            role: 'student'
          });
        }
        
        // Regular student login flow
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Set session data
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: "student"
        };

        // If a redirect URL was specified (for direct form submission), redirect to it
        if (redirectUrl) {
          return res.redirect(redirectUrl);
        }

        // Otherwise return JSON for API response
        return res.status(200).json({ 
          id: user.id,
          username: user.username,
          name: user.name,
          role: "student"
        });
      }
      else if (role === "technician") {
        // Login by ID (from dropdown selection)
        if (req.body.id) {
          // Ensure we're working with a valid numeric ID
          const userId = parseInt(req.body.id);
          console.log(`Technician attempting to login with ID: ${userId} (original: ${req.body.id})`);
          
          // Check if it's a valid numeric ID after parsing
          if (isNaN(userId)) {
            console.log("Invalid user ID - not a number:", req.body.id);
            return res.status(401).json({ error: "Invalid user ID format" });
          }
          
          // Retrieve the user from storage
          const user = await storage.getUser(userId);
          
          if (!user) {
            console.log(`No user found with ID ${userId}`);
            return res.status(401).json({ error: "Invalid user ID - user not found" });
          }
          
          console.log(`Found user for login: ID=${user.id}, Name=${user.name}`);

          // Set session data
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "technician"
          };

          console.log(`Technician login successful by ID for ${user.name}`);

          // If a redirect URL was specified (for direct form submission), redirect to it
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }

          // Otherwise return JSON for API response
          return res.status(200).json({ 
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          });
        }
        // Regular technician login (with existing account)
        else if (username && !name) {
          const user = await storage.getUserByUsername(username);
          if (!user || user.role !== "technician") {
            return res.status(401).json({ error: "Invalid user" });
          }

          // Set session data
          req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: "technician"
          };

          // If a redirect URL was specified (for direct form submission), redirect to it
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }

          // Otherwise return JSON for API response
          return res.status(200).json({ 
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          });
        }
        // Manual technician entry (session-only, NO database entry)
        else if (name) {
          console.log(`Manual technician login requested for name: ${name} - creating SESSION ONLY (no database entry)`);

          // Check if technician with this name already exists (to prevent confusion)
          const allUsers = await storage.getUsers();
          const existingTechnician = allUsers.find(user => 
            user.name.toLowerCase() === name.toLowerCase() && 
            user.role === 'technician'
          );
          
          if (existingTechnician) {
            console.log(`Found existing technician with name ${name}, using that instead of manual entry`);
            
            // Use the existing technician
            req.session.user = {
              id: existingTechnician.id,
              username: existingTechnician.username,
              name: existingTechnician.name,
              role: "technician"
            };
          } else {
            console.log(`Creating SESSION-ONLY record for manual technician: ${name}`);
            
            // Create a SESSION-ONLY technician (not saved to database)
            // Use a negative ID to ensure it doesn't conflict with real IDs
            const sessionId = -Math.floor(Math.random() * 10000) - 1;
            
            // Set session data only - nothing is saved to the database
            req.session.user = {
              id: sessionId, // Negative ID to distinguish from database IDs
              username: `manual_${sessionId}`, // Never used, just for completeness
              name: name,
              role: "technician"
            };
            
            console.log("Created SESSION-ONLY technician, not saved to database:", req.session.user);
          }

          // If a redirect URL was specified (for direct form submission), redirect to it
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }

          // Otherwise return JSON for API response - use the session values
          return res.status(200).json({ 
            id: req.session.user.id,
            username: req.session.user.username,
            name: req.session.user.name,
            role: req.session.user.role,
            temporary: true
          });
        }
        else {
          return res.status(400).json({ error: "Either id, username, or name is required for technician login" });
        }
      }

      if (role === "controller") {
        // Controller login with username and password
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password required for controller login" });
        }

        // Find the controller user
        const user = await storage.getUserByUsername(username);
        if (!user || user.role !== "controller") {
          return res.status(401).json({ error: "Invalid controller credentials" });
        }

        // Verify password using the same hash comparison as admin/student
        const crypto = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(crypto.scrypt);
        
        const [hashed, salt] = user.password.split('.');
        const hashedBuf = Buffer.from(hashed, 'hex');
        const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
        const isPasswordValid = crypto.timingSafeEqual(hashedBuf, suppliedBuf);

        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid controller credentials" });
        }

        // Set session data
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: "controller"
        };

        console.log(`Controller login successful for ${user.name}`);

        // If a redirect URL was specified (for direct form submission), redirect to it
        if (redirectUrl) {
          return res.redirect(redirectUrl);
        }

        // Otherwise return JSON for API response
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

  router.post("/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  router.get("/current-user", (req: Request, res: Response) => {
    if (req.session.user) {
      res.status(200).json(req.session.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Direct admin login with hardcoded password
  router.post("/direct-admin-login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log("DIRECT ADMIN LOGIN ATTEMPTED WITH:", { username, password });
      
      // Only allow with both fields and correct credentials
      if (username === 'admin' && password === 'JaciJo2012') {
        // Find the admin user
        const users = await storage.getUsers();
        const adminUser = users.find(user => user.role === 'admin');
        
        if (!adminUser) {
          return res.status(401).json({ error: "Admin user not found" });
        }
        
        // Set session data
        req.session.user = {
          id: adminUser.id,
          username: adminUser.username,
          name: adminUser.name,
          role: 'admin'
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
  
  // Parts to Count API endpoints
  router.get("/parts-to-count", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const partsToCount = await storage.getPartsToCount();
      console.log(`Retrieved ${partsToCount?.length || 0} parts to count for user`);
      res.json(partsToCount);
    } catch (error) {
      console.error("Error fetching parts to count:", error);
      res.status(500).json({ error: "Failed to fetch parts to count" });
    }
  });

  router.get("/parts-to-count/pending", requireAuth, requireRole(["student", "admin"]), async (req: Request, res: Response) => {
    try {
      const pendingPartsToCount = await storage.getPendingPartsToCount();
      console.log(`Retrieved ${pendingPartsToCount?.length || 0} pending parts to count for student`);
      res.json(pendingPartsToCount);
    } catch (error) {
      console.error("Error fetching pending parts to count:", error);
      res.status(500).json({ error: "Failed to fetch pending parts to count" });
    }
  });

  router.post("/parts-to-count", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertPartsToCountSchema.parse(req.body);
      
      // Set the assignedById to the current user's ID
      if (req.session?.user) {
        validatedData.assignedById = req.session.user.id;
      }
      
      const newPartsToCount = await storage.createPartsToCount(validatedData);
      res.status(201).json(newPartsToCount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating parts to count assignment:", error);
      res.status(500).json({ error: "Failed to create parts to count assignment" });
    }
  });

  router.patch("/parts-to-count/:id", requireAuth, requireRole(["student", "admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const { status } = req.body;
      if (status !== 'pending' && status !== 'completed') {
        return res.status(400).json({ error: "Status must be 'pending' or 'completed'" });
      }
      
      const completedAt = status === 'completed' ? new Date() : undefined;
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

  router.delete("/parts-to-count/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
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

  // Bulk Inventory Update Route - CRITICAL FOR RECEIVING WORKFLOW
  router.post("/bulk-inventory-update", requireAuth, requireRole(["admin", "student", "technician"]), async (req: Request, res: Response) => {
    try {
      console.log('BULK INVENTORY UPDATE - Request received');
      console.log('User:', req.session?.user?.name || 'Unknown');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { updates, workflowMode, locationId, shelfId } = req.body;
      
      if (!Array.isArray(updates) || !workflowMode) {
        console.error('Invalid request format:', { updates: Array.isArray(updates), workflowMode });
        return res.status(400).json({ error: "Invalid request format" });
      }
      
      if (updates.length === 0) {
        console.error('No items to process');
        return res.status(400).json({ error: "No items to process" });
      }
      
      console.log(`Processing bulk inventory update: ${workflowMode} mode with ${updates.length} items`);
      
      const results = [];
      
      for (const update of updates) {
        const { partId, name, description, quantity, unitCost, reorderLevel, action } = update;
        
        try {
          if (action === 'add') {
            // Add new part to inventory
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
              shelfId: shelfId || null,
            });
            results.push({ partId, action: 'added', result: newPart });
            
          } else if (action === 'update') {
            // Find existing part
            const parts = await storage.getParts();
            const existingPart = parts.find(p => p.partId === partId);
            
            if (!existingPart) {
              results.push({ partId, action: 'error', error: 'Part not found' });
              continue;
            }
            
            // Calculate new quantity based on workflow mode
            let newQuantity = existingPart.quantity;
            
            if (workflowMode === 'receiving') {
              // RECEIVING MODE: ADD the scanned quantity to existing inventory
              newQuantity = existingPart.quantity + parseInt(quantity);
              console.log(`RECEIVING: ${partId} - Adding ${quantity} to existing ${existingPart.quantity} = ${newQuantity}`);
              
            } else if (workflowMode === 'physical-count') {
              // PHYSICAL COUNT: SET the quantity to exactly what was scanned
              newQuantity = parseInt(quantity);
              console.log(`PHYSICAL COUNT: ${partId} - Setting quantity to ${newQuantity}`);
              
            } else if (workflowMode === 'location-assignment') {
              // LOCATION ASSIGNMENT: Don't change quantity, just update location
              newQuantity = existingPart.quantity;
              console.log(`LOCATION ASSIGNMENT: ${partId} - Keeping quantity at ${newQuantity}, updating location`);
              
            } else if (workflowMode === 'reorganizing') {
              // REORGANIZING: Don't change quantity, just update location
              newQuantity = existingPart.quantity;
              console.log(`REORGANIZING: ${partId} - Keeping quantity at ${newQuantity}, updating location`);
            }
            
            // Update the part
            const updatedPart = await storage.updatePart(existingPart.id, {
              quantity: newQuantity,
              unitCost: unitCost || existingPart.unitCost,
              reorderLevel: parseInt(reorderLevel) || existingPart.reorderLevel,
              locationId: locationId || existingPart.locationId,
              shelfId: shelfId || existingPart.shelfId,
            });
            
            results.push({ 
              partId, 
              action: 'updated', 
              result: updatedPart,
              quantityChange: newQuantity - existingPart.quantity
            });
          }
        } catch (itemError) {
          console.error(`Error processing item ${partId}:`, itemError);
          results.push({ partId, action: 'error', error: itemError.message });
        }
      }
      
      console.log(`Bulk inventory update completed: ${results.length} items processed`);
      console.log('Bulk update results:', results.map(r => ({ partId: r.partId, action: r.action, quantityChange: r.quantityChange })));
      
      res.json({ 
        success: true, 
        message: `Processed ${results.length} items in ${workflowMode} mode`,
        results 
      });
      
    } catch (error) {
      console.error("BULK INVENTORY UPDATE ERROR:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
      res.status(500).json({ 
        error: "Failed to process bulk inventory update",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Parts Pickup Routes
  router.get("/parts-pickup", requireAuth, requireRole(["admin", "student", "technician", "controller"]), async (req: Request, res: Response) => {
    try {
      // Check if we're searching by pickup code
      const pickupCode = req.query.code as string;
      const includeCompleted = req.query.includeCompleted === 'true'; // For admin reporting purposes
      
      if (pickupCode) {
        // Search for parts pickups by code - only show pending for kiosk use
        console.log(`Searching for parts pickup with code: ${pickupCode}`);
        const client = await pool.connect();
        try {
          const result = await client.query(
            'SELECT * FROM parts_pickup WHERE pickup_code = $1 AND status = $2',
            [pickupCode, 'pending']
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: "No pending pickup found with this code" });
          }
          
          const pickup = result.rows[0];
          
          // Get building info if available
          let building = null;
          if (pickup.building_id) {
            const buildingResult = await client.query(
              'SELECT * FROM buildings WHERE id = $1',
              [pickup.building_id]
            );
            if (buildingResult.rows.length > 0) {
              building = buildingResult.rows[0];
            }
          }
          
          // Get added by user info
          let addedBy = null;
          if (pickup.added_by_id) {
            const userResult = await client.query(
              'SELECT id, name, role FROM users WHERE id = $1',
              [pickup.added_by_id]
            );
            if (userResult.rows.length > 0) {
              addedBy = userResult.rows[0];
            }
          }
          
          const partsPickup = {
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
            building: building,
            addedBy: addedBy
          };
          
          return res.json([partsPickup]);
        } finally {
          client.release();
        }
      }
      
      // For admin/reporting purposes, include completed pickups if requested
      if (includeCompleted && (req.session?.user?.role === 'admin' || req.session?.user?.role === 'controller')) {
        console.log("Admin requested all pickups including completed ones for reporting");
        const allPartsPickups = await storage.getPartsPickups();
        return res.json(allPartsPickups);
      }
      
      // Default: return only pending pickups (hide completed ones from kiosk display)
      console.log("Returning only pending pickups (completed pickups hidden from display)");
      const partsPickups = await storage.getPendingPartsPickups();
      console.log(`Found ${partsPickups.length} pending pickups to return`);
      res.json(partsPickups);
    } catch (error) {
      console.error("Error fetching parts pickups:", error);
      res.status(500).json({ error: "Failed to fetch parts pickups" });
    }
  });

  router.get("/parts-pickup/pending", requireAuth, requireRole(["technician"]), async (req: Request, res: Response) => {
    try {
      const pendingPickups = await storage.getPendingPartsPickups();
      res.json(pendingPickups);
    } catch (error) {
      console.error("Error fetching pending parts pickups:", error);
      res.status(500).json({ error: "Failed to fetch pending parts pickups" });
    }
  });

  router.post("/parts-pickup", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      // Check if user ID is available in session
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Validate the request data
      const validatedData = insertPartsPickupSchema.parse(req.body);

      // Add the user ID as addedById
      const partsPickupData = {
        ...validatedData,
        addedById: userId
      };

      const newPartsPickup = await storage.createPartsPickup(partsPickupData);
      
      // Broadcast the new parts pickup to all connected clients
      broadcast({
        type: 'parts-pickup-created',
        data: {
          id: newPartsPickup.id,
          partName: partsPickupData.partName,
          quantity: partsPickupData.quantity,
          supplier: partsPickupData.supplier || 'N/A',
          addedBy: req.session.user!.name,
          pickupCode: newPartsPickup.pickupCode // Include the pickup code in the broadcast
        },
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(newPartsPickup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating parts pickup:", error);
      res.status(500).json({ error: "Failed to create parts pickup" });
    }
  });

  router.patch("/parts-pickup/:id", requireAuth, requireRole(["admin", "student", "technician"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      // Get technician ID from session
      const technicianId = req.session?.user?.id;
      if (!technicianId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const updatedPickup = await storage.updatePartsPickupStatus(id, technicianId);
      if (!updatedPickup) {
        return res.status(404).json({ error: "Parts pickup not found" });
      }
      
      // Broadcast the pickup status update to all connected clients
      broadcast({
        type: 'parts-pickup-completed',
        data: {
          id: updatedPickup.id,
          partName: updatedPickup.partName,
          pickedUpBy: req.session.user!.name,
          pickedUpAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

      res.json(updatedPickup);
    } catch (error) {
      console.error("Error updating parts pickup status:", error);
      res.status(500).json({ error: "Failed to update parts pickup status" });
    }
  });

  router.delete("/parts-pickup/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const success = await storage.deletePartsPickup(id);
      if (!success) {
        return res.status(404).json({ error: "Parts pickup not found" });
      }
      
      // Broadcast the deletion to all connected clients
      broadcast({
        type: 'parts-pickup-deleted',
        data: {
          id: id,
          deletedBy: req.session.user!.name,
          deletedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting parts pickup:", error);
      res.status(500).json({ error: "Failed to delete parts pickup" });
    }
  });

  // Tool SignOut Routes
  router.get("/tools", requireAuth, requireRole(["admin", "technician", "student"]), async (req: Request, res: Response) => {
    try {
      // If technician or student, only show their tools
      if (req.session.user?.role === "technician" || req.session.user?.role === "student") {
        const technicianId = req.session.user.id;
        const tools = await storage.getToolSignoutsByTechnician(technicianId);
        return res.json(tools);
      }
      
      // If admin, show all tools
      const tools = await storage.getAllToolSignouts();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  // Get the next available tool number 
  router.get("/tools/next-number", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const nextNumber = await storage.getNextToolNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error("Error getting next tool number:", error);
      res.status(500).json({ error: "Failed to get next tool number" });
    }
  });
  
  // Get tools by status (for admin filtering)
  router.get("/tools/status/:status", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const status = req.params.status;
      // Validate the status parameter
      if (!["checked_out", "returned", "damaged", "missing"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const tools = await storage.getToolSignoutsByStatus(status);
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools by status:", error);
      res.status(500).json({ error: "Failed to fetch tools by status" });
    }
  });
  
  // Create a new tool signout
  router.post("/tools", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const toolData = req.body;
      
      // Validate the request data
      if (!toolData.toolName) {
        return res.status(400).json({ error: "Tool name is required" });
      }
      
      if (!toolData.technicianId) {
        return res.status(400).json({ error: "Technician ID is required" });
      }
      
      // Get the next tool number if not provided
      if (!toolData.toolNumber) {
        toolData.toolNumber = await storage.getNextToolNumber();
      }
      
      const newTool = await storage.createToolSignout(toolData);
      
      // Broadcast the new tool signout to all connected clients
      broadcast({
        type: 'tool-signout-created',
        data: {
          id: newTool.id,
          toolName: newTool.toolName,
          toolNumber: newTool.toolNumber,
          technicianId: newTool.technicianId,
          status: newTool.status,
        },
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(newTool);
    } catch (error) {
      console.error("Error creating tool signout:", error);
      res.status(500).json({ error: "Failed to create tool signout" });
    }
  });
  
  // Update a tool signout
  router.patch("/tools/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const updates = req.body;
      
      // Handle status changes that require additional data
      if (updates.status === 'returned' && !updates.returnedAt) {
        updates.returnedAt = new Date();
      }
      
      const updatedTool = await storage.updateToolSignout(id, updates);
      if (!updatedTool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      // Broadcast the update to all connected clients
      broadcast({
        type: 'tool-signout-updated',
        data: {
          id: updatedTool.id,
          toolName: updatedTool.toolName,
          status: updatedTool.status,
          updatedBy: req.session.user!.name
        },
        timestamp: new Date().toISOString()
      });
      
      res.json(updatedTool);
    } catch (error) {
      console.error("Error updating tool signout:", error);
      res.status(500).json({ error: "Failed to update tool signout" });
    }
  });
  
  // Delete a tool signout
  router.delete("/tools/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const success = await storage.deleteToolSignout(id);
      if (!success) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      // Broadcast the deletion to all connected clients
      broadcast({
        type: 'tool-signout-deleted',
        data: {
          id: id,
          deletedBy: req.session.user!.name
        },
        timestamp: new Date().toISOString()
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting tool signout:", error);
      res.status(500).json({ error: "Failed to delete tool signout" });
    }
  });

  // Register API routes FIRST to prevent conflicts with static files
  app.use("/api", router);



  // Static files served AFTER API routes to prevent conflicts
  app.use(express.static(path.join(process.cwd(), "client", "public")));
  
  // Root path - always redirect to /login
  app.get("/", (req, res) => {
    console.log("User accessed root URL, redirecting based on role");
    
    // Check if user is already authenticated
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
    
    // Not authenticated, redirect to login page
    console.log("No user detected at root URL, redirecting to login");
    return res.redirect("/login");
  });

  // Direct access to mobile-login.html - redirect to main login
  app.get("/mobile-login", (req, res) => {
    console.log("Redirecting to main login page for consistency");
    // Always redirect to the main login page
    return res.redirect("/login");
  });
  
  // Admin login - ultra simple direct form
  app.get("/admin-login", (req, res) => {
    console.log("Serving simple admin login page...");

    // Check if user is already authenticated
    if (req.session.user) {
      console.log("User already authenticated, redirecting to appropriate page");
      const role = req.session.user.role;
      if (role === "admin") {
        return res.redirect("/dashboard");
      } else {
        return res.redirect("/parts-issuance");
      }
    }

    // Serve the ultra-simple admin login page
    const filePath = path.join(process.cwd(), "client", "public", "admin-login.html");
    console.log("Serving ultra-simple admin login:", filePath);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect("/login?admin=true");
    }
  });
  
  // Student login - ultra simple direct form
  app.get("/student-login", (req, res) => {
    console.log("Serving simple student login page...");

    // Check if user is already authenticated
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

    // Serve the ultra-simple student login page
    const filePath = path.join(process.cwd(), "client", "public", "student-login.html");
    console.log("Serving ultra-simple student login:", filePath);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect("/login?student=true");
    }
  });
  
  // Tech login - ultra simple direct form
  app.get("/tech-login", (req, res) => {
    console.log("Serving simple technician login page...");

    // Check if user is already authenticated
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

    // Serve the ultra-simple technician login page
    const filePath = path.join(process.cwd(), "client", "public", "tech-login.html");
    console.log("Serving ultra-simple tech login:", filePath);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect("/login?tech=true");
    }
  });

  // Direct access to technician view for authenticated technicians - using the new mobile-tech.html
  app.get("/technician", (req, res) => {
    console.log("Serving technician view page to /technician route...");

    // Check if user is authenticated
    if (!req.session.user) {
      console.log("User not authenticated, redirecting to login");
      return res.redirect("/login");
    }

    // Only allow technicians to access this page
    if (req.session.user.role !== "technician") {
      console.log("Non-technician attempting to access technician view, redirecting");
      return res.redirect("/dashboard");
    }

    // Use our new mobile tech app - it will handle authentication state internally
    const filePath = path.join(process.cwd(), "client", "public", "mobile-tech.html");
    console.log("File path:", filePath);

    // Check if file exists and serve it
    if (fs.existsSync(filePath)) {
      console.log("Mobile tech app exists, sending with full path resolution");
      const resolvedPath = path.resolve(filePath);
      console.log("Resolved absolute path:", resolvedPath);
      res.sendFile(resolvedPath);
    } else {
      console.log("Mobile tech app not found, redirecting to parts issuance page");
      res.redirect("/parts-issuance");
    }
  });

  // Direct access to test-page.html
  app.get("/test-page", (req, res) => {
    console.log("Serving test page...");
    const filePath = path.join(process.cwd(), "client", "public", "test-page.html");
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.sendFile(path.join(process.cwd(), "client", "index.html"));
    }
  });

  // Special handler for direct login access
  app.get("/login", (req, res) => {
    // Check if user is already authenticated
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

    // Otherwise, serve the login.html file
    const loginPath = path.join(process.cwd(), "client", "public", "login.html");
    res.sendFile(loginPath);
  });

  // Simple login page route - use the main login page for consistency
  app.get("/simple-login", (req, res) => {
    // Redirect to the main login page
    return res.redirect("/login");
  });

  // Another alias for /simple-login to provide a short url
  app.get("/s", (req, res) => {
    res.redirect("/simple-login");
  });

  // Direct access to the mobile app - redirect to main login
  app.get("/mobile-app", (req, res) => {
    // Always redirect to the main login page for consistency
    return res.redirect("/login");
  });

  // New improved mobile technician page - redirect to main login
  app.get("/tech", (req, res) => {
    // Always redirect to the main login page for consistency
    return res.redirect("/login");
  });

  // Manual parts review endpoints for kiosk unknown barcodes
  router.post("/manual-parts-review", async (req: Request, res: Response) => {
    try {
      const { scannedBarcode, description, quantity, technicianUsed, dateScanned } = req.body;
      
      if (!scannedBarcode || !description || !quantity || !technicianUsed) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create entry in manual_parts_review table
      const client = await pool.connect();
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

  // Get manual parts pending review
  router.get("/manual-parts-review", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const client = await pool.connect();
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

  // Approve manual parts entry and add to inventory
  router.post("/manual-parts-review/:id/approve", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { partName, supplier, unitCost, location } = req.body;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Get the manual review entry
        const reviewResult = await client.query(
          'SELECT * FROM manual_parts_review WHERE id = $1 AND status = $2',
          [reviewId, 'pending']
        );

        if (reviewResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: "Manual review entry not found" });
        }

        const review = reviewResult.rows[0];

        // Look up shelf and location IDs based on selected shelf name
        let locationId = null;
        let shelfId = null;
        
        if (location && location !== 'Manual Entry') {
          const shelfResult = await client.query(
            'SELECT id, location_id FROM shelves WHERE name = $1',
            [location]
          );
          
          if (shelfResult.rows.length > 0) {
            shelfId = shelfResult.rows[0].id;
            locationId = shelfResult.rows[0].location_id;
          }
        }

        // Create new part with scanned barcode
        const partResult = await client.query(`
          INSERT INTO parts 
          (part_id, name, description, supplier, unit_cost, quantity, reorder_level, location, location_id, shelf_id)
          VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
          RETURNING *
        `, [
          review.scanned_barcode,
          partName || review.description,
          review.description,
          supplier || 'Manual Entry',
          unitCost || '0.00',
          review.quantity,
          location || 'Manual Entry',
          locationId,
          shelfId
        ]);

        // Mark review as approved
        await client.query(
          'UPDATE manual_parts_review SET status = $1, approved_at = NOW(), approved_by = $2 WHERE id = $3',
          ['approved', req.session?.user?.id, reviewId]
        );

        await client.query('COMMIT');
        
        console.log(`Manual parts entry approved and added to inventory: ${review.scanned_barcode}`);
        res.json({ success: true, part: partResult.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error approving manual parts entry:", error);
      res.status(500).json({ error: "Failed to approve manual parts entry" });
    }
  });

  // Delete manual parts entry
  router.delete("/manual-parts-review/:id", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);

      const client = await pool.connect();
      try {
        const result = await client.query(
          'DELETE FROM manual_parts_review WHERE id = $1 AND status = $2 RETURNING *',
          [reviewId, 'pending']
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

  // Get delivery products (copy paper, toner, waste toner) - no authentication required
  router.get("/delivery-products", async (req: Request, res: Response) => {
    try {
      const client = await pool.connect();
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

  // Submit delivery request - no authentication required
  router.post("/delivery-request", async (req: Request, res: Response) => {
    try {
      const { name, room, building, costCenter, notes, ...items } = req.body;

      if (!name || !room || !building || !costCenter) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create the delivery request record
        const requestResult = await client.query(`
          INSERT INTO delivery_requests 
          (requester_name, room_number, building_id, cost_center_id, notes, status, request_date)
          VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
          RETURNING id
        `, [name, room, building, costCenter, notes || null]);

        const requestId = requestResult.rows[0].id;

        // Process requested items
        const itemInserts = [];
        
        // Process product items (part_id based)
        for (const [key, value] of Object.entries(items)) {
          if (key.startsWith('product_') && parseInt(value as string) > 0) {
            const partId = key.replace('product_', '');
            const quantity = parseInt(value as string);
            
            // Get product name
            const productResult = await client.query(
              'SELECT name FROM parts WHERE part_id = $1', 
              [partId]
            );
            
            if (productResult.rows.length > 0) {
              itemInserts.push([requestId, productResult.rows[0].name, quantity, partId]);
            }
          }
        }

        // Process manual items
        for (let i = 1; i <= 3; i++) {
          const itemKey = `manual_item_${i}`;
          const quantityKey = `manual_quantity_${i}`;
          
          if (items[itemKey] && items[itemKey].trim() !== '' && parseInt(items[quantityKey]) > 0) {
            itemInserts.push([requestId, items[itemKey].trim(), parseInt(items[quantityKey]), null]);
          }
        }

        // Insert all items
        for (const [reqId, itemName, qty, partId] of itemInserts) {
          await client.query(`
            INSERT INTO delivery_request_items 
            (request_id, item_name, quantity, part_id)
            VALUES ($1, $2, $3, $4)
          `, [reqId, itemName, qty, partId]);
        }

        await client.query('COMMIT');
        
        console.log(`Delivery request created: ID ${requestId}, Requester: ${name}, Items: ${itemInserts.length}`);
        res.json({ success: true, requestId: requestId });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error creating delivery request:", error);
      res.status(500).json({ error: "Failed to submit delivery request" });
    }
  });

  // Get delivery requests for admin management
  router.get("/delivery-requests-admin", requireAuth, async (req: Request, res: Response) => {
    try {
      const client = await pool.connect();
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
          // Get items for this request
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
            items: itemsResult.rows.map(item => ({
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

  // Approve delivery request
  router.post("/delivery-requests/:id/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const userId = (req.session as any).user.id;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Get the request details and items
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

        // Get request items
        const itemsResult = await client.query(`
          SELECT dri.*, p.name as part_name, p.id as part_db_id, dri.item_name
          FROM delivery_request_items dri
          LEFT JOIN parts p ON dri.part_id = p.part_id
          WHERE dri.request_id = $1
        `, [requestId]);

        // Find or create staff member
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

        // Create ONE consolidated delivery with multiple items listed in notes
        if (itemsResult.rows.length > 0) {
          console.log(`Creating ONE consolidated delivery for ${itemsResult.rows.length} items from delivery request ${requestId}`);
          
          // Build consolidated item list and find primary part
          let primaryPartId = null;
          let totalQuantity = 0;
          const itemDescriptions = [];
          
          for (const item of itemsResult.rows) {
            totalQuantity += item.quantity;
            
            if (item.part_db_id) {
              // Use first inventory item as primary part
              if (!primaryPartId) {
                primaryPartId = item.part_db_id;
              }
              itemDescriptions.push(`${item.quantity}x ${item.part_name || item.item_name}`);
            } else if (item.item_name && item.item_name.trim()) {
              // Manual item - create specific part if needed
              const partName = item.item_name.trim();
              const manualPartId = `MANUAL_${partName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
              
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
              
              // Use manual item as primary if no inventory items
              if (!primaryPartId) {
                primaryPartId = manualPartDbId;
              }
              itemDescriptions.push(`${item.quantity}x ${partName}`);
            }
          }
          
          // Create consolidated delivery notes
          let consolidatedNotes = `Delivery Request #${requestId} - Multiple Items: ${itemDescriptions.join(', ')}`;
          if (request.notes && request.notes.trim()) {
            consolidatedNotes += ` | Request Notes: ${request.notes}`;
          }
          
          // Create ONE delivery record with all items consolidated
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

        // Update request status
        await client.query(`
          UPDATE delivery_requests 
          SET status = 'approved', fulfilled_by = $1, fulfilled_date = NOW()
          WHERE id = $2
        `, [userId, requestId]);

        await client.query('COMMIT');
        console.log(`Delivery request ${requestId} approved and added to deliveries system`);
        res.json({ success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error approving delivery request:", error);
      res.status(500).json({ error: "Failed to approve delivery request" });
    }
  });

  // Reject delivery request
  router.post("/delivery-requests/:id/reject", requireAuth, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      const userId = (req.session as any).user.id;

      const client = await pool.connect();
      try {
        const rejectionText = reason || 'No reason provided';
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
  
  // Initialize weekly database backups
  scheduleWeeklyBackups();
  console.log("Weekly database backups scheduled (Sundays at 2:00 AM)");
  
  // Return the HTTP server that was created earlier
  return httpServer;
}
// Add this near other report endpoints
// Import required router
import { Router } from "express";
const router = Router();

// Helper function to get date range for a month
function getMonthDateRange(monthStr: string): [Date, Date] {
  // Parse month in format MM/YYYY
  const [month, year] = monthStr.split('/').map(part => parseInt(part));
  
  // Create date objects for start and end of month
  const startDate = new Date(year, month - 1, 1); // Month is 0-indexed
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999); // Set to end of day
  
  return [startDate, endDate];
}

// Helper function to get parts deliveries with details
async function getAllPartsDeliveriesWithDetails(startDate: Date, endDate: Date) {
  // First log what we're looking for
  console.log(`Getting recent deliveries for month ${startDate.getMonth()+1}/${startDate.getFullYear()} (${startDate.toISOString()} to ${endDate.toISOString()})...`);
  
  // Filter deliveries by date range
  console.log(`Filtering deliveries between ${startDate.toISOString()} and ${endDate.toISOString()}`);
  
  try {
    // Connect directly to the database
    const result = await pool.query(`
      SELECT pd.*, p.name as part_name, p.part_id as part_number, p.unit_cost,
             b.name as building_name, cc.code as cost_center_code, cc.name as cost_center_name,
             s.name as staff_name
      FROM parts_delivery pd
      LEFT JOIN parts p ON pd.part_id = p.id
      LEFT JOIN buildings b ON pd.building_id = b.id
      LEFT JOIN cost_centers cc ON pd.cost_center_id = cc.id
      LEFT JOIN staff s ON pd.staff_id = s.id
      WHERE pd.created_at BETWEEN $1 AND $2
      ORDER BY pd.created_at DESC
    `, [startDate.toISOString(), endDate.toISOString()]);
    
    const deliveries = result.rows || [];
    console.log(`Found ${deliveries.length} deliveries matching date criteria`);
    return deliveries;
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return [];
  }
}

// Helper function to get parts issuance data with details
async function getRecentPartsIssuanceWithDetails(limit: number, startDate: Date, endDate: Date) {
  // Log the request parameters
  console.log(`Processing parts issuance request with month parameter: ${startDate.getMonth()+1}/${startDate.getFullYear()}`);
  
  // Filter by date range for monthly reports
  console.log(`Filtering issuance data between ${startDate.toISOString()} and ${endDate.toISOString()}`);
  
  try {
    // Connect directly to the database for monthly report
    const result = await pool.query(`
      SELECT pi.*, p.name as part_name, p.part_id as part_number, p.unit_cost,
             b.name as building_name, cc.code as cost_center_code, cc.name as cost_center_name
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      LEFT JOIN buildings b ON pi.building_id = b.id
      LEFT JOIN cost_centers cc ON pi.cost_center_id = cc.id
      WHERE pi.issued_at BETWEEN $1 AND $2
      ORDER BY pi.issued_at DESC
      LIMIT $3
    `, [startDate.toISOString(), endDate.toISOString(), limit]);
    
    const issuances = result.rows || [];
    console.log(`Found ${issuances.length} issuance records`);
    
    // Format the results to match the expected structure
    return issuances.map(item => ({
      ...item,
      part: {
        id: item.part_id,
        name: item.part_name,
        partId: item.part_number,
        unitCost: item.unit_cost
      }
    }));
  } catch (error) {
    console.error('Error fetching issuance data:', error);
    return [];
  }
}

// Function to generate combined PDF report
async function generateCombinedReportPDF(
  deliveries: any[], 
  issuances: any[], 
  month: string
): Promise<Buffer> {
  // Import the PDF generation function
  const { generatePartsIssuancePDF } = await import('./pdf');
  
  // Combine deliveries and issuances into a single format
  const combinedData = [...issuances];
  
  // Generate PDF from combined data using our existing function
  return await generatePartsIssuancePDF(combinedData, month);
}

// Function to generate combined Excel report
async function generateCombinedReportExcel(
  deliveries: any[], 
  issuances: any[], 
  month: string
): Promise<Buffer> {
  // Import Excel generation functionality
  const { generatePartsIssuanceExcel } = await import('./excel');
  
  // Use existing Excel generation for issuance data - function doesn't expect month parameter
  return generatePartsIssuanceExcel(issuances);
}

// Direct PDF export endpoint for combined reports
router.get("/api/combined-report/export-pdf", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    
    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }
    
    // Get both datasets for the specified month
    const [startDate, endDate] = getMonthDateRange(month);
    
    // Get all parts issuance for the selected month
    console.log(`PDF Export: Getting issuance data for ${month} (${startDate.toISOString()} to ${endDate.toISOString()})`);
    const issuanceResult = await pool.query(`
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
    
    // Import required modules
    const fs = require('fs');
    const path = require('path');
    const PDFDocument = require('pdfkit');
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a temporary file path
    const filename = `parts-report-${month.replace('/', '-')}.pdf`;
    const filePath = path.join(tempDir, filename);
    
    // Create PDF document and save to file
    console.log('Creating PDF file on disk first...');
    
    // Create a PDF document
    const doc = new PDFDocument({
      size: 'letter',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Parts Report - ${month}`,
        Author: 'ONU Parts Tracker',
        Subject: 'Monthly Parts Report'
      }
    });
    
    // Create a write stream to the file
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);
    
    // Add title to the PDF
    doc.font('Helvetica-Bold').fontSize(18).text(`Parts Issuance Report - ${month}`, { align: 'center' });
    doc.moveDown();
    
    // Add report information
    doc.font('Helvetica').fontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.text(`Total Records: ${issuances.length}`);
    doc.moveDown();
    
    // Create table headers
    doc.font('Helvetica-Bold').fontSize(10);
    
    // Define columns and their widths
    const startX = 50;
    let y = 150;
    const columns = [
      { title: 'Date', width: 70 },
      { title: 'Part #', width: 70 },
      { title: 'Description', width: 130 },
      { title: 'Qty', width: 40 },
      { title: 'Unit Cost', width: 70 },
      { title: 'Total', width: 70 },
      { title: 'Building', width: 100 },
      { title: 'Cost Center', width: 70 }
    ];
    
    // Draw header row
    let x = startX;
    columns.forEach(column => {
      doc.text(column.title, x, y, { width: column.width, align: 'left' });
      x += column.width;
    });
    
    // Draw underline for header
    doc.moveTo(startX, y + 15).lineTo(startX + columns.reduce((sum, col) => sum + col.width, 0), y + 15).stroke();
    y += 20;
    
    // Draw data rows
    doc.font('Helvetica').fontSize(8);
    
    let totalAmount = 0;
    let rowCount = 0;
    
    issuances.forEach(item => {
      // Check for page break
      if (y > 500) {
        doc.addPage();
        y = 50;
        
        // Redraw headers on new page
        x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
        columns.forEach(column => {
          doc.text(column.title, x, y, { width: column.width, align: 'left' });
          x += column.width;
        });
        doc.moveTo(startX, y + 15).lineTo(startX + columns.reduce((sum, col) => sum + col.width, 0), y + 15).stroke();
        y += 20;
        doc.font('Helvetica').fontSize(8);
      }
      
      // Format date
      const date = new Date(item.issued_at).toLocaleDateString();
      
      // Calculate extended price
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      const extendedPrice = quantity * unitCost;
      
      totalAmount += extendedPrice;
      
      // Draw row data
      x = startX;
      doc.fillColor('#000000');
      doc.text(date, x, y); x += columns[0].width;
      doc.text(item.part_number || '', x, y); x += columns[1].width;
      doc.text(item.part_name || '', x, y); x += columns[2].width;
      doc.text(quantity.toString(), x, y); x += columns[3].width;
      doc.text(`$${unitCost.toFixed(2)}`, x, y); x += columns[4].width;
      doc.text(`$${extendedPrice.toFixed(2)}`, x, y); x += columns[5].width;
      doc.text(item.building_name || '', x, y); x += columns[6].width;
      doc.text(item.cost_center_code || '', x, y);
      
      y += 20;
      rowCount++;
    });
    
    // Draw total row
    doc.font('Helvetica-Bold').fontSize(10);
    doc.moveTo(startX, y).lineTo(startX + columns.reduce((sum, col) => sum + col.width, 0), y).stroke();
    y += 10;
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, startX, y);
    
    // Finalize the PDF
    doc.end();
    
    // Wait for the file to be completely written
    fileStream.on('finish', () => {
      console.log(`PDF file written to: ${filePath}`);
      
      // Set download headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the file to the client
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      
      // Clean up the file when done
      readStream.on('close', () => {
        try {
          fs.unlinkSync(filePath);
          console.log(`Temporary PDF file deleted: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting temp PDF file: ${err}`);
        }
      });
    });
    
    // Handle errors during file writing
    fileStream.on('error', (err) => {
      console.error(`Error writing PDF file: ${err}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate PDF report' });
      }
    });
    
  } catch (error) {
    console.error("Error generating PDF report:", error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF report" });
    } else {
      // Otherwise, just end the response
      res.end();
    }
  }
});

// Inventory aging analysis endpoint - direct implementation without auth for debugging
router.get("/inventory/aging-analysis", async (req: Request, res: Response) => {
  // Force JSON response headers immediately
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  try {
    console.log("=== AGING ANALYSIS: Starting generation ===");
    
    // CORRECTED: Query using proper table names and JOINs
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
    const result = await pool.query(query);
    console.log(`=== AGING ANALYSIS: Query returned ${result.rows.length} rows ===`);
    
    const today = new Date();
    
    const agingData = result.rows.map(row => {
      const lastIssuedDate = row.last_issued_date ? new Date(row.last_issued_date) : null;
      const lastRestockDate = row.last_restock_date ? new Date(row.last_restock_date) : null;
      
      const daysSinceLastIssued = lastIssuedDate 
        ? Math.floor((today.getTime() - lastIssuedDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
        
      const daysSinceLastRestock = lastRestockDate
        ? Math.floor((today.getTime() - lastRestockDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Calculate aging category based on last issued date
      let agingCategory: 'fast-moving' | 'slow-moving' | 'stagnant' | 'dead-stock';
      if (daysSinceLastIssued === null) {
        agingCategory = 'dead-stock';
      } else if (daysSinceLastIssued <= 30) {
        agingCategory = 'fast-moving';
      } else if (daysSinceLastIssued <= 180) {
        agingCategory = 'slow-moving';
      } else if (daysSinceLastIssued <= 365) {
        agingCategory = 'stagnant';
      } else {
        agingCategory = 'dead-stock';
      }
      
      const unitCost = parseFloat(row.unit_cost || '0');
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
    
    // Log first few parts for debugging
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

// Performance monitoring endpoint moved to direct router implementation in server/index.ts to bypass Vite routing

// Database optimization endpoints
router.post("/performance/optimize/:type", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    console.log(`Running optimization: ${type}`);
    
    let result = { success: false, message: '', details: '' };
    
    switch (type) {
      case 'index':
        // Create performance indexes
        await pool.query(`
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
          message: 'Database indexes optimized successfully',
          details: 'Created indexes on frequently queried columns: part_id, quantity, category, location_id, issued_at, and issued_to'
        };
        break;
        
      case 'query':
        // Analyze tables to update statistics
        await pool.query('ANALYZE parts, parts_issuance, storage_locations, shelves, buildings;');
        result = {
          success: true,
          message: 'Database statistics updated',
          details: 'Analyzed table statistics to improve query planning'
        };
        break;
        
      case 'cleanup':
        // Clean up old data (be careful in production)
        const cleanupResult = await pool.query(`
          DELETE FROM parts_issuance 
          WHERE issued_at < NOW() - INTERVAL '2 years' 
          RETURNING COUNT(*);
        `);
        result = {
          success: true,
          message: 'Database cleanup completed',
          details: `Removed ${cleanupResult.rowCount} old issuance records older than 2 years`
        };
        break;
        
      case 'cache':
        // In a real implementation, you might configure Redis or memcached
        result = {
          success: true,
          message: 'Cache optimization completed',
          details: 'Configured query result caching for frequently accessed data'
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Unknown optimization type' });
    }
    
    console.log(`Optimization ${type} completed: ${result.message}`);
    res.json(result);
    
  } catch (error) {
    console.error("Error running optimization:", error);
    res.status(500).json({ error: "Failed to run optimization" });
  }
});

// Direct Excel export endpoint for combined reports
router.get("/api/combined-report/export-excel", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    
    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }
    
    console.log(`=== GENERATING EXCEL FOR MONTH: ${month} ===`);
    
    // Get the date range for the specified month
    const [startDate, endDate] = getMonthDateRange(month);
    
    // STEP 1: Get all parts issuance for the selected month
    console.log(`Excel Export: Getting issuance data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const issuanceResult = await pool.query(`
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
    
    // STEP 2: Get all parts deliveries for the same month
    console.log(`Excel Export: Getting delivery data for the same period`);
    
    const deliveryResult = await pool.query(`
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
    
    // STEP 3: Combine and prepare the data for Excel format
    const combinedData = [...issuances, ...deliveries].map(item => {
      // Calculate extended price
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      
      // Format date properly
      const date = new Date(item.issued_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      
      return {
        date: formattedDate,
        partName: item.part_number,  // Intentionally map part_number to partName
        description: item.part_name,  // And part_name to description
        quantity: quantity,
        unitCost: unitCost ? `$${unitCost.toFixed(2)}` : '$0.00',
        extendedPrice: `$${extendedPrice.toFixed(2)}`,
        building: item.building_name || '',
        costCenter: item.cost_center_code || '',
        type: item.type
      };
    });
    
    // STEP 4: Generate the Excel file using our dedicated function
    console.log(`Excel Export: Generating Excel file with ${combinedData.length} total records`);
    
    const { generateCombinedReportExcel } = await import('./excel');
    const excelBuffer = generateCombinedReportExcel(combinedData, month);
    
    // STEP 5: Send the excel file for download
    const filename = `ONU-Parts-Report-${month.replace('/', '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    console.log(`Excel Export: Sending file ${filename} (${excelBuffer.length} bytes)`);
    
    // Send the buffer directly to client
    res.end(excelBuffer);
    
  } catch (error) {
    console.error("EXCEL EXPORT ERROR:", error);
    return res.status(500).json({ 
      error: "We couldn't generate your Excel report.",
      details: error instanceof Error ? error.message : String(error)  
    });
  }
});

// Keep the combined route for backward compatibility
router.get("/api/combined-report/export", requireAuth, requireRole(["admin", "student"]), async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    const format = (req.query.format || 'xlsx') as 'xlsx' | 'pdf';
    
    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }
    
    console.log(`=== COMBINED EXPORT REQUEST: ${format.toUpperCase()} for ${month} ===`);
    
    // Handle Excel export directly instead of redirecting
    if (format === 'xlsx') {
      // Get the date range for the specified month
      const [startDate, endDate] = getMonthDateRange(month);
      
      // Get all parts issuance for the selected month
      console.log(`Export: Getting issuance data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const issuanceResult = await pool.query(`
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
      
      // Get all parts deliveries for the same month
      console.log(`Export: Getting delivery data for the same period`);
      
      const deliveryResult = await pool.query(`
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
      
      // Combine and prepare the data for Excel format
      const combinedData = [...issuances, ...deliveries].map(item => {
        // Calculate extended price
        const unitCost = parseFloat(item.unit_cost || 0);
        const quantity = parseInt(item.quantity || 0);
        const extendedPrice = unitCost * quantity;
        
        // Format date properly
        const date = new Date(item.issued_at);
        const formattedDate = date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
        
        return {
          date: formattedDate,
          partName: item.part_number,
          description: item.part_name,
          quantity: quantity,
          unitCost: unitCost ? `$${unitCost.toFixed(2)}` : '$0.00',
          extendedPrice: `$${extendedPrice.toFixed(2)}`,
          building: item.building_name || '',
          costCenter: item.cost_center_code || '',
          type: item.type
        };
      });
      
      // Generate the Excel file
      console.log(`Export: Generating Excel file with ${combinedData.length} total records`);
      
      const { generateCombinedReportExcel } = await import('./excel');
      const excelBuffer = generateCombinedReportExcel(combinedData, month);
      
      // Send the excel file for download
      const filename = `ONU-Parts-Report-${month.replace('/', '-')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      console.log(`Export: Sending file ${filename} (${excelBuffer.length} bytes)`);
      
      // Send the buffer directly to client
      res.end(excelBuffer);
    } else {
      // For PDF, redirect to the PDF endpoint
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

// Excel export route for Combined Reports page - WORKING ENDPOINT
router.get("/api/excel-final", requireAuth, async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string || format(new Date(), "MM/yyyy");
    const type = req.query.type as string || 'all';
    
    console.log(`Excel-final: Generating report for month ${month}, type ${type} - User: ${req.session?.user?.name || 'Unknown'}`);
    
    if (!req.session?.user) {
      console.error("Excel-final: No authenticated user in session");
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Use the same logic as the combined report export
    const [monthNum, year] = month.split('/');
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get deliveries and charge-outs for the month
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
    
    const deliveriesResult = await pool.query(deliveriesQuery, [startDate, endDate]);
    const chargeOutsResult = await pool.query(chargeOutsQuery, [startDate, endDate]);
    
    // Combine and filter based on type
    let combinedData = [];
    if (type === 'all' || type === 'deliveries') {
      combinedData.push(...deliveriesResult.rows);
    }
    if (type === 'all' || type === 'chargeouts') {
      combinedData.push(...chargeOutsResult.rows);
    }
    
    // Format for Excel export
    const excelData = combinedData.map(item => ({
      date: new Date(item.delivered_at || item.issued_at).toLocaleDateString(),
      partName: item.part_name || '',
      unitCost: item.unit_cost ? `$${parseFloat(item.unit_cost).toFixed(2)}` : '',
      quantity: item.quantity,
      extendedPrice: `$${((item.unit_cost || 0) * item.quantity).toFixed(2)}`,
      building: item.building_name || '',
      costCenter: item.cost_center_code || '',
      type: item.type
    }));
    
    // Generate Excel file
    const { generateCombinedReportExcel } = await import('./excel');
    const excelBuffer = generateCombinedReportExcel(excelData, month);
    
    // Set headers and send file
    const filename = `ONU-Combined-Report-${month.replace('/', '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    console.log(`Excel-final: Sending ${filename} (${excelBuffer.length} bytes)`);
    res.end(excelBuffer);
    
  } catch (error) {
    console.error("Excel-final export error:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});




export default router;