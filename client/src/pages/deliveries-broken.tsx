import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import SignatureConfirmationDialog from "@/components/SignatureConfirmationDialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  Loader,
  Loader2,
  Check,
  Clock
} from "lucide-react";
import { format, isToday, isSameMonth, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/app-layout";
import LoadingSpinner from "@/components/loading-spinner";
import { useRole } from "@/hooks/use-role";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

// Helper function to process dates consistently
/**
 * Process date strings for consistent server submission
 * Handles both YYYY-MM-DD format and Date objects
 * Always returns an ISO date string
 */
function processDateForServer(dateString: string): string {
  try {
    console.log("Processing date string:", dateString);
    
    // Check if the input is a date in 'yyyy-MM-dd' format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // Create date at noon to avoid timezone issues
      const dateObj = new Date(year, month - 1, day, 12, 0, 0);
      console.log("Created date object from string:", dateObj.toISOString());
      return dateObj.toISOString();
    } 
    
    // Fallback to parsing the string directly
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date string: " + dateString);
    }
    console.log("Parsed date from generic string:", dateObj.toISOString());
    return dateObj.toISOString();
  } catch (error) {
    console.error("Error processing date:", error);
    // Default to current date if there's a parsing error
    return new Date().toISOString();
  }
}

interface PartsDelivery {
  id: number;
  partId: number;
  quantity: number;
  staffMemberId: number;
  buildingId?: number;
  costCenterId?: number;
  status?: 'pending' | 'delivered' | 'cancelled';
  signature?: string;
  confirmedAt?: string;
  deliveredAt: string; // ISO date string
  deliveredById: number;
  notes?: string;
  projectCode?: string;
  part?: {
    id: number;
    name: string;
    partId: string;
    unitCost: number;
    quantity: number;
    description?: string;
  };
  staffMember?: {
    id: number;
    name: string;
    buildingId?: number;
    costCenterId?: number;
    email?: string;
    phone?: string;
    active?: boolean;
    createdAt?: string;
    building?: {
      id: number;
      name: string;
    };
    costCenter?: {
      id: number;
      code: string;
      name: string;
    };
  };
  building?: {
    id: number;
    name: string;
  };
  costCenter?: {
    id: number;
    code: string;
    name: string;
  };
  deliveredBy?: {
    id: number;
    username: string;
    name: string;
    role?: string;
    department?: string;
  };
}

interface Part {
  id: number;
  partId: string;  // This matches the schema field
  name: string;
  quantity: number; // This is currentStock
  unitCost: number;
}

interface StaffMember {
  id: number;
  name: string;
  buildingId: number;
  costCenterId: number;
  building?: {
    id: number;
    name: string;
  };
  costCenter?: {
    id: number;
    code: string;
    name: string;
  };
}

// Type for cart items
type CartItem = {
  partId: number;
  partName: string;
  partNumber: string;
  quantity: number;  // We'll ensure this is a number before adding to cart
  maxQuantity: number;
};

// Schema for bulk delivery
const bulkDeliverySchema = z.object({
  staffMemberId: z.number().min(1, "Staff member is required"),
  buildingId: z.number().optional(),
  costCenterId: z.number().optional(),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  notes: z.string().optional(),
});

type BulkDeliveryFormValues = z.infer<typeof bulkDeliverySchema>;

