import React, { useState, useEffect, useRef } from "react";
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
  Upload,
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  Loader,
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
import { EmailReceiptViewer } from "@/components/EmailReceiptViewer";
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
  partName?: string;
  partNumber?: string;
  quantity: number;  // We'll ensure this is a number before adding to cart
  maxQuantity?: number;
  isManualPart?: boolean;
  manualPartName?: string;
  manualPartDescription?: string;
  part?: any; // Full part object for display
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
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number | string>(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
  const [buildingSearchTerm, setBuildingSearchTerm] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [showCompletedDeliveries, setShowCompletedDeliveries] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const partDropdownRef = useRef<HTMLDivElement>(null);
  const staffDropdownRef = useRef<HTMLDivElement>(null);
  const buildingDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    partId: 0,
    quantity: 1,
    staffMemberId: 0,
    buildingId: 0,
    costCenterId: 0,
    deliveryDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    isManualPart: false,
    manualPartName: "",
    manualPartDescription: ""
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
  
  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partDropdownRef.current && !partDropdownRef.current.contains(event.target as Node)) {
        setShowPartDropdown(false);
      }
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
        setShowStaffDropdown(false);
      }
      if (buildingDropdownRef.current && !buildingDropdownRef.current.contains(event.target as Node)) {
        setShowBuildingDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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



  // Import deliveries from Excel
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parts-delivery/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      toast({
        title: "Import successful",
        description: `Successfully imported ${result.count || 0} deliveries`,
      });

      // Refresh the deliveries data
      await queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      
      // Clear the file input
      event.target.value = '';
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
          quantity: item.quantity,
          // Include manual part data if this is a manual part
          ...(item.isManualPart && {
            isManualPart: true,
            manualPartName: item.manualPartName,
            manualPartDescription: item.manualPartDescription
          })
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
      // Traditional single item delivery or manual part
      
      // Validate required fields - check for either regular part or manual part
      const hasValidPart = formData.partId || (formData.isManualPart && formData.manualPartName.trim());
      
      if (!hasValidPart || !formData.quantity || !formData.staffMemberId || !formData.deliveryDate) {
        toast({
          title: "Validation Error",
          description: "Part (or manual item name), Quantity, Staff Member, and Delivery Date are required fields",
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
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Only include manual part fields if this is a manual part
        ...(formData.isManualPart && {
          manualPartName: formData.manualPartName.trim(),
          manualPartDescription: formData.manualPartDescription.trim()
        })
      };
      
      createMutation.mutate(submissionData);
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
      notes: "",
      isManualPart: false,
      manualPartName: "",
      manualPartDescription: ""
    });
    setStaffSearchTerm("");
    setPartSearchTerm("");
    setSelectedPartId(null);
  };
  
  // Handle adding a part to the cart
  const handleAddToCart = () => {
    // Make sure selectedQuantity is a number and valid
    const numQuantity = typeof selectedQuantity === 'string' 
      ? parseInt(selectedQuantity) 
      : selectedQuantity;
      
    // Check for valid part selection (either regular part or manual part)
    const hasValidPart = selectedPartId || (formData.isManualPart && formData.manualPartName.trim());
    
    if (!hasValidPart || !numQuantity || numQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a part (or enter manual item name) and valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    // Handle manual parts
    if (formData.isManualPart && formData.manualPartName) {
      // Check for duplicate manual parts in cart
      const existingCartItem = cartItems.find(item => 
        item.isManualPart && item.manualPartName === formData.manualPartName.trim()
      );
      if (existingCartItem) {
        toast({
          title: "Error",
          description: "This manual item is already in the cart",
          variant: "destructive",
        });
        return;
      }
      
      // Add manual part to cart
      const cartItem: CartItem = {
        partId: 0, // Will be handled by server
        quantity: numQuantity,
        isManualPart: true,
        manualPartName: formData.manualPartName.trim(),
        manualPartDescription: formData.manualPartDescription.trim(),
        partName: formData.manualPartName.trim(),
        partNumber: `MANUAL_${formData.manualPartName.trim()}`,
        maxQuantity: 999999
      };
      
      setCartItems(prev => [...prev, cartItem]);
      
      toast({
        title: "Manual item added",
        description: `Added manual item "${formData.manualPartName}" to cart`,
      });
      
      // Reset manual part fields
      setFormData(prev => ({
        ...prev,
        isManualPart: false,
        manualPartName: "",
        manualPartDescription: ""
      }));
      setSelectedQuantity(1);
      setPartSearchTerm("");
      
      return;
    }
    
    // Handle regular parts
    if (!selectedPartId) {
      toast({
        title: "Error",
        description: "Please select a part",
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
    const existingCartItem = cartItems.find(item => item.partId === selectedPartId && !item.isManualPart);
    if (existingCartItem) {
      // Update existing cart item
      setCartItems(prev =>
        prev.map(item =>
          item.partId === selectedPartId && !item.isManualPart
            ? { 
                ...item, 
                quantity: Math.min(item.quantity + numQuantity, item.maxQuantity || selectedPart.quantity)
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
      setCartItems(prev => [
        ...prev,
        {
          partId: selectedPartId,
          partName: selectedPart.name,
          partNumber: selectedPart.partId,
          quantity: numQuantity,
          maxQuantity: selectedPart.quantity,
          isManualPart: false
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

  // Filter parts by search term
  const filteredParts = React.useMemo(() => {
    if (!parts) return [];
    if (!partSearchTerm || !partSearchTerm.trim()) return parts;
    
    try {
      const searchLower = partSearchTerm.toLowerCase();
      return parts.filter(part => 
        (part.name && part.name.toLowerCase().includes(searchLower)) || 
        (part.partId && part.partId.toLowerCase().includes(searchLower))
      );
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

  // Filter buildings by search term
  const filteredBuildings = React.useMemo(() => {
    if (!buildings) return [];
    if (!buildingSearchTerm || !buildingSearchTerm.trim()) return buildings;
    
    try {
      const searchLower = buildingSearchTerm.toLowerCase();
      return buildings.filter(building => 
        building.name && building.name.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error("Error filtering buildings:", error);
      return buildings;
    }
  }, [buildings, buildingSearchTerm]);

  // Filter deliveries by search term, status, and selected date
  const filteredDeliveries = React.useMemo(() => {
    if (!deliveries) return [];
    
    return deliveries.filter(delivery => {
      // Filter by status - show pending OR completed based on toggle
      const statusMatch = showCompletedDeliveries ? 
        (delivery.status === 'delivered' || delivery.confirmedAt) : // Show completed
        (delivery.status !== 'delivered' && !delivery.confirmedAt); // Show pending
      
      if (!statusMatch) return false;
      
      // Filter by selected calendar date if one is chosen
      if (selectedCalendarDate) {
        const deliveryDate = new Date(delivery.deliveredAt);
        const selectedDateStart = new Date(selectedCalendarDate);
        selectedDateStart.setHours(0, 0, 0, 0);
        const selectedDateEnd = new Date(selectedCalendarDate);
        selectedDateEnd.setHours(23, 59, 59, 999);
        
        if (deliveryDate < selectedDateStart || deliveryDate > selectedDateEnd) {
          return false;
        }
      }
      
      // Second filter: Apply search term if provided
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
      
      // Safely check notes
      const notesMatch = delivery.notes && 
        delivery.notes.toLowerCase().includes(searchLower);
      
      return partMatch || staffMatch || buildingMatch || costCenterMatch || dateMatch || notesMatch;
    });
  }, [deliveries, searchTerm, showCompletedDeliveries, selectedCalendarDate]);


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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Parts Deliveries</CardTitle>
                <CardDescription>
                  {showCompletedDeliveries ? "Showing completed deliveries" : "Showing pending deliveries"}
                  {selectedCalendarDate && ` for ${format(selectedCalendarDate, "MMM dd, yyyy")}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {(isAdmin || isStudent) && (
                  <>
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
                      asChild
                    >
                      <label htmlFor="delivery-import" style={{ cursor: 'pointer' }}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                      </label>
                    </Button>
                    <input
                      id="delivery-import"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImport}
                      style={{ display: 'none' }}
                    />

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Record Delivery
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Record Parts Delivery</DialogTitle>
                          <DialogDescription>
                            Record a delivery of parts to a staff member
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="part" className="text-right">
                                Part <span className="text-red-500">*</span>
                              </Label>
                              <div className="col-span-3 space-y-2 relative" ref={partDropdownRef}>
                                <div className="flex relative">
                                  <Input
                                    placeholder="Type to search parts by name or part number..." 
                                    className="pr-8"
                                    value={partSearchTerm}
                                    onChange={(e) => {
                                      setPartSearchTerm(e.target.value);
                                      setShowPartDropdown(e.target.value.length > 0);
                                    }}
                                    onFocus={() => {
                                      if (partSearchTerm.length > 0) {
                                        setShowPartDropdown(true);
                                      }
                                    }}
                                  />
                                  {partSearchTerm && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute right-0 top-0 h-full z-10"
                                      onClick={() => {
                                        setPartSearchTerm("");
                                        setSelectedPartId(null);
                                        setShowPartDropdown(false);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Auto-suggestion dropdown */}
                                {showPartDropdown && partSearchTerm && filteredParts.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                    {filteredParts.slice(0, 10).map(part => (
                                      <div
                                        key={part.id}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        onClick={() => {
                                          setSelectedPartId(part.id);
                                          setPartSearchTerm(`${part.name} - ${part.partId}`);
                                          setShowPartDropdown(false);
                                        }}
                                      >
                                        <div className="font-medium text-sm">{part.name}</div>
                                        <div className="text-xs text-gray-500">
                                          {part.partId} • {part.quantity} in stock
                                        </div>
                                      </div>
                                    ))}
                                    {filteredParts.length > 10 && (
                                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                        Showing first 10 results. Type more to narrow down.
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {showPartDropdown && partSearchTerm && filteredParts.length === 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                      No parts found matching "{partSearchTerm}"
                                    </div>
                                    <div className="border-t border-gray-200">
                                      <button
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            isManualPart: true,
                                            manualPartName: partSearchTerm
                                          }));
                                          setShowPartDropdown(false);
                                        }}
                                      >
                                        + Create manual item: "{partSearchTerm}"
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Selected part display */}
                                {selectedPartId && !showPartDropdown && !formData.isManualPart && (
                                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {parts?.find(p => p.id === selectedPartId)?.name}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {parts?.find(p => p.id === selectedPartId)?.partId} • 
                                        {parts?.find(p => p.id === selectedPartId)?.quantity} in stock
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPartId(null);
                                        setPartSearchTerm("");
                                        setShowPartDropdown(false);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                                
                                {/* Manual part display */}
                                {formData.isManualPart && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-md p-2">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          Manual Item: {formData.manualPartName}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          Custom/non-inventory item
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            isManualPart: false,
                                            manualPartName: "",
                                            manualPartDescription: ""
                                          }));
                                          setPartSearchTerm("");
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Optional description for this manual item..."
                                      value={formData.manualPartDescription}
                                      onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        manualPartDescription: e.target.value
                                      }))}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="quantity" className="text-right">
                                Quantity <span className="text-red-500">*</span>
                              </Label>
                              <div className="col-span-3 flex space-x-2">
                                <input
                                  id="quantity"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min="1"
                                  value={selectedQuantity}
                                  onChange={(e) => {
                                    // Allow empty state
                                    if (e.target.value === '') {
                                      setSelectedQuantity('');
                                    } else {
                                      // Only update if it's a valid number
                                      const val = parseInt(e.target.value);
                                      if (!isNaN(val)) {
                                        setSelectedQuantity(val);
                                      }
                                    }
                                  }}
                                  // When the field loses focus, ensure we have a valid value
                                  onBlur={() => {
                                    if (selectedQuantity === '' || Number(selectedQuantity) < 1) {
                                      setSelectedQuantity(1);
                                    }
                                  }}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                                  required
                                />
                                <Button 
                                  type="button"
                                  onClick={handleAddToCart}
                                  disabled={(!selectedPartId && !formData.isManualPart) || Number(selectedQuantity) <= 0}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add to Cart
                                </Button>
                              </div>
                            </div>
                            
                            {/* Cart Items */}
                            {cartItems.length > 0 && (
                              <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">
                                  Cart Items
                                </Label>
                                <div className="col-span-3 border rounded-md p-3 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="text-sm font-medium">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart</div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCartItems([])}
                                    >
                                      Clear All
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {cartItems.map((item, index) => (
                                      <div 
                                        key={item.isManualPart ? `manual_${item.manualPartName}_${index}` : item.partId} 
                                        className="flex items-center justify-between border-b pb-2"
                                      >
                                        <div>
                                          <div className="font-medium">
                                            {item.isManualPart ? (
                                              <span className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-orange-600 border-orange-200">Manual</Badge>
                                                {item.manualPartName}
                                              </span>
                                            ) : (
                                              item.partName
                                            )}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {item.isManualPart ? (
                                              <span>
                                                {item.manualPartDescription && `${item.manualPartDescription} - `}Qty: {item.quantity}
                                              </span>
                                            ) : (
                                              <span>{item.partNumber} - Qty: {item.quantity}</span>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (item.isManualPart) {
                                              // For manual parts, remove by index since partId is 0
                                              setCartItems(prev => prev.filter((_, i) => i !== index));
                                            } else {
                                              handleRemoveFromCart(item.partId);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="staff" className="text-right">
                                Staff Member <span className="text-red-500">*</span>
                              </Label>
                              <div className="col-span-3 space-y-2 relative" ref={staffDropdownRef}>
                                <div className="flex relative">
                                  <Input
                                    placeholder="Type to search staff members..." 
                                    className="pr-8"
                                    value={staffSearchTerm}
                                    onChange={(e) => {
                                      setStaffSearchTerm(e.target.value);
                                      setShowStaffDropdown(e.target.value.length > 0);
                                    }}
                                    onFocus={() => {
                                      if (staffSearchTerm.length > 0) {
                                        setShowStaffDropdown(true);
                                      }
                                    }}
                                  />
                                  {staffSearchTerm && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute right-0 top-0 h-full z-10"
                                      onClick={() => {
                                        setStaffSearchTerm("");
                                        setSelectedStaffId(null);
                                        setShowStaffDropdown(false);
                                        setFormData({...formData, staffMemberId: 0, buildingId: 0, costCenterId: 0});
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Auto-suggestion dropdown */}
                                {showStaffDropdown && staffSearchTerm && filteredStaffMembers.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                    {filteredStaffMembers.slice(0, 10).map(staff => (
                                      <div
                                        key={staff.id}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        onClick={() => {
                                          setSelectedStaffId(staff.id);
                                          setStaffSearchTerm(`${staff.name}`);
                                          setShowStaffDropdown(false);
                                          setFormData({
                                            ...formData, 
                                            staffMemberId: staff.id,
                                            buildingId: staff.buildingId || 0,
                                            costCenterId: staff.costCenterId || 0
                                          });
                                        }}
                                      >
                                        <div className="font-medium text-sm">{staff.name}</div>
                                        <div className="text-xs text-gray-500">
                                          {staff.building?.name || 'No building'} • {staff.costCenter?.code || 'No cost center'}
                                        </div>
                                      </div>
                                    ))}
                                    {filteredStaffMembers.length > 10 && (
                                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                        Showing first 10 results. Type more to narrow down.
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {showStaffDropdown && staffSearchTerm && filteredStaffMembers.length === 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                      No staff members found matching "{staffSearchTerm}"
                                    </div>
                                  </div>
                                )}
                                
                                {/* Selected staff display */}
                                {selectedStaffId && !showStaffDropdown && (
                                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {staffMembers?.find(s => s.id === selectedStaffId)?.name}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {staffMembers?.find(s => s.id === selectedStaffId)?.building?.name || 'No building'} • 
                                        {staffMembers?.find(s => s.id === selectedStaffId)?.costCenter?.code || 'No cost center'}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedStaffId(null);
                                        setStaffSearchTerm("");
                                        setShowStaffDropdown(false);
                                        setFormData({...formData, staffMemberId: 0, buildingId: 0, costCenterId: 0});
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="delivery-date" className="text-right">
                                Delivery Date <span className="text-red-500">*</span>
                              </Label>
                              <div className="col-span-3">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {formData.deliveryDate 
                                        ? formatDate(formData.deliveryDate)
                                        : <span>Pick a date</span>}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={selectedDate}
                                      onSelect={(date) => {
                                        setSelectedDate(date);
                                        if (date) {
                                          setFormData({
                                            ...formData, 
                                            deliveryDate: format(date, "yyyy-MM-dd")
                                          });
                                        }
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="building" className="text-right">
                                Building
                              </Label>
                              <div className="col-span-3 space-y-2 relative" ref={buildingDropdownRef}>
                                <div className="flex relative">
                                  <Input
                                    placeholder="Type to search buildings..." 
                                    className="pr-8"
                                    value={buildingSearchTerm}
                                    onChange={(e) => {
                                      setBuildingSearchTerm(e.target.value);
                                      setShowBuildingDropdown(e.target.value.length > 0);
                                    }}
                                    onFocus={() => {
                                      if (buildingSearchTerm.length > 0) {
                                        setShowBuildingDropdown(true);
                                      }
                                    }}
                                  />
                                  {buildingSearchTerm && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute right-0 top-0 h-full z-10"
                                      onClick={() => {
                                        setBuildingSearchTerm("");
                                        setSelectedBuildingId(null);
                                        setShowBuildingDropdown(false);
                                        setFormData({...formData, buildingId: 0, costCenterId: 0});
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Auto-suggestion dropdown */}
                                {showBuildingDropdown && buildingSearchTerm && filteredBuildings.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                    {filteredBuildings.slice(0, 10).map(building => (
                                      <div
                                        key={building.id}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        onClick={() => {
                                          setSelectedBuildingId(building.id);
                                          setBuildingSearchTerm(building.name);
                                          setShowBuildingDropdown(false);
                                          
                                          // Auto-match cost center logic
                                          let matchingCostCenterId = 0;
                                          if (costCenters) {
                                            const matchingCostCenter = costCenters.find(cc => 
                                              cc.name.toLowerCase().includes(building.name.toLowerCase())
                                            );
                                            if (matchingCostCenter) {
                                              matchingCostCenterId = matchingCostCenter.id;
                                            }
                                          }
                                          
                                          setFormData({
                                            ...formData, 
                                            buildingId: building.id,
                                            costCenterId: matchingCostCenterId || formData.costCenterId
                                          });
                                        }}
                                      >
                                        <div className="font-medium text-sm">{building.name}</div>
                                      </div>
                                    ))}
                                    {filteredBuildings.length > 10 && (
                                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                        Showing first 10 results. Type more to narrow down.
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {showBuildingDropdown && buildingSearchTerm && filteredBuildings.length === 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                      No buildings found matching "{buildingSearchTerm}"
                                    </div>
                                  </div>
                                )}
                                
                                {/* Selected building display */}
                                {selectedBuildingId && !showBuildingDropdown && (
                                  <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-md p-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {buildings?.find(b => b.id === selectedBuildingId)?.name}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedBuildingId(null);
                                        setBuildingSearchTerm("");
                                        setShowBuildingDropdown(false);
                                        setFormData({...formData, buildingId: 0, costCenterId: 0});
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="costCenter" className="text-right">
                                Cost Center
                              </Label>
                              <div className="col-span-3">
                                <Select
                                  value={formData.costCenterId > 0 ? formData.costCenterId.toString() : ""}
                                  onValueChange={(value) => setFormData({
                                    ...formData,
                                    costCenterId: parseInt(value)
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a cost center (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">None</SelectItem>
                                    {costCenters?.sort((a, b) => a.code.localeCompare(b.code)).map(center => (
                                      <SelectItem key={center.id} value={center.id.toString()}>
                                        {center.code} - {center.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="notes" className="text-right">
                                Notes
                              </Label>
                              <Input
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                resetForm();
                                setCartItems([]);
                                setIsCreateDialogOpen(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createMutation.isPending || (cartItems.length === 0 && (!formData.partId || formData.partId <= 0))}
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

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Parts Delivery</DialogTitle>
                          <DialogDescription>
                            Update the delivery information
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-part" className="text-right">
                                Part
                              </Label>
                              <div className="col-span-3">
                                <Input 
                                  id="edit-part" 
                                  value={currentDelivery?.part?.name || 'Unknown Part'} 
                                  disabled 
                                  className="bg-muted text-muted-foreground"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-quantity" className="text-right">
                                Quantity <span className="text-red-500">*</span>
                              </Label>
                              <input
                                id="edit-quantity"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min="1"
                                value={editFormData.quantity}
                                onChange={(e) => {
                                  // Allow empty state
                                  if (e.target.value === '') {
                                    setEditFormData({...editFormData, quantity: ''});
                                  } else {
                                    // Only update if it's a valid number
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      setEditFormData({...editFormData, quantity: val});
                                    }
                                  }
                                }}
                                // When the field loses focus, ensure we have a valid value
                                onBlur={() => {
                                  if (editFormData.quantity === '' || Number(editFormData.quantity) < 1) {
                                    setEditFormData({...editFormData, quantity: 1});
                                  }
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-delivery-date" className="text-right">
                                Delivery Date <span className="text-red-500">*</span>
                              </Label>
                              <div className="col-span-3">
                                <input
                                  id="edit-delivery-date"
                                  type="date"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  value={format(editFormData.deliveredAt, "yyyy-MM-dd")}
                                  onChange={(e) => {
                                    // Create a proper date object from the date input
                                    // The date input returns a string like '2025-04-30'
                                    if (e.target.value) {
                                      const [year, month, day] = e.target.value.split('-').map(Number);
                                      // Create a date with correct timezone (using noon to avoid timezone issues)
                                      const newDate = new Date(year, month - 1, day, 12, 0, 0);
                                      console.log("Selected date:", e.target.value, "Parsed date:", newDate);
                                      setEditFormData({
                                        ...editFormData, 
                                        deliveredAt: newDate
                                      });
                                    }
                                  }}
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-staff" className="text-right">
                                Staff Member
                              </Label>
                              <div className="col-span-3">
                                <Input 
                                  id="edit-staff" 
                                  value={currentDelivery?.staffMember?.name || 'Unknown Staff Member'} 
                                  disabled 
                                  className="bg-muted text-muted-foreground"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-building" className="text-right">
                                Building
                              </Label>
                              <div className="col-span-3">
                                <Select
                                  value={editFormData.buildingId > 0 ? editFormData.buildingId.toString() : ""}
                                  onValueChange={(value) => {
                                    const buildingId = parseInt(value);
                                    // Find the selected building
                                    const selectedBuilding = buildings?.find(b => b.id === buildingId);
                                    
                                    // Look for a cost center that includes the building name
                                    let matchingCostCenterId = 0;
                                    if (selectedBuilding && costCenters) {
                                      const buildingName = selectedBuilding.name;
                                      // Find a cost center with the building name in it
                                      const matchingCostCenter = costCenters.find(cc => 
                                        cc.name.toLowerCase().includes(buildingName.toLowerCase())
                                      );
                                      
                                      if (matchingCostCenter) {
                                        matchingCostCenterId = matchingCostCenter.id;
                                      }
                                    }
                                    
                                    // Update the form data with the building ID and matching cost center ID
                                    setEditFormData({
                                      ...editFormData,
                                      buildingId: buildingId,
                                      costCenterId: matchingCostCenterId || editFormData.costCenterId
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a building (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">None</SelectItem>
                                    {buildings?.sort((a, b) => a.name.localeCompare(b.name)).map(building => (
                                      <SelectItem key={building.id} value={building.id.toString()}>
                                        {building.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-cost-center" className="text-right">
                                Cost Center
                              </Label>
                              <div className="col-span-3">
                                <Select
                                  value={editFormData.costCenterId > 0 ? editFormData.costCenterId.toString() : ""}
                                  onValueChange={(value) => setEditFormData({
                                    ...editFormData,
                                    costCenterId: parseInt(value)
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a cost center (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">None</SelectItem>
                                    {costCenters?.sort((a, b) => a.code.localeCompare(b.code)).map(center => (
                                      <SelectItem key={center.id} value={center.id.toString()}>
                                        {center.code} - {center.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-notes" className="text-right">
                                Notes
                              </Label>
                              <Input
                                id="edit-notes"
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsEditDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={editMutation.isPending}
                            >
                              {editMutation.isPending ? "Updating..." : "Update Delivery"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this delivery record? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        {currentDelivery && (
                          <div className="py-4 border-t border-b my-4">
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">Part:</span> {currentDelivery.part?.name || 'Unknown Part'}
                              </div>
                              <div>
                                <span className="font-medium">Quantity:</span> {currentDelivery.quantity}
                              </div>
                              <div>
                                <span className="font-medium">Staff Member:</span> {currentDelivery.staffMember?.name || 'Unknown Staff Member'}
                              </div>
                              <div>
                                <span className="font-medium">Date:</span> {currentDelivery.deliveredAt ? format(new Date(currentDelivery.deliveredAt), "MMM dd, yyyy") : 'Unknown Date'}
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsDeleteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={confirmDelete}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Delivery"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Signature Confirmation Dialog */}
                    <SignatureConfirmationDialog
                      open={isConfirmDialogOpen}
                      onOpenChange={setIsConfirmDialogOpen}
                      deliveryId={currentDelivery?.id || 0}
                      staffName={currentDelivery?.staffMember?.name || "Unknown Staff Member"}
                      partName={currentDelivery?.part?.name || "Unknown Part"}
                      quantity={currentDelivery?.quantity || 0}
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
                        setCurrentDelivery(null);
                      }}
                    />
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mb-6">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search deliveries..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Show:</label>
                    <Button 
                      variant={showCompletedDeliveries ? "outline" : "default"} 
                      size="sm"
                      onClick={() => setShowCompletedDeliveries(false)}
                    >
                      Pending
                    </Button>
                    <Button 
                      variant={showCompletedDeliveries ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setShowCompletedDeliveries(true)}
                    >
                      Completed
                    </Button>
                  </div>
                  
                  {selectedCalendarDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Filtered by: {format(selectedCalendarDate, "MMM dd, yyyy")}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedCalendarDate(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Delivered By</TableHead>
                    <TableHead>Status</TableHead>
                    {(isAdmin || isStudent) && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries && filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery: any) => (
                      <TableRow key={delivery.id}>
                            <TableCell className="font-medium">
                              {delivery.part ? 
                                delivery.part.name || 'Unknown Part' : 
                                'Unknown Part'}
                            </TableCell>
                            <TableCell>
                              {delivery.quantity}
                            </TableCell>
                            <TableCell>
                              {delivery.staffMember?.name || `Unknown Staff Member (ID: ${delivery.staffMemberId})`}
                            </TableCell>
                            <TableCell>
                              {delivery.building?.name || 
                               (delivery.staffMember?.building?.name) || 
                               'N/A'}
                            </TableCell>
                            <TableCell>
                              {delivery.costCenter ? 
                                `${delivery.costCenter.code || ''} - ${delivery.costCenter.name || ''}` : 
                                delivery.staffMember?.costCenter ? 
                                `${delivery.staffMember.costCenter.code || ''} - ${delivery.staffMember.costCenter.name || ''}` : 
                                'N/A'}
                            </TableCell>
                            <TableCell>
                              {delivery.deliveredAt ? 
                                format(new Date(delivery.deliveredAt), "MMM dd, yyyy") : 
                                'N/A'}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              {delivery.notes ? (
                                <div className="truncate" title={delivery.notes}>
                                  {delivery.notes}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{delivery.deliveredBy?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              {delivery.status === 'delivered' ? (
                                <div className="flex items-center text-green-600">
                                  <Check className="w-4 h-4 mr-1" />
                                  <span>Delivered</span>
                                  {delivery.confirmedAt && (
                                    <span className="ml-1 text-xs text-muted-foreground">
                                      ({format(new Date(delivery.confirmedAt), "MMM dd")})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center text-amber-600">
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span>Pending</span>
                                </div>
                              )}
                            </TableCell>
                            {(isAdmin || isStudent) && (
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {delivery.status !== 'delivered' && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-green-600"
                                      onClick={() => handleConfirmDelivery(delivery)}
                                      title="Confirm delivery"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {delivery.status === 'delivered' && (
                                    <EmailReceiptViewer 
                                      deliveryId={delivery.id.toString()} 
                                      staffName={delivery.staffMember?.name}
                                    />
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleEditDelivery(delivery)}
                                    title="Edit delivery"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteDelivery(delivery)}
                                    title="Delete delivery"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={(isAdmin || isStudent) ? 9 : 8} className="text-center">
                        {searchTerm 
                          ? "No deliveries found matching your search." 
                          : `No deliveries found. ${(isAdmin || isStudent) ? "Record one to get started." : ""}`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="md:w-1/3">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Parts deliveries this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-medium">Total Deliveries</div>
                  <div className="text-2xl font-bold">{monthlyCount?.count || 0}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-medium">Total Parts Value</div>
                  <div className="text-2xl font-bold">
                    ${monthlyTotal?.total ? Number(monthlyTotal.total).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div className="flex justify-center my-4">
                  <div className="inline-flex text-primary border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md">
                    <button
                      className="p-2"
                      onClick={() => {
                        const newMonth = new Date(month);
                        newMonth.setMonth(newMonth.getMonth() - 1);
                        setMonth(newMonth);
                      }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center px-3 py-2 font-medium">
                      {format(month, "MMMM yyyy")}
                    </div>
                    <button
                      className="p-2"
                      onClick={() => {
                        const newMonth = new Date(month);
                        newMonth.setMonth(newMonth.getMonth() + 1);
                        setMonth(newMonth);
                      }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {/* Calendar cells would be rendered here based on the month */}
                    {/* This is a placeholder implementation */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = new Date(month.getFullYear(), month.getMonth(), i - (new Date(month.getFullYear(), month.getMonth(), 1).getDay()) + 1);
                      const isCurrentMonth = isSameMonth(date, month);
                      
                      // Count deliveries on this date
                      const deliveriesOnDate = deliveries?.filter(d => {
                        try {
                          if (!d.deliveredAt) return false;
                          const deliveryDate = new Date(d.deliveredAt);
                          return (
                            deliveryDate.getDate() === date.getDate() && 
                            deliveryDate.getMonth() === date.getMonth() && 
                            deliveryDate.getFullYear() === date.getFullYear()
                          );
                        } catch (e) {
                          return false;
                        }
                      })?.length || 0;
                      
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-md text-xs h-9 relative",
                            !isCurrentMonth && "opacity-50 pointer-events-none",
                            isToday(date) && "bg-primary/10",
                            isCurrentMonth && "hover:bg-accent cursor-pointer",
                            !isCurrentMonth && "invisible",
                            selectedCalendarDate && 
                            selectedCalendarDate.getTime() === date.getTime() && 
                            "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                          onClick={() => {
                            if (isCurrentMonth) {
                              if (selectedCalendarDate && selectedCalendarDate.getTime() === date.getTime()) {
                                // If clicking the same date, clear the filter
                                setSelectedCalendarDate(null);
                              } else {
                                // Set the selected date for filtering
                                setSelectedCalendarDate(date);
                              }
                            }
                          }}
                        >
                          <span>{date.getDate()}</span>
                          {deliveriesOnDate > 0 && (
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Recent Deliveries</h3>
                  <div className="space-y-2">
                    {deliveries?.slice(0, 5).map((delivery) => (
                      <div key={delivery.id} className="border rounded-md p-2 text-sm">
                        <div className="font-medium">{delivery.part?.name || 'Unknown Part'}</div>
                        <div className="text-muted-foreground">
                          {delivery.quantity} item(s) to {delivery.staffMember?.name || `Unknown Staff Member (ID: ${delivery.staffMemberId})`} 
                          on {delivery.deliveredAt ? 
                              format(new Date(delivery.deliveredAt), "MMM dd, yyyy") : 
                              'Unknown Date'}
                        </div>
                      </div>
                    ))}
                    {(!deliveries || deliveries.length === 0) && (
                      <div className="text-center text-muted-foreground">
                        No recent deliveries
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}