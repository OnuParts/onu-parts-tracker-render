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

type CartItem = {
  partId: number;
  partName: string;
  partNumber: string;
  quantity: number;  // We'll ensure this is a number before adding to cart
  maxQuantity: number;
};

const bulkDeliverySchema = z.object({
  staffMemberId: z.number().min(1, "Please select a staff member"),
  buildingId: z.number().min(1, "Building is required"),
  costCenterId: z.number().min(1, "Cost center is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  notes: z.string().optional()
});

type BulkDeliveryFormValues = z.infer<typeof bulkDeliverySchema>;

export default function Deliveries() {
  const queryClient = useQueryClient();
  const { isAdmin, isStudent } = useRole();
  
  // State management
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
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

  // Add the bulk delivery form
  const bulkForm = useForm<BulkDeliveryFormValues>({
    resolver: zodResolver(bulkDeliverySchema),
    defaultValues: {
      staffMemberId: undefined,
      buildingId: undefined,
      costCenterId: undefined,
      deliveryDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  // Format month for filtering
  const monthParam = format(currentMonth, "MM/yyyy");
  
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
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['/api/buildings'],
    retry: 1
  });

  // Fetch cost centers
  const { data: costCenters, isLoading: isLoadingCostCenters } = useQuery({
    queryKey: ['/api/cost-centers'],
    retry: 1
  });

  // Fetch monthly total
  const { data: monthlyTotal } = useQuery({
    queryKey: ['/api/parts-delivery/monthly-total', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-delivery/monthly-total?month=${monthParam}`);
      if (!response.ok) throw new Error('Failed to fetch monthly total');
      return response.json();
    }
  });

  // Fetch monthly count
  const { data: monthlyCount } = useQuery({
    queryKey: ['/api/parts-delivery/monthly-count', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-delivery/monthly-count?month=${monthParam}`);
      if (!response.ok) throw new Error('Failed to fetch monthly count');
      return response.json();
    }
  });

  // Bulk delivery mutation
  const bulkDeliveryMutation = useMutation({
    mutationFn: async (payload: {
      parts: { partId: number; quantity: number }[];
      staffMemberId: number;
      buildingId: number;
      costCenterId: number;
      deliveryDate: string;
      notes?: string;
    }) => {
      const response = await fetch("/api/parts-delivery/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create bulk delivery");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery/monthly-total'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-delivery/monthly-count'] });
      toast({
        title: "Bulk delivery created",
        description: "All parts have been delivered successfully",
      });
      setIsBulkDeliveryOpen(false);
      setCartItems([]);
      bulkForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating bulk delivery",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Event handlers for part selection
  const handlePartSelected = (part: Part) => {
    const cartItem: CartItem = {
      partId: part.id,
      partName: part.name,
      partNumber: part.partId,
      quantity: 1,
      maxQuantity: part.quantity
    };
    
    // Check if item already in cart
    const existingIndex = cartItems.findIndex(item => item.partId === part.id);
    if (existingIndex >= 0) {
      // Update quantity if already in cart
      const updated = [...cartItems];
      updated[existingIndex].quantity = Math.min(updated[existingIndex].quantity + 1, part.quantity);
      setCartItems(updated);
    } else {
      // Add new item to cart
      setCartItems([...cartItems, cartItem]);
    }
    
    setPartSearchTerm('');
  };

  const removeFromCart = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
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
        staff.name.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error("Error filtering staff:", error);
      return staffMembers;
    }
  }, [staffMembers, staffSearchTerm]);

  // Filter deliveries by search term
  const filteredDeliveries = React.useMemo(() => {
    if (!deliveries) return [];
    if (!searchTerm || !searchTerm.trim()) return deliveries;
    
    try {
      const searchLower = searchTerm.toLowerCase();
      return deliveries.filter(delivery => 
        delivery.part?.name?.toLowerCase().includes(searchLower) ||
        delivery.part?.partId?.toLowerCase().includes(searchLower) ||
        delivery.staffMember?.name?.toLowerCase().includes(searchLower) ||
        delivery.building?.name?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error("Error filtering deliveries:", error);
      return deliveries;
    }
  }, [deliveries, searchTerm]);

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

  const handleEditDelivery = (delivery: PartsDelivery) => {
    setCurrentDelivery(delivery);
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

  if (isLoadingDeliveries || isLoadingParts || isLoadingStaff || isLoadingBuildings || isLoadingCostCenters) {
    return (
      <AppLayout title="Parts Deliveries">
        <LoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Parts Deliveries">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with Record Delivery Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Parts Deliveries</h1>
            <p className="text-muted-foreground">
              Manage and track parts deliveries to staff members
            </p>
          </div>
          
          {(isAdmin || isStudent) && (
            <div className="flex gap-2">
              <Dialog open={isBulkDeliveryOpen} onOpenChange={setIsBulkDeliveryOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Delivery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record Bulk Delivery</DialogTitle>
                    <DialogDescription>
                      Select staff member and add parts to cart for bulk delivery
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...bulkForm}>
                    <form onSubmit={bulkForm.handleSubmit(handleBulkDeliverySubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Staff Selection */}
                        <div className="space-y-4">
                          <FormField
                            control={bulkForm.control}
                            name="staffMemberId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Staff Member</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {staffMembers?.map((staff) => (
                                      <SelectItem key={staff.id} value={staff.id.toString()}>
                                        {staff.name} - {staff.building?.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={bulkForm.control}
                              name="buildingId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Building</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select building" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {buildings?.map((building: any) => (
                                        <SelectItem key={building.id} value={building.id.toString()}>
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
                              control={bulkForm.control}
                              name="costCenterId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cost Center</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select cost center" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {costCenters?.map((center: any) => (
                                        <SelectItem key={center.id} value={center.id.toString()}>
                                          {center.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        {/* Parts Selection */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="part-search">Search Parts</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="part-search"
                                placeholder="Type part name or number..."
                                value={partSearchTerm}
                                onChange={(e) => setPartSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            
                            {partSearchTerm && filteredParts.length > 0 && (
                              <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                                {filteredParts.slice(0, 5).map((part) => (
                                  <div
                                    key={part.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                    onClick={() => handlePartSelected(part)}
                                  >
                                    <div className="font-medium">{part.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {part.partId} - Stock: {part.quantity}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {cartItems.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <ShoppingCart className="h-4 w-4" />
                                  Cart ({cartItems.length} items)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {cartItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <div>
                                        <div className="font-medium">{item.partName}</div>
                                        <div className="text-sm text-gray-500">{item.partNumber}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min="1"
                                          max={item.maxQuantity}
                                          value={item.quantity}
                                          onChange={(e) => {
                                            const newQuantity = parseInt(e.target.value) || 1;
                                            const updated = [...cartItems];
                                            updated[index].quantity = Math.min(newQuantity, item.maxQuantity);
                                            setCartItems(updated);
                                          }}
                                          className="w-20"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeFromCart(index)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={bulkForm.control}
                          name="deliveryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={bulkForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter delivery notes..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsBulkDeliveryOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={cartItems.length === 0 || bulkDeliveryMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {bulkDeliveryMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Recording...
                            </>
                          ) : (
                            "Record Delivery"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Deliveries Table */}
          <Card className="md:w-2/3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Deliveries</CardTitle>
                  <CardDescription>
                    Parts delivered to staff members
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search deliveries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Part</TableHead>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Building</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveries && filteredDeliveries.length > 0 ? (
                        filteredDeliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell>
                              {format(new Date(delivery.deliveredAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{delivery.part?.name}</div>
                                <div className="text-sm text-gray-500">{delivery.part?.partId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{delivery.staffMember?.name}</div>
                                <div className="text-sm text-gray-500">
                                  {delivery.costCenter?.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{delivery.building?.name}</TableCell>
                            <TableCell>{delivery.quantity}</TableCell>
                            <TableCell>
                              <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'}>
                                {delivery.status || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ${((delivery.part?.unitCost || 0) * delivery.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
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
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
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