export default function Deliveries() {
  const { isAdmin, isStudent } = useRole();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isBulkDeliveryOpen, setIsBulkDeliveryOpen] = useState(false);
  const [currentDelivery, setCurrentDelivery] = useState<PartsDelivery | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState({ isUploading: false, message: '' });
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number | string>(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showStaffResults, setShowStaffResults] = useState(false);
  const [showPartResults, setShowPartResults] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [projectCode, setProjectCode] = useState("");
  const [notes, setNotes] = useState("");
  const [formData, setFormData] = useState({
    partId: 0,
    quantity: 1,
    staffMemberId: 0,
    buildingId: 0,
    costCenterId: 0,
    deliveryDate: format(new Date(), "yyyy-MM-dd"),
    notes: ""
  });
  const [editFormData, setEditFormData] = useState({
    id: 0,
    partId: 0,
    quantity: 1 as number | string,
    staffMemberId: 0,
    buildingId: 0,
    costCenterId: 0,
    notes: "",
    deliveredAt: new Date()
  });
  const { toast } = useToast();
  
  // Add event listener for staff selection from the fix-staff-selection.js script
  useEffect(() => {
    // Handler for staff selection from the DOM script
    const handleStaffSelected = (event: CustomEvent) => {
      const { id, buildingId, costCenterId } = event.detail;
      console.log("Staff selected via script:", id, buildingId, costCenterId);
      
      setFormData(prev => ({
        ...prev,
        staffMemberId: id,
        buildingId: buildingId || 0,
        costCenterId: costCenterId || 0
      }));
    };
    
    // Add the event listener
    document.addEventListener('staffSelected', handleStaffSelected as EventListener);
    
    // Cleanup
    return () => {
      document.removeEventListener('staffSelected', handleStaffSelected as EventListener);
    };
  }, []);
  
  // Form for bulk delivery
  const bulkForm = useForm<BulkDeliveryFormValues>({
    resolver: zodResolver(bulkDeliverySchema),
    defaultValues: {
      staffMemberId: 0,
      buildingId: undefined,
      costCenterId: undefined,
      deliveryDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  // Format month for filtering
  const monthParam = format(month, "MM/yyyy");
  
  // Fetch deliveries for the selected month
  const { data: deliveries, isLoading: isLoadingDeliveries, error: deliveriesError } = useQuery<PartsDelivery[]>({
    queryKey: ['/api/parts-delivery', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-delivery?month=${monthParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      return response.json();
    },
    retry: 1
  });

  // Fetch parts
  const { data: parts, isLoading: isLoadingParts } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
    retry: 1
  });

  // Fetch staff members
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery<StaffMember[]>({
    queryKey: ['/api/staff'],
    retry: 1
  });

  // Fetch buildings
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery<{id: number, name: string}[]>({
    queryKey: ['/api/buildings'],
    retry: 1
  });
  
  // Fetch cost centers
  const { data: costCenters, isLoading: isLoadingCostCenters } = useQuery<{id: number, code: string, name: string}[]>({
    queryKey: ['/api/cost-centers'],
    retry: 1
  });

  // Get monthly total for the selected month
  const { data: monthlyTotal } = useQuery<{ total: number }>({
    queryKey: ['/api/parts-delivery/monthly-total', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-delivery/monthly-total?month=${monthParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monthly total');
      }
      return response.json();
    },
    retry: 1
  });

  // Get monthly count of ALL deliveries (pending + completed) for reporting
  const { data: monthlyCount } = useQuery<{ count: number }>({
    queryKey: ['/api/parts-delivery/monthly-count', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-delivery/monthly-count?month=${monthParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monthly count');
      }
      return response.json();
    },
    retry: 1
  });


  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      partId: number;
      quantity: number;
      staffMemberId: number;
      buildingId: number;
      costCenterId: number;
      deliveryDate: string;
      notes?: string;
    }) => {
      // Convert deliveryDate to match the server's expected format (deliveredAt)
      const { deliveryDate, ...rest } = data;
      
      // Use our helper to process the date string
      const isoDate = processDateForServer(deliveryDate);
      console.log("ISO date for delivery:", isoDate);
      
      const payload = {
        ...rest,
        deliveredAt: isoDate,
        // Add current user as deliveredById
        deliveredById: 1, // This will be the logged-in user's ID in production
      };
      
      const response = await fetch("/api/parts-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create delivery");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery/monthly-total'] });
      toast({
        title: "Delivery created",
        description: "Parts delivery was recorded successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating delivery",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      partId?: number;
      quantity?: number;
      staffMemberId?: number;
      buildingId?: number | null;
      costCenterId?: number | null;
      notes?: string;
      deliveredAt?: string; // Changed from Date to string
    }) => {
      const { id, ...updateData } = data;
      
      const response = await fetch(`/api/parts-delivery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update delivery");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery/monthly-total'] });
      toast({
        title: "Delivery updated",
        description: "Parts delivery was updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating delivery",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Confirm Delivery mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: async (data: {
      deliveryId: number;
      signatureData?: string;
    }) => {
      const response = await fetch(`/api/parts-delivery/${data.deliveryId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          signatureData: data.signatureData 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to confirm delivery");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      toast({
        title: "Delivery confirmed",
        description: "The delivery has been confirmed successfully",
      });
      setIsConfirmDialogOpen(false);
      setCurrentDelivery(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error confirming delivery",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/parts-delivery/${id}`, {
        method: "DELETE",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Check for non-JSON responses first
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        // If response is OK but not JSON, return a simple success object
        return { success: true };
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete delivery");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery/monthly-total'] });
      toast({
        title: "Delivery deleted",
        description: "Parts delivery was deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting delivery",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Bulk delivery mutation - creates a single delivery batch for multiple items
  const bulkDeliveryMutation = useMutation({
    mutationFn: async (data: {
      parts: { partId: number; quantity: number }[];
      staffMemberId: number;
      buildingId?: number;
      costCenterId?: number;
      deliveryDate: string;
      notes?: string;
    }) => {
      // Send the entire batch as one delivery group
      const deliveryBatch = {
        parts: data.parts,
        staffMemberId: data.staffMemberId,
        buildingId: data.buildingId || null,
        costCenterId: data.costCenterId || null,
        deliveredAt: data.deliveryDate,
        notes: data.notes || ''
      };
      
      console.log("BATCH DELIVERY SUBMISSION - Sending batch:", deliveryBatch);
      
      const response = await fetch("/api/parts-delivery/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryBatch)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("BATCH DELIVERY SUBMISSION - Error:", errorText);
        throw new Error(`Failed to create delivery batch: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("BATCH DELIVERY SUBMISSION - Success:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery/monthly-total'] });
      toast({
        title: "Bulk delivery created",
        description: `${cartItems.length} part${cartItems.length !== 1 ? 's' : ''} delivered successfully`,
      });
      setIsBulkDeliveryOpen(false);
      setCartItems([]);
      bulkForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating delivery",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Export deliveries for the currently selected month
  const handleExport = async () => {
    try {
      // Use the currently selected month for export
      const formattedMonth = format(month, "MM/yyyy");
      const response = await fetch(`/api/parts-delivery/export?month=${formattedMonth}`);
      
      if (!response.ok) {
        throw new Error("Failed to export deliveries");
      }
      
      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      
      // Use the month in the filename
      const monthText = format(month, "MMM-yyyy");
      a.download = `parts-deliveries-${monthText}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: `Deliveries for ${format(month, "MMMM yyyy")} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Import deliveries from Excel file
  const handleFileImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import",
        variant: "destructive"
      });
      return;
    }

    setImportProgress({ isUploading: true, message: 'Uploading and processing file...' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/parts-delivery/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Import failed');
      }

      const result = await response.json();
      
      // Close dialog and reset form
      setShowImportDialog(false);
      setSelectedFile(null);
      setImportProgress({ isUploading: false, message: '' });
      
      // Refresh deliveries data
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      
      toast({
        title: "Import successful",
        description: `Successfully imported ${result.imported || 0} deliveries`,
      });
    } catch (error) {
      setImportProgress({ isUploading: false, message: '' });
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred during import",
        variant: "destructive"
      });
    }
  };

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If cart has items, use batch delivery system
    if (cartItems.length > 0) {
      // Validate required fields for the bulk delivery
      if (!formData.staffMemberId || !formData.deliveryDate) {
        toast({
          title: "Validation Error",
          description: "Staff Member and Delivery Date are required fields",
          variant: "destructive"
        });
        return;
      }
      
      // Create batch delivery with all cart items
      const batchData = {
        parts: cartItems.map(item => ({
          partId: item.partId,
          quantity: item.quantity
        })),
        staffMemberId: formData.staffMemberId,
        buildingId: formData.buildingId || 0,
        costCenterId: formData.costCenterId || 0,
        deliveryDate: formData.deliveryDate,
        notes: formData.notes || ''
      };
      
      console.log("CART SUBMISSION - Using batch delivery:", batchData);
      
      // Use the bulk delivery mutation (batch endpoint)
      bulkDeliveryMutation.mutate(batchData, {
        onSuccess: () => {
          // Reset the form and close the dialog
          resetForm();
          setCartItems([]);
          setIsCreateDialogOpen(false);
        }
      });
      
    } else {
      // Traditional single item delivery
      // Validate required fields
      if (!formData.partId || !formData.quantity || !formData.staffMemberId || !formData.deliveryDate) {
        toast({
          title: "Validation Error",
          description: "Part, Quantity, Staff Member, and Delivery Date are required fields",
          variant: "destructive"
        });
        return;
      }
      
      if (formData.quantity <= 0) {
        toast({
          title: "Validation Error",
          description: "Quantity must be greater than zero",
          variant: "destructive"
        });
        return;
      }
      
      createMutation.mutate(formData);
    }
  };
  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!editFormData.quantity || Number(editFormData.quantity) <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    // Convert any 0 values for building and cost center to null
    const buildingId = editFormData.buildingId === 0 ? null : editFormData.buildingId;
    const costCenterId = editFormData.costCenterId === 0 ? null : editFormData.costCenterId;
    
    // Debug - log the current delivery date being submitted
    console.log("Submitting delivery date (raw):", editFormData.deliveredAt);
    
    // Use our helper function to process the date consistently
    const deliveredAtIso = processDateForServer(format(editFormData.deliveredAt, "yyyy-MM-dd"));
    console.log("Submitting delivery date (ISO):", deliveredAtIso);
    
    editMutation.mutate({
      id: editFormData.id,
      partId: editFormData.partId,
      quantity: Number(editFormData.quantity),
      staffMemberId: editFormData.staffMemberId,
      buildingId,
      costCenterId,
      notes: editFormData.notes,
      // Send the date as a string property - schema expects string, not Date object
      deliveredAt: deliveredAtIso
    });
  };
  
  const handleEditDelivery = (delivery: PartsDelivery) => {
    setCurrentDelivery(delivery);
    
    setEditFormData({
      id: delivery.id,
      partId: delivery.part ? delivery.part.id : 0,
      quantity: delivery.quantity,
      staffMemberId: delivery.staffMember ? delivery.staffMember.id : 0,
      buildingId: delivery.buildingId || 0,
      costCenterId: delivery.costCenterId || 0,
      notes: delivery.notes || "",
      deliveredAt: delivery.deliveredAt ? new Date(delivery.deliveredAt) : new Date()
    });
    
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteDelivery = (delivery: PartsDelivery) => {
    setCurrentDelivery(delivery);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelivery = (delivery: PartsDelivery) => {
    setCurrentDelivery(delivery);
    setIsConfirmDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (currentDelivery) {
      deleteMutation.mutate(currentDelivery.id);
    }
  };

  const resetForm = () => {
    setFormData({
      partId: 0,
      quantity: 1,
      staffMemberId: 0,
      buildingId: 0,
      costCenterId: 0,
      deliveryDate: format(new Date(), "yyyy-MM-dd"),
      notes: ""
    });
    setStaffSearchTerm("");
    setPartSearchTerm("");
  };
  
  // Handle adding a part to the cart
  const handleAddToCart = () => {
    // Make sure selectedQuantity is a number and valid
    const numQuantity = typeof selectedQuantity === 'string' 
      ? parseInt(selectedQuantity) 
      : selectedQuantity;
      
    if (!selectedPartId || !numQuantity || numQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a part and valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    // Find the selected part
    const selectedPart = parts?.find(p => p.id === selectedPartId);
    if (!selectedPart) {
      toast({
        title: "Error",
        description: "Selected part not found",
        variant: "destructive",
      });
      return;
    }
    
    // Check if quantity is valid
    if (numQuantity > selectedPart.quantity) {
      toast({
        title: "Error",
        description: `Only ${selectedPart.quantity} ${selectedPart.name} available in stock`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if part is already in cart
    const existingCartItem = cartItems.find(item => item.partId === selectedPartId);
    if (existingCartItem) {
      // Update existing cart item
      const numQuantity = typeof selectedQuantity === 'string' 
        ? parseInt(selectedQuantity) 
        : selectedQuantity;
        
      setCartItems(prev =>
        prev.map(item =>
          item.partId === selectedPartId
            ? { 
                ...item, 
                quantity: item.quantity + numQuantity > item.maxQuantity 
                  ? item.maxQuantity 
                  : item.quantity + numQuantity 
              }
            : item
        )
      );
      
      toast({
        title: "Cart updated",
        description: `Updated ${selectedPart.name} quantity in cart`,
      });
    } else {
      // Add new cart item
      const numQuantity = typeof selectedQuantity === 'string' 
        ? parseInt(selectedQuantity) 
        : selectedQuantity;
        
      setCartItems(prev => [
        ...prev,
        {
          partId: selectedPartId,
          partName: selectedPart.name,
          partNumber: selectedPart.partId,
          quantity: numQuantity,
          maxQuantity: selectedPart.quantity,
        },
      ]);
      
      toast({
        title: "Part added",
        description: `Added ${selectedPart.name} to cart`,
      });
    }
    
    // Reset selection
    setSelectedPartId(null);
    setSelectedQuantity(1);
    setPartSearchTerm("");
  };
  
  // Handle removing a part from the cart
  const handleRemoveFromCart = (partId: number) => {
    setCartItems(prev => prev.filter(item => item.partId !== partId));
  };
  
  // Handle submitting the bulk delivery
  const handleBulkDeliverySubmit = (data: BulkDeliveryFormValues) => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "No parts in cart to deliver",
        variant: "destructive",
      });
      return;
    }
    
    bulkDeliveryMutation.mutate({
      parts: cartItems.map(item => ({
        partId: item.partId,
        quantity: item.quantity
      })),
      staffMemberId: data.staffMemberId,
      buildingId: data.buildingId,
      costCenterId: data.costCenterId,
      deliveryDate: data.deliveryDate,
      notes: data.notes
    });
  };

  // Enhanced filter parts by search term with intelligent text matching
  const filteredParts = React.useMemo(() => {
    if (!parts) return [];
    if (!partSearchTerm || !partSearchTerm.trim()) return parts;
    
    try {
      const searchTerms = partSearchTerm.toLowerCase().trim().split(/\s+/);
      
      return parts.filter(part => {
        const searchableText = [
          part.name || '',
          part.partId || '',
          (part as any).description || '',
          (part as any).category || ''
        ].join(' ').toLowerCase();
        
        // All search terms must be found somewhere in the searchable text
        return searchTerms.every(term => searchableText.includes(term));
      });
    } catch (error) {
      console.error("Error filtering parts:", error);
      return parts;
    }
  }, [parts, partSearchTerm]);
  
  // Filter staff members by search term
  const filteredStaffMembers = React.useMemo(() => {
    if (!staffMembers) return [];
    if (!staffSearchTerm || !staffSearchTerm.trim()) return staffMembers;
    
    try {
      const searchLower = staffSearchTerm.toLowerCase();
      return staffMembers.filter(staff => 
        staff.name && staff.name.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error("Error filtering staff members:", error);
      return staffMembers;
    }
  }, [staffMembers, staffSearchTerm]);

  // Filter deliveries by search term
  const filteredDeliveries = deliveries?.filter(delivery => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Safely check part properties
    const partMatch = 
      (delivery.part?.name && delivery.part.name.toLowerCase().includes(searchLower)) || 
      (delivery.part?.partId && delivery.part.partId.toLowerCase().includes(searchLower));
    
    // Safely check staff properties
    const staffMatch = delivery.staffMember?.name && 
      delivery.staffMember.name.toLowerCase().includes(searchLower);
    
    // Safely check building properties
    const buildingMatch = delivery.building?.name && 
      delivery.building.name.toLowerCase().includes(searchLower);
    
    // Safely check cost center properties
    const costCenterMatch = delivery.costCenter?.code && 
      delivery.costCenter.code.toLowerCase().includes(searchLower);
    
    // Safely check delivery date
    const dateMatch = delivery.deliveredAt && 
      format(new Date(delivery.deliveredAt), 'yyyy-MM-dd').includes(searchLower);
    
    return !!partMatch || !!staffMatch || !!buildingMatch || !!costCenterMatch || !!dateMatch;
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, "MMM dd, yyyy");
      }
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  if (isLoadingDeliveries || isLoadingParts || isLoadingStaff || isLoadingBuildings || isLoadingCostCenters) return <LoadingSpinner />;

  if (deliveriesError) {
    return (
      <AppLayout title="Deliveries">
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error loading deliveries: {deliveriesError instanceof Error ? deliveriesError.message : "Unknown error"}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Deliveries">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="md:w-2/3">
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Parts Deliveries</CardTitle>
                    <CardDescription>
                      Track parts delivered to staff members
                    </CardDescription>
                  </div>
                  
                  {/* PRIMARY ACTION - ALWAYS VISIBLE */}
                  {(isAdmin || isStudent) && (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Record Delivery
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Parts Delivery</DialogTitle>
                          <DialogDescription>
                            Record a delivery of parts to a staff member
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit}>
                          <div className="space-y-6">
                            {/* Staff Selection */}
                            <div className="space-y-2">
                              <Label htmlFor="staff-search">Staff Member *</Label>
                              <div className="space-y-2">
                                <Input
                                  id="staff-search"
                                  placeholder="Search staff members..."
                                  value={staffSearchTerm}
                                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                                  onFocus={() => setShowStaffResults(true)}
                                />
                                {showStaffResults && filteredStaff.length > 0 && (
                                  <div className="max-h-32 overflow-y-auto border rounded-md bg-white shadow-sm">
                                    {filteredStaff.map((staff) => (
                                      <div
                                        key={staff.id}
                                        className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-b-0"
                                        onClick={() => handleStaffSelected({
                                          detail: {
                                            staff: staff,
                                            buildingId: staff.buildingId,
                                            costCenterId: staff.costCenterId
                                          }
                                        } as CustomEvent)}
                                      >
                                        <div className="font-medium">{staff.name}</div>
                                        <div className="text-gray-500">
                                          {staff.building?.name} • {staff.costCenter?.name}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {selectedStaff && (
                                  <div className="p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                    <div className="font-medium text-orange-800">{selectedStaff.name}</div>
                                    <div className="text-orange-600">
                                      {selectedStaff.building?.name} • {selectedStaff.costCenter?.name}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Parts Selection */}
                            <div className="space-y-2">
                              <Label>Parts to Deliver</Label>
                              <div className="space-y-2">
                                <Input
                                  placeholder="Search parts by name or part number..."
                                  value={partSearchTerm}
                                  onChange={(e) => setPartSearchTerm(e.target.value)}
                                  onFocus={() => setShowPartResults(true)}
                                />
                                {showPartResults && filteredParts.length > 0 && (
                                  <div className="max-h-32 overflow-y-auto border rounded-md bg-white shadow-sm">
                                    {filteredParts.map((part) => (
                                      <div
                                        key={part.id}
                                        className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-b-0"
                                        onClick={() => handlePartSelected(part)}
                                      >
                                        <div className="font-medium">{part.partId} - {part.name}</div>
                                        <div className="text-gray-500">
                                          Available: {part.quantity} • ${part.unitCost}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Cart Items */}
                              {cartItems.length > 0 && (
                                <div className="space-y-2">
                                  <Label>Selected Parts ({cartItems.length})</Label>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {cartItems.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                        <div className="flex-1">
                                          <div className="font-medium">{item.partNumber} - {item.partName}</div>
                                          <div className="text-gray-500">Qty: {item.quantity} (max: {item.maxQuantity})</div>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeFromCart(index)}
                                          className="ml-2 h-6 w-6 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Delivery Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="delivery-date">Delivery Date *</Label>
                                <Input
                                  id="delivery-date"
                                  type="datetime-local"
                                  value={deliveryDate}
                                  onChange={(e) => setDeliveryDate(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="project-code">Project Code</Label>
                                <Input
                                  id="project-code"
                                  value={projectCode}
                                  onChange={(e) => setProjectCode(e.target.value)}
                                  placeholder="Optional project code"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="notes">Notes</Label>
                              <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional delivery notes"
                                rows={2}
                              />
                            </div>
                          </div>

                          <DialogFooter className="mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreateDialogOpen(false)}
                              disabled={createMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createMutation.isPending || !selectedStaff || cartItems.length === 0}
                            >
                              {createMutation.isPending && (
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {cartItems.length > 0 
                                ? `Deliver ${cartItems.length} ${cartItems.length === 1 ? 'Item' : 'Items'}`
                                : 'Record Delivery'
                              }
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {/* SECONDARY ACTIONS - IMPORT/EXPORT */}
                {(isAdmin || isStudent) && (
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExport}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/api/parts-delivery/export-data', '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/api/parts-delivery/template', '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Import Template
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Import Excel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Building</TableHead>
                        <TableHead>Cost Center</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Delivered By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveries && filteredDeliveries.length > 0 ? (
                        filteredDeliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {delivery.part?.partId} - {delivery.part?.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ${delivery.part?.unitCost}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{delivery.quantity}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{delivery.staffMember?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {delivery.staffMember?.building?.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{delivery.building?.name}</TableCell>
                            <TableCell>{delivery.costCenter?.name}</TableCell>
                            <TableCell>
                              {delivery.deliveredAt 
                                ? new Date(delivery.deliveredAt).toLocaleDateString()
                                : 'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              {delivery.deliveredBy?.name || 'System'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  delivery.status === 'delivered' ? 'default' : 
                                  delivery.status === 'cancelled' ? 'destructive' : 
                                  'secondary'
                                }
                              >
                                {delivery.status || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {(isAdmin || isStudent) && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditDelivery(delivery)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteDelivery(delivery)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                    {delivery.status === 'pending' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleConfirmDelivery(delivery)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            {filteredDeliveries && filteredDeliveries.length === 0 && deliveries && deliveries.length > 0
                              ? "No deliveries found matching your search." 
                              : `No deliveries found. ${(isAdmin || isStudent) ? "Record one to get started." : ""}`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Monthly Summary Sidebar */}
          <Card className="md:w-1/3">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>
                Parts delivered this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Deliveries</span>
                  <span className="text-2xl font-bold">{monthlyCount?.count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Parts Value</span>
                  <span className="text-2xl font-bold">${monthlyTotal?.total || 0}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div className="font-medium mb-2">Recent Deliveries</div>
                {deliveries && deliveries.slice(0, 3).map((delivery) => (
                  <div key={delivery.id} className="pb-2 mb-2 border-b last:border-b-0">
                    <div className="font-medium text-sm">{delivery.part?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {delivery.staffMember?.name} • {delivery.quantity} units
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
