import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
  CalendarIcon,
  Package,
  Upload,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  FileDown,
  Users,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Function to process date for server
function processDateForServer(dateString: string): string {
  try {
    console.log("Processing date string:", dateString);
    
    // Check if it's already ISO format
    if (dateString.includes('T') && dateString.includes('Z')) {
      return dateString;
    }
    
    // If it's a date-time-local format (YYYY-MM-DDTHH:MM)
    if (dateString.includes('T')) {
      const isoDate = new Date(dateString).toISOString();
      console.log("Converted date-time-local to ISO:", isoDate);
      return isoDate;
    }
    
    // If it's YYYY-MM-DD format, parse as local date
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day, 12, 0, 0);
      console.log("Parsed YYYY-MM-DD as local date:", dateObj.toISOString());
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
  deliveredAt: string; 
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
  partId: string;
  name: string;
  quantity: number;
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
  quantity: number;
  maxQuantity: number;
};

export default function Deliveries() {
  const queryClient = useQueryClient();
  
  // State variables
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [projectCode, setProjectCode] = useState("");
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  
  // Format month for filtering
  const monthParam = format(month, "MM/yyyy");
  
  // Fetch deliveries for the selected month
  const { data: deliveries, isLoading: isLoadingDeliveries } = useQuery<PartsDelivery[]>({
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
  const { data: parts } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
    retry: 1
  });

  // Fetch staff members
  const { data: staff } = useQuery<StaffMember[]>({
    queryKey: ['/api/staff'],
    retry: 1
  });

  // Fetch buildings
  const { data: buildings } = useQuery({
    queryKey: ['/api/buildings'],
    retry: 1
  });

  // Fetch monthly delivery total
  const { data: monthlyTotal } = useQuery({
    queryKey: ['/api/parts-delivery/monthly-total', monthParam],
    queryFn: async () => {
      const response = await fetch(`/api/parts-delivery/monthly-total?month=${monthParam}`);
      if (!response.ok) throw new Error('Failed to fetch monthly total');
      return response.json();
    }
  });

  // Computed values
  const filteredStaff = staff?.filter(s => 
    s.name.toLowerCase().includes(staffSearchTerm.toLowerCase())
  ) || [];
  
  const filteredParts = parts?.filter(p => 
    p.name.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    p.partId.toLowerCase().includes(partSearchTerm.toLowerCase())
  ) || [];

  // Handler functions
  const handleStaffSelected = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setStaffSearchTerm(staffMember.name);
  };
  
  const handlePartSelected = (part: Part) => {
    const cartItem: CartItem = {
      partId: part.id,
      partName: part.name,
      partNumber: part.partId,
      quantity: 1,
      maxQuantity: part.quantity
    };
    
    const existingIndex = cartItems.findIndex(item => item.partId === part.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity = Math.min(updated[existingIndex].quantity + 1, part.quantity);
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, cartItem]);
    }
    
    setPartSearchTerm('');
  };
  
  const removeFromCart = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
  };
  
  const resetForm = () => {
    setSelectedStaff(null);
    setCartItems([]);
    setStaffSearchTerm('');
    setPartSearchTerm('');
    setDeliveryDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setProjectCode('');
    setNotes('');
  };

  // Create delivery mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStaff || cartItems.length === 0) {
        throw new Error("Please select staff member and add parts to cart");
      }

      const payload = {
        staffMemberId: selectedStaff.id,
        buildingId: selectedStaff.buildingId,
        costCenterId: selectedStaff.costCenterId,
        deliveredAt: processDateForServer(deliveryDate),
        deliveredById: 1,
        notes: notes || null,
        projectCode: projectCode || null,
        items: cartItems.map(item => ({
          partId: item.partId,
          quantity: item.quantity
        }))
      };
      
      const response = await fetch("/api/parts-delivery/bulk", {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parts Deliveries</h1>
          <p className="text-muted-foreground">
            Manage and track parts deliveries to staff members
          </p>
        </div>
        
        {/* Record Delivery Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Record Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Delivery</DialogTitle>
              <DialogDescription>
                Select staff member and parts to record a delivery
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Staff Selection */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staff-search">Search Staff Member</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="staff-search"
                      placeholder="Type staff member name..."
                      value={staffSearchTerm}
                      onChange={(e) => setStaffSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {staffSearchTerm && filteredStaff.length > 0 && (
                    <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                      {filteredStaff.slice(0, 5).map((staffMember) => (
                        <div
                          key={staffMember.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleStaffSelected(staffMember)}
                        >
                          <div className="font-medium">{staffMember.name}</div>
                          <div className="text-sm text-gray-500">
                            {staffMember.building?.name} - {staffMember.costCenter?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedStaff && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm">
                        <p><strong>Staff:</strong> {selectedStaff.name}</p>
                        <p><strong>Building:</strong> {selectedStaff.building?.name}</p>
                        <p><strong>Cost Center:</strong> {selectedStaff.costCenter?.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                      <CardTitle className="text-lg">Selected Parts</CardTitle>
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
                                <Trash2 className="h-4 w-4" />
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
            
            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <Label htmlFor="delivery-date">Delivery Date & Time</Label>
                <Input
                  id="delivery-date"
                  type="datetime-local"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="project-code">Project Code (Optional)</Label>
                <Input
                  id="project-code"
                  placeholder="Enter project code..."
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter delivery notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createMutation.mutate()}
                disabled={!selectedStaff || cartItems.length === 0 || createMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {createMutation.isPending ? "Recording..." : "Record Delivery"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Deliveries in {format(month, "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyTotal?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Value delivered this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Filter</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(month, "MMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deliveries for {format(month, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDeliveries ? (
            <div className="text-center py-8">Loading deliveries...</div>
          ) : deliveries && deliveries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      {format(new Date(delivery.deliveredAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{delivery.staffMember?.name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{delivery.part?.name}</div>
                        <div className="text-sm text-gray-500">{delivery.part?.partId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{delivery.quantity}</TableCell>
                    <TableCell>{delivery.building?.name}</TableCell>
                    <TableCell>
                      <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'}>
                        {delivery.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries found for {format(month, "MMMM yyyy")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}