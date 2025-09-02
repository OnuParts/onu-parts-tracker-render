import { 
  User, 
  InsertUser,
  Building,
  InsertBuilding,
  Part, 
  InsertPart, 
  PartsIssuance, 
  InsertPartsIssuance,
  PartWithAvailability,
  PartsIssuanceWithDetails,
  PartsToCount,
  InsertPartsToCount,
  PartsToCountWithDetails,
  StorageLocation,
  InsertStorageLocation,
  Shelf,
  InsertShelf,
  PartsPickup,
  InsertPartsPickup,
  PartsPickupWithDetails,
  ToolSignout,
  InsertToolSignout,
  ToolSignoutWithDetails,
  ArchivedPartsIssuance,
  InsertArchivedPartsIssuance,
  ArchivedPartsIssuanceWithDetails,
  PartBarcode,
  InsertPartBarcode,
  PartBarcodeWithPart
} from "@shared/schema";

// Storage Interface
// Define a type for notification settings and system information
export interface NotificationSettings {
  // System settings
  system?: {
    companyName: string;
    systemEmail: string;
  };
  workOrders: {
    newWorkOrders: boolean;
    statusChanges: boolean;
    comments: boolean;
  };
  inventory: {
    lowStockAlerts: boolean;
    partIssuance: boolean;
  };
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getTechnicians(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Building operations
  getBuilding(id: number): Promise<Building | undefined>;
  getBuildings(): Promise<Building[]>;
  createBuilding(building: InsertBuilding): Promise<Building>;
  updateBuilding(id: number, building: Partial<InsertBuilding>): Promise<Building | undefined>;
  deleteBuilding(id: number): Promise<boolean>;

  // Storage Location operations
  getStorageLocation(id: number): Promise<StorageLocation | undefined>;
  getStorageLocations(): Promise<StorageLocation[]>;
  createStorageLocation(location: InsertStorageLocation): Promise<StorageLocation>;
  updateStorageLocation(id: number, location: Partial<InsertStorageLocation>): Promise<StorageLocation | undefined>;
  deleteStorageLocation(id: number): Promise<boolean>;

  // Shelf operations
  getShelf(id: number): Promise<Shelf | undefined>;
  getShelves(): Promise<Shelf[]>;
  getShelvesByLocation(locationId: number): Promise<Shelf[]>;
  createShelf(shelf: InsertShelf): Promise<Shelf>;
  updateShelf(id: number, shelf: Partial<InsertShelf>): Promise<Shelf | undefined>;
  deleteShelf(id: number): Promise<boolean>;

  // Part operations
  getPart(id: number): Promise<Part | undefined>;
  getPartByPartId(partId: string): Promise<Part | undefined>;
  getPartByBarcode(barcode: string): Promise<Part | undefined>;
  createPart(part: InsertPart): Promise<Part>;
  updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined>;
  deletePart(id: number): Promise<boolean>;
  getParts(): Promise<Part[]>;
  getPartsByLocation(locationId?: number, shelfId?: number): Promise<Part[]>;
  getLowStockParts(): Promise<PartWithAvailability[]>;
  
  // Barcode operations
  getPartBarcodes(partId: number): Promise<PartBarcode[]>;
  getAllPartBarcodes(): Promise<PartBarcodeWithPart[]>;
  createPartBarcode(barcode: InsertPartBarcode): Promise<PartBarcode>;
  updatePartBarcode(id: number, barcode: Partial<InsertPartBarcode>): Promise<PartBarcode | undefined>;
  deletePartBarcode(id: number): Promise<boolean>;
  setPartBarcodePrimary(partId: number, barcodeId: number): Promise<boolean>;
  
  // Parts Issuance operations
  getPartsIssuance(id: number): Promise<PartsIssuance | undefined>;
  createPartsIssuance(partsIssuance: InsertPartsIssuance): Promise<PartsIssuance>;
  updatePartsIssuance(id: number, partsIssuance: Partial<InsertPartsIssuance>): Promise<PartsIssuance | undefined>;
  deletePartsIssuance(id: number): Promise<boolean>;
  getPartsIssuanceByPartId(partId: number): Promise<PartsIssuanceWithDetails[]>;
  getRecentPartsIssuance(limit: number): Promise<PartsIssuanceWithDetails[]>;
  getMonthlyPartsIssuanceTotal(): Promise<number>;
  
  // Archive operations
  archiveChargeOutsByMonth(month: string): Promise<{ count: number }>;
  getArchivedChargeOuts(month?: string, limit?: number): Promise<ArchivedPartsIssuanceWithDetails[]>;

  // Parts to Count operations
  createPartsToCount(partsToCount: InsertPartsToCount): Promise<PartsToCount>;
  getPartsToCount(): Promise<PartsToCountWithDetails[]>;
  getPendingPartsToCount(): Promise<PartsToCountWithDetails[]>;
  updatePartsToCountStatus(id: number, status: string, completedAt?: Date): Promise<PartsToCount | undefined>;
  deletePartsToCount(id: number): Promise<boolean>;
  
  // Parts Pickup operations
  getPartsPickup(id: number): Promise<PartsPickup | undefined>;
  getPartsPickups(): Promise<PartsPickupWithDetails[]>;
  getPendingPartsPickups(): Promise<PartsPickupWithDetails[]>;
  createPartsPickup(partsPickup: InsertPartsPickup): Promise<PartsPickup>;
  updatePartsPickupStatus(id: number, technicianId: number): Promise<PartsPickup | undefined>;
  deletePartsPickup(id: number): Promise<boolean>;
  
  // Settings operations
  getNotificationSettings(): Promise<NotificationSettings>;
  updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings>;
  
  // Tool SignOut operations
  getNextToolNumber(): Promise<number>;
  createToolSignout(toolSignout: InsertToolSignout): Promise<ToolSignout>;
  getToolSignout(id: number): Promise<ToolSignout | undefined>;
  getAllToolSignouts(): Promise<ToolSignoutWithDetails[]>;
  getToolSignoutsByTechnician(technicianId: number): Promise<ToolSignout[]>;
  getToolSignoutsByStatus(status: string): Promise<ToolSignoutWithDetails[]>;
  updateToolSignout(id: number, updates: Partial<ToolSignout>): Promise<ToolSignout | undefined>;
  deleteToolSignout(id: number): Promise<boolean>;

  // Usage analytics
  getPartsWithUsage(timeFrameDays?: number): Promise<any[]>;
  getUsageAnalyticsSummary(timeFrameDays?: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private buildings: Map<number, Building>;
  private parts: Map<number, Part>;
  private partsIssuance: Map<number, PartsIssuance>;
  private archivedPartsIssuance: Map<number, ArchivedPartsIssuance>;
  private partsToCount: Map<number, PartsToCount>;
  private partsPickup: Map<number, PartsPickup>;
  private storageLocations: Map<number, StorageLocation>;
  private shelves: Map<number, Shelf>;
  private toolSignouts: Map<number, ToolSignout>;
  private userId: number;
  private buildingId: number;
  private partId: number;
  private partsIssuanceId: number;
  private partsToCountId: number;
  private partsPickupId: number;
  private locationId: number;
  private shelfId: number;
  private toolSignoutId: number;
  private toolNumber: number;
  private partIdCounter: number;
  private notificationSettings: NotificationSettings;

  constructor() {
    this.users = new Map();
    this.buildings = new Map();
    this.parts = new Map();
    this.partsIssuance = new Map();
    this.archivedPartsIssuance = new Map();
    this.partsToCount = new Map();
    this.partsPickup = new Map();
    this.storageLocations = new Map();
    this.shelves = new Map();
    this.toolSignouts = new Map();
    this.userId = 1;
    this.buildingId = 1;
    this.partId = 1;
    this.partsIssuanceId = 1;
    this.partsToCountId = 1;
    this.partsPickupId = 1;
    this.locationId = 1;
    this.shelfId = 1;
    this.toolSignoutId = 1;
    this.toolNumber = 1;
    this.partIdCounter = 1000;
    
    // Initialize notification settings with defaults
    this.notificationSettings = {
      system: {
        companyName: "Ohio Northern University",
        systemEmail: "m-gierhart@onu.edu"
      },
      workOrders: {
        newWorkOrders: true,
        statusChanges: true,
        comments: false
      },
      inventory: {
        lowStockAlerts: true,
        partIssuance: false
      }
    };

    // Initialize with demo data
    this.seedDemoData();
  }
  
  // Parts to Count operations
  async createPartsToCount(partsToCount: InsertPartsToCount): Promise<PartsToCount> {
    const id = this.partsToCountId++;
    const assignedAt = new Date();
    const newPartsToCount: PartsToCount = {
      ...partsToCount,
      id,
      assignedAt,
      status: 'pending',
      notes: partsToCount.notes || null,
      completedAt: null
    };
    
    this.partsToCount.set(id, newPartsToCount);
    return newPartsToCount;
  }
  
  async getPartsToCount(): Promise<PartsToCountWithDetails[]> {
    const partsToCountList = Array.from(this.partsToCount.values());
    
    return Promise.all(partsToCountList.map(async assignment => {
      const part = await this.getPart(assignment.partId);
      const assignedBy = assignment.assignedById ? 
        await this.getUser(assignment.assignedById) : undefined;
      
      return { ...assignment, part: part!, assignedBy };
    }));
  }
  
  async getPendingPartsToCount(): Promise<PartsToCountWithDetails[]> {
    const partsToCountList = Array.from(this.partsToCount.values())
      .filter(assignment => assignment.status === 'pending');
    
    return Promise.all(partsToCountList.map(async assignment => {
      const part = await this.getPart(assignment.partId);
      const assignedBy = assignment.assignedById ? 
        await this.getUser(assignment.assignedById) : undefined;
      
      return { ...assignment, part: part!, assignedBy };
    }));
  }
  
  async updatePartsToCountStatus(id: number, status: string, completedAt?: Date): Promise<PartsToCount | undefined> {
    const existing = this.partsToCount.get(id);
    if (!existing) return undefined;
    
    const updated: PartsToCount = {
      ...existing,
      status,
      completedAt: completedAt || (status === 'completed' ? new Date() : existing.completedAt)
    };
    
    this.partsToCount.set(id, updated);
    return updated;
  }
  
  async deletePartsToCount(id: number): Promise<boolean> {
    return this.partsToCount.delete(id);
  }
  
  // Notification settings operations
  async getNotificationSettings(): Promise<NotificationSettings> {
    return this.notificationSettings;
  }
  
  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    this.notificationSettings = settings;
    return this.notificationSettings;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || 'technician',
      department: insertUser.department || null 
    };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getTechnicians(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === 'technician',
    );
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated: User = {
      ...existing,
      name: userUpdate.name ?? existing.name,
      username: userUpdate.username ?? existing.username,
      password: userUpdate.password ?? existing.password,
      role: userUpdate.role ?? existing.role,
      department: userUpdate.department ?? existing.department
    };
    
    this.users.set(id, updated);
    return updated;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Building operations
  async getBuilding(id: number): Promise<Building | undefined> {
    return this.buildings.get(id);
  }
  
  async getBuildings(): Promise<Building[]> {
    return Array.from(this.buildings.values());
  }
  
  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const id = this.buildingId++;
    const building: Building = {
      id,
      name: insertBuilding.name,
      description: insertBuilding.description || null,
      address: insertBuilding.address || null,
      contactPerson: insertBuilding.contactPerson || null,
      active: insertBuilding.active ?? true
    };
    this.buildings.set(id, building);
    return building;
  }
  
