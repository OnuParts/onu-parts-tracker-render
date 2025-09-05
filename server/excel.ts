import xlsx from 'xlsx';
import ExcelJS from 'exceljs';
import fs from 'fs';
import { InsertPart, Part, InsertUser, User, InsertBuilding, Building, PartsIssuance, PartsIssuanceWithDetails, StorageLocation, InsertStorageLocation, Shelf, InsertShelf } from '../shared/schema';
import { format } from 'date-fns';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * Simple Excel export for combined report that guarantees correct formatting
 */
export function generateCombinedReportExcel(items: any[], monthStr: string): Buffer {
  try {
    console.log(`Generating Excel for ${items?.length || 0} items, month: ${monthStr}`);
    
    // Create a workbook and add a worksheet
    const workbook = xlsx.utils.book_new();
    
    // Create data rows as arrays for maximum compatibility
    const data: any[][] = [];
    
    // Add title rows
    data.push([`ONU Parts Movement Report - ${monthStr}`]);
    data.push([]);
    
    // Add headers
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
    
    // Process items into simple arrays
    let totalCost = 0;
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (!item) return;
        
        try {
          // Format date
          let dateStr = '';
          if (item.date) {
            const date = new Date(item.date);
            if (!isNaN(date.getTime())) {
              dateStr = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
            } else {
              dateStr = String(item.date);
            }
          }
          
          // Format prices
          let unitCost = '';
          if (item.unitCost) {
            const cost = typeof item.unitCost === 'number' 
              ? item.unitCost 
              : parseFloat(String(item.unitCost).replace(/[^0-9.-]/g, ''));
            
            if (!isNaN(cost)) {
              unitCost = `$${cost.toFixed(2)}`;
            }
          }
          
          // Calculate extended price
          let extPrice = 0;
          let extPriceStr = '';
          
          if (item.extendedPrice) {
            if (typeof item.extendedPrice === 'number') {
              extPrice = item.extendedPrice;
            } else {
              const match = String(item.extendedPrice).match(/[\d.]+/);
              if (match) {
                extPrice = parseFloat(match[0]);
              }
            }
          } else if (item.unitCost && item.quantity) {
            const cost = typeof item.unitCost === 'number' 
              ? item.unitCost 
              : parseFloat(String(item.unitCost).replace(/[^0-9.-]/g, ''));
            
            const qty = typeof item.quantity === 'number'
              ? item.quantity
              : parseInt(String(item.quantity));
              
            if (!isNaN(cost) && !isNaN(qty)) {
              extPrice = cost * qty;
            }
          }
          
          if (!isNaN(extPrice)) {
            extPriceStr = `$${extPrice.toFixed(2)}`;
            totalCost += extPrice;
          }
          
          // Create data row with running total
          data.push([
            dateStr,
            item.partName || '',
            item.description || item.partName || '',
            item.quantity || 0,
            unitCost,
            extPriceStr,
            `$${totalCost.toFixed(2)}`, // Running total
            item.building || '',
            item.costCenter || '',
            item.type || ''
          ]);
        } catch (err) {
          console.error("Error processing item:", err);
        }
      });
    }
    
    // Add a blank row and then total
    data.push([]);
    data.push(['GRAND TOTAL', '', '', '', '', `$${totalCost.toFixed(2)}`, `$${totalCost.toFixed(2)}`]);
    
    // Create worksheet from data
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    
    // Set column widths
    const colWidths = [
      {wch: 12},  // Date
      {wch: 15},  // Part Number
      {wch: 30},  // Description
      {wch: 10},  // Quantity
      {wch: 12},  // Unit Cost
      {wch: 15},  // Extended Price
      {wch: 15},  // Running Total
      {wch: 20},  // Building
      {wch: 20},  // Cost Center
      {wch: 15},  // Type
    ];
    
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Parts Report');
    
    // Generate buffer
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
  } catch (error) {
    console.error("Error generating combined report Excel:", error);
    
    // Create error workbook as fallback
    try {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([
        ['Error generating report'],
        ['Please try again']
      ]);
      xlsx.utils.book_append_sheet(wb, ws, 'Error');
      return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } catch (e) {
      throw new Error("Failed to generate Excel report");
    }
  }
}

/**
 * Placeholder stubs for other Excel functions 
 * These prevent compile errors with import statements elsewhere in the codebase
 */

