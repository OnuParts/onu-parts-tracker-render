import pg from 'pg';
const { Pool } = pg;
import { 
  User, InsertUser, 
  Building, InsertBuilding, 
  Part, InsertPart, 
  PartsIssuance, InsertPartsIssuance, 
  PartWithAvailability,
  PartsIssuanceWithDetails,
  PartsToCount, InsertPartsToCount,
  PartsToCountWithDetails,
  StorageLocation, InsertStorageLocation,
  Shelf, InsertShelf,
  PartBarcode, InsertPartBarcode,
  PartBarcodeWithPart
} from '@shared/schema';
import { IStorage, NotificationSettings } from './storage';
import { log } from './vite';

// Initialize PostgreSQL connection pool from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    log(`Database connection error: ${err.message}`, 'postgres');
  } else {
    log(`Database connected at ${res.rows[0].now}`, 'postgres');
  }
});

/**
 * PostgreSQL Storage Implementation
 */
export class PgStorage implements IStorage {
  private initialized: boolean = false;
  private pool: pg.Pool;
  private notificationSettings: NotificationSettings = {
    system: {
      companyName: "Ohio Northern University",
      systemEmail: "m-gierhart@onu.edu"
    },
    workOrders: {
      newWorkOrders: true,
      statusChanges: true,
      comments: true,
    },
    inventory: {
      lowStockAlerts: true,
      partIssuance: true,
    }
  };

  constructor() {
    this.pool = pool; // Use the globally initialized pool
    this.initDb();
  }