  async updateBuilding(id: number, buildingUpdate: Partial<InsertBuilding>): Promise<Building | undefined> {
    const existing = this.buildings.get(id);
    if (!existing) return undefined;
    
    // Create a proper updated building with all fields explicitly set
    const updated: Building = {
      id: existing.id,
      name: buildingUpdate.name ?? existing.name,
      description: buildingUpdate.description ?? existing.description,
      address: buildingUpdate.address ?? existing.address,
      contactPerson: buildingUpdate.contactPerson ?? existing.contactPerson,
      active: buildingUpdate.active ?? existing.active
    };
    
    this.buildings.set(id, updated);
    return updated;
  }
  
  async deleteBuilding(id: number): Promise<boolean> {
    return this.buildings.delete(id);
  }
  
  // Storage Location operations
  async getStorageLocation(id: number): Promise<StorageLocation | undefined> {
    return this.storageLocations.get(id);
  }
  
  async getStorageLocations(): Promise<StorageLocation[]> {
    return Array.from(this.storageLocations.values());
  }
  
  async createStorageLocation(location: InsertStorageLocation): Promise<StorageLocation> {
    const id = this.locationId++;
    const now = new Date();
    const storageLocation: StorageLocation = {
      ...location,
      id,
      createdAt: now,
      active: location.active ?? true,
      description: location.description || null
    };
    this.storageLocations.set(id, storageLocation);
    return storageLocation;
  }
  