export function readPartsFromExcel(filePath: string): { parts: InsertPart[], errors: Array<{ row: number; message: string }> } {
  console.log("Reading parts from Excel file:", filePath);
  
  const parts: InsertPart[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      errors.push({ row: 0, message: "No data found in Excel file" });
      return { parts, errors };
    }
    
    // Convert sheet to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { parts, errors };
    }
    
    // Get headers from first row
    const headers = data[0] as string[];
    console.log("Excel headers:", headers);
    
    // Expected headers (case insensitive)
    const requiredFields = ['partid', 'name'];
    const optionalFields = ['description', 'quantity', 'reorderlevel', 'unitcost', 'category', 'location', 'supplier'];
    
    // Map headers to lowercase for matching
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, '')] = index;
      }
    });
    
    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    
    if (errors.length > 0) {
      return { parts, errors };
    }
    
    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      
      try {
        // Skip empty rows
        if (!row || row.every(cell => !cell || cell === '')) {
          continue;
        }
        
        // Extract data with validation
        const partId = row[headerMap['partid']]?.toString()?.trim();
        const name = row[headerMap['name']]?.toString()?.trim();
        
        if (!partId || !name) {
          errors.push({ row: rowNumber, message: "Part ID and Name are required" });
          continue;
        }
        
        // Parse optional fields with defaults
        let quantity = 0;
        if (headerMap['quantity'] !== undefined && row[headerMap['quantity']]) {
          const qtyValue = parseFloat(row[headerMap['quantity']]);
          if (!isNaN(qtyValue) && qtyValue >= 0) {
            quantity = qtyValue;
          }
        }
        
        let reorderLevel = 1;
        if (headerMap['reorderlevel'] !== undefined && row[headerMap['reorderlevel']]) {
          const reorderValue = parseFloat(row[headerMap['reorderlevel']]);
          if (!isNaN(reorderValue) && reorderValue > 0) {
            reorderLevel = reorderValue;
          }
        }
        
        let unitCost = "0";
        if (headerMap['unitcost'] !== undefined && row[headerMap['unitcost']]) {
          const costStr = row[headerMap['unitcost']].toString().replace(/[^0-9.-]/g, '');
          const costValue = parseFloat(costStr);
          if (!isNaN(costValue) && costValue >= 0) {
            unitCost = costValue.toString();
          }
        }
        
        const part: InsertPart = {
          partId,
          name,
          description: headerMap['description'] !== undefined ? row[headerMap['description']]?.toString()?.trim() || null : null,
          quantity,
          reorderLevel,
          unitCost,
          category: headerMap['category'] !== undefined ? row[headerMap['category']]?.toString()?.trim() || null : null,
          location: headerMap['location'] !== undefined ? row[headerMap['location']]?.toString()?.trim() || null : null,
          supplier: headerMap['supplier'] !== undefined ? row[headerMap['supplier']]?.toString()?.trim() || null : null,
          locationId: null,
          shelfId: null
        };
        
        parts.push(part);
        
      } catch (rowError) {
        errors.push({ 
          row: rowNumber, 
          message: `Error processing row: ${rowError instanceof Error ? rowError.message : String(rowError)}` 
        });
      }
    }
    
    console.log(`Successfully parsed ${parts.length} parts from Excel with ${errors.length} errors`);
    
  } catch (error) {
    console.error("Error reading Excel file:", error);
    errors.push({ 
      row: 0, 
      message: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
  
  return { parts, errors };
}

export async function generatePartsExcel(parts: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Parts Inventory');

  // Define columns with Extended Value for running totals
  worksheet.columns = [
    { header: 'Part ID', key: 'partId', width: 15 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Reorder Level', key: 'reorderLevel', width: 15 },
    { header: 'Unit Cost', key: 'unitCost', width: 12 },
    { header: 'Extended Value', key: 'extendedValue', width: 15 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Supplier', key: 'supplier', width: 20 },
    { header: 'Last Restock Date', key: 'lastRestockDate', width: 18 }
  ];

  // Calculate running totals and add data rows
  let grandTotal = 0;
  parts.forEach(part => {
    const quantity = parseFloat(part.quantity) || 0;
    const unitCost = parseFloat(part.unit_cost || part.unitCost) || 0;
    const extendedValue = quantity * unitCost;
    grandTotal += extendedValue;

    worksheet.addRow({
      partId: part.part_id || part.partId,
      name: part.name,
      description: part.description || '',
      quantity: quantity,
      reorderLevel: part.reorder_level || part.reorderLevel || '',
      unitCost: unitCost.toFixed(2),
      extendedValue: extendedValue.toFixed(2),
      category: part.category || '',
      location: part.location || '',
      supplier: part.supplier || '',
      lastRestockDate: part.last_restock_date || part.lastRestockDate ? new Date(part.last_restock_date || part.lastRestockDate).toLocaleDateString() : ''
    });
  });

  // Add spacing and grand total row
  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    partId: '',
    name: '',
    description: '',
    quantity: '',
    reorderLevel: '',
    unitCost: 'GRAND TOTAL:',
    extendedValue: grandTotal.toFixed(2),
    category: '',
    location: '',
    supplier: '',
    lastRestockDate: ''
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  // Style the grand total row
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber === 6 || colNumber === 7) { // Unit Cost and Extended Value columns
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' } // Yellow background
      };
    }
  });

  // Format Extended Value column as currency
  const extendedValueColumn = worksheet.getColumn(7);
  extendedValueColumn.numFmt = '$#,##0.00';

  // Format Unit Cost column as currency
  const unitCostColumn = worksheet.getColumn(6);
  unitCostColumn.numFmt = '$#,##0.00';

  // Generate buffer
  return await workbook.xlsx.writeBuffer() as Buffer;
}