  /**
   * Initialize the database tables if they don't exist
   */
  public async initDb() {
    if (this.initialized) return;

    try {
      // Start a transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Create users table
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

        // Create buildings table
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

        // Create parts table
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

        // Create parts_issuance table
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

        // Create notification_settings table
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
        
        // Check if parts_to_count table exists first to avoid duplicate error
        const tableCheckResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'parts_to_count'
          );
        `);
        
        if (!tableCheckResult.rows[0].exists) {
          // Create parts_to_count table only if it doesn't exist
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

        // Insert default notification settings if none exist
        await client.query(`
          INSERT INTO notification_settings 
            (work_orders_new, work_orders_status, work_orders_comments, 
             inventory_low_stock, inventory_issuance)
          SELECT TRUE, TRUE, TRUE, TRUE, TRUE
          WHERE NOT EXISTS (SELECT 1 FROM notification_settings)
        `);

        // Insert admin user if no users exist
        await client.query(`
          INSERT INTO users (username, password, name, email, role)
          SELECT 'admin', 'admin', 'Administrator', 'm-gierhart@onu.edu', 'admin'
          WHERE NOT EXISTS (SELECT 1 FROM users)
        `);

        await client.query('COMMIT');
        this.initialized = true;
        log('Database tables initialized successfully', 'postgres');
      } catch (err) {
        await client.query('ROLLBACK');
        log(`Database initialization error: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Database connection error: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error retrieving user: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error retrieving user by username: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
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
      log(`Error creating user: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      throw new Error(`Failed to create user: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Build dynamic query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (user.username !== undefined) {
        updates.push(`username = $${paramIndex++}`);
        values.push(user.username);
      }
      if (user.password !== undefined) {
        updates.push(`password = $${paramIndex++}`);
        values.push(user.password);
      }
      if (user.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(user.name);
      }
      if (user.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(user.role);
      }
      if (user.department !== undefined) {
        updates.push(`department = $${paramIndex++}`);
        values.push(user.department);
      }

      if (updates.length === 0) {
        return await this.getUser(id);
      }

      values.push(id);
      const query = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error updating user: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users ORDER BY name');
      
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      }));
    } catch (err) {
      log(`Error retrieving users: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  async getTechnicians(): Promise<User[]> {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE role = 'technician' ORDER BY name"
      );
      
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department
      }));
    } catch (err) {
      log(`Error retrieving technicians: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (err) {
      log(`Error deleting user: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    }
  }

  // Building operations
  async getBuilding(id: number): Promise<Building | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM buildings WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error retrieving building: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async getBuildings(): Promise<Building[]> {
    try {
      const result = await pool.query('SELECT * FROM buildings ORDER BY name');
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        location: row.location,
        description: row.description,
        contactPerson: row.contact_person,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        active: row.active !== false, // Default to true if not explicitly set to false
        createdAt: row.created_at
      }));
    } catch (err) {
      log(`Error retrieving buildings: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }
  
  // Get a cost center by its code
  async getCostCenterByCode(code: string): Promise<{ id: number, code: string, name: string } | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM cost_centers WHERE code = $1',
        [code]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        code: row.code,
        name: row.name
      };
    } catch (err) {
      log(`Error retrieving cost center by code: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async createBuilding(building: InsertBuilding): Promise<Building> {
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
          building.active !== undefined ? building.active : true
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
      log(`Error creating building: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      throw new Error(`Failed to create building: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async updateBuilding(id: number, building: Partial<InsertBuilding>): Promise<Building | undefined> {
    try {
      // Build dynamic query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (building.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(building.name);
      }
      if (building.location !== undefined) {
        updates.push(`location = $${paramIndex++}`);
        values.push(building.location);
      }
      if (building.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(building.description);
      }
      if (building.contactPerson !== undefined) {
        updates.push(`contact_person = $${paramIndex++}`);
        values.push(building.contactPerson);
      }
      if (building.contactEmail !== undefined) {
        updates.push(`contact_email = $${paramIndex++}`);
        values.push(building.contactEmail);
      }
      if (building.contactPhone !== undefined) {
        updates.push(`contact_phone = $${paramIndex++}`);
        values.push(building.contactPhone);
      }

      if (updates.length === 0) {
        return await this.getBuilding(id);
      }

      values.push(id);
      const query = `
        UPDATE buildings 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error updating building: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async deleteBuilding(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM buildings WHERE id = $1',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (err) {
      log(`Error deleting building: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    }
  }

  // Part operations
  async getPart(id: number): Promise<Part | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM parts WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error retrieving part: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async getPartByPartId(partId: string): Promise<Part | undefined> {
    try {
      console.log(`pgStorage.getPartByPartId - Looking for part with partId: "${partId}"`);
      
      // Add ILIKE to make the search case-insensitive and trim spaces
      const result = await pool.query(
        "SELECT * FROM parts WHERE part_id ILIKE $1",
        [partId.trim()]
      );
      
      console.log(`pgStorage.getPartByPartId - Query '${partId}' returned ${result.rows.length} rows`);
      
      if (result.rows.length === 0) {
        console.log(`pgStorage.getPartByPartId - No parts found with partId="${partId}"`);
        return undefined;
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
      log(`Error retrieving part by partId: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async getPartByBarcode(barcode: string): Promise<Part | undefined> {
    try {
      console.log(`pgStorage.getPartByBarcode - Looking for part with barcode: "${barcode}"`);
      
      // First check if barcode matches a part's primary part_id
      let result = await pool.query(
        "SELECT * FROM parts WHERE part_id ILIKE $1",
        [barcode.trim()]
      );
      
      // If not found, check the barcode mappings table
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
        return undefined;
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
      log(`Error retrieving part by barcode: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async createPart(part: InsertPart): Promise<Part> {
    try {
      // Function to safely truncate strings to prevent DB errors
      const safeStr = (str: string | null | undefined, maxLen: number): string | null => {
        if (str === null || str === undefined) return null;
        const strVal = String(str);
        return strVal.length > maxLen ? strVal.substring(0, maxLen) : strVal;
      };
      
      // Apply size limits based on database table constraints
      const safePart = {
        partId: safeStr(part.partId, 50),
        name: safeStr(part.name, 100),
        description: part.description, // TEXT field doesn't need truncation
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
      
      // Log part data for debugging
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
      log(`Error creating part: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      throw new Error(`Failed to create part: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined> {
    try {
      console.log(`updatePart: Attempting to update part ID ${id} with data:`, part);
      
      // Function to safely truncate strings to prevent DB errors
      const safeStr = (str: string | null | undefined, maxLen: number): string | null => {
        if (str === null || str === undefined) return null;
        const strVal = String(str);
        return strVal.length > maxLen ? strVal.substring(0, maxLen) : strVal;
      };
      
      // Build dynamic query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (part.partId !== undefined) {
        updates.push(`part_id = $${paramIndex++}`);
        values.push(safeStr(part.partId, 50));
      }
      if (part.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(safeStr(part.name, 100));
      }
      if (part.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(part.description); // TEXT field doesn't need truncation
      }
      if (part.quantity !== undefined) {
        updates.push(`quantity = $${paramIndex++}`);
        values.push(part.quantity);
      }
      if (part.reorderLevel !== undefined) {
        updates.push(`reorder_level = $${paramIndex++}`);
        values.push(part.reorderLevel);
      }
      if (part.unitCost !== undefined) {
        updates.push(`unit_cost = $${paramIndex++}`);
        values.push(part.unitCost);
      }
      if (part.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(safeStr(part.category, 50));
      }
      // Handle both the text location and the foreign key locationId and shelfId
      if (part.location !== undefined) {
        updates.push(`location = $${paramIndex++}`);
        values.push(safeStr(part.location, 100));
        console.log(`Updating location text to: ${part.location}`);
      }
      
      // Handle locationId separately - properly save it as a database column
      if (part.locationId !== undefined) {
        updates.push(`location_id = $${paramIndex++}`);
        values.push(part.locationId);
        console.log(`Updating location_id to: ${part.locationId}`);
      }
      
      // Handle shelfId separately - properly save it as a database column
      if (part.shelfId !== undefined) {
        updates.push(`shelf_id = $${paramIndex++}`);
        values.push(part.shelfId);
        console.log(`Updating shelf_id to: ${part.shelfId}`);
      }
      if (part.supplier !== undefined) {
        updates.push(`supplier = $${paramIndex++}`);
        values.push(safeStr(part.supplier, 100));
      }
      if (part.lastRestockDate !== undefined) {
        updates.push(`last_restock_date = $${paramIndex++}`);
        values.push(part.lastRestockDate);
      }

      if (updates.length === 0) {
        // If no updates are provided, just return the existing part
        console.log(`updatePart: No updates provided, returning existing part`);
        return await this.getPart(id);
      }

      values.push(id);
      const query = `
        UPDATE parts 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      
      console.log("Executing update query:", query);
      console.log("With values:", values);

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        console.log(`updatePart: No rows returned after update. Part ID ${id} not found.`);
        return undefined;
      }
      
      const row = result.rows[0];
      console.log(`updatePart: Successfully updated part ID ${id}. Returned row:`, row);
      
      // CRITICAL FIX: Return the updated part with all fields mapped correctly
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
      log(`Error updating part: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async deletePart(id: number): Promise<boolean> {
    try {
      // First check if this part is referenced in any deliveries
      const deliveriesCheck = await pool.query(
        'SELECT COUNT(*) FROM parts_delivery WHERE part_id = $1',
        [id]
      );
      
      const deliveryCount = parseInt(deliveriesCheck.rows[0].count);
      
      if (deliveryCount > 0) {
        // This part is used in deliveries, so we cannot delete it directly
        log(`Cannot delete part ${id} - referenced in ${deliveryCount} deliveries`, 'postgres');
        
        // Instead, we'll update the part to mark it as inactive or archived
        // This preserves the database integrity without losing historical records
        const updateResult = await pool.query(
          'UPDATE parts SET quantity = 0, location = NULL, location_id = NULL, shelf_id = NULL, ' +
          'name = CONCAT(name, \' (ARCHIVED)\') WHERE id = $1',
          [id]
        );
        
        return updateResult.rowCount > 0;
      } else {
        // No deliveries, safe to delete
        const result = await pool.query(
          'DELETE FROM parts WHERE id = $1',
          [id]
        );
        
        return result.rowCount > 0;
      }
    } catch (err) {
      log(`Error deleting part: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    }
  }

  async getParts(): Promise<Part[]> {
    try {
      console.log('Fetching all parts from database...');
      const result = await pool.query('SELECT * FROM parts ORDER BY name');
      console.log(`Found ${result.rows.length} parts total in database`);
      
      if (result.rows.length > 0) {
        console.log('First part sample:', result.rows[0]);
      }
      
      // Return all parts with location and shelf IDs included
      return result.rows.map(row => {
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
      log(`Error retrieving parts: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }
  
  async getPartsByLocation(locationId?: number, shelfId?: number): Promise<Part[]> {
    try {
      console.log(`GET /parts - Getting parts with filters: locationId=${locationId}, shelfId=${shelfId}`);
      
      // Since our database just has a text 'location' field, we need to determine 
      // the location and shelf names to filter parts
      let locationName = "";
      let shelfName = "";
      
      if (locationId) {
        const locationResult = await pool.query('SELECT name FROM storage_locations WHERE id = $1', [locationId]);
        if (locationResult.rows.length > 0) {
          locationName = locationResult.rows[0].name;
          console.log(`Looking for location name: ${locationName}`);
        }
      }
      
      if (shelfId) {
        const shelfResult = await pool.query('SELECT name FROM shelves WHERE id = $1', [shelfId]);
        if (shelfResult.rows.length > 0) {
          shelfName = shelfResult.rows[0].name;
          console.log(`Looking for shelf name: ${shelfName}`);
        }
      }
      
      let queryText = `SELECT * FROM parts`;
      const queryParams: any[] = [];
      
      // If we have both location and shelf, we need to filter for parts that have both in their location field
      if (locationName && shelfName) {
        queryText += ` WHERE location LIKE $1`;
        queryParams.push(`%${locationName}%${shelfName}%`);
      }
      // If we only have location name, filter for that
      else if (locationName) {
        queryText += ` WHERE location LIKE $1`;
        queryParams.push(`%${locationName}%`);
      }
      // If we only have shelf name, filter for that
      else if (shelfName) {
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
      
      return result.rows.map(row => ({
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
      log(`Error fetching parts by location: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  async getLowStockParts(): Promise<PartWithAvailability[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM parts 
        WHERE reorder_level IS NOT NULL AND quantity <= reorder_level
        ORDER BY name
      `);
      
      return result.rows.map(row => {
        // Calculate availability based on quantity and reorder level
        let availability: 'low' | 'medium' | 'high' = 'high';
        
        if (row.reorder_level !== null) {
          if (row.quantity <= row.reorder_level * 0.5) {
            availability = 'low';
          } else if (row.quantity <= row.reorder_level) {
            availability = 'medium';
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
      log(`Error retrieving low stock parts: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  // Parts Issuance operations
  async getPartsIssuance(id: number): Promise<PartsIssuance | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM parts_issuance WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        quantity: row.quantity,
        issuedAt: row.issued_at,
        issuedTo: row.issued_to,
        issuedById: row.issued_by_id, // Changed from issuedBy to issuedById to match database structure
        reason: row.reason,
        projectCode: row.project_code,
        notes: row.notes
      };
    } catch (err) {
      log(`Error retrieving parts issuance: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async createPartsIssuance(issuance: InsertPartsIssuance): Promise<PartsIssuance> {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // First, get the current part to check quantity
        const partResult = await client.query(
          'SELECT * FROM parts WHERE id = $1',
          [issuance.partId]
        );
        
        if (partResult.rows.length === 0) {
          throw new Error(`Part with ID ${issuance.partId} not found`);
        }
        
        const part = partResult.rows[0];
        
        if (part.quantity < issuance.quantity) {
          throw new Error(`Insufficient quantity available for part ${part.name}`);
        }
        
        // Update part quantity
        await client.query(
          'UPDATE parts SET quantity = quantity - $1 WHERE id = $2',
          [issuance.quantity, issuance.partId]
        );
        
        // Create issuance record
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
            issuance.issuedAt || new Date(),
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
        
        await client.query('COMMIT');
        
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
        await client.query('ROLLBACK');
        log(`Error in transaction - createPartsIssuance: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Error creating parts issuance: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      throw new Error(`Failed to create parts issuance: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async getPartsIssuanceByPartId(partId: number): Promise<PartsIssuanceWithDetails[]> {
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
      
      return result.rows.map(row => ({
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
          quantity: row.quantity, // We just show the issued quantity here
          reorderLevel: null,
          unitCost: row.part_unit_cost,
          category: row.part_category,
          location: row.part_location,
          supplier: null,
          lastRestockDate: null
        },
        issuedByUser: row.issued_by_id ? {
          id: row.issued_by_id,
          username: '',  // Don't expose username
          password: '',  // Don't expose password
          name: row.issued_by_name,
          role: row.issued_by_role,
          department: row.issued_by_department
        } : undefined
      }));
    } catch (err) {
      log(`Error retrieving parts issuance by part ID: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  async getRecentPartsIssuance(limit: number): Promise<PartsIssuanceWithDetails[]> {
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
      
      return result.rows.map(row => ({
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
          quantity: row.quantity, // We just show the issued quantity here
          reorderLevel: null,
          unitCost: row.part_unit_cost,
          category: row.part_category,
          location: row.part_location,
          supplier: null,
          lastRestockDate: null
        },
        issuedByUser: row.issued_by_id ? {
          id: row.issued_by_id,
          username: '',  // Don't expose username
          password: '',  // Don't expose password
          name: row.issued_by_name,
          role: row.issued_by_role,
          department: row.issued_by_department
        } : undefined
      }));
    } catch (err) {
      log(`Error retrieving recent parts issuance: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  async getMonthlyPartsIssuanceTotal(): Promise<number> {
    try {
      // First try to create the reset_flags table if it doesn't exist
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS reset_flags (
            key TEXT PRIMARY KEY,
            value BOOLEAN,
            reset_at TIMESTAMP
          )
        `);
        
        // Check for a manual reset flag in the table
        const resetResult = await pool.query(`
          SELECT value, reset_at 
          FROM reset_flags 
          WHERE key = 'monthly_issuance_reset'
        `);
        
        if (resetResult.rows.length > 0 && resetResult.rows[0].value === true) {
          const resetAt = new Date(resetResult.rows[0].reset_at);
          
          // Only count parts issued AFTER the reset
          const result = await pool.query(`
            SELECT COUNT(*) as total
            FROM parts_issuance
            WHERE issued_at > $1
          `, [resetAt]);
          
          return parseInt(result.rows[0].total, 10);
        }
      } catch (resetErr) {
        // If the reset_flags table doesn't exist, just ignore the error
        // and proceed with normal counting
        console.log("Reset flag check failed (table may not exist):", resetErr);
      }
      
      // If no valid reset flag is found, do the normal monthly count
      // FIXED: Use SUM of quantities rather than COUNT of rows to get accurate total
      const result = await pool.query(`
        SELECT COALESCE(SUM(quantity), 0) as total
        FROM parts_issuance
        WHERE issued_at >= date_trunc('month', CURRENT_DATE)
      `);
      
      console.log("Monthly parts issuance count result:", result.rows[0]);
      return parseInt(result.rows[0].total, 10);
    } catch (err) {
      log(`Error retrieving monthly parts issuance total: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return 0;
    }
  }
  
  // Update a parts issuance record
  async updatePartsIssuance(id: number, partsIssuanceUpdate: Partial<InsertPartsIssuance> & { building?: string, costCenter?: string }): Promise<PartsIssuance | undefined> {
    try {
      // Use a transaction to handle both updating the record and adjusting inventory if needed
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get the existing issuance record
        const getResult = await client.query(
          'SELECT * FROM parts_issuance WHERE id = $1',
          [id]
        );
        
        if (getResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return undefined;
        }
        
        const existing = getResult.rows[0];
        
        // Handle quantity changes by updating inventory
        if (partsIssuanceUpdate.quantity && partsIssuanceUpdate.quantity !== existing.quantity) {
          // Get current part information
          const partResult = await client.query(
            'SELECT * FROM parts WHERE id = $1',
            [existing.part_id]
          );
          
          if (partResult.rows.length > 0) {
            const part = partResult.rows[0];
            
            // Calculate quantity difference and new inventory level
            const quantityDifference = partsIssuanceUpdate.quantity - existing.quantity;
            const newPartQuantity = part.quantity - quantityDifference;
            
            // Ensure we don't set negative quantity
            if (newPartQuantity < 0) {
              await client.query('ROLLBACK');
              throw new Error(`Not enough parts in inventory. Only ${part.quantity} available.`);
            }
            
            // Update the part quantity
            await client.query(
              'UPDATE parts SET quantity = $1 WHERE id = $2',
              [newPartQuantity, part.id]
            );
          }
        }
        
        // Handle building updates - find building ID from name
        let buildingId = existing.building_id;
        if (partsIssuanceUpdate.building) {
          const buildingResult = await client.query(
            'SELECT id FROM buildings WHERE name = $1',
            [partsIssuanceUpdate.building]
          );
          if (buildingResult.rows.length > 0) {
            buildingId = buildingResult.rows[0].id;
          }
        }

        // Handle cost center updates - cost center is stored as code
        let costCenter = existing.cost_center;
        if (partsIssuanceUpdate.costCenter && partsIssuanceUpdate.costCenter !== 'none') {
          costCenter = partsIssuanceUpdate.costCenter;
        } else if (partsIssuanceUpdate.costCenter === 'none') {
          costCenter = null;
        }

        // Update the issuance record with the fields that actually exist in the database
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
        
        // Commit transaction
        await client.query('COMMIT');
        
        if (result.rowCount === 0) return undefined;
        
        // Convert DB row to PartsIssuance object - only include fields that actually exist in schema
        const updated: PartsIssuance = {
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
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating parts issuance:', error);
      throw error;
    }
  }
  
  // Delete a parts issuance record and restore the inventory
  async deletePartsIssuance(id: number): Promise<boolean> {
    try {
      log(`Attempting to delete parts issuance #${id}`, 'postgres');
      
      // Use a transaction to handle both deleting the record and updating inventory
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // First, get the issuance details to know how many parts to restore
        const issuanceResult = await client.query(
          'SELECT * FROM parts_issuance WHERE id = $1',
          [id]
        );
        
        if (issuanceResult.rows.length === 0) {
          log(`No issuance found with ID ${id}`, 'postgres');
          await client.query('ROLLBACK');
          return false;
        }
        
        const issuance = issuanceResult.rows[0];
        log(`Found issuance: ${issuance.quantity} of part ${issuance.part_id}`, 'postgres');
        
        // Restore the parts to inventory - add back the quantity
        await client.query(
          'UPDATE parts SET quantity = quantity + $1 WHERE id = $2',
          [issuance.quantity, issuance.part_id]
        );
        
        // Delete the issuance record
        const deleteResult = await client.query('DELETE FROM parts_issuance WHERE id = $1', [id]);
        log(`Delete result: ${deleteResult.rowCount} rows affected`, 'postgres');
        
        // Commit the transaction
        await client.query('COMMIT');
        
        log(`Successfully deleted parts issuance #${id} and restored ${issuance.quantity} items to inventory`, 'postgres');
        return true;
      } catch (err) {
        // Roll back the transaction on error
        await client.query('ROLLBACK');
        log(`Error in delete transaction: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
        return false;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Error deleting parts issuance: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    }
  }
  
  // Reset all parts issuance for a specific month
  async resetMonthlyPartsIssuance(year: number, month: number): Promise<boolean> {
    try {
      // Use a transaction to handle both deleting records and updating inventory
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Calculate the start and end date for the specified month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month at 23:59:59.999
        
        console.log(`Resetting parts issuance for ${month}/${year} (${startDate.toISOString()} to ${endDate.toISOString()})`);
        
        // First, get all issuance records for the month so we can restore inventory
        const issuanceResult = await client.query(
          'SELECT * FROM parts_issuance WHERE issued_at BETWEEN $1 AND $2',
          [startDate, endDate]
        );
        
        // For each issuance record, restore the parts to inventory
        for (const issuance of issuanceResult.rows) {
          await client.query(
            'UPDATE parts SET quantity = quantity + $1 WHERE id = $2',
            [issuance.quantity, issuance.part_id]
          );
          console.log(`Restored ${issuance.quantity} items of part ID ${issuance.part_id} to inventory`);
        }
        
        // Delete all issuance records for the month
        const deleteResult = await client.query(
          'DELETE FROM parts_issuance WHERE issued_at BETWEEN $1 AND $2',
          [startDate, endDate]
        );
        
        console.log(`Deleted ${deleteResult.rowCount} issuance records for ${month}/${year}`);
        
        // Also set the reset flag in the reset_flags table
        await client.query(`
          INSERT INTO reset_flags (key, value, reset_at)
          VALUES ('monthly_issuance_reset', true, NOW())
          ON CONFLICT (key) DO UPDATE
          SET value = true, reset_at = NOW()
        `);
        
        // Commit the transaction
        await client.query('COMMIT');
        
        return true;
      } catch (err) {
        // Roll back the transaction on error
        await client.query('ROLLBACK');
        log(`Error resetting monthly parts issuance: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
        return false;
      } finally {
        client.release();
      }
    } catch (err) {
      log(`Error resetting monthly parts issuance: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    }
  }

  // Parts to Count operations
  async createPartsToCount(partsToCount: InsertPartsToCount): Promise<PartsToCount> {
    try {
      const result = await pool.query(
        `INSERT INTO parts_to_count (part_id, assigned_by_id, status, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          partsToCount.partId,
          partsToCount.assignedById || null,
          partsToCount.status || 'pending',
          partsToCount.notes || null
        ]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        partId: row.part_id,
        assignedById: row.assigned_by_id,
        status: row.status || 'pending',
        assignedAt: row.assigned_at || new Date(),
        completedAt: row.completed_at,
        notes: row.notes
      };
    } catch (err) {
      log(`Error creating parts to count assignment: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      throw new Error(`Failed to create parts to count assignment: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  async getPartsToCount(): Promise<PartsToCountWithDetails[]> {
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
      
      return result.rows.map(row => ({
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
          password: '' // Password is not returned for security
        } : undefined
      }));
    } catch (err) {
      log(`Error retrieving parts to count: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }
  
  async getPendingPartsToCount(): Promise<PartsToCountWithDetails[]> {
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
      
      return result.rows.map(row => ({
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
          password: '' // Password is not returned for security
        } : undefined
      }));
    } catch (err) {
      log(`Error retrieving pending parts to count: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }
  
  async updatePartsToCountStatus(id: number, status: string, completedAt?: Date): Promise<PartsToCount | undefined> {
    try {
      const now = completedAt || (status === 'completed' ? new Date() : null);
      const result = await pool.query(
        `UPDATE parts_to_count 
         SET status = $1, 
             completed_at = $2
         WHERE id = $3
         RETURNING *`,
        [status, now, id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error updating parts to count status: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }
  
  async deletePartsToCount(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM parts_to_count WHERE id = $1',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (err) {
      log(`Error deleting parts to count: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    }
  }

  // Parts Pickup operations
  async getPartsPickup(id: number): Promise<PartsPickup | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM parts_pickup WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
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
      console.error('Error getting parts pickup:', error);
      return undefined;
    } finally {
      client.release();
    }
  }
  
  async getPartsPickups(): Promise<PartsPickupWithDetails[]> {
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
      
      return result.rows.map(row => {
        const building = row.building_id ? {
          id: row.building_id,
          name: row.building_name,
          description: row.building_description
        } : undefined;
        
        const addedBy = row.added_by_id ? {
          id: row.added_by_id,
          name: row.added_by_name
        } : undefined;
        
        const pickedUpBy = row.picked_up_by_id ? {
          id: row.picked_up_by_id,
          name: row.picked_up_by_name
        } : undefined;
        
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
          pickupCode: row.pickup_code, // Add pickup code to the returned object
          building,
          addedBy,
          pickedUpBy
        };
      });
    } catch (error) {
      console.error('Error getting parts pickups:', error);
      return [];
    } finally {
      client.release();
    }
  }
  
  async getPendingPartsPickups(): Promise<PartsPickupWithDetails[]> {
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
      
      return result.rows.map(row => {
        const building = row.building_id ? {
          id: row.building_id,
          name: row.building_name,
          description: row.building_description
        } : undefined;
        
        const addedBy = row.added_by_id ? {
          id: row.added_by_id,
          name: row.added_by_name
        } : undefined;
        
        const pickedUpBy = row.picked_up_by_id ? {
          id: row.picked_up_by_id,
          name: row.picked_up_by_name
        } : undefined;
        
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
          pickupCode: row.pickup_code, // Add pickup code to returned object
          building,
          addedBy,
          pickedUpBy
        };
      });
    } catch (error) {
      console.error('Error getting pending parts pickups:', error);
      return [];
    } finally {
      client.release();
    }
  }
  
  async createPartsPickup(partsPickup: InsertPartsPickup): Promise<PartsPickup> {
    const client = await this.pool.connect();
    try {
      // Generate a random 4-digit pickup code
      const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      const result = await client.query(`
        INSERT INTO parts_pickup (
          part_name, part_number, quantity, supplier, building_id,
          added_by_id, notes, tracking_number, po_number, status, pickup_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        partsPickup.partName,
        partsPickup.partNumber || null,
        partsPickup.quantity || 1,
        partsPickup.supplier || null,
        partsPickup.buildingId || null,
        partsPickup.addedById,
        partsPickup.notes || null,
        partsPickup.trackingNumber || null,
        partsPickup.poNumber || null,
        'pending', // Default status for new parts pickups
        pickupCode  // Add the random 4-digit code
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
      console.error('Error creating parts pickup:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async updatePartsPickupStatus(id: number, technicianId: number): Promise<PartsPickup | undefined> {
    const client = await this.pool.connect();
    try {
      const now = new Date();
      const result = await client.query(`
        UPDATE parts_pickup 
        SET status = 'completed', picked_up_by_id = $2, picked_up_at = $3
        WHERE id = $1
        RETURNING *
      `, [id, technicianId, now]);
      
      if (result.rows.length === 0) {
        return undefined;
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
      console.error('Error updating parts pickup status:', error);
      return undefined;
    } finally {
      client.release();
    }
  }
  
  async deletePartsPickup(id: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM parts_pickup WHERE id = $1 RETURNING id`,
        [id]
      );
      
      return result.rowCount === 1;
    } catch (error) {
      console.error('Error deleting parts pickup:', error);
      return false;
    } finally {
      client.release();
    }
  }

  // Tool SignOut Methods
  async getNextToolNumber(): Promise<number> {
    const client = await this.pool.connect();
    try {
      // Find the highest tool number currently in use, or default to 0
      const result = await client.query(
        `SELECT MAX(tool_number) as max_number FROM tool_signouts`
      );
      const maxToolNumber = result.rows[0].max_number || 0;
      // Return the next number in sequence
      return maxToolNumber + 1;
    } catch (error) {
      console.error("Error getting next tool number:", error);
      return 1; // Default to 1 if there's an error
    } finally {
      client.release();
    }
  }

  async createToolSignout(toolSignout: InsertToolSignout): Promise<ToolSignout> {
    const client = await this.pool.connect();
    try {
      // If tool number not provided, get the next available one
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
          toolSignout.status || 'checked_out',
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

  async getToolSignout(id: number): Promise<ToolSignout | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM tool_signouts WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error getting tool signout:", error);
      return undefined;
    } finally {
      client.release();
    }
  }

  async getAllToolSignouts(): Promise<ToolSignoutWithDetails[]> {
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

      return result.rows.map(row => {
        const technician = row.user_id ? {
          id: row.user_id,
          name: row.user_name,
          username: row.username,
          role: row.role,
          department: row.department
        } : undefined;

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

  async getToolSignoutsByTechnician(technicianId: number): Promise<ToolSignout[]> {
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

  async getToolSignoutsByStatus(status: string): Promise<ToolSignoutWithDetails[]> {
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

      return result.rows.map(row => {
        const technician = row.user_id ? {
          id: row.user_id,
          name: row.user_name,
          username: row.username,
          role: row.role,
          department: row.department
        } : undefined;

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

  async updateToolSignout(id: number, updates: Partial<ToolSignout>): Promise<ToolSignout | undefined> {
    const client = await this.pool.connect();
    try {
      // Get the existing tool signout
      const existingResult = await client.query(
        `SELECT * FROM tool_signouts WHERE id = $1`,
        [id]
      );

      if (existingResult.rows.length === 0) {
        return undefined;
      }

      const existing = existingResult.rows[0];

      // Special handling for returned status
      if (updates.status === 'returned' && !updates.returnedAt) {
        updates.returnedAt = new Date();
      }

      // Build the update query dynamically based on the fields that are provided
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updates.toolName !== undefined) {
        updateFields.push(`tool_name = $${paramIndex++}`);
        queryParams.push(updates.toolName);
      }

      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        queryParams.push(updates.status);
      }

      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        queryParams.push(updates.notes);
      }

      if (updates.returnedAt !== undefined) {
        updateFields.push(`returned_at = $${paramIndex++}`);
        queryParams.push(updates.returnedAt);
      }

      // Add the id as the last parameter
      queryParams.push(id);

      // If there are no fields to update, return the existing object
      if (updateFields.length === 0) {
        return existing;
      }

      // Execute the update query
      const result = await client.query(
        `UPDATE tool_signouts 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING id, tool_number, tool_name, technician_id, status, signed_out_at, returned_at, notes`,
        queryParams
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error updating tool signout:", error);
      return undefined;
    } finally {
      client.release();
    }
  }

  async deleteToolSignout(id: number): Promise<boolean> {
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
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const result = await pool.query('SELECT * FROM notification_settings LIMIT 1');
      
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
      log(`Error retrieving notification settings: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return this.notificationSettings;
    }
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
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
        // If no rows were updated, insert new settings
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
      log(`Error updating notification settings: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return this.notificationSettings;
    }
  }

  // Storage Location operations
  async getStorageLocation(id: number): Promise<StorageLocation | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM storage_locations WHERE id = $1',
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error('Error getting storage location:', error);
      return undefined;
    }
  }

  async getStorageLocations(): Promise<StorageLocation[]> {
    try {
      const result = await pool.query('SELECT * FROM storage_locations ORDER BY name');
      return result.rows;
    } catch (error) {
      console.error('Error getting storage locations:', error);
      return [];
    }
  }

  async createStorageLocation(location: InsertStorageLocation): Promise<StorageLocation> {
    try {
      const result = await pool.query(
        'INSERT INTO storage_locations (name, description, active) VALUES ($1, $2, $3) RETURNING *',
        [location.name, location.description || null, location.active !== undefined ? location.active : true]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating storage location:', error);
      throw error;
    }
  }

  async updateStorageLocation(id: number, location: Partial<InsertStorageLocation>): Promise<StorageLocation | undefined> {
    try {
      const current = await this.getStorageLocation(id);
      if (!current) return undefined;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (location.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(location.name);
      }
      if (location.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(location.description);
      }
      if (location.active !== undefined) {
        updates.push(`active = $${paramIndex++}`);
        values.push(location.active);
      }

      if (updates.length === 0) return current;

      values.push(id);
      const query = `UPDATE storage_locations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating storage location:', error);
      return undefined;
    }
  }

  async deleteStorageLocation(id: number): Promise<boolean> {
    try {
      // First check if there are any shelves referencing this location
      const shelvesResult = await pool.query(
        'SELECT COUNT(*) FROM shelves WHERE location_id = $1',
        [id]
      );
      if (parseInt(shelvesResult.rows[0].count) > 0) {
        throw new Error('Cannot delete location with associated shelves');
      }

      // Also check if there are any parts referencing this location
      const partsResult = await pool.query(
        'SELECT COUNT(*) FROM parts WHERE location_id = $1',
        [id]
      );
      if (parseInt(partsResult.rows[0].count) > 0) {
        throw new Error('Cannot delete location with associated parts');
      }

      const result = await pool.query('DELETE FROM storage_locations WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting storage location:', error);
      throw error;
    }
  }

  // Shelf operations
  async getShelf(id: number): Promise<Shelf | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM shelves WHERE id = $1',
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error('Error getting shelf:', error);
      return undefined;
    }
  }

  async getShelves(): Promise<Shelf[]> {
    try {
      console.log("pgStorage.getShelves() called - fetching shelves from database");
      // Remove any LIMIT that might be restricting the results
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
        // Double-check with count query to ensure we're not missing data
        const countResult = await pool.query('SELECT COUNT(*) FROM shelves');
        const count = parseInt(countResult.rows[0].count);
        console.log(`Double-check count query shows ${count} shelves in database`);
      } else {
        // Log some samples to debug
        console.log("Sample shelves:", result.rows.slice(0, 5));
      }
      
      return result.rows;
    } catch (error) {
      console.error('Error getting shelves:', error);
      return [];
    }
  }

  async getShelvesByLocation(locationId: number): Promise<Shelf[]> {
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
      console.error('Error getting shelves by location:', error);
      return [];
    }
  }

  async createShelf(shelf: InsertShelf): Promise<Shelf> {
    try {
      // First check if the location exists
      const locationExists = await this.getStorageLocation(shelf.locationId);
      if (!locationExists) {
        throw new Error(`Location with ID ${shelf.locationId} does not exist`);
      }

      const result = await pool.query(
        'INSERT INTO shelves (location_id, name, description, active) VALUES ($1, $2, $3, $4) RETURNING *',
        [shelf.locationId, shelf.name, shelf.description || null, shelf.active !== undefined ? shelf.active : true]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating shelf:', error);
      throw error;
    }
  }

  async updateShelf(id: number, shelf: Partial<InsertShelf>): Promise<Shelf | undefined> {
    try {
      const current = await this.getShelf(id);
      if (!current) return undefined;

      // If location ID is being updated, verify it exists
      if (shelf.locationId !== undefined && shelf.locationId !== current.locationId) {
        const locationExists = await this.getStorageLocation(shelf.locationId);
        if (!locationExists) {
          throw new Error(`Location with ID ${shelf.locationId} does not exist`);
        }
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (shelf.locationId !== undefined) {
        updates.push(`location_id = $${paramIndex++}`);
        values.push(shelf.locationId);
      }
      if (shelf.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(shelf.name);
      }
      if (shelf.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(shelf.description);
      }
      if (shelf.active !== undefined) {
        updates.push(`active = $${paramIndex++}`);
        values.push(shelf.active);
      }

      if (updates.length === 0) return current;

      values.push(id);
      const query = `UPDATE shelves SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating shelf:', error);
      throw error;
    }
  }

  async deleteShelf(id: number): Promise<boolean> {
    try {
      // Check if there are any parts referencing this shelf
      const partsResult = await pool.query(
        'SELECT COUNT(*) FROM parts WHERE shelf_id = $1',
        [id]
      );
      if (parseInt(partsResult.rows[0].count) > 0) {
        throw new Error('Cannot delete shelf with associated parts');
      }

      const result = await pool.query('DELETE FROM shelves WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting shelf:', error);
      throw error;
    }
  }
  
  // Tool SignOut System Methods
  
  async getNextToolNumber(): Promise<number> {
    try {
      // Get the highest tool number currently in use
      const result = await pool.query('SELECT MAX(tool_number) as max_number FROM tool_signouts');
      
      // If no tools exist yet, start at 1, otherwise increment by 1
      const maxNumber = result.rows[0].max_number || 0;
      return maxNumber + 1;
    } catch (error) {
      console.error('Error getting next tool number:', error);
      return 1; // Default to 1 if there's an error
    }
  }
  
  async createToolSignout(toolSignout: InsertToolSignout): Promise<ToolSignout> {
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
        toolSignout.status || 'checked_out'
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
      console.error('Error creating tool signout:', error);
      throw error;
    }
  }
  
  async getToolSignout(id: number): Promise<ToolSignout | undefined> {
    try {
      const result = await pool.query(`
        SELECT * FROM tool_signouts
        WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
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
      console.error('Error getting tool signout:', error);
      return undefined;
    }
  }
  
  async getAllToolSignouts(): Promise<ToolSignoutWithDetails[]> {
    try {
      const result = await pool.query(`
        SELECT ts.*, 
               u.id as user_id, u.name as user_name, u.role as user_role
        FROM tool_signouts ts
        LEFT JOIN users u ON ts.technician_id = u.id
        ORDER BY ts.signed_out_at DESC
      `);
      
      return result.rows.map(row => {
        // Create technician object if technician data exists
        let technician = undefined;
        if (row.user_id) {
          technician = {
            id: row.user_id,
            name: row.user_name,
            role: row.user_role,
            username: '', // We don't need the username here
            password: '', // We don't expose passwords
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
      console.error('Error getting all tool signouts:', error);
      return [];
    }
  }
  
  async getToolSignoutsByTechnician(technicianId: number): Promise<ToolSignout[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM tool_signouts
        WHERE technician_id = $1
        ORDER BY signed_out_at DESC
      `, [technicianId]);
      
      return result.rows.map(row => ({
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
      console.error('Error getting tool signouts by technician:', error);
      return [];
    }
  }
  
  async getToolSignoutsByStatus(status: string): Promise<ToolSignoutWithDetails[]> {
    try {
      const result = await pool.query(`
        SELECT ts.*, 
               u.id as user_id, u.name as user_name, u.role as user_role
        FROM tool_signouts ts
        LEFT JOIN users u ON ts.technician_id = u.id
        WHERE ts.status = $1
        ORDER BY ts.signed_out_at DESC
      `, [status]);
      
      return result.rows.map(row => {
        // Create technician object if technician data exists
        let technician = undefined;
        if (row.user_id) {
          technician = {
            id: row.user_id,
            name: row.user_name,
            role: row.user_role,
            username: '', // We don't need the username here
            password: '', // We don't expose passwords
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
      console.error('Error getting tool signouts by status:', error);
      return [];
    }
  }
  
  async updateToolSignout(id: number, updates: Partial<ToolSignout>): Promise<ToolSignout | undefined> {
    try {
      // Build the SET clause dynamically based on provided updates
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (updates.toolName !== undefined) {
        updateFields.push(`tool_name = $${paramIndex++}`);
        values.push(updates.toolName);
      }
      
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      
      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }
      
      if (updates.returnedAt !== undefined) {
        updateFields.push(`returned_at = $${paramIndex++}`);
        values.push(updates.returnedAt);
      }
      
      // Add id as the last parameter
      values.push(id);
      
      if (updateFields.length === 0) {
        return await this.getToolSignout(id);
      }
      
      const result = await pool.query(`
        UPDATE tool_signouts
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return undefined;
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
      console.error('Error updating tool signout:', error);
      return undefined;
    }
  }
  
  async deleteToolSignout(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`
        DELETE FROM tool_signouts
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting tool signout:', error);
      return false;
    }
  }

  // Get parts with their usage statistics
  async getPartsWithUsage(timeFrameDays: number = 90): Promise<any[]> {
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
  async getUsageAnalyticsSummary(timeFrameDays: number = 90): Promise<any> {
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
  async getPartBarcodes(partId: number): Promise<PartBarcode[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM part_barcodes 
        WHERE part_id = $1 AND active = true
        ORDER BY is_primary DESC, created_at ASC
      `, [partId]);
      
      return result.rows.map(row => ({
        id: row.id,
        partId: row.part_id,
        barcode: row.barcode,
        supplier: row.supplier,
        isPrimary: row.is_primary,
        active: row.active,
        createdAt: row.created_at
      }));
    } catch (err) {
      log(`Error retrieving part barcodes: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  async getAllPartBarcodes(): Promise<PartBarcodeWithPart[]> {
    try {
      const result = await pool.query(`
        SELECT pb.*, p.part_id, p.name as part_name, p.description as part_description
        FROM part_barcodes pb
        INNER JOIN parts p ON pb.part_id = p.id
        WHERE pb.active = true
        ORDER BY p.part_id, pb.is_primary DESC, pb.created_at ASC
      `);
      
      return result.rows.map(row => ({
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
          quantity: 0, // We don't need full part data here
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
      log(`Error retrieving all part barcodes: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return [];
    }
  }

  async createPartBarcode(barcode: InsertPartBarcode): Promise<PartBarcode> {
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
      log(`Error creating part barcode: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      throw err;
    }
  }

  async updatePartBarcode(id: number, barcode: Partial<InsertPartBarcode>): Promise<PartBarcode | undefined> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (barcode.barcode !== undefined) {
        updateFields.push(`barcode = $${paramIndex++}`);
        values.push(barcode.barcode);
      }
      
      if (barcode.supplier !== undefined) {
        updateFields.push(`supplier = $${paramIndex++}`);
        values.push(barcode.supplier);
      }
      
      if (barcode.isPrimary !== undefined) {
        updateFields.push(`is_primary = $${paramIndex++}`);
        values.push(barcode.isPrimary);
      }
      
      if (barcode.active !== undefined) {
        updateFields.push(`active = $${paramIndex++}`);
        values.push(barcode.active);
      }
      
      if (updateFields.length === 0) {
        return undefined;
      }
      
      values.push(id);
      
      const result = await pool.query(`
        UPDATE part_barcodes 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return undefined;
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
      log(`Error updating part barcode: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return undefined;
    }
  }

  async deletePartBarcode(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`
        DELETE FROM part_barcodes 
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rowCount! > 0;
    } catch (err) {
      log(`Error deleting part barcode: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    }
  }

  async setPartBarcodePrimary(partId: number, barcodeId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First, remove primary status from all barcodes for this part
      await client.query(`
        UPDATE part_barcodes 
        SET is_primary = false 
        WHERE part_id = $1
      `, [partId]);
      
      // Then set the specified barcode as primary
      const result = await client.query(`
        UPDATE part_barcodes 
        SET is_primary = true 
        WHERE id = $1 AND part_id = $2
        RETURNING id
      `, [barcodeId, partId]);
      
      await client.query('COMMIT');
      return result.rowCount! > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      log(`Error setting part barcode primary: ${err instanceof Error ? err.message : String(err)}`, 'postgres');
      return false;
    } finally {
      client.release();
    }
  }
}

// Export a singleton instance of the PostgreSQL storage
export const pgStorage = new PgStorage();