  async updateStorageLocation(id: number, locationUpdate: Partial<InsertStorageLocation>): Promise<StorageLocation | undefined> {
    const existing = this.storageLocations.get(id);
    if (!existing) return undefined;
    
    const updated: StorageLocation = {
      ...existing,
      name: locationUpdate.name ?? existing.name,
      description: locationUpdate.description ?? existing.description,
      active: locationUpdate.active ?? existing.active
    };
    
    this.storageLocations.set(id, updated);
    return updated;
  }
  
  async deleteStorageLocation(id: number): Promise<boolean> {
    // Check if any shelves use this location
    const shelvesInLocation = Array.from(this.shelves.values())
      .filter(shelf => shelf.locationId === id);
      
    // Delete all shelves in this location first
    for (const shelf of shelvesInLocation) {
      await this.deleteShelf(shelf.id);
    }
    
    return this.storageLocations.delete(id);
  }
  
  // Shelf operations
  async getShelf(id: number): Promise<Shelf | undefined> {
    return this.shelves.get(id);
  }
  
  async getShelves(): Promise<Shelf[]> {
    return Array.from(this.shelves.values());
  }
  
  async getShelvesByLocation(locationId: number): Promise<Shelf[]> {
    return Array.from(this.shelves.values())
      .filter(shelf => shelf.locationId === locationId);
  }
  