export function generatePartsExcelFromSql(parts: any[]): Buffer {
  const workbook = xlsx.utils.book_new();
  
  // Convert parts data to array format for Excel
  const data: any[][] = [];
  
  // Add headers
  data.push([
    'Part ID', 'Name', 'Description', 'Quantity', 'Reorder Level', 
    'Unit Cost', 'Extended Value', 'Category', 'Location', 'Supplier', 'Last Restock Date'
  ]);
  
  // Calculate running totals and add data rows
  let grandTotal = 0;
  parts.forEach(part => {
    const quantity = parseFloat(part.quantity) || 0;
    const unitCost = parseFloat(part.unit_cost || part.unitCost) || 0;
    const extendedValue = quantity * unitCost;
    grandTotal += extendedValue;
    
    data.push([
      part.part_id || part.partId,
      part.name,
      part.description || '',
      quantity,
      part.reorder_level || part.reorderLevel || '',
      unitCost.toFixed(2),
      extendedValue.toFixed(2),
      part.category || '',
      part.location || '',
      part.supplier || '',
      part.last_restock_date || part.lastRestockDate ? new Date(part.last_restock_date || part.lastRestockDate).toLocaleDateString() : ''
    ]);
  });
  
  // Add spacing and grand total row
  data.push([]);
  data.push(['', '', '', '', '', 'GRAND TOTAL:', grandTotal.toFixed(2)]);
  
  // Create worksheet from data
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    {wch: 15}, {wch: 30}, {wch: 40}, {wch: 12}, {wch: 15}, 
    {wch: 12}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 18}
  ];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Parts Inventory');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateTemplateExcel(): Buffer {
  try {
    console.log("Generating Excel template for parts import");
    
    // Use xlsx library for reliable template generation
    const workbook = xlsx.utils.book_new();
    const worksheetData = [
      ['Part ID', 'Name', 'Description', 'Quantity', 'Reorder Level', 'Unit Cost', 'Category', 'Location', 'Supplier'],
      ['SAMPLE001', 'Sample Part', 'This is an example part for import', 100, 10, '5.99', 'Hardware', 'Stockroom', 'Example Supplier'],
      ['INSTRUCTIONS:', 'Required fields: Part ID, Name', 'Optional fields: Description, Quantity, Reorder Level, Unit Cost, Category, Location, Supplier', '', '', '', '', '', '']
    ];
    
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better formatting
    worksheet['!cols'] = [
      {wch: 15}, {wch: 30}, {wch: 40}, {wch: 12}, {wch: 15}, 
      {wch: 12}, {wch: 20}, {wch: 20}, {wch: 20}
    ];
    
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Parts Import Template');
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log(`Generated Excel template, buffer size: ${buffer.length} bytes`);
    
    return buffer;
  } catch (error) {
    console.error("Error generating Excel template:", error);
    throw new Error("Failed to generate Excel template");
  }
}

