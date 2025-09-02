import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, MapPin, Calculator, Truck, ScanLine, Plus, Edit, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Html5QrcodeScanner } from "html5-qrcode";

// Types and schemas
interface ScannedItem {
  id: string;
  partId: string;
  name: string;
  description?: string;
  barcode: string;
  quantity: number;
  unitCost?: string;
  reorderLevel?: number;
  currentQuantity?: number;
  action: 'update' | 'add';
}

const addPartSchema = z.object({
  partId: z.string().min(1, "Part ID required"),
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unitCost: z.string().optional(),
  reorderLevel: z.number().min(0).optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
});

type WorkflowMode = 'location-assignment' | 'physical-count' | 'receiving' | 'reorganizing';

export default function BulkInventoryPage() {
  // State
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('location-assignment');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [defaultLocationId, setDefaultLocationId] = useState<number | null>(null);
  const [defaultShelfId, setDefaultShelfId] = useState<number | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('manual');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [countMode, setCountMode] = useState<'location' | 'all'>('location');
  const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [pendingPart, setPendingPart] = useState<any>(null);
  const [pendingBarcode, setPendingBarcode] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [canScan, setCanScan] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [additionalQuantity, setAdditionalQuantity] = useState('');
  const [showAddQuantityInput, setShowAddQuantityInput] = useState(false);

  // Data queries
  const { data: locations = [], isLoading: locationsLoading, error: locationsError } = useQuery({
    queryKey: ["/api/storage-locations"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: shelves = [], isLoading: shelvesLoading, error: shelvesError } = useQuery({
    queryKey: ["/api/shelves"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Debug logging
  console.log('Bulk Inventory Data Debug:', {
    locations: locations,
    locationsLength: Array.isArray(locations) ? locations.length : 'Not array',
    locationsLoading,
    locationsError: locationsError?.message || null,
    shelves: shelves,
    shelvesLength: Array.isArray(shelves) ? shelves.length : 'Not array',
    shelvesLoading,
    shelvesError: shelvesError?.message || null
  });

  // Filter shelves by selected location
  const filteredShelves = Array.isArray(shelves) ? (shelves as any[]).filter((shelf: any) => 
    selectedLocationId ? shelf.locationId === selectedLocationId : false
  ) : [];

  // Filter shelves by default location for default shelf dropdown
  const defaultFilteredShelves = Array.isArray(shelves) ? (shelves as any[]).filter((shelf: any) => 
    defaultLocationId ? shelf.locationId === defaultLocationId : false
  ) : [];

  // Clear any auto-set defaults on first load and only restore user-chosen defaults
  useEffect(() => {
    if (Array.isArray(locations) && locations.length > 0 && !defaultLocationId) {
      // Clear any previously auto-set defaults (one-time cleanup)
      const wasAutoSet = localStorage.getItem('bulkInventoryAutoSet');
      if (!wasAutoSet) {
        localStorage.removeItem('bulkInventoryDefaultLocation');
        localStorage.removeItem('bulkInventoryDefaultShelf');
        localStorage.setItem('bulkInventoryAutoSet', 'cleared');
      }
      
      // Only load from localStorage if it was a genuine user choice (not auto-set)
      const savedDefaultLocation = localStorage.getItem('bulkInventoryDefaultLocation');
      const savedDefaultShelf = localStorage.getItem('bulkInventoryDefaultShelf');
      const userChosen = localStorage.getItem('bulkInventoryUserChosen');
      
      if (savedDefaultLocation && savedDefaultShelf && userChosen === 'true') {
        const locationId = parseInt(savedDefaultLocation);
        const shelfId = parseInt(savedDefaultShelf);
        
        // Verify the saved values are still valid
        const locationExists = locations.find((loc: any) => loc.id === locationId);
        const shelfExists = Array.isArray(shelves) ? shelves.find((shelf: any) => shelf.id === shelfId) : null;
        
        if (locationExists && shelfExists) {
          setDefaultLocationId(locationId);
          setDefaultShelfId(shelfId);
        }
      }
    }
  }, [locations, shelves, defaultLocationId]);

  // Save default location to localStorage when changed (mark as user-chosen)
  useEffect(() => {
    if (defaultLocationId) {
      localStorage.setItem('bulkInventoryDefaultLocation', defaultLocationId.toString());
      localStorage.setItem('bulkInventoryUserChosen', 'true');
    }
  }, [defaultLocationId]);

  useEffect(() => {
    if (defaultShelfId) {
      localStorage.setItem('bulkInventoryDefaultShelf', defaultShelfId.toString());
      localStorage.setItem('bulkInventoryUserChosen', 'true');
    }
  }, [defaultShelfId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper functions to get names
  const getLocationName = (locationId: number) => {
    const location = Array.isArray(locations) ? locations.find((loc: any) => loc.id === locationId) : null;
    return location ? location.name : 'Unknown Location';
  };

  const getShelfName = (shelfId: number) => {
    const shelf = Array.isArray(shelves) ? shelves.find((shelf: any) => shelf.id === shelfId) : null;
    return shelf ? shelf.name : 'Unknown Shelf';
  };

  // Function to apply default location when scanning starts
  const applyDefaultLocation = () => {
    if (defaultLocationId && defaultShelfId) {
      setSelectedLocationId(defaultLocationId);
      setSelectedShelfId(defaultShelfId);
      toast({
        title: "Default Location Applied",
        description: `Using ${getLocationName(defaultLocationId)} - ${getShelfName(defaultShelfId)} as target location`,
      });
    }
  };

  // Forms
  const addForm = useForm({
    resolver: zodResolver(addPartSchema),
    defaultValues: {
      partId: '',
      name: '',
      description: '',
      quantity: 0,
      unitCost: '',
      reorderLevel: 0,
      category: '',
      supplier: '',
    },
  });

  // Barcode scanner setup - only initialize when user clicks start
  useEffect(() => {
    if (isScanning && scannerContainerRef.current && scannerMode === 'camera') {
      const initScanner = async () => {
        try {
          scannerRef.current = new Html5QrcodeScanner(
            "barcode-scanner",
            {
              fps: 10,
              qrbox: { width: 300, height: 300 },
              aspectRatio: 1.0,
            },
            false
          );

          scannerRef.current.render(
            (decodedText) => {
              // Prevent rapid scanning
              const now = Date.now();
              if (now - lastScanTime < 1000 || !canScan) {
                return;
              }
              setLastScanTime(now);
              setCanScan(false);
              
              console.log("Bulk inventory barcode scanned:", decodedText);
              
              // Process the scanned barcode
              handleScan(decodedText);
              
              // Re-enable scanning after successful scan
              setTimeout(() => {
                setCanScan(true);
              }, 1000);
            },
            (errorMessage) => {
              // Handle camera permission errors
              if (errorMessage && errorMessage.includes('NotAllowedError')) {
                console.warn('Camera permission denied');
                if (scannerRef.current) {
                  scannerRef.current.clear();
                  scannerRef.current = null;
                }
                setIsScanning(false);
                setScannerMode('manual');
                toast({
                  title: "Camera Access Denied",
                  description: "Switched to manual entry mode. You can enter barcodes manually.",
                  variant: "destructive",
                });
              }
            }
          );
        } catch (error) {
          console.error('Scanner initialization error:', error);
          setIsScanning(false);
          setScannerMode('manual');
          toast({
            title: "Camera Error",
            description: "Unable to access camera. Using manual entry mode.",
            variant: "destructive",
          });
        }
      };

      initScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScanning, scannerMode]);

  // Load user data and check permissions
  // Authentication removed for now

  // Handle barcode scan - now prompts for quantity
  const handleScan = async (barcode: string) => {
    // Auto-apply default location if none selected
    if (!selectedLocationId || !selectedShelfId) {
      applyDefaultLocation();
    }
    
    try {
      const response = await fetch(`/api/parts-lookup/${barcode}`);
      
      if (response.ok) {
        const part = await response.json();
        
        // Always prompt for quantity when part exists
        setPendingPart(part);
        setPendingBarcode(barcode);
        setQuantityInput('1');
        setShowQuantityDialog(true);
        
        toast({
          title: "Part Found",
          description: `${part.name} - Enter quantity received`,
        });
      } else {
        // Part not found - automatically add with scanned barcode
        addForm.setValue('partId', barcode);
        addForm.setValue('name', ''); // Clear name so user can enter it
        addForm.setValue('description', '');
        addForm.setValue('quantity', 1);
        addForm.setValue('unitCost', '');
        addForm.setValue('reorderLevel', 0);
        setShowAddDialog(true);
        
        toast({
          title: "New Part",
          description: `Part ${barcode} not found - adding new part`,
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Error",
        description: "Failed to process barcode",
        variant: "destructive",
      });
    }
  };

  // Handle quantity confirmation
  const confirmQuantity = () => {
    if (!pendingPart || !quantityInput) return;
    
    const quantity = parseInt(quantityInput);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    // Check if already scanned
    const existingIndex = scannedItems.findIndex(item => item.partId === pendingPart.partId);
    
    if (existingIndex >= 0) {
      // Update existing quantity by adding to it
      const updated = [...scannedItems];
      updated[existingIndex].quantity += quantity;
      setScannedItems(updated);
      
      toast({
        title: "Quantity Added",
        description: `Added ${quantity} more ${pendingPart.name} (total: ${updated[existingIndex].quantity})`,
      });
    } else {
      // Add new item with specified quantity
      const newItem: ScannedItem = {
        id: Date.now().toString(),
        partId: pendingPart.partId,
        name: pendingPart.name,
        description: pendingPart.description,
        barcode: pendingBarcode,
        quantity: quantity,
        unitCost: pendingPart.unitCost,
        reorderLevel: pendingPart.reorderLevel,
        currentQuantity: pendingPart.quantity,
        action: 'update'
      };
      
      setScannedItems(prev => [...prev, newItem]);
      
      toast({
        title: "Part Added",
        description: `Added ${pendingPart.name} with quantity ${quantity}`,
      });
    }
    
    // Reset dialog state
    setShowQuantityDialog(false);
    setPendingPart(null);
    setPendingBarcode('');
    setQuantityInput('1');
  };

  // Real-time search function for autocomplete
  const handleSearchChange = async (searchTerm: string) => {
    setManualBarcode(searchTerm);
    
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      // First try exact barcode/partId lookup
      const barcodeResponse = await fetch(`/api/parts-lookup/${searchTerm}`);
      
      if (barcodeResponse.ok) {
        const part = await barcodeResponse.json();
        setSearchResults([part]);
        setShowSearchResults(true);
        return;
      }
      
      // If not found by barcode, search by description
      const searchResponse = await fetch(`/api/parts/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (searchResponse.ok) {
        const results = await searchResponse.json();
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle selecting a part from autocomplete
  const handleSelectPart = (part: any) => {
    // Auto-apply default location if none selected
    if (!selectedLocationId || !selectedShelfId) {
      applyDefaultLocation();
    }
    
    handleFoundPart(part, part.partId);
    setManualBarcode('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Handle creating new part when not found
  const handleCreateNewPart = () => {
    const searchTerm = manualBarcode.trim();
    
    addForm.setValue('partId', searchTerm);
    addForm.setValue('name', '');
    addForm.setValue('description', '');
    addForm.setValue('quantity', 1);
    addForm.setValue('unitCost', '');
    addForm.setValue('reorderLevel', 0);
    setShowAddDialog(true);
    
    setManualBarcode('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    toast({
      title: "New Part",
      description: `Part ${searchTerm} not found - adding new part`,
    });
  };

  // Helper function to handle found part
  const handleFoundPart = (part: any, searchTerm: string) => {
    setPendingPart(part);
    setPendingBarcode(searchTerm);
    setQuantityInput('1');
    setShowQuantityDialog(true);
    
    toast({
      title: "Part Found",
      description: `${part.name} - Enter quantity received`,
    });
  };

  // Legacy function for backward compatibility
  const handleManualScan = () => {
    handleManualSearch();
  };

  // Remove scanned item
  const removeScannedItem = (id: string) => {
    setScannedItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item removed from scan list",
    });
  };

  // Get location display name
  const getSelectedLocationName = () => {
    if (workflowMode === 'physical-count') {
      const location = Array.isArray(locations) ? locations.find((loc: any) => loc.id === selectedLocationId) : null;
      const shelf = Array.isArray(shelves) ? shelves.find((s: any) => s.id === selectedShelfId) : null;
      if (location && shelf) {
        return `Counting: ${location.name} - ${shelf.name}`;
      } else if (countMode === 'all') {
        return "Counting: All inventory";
      }
      return "Select location for focused count";
    }
    
    const location = Array.isArray(locations) ? locations.find((loc: any) => loc.id === selectedLocationId) : null;
    const shelf = Array.isArray(shelves) ? shelves.find((s: any) => s.id === selectedShelfId) : null;
    return location && shelf ? `${location.name} - ${shelf.name}` : "No location selected";
  };

  // Load existing inventory for count
  const loadExistingInventoryForCount = async () => {
    if (!selectedLocationId || !selectedShelfId) {
      toast({
        title: "Select Location",
        description: "Please select location and shelf first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/parts?locationId=${selectedLocationId}&shelfId=${selectedShelfId}`);
      if (response.ok) {
        const parts = await response.json();
        
        const loadedItems: ScannedItem[] = parts.map((part: any) => ({
          id: `loaded-${part.id}`,
          partId: part.partId,
          name: part.name,
          description: part.description,
          barcode: part.partId,
          quantity: part.quantity,
          unitCost: part.unitCost,
          reorderLevel: part.reorderLevel,
          currentQuantity: part.quantity,
          action: 'update' as const
        }));
        
        setScannedItems(loadedItems);
        
        toast({
          title: "Inventory Loaded",
          description: `Loaded ${parts.length} parts from ${getSelectedLocationName()}`,
        });
      }
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: "Load Error",
        description: "Failed to load existing inventory",
        variant: "destructive",
      });
    }
  };

  // Process bulk update
  const processBulkUpdate = useMutation({
    mutationFn: async () => {
      console.log('Starting bulk inventory update...');
      console.log('Scanned items:', scannedItems);
      console.log('Workflow mode:', workflowMode);
      console.log('Location ID:', selectedLocationId);
      console.log('Shelf ID:', selectedShelfId);

      if (scannedItems.length === 0) {
        throw new Error('No items to process');
      }

      if (!selectedLocationId || !selectedShelfId) {
        throw new Error('Please select location and shelf first');
      }

      const updates = scannedItems.map(item => ({
        partId: item.partId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost,
        reorderLevel: item.reorderLevel,
        locationId: selectedLocationId,
        shelfId: selectedShelfId,
        action: item.action
      }));

      console.log('Sending updates:', updates);

      const response = await apiRequest('POST', '/api/bulk-inventory-update', {
        updates,
        workflowMode,
        locationId: selectedLocationId,
        shelfId: selectedShelfId
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('API response:', result);
      return result;
    },
    onSuccess: (data) => {
      const itemCount = scannedItems.length;
      setScannedItems([]);
      
      // Invalidate multiple cache keys to refresh all inventory views
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      console.log('Bulk inventory update successful:', data);
      
      toast({
        title: "Bulk Update Complete",
        description: `Successfully processed ${itemCount} items. Inventory updated!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to process bulk update",
        variant: "destructive",
      });
    }
  });

  // Workflow descriptions
  const workflowDescriptions = {
    'location-assignment': 'Scan parts to assign them to a specific shelf location. Ideal for organizing new inventory or relocating existing parts.',
    'physical-count': 'Perform physical inventory counts by scanning items and updating quantities to match actual stock.',
    'receiving': 'Process incoming shipments by scanning new parts and adding them to inventory with proper location assignment.',
    'reorganizing': 'Reorganize existing inventory by scanning parts and moving them to new locations while maintaining accurate records.'
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold">Bulk Inventory Management</h1>
      </div>

      {/* Workflow Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Select Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={workflowMode === 'location-assignment' ? 'default' : 'outline'}
              className="h-auto p-3 text-left flex flex-col items-center gap-2"
              onClick={() => setWorkflowMode('location-assignment')}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">Assign Location</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Scan parts to assign them to a shelf location
              </p>
            </Button>

            <Button
              variant={workflowMode === 'physical-count' ? 'default' : 'outline'}
              className="h-auto p-3 text-left flex flex-col items-center gap-2"
              onClick={() => setWorkflowMode('physical-count')}
            >
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <span className="font-semibold">Physical Count</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Count inventory by scanning items and updating quantities
              </p>
            </Button>

            <Button
              variant={workflowMode === 'receiving' ? 'default' : 'outline'}
              className="h-auto p-3 text-left flex flex-col items-center gap-2"
              onClick={() => setWorkflowMode('receiving')}
            >
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <span className="font-semibold">Receiving</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Process incoming shipments and add to inventory
              </p>
            </Button>

            <Button
              variant={workflowMode === 'reorganizing' ? 'default' : 'outline'}
              className="h-auto p-3 text-left flex flex-col items-center gap-2"
              onClick={() => setWorkflowMode('reorganizing')}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                <span className="font-semibold">Reorganizing</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Move existing parts to new locations
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Target Location & Shelf
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Location Settings */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="text-sm font-semibold mb-3 text-blue-900">Default Location (Auto-applies when scanning)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultLocation">Default Location</Label>
                <Select
                  value={defaultLocationId?.toString() || ''}
                  onValueChange={(value) => {
                    const locationId = Number(value);
                    setDefaultLocationId(locationId);
                    setDefaultShelfId(null);
                    // Clear any auto-selected shelf when location changes
                    localStorage.removeItem('bulkInventoryDefaultShelf');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default location" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(locations) && locations.length > 0 ? (
                      locations.map((location: any) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No locations available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultShelf">Default Shelf</Label>
                <Select
                  value={defaultShelfId?.toString() || ''}
                  onValueChange={(value) => {
                    const shelfId = Number(value);
                    setDefaultShelfId(shelfId);
                  }}
                  disabled={!defaultLocationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={defaultLocationId ? "Select default shelf" : "Select location first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultFilteredShelves.length > 0 ? (
                      defaultFilteredShelves.map((shelf: any) => (
                        <SelectItem key={shelf.id} value={shelf.id.toString()}>
                          {shelf.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {defaultLocationId ? "No shelves in this location" : "Select location first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {defaultLocationId && defaultShelfId ? (
              <div className="mt-3 space-y-2">
                <div className="p-2 bg-blue-100 rounded text-sm text-blue-800">
                  Default: {getLocationName(defaultLocationId)} - {getShelfName(defaultShelfId)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={applyDefaultLocation}
                    variant="outline" 
                    size="sm"
                  >
                    Apply Default to Current Target
                  </Button>
                  <Button 
                    onClick={() => {
                      setDefaultLocationId(null);
                      setDefaultShelfId(null);
                      localStorage.removeItem('bulkInventoryDefaultLocation');
                      localStorage.removeItem('bulkInventoryDefaultShelf');
                      localStorage.removeItem('bulkInventoryUserChosen');
                      toast({
                        title: "Default Cleared",
                        description: "Default location has been cleared",
                      });
                    }}
                    variant="outline" 
                    size="sm"
                  >
                    Clear Default
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-600">
                No default location set. Select location and shelf above to set a default.
              </div>
            )}
          </div>

          {/* Current Target Location */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Current Target Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={selectedLocationId?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedLocationId(Number(value));
                  setSelectedShelfId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select location"} />
                </SelectTrigger>
                <SelectContent>
                  {locationsLoading ? (
                    <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                  ) : Array.isArray(locations) && locations.length > 0 ? (
                    locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No locations available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {locationsLoading && <p className="text-sm text-muted-foreground mt-1">Loading locations...</p>}
              {!locationsLoading && (!Array.isArray(locations) || locations.length === 0) && (
                <p className="text-sm text-red-600 mt-1">No locations found</p>
              )}
            </div>

            <div>
              <Label htmlFor="shelf">Shelf</Label>
              <Select
                value={selectedShelfId?.toString() || ''}
                onValueChange={(value) => setSelectedShelfId(Number(value))}
                disabled={!selectedLocationId || shelvesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedLocationId ? "Select location first" :
                    shelvesLoading ? "Loading shelves..." : 
                    "Select shelf"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {shelvesLoading ? (
                    <SelectItem value="loading" disabled>Loading shelves...</SelectItem>
                  ) : filteredShelves.length > 0 ? (
                    filteredShelves.map((shelf: any) => (
                      <SelectItem key={shelf.id} value={shelf.id.toString()}>
                        {shelf.name}
                      </SelectItem>
                    ))
                  ) : selectedLocationId ? (
                    <SelectItem value="none" disabled>No shelves available for this location</SelectItem>
                  ) : (
                    <SelectItem value="none" disabled>Select location first</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {shelvesLoading && <p className="text-sm text-muted-foreground mt-1">Loading shelves...</p>}
              {!shelvesLoading && selectedLocationId && filteredShelves.length === 0 && (
                <p className="text-sm text-red-600 mt-1">No shelves found for selected location</p>
              )}
            </div>

            {selectedLocationId && selectedShelfId && (
              <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                Current Target: {getLocationName(selectedLocationId)} - {getShelfName(selectedShelfId)}
              </div>
            )}
          </div>

          {/* Debug information - temporarily hidden */}
          {false && (
            <div className="text-xs text-muted-foreground space-y-1 mt-2 border p-2 rounded">
              <p><strong>Data Status:</strong></p>
              <p>• Locations: {Array.isArray(locations) ? locations.length : 'None'} ({locationsLoading ? 'Loading...' : locationsError ? `Error: ${locationsError.message}` : 'Ready'})</p>
              <p>• Shelves: {Array.isArray(shelves) ? shelves.length : 'None'} ({shelvesLoading ? 'Loading...' : shelvesError ? `Error: ${shelvesError.message}` : 'Ready'})</p>
              <p>• Selected Location: {selectedLocationId || 'None'} | Filtered Shelves: {filteredShelves.length}</p>
              {locationsError && <p className="text-red-600">Locations Error: {locationsError.message}</p>}
              {shelvesError && <p className="text-red-600">Shelves Error: {shelvesError.message}</p>}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
              {getSelectedLocationName()}
            </Badge>
            
            {workflowMode === 'physical-count' && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadExistingInventoryForCount}
                disabled={!selectedLocationId || !selectedShelfId}
              >
                Load Existing Inventory
              </Button>
            )}
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Barcode Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={scannerMode} onValueChange={(value) => setScannerMode(value as 'camera' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="camera">Camera Scanner</TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera" className="space-y-4">
              <div className="text-center py-8">
                <div className="space-y-4">
                  <p className="text-lg font-medium">Camera Scanner</p>
                  <p className="text-sm text-muted-foreground">
                    Point your camera at a barcode to scan parts
                  </p>
                  {!isScanning ? (
                    <Button
                      onClick={() => setIsScanning(true)}
                      className="flex items-center gap-2"
                    >
                      <ScanLine className="h-4 w-4" />
                      Start Camera Scanner
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div 
                        id="barcode-scanner"
                        ref={scannerContainerRef}
                        className="w-full min-h-[300px] border rounded-lg bg-gray-50"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => {
                            if (scannerRef.current) {
                              scannerRef.current.clear();
                              scannerRef.current = null;
                            }
                            setIsScanning(false);
                          }}
                          variant="outline"
                        >
                          Stop Scanning
                        </Button>
                        <Button 
                          onClick={() => {
                            if (scannerRef.current) {
                              scannerRef.current.clear();
                              scannerRef.current = null;
                            }
                            setIsScanning(false);
                            setScannerMode('manual');
                          }}
                          variant="secondary"
                        >
                          Use Manual Entry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div className="relative" ref={searchDropdownRef}>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter barcode, part number, or description..."
                        value={manualBarcode}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-1"
                      />
                      {/* Real-time search results dropdown */}
                      {showSearchResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 border rounded-md bg-white shadow-lg overflow-hidden mt-1">
                          <div className="bg-muted/50 px-3 py-1 text-xs font-medium border-b">
                            {searchResults.length} part(s) found
                          </div>
                          <div className="max-h-[200px] overflow-y-auto">
                            {searchResults.slice(0, 10).map(part => (
                              <button
                                key={part.id}
                                type="button"
                                className="w-full text-left px-3 py-2 border-b last:border-0 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                                onClick={() => handleSelectPart(part)}
                              >
                                <div className="font-medium truncate">{part.name}</div>
                                <div className="text-xs text-muted-foreground flex justify-between">
                                  <span>{part.partId}</span>
                                  <span className={part.quantity < part.reorderLevel ? 'text-red-500' : ''}>
                                    {part.quantity} in stock
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Show "Add New Part" button when no results but has search text */}
                    {manualBarcode.trim() && (!showSearchResults || searchResults.length === 0) && (
                      <Button 
                        onClick={handleCreateNewPart}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Part
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Start typing to search for parts by barcode, part number, or description. Select from the dropdown or create a new part.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Scanned Items */}
      {scannedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scanned Items ({scannedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scannedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.partId} • Qty: {item.quantity}
                      {item.unitCost && ` • $${item.unitCost}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeScannedItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  console.log('Apply Changes clicked');
                  console.log('Current state:', {
                    scannedItemsCount: scannedItems.length,
                    selectedLocationId,
                    selectedShelfId,
                    workflowMode,
                    isPending: processBulkUpdate.isPending
                  });
                  processBulkUpdate.mutate();
                }}
                disabled={!selectedLocationId || !selectedShelfId || processBulkUpdate.isPending || scannedItems.length === 0}
                className="flex-1"
              >
                {processBulkUpdate.isPending ? "Processing..." : `Apply Changes (${scannedItems.length} items)`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setScannedItems([])}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quantity Dialog */}
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Quantity</DialogTitle>
            <DialogDescription>
              {pendingPart && `How many ${pendingPart.name} did you receive?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity Received</Label>
              <Input
                id="quantity"
                type="number"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                min="1"
                className="mt-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmQuantity();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowQuantityDialog(false);
                  setPendingPart(null);
                  setPendingBarcode('');
                  setQuantityInput('1');
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmQuantity}>
                Add to List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => {
        if (!open) {
          setEditingItem(null);
          setAdditionalQuantity('');
          setShowAddQuantityInput(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the quantity and details for {editingItem?.name}
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-quantity">Quantity (Current: {editingItem.quantity})</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      setEditingItem({...editingItem, quantity: newQuantity});
                    }}
                    min="0"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddQuantityInput(!showAddQuantityInput)}
                  >
                    {showAddQuantityInput ? 'Cancel' : 'Add More'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter total quantity or click "Add More" to add additional items
                </p>
                {showAddQuantityInput && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Additional quantity"
                      value={additionalQuantity}
                      onChange={(e) => setAdditionalQuantity(e.target.value)}
                      min="1"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const additional = parseInt(additionalQuantity);
                          if (additional && additional > 0) {
                            setEditingItem({...editingItem, quantity: editingItem.quantity + additional});
                            setAdditionalQuantity('');
                            setShowAddQuantityInput(false);
                            toast({
                              title: "Quantity Added",
                              description: `Added ${additional} more items`,
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const additional = parseInt(additionalQuantity);
                        if (additional && additional > 0) {
                          setEditingItem({...editingItem, quantity: editingItem.quantity + additional});
                          setAdditionalQuantity('');
                          setShowAddQuantityInput(false);
                          toast({
                            title: "Quantity Added",
                            description: `Added ${additional} more items`,
                          });
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="edit-cost">Unit Cost ($)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  value={editingItem.unitCost || ''}
                  onChange={(e) => {
                    setEditingItem({...editingItem, unitCost: e.target.value});
                  }}
                  min="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-reorder">Reorder Level</Label>
                <Input
                  id="edit-reorder"
                  type="number"
                  value={editingItem.reorderLevel || 0}
                  onChange={(e) => {
                    const newReorderLevel = parseInt(e.target.value) || 0;
                    setEditingItem({...editingItem, reorderLevel: newReorderLevel});
                  }}
                  min="0"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingItem(null);
                    setAdditionalQuantity('');
                    setShowAddQuantityInput(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Update the item in scannedItems
                    setScannedItems(prev => prev.map(item => 
                      item.id === editingItem.id ? editingItem : item
                    ));
                    setEditingItem(null);
                    setAdditionalQuantity('');
                    setShowAddQuantityInput(false);
                    toast({
                      title: "Item Updated",
                      description: `${editingItem.name} has been updated`,
                    });
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Part Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
            <DialogDescription>
              This barcode was not found. Please provide part details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => {
              const newItem: ScannedItem = {
                id: Date.now().toString(),
                partId: data.partId,
                name: data.name,
                description: data.description,
                barcode: data.partId,
                quantity: data.quantity,
                unitCost: data.unitCost,
                reorderLevel: data.reorderLevel,
                action: 'add'
              };
              
              setScannedItems(prev => [...prev, newItem]);
              setShowAddDialog(false);
              addForm.reset();
              
              toast({
                title: "Part Added",
                description: `${data.name} added to scan list`,
              });
            })} className="space-y-4">
              
              <FormField
                control={addForm.control}
                name="partId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
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
                control={addForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Part</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


    </div>
  );
}