  async createShelf(shelf: InsertShelf): Promise<Shelf> {
    const id = this.shelfId++;
    const now = new Date();
    const newShelf: Shelf = {
      ...shelf,
      id,
      createdAt: now,
      active: shelf.active ?? true,
      description: shelf.description || null
    };
    this.shelves.set(id, newShelf);
    return newShelf;
  }
  
  async updateShelf(id: number, shelfUpdate: Partial<InsertShelf>): Promise<Shelf | undefined> {
    const existing = this.shelves.get(id);
    if (!existing) return undefined;
    
    const updated: Shelf = {
      ...existing,
      name: shelfUpdate.name ?? existing.name,
      description: shelfUpdate.description ?? existing.description,
      locationId: shelfUpdate.locationId ?? existing.locationId,
      active: shelfUpdate.active ?? existing.active
    };
    
    this.shelves.set(id, updated);
    return updated;
  }
  
  async deleteShelf(id: number): Promise<boolean> {
    // Update parts that use this shelf to no longer have a shelfId
    const partsOnShelf = Array.from(this.parts.values())
      .filter(part => part.shelfId === id);
      
    for (const part of partsOnShelf) {
      await this.updatePart(part.id, { shelfId: null });
    }
    
    return this.shelves.delete(id);
  }
  
  // Part operations
  async getPart(id: number): Promise<Part | undefined> {
    return this.parts.get(id);
  }

  async getPartByPartId(partId: string): Promise<Part | undefined> {
    return Array.from(this.parts.values()).find(
      (part) => part.partId === partId,
    );
  }

  async createPart(insertPart: InsertPart): Promise<Part> {
    const id = this.partId++;
    const part: Part = { 
      ...insertPart, 
      id,
      quantity: insertPart.quantity ?? 0,
      reorderLevel: insertPart.reorderLevel ?? 10,
      unitCost: insertPart.unitCost ?? null,
      description: insertPart.description || null,
      location: insertPart.location || null,
      category: insertPart.category || null,
      supplier: insertPart.supplier || null,
      lastRestockDate: insertPart.lastRestockDate || null
    };
    this.parts.set(id, part);
    return part;
  }

  async updatePart(id: number, partUpdate: Partial<InsertPart>): Promise<Part | undefined> {
    const existing = this.parts.get(id);
    if (!existing) return undefined;
    
    const updated: Part = { 
      ...existing, 
      ...partUpdate,
      description: partUpdate.description ?? existing.description,
      location: partUpdate.location ?? existing.location,
      category: partUpdate.category ?? existing.category,
      supplier: partUpdate.supplier ?? existing.supplier,
      lastRestockDate: partUpdate.lastRestockDate ?? existing.lastRestockDate
    };
    this.parts.set(id, updated);
    return updated;
  }
  
  async deletePart(id: number): Promise<boolean> {
    return this.parts.delete(id);
  }

  async getParts(): Promise<Part[]> {
    return Array.from(this.parts.values());
  }

  async getPartsByLocation(locationId?: number, shelfId?: number): Promise<Part[]> {
    let filteredParts = Array.from(this.parts.values());
    
    if (locationId) {
      filteredParts = filteredParts.filter(part => part.locationId === locationId);
    }
    
    if (shelfId) {
      filteredParts = filteredParts.filter(part => part.shelfId === shelfId);
    }
    
    return filteredParts;
  }

  async getLowStockParts(): Promise<PartWithAvailability[]> {
    return Array.from(this.parts.values())
      .map(part => {
        let availability: 'low' | 'medium' | 'high' = 'high';
        
        if (part.quantity <= part.reorderLevel * 0.3) {
          availability = 'low';
        } else if (part.quantity <= part.reorderLevel * 0.8) {
          availability = 'medium';
        }
        
        return { ...part, availability };
      })
      .filter(part => part.availability !== 'high')
      .sort((a, b) => {
        // Sort by availability (low first, then medium)
        if (a.availability === 'low' && b.availability !== 'low') return -1;
        if (a.availability !== 'low' && b.availability === 'low') return 1;
        return 0;
      })
      .slice(0, 10);
  }

  // Parts Issuance operations
  async getPartsIssuance(id: number): Promise<PartsIssuance | undefined> {
    return this.partsIssuance.get(id);
  }

  async createPartsIssuance(insertPartsIssuance: InsertPartsIssuance): Promise<PartsIssuance> {
    const id = this.partsIssuanceId++;
    const issuedAt = new Date();
    const partsIssuance: PartsIssuance = { 
      ...insertPartsIssuance, 
      id, 
      issuedAt,
      notes: insertPartsIssuance.notes || null,
      department: insertPartsIssuance.department || null,
      projectCode: insertPartsIssuance.projectCode || null,
      issuedById: insertPartsIssuance.issuedById || null
    };
    this.partsIssuance.set(id, partsIssuance);
    
    // Update part quantity
    const part = await this.getPart(partsIssuance.partId);
    if (part) {
      const newQuantity = part.quantity - partsIssuance.quantity;
      await this.updatePart(part.id, { quantity: Math.max(0, newQuantity) });
    }
    
    return partsIssuance;
  }
  