export function readTechniciansFromExcel(filePath: string): { technicians: InsertUser[], errors: Array<{ row: number; message: string }> } {
  const technicians: InsertUser[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  
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
    
    const headers = data[0] as string[];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, '')] = index;
      }
    });
    
    // Check for required fields
    const requiredFields = ['username', 'name', 'role'];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    
    if (errors.length > 0) {
      return { technicians, errors };
    }
    
    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      
      try {
        if (!row || row.every(cell => !cell || cell === '')) {
          continue;
        }
        
        const username = row[headerMap['username']]?.toString()?.trim();
        const name = row[headerMap['name']]?.toString()?.trim();
        const role = row[headerMap['role']]?.toString()?.trim();
        
        if (!username || !name || !role) {
          errors.push({ row: rowNumber, message: "Username, Name, and Role are required" });
          continue;
        }
        
        const technician: InsertUser = {
          username,
          name,
          role: role as "admin" | "student" | "technician" | "controller",
          password: "defaultpassword123", // Default password that should be changed
          department: headerMap['department'] !== undefined ? row[headerMap['department']]?.toString()?.trim() || null : null
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

export function generateTechniciansExcel(technicians: User[]): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data: any[][] = [];
  data.push(['Username', 'Name', 'Role', 'Department']);
  
  technicians.forEach(tech => {
    data.push([
      tech.username,
      tech.name,
      tech.role,
      tech.department || ''
    ]);
  });
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 20}, {wch: 30}, {wch: 15}, {wch: 25}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Technicians');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateTechniciansTemplateExcel(): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data = [
    ['Username', 'Name', 'Role', 'Department'],
    ['jdoe', 'John Doe', 'technician', 'Physical Plant'],
    ['INSTRUCTIONS:', 'Required: Username, Name, Role', 'Roles: admin, student, technician, controller', 'Optional: Department']
  ];
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 20}, {wch: 30}, {wch: 15}, {wch: 25}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Technicians Template');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function readBuildingsFromExcel(filePath: string): { buildings: InsertBuilding[], errors: Array<{ row: number; message: string }> } {
  const buildings: InsertBuilding[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { buildings, errors };
    }
    
    const headers = data[0] as string[];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, '')] = index;
      }
    });
    
    if (!('name' in headerMap)) {
      errors.push({ row: 1, message: "Required column 'name' not found in Excel file" });
      return { buildings, errors };
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      
      try {
        if (!row || row.every(cell => !cell || cell === '')) continue;
        
        const name = row[headerMap['name']]?.toString()?.trim();
        if (!name) {
          errors.push({ row: rowNumber, message: "Name is required" });
          continue;
        }
        
        const building: InsertBuilding = {
          name,
          location: headerMap['location'] !== undefined ? row[headerMap['location']]?.toString()?.trim() || null : null
        };
        
        buildings.push(building);
      } catch (rowError) {
        errors.push({ row: rowNumber, message: `Error processing row: ${rowError}` });
      }
    }
  } catch (error) {
    errors.push({ row: 0, message: `Failed to read Excel file: ${error}` });
  }
  
  return { buildings, errors };
}

