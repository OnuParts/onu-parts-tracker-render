import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Barcode, PrintableBarcode, PrintMultipleBarcodes } from "@/components/BarcodeGenerator";
import { SimpleBarcodeScanner } from "@/components/barcode/SimpleBarcodeScanner";
import { BarcodeLabelPrinter } from "@/components/barcode/BarcodeLabelPrinter";
import { BarcodeManager } from "@/components/BarcodeManager";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { InventoryStatusBadge } from "@/components/ui/status-badge";
import { InventoryStatusIndicator } from "@/components/InventoryStatusIndicator";
import { InventoryStatusCard } from "@/components/InventoryStatusCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Package2,
  MapPin,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  Edit,
  Loader2,
  FileUp,
  FileDown,
  FileSpreadsheet,
  Upload,
  Trash2,
  QrCode,
  ClipboardList,
  ScanBarcode,
  Printer,
  Clock,
  TrendingDown,
  BarChart3
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Part } from "@shared/schema";
import { BearTooltip, HelpIcon } from "@/components/ui/bear-tooltip";

// Types for locations and shelves
type Location = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
};

type Shelf = {
  id: number;
  name: string;
  locationId: number;
  description: string | null;
  active: boolean;
  createdAt: string;
};
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// New part form schema
const partSchema = z.object({
  partId: z.string().min(3, "Part ID must be at least 3 characters"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative"),
  reorderLevel: z.coerce.number().min(1, "Reorder level must be at least 1"),
  // CRITICAL FIX: Keep unitCost as a string and don't transform to number
  unitCost: z.string().optional().transform(val => {
    if (!val || val === '') return '';
    // Remove any non-numeric characters except for decimal point
    const cleanedVal = val.replace(/[^\d.]/g, '');
    // Return as string, DO NOT convert to number - server expects string
    return cleanedVal;
  }),
  // CRITICAL FIX: Add locationId and shelfId to the schema
  locationId: z.number().nullable(),
  shelfId: z.number().nullable(),
});

// Form type with string values for easier input handling
type PartFormValues = {
  partId: string;
  name: string;
  description: string;
  quantity: number;
  reorderLevel: number;
  unitCost: string;
  locationId: number | null;
  shelfId: number | null;
};

interface ImportResultType {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: Array<{ row: number; message: string }>;
}

export default function PartsInventory() {
  const [search, setSearch] = useState("");
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isEditPartModalOpen, setIsEditPartModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [importResult, setImportResult] = useState<ImportResultType | null>(null);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [selectedPartsForPrinting, setSelectedPartsForPrinting] = useState<Part[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'low'>('all');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [showBarcodeLabelPrinter, setShowBarcodeLabelPrinter] = useState(false);
  const [selectedPartForBarcodes, setSelectedPartForBarcodes] = useState<Part | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [showBarcodeManager, setShowBarcodeManager] = useState(false);
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false);
  
  // Multiple barcodes for add part form
  const [addPartBarcodes, setAddPartBarcodes] = useState<Array<{ barcode: string; supplier: string; isPrimary: boolean }>>([]);
  const [newBarcodeInput, setNewBarcodeInput] = useState("");
  const [newSupplierInput, setNewSupplierInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Query for existing barcodes when editing a part
  const { data: existingBarcodes } = useQuery({
    queryKey: ['part-barcodes', selectedPart?.partId],
    queryFn: () => selectedPart?.partId ? 
      fetch(`/api/parts/${selectedPart.partId}/barcodes`).then(res => res.json()) : 
      Promise.resolve([]),
    enabled: !!selectedPart?.partId && isEditPartModalOpen
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Aging analysis data type - matches API response
  type AgingData = {
    partId: string;
    name: string;
    description: string | null;
    quantity: number;
    unitCost: string | null;
    lastIssuedDate: string | null;
    lastRestockDate: string | null;
    category: string | null;
    location: string | null;
    daysSinceLastIssued: number | null;
    daysSinceLastRestock: number | null;
    agingCategory: 'fast-moving' | 'slow-moving' | 'stagnant' | 'dead-stock';
    estimatedValue: number;
  };

  // Fetch aging analysis data
  const { data: agingData = [], isLoading: agingLoading, error: agingError } = useQuery<AgingData[]>({
    queryKey: ['/api/inventory/aging-analysis'],
    enabled: activeTab === 'aging'
  });
  
  // Fetch parts
  const { data: parts, isLoading } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
  });
  
  // Fetch locations and shelves
  const { data: locations = [], isError: locationsError, error: locationsErrorDetails } = useQuery<Location[]>({
    queryKey: ['/api/storage-locations'],
  });
  
  const { data: shelves = [], isError: shelvesError, error: shelvesErrorDetails } = useQuery<Shelf[]>({
    queryKey: ['/api/shelves'],
  });
  
  // Add part mutation
  // State to track API errors for add part form
  const [addPartApiError, setAddPartApiError] = useState<string | null>(null);
  
  const addPartMutation = useMutation({
    mutationFn: async (data: PartFormValues) => {
      // Clear any previous errors when starting a new request
      setAddPartApiError(null);
      
      // Ensure unitCost is explicitly a string and never empty (use "0" if empty)
      const formattedData = {
        ...data,
        unitCost: data.unitCost === "" ? "0" : String(data.unitCost)
      };
      
      console.log("Sending part data to server:", formattedData);
      console.log("unitCost value type:", typeof formattedData.unitCost);
      
      try {
        // Log the fetch URL for debugging
        console.log("Fetch URL:", "/api/parts");
        
        const response = await apiRequest("POST", "/api/parts", formattedData);
        
        // Check if the response is OK
        if (!response.ok) {
          // Log the full error response
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Error in addPartMutation:", error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log("Part added successfully:", data);
      
      // Store the count before clearing the state
      const barcodeCount = addPartBarcodes.length;
      
      // Clear the form and additional barcodes state
      addPartForm.reset();
      setAddPartBarcodes([]);
      setNewBarcodeInput("");
      setNewSupplierInput("");
      setIsAddPartModalOpen(false);
      
      // Invalidate queries to refresh the parts list
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/low-stock'] });
      
      // Show success message
      toast({
        title: "Part Added",
        description: `Part "${data.name}" has been added to inventory${barcodeCount > 0 ? ` with ${barcodeCount} additional barcode(s)` : ''}.`,
      });
    },
    onError: (error) => {
      console.error("Add part mutation error:", error);
      
      // Store the error for display in the form
      setAddPartApiError(error.message || "An unknown error occurred");
      
      toast({
        title: "Error",
        description: `Failed to add part: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: async ({ partId, data }: { partId: string, data: Partial<PartFormValues> }) => {
      console.log("updatePartMutation executing with data:", data);
      
      // Make sure all the fields from the form are actually sent
      // Ensure unitCost is never empty (use "0" if empty)
      const payload = {
        partId: data.partId,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        reorderLevel: data.reorderLevel,
        unitCost: data.unitCost === "" ? "0" : String(data.unitCost),
        locationId: data.locationId,
        shelfId: data.shelfId
      };
      
      console.log("ACTUAL PAYLOAD BEING SENT:", payload);
      
      const response = await apiRequest("PATCH", `/api/parts/${partId}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/low-stock'] });
      toast({
        title: "Part Updated",
        description: "The part has been updated in inventory.",
      });
      setIsEditPartModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update part: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete part mutation
  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const response = await apiRequest("DELETE", `/api/parts/${partId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/low-stock'] });
      toast({
        title: "Part Deleted",
        description: "The part has been removed from inventory.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete part: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Apply stock level filtering
  const getPartsByStockLevel = (partsArray: Part[] | undefined, level: 'all' | 'critical' | 'low'): Part[] => {
    if (!partsArray) return [];
    
    switch (level) {
      case 'critical':
        // Make sure we're properly calculating critical stock parts (those with quantity <= 30% of reorder level)
        // AND ensure we only include parts that have a reorder level > 0 to avoid division by zero
        return partsArray.filter(p => p.reorderLevel > 0 && p.quantity <= p.reorderLevel * 0.3);
      case 'low':
        return partsArray.filter(p => p.reorderLevel > 0 && p.quantity <= p.reorderLevel * 0.8 && p.quantity > p.reorderLevel * 0.3);
      case 'all':
      default:
        return partsArray;
    }
  }
  
  // Function to select all critical parts and redirect to Quick Count page
  const sendCriticalPartsToQuickCount = () => {
    if (!parts) return;
    
    // Get all critical stock parts (quantity <= 30% of reorder level)
    // Make sure we're only looking at parts with valid reorder levels > 0
    const criticalParts = parts.filter(p => p.reorderLevel > 0 && p.quantity <= p.reorderLevel * 0.3);
    
    if (criticalParts.length === 0) {
      toast({
        title: "No Critical Stock",
        description: "There are no parts in critical stock levels to assign.",
        variant: "destructive"
      });
      return;
    }
    
    // Store the critical part IDs in localStorage to be picked up by the Quick Count page
    const criticalPartIds = criticalParts.map(p => p.id);
    localStorage.setItem('criticalPartsForQuickCount', JSON.stringify(criticalPartIds));
    
    // Show toast notification before redirecting
    toast({
      title: "Redirecting to Quick Count",
      description: `${criticalParts.length} critical stock parts will be ready to assign.`
    });
    
    // Navigate to Quick Count page with query parameters indicating critical parts and manage tab
    window.location.href = '/quick-count?tab=manage&addCritical=true';
  }
  
  // Barcode search functionality for main inventory
  
  const barcodeSearchMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await fetch(`/api/parts-lookup/${barcode}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Part not found with that barcode');
        }
        throw new Error('Failed to lookup part');
      }
      return response.json();
    },
    onSuccess: (part) => {
      // Set the search to the part ID to highlight it in the results
      setSearch(part.partId);
      toast({
        title: "Part Found",
        description: `Found: ${part.name} (${part.partId})`,
      });
      setShowBarcodeSearch(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Part Not Found",
        description: error.message + " - Would you like to add this as a new part?",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Open the add part modal with the scanned barcode
              addPartForm.reset({
                partId: search || "", // Use the last searched/scanned barcode
                name: "",
                description: "",
                quantity: 0,
                reorderLevel: 0,
                unitCost: "",
                locationId: null,
                shelfId: null,
              });
              setIsAddPartModalOpen(true);
              setShowBarcodeSearch(false);
            }}
          >
            Add New Part
          </Button>
        ),
      });
    },
  });

  // Filter parts by search term
  const searchFilteredParts = parts?.filter(part => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      part.partId.toLowerCase().includes(searchLower) ||
      part.name.toLowerCase().includes(searchLower) ||
      (part.description && part.description.toLowerCase().includes(searchLower)) ||
      (part.location && part.location.toLowerCase().includes(searchLower))
    );
  }) || [];
  
  // Apply stock level filter
  const filteredParts = getPartsByStockLevel(searchFilteredParts, activeFilter);
  
  // For display in the table (already sorted by partId)
  const sortedParts = filteredParts;
  
  // Form for adding parts
  const addPartForm = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      partId: "",
      name: "",
      description: "",
      quantity: 0,
      reorderLevel: 10,
      unitCost: "",
      locationId: null,
      shelfId: null,
    },
  });
  
  // Form for editing parts
  const editPartForm = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      partId: "",
      name: "",
      description: "",
      quantity: 0,
      reorderLevel: 10,
      unitCost: "",
      locationId: null,
      shelfId: null,
    },
  });

  // Helper functions for managing multiple barcodes in add part form
  const addBarcodeToForm = () => {
    if (!newBarcodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a barcode",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicates
    if (addPartBarcodes.some(b => b.barcode === newBarcodeInput.trim())) {
      toast({
        title: "Error", 
        description: "This barcode already exists",
        variant: "destructive",
      });
      return;
    }
    
    const newBarcode = {
      barcode: newBarcodeInput.trim(),
      supplier: newSupplierInput.trim() || "Default",
      isPrimary: addPartBarcodes.length === 0 // First barcode is primary
    };
    
    setAddPartBarcodes([...addPartBarcodes, newBarcode]);
    setNewBarcodeInput("");
    setNewSupplierInput("");
  };

  const removeBarcodeFromForm = (index: number) => {
    const updatedBarcodes = addPartBarcodes.filter((_, i) => i !== index);
    // If removing primary, make first one primary
    if (addPartBarcodes[index].isPrimary && updatedBarcodes.length > 0) {
      updatedBarcodes[0].isPrimary = true;
    }
    setAddPartBarcodes(updatedBarcodes);
  };

  const setPrimaryBarcodeInForm = (index: number) => {
    const updatedBarcodes = addPartBarcodes.map((barcode, i) => ({
      ...barcode,
      isPrimary: i === index
    }));
    setAddPartBarcodes(updatedBarcodes);
  };
  
  // Handle adding a new part
  const handleAddPart = (data: PartFormValues) => {
    // First validate the form data for common issues
    console.log("Add Part Form Values:", data);
    
    // Clear any previous API errors
    setAddPartApiError(null);
    
    try {
      // Validate required fields (Zod should handle this, but adding extra validation)
      if (!data.partId || data.partId.trim() === '') {
        throw new Error("Part ID is required");
      }
      
      if (!data.name || data.name.trim() === '') {
        throw new Error("Part name is required");
      }
      
      // Make a clean copy of the data
      const processedData = { ...data };
      
      // IMPORTANT: Keep unitCost as a string exactly as entered - server expects string type
      // DO NOT convert to number as that causes validation errors
      
      // Handle locationId and shelfId to ensure they're properly formatted
      const locationId = processedData.locationId === null || processedData.locationId === '' 
                      ? null 
                      : Number(processedData.locationId);
                         
      const shelfId = processedData.shelfId === null || processedData.shelfId === '' 
                    ? null 
                    : Number(processedData.shelfId);
      
      const finalPayload = {
        ...processedData,
        // Keep unitCost exactly as is - server expects string type
        locationId,
        shelfId,
        // Include additional barcodes
        additionalBarcodes: addPartBarcodes
      };
      
      console.log("Adding new part with final payload:", finalPayload);
      console.log("Additional barcodes:", addPartBarcodes);
      
      // Send the processed data to the mutation
      addPartMutation.mutate(finalPayload);
      
    } catch (error) {
      console.error("Error processing add part form data:", error);
      
      // Set the API error for display in the form
      setAddPartApiError(error instanceof Error ? error.message : String(error));
      
      toast({
        title: "Form Error",
        description: `There was a problem with the form data: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };
  
  // Handle editing a part
  const handleEditPart = (data: PartFormValues) => {
    if (!selectedPart) return;
    
    // Add pre-submission logging to verify form values
    console.log("PRE-SUBMISSION FORM VALUES:", data);
    console.log("Submitting part edit with data:", data);
    console.log("Selected part for edit:", selectedPart);
    
    // CRITICAL FIX: Ensure locationId and shelfId are properly handled
    // Convert strings to numbers, handle empty values as null
    const locationId = data.locationId === null || data.locationId === '' 
                     ? null 
                     : Number(data.locationId);
                        
    const shelfId = data.shelfId === null || data.shelfId === '' 
                  ? null 
                  : Number(data.shelfId);
    
    console.log("PROCESSED LOCATION VALUES:", { 
      formLocationId: data.locationId,
      formShelfId: data.shelfId,
      processedLocationId: locationId,
      processedShelfId: shelfId,
      locationIdType: typeof locationId,
      shelfIdType: typeof shelfId
    });
    
    // Format data correctly for the server - CRITICAL FIX: BE VERY EXPLICIT with all fields
    const formattedData = {
      partId: data.partId,
      name: data.name,
      description: data.description,
      quantity: data.quantity,
      reorderLevel: data.reorderLevel,
      unitCost: data.unitCost,
      // CRITICAL FIX: Include location values properly typed as numbers or explicit null
      locationId: locationId, 
      shelfId: shelfId
    };
    
    console.log("FULL UPDATE PAYLOAD:", formattedData);
    
    // IMPORTANT: Keep unitCost as a string as the server expects - DO NOT convert to number
    // The backend validation requires unitCost to be a string
    console.log(`Edit part: Keeping unit cost as string: "${formattedData.unitCost}"`);
    
    // The locationId and shelfId are already handled as numbers or null in the formattedData
    // Keep all other data as-is
    const finalPayload = {
      ...formattedData
      // unitCost is already in the formattedData as a string
    };
    
    console.log("FINAL PAYLOAD WITH TYPED VALUES:", finalPayload);
    
    // CRITICAL FIX: Ensure locationId and shelfId are included in the payload
    console.log("DOUBLE-CHECKING PAYLOAD:", {
      originalFormValues: data,
      finalPayload: finalPayload,
      locationIdIncluded: 'locationId' in finalPayload,
      shelfIdIncluded: 'shelfId' in finalPayload
    });
    
    // Verify locationId/shelfId are in the payload one last time
    const verifiedPayload = {
      ...finalPayload,
      locationId: locationId, // Explicitly include these to be certain
      shelfId: shelfId
    };
    
    console.log("VERIFIED PAYLOAD BEING SENT:", verifiedPayload);
    
    // SEND A DIRECT PAYLOAD WITHOUT NESTING IN "data" PROPERTY
    apiRequest("PATCH", `/api/parts/${selectedPart.partId}`, verifiedPayload)
      .then(response => response.json())
      .then(updatedPart => {
        console.log("PART UPDATED SUCCESSFULLY:", updatedPart);
        
        // Force refresh the parts list
        queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/parts/low-stock'] });
        
        // Show success notification
        toast({
          title: "Part Updated",
          description: "The part has been updated in inventory.",
        });
        
        // Close the modal
        setIsEditPartModalOpen(false);
        
        // Close any WebSocket errors or unfinished WebSocket connections
        // This prevents the "Preview will be available soon" screen
        if (location.pathname !== '/parts-inventory') {
          window.location.href = '/parts-inventory';
        }
      })
      .catch(error => {
        console.error("PART UPDATE FAILED:", error);
        toast({
          title: "Error",
          description: `Failed to update part: ${error.message}`,
          variant: "destructive",
        });
      });
    
    if (data.partId !== selectedPart.partId) {
      toast({
        title: "Part ID Changes",
        description: "You changed the Part ID - this will update the part's identifier in the system"
      });
    }
  };

  // Handle parts inventory export using forced download approach
  const handleExport = async () => {
    toast({
      title: "Preparing export",
      description: "Generating parts inventory Excel file..."
    });
    
    try {
      // Method 1: Direct window.open approach (bypasses most browser blocks)
      const downloadWindow = window.open('/download/parts-inventory', '_blank');
      
      // Backup Method 2: If popup is blocked, use fetch + blob approach
      setTimeout(async () => {
        if (!downloadWindow || downloadWindow.closed) {
          console.log('Popup blocked, using fetch method');
          
          const response = await fetch('/download/parts-inventory', {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          });
          
          if (!response.ok) {
            throw new Error('Export failed');
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ONU_Parts_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
          
          // Force click with user interaction
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }, 100);
      
      toast({
        title: "Export initiated",
        description: "Parts inventory download started - check your downloads folder",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to download parts inventory",
        variant: "destructive",
      });
    }
  };
  
  // Open edit modal and populate form
  const openEditModal = (part: Part) => {
    setSelectedPart(part);
    
    // Explicitly log the part's location data
    console.log("OPENING EDIT MODAL FOR PART WITH LOCATION DATA:", { 
      part_id: part.partId,
      location_id: part.locationId, 
      shelf_id: part.shelfId 
    });
    
    // Set form values with careful handling of location data
    // Convert any non-numeric locationId/shelfId to null to avoid issues
    const formLocationId = part.locationId && typeof part.locationId === 'number' ? part.locationId : null;
    const formShelfId = part.shelfId && typeof part.shelfId === 'number' ? part.shelfId : null;
    
    console.log("EDIT FORM LOCATION VALUES:", {
      partLocationId: part.locationId, 
      partShelfId: part.shelfId,
      formLocationId,
      formShelfId
    });
    
    editPartForm.reset({
      partId: part.partId,
      name: part.name,
      description: part.description || "",
      quantity: part.quantity,
      reorderLevel: part.reorderLevel,
      unitCost: part.unitCost !== null && part.unitCost !== undefined 
                 ? parseFloat(part.unitCost.toString()).toFixed(2) 
                 : "",
      locationId: formLocationId,
      shelfId: formShelfId,
    });
    
    console.log("EDIT FORM INITIALIZED WITH VALUES:", editPartForm.getValues());
    
    setIsEditPartModalOpen(true);
  };
  
  // Toggle part selection for barcode printing
  const togglePartSelection = (part: Part) => {
    setSelectedPartsForPrinting(prevSelected => {
      const isAlreadySelected = prevSelected.some(p => p.id === part.id);
      
      if (isAlreadySelected) {
        return prevSelected.filter(p => p.id !== part.id);
      } else {
        return [...prevSelected, part];
      }
    });
  };
  
  // Show print barcode modal for a specific part
  const showPrintBarcodeModal = (part: Part) => {
    setSelectedPart(part);
    setIsBarcodeModalOpen(true);
  };
  
  // Table columns
  type ColumnDef = {
    header: string;
    accessor: "id" | "partId" | "name" | "description" | "quantity" | "reorderLevel" | "unitCost" | "location" | "category" | "supplier" | "lastRestockDate" | ((part: Part) => React.ReactNode);
    className?: string;
    sortable?: boolean;
    sortKey?: keyof Part;
  };
  
  const columns: ColumnDef[] = [
    {
      header: "Part ID",
      accessor: "partId",
      className: "whitespace-nowrap",
      sortable: true,
      sortKey: "partId",
    },
    {
      header: "Name",
      accessor: "name",
      sortable: true,
      sortKey: "name",
    },
    {
      header: "Description",
      accessor: (part: Part) => part.description || "-",
      sortable: true,
      sortKey: "description",
    },
    {
      header: "Quantity",
      accessor: (part: Part) => {
        // More granular status levels
        const ratio = part.quantity / part.reorderLevel;
        const isCritical = ratio <= 0.1;
        const isLow = ratio > 0.1 && ratio <= 0.3;
        const isWarning = ratio > 0.3 && ratio <= 0.5;
        const isAdequate = ratio > 0.5 && ratio <= 0.8;
        const isGood = ratio > 0.8 && ratio <= 1.5;
        const isExcess = ratio > 1.5;
        
        // Define color and icon based on status
        let colorClass = "";
        let icon = null;
        
        if (isCritical) {
          colorClass = "text-red-700 font-bold";
          icon = <span className="mr-1 text-red-700">⚠️</span>;
        } else if (isLow) {
          colorClass = "text-red-600 font-medium";
          icon = <span className="mr-1 text-red-600">⚠️</span>;
        } else if (isWarning) {
          colorClass = "text-amber-600 font-medium";
          icon = <span className="mr-1 text-amber-600">⚡</span>;
        } else if (isAdequate) {
          colorClass = "text-blue-500 font-medium";
          icon = <span className="mr-1 text-blue-500">✓</span>;
        } else if (isGood) {
          colorClass = "text-green-600 font-medium";
          icon = <span className="mr-1 text-green-600">✓</span>;
        } else if (isExcess) {
          colorClass = "text-purple-500 font-medium";
          icon = <span className="mr-1 text-purple-500">↑</span>;
        }
        
        return (
          <div className="flex items-center">
            {icon}
            <span className={colorClass}>
              {part.quantity}
            </span>
            {/* Add a subtle visual indicator of reorder level */}
            <span className="ml-1 text-xs text-muted-foreground opacity-75">
              /{part.reorderLevel}
            </span>
          </div>
        );
      },
      sortable: true,
      sortKey: "quantity",
    },
    {
      header: "Reorder Level",
      accessor: "reorderLevel",
      sortable: true,
      sortKey: "reorderLevel",
    },
    {
      header: "Status",
      accessor: (part: Part) => (
        <InventoryStatusIndicator 
          quantity={part.quantity} 
          reorderLevel={part.reorderLevel}
          showDetails={true}
        />
      ),
    },
    {
      header: "Location",
      accessor: (part: Part) => {
        // Find location and shelf names from their IDs
        const location = part.locationId ? locations.find(loc => loc.id === part.locationId) : null;
        const shelf = part.shelfId ? shelves.find(s => s.id === part.shelfId) : null;
        
        if (location || shelf) {
          return (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>
                {location?.name || ""}
                {location && shelf ? " / " : ""}
                {shelf?.name || ""}
              </span>
            </div>
          );
        } else if (part.location) {
          // Fallback to legacy location text if present
          return (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              {part.location}
            </div>
          );
        } else {
          return "-";
        }
      },
      sortable: true,
      sortKey: "location",
    },
    {
      header: "Unit Cost",
      accessor: (part: Part) => {
        if (part.unitCost === null || part.unitCost === undefined) return "-";
        
        // FIXED: Display the unit cost directly from the database without any conversion
        // The values in the database now match the imported spreadsheet values
        return `$${parseFloat(part.unitCost.toString()).toFixed(2)}`;
      },
      sortable: true,
      sortKey: "unitCost",
    },
    {
      header: "Actions",
      accessor: (part: Part) => {
        // Check if user has Admin or Student role for delete permission
        const canDelete = user?.role === 'admin' || user?.role === 'student';
        
        return (
          <div className="flex justify-end space-x-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(part);
              }}
            >
              <Edit className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                // Reorder functionality
                toast({
                  title: "Order Placed",
                  description: `Ordered 10 units of ${part.name}`,
                });
              }}
            >
              <ShoppingCart className="h-4 w-4 text-secondary" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                showPrintBarcodeModal(part);
              }}
            >
              <QrCode className="h-4 w-4 text-blue-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPartForBarcodes(part);
              }}
              title="Manage Multiple Barcodes"
            >
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </Button>
            {canDelete && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setPartToDelete(part);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
      className: "text-right",
    },
  ];
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading parts inventory...</span>
      </div>
    );
  }
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Parts Inventory</h2>
          <p className="text-muted-foreground">Manage parts, supplies, and aging analysis</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open("/api/parts/template", "_blank")}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Template
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <FileDown className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <FileUp className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button variant="outline" onClick={() => setShowBarcodeLabelPrinter(true)}>
              <Printer className="h-4 w-4 mr-1" />
              Print Labels
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/quick-count"}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Quick Count
            </Button>
          </div>
          <Button onClick={() => setIsAddPartModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Part
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Parts */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background"></div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-3xl flex items-center">
              <span>{parts?.length || 0}</span>
              <span className="ml-2 text-sm text-muted-foreground">items</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              Total Parts
              <BearTooltip content="This shows the total number of unique parts in your inventory.">
                <HelpIcon />
              </BearTooltip>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex justify-between items-center">
            <Package2 className="h-10 w-10 text-primary/70" />
            <div className="text-right">
              <span className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Medium/Low Stock Parts */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-background"></div>
          <CardHeader className="pb-2 relative">
            <div className="flex justify-between">
              <CardTitle className="text-3xl flex items-center">
                <span className="text-amber-600">
                  {parts?.filter(p => p.quantity <= p.reorderLevel * 0.8 && p.quantity > p.reorderLevel * 0.3).length || 0}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">items</span>
              </CardTitle>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                50-80%
              </span>
            </div>
            <CardDescription className="flex items-center gap-1.5">
              Low Stock Parts
              <BearTooltip content="Parts with quantities between 30% and 80% of their reorder level. Consider ordering more soon!">
                <HelpIcon />
              </BearTooltip>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex justify-between items-center">
            <RefreshCw className="h-10 w-10 text-amber-600/70" />
            <div className="text-right">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => setActiveFilter('low')}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Critical Stock Parts */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-background"></div>
          <CardHeader className="pb-2 relative">
            <div className="flex justify-between">
              <CardTitle className="text-3xl flex items-center">
                <span className="text-red-600">
                  {parts?.filter(p => p.quantity <= p.reorderLevel * 0.3).length || 0}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">items</span>
              </CardTitle>
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                &lt;30%
              </span>
            </div>
            <CardDescription className="flex items-center gap-1.5">
              Critical Stock Parts
              <BearTooltip content="Parts with quantities at or below 30% of their reorder level. These need immediate attention!">
                <HelpIcon />
              </BearTooltip>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex justify-between items-center">
            <AlertTriangle className="h-10 w-10 text-red-600/70" />
            <div className="text-right">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setActiveFilter('critical')}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5">
            Search Inventory
            <BearTooltip content="Search for parts by ID, name, description, or location - any text that matches will be shown!">
              <HelpIcon />
            </BearTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part ID, name, description, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowBarcodeSearch(true)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <ScanBarcode className="h-4 w-4" />
              Scan Barcode
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-1.5">
              {activeFilter === 'all' && 'All Parts'}
              {activeFilter === 'low' && 'Low Stock Parts'}
              {activeFilter === 'critical' && 'Critical Stock Parts'}
              <BearTooltip content="This table shows parts in your inventory based on the selected filter. Click on column headers to sort, and use pagination to navigate through the list.">
                <HelpIcon />
              </BearTooltip>
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={activeFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                <Package2 className="h-4 w-4 mr-1" />
                All Parts ({parts?.length || 0})
              </Button>
              <Button 
                variant={activeFilter === 'low' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveFilter('low')}
                className={activeFilter === 'low' ? '' : 'text-amber-600 hover:text-amber-600'}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Low Stock ({parts?.filter(p => p.quantity <= p.reorderLevel * 0.8 && p.quantity > p.reorderLevel * 0.3).length || 0})
              </Button>
              <Button 
                variant={activeFilter === 'critical' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveFilter('critical')}
                className={activeFilter === 'critical' ? '' : 'text-red-600 hover:text-red-600'}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Critical Stock ({parts?.filter(p => p.quantity <= p.reorderLevel * 0.3).length || 0})
              </Button>
              
              {/* Only show Add to Quick Count button when critical filter is active */}
              {activeFilter === 'critical' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={sendCriticalPartsToQuickCount}
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Assign All Critical Stock
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-2 md:mt-0">
            {selectedPartsForPrinting.length > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedPartsForPrinting.length} part(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPartsForPrinting([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsBarcodeModalOpen(true)}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print Barcodes
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // If no parts are selected, select all filtered parts
                if (selectedPartsForPrinting.length === 0) {
                  setSelectedPartsForPrinting(sortedParts);
                  toast({
                    title: "All Parts Selected",
                    description: `Selected ${sortedParts.length} parts for barcode printing.`,
                  });
                } else {
                  // If some parts are already selected, toggle between all and none
                  if (selectedPartsForPrinting.length === sortedParts.length) {
                    setSelectedPartsForPrinting([]);
                    toast({
                      title: "Selection Cleared",
                      description: "Cleared all selected parts.",
                    });
                  } else {
                    setSelectedPartsForPrinting(sortedParts);
                    toast({
                      title: "All Parts Selected",
                      description: `Selected ${sortedParts.length} parts for barcode printing.`,
                    });
                  }
                }
              }}
            >
              <QrCode className="h-4 w-4 mr-1" />
              {selectedPartsForPrinting.length === sortedParts.length 
                ? "Deselect All" 
                : "Select All for Printing"
              }
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sortedParts}
            columns={columns}
            itemsPerPage={10}
            onRowClick={(part) => togglePartSelection(part as Part)}
            selectedRows={selectedPartsForPrinting.map(p => p.id)}
          />
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          {agingLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading aging analysis...</span>
            </div>
          ) : agingError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Aging Analysis</AlertTitle>
              <AlertDescription>
                Failed to load aging analysis data. Please try again later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Aging Analysis Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Fast Moving</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {agingData.filter(item => item.agingCategory === 'fast-moving').length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Used within 30 days</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-600">Stagnant</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {agingData.filter(item => item.agingCategory === 'stagnant').length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Not used recently</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-600">Slow Moving</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {agingData.filter(item => item.agingCategory === 'slow-moving').length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Used within 90+ days</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Dead Stock</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {agingData.filter(item => item.agingCategory === 'dead-stock').length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Never used</p>
                  </CardContent>
                </Card>
              </div>

              {/* Aging Analysis Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Inventory Aging Analysis
                  </CardTitle>
                  <CardDescription>
                    Analysis of parts based on last usage date and movement patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={agingData}
                    columns={[
                      {
                        header: "Part ID",
                        accessor: "partId",
                        sortable: true,
                        sortKey: "partId",
                      },
                      {
                        header: "Name",
                        accessor: "name",
                        sortable: true,
                        sortKey: "name",
                      },
                      {
                        header: "Quantity",
                        accessor: "quantity",
                        sortable: true,
                        sortKey: "quantity",
                      },
                      {
                        header: "Estimated Value",
                        accessor: (item: any) => `$${item.estimatedValue?.toFixed(2) || '0.00'}`,
                        sortable: true,
                        sortKey: "estimatedValue",
                      },
                      {
                        header: "Days Since Last Issued",
                        accessor: (item: any) => item.daysSinceLastIssued === null ? "Never issued" : `${item.daysSinceLastIssued} days`,
                        sortable: true,
                        sortKey: "daysSinceLastIssued",
                      },
                      {
                        header: "Category",
                        accessor: (item: any) => (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.agingCategory === 'fast-moving' ? 'bg-green-100 text-green-800' :
                            item.agingCategory === 'slow-moving' ? 'bg-amber-100 text-amber-800' :
                            item.agingCategory === 'stagnant' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.agingCategory === 'dead-stock' ? 'Dead Stock' : 
                             item.agingCategory.charAt(0).toUpperCase() + item.agingCategory.slice(1).replace('-', ' ')}
                          </span>
                        ),
                        sortable: true,
                        sortKey: "agingCategory",
                      },
                      {
                        header: "Location",
                        accessor: (item: any) => item.location || "Unassigned",
                        sortable: true,
                        sortKey: "location",
                      },
                    ]}
                    itemsPerPage={15}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Part Modal */}
      <Dialog open={isAddPartModalOpen} onOpenChange={setIsAddPartModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
            <DialogDescription>
              Add a new part to the inventory. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          
          {/* Display API errors prominently */}
          {addPartApiError && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Adding Part</AlertTitle>
              <AlertDescription>
                {addPartApiError}
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...addPartForm}>
            <form onSubmit={addPartForm.handleSubmit(handleAddPart)} className="space-y-4 pb-14">
              <FormField
                control={addPartForm.control}
                name="partId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part ID</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input 
                          placeholder="P-1234" 
                          {...field} 
                          className="rounded-r-none"
                        />
                        <Button 
                          type="button" 
                          className="rounded-l-none" 
                          variant="outline"
                          onClick={() => setShowScanner(true)}
                        >
                          <ScanBarcode className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Click the scan button to scan a barcode
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addPartForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Air Filter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addPartForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="HVAC air filter 20x20x1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addPartForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addPartForm.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addPartForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="0.00"
                            onChange={(e) => {
                              console.log("Unit cost changed to:", e.target.value);
                              field.onChange(e.target.value);
                            }}
                            value={field.value || ''}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              // Ensure value is properly set on mobile touch interfaces
                              // If empty, always set to "0" to prevent database errors
                              if (e.target.value === '') {
                                console.log("Unit cost blur with empty value - setting to '0'");
                                field.onChange("0");
                              } else {
                                console.log("Unit cost blur event with value:", e.target.value);
                                field.onChange(e.target.value);
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addPartForm.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            // Properly handle empty string vs null values
                            const value = e.target.value ? parseInt(e.target.value, 10) : null;
                            console.log("ADD FORM: Location select changed to:", value, "from raw value:", e.target.value);
                            field.onChange(value);
                            // Reset shelf when location changes
                            addPartForm.setValue("shelfId", null);
                          }}
                          onBlur={(e) => {
                            // Ensure location value is properly captured on mobile touch interfaces
                            if (e.target.value) {
                              const value = parseInt(e.target.value, 10);
                              console.log("ADD FORM: Location onBlur with value:", value);
                              field.onChange(value);
                            }
                          }}
                        >
                          <option value="">Select a location</option>
                          {locations?.map((location) => (
                            <option key={location.id} value={location.id} disabled={!location.active}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>
                        Where this part is stored (stockroom, warehouse, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addPartForm.control}
                  name="shelfId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            // Properly handle empty string vs null values
                            const value = e.target.value ? parseInt(e.target.value, 10) : null;
                            console.log("ADD FORM: Shelf select changed to:", value, "from raw value:", e.target.value);
                            field.onChange(value);
                          }}
                          onBlur={(e) => {
                            // Ensure shelf value is properly captured on mobile touch interfaces
                            if (e.target.value) {
                              const value = parseInt(e.target.value, 10);
                              console.log("ADD FORM: Shelf onBlur with value:", value);
                              field.onChange(value);
                            }
                          }}
                          disabled={!addPartForm.watch("locationId")}
                        >
                          <option value="">Select a shelf</option>
                          {shelves
                            ?.filter(shelf => shelf.locationId === addPartForm.watch("locationId"))
                            .map((shelf) => (
                              <option key={shelf.id} value={shelf.id}>
                                {shelf.name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormDescription>
                        Optional - specific shelf within the location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* Multiple Barcodes Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Additional Barcodes</Label>
                  <div className="text-xs text-muted-foreground">
                    Add multiple barcodes for different suppliers
                  </div>
                </div>
                
                {/* Show current barcodes */}
                {addPartBarcodes.length > 0 && (
                  <div className="space-y-2">
                    {addPartBarcodes.map((barcode, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-mono">{barcode.barcode}</div>
                          {barcode.supplier && (
                            <div className="text-xs text-muted-foreground">({barcode.supplier})</div>
                          )}
                          {barcode.isPrimary && (
                            <div className="text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAddPartBarcodes(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new barcode */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter barcode"
                      value={newBarcodeInput}
                      onChange={(e) => setNewBarcodeInput(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Supplier (optional)"
                      value={newSupplierInput}
                      onChange={(e) => setNewSupplierInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      variant="outline"
                      size="sm"
                    >
                      <ScanBarcode className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (newBarcodeInput.trim()) {
                        const newBarcode = {
                          barcode: newBarcodeInput.trim(),
                          supplier: newSupplierInput.trim() || "",
                          isPrimary: addPartBarcodes.length === 0
                        };
                        setAddPartBarcodes(prev => [...prev, newBarcode]);
                        setNewBarcodeInput("");
                        setNewSupplierInput("");
                      }
                    }}
                    disabled={!newBarcodeInput.trim()}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Barcode
                  </Button>
                </div>
              </div>
              
              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    setIsAddPartModalOpen(false);
                    // Clear additional barcodes when canceling
                    setAddPartBarcodes([]);
                    setNewBarcodeInput("");
                    setNewSupplierInput("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPartMutation.isPending}
                  onClick={() => {
                    console.log("Add Part button clicked - will trigger form submission");
                    // Form will handle submission via onSubmit handler
                    // This click handler just ensures better mobile support
                  }}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {addPartMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Part
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Part Modal */}
      <Dialog open={isEditPartModalOpen} onOpenChange={setIsEditPartModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
            <DialogDescription>
              Update part information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editPartForm}>
            <form onSubmit={editPartForm.handleSubmit(handleEditPart)} className="space-y-4 pb-14">
              <FormField
                control={editPartForm.control}
                name="partId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part ID</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input 
                          {...field} 
                          className="rounded-r-none"
                        />
                        <Button 
                          type="button" 
                          className="rounded-l-none" 
                          variant="outline"
                          onClick={() => setShowScanner(true)}
                        >
                          <ScanBarcode className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Click the scan button to scan a barcode
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editPartForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editPartForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPartForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editPartForm.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPartForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="0.00"
                            onChange={(e) => {
                              console.log("Edit form unit cost changed to:", e.target.value);
                              field.onChange(e.target.value);
                            }}
                            value={field.value || ''}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              // Ensure value is properly set on mobile touch interfaces
                              // If empty, always set to "0" to prevent database errors
                              if (e.target.value === '') {
                                console.log("Edit form unit cost blur with empty value - setting to '0'");
                                field.onChange("0");
                              } else {
                                console.log("Edit form unit cost blur event with value:", e.target.value);
                                field.onChange(e.target.value);
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editPartForm.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            // Properly handle empty string vs null values
                            const value = e.target.value ? parseInt(e.target.value, 10) : null;
                            console.log("EDIT FORM: Location select changed to:", value, "from raw value:", e.target.value);
                            field.onChange(value);
                            // Reset shelf when location changes
                            editPartForm.setValue("shelfId", null);
                          }}
                          onBlur={(e) => {
                            // Ensure location value is properly captured on mobile touch interfaces
                            if (e.target.value) {
                              const value = parseInt(e.target.value, 10);
                              console.log("EDIT FORM: Location onBlur with value:", value);
                              field.onChange(value);
                            }
                          }}
                        >
                          <option value="">Select a location</option>
                          {locations?.map((location) => (
                            <option key={location.id} value={location.id} disabled={!location.active}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editPartForm.control}
                  name="shelfId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            // Properly handle empty string vs null values
                            const value = e.target.value ? parseInt(e.target.value, 10) : null;
                            console.log("EDIT FORM: Shelf select changed to:", value, "from raw value:", e.target.value);
                            field.onChange(value);
                          }}
                          onBlur={(e) => {
                            // Ensure shelf value is properly captured on mobile touch interfaces
                            if (e.target.value) {
                              const value = parseInt(e.target.value, 10);
                              console.log("EDIT FORM: Shelf onBlur with value:", value);
                              field.onChange(value);
                            }
                          }}
                          disabled={!editPartForm.getValues().locationId}
                        >
                          <option value="">Select a shelf</option>
                          {shelves
                            ?.filter(shelf => shelf.locationId === editPartForm.getValues().locationId)
                            .map((shelf) => (
                              <option key={shelf.id} value={shelf.id}>
                                {shelf.name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormDescription>
                        {!editPartForm.getValues().locationId && "Select a location first"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

              </div>
              
              {/* Barcode Management Section */}
              {selectedPart && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Barcodes</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBarcodeManager(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Manage Barcodes
                    </Button>
                  </div>
                  
                  {/* Display existing barcodes */}
                  <div className="space-y-2">
                    {existingBarcodes && existingBarcodes.length > 0 ? (
                      existingBarcodes.map((barcode: any) => (
                        <div key={barcode.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{barcode.barcode}</span>
                            {barcode.isPrimary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                            {barcode.supplier && (
                              <Badge variant="outline" className="text-xs">
                                {barcode.supplier}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No additional barcodes. Click "Manage Barcodes" to add alternative barcodes from different suppliers.
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    // Add detailed debug when form is cancelled
                    console.log("EDIT FORM CANCELLED - Current Values:", editPartForm.getValues());
                    setIsEditPartModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePartMutation.isPending}
                  onClick={() => {
                    // Debug to confirm form values before actual submission via onSubmit
                    console.log("PRE-SUBMISSION FORM VALUES:", {
                      ...editPartForm.getValues(),
                      locationId: editPartForm.getValues().locationId,
                      shelfId: editPartForm.getValues().shelfId
                    });
                  }}
                >
                  {updatePartMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Part
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Parts Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Import Parts from Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import parts data. You can download a template first.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              ref={fileInputRef}
              className="hidden"
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];
                  setIsUploading(true);
                  setImportResult(null);
                  
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const response = await fetch('/api/parts/import', {
                      method: 'POST',
                      body: formData,
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to upload file');
                    }
                    
                    const result = await response.json();
                    setImportResult(result);
                    
                    if (result.success) {
                      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/parts/low-stock'] });
                      
                      toast({
                        title: "Import Successful",
                        description: `Imported ${result.importedRows} parts out of ${result.totalRows} rows.`,
                      });
                    }
                  } catch (error) {
                    console.error('Import error:', error);
                    toast({
                      title: "Import Failed",
                      description: error instanceof Error ? error.message : 'Failed to import parts',
                      variant: "destructive",
                    });
                  } finally {
                    setIsUploading(false);
                    
                    // Reset file input
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }
                }
              }}
            />
            
            {!importResult && !isUploading && (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">Click to browse or drag and drop</p>
                <p className="text-xs text-muted-foreground">Supports Excel files (.xlsx, .xls)</p>
              </div>
            )}
            
            {isUploading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p>Uploading and processing file...</p>
              </div>
            )}
            
            {importResult && (
              <div className="space-y-4 mt-2">
                <Alert variant={importResult.errors.length > 0 ? "destructive" : "default"}>
                  <AlertTitle>Import Results</AlertTitle>
                  <AlertDescription>
                    <p>Total rows: {importResult.totalRows}</p>
                    <p>Imported parts: {importResult.importedRows}</p>
                    <p>Errors: {importResult.errors.length}</p>
                  </AlertDescription>
                </Alert>
                
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    <p className="font-semibold mb-1">Error details:</p>
                    <ul className="text-sm space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="text-destructive">
                          Row {error.row}: {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    setImportResult(null);
                    setIsImportModalOpen(false);
                  }}
                >
                  Close
                </Button>
                
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setImportResult(null);
                    fileInputRef.current?.click();
                  }}
                >
                  Upload Another File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!partToDelete} onOpenChange={() => setPartToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{partToDelete?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (partToDelete) {
                  deletePartMutation.mutate(partToDelete.partId);
                  setPartToDelete(null);
                }
              }}
              disabled={deletePartMutation.isPending}
            >
              {deletePartMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Single Barcode Print Modal */}
      <Dialog open={isBarcodeModalOpen && selectedPart !== null && selectedPartsForPrinting.length === 0} 
              onOpenChange={(open) => !open && setIsBarcodeModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Barcode</DialogTitle>
            <DialogDescription>
              Print barcode for {selectedPart?.name || "selected part"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center">
            {selectedPart && (
              <PrintableBarcode 
                value={selectedPart.partId} 
                itemName={selectedPart.name}
                height={80}
                onPrintComplete={() => {
                  setIsBarcodeModalOpen(false);
                  setSelectedPart(null);
                }}
              />
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBarcodeModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Multiple Barcodes Print Modal */}
      <Dialog open={isBarcodeModalOpen && selectedPartsForPrinting.length > 0} 
              onOpenChange={(open) => !open && setIsBarcodeModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Multiple Barcodes</DialogTitle>
            <DialogDescription>
              Print barcodes for {selectedPartsForPrinting.length} selected parts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <PrintMultipleBarcodes 
              items={selectedPartsForPrinting.map(part => ({
                value: part.partId,
                name: part.name
              }))}
              title={`${selectedPartsForPrinting.length} Barcodes - ONU Parts Tracker`}
              onPrintComplete={() => {
                setIsBarcodeModalOpen(false);
                // Don't clear selection after printing so users can print again if needed
              }}
            />
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="mb-2">Selected parts:</p>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                <ul className="list-disc pl-5 space-y-1">
                  {selectedPartsForPrinting.slice(0, 15).map(part => (
                    <li key={part.id}>
                      <span className="font-medium">{part.partId}</span> - {part.name}
                    </li>
                  ))}
                  {selectedPartsForPrinting.length > 15 && (
                    <li className="text-muted-foreground">
                      ...and {selectedPartsForPrinting.length - 15} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPartsForPrinting([])}
            >
              Clear Selection
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsBarcodeModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog for Add/Edit Part */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>
              Scan a barcode to fill in the Part ID field
            </DialogDescription>
          </DialogHeader>
          
          <SimpleBarcodeScanner 
            onCodeDetected={(code) => {
              setScannedBarcode(code);
              setShowScanner(false);
              
              // Find if this part ID already exists in the database
              const existingPart = parts?.find(p => p.partId === code);
              
              if (existingPart) {
                // If we're in edit mode and have a selected part
                if (isEditPartModalOpen && selectedPart) {
                  // Update the Part ID in the edit form
                  editPartForm.setValue("partId", code);
                  toast({
                    title: "Existing Part Detected",
                    description: `This barcode is already registered as: ${existingPart.name}`,
                  });
                } 
                // If we're in add mode
                else if (isAddPartModalOpen) {
                  // Update the Part ID in the add form
                  addPartForm.setValue("partId", code);
                  toast({
                    title: "Existing Part Detected",
                    description: `This barcode is already registered as: ${existingPart.name}`,
                  });
                }
              } else {
                // Not an existing part, set the barcode value
                if (isEditPartModalOpen && selectedPart) {
                  editPartForm.setValue("partId", code);
                } else if (isAddPartModalOpen) {
                  // Check if the main Part ID field is empty - if so, fill it
                  const currentPartId = addPartForm.getValues("partId");
                  if (!currentPartId || currentPartId.trim() === "") {
                    addPartForm.setValue("partId", code);
                  } else {
                    // Main Part ID is already filled, add to additional barcodes
                    setNewBarcodeInput(code);
                  }
                }
                
                toast({
                  title: "New Barcode",
                  description: "This appears to be a new barcode. Please fill in the remaining fields.",
                });
              }
            }}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Barcode Search Dialog for Main Inventory Search */}
      <Dialog open={showBarcodeSearch} onOpenChange={setShowBarcodeSearch}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search by Barcode</DialogTitle>
            <DialogDescription>
              Scan a barcode to search for parts in inventory
            </DialogDescription>
          </DialogHeader>
          
          <SimpleBarcodeScanner 
            onCodeDetected={(code) => {
              barcodeSearchMutation.mutate(code);
            }}
            onClose={() => setShowBarcodeSearch(false)}
          />
          
          {barcodeSearchMutation.isPending && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Searching for part...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Label Printer */}
      <BarcodeLabelPrinter 
        open={showBarcodeLabelPrinter} 
        onOpenChange={setShowBarcodeLabelPrinter} 
      />

      {/* Barcode Management Dialog */}
      <Dialog open={!!selectedPartForBarcodes} onOpenChange={() => setSelectedPartForBarcodes(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Barcodes - {selectedPartForBarcodes?.name}</DialogTitle>
            <DialogDescription>
              Add, edit, and manage multiple barcodes for this part. Different suppliers can have different barcodes.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPartForBarcodes && (
            <BarcodeManager 
              partId={selectedPartForBarcodes.id}
              partNumber={selectedPartForBarcodes.partId}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Barcode Manager Dialog for Edit Part */}
      <Dialog open={showBarcodeManager} onOpenChange={setShowBarcodeManager}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Barcodes</DialogTitle>
            <DialogDescription>
              {selectedPart ? `Manage barcodes for ${selectedPart.name} (${selectedPart.partId})` : "Manage barcodes for this part"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <BarcodeManager 
              partId={selectedPart.id}
              partNumber={selectedPart.partId}
              showAllBarcodes={false}
            />
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBarcodeManager(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