  async updatePartsIssuance(id: number, partsIssuanceUpdate: Partial<InsertPartsIssuance> & { building?: string, costCenter?: string }): Promise<PartsIssuance | undefined> {
    const existing = this.partsIssuance.get(id);
    if (!existing) return undefined;
    
    // Handle quantity changes by updating inventory
    if (partsIssuanceUpdate.quantity && partsIssuanceUpdate.quantity !== existing.quantity) {
      const part = await this.getPart(existing.partId);
      if (part) {
        // If new quantity is higher, need to withdraw more from inventory
        // If new quantity is lower, need to return some to inventory
        const quantityDifference = partsIssuanceUpdate.quantity - existing.quantity;
        const newPartQuantity = part.quantity - quantityDifference;
        
        // Ensure we don't set negative quantity
        if (newPartQuantity < 0) {
          throw new Error(`Not enough parts in inventory. Only ${part.quantity} available.`);
        }
        
        await this.updatePart(part.id, { quantity: newPartQuantity });
      }
    }
    
    // Create the updated record - ignore building and costCenter which are UI-only fields
    const updated: PartsIssuance = {
      ...existing,
      quantity: partsIssuanceUpdate.quantity ?? existing.quantity,
      issuedTo: partsIssuanceUpdate.issuedTo ?? existing.issuedTo,
      reason: partsIssuanceUpdate.reason ?? existing.reason,
      notes: partsIssuanceUpdate.notes ?? existing.notes,
      department: partsIssuanceUpdate.department ?? existing.department,
      projectCode: partsIssuanceUpdate.projectCode ?? existing.projectCode,
      issuedById: partsIssuanceUpdate.issuedById ?? existing.issuedById
    };
    
    this.partsIssuance.set(id, updated);
    return updated;
  }
  
  async deletePartsIssuance(id: number): Promise<boolean> {
    // Get the issuance record first
    const issuance = this.partsIssuance.get(id);
    if (!issuance) return false;
    
    // Return the parts to inventory before deleting the record
    try {
      const part = await this.getPart(issuance.partId);
      if (part) {
        // Add the quantity back to the inventory
        const newQuantity = part.quantity + issuance.quantity;
        await this.updatePart(part.id, { quantity: newQuantity });
      }
      
      // Delete the issuance record
      return this.partsIssuance.delete(id);
    } catch (error) {
      console.error("Error deleting parts issuance:", error);
      return false;
    }
  }

  async getPartsIssuanceByPartId(partId: number): Promise<PartsIssuanceWithDetails[]> {
    const issuanceList = Array.from(this.partsIssuance.values())
      .filter(issuance => issuance.partId === partId);
    
    return Promise.all(issuanceList.map(async issuance => {
      const part = await this.getPart(issuance.partId);
      const issuedBy = issuance.issuedById ? await this.getUser(issuance.issuedById) : undefined;
      return { ...issuance, part: part!, issuedBy };
    }));
  }

  async getRecentPartsIssuance(limit: number): Promise<PartsIssuanceWithDetails[]> {
    const issuanceList = Array.from(this.partsIssuance.values())
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .slice(0, limit);
    
    return Promise.all(issuanceList.map(async issuance => {
      const part = await this.getPart(issuance.partId);
      const issuedBy = issuance.issuedById ? await this.getUser(issuance.issuedById) : undefined;
      return { ...issuance, part: part!, issuedBy };
    }));
  }

  async getMonthlyPartsIssuanceTotal(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalParts = 0;
    for (const issuance of this.partsIssuance.values()) {
      const issuedDate = new Date(issuance.issuedAt);
      if (issuedDate >= startOfMonth) {
        totalParts += issuance.quantity;
      }
    }
    
    return totalParts;
  }

  // Parts Pickup operations
  async getPartsPickup(id: number): Promise<PartsPickup | undefined> {
    return this.partsPickup.get(id);
  }

  async getPartsPickups(): Promise<PartsPickupWithDetails[]> {
    const pickupList = Array.from(this.partsPickup.values());
    
    return Promise.all(pickupList.map(async pickup => {
      const building = pickup.buildingId ? await this.getBuilding(pickup.buildingId) : undefined;
      const addedBy = pickup.addedById ? await this.getUser(pickup.addedById) : undefined;
      const pickedUpBy = pickup.pickedUpById ? await this.getUser(pickup.pickedUpById) : undefined;
      
      return { ...pickup, building, addedBy, pickedUpBy };
    }));
  }

  async getPendingPartsPickups(): Promise<PartsPickupWithDetails[]> {
    const pickupList = Array.from(this.partsPickup.values())
      .filter(pickup => pickup.status === 'pending');
    
    return Promise.all(pickupList.map(async pickup => {
      const building = pickup.buildingId ? await this.getBuilding(pickup.buildingId) : undefined;
      const addedBy = pickup.addedById ? await this.getUser(pickup.addedById) : undefined;
      const pickedUpBy = pickup.pickedUpById ? await this.getUser(pickup.pickedUpById) : undefined;
      
      return { ...pickup, building, addedBy, pickedUpBy };
    }));
  }

  async createPartsPickup(partsPickup: InsertPartsPickup): Promise<PartsPickup> {
    const id = this.partsPickupId++;
    const addedAt = new Date();
    
    const newPartsPickup: PartsPickup = {
      ...partsPickup,
      id,
      addedAt,
      status: 'pending',
      pickedUpById: null,
      pickedUpAt: null,
      notes: partsPickup.notes || null,
      trackingNumber: partsPickup.trackingNumber || null,
      poNumber: partsPickup.poNumber || null,
      supplier: partsPickup.supplier || null,
      partNumber: partsPickup.partNumber || null
    };
    
    this.partsPickup.set(id, newPartsPickup);
    return newPartsPickup;
  }

  async updatePartsPickupStatus(id: number, technicianId: number): Promise<PartsPickup | undefined> {
    const existing = this.partsPickup.get(id);
    if (!existing) return undefined;
    
    const pickedUpAt = new Date();
    
    const updated: PartsPickup = {
      ...existing,
      status: 'completed',
      pickedUpById: technicianId,
      pickedUpAt
    };
    
    this.partsPickup.set(id, updated);
    return updated;
  }

  async deletePartsPickup(id: number): Promise<boolean> {
    return this.partsPickup.delete(id);
  }
  
  // Tool SignOut operations
  async getNextToolNumber(): Promise<number> {
    return this.toolNumber++;
  }
  
  async createToolSignout(toolSignout: InsertToolSignout): Promise<ToolSignout> {
    const id = this.toolSignoutId++;
    const now = new Date();
    const newToolSignout: ToolSignout = {
      id,
      toolNumber: toolSignout.toolNumber || await this.getNextToolNumber(),
      toolName: toolSignout.toolName,
      technicianId: toolSignout.technicianId,
      status: toolSignout.status || 'checked_out',
      signedOutAt: now,
      returnedAt: null,
      notes: toolSignout.notes || null
    };
    
    this.toolSignouts.set(id, newToolSignout);
    return newToolSignout;
  }
  
  async getToolSignout(id: number): Promise<ToolSignout | undefined> {
    return this.toolSignouts.get(id);
  }
  
  async getAllToolSignouts(): Promise<ToolSignoutWithDetails[]> {
    const toolSignoutsList = Array.from(this.toolSignouts.values());
    
    return Promise.all(toolSignoutsList.map(async signout => {
      const technician = signout.technicianId ? 
        await this.getUser(signout.technicianId) : undefined;
      
      return { ...signout, technician };
    }));
  }
  
  async getToolSignoutsByTechnician(technicianId: number): Promise<ToolSignout[]> {
    return Array.from(this.toolSignouts.values())
      .filter(signout => signout.technicianId === technicianId);
  }
  
  async getToolSignoutsByStatus(status: string): Promise<ToolSignoutWithDetails[]> {
    const toolSignoutsList = Array.from(this.toolSignouts.values())
      .filter(signout => signout.status === status);
    
    return Promise.all(toolSignoutsList.map(async signout => {
      const technician = signout.technicianId ? 
        await this.getUser(signout.technicianId) : undefined;
      
      return { ...signout, technician };
    }));
  }
  
  async updateToolSignout(id: number, updates: Partial<ToolSignout>): Promise<ToolSignout | undefined> {
    const existing = this.toolSignouts.get(id);
    if (!existing) return undefined;
    
    // Special handling for returned status
    if (updates.status === 'returned' && !updates.returnedAt) {
      updates.returnedAt = new Date();
    }
    
    const updated: ToolSignout = {
      ...existing,
      toolName: updates.toolName ?? existing.toolName,
      status: updates.status ?? existing.status,
      notes: updates.notes ?? existing.notes,
      returnedAt: updates.returnedAt ?? existing.returnedAt
    };
    
    this.toolSignouts.set(id, updated);
    return updated;
  }
  
  async deleteToolSignout(id: number): Promise<boolean> {
    return this.toolSignouts.delete(id);
  }