export function generateBuildingsExcel(buildings: Building[]): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data: any[][] = [];
  data.push(['Name', 'Location']);
  
  buildings.forEach(building => {
    data.push([building.name, building.location || '']);
  });
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 30}, {wch: 40}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Buildings');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateBuildingsTemplateExcel(): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data = [
    ['Name', 'Location'],
    ['Sample Building', '123 Main Street'],
    ['INSTRUCTIONS: Required: Name', 'Optional: Location']
  ];
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 30}, {wch: 40}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Buildings Template');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function readLocationsFromExcel(filePath: string): { locations: InsertStorageLocation[], errors: Array<{ row: number; message: string }> } {
  const locations: InsertStorageLocation[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { locations, errors };
    }
    
    const headers = data[0] as string[];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, '')] = index;
      }
    });
    
    const requiredFields = ['name', 'buildingid'];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    
    if (errors.length > 0) return { locations, errors };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      
      try {
        if (!row || row.every(cell => !cell || cell === '')) continue;
        
        const name = row[headerMap['name']]?.toString()?.trim();
        const buildingId = parseInt(row[headerMap['buildingid']]?.toString() || '0');
        
        if (!name || !buildingId) {
          errors.push({ row: rowNumber, message: "Name and Building ID are required" });
          continue;
        }
        
        const location: any = {
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

export function generateLocationsExcel(locations: StorageLocation[]): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data: any[][] = [];
  data.push(['Name', 'Building ID', 'Building Name']);
  
  locations.forEach((location: any) => {
    data.push([
      location.name,
      location.buildingId || location.building_id,
      location.building?.name || location.buildingName || ''
    ]);
  });
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 30}, {wch: 15}, {wch: 30}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Storage Locations');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateLocationsTemplateExcel(): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data = [
    ['Name', 'Building ID'],
    ['Main Storage Room', '1'],
    ['INSTRUCTIONS: Required: Name, Building ID', 'Get Building IDs from Buildings page']
  ];
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 30}, {wch: 15}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Locations Template');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function readShelvesFromExcel(filePath: string): { shelves: InsertShelf[], errors: Array<{ row: number; message: string }> } {
  const shelves: InsertShelf[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { shelves, errors };
    }
    
    const headers = data[0] as string[];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, '')] = index;
      }
    });
    
    const requiredFields = ['name', 'locationid'];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    
    if (errors.length > 0) return { shelves, errors };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      
      try {
        if (!row || row.every(cell => !cell || cell === '')) continue;
        
        const name = row[headerMap['name']]?.toString()?.trim();
        const locationId = parseInt(row[headerMap['locationid']]?.toString() || '0');
        
        if (!name || !locationId) {
          errors.push({ row: rowNumber, message: "Name and Location ID are required" });
          continue;
        }
        
        const shelf: InsertShelf = {
          name,
          locationId
        };
        
        shelves.push(shelf);
      } catch (rowError) {
        errors.push({ row: rowNumber, message: `Error processing row: ${rowError}` });
      }
    }
  } catch (error) {
    errors.push({ row: 0, message: `Failed to read Excel file: ${error}` });
  }
  
  return { shelves, errors };
}

