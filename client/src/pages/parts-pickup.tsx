import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useWebSocket } from "@/lib/websocket";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Building } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

// Define types based on schema
interface PartsPickup {
  id: number;
  partName: string;
  partNumber: string | null;
  quantity: number;
  supplier: string | null;
  notes: string | null;
  status: 'pending' | 'completed';
  buildingId: number | null;
  trackingNumber: string | null;
  poNumber: string | null;
  addedById: number | null;
  addedAt: Date;
  pickedUpById: number | null;
  pickedUpAt: Date | null;
  pickupCode: string | null;
}

interface PartsPickupWithDetails extends PartsPickup {
  building?: Building;
  addedBy?: { id: number; name: string; role: string };
  pickedUpBy?: { id: number; name: string; role: string };
}

interface FormData {
  partName: string;
  partNumber: string;
  quantity: number;
  supplier: string;
  buildingId: number | null;
  trackingNumber: string;
  poNumber: string;
  notes: string;
}

function PartsPickupPage() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user
  const isTechnician = user?.role === 'technician';
  
  const [activeTab, setActiveTab] = useState<string>(isTechnician ? "pending" : "all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [searchCode, setSearchCode] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    partName: '',
    partNumber: '',
    quantity: 1,
    supplier: '',
    buildingId: null,
    trackingNumber: '',
    poNumber: '',
    notes: ''
  });
  
  // Connect to WebSocket for real-time updates
  const { status: wsStatus, lastMessage } = useWebSocket();
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = lastMessage;
        
        // Handle different WebSocket message types
        if (data.type === 'parts-pickup-created') {
          // Refresh parts pickup data
          queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
          
          // Show toast notification if not added by current user
          if (data.data.addedBy !== user?.name) {
            toast({
              title: 'New Parts Pickup',
              description: `${data.data.addedBy} added ${data.data.partName} (${data.data.quantity}) for pickup`,
              variant: 'default',
            });
          }
        } 
        else if (data.type === 'parts-pickup-completed') {
          // Refresh parts pickup data
          queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
          
          // Show toast notification for parts pickup completion
          if (data.data.pickedUpBy !== user?.name) {
            toast({
              title: 'Parts Pickup Completed',
              description: `${data.data.pickedUpBy} received ${data.data.partName}`,
              variant: 'default',
            });
          }
        }
        else if (data.type === 'parts-pickup-deleted') {
          // Refresh parts pickup data
          queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
          
          // Show toast notification for parts pickup deletion
          if (data.data.deletedBy !== user?.name) {
            toast({
              title: 'Parts Pickup Deleted',
              description: `A parts pickup entry was deleted by ${data.data.deletedBy}`,
              variant: 'default',
            });
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    }
  }, [lastMessage, queryClient, toast, user?.name]);

  // Fetch all parts pickups
  const { data: partsPickups, isLoading: isLoadingPickups } = useQuery<PartsPickupWithDetails[]>({
    queryKey: ['/api/parts-pickup'],
    staleTime: 10000, // 10 seconds
    retry: false,
    enabled: true, // Database is now configured properly
  });

  // Fetch buildings for the form
  const { data: buildings } = useQuery<Building[]>({
    queryKey: ['/api/buildings'],
    staleTime: 60000, // 1 minute
  });

  // Mutation for adding a new parts pickup
  const addPickupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/parts-pickup', data);
      return await response.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      setFormData({
        partName: '',
        partNumber: '',
        quantity: 1,
        supplier: '',
        buildingId: null,
        trackingNumber: '',
        poNumber: '',
        notes: ''
      });
      setIsAddDialogOpen(false);
      
      // Invalidate query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
      
      toast({
        title: "Success",
        description: "New parts pickup has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add parts pickup: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting a parts pickup
  const deletePickupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/parts-pickup/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
      toast({
        title: "Success",
        description: "Parts pickup has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete parts pickup: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for marking a parts pickup as picked up
  const markAsPickedUpMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PATCH', `/api/parts-pickup/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
      toast({
        title: "Success",
        description: "Parts pickup has been marked as picked up.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update parts pickup status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'buildingId') {
      const buildingId = value && value !== 'none' ? parseInt(value) : null;
      setFormData((prev) => ({ ...prev, buildingId }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddPickup = (e: React.FormEvent) => {
    e.preventDefault();
    addPickupMutation.mutate(formData);
  };

  const handleDeletePickup = (id: number) => {
    if (window.confirm('Are you sure you want to delete this parts pickup?')) {
      deletePickupMutation.mutate(id);
    }
  };
  
  const handleMarkAsPickedUp = (id: number) => {
    if (window.confirm('Mark this parts pickup as completed? This action cannot be undone.')) {
      markAsPickedUpMutation.mutate(id);
    }
  };

  // Filter pickups based on active tab
  const filteredPickups = partsPickups?.filter(pickup => {
    if (activeTab === 'pending') return pickup.status === 'pending';
    if (activeTab === 'completed') return pickup.status === 'completed';
    return true; // 'all' tab
  }) || [];

  // Add search by pickup code functionality
  const handleSearchByCode = async () => {
    if (!searchCode || searchCode.length < 4) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 4-digit pickup code",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/parts-pickup?code=${searchCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "No Parts Found",
            description: "No pending parts found with this pickup code",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to search for parts pickup",
            variant: "destructive",
          });
        }
      } else {
        const data = await response.json();
        // Refresh the data with the search results
        queryClient.setQueryData(['/api/parts-pickup'], data);
        
        toast({
          title: "Parts Found",
          description: `Found ${data.length} part(s) with pickup code ${searchCode}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for parts pickup",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Reset search and show all pending pickups
  const resetSearch = () => {
    setSearchCode('');
    queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
  };

  // Custom render for technicians
  if (isTechnician) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Parts Pickup</h1>
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
          </div>
        </div>
        
        {/* Pickup Code Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search by Pickup Code</CardTitle>
            <CardDescription>
              Enter the 4-digit pickup code to find your parts more quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-stretch sm:items-center">
              <div className="relative flex-grow max-w-full sm:max-w-[200px]">
                <Input
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.trim())}
                  className="w-full text-lg"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div className="flex gap-2 flex-grow sm:flex-grow-0">
                <Button 
                  variant="default" 
                  onClick={handleSearchByCode}
                  disabled={isSearching || searchCode.length < 4}
                  className="flex-1 sm:flex-auto"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Search
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetSearch}
                  disabled={isSearching}
                  className="flex-1 sm:flex-auto"
                >
                  Show All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Parts Ready for Pickup</CardTitle>
            <CardDescription>
              These parts are waiting to be picked up or received. Mark them as complete when received.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPickups || isSearching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>{isSearching ? "Searching..." : "Loading parts for pickup..."}</span>
              </div>
            ) : filteredPickups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium">No parts pending pickup</p>
                <p className="text-muted-foreground mt-1">
                  Check back later for parts that need to be picked up
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Supplier</TableHead>
                      <TableHead className="hidden sm:table-cell">Quantity</TableHead>
                      <TableHead className="hidden sm:table-cell">Building</TableHead>
                      <TableHead>Pickup Code</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPickups.map((pickup) => (
                      <TableRow key={pickup.id}>
                        <TableCell>
                          <div className="font-medium">{pickup.partName}</div>
                          {pickup.partNumber && <div className="text-sm text-muted-foreground">#{pickup.partNumber}</div>}
                          {/* Mobile-only info */}
                          <div className="mt-1 sm:hidden space-y-1">
                            <div className="text-sm">
                              <span className="font-medium mr-1">Qty:</span>
                              {pickup.quantity}
                            </div>
                            {pickup.supplier && (
                              <div className="text-sm">
                                <span className="font-medium mr-1">Supplier:</span>
                                {pickup.supplier}
                              </div>
                            )}
                            {pickup.building?.name && (
                              <div className="text-sm">
                                <span className="font-medium mr-1">Building:</span>
                                {pickup.building.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{pickup.supplier || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{pickup.quantity}</TableCell>
                        <TableCell className="hidden sm:table-cell">{pickup.building?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-lg font-bold">
                            {pickup.pickupCode || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkAsPickedUp(pickup.id)}
                            disabled={markAsPickedUpMutation.isPending}
                          >
                            {markAsPickedUpMutation.isPending ? "..." : "Received"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Default admin view
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Parts Pickup</h1>
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Parts Pickup</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Parts Pickup</DialogTitle>
              <DialogDescription>
                Add information about parts that need to be picked up from a supplier.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPickup}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="partName" className="md:text-right">
                    Part Name*
                  </Label>
                  <Input
                    id="partName"
                    name="partName"
                    value={formData.partName}
                    onChange={handleInputChange}
                    className="md:col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="partNumber" className="md:text-right">
                    Part Number
                  </Label>
                  <Input
                    id="partNumber"
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleInputChange}
                    className="md:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="quantity" className="md:text-right">
                    Quantity*
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleNumberInputChange}
                    className="md:col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="supplier" className="md:text-right">
                    Supplier
                  </Label>
                  <Input
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="md:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="building" className="md:text-right">
                    Building
                  </Label>
                  <div className="md:col-span-3">
                    <Select
                      onValueChange={(value) => handleSelectChange('buildingId', value)}
                      value={formData.buildingId?.toString() || 'none'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select building" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {buildings?.map((building) => (
                          <SelectItem key={building.id} value={building.id.toString()}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="trackingNumber" className="md:text-right">
                    Tracking #
                  </Label>
                  <Input
                    id="trackingNumber"
                    name="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={handleInputChange}
                    className="md:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="poNumber" className="md:text-right">
                    PO #
                  </Label>
                  <Input
                    id="poNumber"
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleInputChange}
                    className="md:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                  <Label htmlFor="notes" className="md:text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="md:col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addPickupMutation.isPending}>
                  {addPickupMutation.isPending ? "Adding..." : "Add Parts Pickup"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Pickups</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Parts Pickups</CardTitle>
              <CardDescription>
                View all parts pickups, both pending and completed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPickups ? (
                <div className="text-center py-4">Loading parts pickups...</div>
              ) : filteredPickups.length === 0 ? (
                <div className="text-center py-4">
                  <p>No parts pickups found.</p>
                  <p className="mt-2 text-muted-foreground">Click "Add Parts Pickup" to create a new entry.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead>Pickup Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPickups.map((pickup) => (
                      <TableRow key={pickup.id}>
                        <TableCell>
                          <div className="font-medium">{pickup.partName}</div>
                          {pickup.partNumber && <div className="text-sm text-muted-foreground">#{pickup.partNumber}</div>}
                        </TableCell>
                        <TableCell>{pickup.supplier || 'N/A'}</TableCell>
                        <TableCell>{pickup.quantity}</TableCell>
                        <TableCell>{pickup.building?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-lg font-bold">
                            {pickup.pickupCode || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pickup.status === 'pending' ? 'secondary' : 'default'}>
                            {pickup.status === 'pending' ? 'Pending' : 'Completed'}
                          </Badge>
                        </TableCell>
                        <TableCell>{pickup.addedBy?.name || 'N/A'}</TableCell>
                        <TableCell>{pickup.addedAt ? format(new Date(pickup.addedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePickup(pickup.id)}
                            disabled={deletePickupMutation.isPending}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Parts Pickups</CardTitle>
              <CardDescription>
                Parts that are waiting to be picked up or received.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPickups ? (
                <div className="text-center py-4">Loading pending parts pickups...</div>
              ) : filteredPickups.length === 0 ? (
                <div className="text-center py-4">
                  <p>No pending parts pickups found.</p>
                  <p className="mt-2 text-muted-foreground">Parts pickup items will appear here when they've been requested but not yet picked up.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead>Pickup Code</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPickups.map((pickup) => (
                      <TableRow key={pickup.id}>
                        <TableCell>
                          <div className="font-medium">{pickup.partName}</div>
                          {pickup.partNumber && <div className="text-sm text-muted-foreground">#{pickup.partNumber}</div>}
                        </TableCell>
                        <TableCell>{pickup.supplier || 'N/A'}</TableCell>
                        <TableCell>{pickup.quantity}</TableCell>
                        <TableCell>{pickup.building?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-lg font-bold">
                            {pickup.pickupCode || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{pickup.poNumber || 'N/A'}</TableCell>
                        <TableCell>{pickup.addedBy?.name || 'N/A'}</TableCell>
                        <TableCell>{pickup.addedAt ? format(new Date(pickup.addedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleMarkAsPickedUp(pickup.id)}
                              disabled={markAsPickedUpMutation.isPending}
                              className="whitespace-nowrap"
                            >
                              Mark Picked Up
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePickup(pickup.id)}
                              disabled={deletePickupMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Parts Pickups</CardTitle>
              <CardDescription>
                Parts that have already been picked up or received.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPickups ? (
                <div className="text-center py-4">Loading completed parts pickups...</div>
              ) : filteredPickups.length === 0 ? (
                <div className="text-center py-4">No completed parts pickups found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead>Pickup Code</TableHead>
                      <TableHead>Picked Up By</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPickups.map((pickup) => (
                      <TableRow key={pickup.id}>
                        <TableCell>
                          <div className="font-medium">{pickup.partName}</div>
                          {pickup.partNumber && <div className="text-sm text-muted-foreground">#{pickup.partNumber}</div>}
                        </TableCell>
                        <TableCell>{pickup.supplier || 'N/A'}</TableCell>
                        <TableCell>{pickup.quantity}</TableCell>
                        <TableCell>{pickup.building?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-lg font-bold">
                            {pickup.pickupCode || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{pickup.pickedUpBy?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {pickup.pickedUpAt 
                            ? format(new Date(pickup.pickedUpAt), 'MMM dd, yyyy') 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePickup(pickup.id)}
                            disabled={deletePickupMutation.isPending}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartsPickupPage;