import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, Map, Layers, Download, Upload, FileSpreadsheet, CheckSquare, XSquare } from 'lucide-react';

// Define schemas for form validation
const locationSchema = z.object({
  name: z.string().min(1, { message: "Location name is required" }),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

const shelfSchema = z.object({
  name: z.string().min(1, { message: "Shelf name is required" }),
  locationId: z.number({ required_error: "Location is required" }),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

// Types for our API data
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

type LocationWithShelves = Location & {
  shelves: Shelf[];
};

export default function LocationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("locations");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  // Location Dialog State
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  // Shelf Dialog State
  const [shelfDialogOpen, setShelfDialogOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  
  // Shelf bulk selection and delete
  const [selectedShelves, setSelectedShelves] = useState<number[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  // Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'location' | 'shelf', id: number, name: string } | null>(null);
  
  // Import/Export Dialog State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<'locations' | 'shelves'>('locations');
  const [importStatus, setImportStatus] = useState<{loading: boolean, success?: boolean, message?: string}>({loading: false});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: locations = [], isLoading: locationsLoading, error: locationsError } = useQuery<Location[]>({
    queryKey: ['/api/storage-locations'],
  });

  // Fixed query without the warnings
  const { data: shelves = [], isLoading: shelvesLoading, error: shelvesError } = useQuery<Shelf[]>({
    queryKey: ['/api/shelves'],
    staleTime: 0, // Always refetch
    refetchOnMount: true // Force refetch when component mounts
  });

  // Mutations for Locations
  const createLocationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof locationSchema>) => {
      const response = await fetch('/api/storage-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create location');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-locations'] });
      toast({
        title: "Success",
        description: "Location created successfully",
        variant: "default",
      });
      setLocationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<z.infer<typeof locationSchema>> }) => {
      const response = await fetch(`/api/storage-locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update location');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-locations'] });
      toast({
        title: "Success",
        description: "Location updated successfully",
        variant: "default",
      });
      setLocationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/storage-locations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shelves'] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
        variant: "default",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutations for Shelves
  const createShelfMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shelfSchema>) => {
      const response = await fetch('/api/shelves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shelf');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shelves'] });
      toast({
        title: "Success",
        description: "Shelf created successfully",
        variant: "default",
      });
      setShelfDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateShelfMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<z.infer<typeof shelfSchema>> }) => {
      const response = await fetch(`/api/shelves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update shelf');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shelves'] });
      toast({
        title: "Success",
        description: "Shelf updated successfully",
        variant: "default",
      });
      setShelfDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteShelfMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/shelves/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete shelf');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shelves'] });
      toast({
        title: "Success",
        description: "Shelf deleted successfully",
        variant: "default",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Bulk delete shelves mutation
  const bulkDeleteShelvesMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch('/api/shelves/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete shelves');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shelves'] });
      toast({
        title: "Success",
        description: `Successfully deleted ${data.deletedIds?.length || 0} shelves`,
        variant: "default",
      });
      setBulkDeleteDialogOpen(false);
      setSelectedShelves([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  const shelfForm = useForm<z.infer<typeof shelfSchema>>({
    resolver: zodResolver(shelfSchema),
    defaultValues: {
      name: "",
      description: "",
      locationId: selectedLocationId || undefined,
      active: true,
    },
  });

  function onLocationDialogOpen(location?: Location) {
    if (location) {
      setEditingLocation(location);
      locationForm.reset({
        name: location.name,
        description: location.description || "",
        active: location.active,
      });
    } else {
      setEditingLocation(null);
      locationForm.reset({
        name: "",
        description: "",
        active: true,
      });
    }
    setLocationDialogOpen(true);
  }

  function onShelfDialogOpen(shelf?: Shelf) {
    if (shelf) {
      setEditingShelf(shelf);
      shelfForm.reset({
        name: shelf.name,
        description: shelf.description || "",
        locationId: shelf.locationId,
        active: shelf.active,
      });
    } else {
      setEditingShelf(null);
      shelfForm.reset({
        name: "",
        description: "",
        locationId: selectedLocationId || undefined,
        active: true,
      });
    }
    setShelfDialogOpen(true);
  }

  function onLocationFormSubmit(values: z.infer<typeof locationSchema>) {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data: values });
    } else {
      createLocationMutation.mutate(values);
    }
  }

  function onShelfFormSubmit(values: z.infer<typeof shelfSchema>) {
    if (editingShelf) {
      updateShelfMutation.mutate({ id: editingShelf.id, data: values });
    } else {
      createShelfMutation.mutate(values);
    }
  }

  function handleDeleteClick(type: 'location' | 'shelf', id: number, name: string) {
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'location') {
      deleteLocationMutation.mutate(itemToDelete.id);
    } else {
      deleteShelfMutation.mutate(itemToDelete.id);
    }
  }

  // Filter shelves by selected location
  const filteredShelves = selectedLocationId
    ? shelves.filter(shelf => shelf.locationId === selectedLocationId)
    : shelves;
  
  // Get location name by id
  const getLocationName = (id: number) => {
    const location = locations.find(location => location.id === id);
    return location ? location.name : 'Unknown Location';
  };
  
  // Import/Export functions
  const downloadTemplate = async (type: 'locations' | 'shelves') => {
    try {
      const url = type === 'locations' 
        ? '/api/storage-locations/template' 
        : '/api/shelves/template';
        
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to get template');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = type === 'locations' ? 'storage_locations_template.xlsx' : 'shelves_template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'Success',
        description: `Template downloaded successfully`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };
  
  const exportData = async (type: 'locations' | 'shelves') => {
    try {
      const url = type === 'locations' 
        ? '/api/storage-locations/export' 
        : '/api/shelves/export';
        
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = type === 'locations' ? 'storage_locations.xlsx' : 'shelves.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'Success',
        description: `Data exported successfully`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: 'destructive',
      });
    }
  };
  
  const importData = async (file: File, type: 'locations' | 'shelves') => {
    try {
      setImportStatus({ loading: true });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const url = type === 'locations' 
        ? '/api/storage-locations/import' 
        : '/api/shelves/import';
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/storage-locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shelves'] });
      
      setImportStatus({ 
        loading: false, 
        success: true,
        message: `Successfully imported ${result.importedRows} ${type}. ${result.errors.length > 0 ? `${result.errors.length} errors occurred.` : ''}`
      });
      
      toast({
        title: 'Success',
        description: `Successfully imported ${result.importedRows} ${type}`,
        variant: 'default',
      });
      
      // Auto close after success
      setTimeout(() => {
        setImportDialogOpen(false);
        setImportStatus({ loading: false });
      }, 3000);
    } catch (error) {
      setImportStatus({ 
        loading: false, 
        success: false,
        message: error instanceof Error ? error.message : 'Import failed' 
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import data',
        variant: 'destructive',
      });
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file, importType);
    }
  };
  
  const openImportDialog = (type: 'locations' | 'shelves') => {
    setImportType(type);
    setImportStatus({ loading: false });
    setImportDialogOpen(true);
  };

  if (locationsLoading || shelvesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (locationsError || shelvesError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load storage locations and shelves. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Locations</h1>
          <p className="text-muted-foreground">Manage storage locations and shelves</p>
        </div>
        <div className="flex space-x-2">
          {/* Data Import/Export Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => activeTab === "locations" ? exportData('locations') : exportData('shelves')}>
              <Download className="h-4 w-4 mr-2" />
              Export {activeTab === "locations" ? "Locations" : "Shelves"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => activeTab === "locations" ? downloadTemplate('locations') : downloadTemplate('shelves')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => openImportDialog(activeTab === "locations" ? 'locations' : 'shelves')}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="locations" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="locations" onClick={() => setSelectedLocationId(null)}>
              <Map className="mr-2 h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="shelves">
              <Layers className="mr-2 h-4 w-4" />
              Shelves
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "locations" ? (
            <Button onClick={() => onLocationDialogOpen()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          ) : (
            <Button onClick={() => onShelfDialogOpen()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shelf
            </Button>
          )}
        </div>
        
        <TabsContent value="locations" className="space-y-4">
          {locations.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <Map className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No storage locations found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first storage location to start organizing your inventory.
                  </p>
                  <Button className="mt-4" onClick={() => onLocationDialogOpen()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <Card key={location.id} className={!location.active ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{location.name}</CardTitle>
                      {!location.active && (
                        <Badge variant="outline" className="ml-auto">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {location.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <p>
                        {shelves.filter(s => s.locationId === location.id).length} shelf units
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedLocationId(location.id);
                        setActiveTab("shelves");
                      }}
                    >
                      View Shelves
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onLocationDialogOpen(location)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteClick('location', location.id, location.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shelves" className="space-y-4">
          <div className="flex justify-between items-center">
            {selectedLocationId && (
              <div className="flex-1">
                <Alert>
                  <div className="flex justify-between items-center">
                    <div>
                      <AlertTitle>Filtered by location</AlertTitle>
                      <AlertDescription>
                        Showing shelves for location: {getLocationName(selectedLocationId)}
                      </AlertDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedLocationId(null)}
                    >
                      Show All
                    </Button>
                  </div>
                </Alert>
              </div>
            )}
            
            {filteredShelves.length > 0 && (
              <div className={`flex space-x-2 ${selectedLocationId ? 'ml-4' : 'ml-auto'}`}>
                {selectedShelves.length > 0 && (
                  <Button 
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedShelves.length})
                  </Button>
                )}
                <Button 
                  variant={selectedShelves.length > 0 ? "outline" : "default"}
                  onClick={() => setSelectedShelves(selectedShelves.length > 0 ? [] : filteredShelves.map(s => s.id))}
                >
                  {selectedShelves.length > 0 ? (
                    <>
                      <XSquare className="mr-2 h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Select All
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {filteredShelves.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No shelves found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedLocationId 
                      ? "Add shelves to this location to organize your parts."
                      : "Create shelves in your storage locations to organize your parts."}
                  </p>
                  <Button className="mt-4" onClick={() => onShelfDialogOpen()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shelf
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShelves.map((shelf) => (
                <Card 
                  key={shelf.id} 
                  className={`${!shelf.active ? "opacity-60" : ""} ${selectedShelves.includes(shelf.id) ? "border-primary border-2" : ""}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`shelf-${shelf.id}`}
                          checked={selectedShelves.includes(shelf.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedShelves([...selectedShelves, shelf.id]);
                            } else {
                              setSelectedShelves(selectedShelves.filter(id => id !== shelf.id));
                            }
                          }}
                        />
                        <CardTitle>{shelf.name}</CardTitle>
                      </div>
                      {!shelf.active && (
                        <Badge variant="outline" className="ml-auto">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {getLocationName(shelf.locationId)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {shelf.description || "No description"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onShelfDialogOpen(shelf)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteClick('shelf', shelf.id, shelf.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
            <DialogDescription>
              {editingLocation 
                ? "Update the details for this storage location."
                : "Add a new storage location for organizing parts inventory."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...locationForm}>
            <form onSubmit={locationForm.handleSubmit(onLocationFormSubmit)} className="space-y-4">
              <FormField
                control={locationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Stockroom, Warehouse" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={locationForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe the purpose or details of this location"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={locationForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive locations will not appear in selection dropdowns.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                >
                  {(createLocationMutation.isPending || updateLocationMutation.isPending) && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                  )}
                  {editingLocation ? "Update Location" : "Create Location"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Shelf Dialog */}
      <Dialog open={shelfDialogOpen} onOpenChange={setShelfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShelf ? "Edit Shelf" : "Add New Shelf"}</DialogTitle>
            <DialogDescription>
              {editingShelf 
                ? "Update the details for this shelf unit."
                : "Add a new shelf unit to organize parts within a location."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...shelfForm}>
            <form onSubmit={shelfForm.handleSubmit(onShelfFormSubmit)} className="space-y-4">
              <FormField
                control={shelfForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shelf Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Shelf A1, Rack B3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={shelfForm.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      >
                        <option value="">Select a location</option>
                        {locations
                          .filter(loc => loc.active)
                          .map(location => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))
                        }
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={shelfForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe the purpose or details of this shelf"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={shelfForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive shelves will not appear in selection dropdowns.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShelfDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createShelfMutation.isPending || updateShelfMutation.isPending}
                >
                  {(createShelfMutation.isPending || updateShelfMutation.isPending) && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                  )}
                  {editingShelf ? "Update Shelf" : "Create Shelf"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {itemToDelete?.type} "{itemToDelete?.name}"?
              {itemToDelete?.type === 'location' && (
                <div className="mt-2 text-destructive">
                  This will also delete all shelves associated with this location.
                </div>
              )}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={deleteLocationMutation.isPending || deleteShelfMutation.isPending}
              onClick={confirmDelete}
            >
              {(deleteLocationMutation.isPending || deleteShelfMutation.isPending) && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedShelves.length} selected shelves?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={bulkDeleteShelvesMutation.isPending}
              onClick={() => bulkDeleteShelvesMutation.mutate(selectedShelves)}
            >
              {bulkDeleteShelvesMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
              )}
              Delete {selectedShelves.length} Shelves
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import {importType === 'locations' ? 'Locations' : 'Shelves'}</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import {importType === 'locations' ? 'storage locations' : 'shelves'}.
              Please use the template for the correct format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm">Steps to import data:</p>
              <ol className="text-sm list-decimal pl-4">
                <li>Download the template using the Template button</li>
                <li>Fill in your data in the Excel spreadsheet</li>
                <li>Save the file and upload it below</li>
              </ol>
            </div>
            
            <Separator />
            
            {importStatus.loading ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-center">Importing data, please wait...</p>
              </div>
            ) : importStatus.success !== undefined ? (
              <Alert variant={importStatus.success ? "default" : "destructive"}>
                {importStatus.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{importStatus.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{importStatus.message}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-8">
                  <div className="text-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                    <p className="text-muted-foreground mb-2">
                      Click below to select an Excel file
                    </p>
                    <input
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select File
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    File must be in .xlsx format and match the template structure
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setImportStatus({ loading: false });
              }}
            >
              Close
            </Button>
            {!importStatus.loading && importStatus.success === undefined && (
              <Button
                variant="default"
                onClick={() => downloadTemplate(importType)}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Get Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}