  // Initialize with demo data
  private seedDemoData() {
    // Create storage locations
    const storageLocations = [
      {
        name: 'Stockroom',
        description: 'Main storage location for frequently accessed parts',
        active: true
      },
      {
        name: 'Warehouse',
        description: 'Long-term storage for bulk items and less frequently used parts',
        active: true
      }
    ];
    
    // Add storage locations
    const createdLocations = storageLocations.map(location => this.createStorageLocation(location));
    
    // Create shelves for each location
    const stockroomShelves = [
      { name: 'Shelf A1', locationId: 1, active: true },
      { name: 'Shelf A2', locationId: 1, active: true },
      { name: 'Shelf B1', locationId: 1, active: true },
      { name: 'Shelf B2', locationId: 1, active: true }
    ];
    
    const warehouseShelves = [
      { name: 'Shelf W1', locationId: 2, active: true },
      { name: 'Shelf W2', locationId: 2, active: true },
      { name: 'Shelf W3', locationId: 2, active: true },
      { name: 'Shelf W4', locationId: 2, active: true },
      { name: 'Shelf W5', locationId: 2, active: true }
    ];
    
    // Add shelves
    [...stockroomShelves, ...warehouseShelves].forEach(shelf => this.createShelf(shelf));
    
    // Create buildings
    const buildings = [
      {
        name: 'Building A',
        description: 'Main Administrative Building',
        active: true
      },
      {
        name: 'Building B',
        description: 'Operations Center',
        active: true
      },
      {
        name: 'Building C',
        description: 'Research & Development',
        active: true
      },
      {
        name: 'Building D',
        description: 'Storage Warehouse',
        active: true
      },
      {
        name: 'Building E',
        description: 'Training Center',
        active: false
      }
    ];
    
    buildings.forEach(building => this.createBuilding(building));
    
    // Create users
    const admin = this.createUser({
      username: 'admin',
      password: 'JaciJo2012', // Updated to match required password
      name: 'Administrator',
      role: 'admin',
      department: 'Management'
    });

    // Add student worker account
    this.createUser({
      username: 'Student',
      password: 'Onu',
      name: 'Student Worker',
      role: 'student',
      department: 'Student Workers'
    });
    
    const users = [
      {
        username: 'mtorres',
        password: 'password',
        name: 'Michael Torres',
        role: 'technician' as const,
        department: 'Maintenance'
      },
      {
        username: 'schen',
        password: 'password',
        name: 'Sarah Chen',
        role: 'technician' as const,
        department: 'Electrical'
      },
      {
        username: 'jdavis',
        password: 'password',
        name: 'John Davis',
        role: 'technician' as const,
        department: 'Plumbing'
      },
      {
        username: 'kpatel',
        password: 'password',
        name: 'Kevin Patel',
        role: 'technician' as const,
        department: 'Security'
      },
      {
        username: 'mlopez',
        password: 'password',
        name: 'Maria Lopez',
        role: 'technician' as const,
        department: 'Operations'
      },
    ];

    users.forEach(user => this.createUser(user));

    // Create parts
    const parts = [
      {
        partId: 'P-4520',
        name: 'HVAC Filter 20x20x1',
        description: 'Standard air filter for HVAC systems',
        quantity: 5,
        reorderLevel: 15,
        unitCost: 1299, // $12.99
        location: 'Shelf A1',
        locationId: 1, // Stockroom
        shelfId: 1, // Shelf A1
        category: 'HVAC',
        supplier: 'FiltrationCo'
      },
      {
        partId: 'P-3301',
        name: 'Copper Pipe 1/2" (10ft)',
        description: 'Standard copper pipe for plumbing',
        quantity: 3,
        reorderLevel: 10,
        unitCost: 3499, // $34.99
        location: 'Shelf W1',
        locationId: 2, // Warehouse
        shelfId: 5, // Shelf W1
        category: 'Plumbing',
        supplier: 'PlumbSupply Inc.'
      },
      {
        partId: 'P-1105',
        name: 'Door Hinges - Commercial',
        description: 'Heavy duty door hinges for commercial use',
        quantity: 12,
        reorderLevel: 15,
        unitCost: 899, // $8.99
        location: 'Shelf A2',
        locationId: 1, // Stockroom
        shelfId: 2, // Shelf A2
        category: 'Hardware',
        supplier: 'BuildersDepot'
      },
      {
        partId: 'P-2245',
        name: 'Circuit Breaker 20A',
        description: 'Standard 20A circuit breaker',
        quantity: 4,
        reorderLevel: 12,
        unitCost: 1099, // $10.99
        location: 'Shelf B1',
        locationId: 1, // Stockroom
        shelfId: 3, // Shelf B1
        category: 'Electrical',
        supplier: 'ElectroSupply'
      },
      {
        partId: 'P-5501',
        name: 'Thermostat - Digital',
        description: 'Programmable digital thermostat',
        quantity: 8,
        reorderLevel: 10,
        unitCost: 4999, // $49.99
        location: 'Shelf W2',
        locationId: 2, // Warehouse
        shelfId: 6, // Shelf W2
        category: 'HVAC',
        supplier: 'TempControl'
      },
      {
        partId: 'P-6230',
        name: 'LED Light Bulb 60W Equiv.',
        description: 'Energy efficient LED bulb, pack of 4',
        quantity: 20,
        reorderLevel: 25,
        unitCost: 1199, // $11.99
        location: 'Shelf W3',
        locationId: 2, // Warehouse
        shelfId: 7, // Shelf W3
        category: 'Electrical',
        supplier: 'LightingInc'
      },
      {
        partId: 'P-7105',
        name: 'PVC Pipe 3" (5ft)',
        description: 'Standard PVC pipe for plumbing',
        quantity: 15,
        reorderLevel: 20,
        unitCost: 1899, // $18.99
        location: 'Shelf W4',
        locationId: 2, // Warehouse
        shelfId: 8, // Shelf W4
        category: 'Plumbing',
        supplier: 'PlumbSupply Inc.'
      },
    ];

    parts.forEach(part => this.createPart(part));

    // Create dates
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    const fourDaysAgo = new Date(now);
    fourDaysAgo.setDate(now.getDate() - 4);

    // Create parts issuances
    const partsIssuances = [
      {
        partId: 4, // Circuit Breaker 20A
        quantity: 1,
        issuedTo: 'Building Maintenance',
        reason: 'maintenance' as const,
        issuedAt: twoDaysAgo,
        issuedById: 1, // Admin
        notes: 'Replacing faulty breaker in electrical panel #3',
        department: 'Maintenance',
        projectCode: 'MAINT-2023-42'
      },
      {
        partId: 6, // LED Light Bulb
        quantity: 2,
        issuedTo: 'Operations Team',
        reason: 'replacement' as const,
        issuedAt: twoDaysAgo,
        issuedById: 1, // Admin
        notes: 'Replace burned out bulbs in conference room',
        department: 'Operations',
        projectCode: 'OPS-2023-15'
      },
      {
        partId: 1, // HVAC Filter
        quantity: 2,
        issuedTo: 'Building Services',
        reason: 'maintenance' as const,
        issuedAt: yesterday,
        issuedById: 1, // Admin
        notes: 'Regular HVAC maintenance for 3rd floor units',
        department: 'Maintenance',
        projectCode: 'HVAC-2023-08'
      },
      {
        partId: 3, // Door Hinges
        quantity: 2,
        issuedTo: 'Facilities',
        reason: 'maintenance' as const,
        issuedAt: yesterday,
        issuedById: 1, // Admin
        notes: 'Repair main conference room door',
        department: 'Facilities',
        projectCode: 'FAC-2023-22'
      },
      {
        partId: 2, // Copper Pipe
        quantity: 1,
        issuedTo: 'Plumbing Department',
        reason: 'maintenance' as const,
        issuedAt: threeDaysAgo,
        issuedById: 1, // Admin
        notes: 'Fix water leak in kitchen area',
        department: 'Plumbing',
        projectCode: 'PLB-2023-30'
      },
      {
        partId: 5, // Thermostat
        quantity: 1,
        issuedTo: 'HVAC Department',
        reason: 'replacement' as const,
        issuedAt: fourDaysAgo,
        issuedById: 1, // Admin
        notes: 'Replace faulty thermostat in executive office',
        department: 'HVAC',
        projectCode: 'HVAC-2023-07'
      }
    ];

    // Add Parts Issuances
    partsIssuances.forEach(issuance => {
      const id = this.partsIssuanceId++;
      this.partsIssuance.set(id, { ...issuance, id });
      
      // Update part quantity (already handled in createPartsIssuance, but doing it here for seed data)
      const part = this.parts.get(issuance.partId);
      if (part) {
        const newQuantity = part.quantity;  // Don't deduct again here since we're seeding with existing quantities
        this.parts.set(part.id, { ...part, quantity: newQuantity });
      }
    });
    
    // Add Parts to Count Assignments for Student role
    const partsToCountAssignments = [
      {
        partId: 3, // Door Hinges
        assignedById: 1, // Admin
        status: 'pending',
        assignedAt: new Date(),
        notes: 'Please count these door hinges carefully'
      },
      {
        partId: 4, // Circuit Breaker 20A
        assignedById: 1, // Admin
        status: 'pending',
        assignedAt: new Date(),
        notes: 'Verify quantity of circuit breakers'
      },
      {
        partId: 6, // LED Light Bulb
        assignedById: 1, // Admin
        status: 'pending',
        assignedAt: new Date()
      },
      {
        partId: 1, // HVAC Filter
        assignedById: 1, // Admin
        status: 'completed',
        assignedAt: yesterday,
        completedAt: new Date()
      }
    ];
    
    // Add Parts to Count Assignments
    partsToCountAssignments.forEach(assignment => {
      const id = this.partsToCountId++;
      this.partsToCount.set(id, { ...assignment, id });
    });
  }
}

// CRITICAL FIX: Use PostgreSQL storage instead of in-memory storage to fix data issues
import { pgStorage } from './pgStorage';
export const storage = pgStorage;
