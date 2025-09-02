import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Part, PartsIssuanceWithDetails, User, Building } from "@shared/schema";
import { 
  Search, ScanBarcode, Plus, Trash, ShoppingCart, ChevronLeft, Bell, 
  Download, Edit, Calendar as CalendarIcon, X, ChevronRight, Loader2,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/lib/websocket";
import { format, isToday, isSameMonth, isValid, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SimpleBarcodeScanner } from "@/components/barcode/SimpleBarcodeScanner";
import { z } from "zod";
import { BearTooltip, HelpIcon } from "@/components/ui/bear-tooltip";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Schema for bulk charge-out shared fields
const bulkIssuanceSchema = z.object({
  building: z.string().min(1, "Building is required"),
  issuedTo: z.string().min(1, "Charged To is required"),
  issuedAt: z.date({
    required_error: "Date is required",
  }),
  costCenter: z.string().optional(),
  notes: z.string().optional(),
});

type BulkIssuanceFormValues = z.infer<typeof bulkIssuanceSchema>;

// Type for cart items
type CartItem = {
  partId: number;
  partName: string;
  partNumber: string;
  quantity: number;
  maxQuantity: number;
};

// Type for WebSocket notifications
type WebSocketNotification = {
  id: string;
  type: 'parts-issuance-created' | 'parts-pickup-created' | 'parts-pickup-completed';
  message: string;
  timestamp: string;
}

export default function PartsIssuance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isTechnician = user?.role === 'technician';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParts, setSearchParts] = useState("");
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<{ isUploading: boolean; message: string; }>({
    isUploading: false,
    message: ""
  });
  
  // Month selection for filtering charge-outs
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Edit charge-out state
  const [editingChargeOut, setEditingChargeOut] = useState<PartsIssuanceWithDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Format month parameter for API requests (MM/YYYY)
  const monthParam = selectedMonth 
    ? `${selectedMonth.getMonth() + 1}/${selectedMonth.getFullYear()}` 
    : `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
  
  // Query for existing charge-outs by month
  const { 
    data: chargeOuts = [], 
    isLoading: isLoadingChargeOuts,
    error: chargeOutsError 
  } = useQuery<PartsIssuanceWithDetails[]>({
    queryKey: ['/api/parts-issuance/recent', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-issuance/recent?month=${monthParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch charge-outs');
      }
      const data = await response.json();
      console.log("Charge-outs data from server:", data);
      return data;
    },
    retry: 1
  });
  
  // Query for monthly charge-out total
  const { data: monthlyTotal } = useQuery<{ total: number }>({
    queryKey: ['/api/parts-issuance/recent/count', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-issuance/recent/count?month=${monthParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monthly total');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Function to delete a charge-out entry
  const deleteChargeOut = async (id: number) => {
    if (!confirm("Are you sure you want to delete this charge-out? This will return the parts to inventory.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/parts-issuance/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete charge-out: ${response.status} ${response.statusText}`);
      }
      
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent', monthParam] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent/count', monthParam] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      
      toast({
        title: "Charge-out deleted",
        description: "The charge-out has been removed and parts returned to inventory",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "There was an error deleting the charge-out",
      });
      console.error(error);
    }
  };
  
  // Function to edit a charge-out entry
  const editChargeOut = (id: number) => {
    const chargeOut = chargeOuts.find(c => c.id === id);
    if (chargeOut) {
      setEditingChargeOut(chargeOut);
      
      console.log("Editing charge-out:", chargeOut);
      console.log("Building value:", chargeOut.buildingId);
      console.log("Cost center value:", chargeOut.costCenterCode);
      
      // CRITICAL FIX: Ensure we properly handle the date for edit forms
      // Parse the date string from the issuedAt field to ensure it's a valid Date object
      let issuedAtDate: Date;
      
      if (chargeOut.issuedAt) {
        try {
          // Ensure we're dealing with a proper Date object by explicitly creating one
          issuedAtDate = new Date(chargeOut.issuedAt);
          
          // Verify this is a valid date by checking if it returns NaN when converted to a number
          if (isNaN(issuedAtDate.getTime())) {
            console.warn("Invalid date from server, using current date as fallback:", chargeOut.issuedAt);
            issuedAtDate = new Date();
          } else {
            console.log("Successfully parsed date:", issuedAtDate.toISOString());
          }
        } catch (error) {
          console.error("Error parsing date:", error);
          issuedAtDate = new Date();
        }
      } else {
        issuedAtDate = new Date();
      }
      
      // Set values in the edit form - with fixed date handling
      // IMPORTANT: Use the building ID, not the building name or project code
      const formValues = {
        building: chargeOut.buildingId ? chargeOut.buildingId.toString() : '',
        issuedTo: typeof chargeOut.issuedTo === 'string' ? chargeOut.issuedTo : '',
        issuedAt: issuedAtDate,
        costCenter: chargeOut.costCenterCode || 'none',
        notes: chargeOut.notes || '',
        quantity: chargeOut.quantity
      };
      
      console.log("Form values being set:", formValues);
      
      // Use reset to update all form values at once
      editForm.reset(formValues);
      
      setIsEditModalOpen(true);
    }
  };
  
  // Edit form for charge-outs
  const editForm = useForm<BulkIssuanceFormValues & { quantity: number }>({
    resolver: zodResolver(bulkIssuanceSchema.extend({
      quantity: z.number().min(1, "Quantity must be at least 1")
    })),
    defaultValues: {
      building: "",
      issuedTo: user?.name || "",
      // No default date - will be set when editing an existing charge-out
      issuedAt: undefined as unknown as Date,
      costCenter: "none",
      notes: "",
      quantity: 1
    }
  });
  
  // Mutation for updating a charge-out
  const updateChargeOutMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!editingChargeOut) {
        throw new Error("No charge-out selected for editing");
      }
      
      // Convert date object to ISO string for API compatibility
      const payload = {
        building: data.building,
        issuedTo: data.issuedTo,
        quantity: data.quantity,
        notes: data.notes,
        costCenter: data.costCenter,
        issuedAt: data.issuedAt instanceof Date ? data.issuedAt.toISOString() : data.issuedAt
      };
      
      console.log("Updating charge-out with payload:", payload);
      
      const response = await apiRequest(
        "PATCH", 
        `/api/parts-issuance/${editingChargeOut.id}`, 
        payload
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update charge-out");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Charge-out updated",
        description: "The parts charge-out has been updated successfully.",
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent', monthParam] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent/count', monthParam] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating charge-out",
        description: error.message || "There was an error updating the charge-out",
        variant: "destructive",
      });
    }
  });
  
  // Connect to WebSocket for real-time updates
  const { status: wsStatus, lastMessage } = useWebSocket();
  
  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = lastMessage;
        
        // Handle different message types
        if (data.type === 'parts-issuance-created') {
          // Refresh parts data when someone issues parts
          queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent'] });
          queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent/count', monthParam] });
          
          // Show toast notification if not issued by current user
          if (data.data.issuedBy !== user?.name) {
            toast({
              title: 'New Part Charge-Out',
              description: `${data.data.issuedBy} charged out ${data.data.partName} (${data.data.quantity})`,
              variant: 'default',
            });
          }
        } 
        else if (data.type === 'parts-pickup-created') {
          // Show toast notification for new parts pickup
          toast({
            title: 'New Parts Pickup',
            description: `${data.data.addedBy} added ${data.data.partName} (${data.data.quantity}) for pickup`,
            variant: 'default',
          });
        }
        else if (data.type === 'parts-pickup-completed') {
          // Show toast notification when parts are picked up
          toast({
            title: 'Parts Pickup Completed',
            description: `${data.data.pickedUpBy} received ${data.data.partName}`,
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    }
  }, [lastMessage, queryClient, toast, user?.name]);
  
  // No longer automatically opening dialog for technicians
  // They should navigate here from the dashboard by choice
  
  // Query for parts
  const { data: parts = [] } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
    queryFn: getQueryFn({
      on401: "returnNull",
    }),
  });
  
  // Query for technicians (for dropdown)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/technicians-list"],
    queryFn: getQueryFn({
      on401: "returnNull",
    }),
  });
  
  // Query for buildings (for dropdown)
  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ["/api/buildings"],
    queryFn: getQueryFn({
      on401: "returnNull",
    }),
  });
  
  // Query for cost centers (for dropdown)
  const { data: costCenters = [], isLoading: costCentersLoading, isError: costCentersError } = useQuery<{id: number, code: string, name: string}[]>({
    queryKey: ["/api/cost-centers"],
    queryFn: getQueryFn({
      on401: "returnNull",
    }),
  });
  
  // Debug logging for cost centers
  useEffect(() => {
    console.log("Cost centers data:", costCenters);
    console.log("Cost centers loading:", costCentersLoading);
    console.log("Cost centers error:", costCentersError);
  }, [costCenters, costCentersLoading, costCentersError]);
  
  // Enhanced filter parts with intelligent text matching
  useEffect(() => {
    if (parts && parts.length > 0) {
      if (searchParts.trim() === "") {
        setFilteredParts(parts);
      } else {
        const searchTerms = searchParts.toLowerCase().trim().split(/\s+/);
        
        const filtered = parts.filter(part => {
          const searchableText = [
            part.name || '',
            part.partId || '',
            (part as any).description || '',
            (part as any).category || ''
          ].join(' ').toLowerCase();
          
          // All search terms must be found somewhere in the searchable text
          return searchTerms.every(term => searchableText.includes(term));
        });
        setFilteredParts(filtered);
      }
    } else {
      setFilteredParts([]);
    }
  }, [parts, searchParts]);
  
  // Form for charging out parts (bulk)
  const bulkForm = useForm<BulkIssuanceFormValues>({
    resolver: zodResolver(bulkIssuanceSchema),
    defaultValues: {
      building: "",
      issuedTo: user?.name || "",
      issuedAt: new Date(), // Default to current date
      costCenter: "none",
      notes: "",
    },
  });
  
  // Set form values when data changes
  useEffect(() => {
    if (user?.name) {
      bulkForm.setValue("issuedTo", user.name);
    }
    
    // Set building value once buildings are loaded
    if (buildings && buildings.length > 0) {
      // Use building ID as the value, not the building name
      bulkForm.setValue("building", buildings[0].id.toString());
      // Don't set the building for the edit form, it will be set when editing
    }
  }, [user, buildings, bulkForm, editForm]);
  
  // Mutation for bulk parts charge-out
  const bulkIssueMutation = useMutation({
    mutationFn: async (data: {
      parts: { partId: number; quantity: number }[];
      building: string;
      issuedTo: string;
      reason: "production" | "maintenance" | "replacement" | "testing" | "other";
      notes?: string;
      costCenter?: string;
    }) => {
      const response = await apiRequest("POST", "/api/parts-issuance/bulk", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${cartItems.length} part${cartItems.length !== 1 ? 's' : ''} charged out successfully`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/parts-issuance/recent"] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent/count', monthParam] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setIsModalOpen(false);
      bulkForm.reset();
      setCartItems([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to charge out parts",
        variant: "destructive",
      });
    },
  });

  // Import mutation for uploading Excel files
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/parts-issuance/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: data.message || "Charge-outs imported successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/parts-issuance/recent"] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-issuance/recent/count', monthParam] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      
      setShowImportDialog(false);
      setSelectedFile(null);
      setImportProgress({ isUploading: false, message: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import charge-outs",
        variant: "destructive",
      });
      setImportProgress({ isUploading: false, message: "" });
    },
  });

  const handleFileImport = () => {
    if (!selectedFile) {
      toast({
        title: "Error", 
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setImportProgress({ isUploading: true, message: "Uploading and processing file..." });
    importMutation.mutate(selectedFile);
  };
  
  const handleAddToCart = () => {
    if (!selectedPartId || selectedQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a part and valid quantity",
        variant: "destructive",
      });
      return;
    }

    // Find the part in the parts list
    const part = parts?.find(p => p.id === selectedPartId);
    if (!part) {
      toast({
        title: "Error",
        description: "Part not found",
        variant: "destructive",
      });
      return;
    }

    // Validate quantity
    if (selectedQuantity > part.quantity) {
      toast({
        title: "Error",
        description: `Only ${part.quantity} available in inventory`,
        variant: "destructive",
      });
      return;
    }
    
    // IMPORTANT: Capture current form values before modifying the cart
    // This ensures we don't lose building, cost center, and date info
    const currentFormValues = bulkForm.getValues();

    // Check if part is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.partId === selectedPartId);
    
    if (existingItemIndex !== -1) {
      // Update quantity if already in cart
      const newCart = [...cartItems];
      const newQuantity = newCart[existingItemIndex].quantity + selectedQuantity;
      
      // Check if the new quantity exceeds available stock
      if (newQuantity > part.quantity) {
        toast({
          title: "Error",
          description: `Cannot add ${selectedQuantity} more. Only ${part.quantity} available in inventory`,
          variant: "destructive",
        });
        return;
      }
      
      newCart[existingItemIndex].quantity = newQuantity;
      setCartItems(newCart);
    } else {
      // Add new item to cart
      setCartItems([
        ...cartItems,
        {
          partId: part.id,
          partName: part.name,
          partNumber: part.partId,
          quantity: selectedQuantity,
          maxQuantity: part.quantity
        }
      ]);
    }
    
    // Reset selection
    setSelectedPartId(null);
    setSelectedQuantity(1);
    
    // IMPORTANT: Restore form values to preserve building, cost center, and date selections
    // This fixes the issue where adding parts would reset form data
    bulkForm.reset(currentFormValues);
    
    toast({
      title: "Added to cart",
      description: `${selectedQuantity} × ${part.name} added to cart`,
    });
  };
  
  const removeFromCart = (index: number) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };
  
  const handleBulkChargeOut = (data: BulkIssuanceFormValues) => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "No parts in cart to charge out",
        variant: "destructive",
      });
      return;
    }
    
    // CRITICAL FIX: Include issuedAt field to maintain selected date
    bulkIssueMutation.mutate({
      parts: cartItems.map(item => ({
        partId: item.partId,
        quantity: item.quantity
      })),
      building: data.building,
      issuedTo: data.issuedTo,
      // Always use "other" for reason field to maintain compatibility
      reason: "other",
      notes: data.notes,
      costCenter: data.costCenter
    });
  };
  
  // Handle barcode scan result
  const handleScanResult = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowScanner(false);
    
    // Find part by scanned barcode
    const part = parts?.find(p => p.partId?.toLowerCase() === barcode.toLowerCase());
    if (part) {
      setSelectedPartId(part.id);
      // Focus on quantity field
      setTimeout(() => document.getElementById('quantity-input')?.focus(), 100);
    } else {
      toast({
        title: "Part not found",
        description: `No part with ID ${barcode} found`,
        variant: "destructive",
      });
    }
  };
  
  // Detect if we're on mobile
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  
  return (
    <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'}`}>
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 ${isMobile ? 'space-y-3' : ''}`}>
        <div>
          {isTechnician && (
            <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          )}
          <div className="flex items-center gap-2">
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Part Charge-Outs</h1>
            <div 
              className={`h-2.5 w-2.5 rounded-full ${
                wsStatus === 'connected' 
                  ? 'bg-green-500' 
                  : wsStatus === 'connecting' 
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
              }`}
              title={`WebSocket: ${wsStatus}`}
            />
          </div>
          <p className="text-muted-foreground">Track and manage part charge-outs</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          {/* IMPROVED Month Picker - Select JUST the month */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !selectedMonth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedMonth ? format(selectedMonth, 'MMMM yyyy') : "Select month"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="flex flex-col space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium">
                    {format(currentDate, 'yyyy')}
                  </h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    // Create a date object for this month and year
                    const monthDate = new Date(currentDate.getFullYear(), i, 1);
                    const isSelected = selectedMonth && 
                      selectedMonth.getMonth() === i && 
                      selectedMonth.getFullYear() === currentDate.getFullYear();
                    
                    return (
                      <Button
                        key={i}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-9",
                          isSelected && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => {
                          setSelectedMonth(monthDate);
                          setIsCalendarOpen(false);
                        }}
                      >
                        {format(monthDate, 'MMM')}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-between border-t pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const prevYear = new Date(currentDate);
                      prevYear.setFullYear(prevYear.getFullYear() - 1);
                      setCurrentDate(prevYear);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev Year
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const nextYear = new Date(currentDate);
                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                      setCurrentDate(nextYear);
                    }}
                  >
                    Next Year <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Export/Import Buttons */}
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => window.open(`/api/parts-issuance/export-test?month=${monthParam}&format=xlsx`, '_blank')}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
            
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => window.open(`/api/parts-issuance/export-data`, '_blank')}>
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
            
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => window.open(`/api/parts-issuance/template`, '_blank')}>
              <Download className="mr-2 h-4 w-4" /> Template
            </Button>
            
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setShowImportDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Import
            </Button>
            
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => window.open(`/api/parts-issuance/export?month=${monthParam}&format=pdf`, '_blank')}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
          
          {/* Add Charge-Out Button */}
          <BearTooltip content="Click here to charge out parts from inventory to a specific person and building.">
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Charge Out Parts
            </Button>
          </BearTooltip>
        </div>
      </div>
      
      {/* Charge-Outs Table Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Charge-Outs for {selectedMonth ? format(selectedMonth, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}</CardTitle>
              <CardDescription>
                {monthlyTotal?.total || 0} part{(monthlyTotal?.total || 0) !== 1 ? 's' : ''} charged out this month
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search charge-outs..."
                  className="pl-8 md:w-[200px] lg:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingChargeOuts ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : (
            <>
              {chargeOuts && chargeOuts.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part</TableHead>
                          <TableHead>Part ID</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Issued To</TableHead>
                          <TableHead>Building</TableHead>
                          <TableHead>Issued By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chargeOuts
                          .filter(issuance => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return (
                              (issuance.part?.name?.toLowerCase().includes(query) || false) ||
                              (issuance.part?.partId?.toLowerCase().includes(query) || false) ||
                              (typeof issuance.issuedTo === 'string' && issuance.issuedTo.toLowerCase().includes(query)) ||
                              (issuance.buildingName?.toLowerCase().includes(query) || false) ||
                              (issuance.issuedBy?.name && issuance.issuedBy.name.toLowerCase().includes(query)) ||
                              (typeof issuance.issuedBy === 'string' && issuance.issuedBy.toLowerCase().includes(query)) ||
                              false
                            );
                          })
                          .map((issuance) => (
                            <TableRow key={issuance.id}>
                              <TableCell>{issuance.part?.name || 'Unknown Part'}</TableCell>
                              <TableCell>{issuance.part?.partId || '-'}</TableCell>
                              <TableCell>{issuance.quantity}</TableCell>
                              <TableCell>{typeof issuance.issuedTo === 'string' ? issuance.issuedTo : '-'}</TableCell>
                              <TableCell>{issuance.buildingName || issuance.projectCode || (typeof issuance.building === 'string' ? issuance.building : '-')}</TableCell>
                              <TableCell>
                                {issuance.issuedBy?.name || 
                                 (issuance.issuedBy && typeof issuance.issuedBy === 'string' ? issuance.issuedBy : '-')}
                              </TableCell>
                              <TableCell>
                                {issuance.issuedAt ? 
                                  format(new Date(issuance.issuedAt), 'MM/dd/yyyy') :
                                  '-'
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => editChargeOut(issuance.id)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => deleteChargeOut(issuance.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/20">
                  <div className="mb-3 flex justify-center">
                    <Badge variant="outline" className="text-muted-foreground px-3 py-1.5">
                      No Charge-Outs
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    No parts have been charged out for {selectedMonth ? format(selectedMonth, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}.
                  </p>
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Charge Out Parts
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Part Charge-Outs Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          // Reset cart when closing dialog
          setCartItems([]);
          bulkForm.reset({
            building: "",
            issuedTo: user?.name || "",
            issuedAt: new Date(), // Always reset with current date
            costCenter: "none",
            notes: "",
          });
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto grid grid-rows-[auto_1fr]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Charge Out Parts</DialogTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" />
                {cartItems.length} {cartItems.length === 1 ? 'part' : 'parts'}
              </Badge>
            </div>
            <DialogDescription>
              Add parts to your cart and charge them out all at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Part selection section */}
            <div className="border rounded-md p-4 bg-muted/20">
              <h3 className="text-sm font-medium mb-3">Select Part to Add</h3>
              
              {/* Direct search without dropdown */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="flex items-center border rounded-md px-3 py-2 w-full">
                      <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                      <input
                        placeholder="Search part name or ID..."
                        className="flex-1 border-0 bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground"
                        value={searchParts}
                        onChange={(e) => setSearchParts(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setShowScanner(true)}
                  >
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Selected part display */}
                {selectedPartId && (
                  <div className="border rounded-md p-2 bg-primary/5">
                    <div className="font-medium">
                      {parts?.find(p => p.id === selectedPartId)?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {parts?.find(p => p.id === selectedPartId)?.partId} 
                      ({parts?.find(p => p.id === selectedPartId)?.quantity} in stock)
                    </div>
                  </div>
                )}
                
                {/* Search results as a scrollable list with direct selection */}
                {searchParts.trim() !== "" && (
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1 text-xs font-medium border-b">
                      {filteredParts.length} part(s) found
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredParts.length > 0 ? (
                        filteredParts.slice(0, 10).map(part => (
                          <button
                            key={part.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 border-b last:border-0 hover:bg-muted/50 
                              ${selectedPartId === part.id ? 'bg-primary/10' : ''}
                              ${part.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => setSelectedPartId(part.id)}
                            disabled={part.quantity <= 0}
                          >
                            <div className="font-medium truncate">{part.name}</div>
                            <div className="text-xs text-muted-foreground flex justify-between">
                              <span>{part.partId}</span>
                              <span className={part.quantity < part.reorderLevel ? 'text-red-500' : ''}>
                                {part.quantity} in stock
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                          No parts found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1">
                    <label htmlFor="quantity-input" className="text-sm font-medium block mb-1">Quantity</label>
                    <Input 
                      id="quantity-input"
                      type="number" 
                      min={1} 
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 0)}
                      max={selectedPartId ? parts?.find(p => p.id === selectedPartId)?.quantity || 1 : 1}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      onClick={handleAddToCart}
                      disabled={!selectedPartId || selectedQuantity <= 0}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cart items - more compact design */}
            {cartItems.length > 0 && (
              <div className="border rounded-md">
                <div className="p-3 bg-muted/10 border-b flex items-center justify-between">
                  <h3 className="text-sm font-medium">Cart Items ({cartItems.length})</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCartItems([])}
                    className="h-7 px-2 text-destructive hover:text-destructive/90"
                  >
                    <Trash className="h-3.5 w-3.5 mr-1" /> Clear All
                  </Button>
                </div>
                <div className="max-h-[180px] overflow-y-auto divide-y">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-muted/5">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.partName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="truncate">{item.partNumber}</span>
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold">
                            {item.quantity} × (max: {item.maxQuantity})
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFromCart(index)}
                        className="h-7 w-7 ml-2 text-destructive hover:text-destructive/90"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Form for shared fields - organized in a 2-column grid for better space usage */}
            <Form {...bulkForm}>
              <form onSubmit={bulkForm.handleSubmit(handleBulkChargeOut)} className="space-y-4">
                {/* Split the top form fields into two columns for better layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={bulkForm.control}
                    name="building"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          Building
                          <BearTooltip content="Select which building the parts are being charged to. This helps track part usage by location.">
                            <HelpIcon />
                          </BearTooltip>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select building" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildings.length > 0 ? (
                              buildings.map((building) => (
                                <SelectItem 
                                  key={building.id} 
                                  value={building.id.toString()}
                                >
                                  {building.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="other">Other</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bulkForm.control}
                    name="issuedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          Charged To
                          <BearTooltip content="Select the person who is receiving the parts. This helps track who has received specific parts.">
                            <HelpIcon />
                          </BearTooltip>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select person" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.name}>
                                {user.name} - {user.department || "No Department"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bulkForm.control}
                    name="costCenter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          Cost Center
                          <BearTooltip content="Select the cost center or budget code that should be charged for these parts if known. This helps with accounting but is not required.">
                            <HelpIcon />
                          </BearTooltip>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a cost center" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {costCenters.map(center => (
                              <SelectItem key={center.id} value={center.code}>
                                {center.code} - {center.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bulkForm.control}
                    name="issuedAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-1.5">
                          Date <span className="text-destructive">*</span>
                          <BearTooltip content="Date when parts were charged out. This is critical for reports.">
                            <HelpIcon />
                          </BearTooltip>
                        </FormLabel>
                        <FormControl>
                          <input
                            type="date"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : new Date();
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={bulkForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        Notes (Optional)
                        <BearTooltip content="Add any additional information about these parts that might be useful for future reference.">
                          <HelpIcon />
                        </BearTooltip>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter any additional notes about this part charge-out"
                          className="min-h-[60px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-4">
                  <Button 
                    type="submit" 
                    disabled={cartItems.length === 0 || bulkIssueMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {bulkIssueMutation.isPending ? (
                      "Processing..."
                    ) : (
                      `Charge Out ${cartItems.length} ${cartItems.length === 1 ? 'Part' : 'Parts'}`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>
              Scan a barcode to find a part in the system
            </DialogDescription>
          </DialogHeader>
          
          <SimpleBarcodeScanner 
            onCodeDetected={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Charge-Out Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Charge-Out</DialogTitle>
            <DialogDescription>
              Update the details for this parts charge-out
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateChargeOutMutation.mutate(data))} className="space-y-4">
              {editingChargeOut && (
                <div className="bg-primary/5 border rounded-md p-3 mb-4">
                  <h3 className="font-medium text-sm">{editingChargeOut.part?.name || 'Unknown Part'}</h3>
                  <p className="text-xs text-muted-foreground">{editingChargeOut.part?.partId || 'No part ID'}</p>
                </div>
              )}
              
              {/* Grid layout for better form organization */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="issuedAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                // Ensure field.value is actually a Date object before formatting
                                format(
                                  field.value instanceof Date 
                                    ? field.value 
                                    : new Date(field.value), 
                                  "PPP"
                                )
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value instanceof Date 
                                ? field.value 
                                : field.value 
                                  ? new Date(field.value) 
                                  : undefined
                            }
                            onSelect={(date) => {
                              console.log("Calendar date selected:", date?.toISOString());
                              field.onChange(date);
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select building" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem 
                              key={building.id} 
                              value={building.id.toString()}
                            >
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="issuedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charged To</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-4 grid-cols-1">
                <FormField
                  control={editForm.control}
                  name="costCenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Center</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cost center" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {costCenters.map((cc) => (
                            <SelectItem key={cc.id} value={cc.code}>{cc.code} - {cc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Add notes about this charge-out" className="min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateChargeOutMutation.isPending}
                >
                  {updateChargeOutMutation.isPending ? "Updating..." : "Update Charge-Out"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Error message for loading failures */}
      {chargeOutsError && (
        <div className="border rounded-md bg-destructive/10 p-4 mb-6">
          <div className="flex items-start">
            <div className="shrink-0 mt-0.5">
              <X className="h-5 w-5 text-destructive" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error loading charge-outs</h3>
              <div className="mt-1 text-sm text-destructive/80">
                {chargeOutsError instanceof Error ? chargeOutsError.message : 'Failed to load charge-outs data'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Charge-Outs from Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import charge-out records. Download the template first if you need the correct format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="file-upload" className="text-sm font-medium">
                Select Excel File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </div>
            )}
            
            {importProgress.isUploading && (
              <div className="text-sm text-blue-600 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {importProgress.message}
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/parts-issuance/template', '_blank')}
            >
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
            <Button 
              onClick={handleFileImport}
              disabled={!selectedFile || importProgress.isUploading}
            >
              {importProgress.isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import File'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}