export function generateShelvesExcel(shelves: Shelf[]): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data: any[][] = [];
  data.push(['Name', 'Location ID', 'Location Name']);
  
  shelves.forEach((shelf: any) => {
    data.push([
      shelf.name,
      shelf.locationId || shelf.location_id,
      shelf.location?.name || shelf.locationName || ''
    ]);
  });
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 30}, {wch: 15}, {wch: 30}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Shelves');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateShelvesTemplateExcel(): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data = [
    ['Name', 'Location ID'],
    ['Shelf A-1', '1'],
    ['INSTRUCTIONS: Required: Name, Location ID', 'Get Location IDs from Locations page']
  ];
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 30}, {wch: 15}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Shelves Template');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Charge-Out Import/Export Functions
export function readChargeOutsFromExcel(filePath: string): { chargeOuts: any[], errors: Array<{ row: number; message: string }> } {
  const chargeOuts: any[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { chargeOuts, errors };
    }
    
    const headers = data[0] as string[];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, '')] = index;
      }
    });
    
    const requiredFields = ['partid', 'quantity', 'issuedby', 'buildingid'];
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    
    if (errors.length > 0) return { chargeOuts, errors };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      
      try {
        if (!row || row.every(cell => !cell || cell === '')) continue;
        
        const partId = parseInt(row[headerMap['partid']]?.toString() || '0');
        const quantity = parseInt(row[headerMap['quantity']]?.toString() || '0');
        const issuedBy = row[headerMap['issuedby']]?.toString()?.trim();
        const buildingId = parseInt(row[headerMap['buildingid']]?.toString() || '0');
        const notes = row[headerMap['notes']]?.toString()?.trim() || '';
        const costCenter = row[headerMap['costcenter']]?.toString()?.trim() || '';
        
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
          issuedAt: new Date()
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

export function generateChargeOutsExcel(chargeOuts: any[]): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data: any[][] = [];
  data.push(['ID', 'Part ID', 'Part Name', 'Quantity', 'Issued By', 'Building ID', 'Building Name', 'Cost Center', 'Notes', 'Issued Date']);
  
  chargeOuts.forEach((chargeOut: any) => {
    data.push([
      chargeOut.id,
      chargeOut.partId || chargeOut.part_id,
      chargeOut.partName || chargeOut.part?.name || '',
      chargeOut.quantity,
      chargeOut.issuedBy || chargeOut.issued_by,
      chargeOut.buildingId || chargeOut.building_id,
      chargeOut.buildingName || chargeOut.building?.name || '',
      chargeOut.costCenter || chargeOut.cost_center || '',
      chargeOut.notes || '',
      chargeOut.issuedAt ? format(new Date(chargeOut.issuedAt), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);
  });
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    {wch: 8}, {wch: 12}, {wch: 30}, {wch: 10}, {wch: 20}, 
    {wch: 12}, {wch: 25}, {wch: 15}, {wch: 30}, {wch: 20}
  ];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Charge Outs');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateChargeOutsTemplateExcel(): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data = [
    ['Part ID', 'Quantity', 'Issued By', 'Building ID', 'Cost Center', 'Notes'],
    ['525', '5', 'John Smith', '1', '11000-12760', 'Maintenance repair'],
    ['INSTRUCTIONS: Required: Part ID, Quantity, Issued By, Building ID', 'Get Part/Building IDs from respective pages', '', '', '', '']
  ];
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 12}, {wch: 10}, {wch: 20}, {wch: 12}, {wch: 15}, {wch: 30}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Charge Outs Template');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Delivery Import/Export Functions
export function readDeliveriesFromExcel(filePath: string): { deliveries: any[], errors: Array<{ row: number; message: string }> } {
  const deliveries: any[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length < 2) {
      errors.push({ row: 0, message: "Excel file must contain at least a header row and one data row" });
      return { deliveries, errors };
    }
    
    const headers = data[0] as string[];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        headerMap[header.toLowerCase().replace(/[\s_-]/g, '')] = index;
      }
    });
    
    // Check if this is an UPDATE import (has 'id' column) or NEW import
    const isUpdateImport = 'id' in headerMap;
    console.log(`Import type detected: ${isUpdateImport ? 'UPDATE' : 'NEW'} deliveries`);
    
    let requiredFields: string[];
    if (isUpdateImport) {
      // For updates, we need the ID and at least one updatable field
      requiredFields = ['id'];
    } else {
      // For new deliveries, we need the basic required fields
      requiredFields = ['partid', 'quantity', 'staffmember', 'buildingid'];
    }
    
    for (const field of requiredFields) {
      if (!(field in headerMap)) {
        errors.push({ row: 1, message: `Required column '${field}' not found in Excel file` });
      }
    }
    
    if (errors.length > 0) return { deliveries, errors };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      
      try {
        if (!row || row.every(cell => !cell || cell === '')) continue;
        
        const delivery: any = {};
        
        if (isUpdateImport) {
          // For updates, read the ID and any other fields present
          delivery.id = parseInt(row[headerMap['id']]?.toString() || '0');
          delivery.isUpdate = true;
          
          if (!delivery.id) {
            errors.push({ row: rowNumber, message: "Valid delivery ID is required for updates" });
            continue;
          }
        }
        
        // Read all available fields (using export format column names)
        if ('partid' in headerMap && row[headerMap['partid']]) {
          delivery.partId = parseInt(row[headerMap['partid']]?.toString() || '0');
        }
        if ('quantity' in headerMap && row[headerMap['quantity']]) {
          delivery.quantity = parseInt(row[headerMap['quantity']]?.toString() || '0');
        }
        if ('staffmember' in headerMap && row[headerMap['staffmember']]) {
          delivery.staffMember = row[headerMap['staffmember']]?.toString()?.trim();
        }
        if ('buildingid' in headerMap && row[headerMap['buildingid']]) {
          delivery.buildingId = parseInt(row[headerMap['buildingid']]?.toString() || '0');
        }
        if ('costcenterid' in headerMap && row[headerMap['costcenterid']]) {
          delivery.costCenterId = parseInt(row[headerMap['costcenterid']]?.toString() || '0');
        }
        if ('notes' in headerMap) {
          delivery.notes = row[headerMap['notes']]?.toString()?.trim() || '';
        }
        if ('date' in headerMap && row[headerMap['date']]) {
          delivery.deliveredAt = new Date(row[headerMap['date']]);
        }
        if ('unitcost' in headerMap && row[headerMap['unitcost']]) {
          // Remove dollar signs and parse
          const costStr = row[headerMap['unitcost']]?.toString()?.replace(/[$,]/g, '') || '0';
          delivery.unitCost = costStr;
        }
        
        // Validate based on import type
        if (!isUpdateImport) {
          // For new deliveries, validate required fields
          if (!delivery.partId || !delivery.quantity || !delivery.staffMember || !delivery.buildingId) {
            errors.push({ row: rowNumber, message: "Part ID, Quantity, Staff Member, and Building ID are required for new deliveries" });
            continue;
          }
          delivery.deliveredAt = new Date(); // Set current date for new deliveries
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

export function generateDeliveriesExcel(deliveries: any[]): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data: any[][] = [];
  // Headers that can be edited and imported back for updates
  data.push(['id', 'partid', 'quantity', 'staffmember', 'buildingid', 'status', 'notes', 'delivereddate']);
  
  deliveries.forEach((delivery: any) => {
    data.push([
      delivery.id, // Essential for updates
      delivery.partId || delivery.part_id,
      delivery.quantity,
      delivery.staffMember || delivery.staff_member,
      delivery.buildingId || delivery.building_id,
      delivery.status || 'pending',
      delivery.notes || '',
      delivery.deliveredAt ? format(new Date(delivery.deliveredAt), 'yyyy-MM-dd') : ''
    ]);
  });
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    {wch: 8}, {wch: 12}, {wch: 10}, {wch: 20}, 
    {wch: 12}, {wch: 12}, {wch: 30}, {wch: 15}
  ];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Deliveries');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateDeliveriesTemplateExcel(): Buffer {
  const workbook = xlsx.utils.book_new();
  
  const data = [
    ['partid', 'quantity', 'staffmember', 'buildingid', 'costcenter', 'status', 'notes'],
    ['837', '3', 'Dave Dellifield', '2', '128910-75500', 'pending', 'Urgent delivery needed'],
    ['INSTRUCTIONS: Required columns: partid, quantity, staffmember, buildingid', 'Status: pending/delivered/confirmed', 'Get Part/Building IDs from respective pages', '', '', '', '']
  ];
  
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{wch: 12}, {wch: 10}, {wch: 20}, {wch: 12}, {wch: 15}, {wch: 12}, {wch: 30}];
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Deliveries Template');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function generatePartsIssuanceExcel(issuances: PartsIssuanceWithDetails[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Parts Issuance Report');

  // Define columns
  worksheet.columns = [
    { header: 'Date', key: 'issuedAt', width: 12 },
    { header: 'Part ID', key: 'partId', width: 15 },
    { header: 'Part Name', key: 'partName', width: 30 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Unit Cost', key: 'unitCost', width: 12 },
    { header: 'Extended Price', key: 'extendedPrice', width: 15 },
    { header: 'Issued To', key: 'issuedTo', width: 20 },
    { header: 'Reason', key: 'reason', width: 15 },
    { header: 'Building', key: 'buildingName', width: 20 },
    { header: 'Cost Center', key: 'costCenterName', width: 25 },
    { header: 'Cost Center Code', key: 'costCenterCode', width: 18 },
    { header: 'Project Code', key: 'projectCode', width: 15 },
    { header: 'Notes', key: 'notes', width: 25 }
  ];

  // Add data rows
  issuances.forEach(issuance => {
    worksheet.addRow({
      issuedAt: issuance.issuedAt ? new Date(issuance.issuedAt).toLocaleDateString() : '',
      partId: issuance.part?.partId || '',
      partName: issuance.part?.name || '',
      quantity: issuance.quantity,
      unitCost: issuance.part?.unitCost || '',
      extendedPrice: (issuance as any).extendedPrice || (issuance.quantity * (parseFloat(issuance.part?.unitCost || '0'))),
      issuedTo: issuance.issuedTo,
      reason: issuance.reason,
      buildingName: (issuance as any).buildingName || '',
      costCenterName: (issuance as any).costCenterName || '',
      costCenterCode: (issuance as any).costCenterCode || '',
      projectCode: issuance.projectCode || '',
      notes: issuance.notes || ''
    });
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}
