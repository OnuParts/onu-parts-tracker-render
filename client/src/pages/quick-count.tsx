import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Loader2, 
  Save,
  Minus,
  Package2,
  RotateCcw,
  ScanBarcode,
  List,
  ChevronsUpDown,
  Plus,
  CheckCircle2,
  ClipboardList,
  MapPin
} from "lucide-react";
import type { Part, PartsToCountWithDetails, StorageLocation, Shelf } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { SimpleBarcodeScanner } from "@/components/barcode/SimpleBarcodeScanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CountItem = {
  partId: string;
  name: string;
  originalQuantity: number;
  newQuantity: number;
  displayValue: string; // Store the actual input value as string
  changed: boolean;
  id: number;
};

export default function QuickCount() {
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [currentPartId, setCurrentPartId] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isAllPartsOpen, setIsAllPartsOpen] = useState(false);
  const [selectedParts, setSelectedParts] = useState<{[id: number]: boolean}>({});
  const [partsListFilter, setPartsListFilter] = useState("");
  const [activeTab, setActiveTab] = useState("manual-count");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Check for query parameters (used when redirected from parts inventory with critical parts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const addCritical = params.get('addCritical');
    
    // Set active tab if specified
    if (tab === 'manage' && user?.role === 'admin') {
      setActiveTab('manage-count');
    }
    
    // Handle critical parts selection from inventory page
    if (addCritical === 'true') {
      try {
        const criticalPartIds = JSON.parse(localStorage.getItem('criticalPartsForQuickCount') || '[]');
        if (criticalPartIds.length > 0) {
          // Set the selected parts
          const selectedPartsObj = criticalPartIds.reduce((acc: Record<number, boolean>, id: number) => {
            acc[id] = true;
            return acc;
          }, {});
          
          setSelectedParts(selectedPartsObj);
          
          // Clean up localStorage
          localStorage.removeItem('criticalPartsForQuickCount');
          
          // Show toast notification
          toast({
            title: "Critical Parts Selected",
            description: `${criticalPartIds.length} critical stock parts ready to assign.`,
          });
        }
      } catch (error) {
        console.error("Error processing critical parts from localStorage:", error);
      }
      
      // Clean up URL without refreshing page
      window.history.replaceState({}, document.title, '/quick-count');
    }
  }, [toast, user]);
  
  // Fetch assigned parts to count (for student role)
  const { data: assignedParts = [], isLoading: assignedPartsLoading } = useQuery<PartsToCountWithDetails[]>({
    queryKey: ['/api/parts-to-count/pending'],
    queryFn: async () => { // No signal parameter to avoid AbortErrors
      try {
        // First check if we're the right role - skip the request entirely if admin
        // We know admin role can't access this endpoint, so don't even try
        // This avoids the 403 error completely
        const userResponse = await fetch('/api/current-user', {
          cache: 'no-cache' // Ensure we get fresh data
        });
        const userData = await userResponse.json();
        
        // Allow both students and admins to get assigned parts
        if (userData?.role !== 'student' && userData?.role !== 'admin') {
          console.log('User does not have permission to view pending parts');
          return [];
        }
        
        // Both students and admins can perform parts counting
        const response = await fetch('/api/parts-to-count/pending', {
          cache: 'no-cache' // Ensure we get fresh data
        });
        if (!response.ok) {
          throw new Error('Failed to fetch assigned parts');
        }
        
        // Parse the response
        const assignments = await response.json();
        
        // If assignments doesn't contain 'part' objects, we need to fetch parts separately
        if (assignments && Array.isArray(assignments) && assignments.length > 0 && !assignments[0].part) {
          console.log("Parts not included in pending assignments, fetching parts...");
          
          try {
            // Fetch all parts to join with assignments (no signal)
            const partsResponse = await fetch('/api/parts', { 
              cache: 'no-cache' // Ensure we get fresh data
            });
            if (!partsResponse.ok) {
              throw new Error('Failed to fetch parts for assignments');
            }
            
            const parts = await partsResponse.json();
            
            // Join the parts data with the assignments
            return assignments.map(assignment => {
              const part = parts.find((p: Part) => p.id === assignment.partId);
              return {
                ...assignment,
                part: part || null
              };
            });
          } catch (partsError) {
            console.error("Error fetching parts for pending assignments:", partsError);
            // Return the assignments without parts data
            return assignments;
          }
        }
        
        return assignments;
      } catch (error) {
        console.error("Error fetching pending parts:", error);
        // Return empty array for any error - no need to rethrow
        return [];
      }
    },
    // Only show loading state when we have data loading
    enabled: true,
    // Don't retry failed queries - we're handling errors silently
    retry: false
  });
  
  // Use effect to auto-load assigned parts for Student users after data loads
  useEffect(() => {
    // Only auto-load if user is a student and we have data
    if (user?.role === 'student' && assignedParts && assignedParts.length > 0) {
      // Filter out parts that are already in the count list
      const newParts = assignedParts
        .filter(assignment => assignment.part && !countItems.some(item => item.id === assignment.part.id))
        .map(assignment => assignment.part)
        .filter(Boolean);
      
      if (newParts.length > 0) {
        // Automatically add all assigned parts to the count list
        const newCountItems = newParts.map(part => ({
          partId: part.partId,
          name: part.name,
          originalQuantity: part.quantity,
          newQuantity: part.quantity,
          displayValue: part.quantity.toString(),
          changed: false,
          id: part.id
        }));
        
        // Update the count items state
        setCountItems(prev => [...prev, ...newCountItems]);
        
        console.log(`Auto-loaded ${newParts.length} assigned parts for counting`);
        
        // Show toast notification
        toast({
          title: "Parts Loaded",
          description: `${newParts.length} assigned parts loaded for counting.`,
        });
      }
    }
  // Only run this when assignedParts loads or changes
  }, [assignedParts, user?.role, countItems, toast]);
  
  // Fetch all parts to count (for admin role to view all assignments)
  const { data: allAssignedParts = [], isLoading: allAssignedPartsLoading } = useQuery<PartsToCountWithDetails[]>({
    queryKey: ['/api/parts-to-count'],
    queryFn: async () => { // No signal parameter used
      try {
        // Check user role for proper permissions
        const userResponse = await fetch('/api/current-user', {
          // Use no-cache for all requests to ensure fresh data
          cache: 'no-cache'
        });
        const userData = await userResponse.json();
        
        // Proceed with fetching assignments
        const response = await fetch('/api/parts-to-count', {
          // Use no-cache for all requests to ensure fresh data
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            console.log('Access denied to parts-to-count endpoint');
            return [];
          }
          throw new Error('Failed to fetch all parts to count');
        }
        
        // Parse the response
        const assignments = await response.json();
        
        // If assignments doesn't contain 'part' objects, we need to fetch parts separately
        if (assignments && Array.isArray(assignments) && assignments.length > 0 && !assignments[0].part) {
          console.log("Parts not included in assignments, fetching parts...");
          
          try {
            // Fetch all parts to join with assignments - no signal
            const partsResponse = await fetch('/api/parts', {
              // Use no-cache for all requests to ensure fresh data
              cache: 'no-cache'
            });
            
            if (!partsResponse.ok) {
              throw new Error('Failed to fetch parts for assignments');
            }
            
            const parts = await partsResponse.json();
            
            // Join the parts data with the assignments
            return assignments.map(assignment => {
              // Use a proper type for the parameter
              const part = parts.find((p: Part) => p.id === assignment.partId);
              return {
                ...assignment,
                part: part || null
              };
            });
          } catch (partsError) {
            console.error("Error fetching parts for assignments:", partsError);
            // Return the assignments without parts data
            return assignments;
          }
        }
        
        return assignments;
      } catch (error) {
        console.error("Error fetching all assigned parts:", error);
        // Return empty array for any error - no need to rethrow
        return [];
      }
    },
    // Don't retry failed queries - we're handling errors silently
    retry: false
  });
  
  // Create new parts to count assignment (for admin role)
  const createAssignmentMutation = useMutation({
    mutationFn: async (partIds: number[]) => {
      const results = [];
      // Process one at a time to avoid race conditions
      for (const partId of partIds) {
        const response = await apiRequest("POST", "/api/parts-to-count", { partId });
        const data = await response.json();
        results.push(data);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-to-count'] });
      toast({
        title: 'Parts Assigned',
        description: 'Successfully assigned parts for counting.',
      });
      setSelectedParts({});
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to assign parts: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Mark a parts to count assignment as completed
  const completeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return apiRequest("PATCH", `/api/parts-to-count/${assignmentId}`, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-to-count/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-to-count'] });
      toast({
        title: 'Assignment Completed',
        description: 'Successfully marked assignment as completed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to complete assignment: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete a parts to count assignment (for admin role)
  // State for selected assignments to delete
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  
  // Handler for selecting all assignments
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all valid assignments
      const allIds = allAssignedParts?.filter(a => a && a.id).map(a => a.id) || [];
      setSelectedAssignments(allIds);
    } else {
      // Deselect all
      setSelectedAssignments([]);
    }
  };
  
  // Handler for selecting a single assignment
  const handleSelectAssignment = (assignmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedAssignments(prev => [...prev, assignmentId]);
    } else {
      setSelectedAssignments(prev => prev.filter(id => id !== assignmentId));
    }
  };
  
  // Individual delete mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return apiRequest("DELETE", `/api/parts-to-count/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-to-count'] });
      toast({
        title: 'Assignment Deleted',
        description: 'Successfully deleted assignment.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete assignment: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Bulk delete mutation
  const bulkDeleteAssignmentsMutation = useMutation({
    mutationFn: async (assignmentIds: number[]) => {
      // Execute deletions sequentially to avoid overwhelming the server
      for (const id of assignmentIds) {
        await apiRequest("DELETE", `/api/parts-to-count/${id}`);
      }
      return { success: true, count: assignmentIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-to-count'] });
      toast({
        title: 'Assignments Deleted',
        description: `Successfully deleted ${data.count} assignments.`,
      });
      // Clear selection after successful deletion
      setSelectedAssignments([]);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete assignments: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Function to assign selected parts for counting
  const assignSelectedPartsForCounting = () => {
    const selectedPartIds = Object.keys(selectedParts)
      .filter(id => selectedParts[parseInt(id)])
      .map(id => parseInt(id));
    
    if (selectedPartIds.length === 0) {
      toast({
        title: "No Parts Selected",
        description: "Please select at least one part to assign for counting.",
        variant: "destructive"
      });
      return;
    }
    
    createAssignmentMutation.mutate(selectedPartIds);
  };

  // Fetch storage locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery<StorageLocation[]>({
    queryKey: ['/api/storage-locations'],
    retry: false,
  });
  
  // Fetch shelves based on selected location
  const { data: shelves = [], isLoading: shelvesLoading } = useQuery<Shelf[]>({
    queryKey: ['/api/shelves/by-location', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId || selectedLocationId === "all") return [];
      const response = await fetch(`/api/shelves/by-location/${selectedLocationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shelves');
      }
      return response.json();
    },
    enabled: !!selectedLocationId && selectedLocationId !== "all",
    retry: false,
  });
  
  // Fetch parts by location/shelf if filters are selected
  const { data: parts, isLoading } = useQuery<Part[]>({
    queryKey: ['/api/parts', selectedLocationId, selectedShelfId],
    queryFn: async () => {
      let url = '/api/parts';
      
      // If location/shelf filters are selected, use the getPartsByLocation endpoint
      if ((selectedLocationId && selectedLocationId !== "all") || (selectedShelfId && selectedShelfId !== "all")) {
        url = '/api/parts?';
        if (selectedLocationId && selectedLocationId !== "all") {
          url += `locationId=${selectedLocationId}`;
        }
        if (selectedShelfId && selectedShelfId !== "all") {
          url += `${selectedLocationId && selectedLocationId !== "all" ? '&' : ''}shelfId=${selectedShelfId}`;
        }
      }
      
      const response = await fetch(url, {
        cache: 'no-cache' // Ensure we get fresh data
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch parts');
      }
      
      return response.json();
    },
    // Don't retry failed queries - we're handling errors silently
    retry: false,
  });

  // Filter parts based on search
  const filteredParts = parts?.filter((part: Part) => {
    // For part ID search via the main input
    if (currentPartId) {
      const searchLower = currentPartId.toLowerCase();
      return part.partId.toLowerCase().includes(searchLower);
    }
    
    // For name search via the dedicated name search field
    if (nameSearch && nameSearch.length >= 3) {
      const searchLower = nameSearch.toLowerCase();
      return part.name.toLowerCase().includes(searchLower);
    }
    
    // If no search criteria, don't show any results
    return false;
  }) || [];

  // Add part to count list when selected
  const addPartToCount = (part: Part) => {
    if (countItems.some(item => item.partId === part.partId)) {
      // Part already in list, focus on its input
      const inputElement = document.getElementById(`quantity-${part.partId}`);
      if (inputElement) {
        inputElement.focus();
      }
      return;
    }

    setCountItems(prev => [
      ...prev, 
      {
        partId: part.partId,
        name: part.name,
        originalQuantity: part.quantity,
        newQuantity: part.quantity,
        displayValue: part.quantity.toString(),
        changed: false,
        id: part.id
      }
    ]);

    setCurrentPartId("");
    setNameSearch("");

    // Focus on the new input after rendering
    setTimeout(() => {
      const inputElement = document.getElementById(`quantity-${part.partId}`);
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Handle scanning a part ID
  const handleScan = () => {
    if (!currentPartId) return;
    
    const part = parts?.find((p: Part) => p.partId === currentPartId);
    if (part) {
      addPartToCount(part);
    } else {
      toast({
        title: "Part Not Found",
        description: `No part found with ID: ${currentPartId}`,
        variant: "destructive"
      });
    }
  };
  
  // Handle barcode detection from camera
  const handleBarcodeDetection = (barcodeData: string) => {
    setCurrentPartId(barcodeData);
    
    // Find and add the part
    const part = parts?.find((p: Part) => p.partId === barcodeData);
    if (part) {
      addPartToCount(part);
      // Close scanner after successful detection
      setShowScanner(false);
      toast({
        title: "Part Scanned",
        description: `Added ${part.name} to count list.`,
      });
    } else {
      toast({
        title: "Part Not Found",
        description: `No part found with barcode: ${barcodeData}`,
        variant: "destructive"
      });
    }
  };

  // Handle quantity change
  const handleQuantityChange = (partId: string, value: string) => {
    setCountItems(prev => prev.map(item => {
      if (item.partId === partId) {
        // Allow empty string and preserve the display value
        const numValue = value === '' ? 0 : parseInt(value) || 0;
        const changed = numValue !== item.originalQuantity;
        return { 
          ...item, 
          newQuantity: numValue,
          displayValue: value, // Store the actual input string
          changed 
        };
      }
      return item;
    }));
  };

  // Update quantities mutation
  const updateMutation = useMutation({
    mutationFn: async (items: { partId: string, quantity: number }[]) => {
      const response = await apiRequest("POST", "/api/parts/batch-update", items);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/low-stock'] });
      toast({
        title: "Quantities Updated",
        description: `Successfully updated ${changedItems.length} part quantities.`,
      });
      setCountItems([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update quantities: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Get changed items
  const changedItems = countItems.filter(item => item.changed);

  // Save all changes
  const saveChanges = () => {
    if (changedItems.length === 0) {
      toast({
        title: "No Changes",
        description: "No quantities have been changed.",
      });
      return;
    }

    const updates = changedItems.map(item => ({
      partId: item.partId,
      quantity: item.newQuantity
    }));

    updateMutation.mutate(updates);
  };

  // Remove item from count list
  const removeItem = (partId: string) => {
    setCountItems(prev => prev.filter(item => item.partId !== partId));
  };

  // Reset an item to original quantity
  const resetItem = (partId: string) => {
    setCountItems(prev => prev.map(item => {
      if (item.partId === partId) {
        return { ...item, newQuantity: item.originalQuantity, changed: false };
      }
      return item;
    }));
  };

  // Part selection methods for multi-select
  const togglePartSelection = (partId: number) => {
    setSelectedParts(prev => {
      const newSelection = { ...prev };
      newSelection[partId] = !prev[partId];
      return newSelection;
    });
  };

  const addSelectedPartsToCount = () => {
    const selectedPartIds = Object.keys(selectedParts)
      .filter(id => selectedParts[parseInt(id)])
      .map(id => parseInt(id));
    
    if (selectedPartIds.length === 0) {
      toast({
        title: "No Parts Selected",
        description: "Please select at least one part to add to the count list.",
        variant: "destructive"
      });
      return;
    }

    // Find the selected parts and add them to the count list
    const partsToAdd = parts?.filter(part => selectedPartIds.includes(part.id)) || [];
    
    // Filter out parts that are already in the count list
    const newPartsToAdd = partsToAdd.filter(part => 
      !countItems.some(item => item.partId === part.partId)
    );

    if (newPartsToAdd.length === 0) {
      toast({
        title: "Parts Already Added",
        description: "All selected parts are already in the count list."
      });
      return;
    }

    // Add the new parts to the count list
    const newCountItems = newPartsToAdd.map(part => ({
      partId: part.partId,
      name: part.name,
      originalQuantity: part.quantity,
      newQuantity: part.quantity,
      displayValue: part.quantity.toString(),
      changed: false,
      id: part.id
    }));

    setCountItems(prev => [...prev, ...newCountItems]);
    
    // Clear the selection
    setSelectedParts({});
    
    toast({
      title: "Parts Added",
      description: `Added ${newPartsToAdd.length} parts to the count list.`,
    });
  };

  // Get filtered parts list for the browse all parts section
  const filteredAllParts = parts?.filter((part: Part) => {
    if (!partsListFilter) return true;
    const filter = partsListFilter.toLowerCase();
    return (
      part.partId.toLowerCase().includes(filter) ||
      part.name.toLowerCase().includes(filter) ||
      (part.category?.toLowerCase() || "").includes(filter)
    );
  }) || [];
  
  // Group parts by category for organized display
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  
  // Calculate current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAllParts.slice(indexOfFirstItem, indexOfLastItem);
  
  // Change page
  const totalPages = Math.ceil(filteredAllParts.length / itemsPerPage);
  
  // Parts grouped by category for organization
  const partsByCategory = filteredAllParts.reduce((acc: Record<string, Part[]>, part: Part) => {
    const category = part.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(part);
    return acc;
  }, {} as Record<string, Part[]>);
  
  // Get categories in alphabetical order
  const categories = Object.keys(partsByCategory).sort();

  // Column definitions for the count table
  // Define column types to match the expected DataTable format
  type ColumnDef = {
    header: string;
    accessor: keyof CountItem | ((item: CountItem) => React.ReactNode);
    className?: string;
  };

  const columns: ColumnDef[] = [
    {
      header: "Part ID",
      accessor: "partId" as keyof CountItem,
      className: "whitespace-nowrap"
    },
    {
      header: "Name",
      accessor: "name" as keyof CountItem,
    },
    {
      header: "Original Qty",
      accessor: (item: CountItem) => item.originalQuantity,
    },
    {
      header: "New Qty",
      accessor: (item: CountItem) => (
        <div className="flex items-center">
          <div className="flex border rounded-md mr-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleQuantityChange(item.partId, String(item.newQuantity - 1))}
              className="h-8 w-8 p-0"
              disabled={item.newQuantity <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <Input
              id={`quantity-${item.partId}`}
              type="number"
              value={item.displayValue}
              onChange={(e) => handleQuantityChange(item.partId, e.target.value)}
              className={`w-16 border-0 text-center ${item.changed ? "bg-primary/10" : ""}`}
            />

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleQuantityChange(item.partId, String(item.newQuantity + 1))}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {item.changed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => resetItem(item.partId)}
              className="ml-1"
              title="Reset to original quantity"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (item: CountItem) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => removeItem(item.partId)}
        >
          Remove
        </Button>
      ),
      className: "text-right",
    },
  ];

  // Handle key press for scanner input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Quick Count</h2>
          <p className="text-muted-foreground">Quickly update inventory quantities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/parts-inventory")}>
            Back to Inventory
          </Button>
          <Button 
            onClick={saveChanges} 
            disabled={changedItems.length === 0 || updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-1" />
            Save Changes ({changedItems.length})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manual-count" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual-count">
            <Package2 className="h-4 w-4 mr-2" />
            Manual Count
          </TabsTrigger>
          <TabsTrigger value="assigned-count">
            <ClipboardList className="h-4 w-4 mr-2" />
            Assigned Parts
          </TabsTrigger>
          <TabsTrigger value="assign-parts">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Manage Assignments
          </TabsTrigger>
        </TabsList>
        
        {/* Manual Count Tab Content */}
        <TabsContent value="manual-count" className="mt-4">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Scan or Search for Parts</CardTitle>
                <CardDescription>Enter part ID or search by name</CardDescription>
              </CardHeader>
              <CardContent>
                {showScanner ? (
                  <div className="mb-4">
                    <SimpleBarcodeScanner
                      onCodeDetected={handleBarcodeDetection}
                      onClose={() => setShowScanner(false)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Part ID Search */}
                    <div>
                      <Label htmlFor="part-id-search" className="mb-2 block">Part ID Search</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="part-id-search"
                            placeholder="Scan barcode or enter part ID..."
                            value={currentPartId}
                            onChange={(e) => {
                              setCurrentPartId(e.target.value);
                              // Clear the name search when using ID search
                              if (e.target.value) setNameSearch("");
                            }}
                            onKeyDown={handleKeyPress}
                            className="pl-9"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowScanner(true)}
                        >
                          <ScanBarcode className="h-4 w-4 mr-1" />
                          Scan
                        </Button>
                        <Button onClick={handleScan}>Add Part</Button>
                      </div>
                    </div>
                    
                    {/* Part Name Search */}
                    <div>
                      <Label htmlFor="part-name-search" className="mb-2 block">Part Name Search</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="part-name-search"
                            placeholder="Search by part name..."
                            value={nameSearch}
                            onChange={(e) => {
                              setNameSearch(e.target.value);
                              // Clear the part ID search when using name search
                              if (e.target.value) setCurrentPartId("");
                            }}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type at least 3 characters to search by part name
                      </p>
                    </div>
                  </div>
                )}

                {filteredParts.length > 0 && (
                  <div className="mt-4 border rounded-md p-2">
                    <h3 className="text-sm font-medium mb-2">Search Results</h3>
                    <div className="max-h-40 overflow-y-auto">
                      {filteredParts.map(part => (
                        <div 
                          key={part.id}
                          className="flex justify-between items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => addPartToCount(part)}
                        >
                          <div>
                            <div className="font-medium">{part.partId}</div>
                            <div className="text-sm text-muted-foreground">{part.name}</div>
                          </div>
                          <div className="text-sm">Qty: {part.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Browse All Parts Section */}
            <Card>
              <CardHeader className="pb-3">
                <Collapsible
                  open={isAllPartsOpen}
                  onOpenChange={setIsAllPartsOpen}
                  className="w-full"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5" />
                        Browse All Parts
                      </CardTitle>
                      <CardDescription>
                        Select multiple parts to add to the count list
                      </CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="mt-4">
                    <div className="space-y-4">
                      {/* Location and Shelf Filters */}
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <Label htmlFor="location-filter" className="mb-2 block">Filter by Location</Label>
                          <Select 
                            value={selectedLocationId} 
                            onValueChange={(value) => {
                              setSelectedLocationId(value);
                              setSelectedShelfId(""); // Reset shelf when location changes
                            }}
                          >
                            <SelectTrigger id="location-filter" className="w-full">
                              <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex-1">
                          <Label htmlFor="shelf-filter" className="mb-2 block">Filter by Shelf</Label>
                          <Select 
                            value={selectedShelfId} 
                            onValueChange={setSelectedShelfId}
                            disabled={!selectedLocationId || shelvesLoading}
                          >
                            <SelectTrigger id="shelf-filter" className="w-full">
                              <SelectValue placeholder={selectedLocationId ? "Select a shelf" : "Select a location first"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Shelves</SelectItem>
                              {shelves.map((shelf) => (
                                <SelectItem key={shelf.id} value={shelf.id.toString()}>
                                  {shelf.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter parts list..."
                          value={partsListFilter}
                          onChange={(e) => setPartsListFilter(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      
                      <ScrollArea className="h-[300px] border rounded-md p-2">
                        <div className="space-y-1">
                          {filteredAllParts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No parts match your filter.</p>
                            </div>
                          ) : (
                            <div>
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                {[1, 2, 3].map(colIndex => (
                                  <div key={colIndex} className="space-y-1">
                                    {currentItems
                                      .filter((_, index) => index % 3 === colIndex - 1)
                                      .map(part => (
                                        <div 
                                          key={part.id}
                                          className="flex items-center space-x-2 p-1 hover:bg-accent rounded-md border"
                                        >
                                          <Checkbox 
                                            id={`part-${part.id}`}
                                            checked={selectedParts[part.id] || false}
                                            onCheckedChange={() => togglePartSelection(part.id)}
                                            className="h-3 w-3"
                                          />
                                          <div 
                                            className="flex-1 text-xs cursor-pointer" 
                                            onClick={() => togglePartSelection(part.id)}
                                          >
                                            <div className="font-medium text-xs">{part.partId}</div>
                                            <div className="text-xs truncate text-muted-foreground" title={part.name}>
                                              {part.name.length > 20 ? `${part.name.substring(0, 20)}...` : part.name}
                                            </div>
                                            <div className="text-xs">Qty: {part.quantity}</div>
                                            <div className="text-xs flex items-center text-muted-foreground">
                                              <MapPin className="h-3 w-3 mr-1" />
                                              {part.location || "No Location"} 
                                              {part.shelfId && ` / Shelf ${part.shelfId}`}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Pagination */}
                              <div className="flex items-center justify-center space-x-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                  Page {currentPage} of {totalPages || 1}
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                  disabled={currentPage === totalPages || totalPages === 0}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Selected parts: {Object.values(selectedParts).filter(Boolean).length}
                          {filteredAllParts.length > 0 && <> | Total: {filteredAllParts.length}</>}
                        </div>
                        <Button
                          onClick={addSelectedPartsToCount}
                          disabled={Object.values(selectedParts).filter(Boolean).length === 0}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Selected Parts
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parts to Count</CardTitle>
                <CardDescription>
                  Update quantities and save changes when complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                {countItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package2 className="mx-auto h-12 w-12 mb-2 opacity-30" />
                    <p>No parts added to count yet. Scan or search for parts above.</p>
                  </div>
                ) : (
                  <DataTable
                    data={countItems}
                    columns={columns}
                    itemsPerPage={10}
                  />
                )}
              </CardContent>
              {countItems.length > 0 && (
                <CardFooter className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Total Items: {countItems.length}</Label>
                      <p className="text-sm text-muted-foreground">
                        Items with changes: {changedItems.length}
                      </p>
                    </div>
                    <Button 
                      onClick={saveChanges} 
                      disabled={changedItems.length === 0 || updateMutation.isPending}
                      size="lg"
                    >
                      {updateMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes ({changedItems.length})
                    </Button>
                  </div>
                  
                  {/* Student batch actions */}
                  {user?.role === 'student' && assignedParts && assignedParts.length > 0 && (
                    <div className="bg-secondary/30 p-3 rounded-md border">
                      <h3 className="text-sm font-semibold mb-2">Batch Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Mark all completed assignments with updated quantities
                            const updatedAssignments = assignedParts
                              .filter(assignment => 
                                assignment.status !== 'completed' && 
                                assignment.part && 
                                countItems.some(item => item.id === assignment.part.id)
                              )
                              .map(assignment => assignment.id);
                            
                            if (updatedAssignments.length === 0) {
                              toast({
                                title: "No Assignments to Complete",
                                description: "No pending assignments found to mark as completed.",
                              });
                              return;
                            }
                            
                            // Execute each completion in sequence
                            Promise.all(updatedAssignments.map(id => 
                              completeAssignmentMutation.mutateAsync(id)
                            )).then(() => {
                              toast({
                                title: "Assignments Completed",
                                description: `Successfully marked ${updatedAssignments.length} assignments as completed.`,
                              });
                            }).catch(error => {
                              toast({
                                title: "Error",
                                description: `Failed to complete assignments: ${error.message}`,
                                variant: "destructive",
                              });
                            });
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark All As Completed
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            // Find any assignments with changes
                            const assignmentsWithChanges = assignedParts
                              .filter(assignment => 
                                assignment.part && 
                                countItems.some(item => 
                                  item.id === assignment.part.id && 
                                  item.changed
                                )
                              );
                            
                            if (assignmentsWithChanges.length === 0) {
                              toast({
                                title: "No Changes",
                                description: "No changes found to save for any assignments.",
                              });
                              return;
                            }
                            
                            // Save all changes and mark as completed in one batch operation
                            saveChanges();
                            
                            // After a brief delay to allow the save to process
                            setTimeout(() => {
                              // Mark all as completed
                              Promise.all(assignmentsWithChanges.map(assignment => 
                                completeAssignmentMutation.mutateAsync(assignment.id)
                              )).then(() => {
                                toast({
                                  title: "Save & Complete",
                                  description: `Saved changes and marked ${assignmentsWithChanges.length} assignments as completed.`,
                                });
                              });
                            }, 500);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save & Mark Completed
                        </Button>
                      </div>
                    </div>
                  )}
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
        
        {/* Assigned Parts Tab Content */}
        <TabsContent value="assigned-count" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Parts to Count</CardTitle>
              <CardDescription>
                Parts assigned to you for counting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedPartsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading assigned parts...</span>
                </div>
              ) : assignedParts && assignedParts.length > 0 ? (
                <div className="space-y-4">
                  {assignedParts.map(assignment => {
                    // Skip rendering if part is undefined
                    if (!assignment || !assignment.part) {
                      return null;
                    }
                    
                    const part = assignment.part;
                    // Check if this part is already in the count list
                    const isInCountList = countItems.some(item => item.id === part.id);
                    
                    return (
                      <div key={assignment.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center">
                              {part.partId} - {part.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                            </p>
                            {assignment.notes && (
                              <p className="text-sm mt-1 italic">Note: {assignment.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!isInCountList && (
                              <Button 
                                size="sm" 
                                onClick={() => addPartToCount(part)}
                                variant="outline"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add to Count
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant={isInCountList ? "default" : "outline"}
                              onClick={() => completeAssignmentMutation.mutate(assignment.id)}
                              disabled={completeAssignmentMutation.isPending}
                            >
                              {completeAssignmentMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              )}
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Mark Complete
                            </Button>
                          </div>
                        </div>
                        <div className="bg-accent/30 p-3 rounded">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium">Current Quantity:</p>
                              <p className="text-xl font-bold">{part.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Updated Count:</p>
                              <div className="flex items-center">
                                <div className="flex border rounded-md mr-2 bg-white">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      // Find the count item if it exists
                                      const countItem = countItems.find(item => item.id === part.id);
                                      if (countItem) {
                                        // Decrement the quantity
                                        handleQuantityChange(countItem.partId, String(countItem.newQuantity - 1));
                                      } else {
                                        // Add to count list with decremented quantity
                                        addPartToCount(part);
                                        setTimeout(() => {
                                          const newCountItem = countItems.find(item => item.id === part.id);
                                          if (newCountItem) {
                                            handleQuantityChange(newCountItem.partId, String(part.quantity - 1));
                                          }
                                        }, 100);
                                      }
                                    }}
                                    className="h-8 w-8 p-0"
                                    disabled={isInCountList ? (countItems.find(item => item.id === part.id)?.newQuantity || 0) <= 0 : part.quantity <= 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  
                                  <Input
                                    type="number"
                                    value={isInCountList ? countItems.find(item => item.id === part.id)?.displayValue : part.quantity}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      if (isInCountList) {
                                        // Update existing count item
                                        const countItem = countItems.find(item => item.id === part.id);
                                        if (countItem) {
                                          handleQuantityChange(countItem.partId, newValue);
                                        }
                                      } else {
                                        // Add to count list with new value
                                        addPartToCount(part);
                                        setTimeout(() => {
                                          const newCountItem = countItems.find(item => item.id === part.id);
                                          if (newCountItem) {
                                            handleQuantityChange(newCountItem.partId, newValue);
                                          }
                                        }, 100);
                                      }
                                    }}
                                    className="w-16 border-0 text-center"
                                  />
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      // Find the count item if it exists
                                      const countItem = countItems.find(item => item.id === part.id);
                                      if (countItem) {
                                        // Increment the quantity
                                        handleQuantityChange(countItem.partId, String(countItem.newQuantity + 1));
                                      } else {
                                        // Add to count list with incremented quantity
                                        addPartToCount(part);
                                        setTimeout(() => {
                                          const newCountItem = countItems.find(item => item.id === part.id);
                                          if (newCountItem) {
                                            handleQuantityChange(newCountItem.partId, String(part.quantity + 1));
                                          }
                                        }, 100);
                                      }
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Location:</p>
                              <p className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                {part.location || "Not specified"}
                                {part.shelfId && ` / Shelf ${part.shelfId}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-lg font-medium mb-1">No parts assigned</h3>
                  <p className="text-muted-foreground">
                    You don't have any parts assigned for counting at this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Manage Assignments Tab Content (Admin only) */}
        <TabsContent value="assign-parts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Part Count Assignments</CardTitle>
              <CardDescription>
                Assign parts to be counted and track completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allAssignedPartsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading assignments...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Assignments Section */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold">Current Assignments</h3>
                      
                      {allAssignedParts && allAssignedParts.length > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="select-all-assignments" 
                              checked={allAssignedParts.length > 0 && selectedAssignments.length === allAssignedParts.filter(a => a && a.id).length}
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                            />
                            <Label htmlFor="select-all-assignments" className="text-sm cursor-pointer">
                              Select All
                            </Label>
                          </div>
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => bulkDeleteAssignmentsMutation.mutate(selectedAssignments)}
                            disabled={selectedAssignments.length === 0 || bulkDeleteAssignmentsMutation.isPending}
                          >
                            {bulkDeleteAssignmentsMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              `Delete Selected (${selectedAssignments.length})`
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {allAssignedParts && allAssignedParts.length > 0 ? (
                      <div className="space-y-3">
                        {allAssignedParts.map(assignment => {
                          // Skip rendering if part is undefined
                          if (!assignment || !assignment.part) {
                            return null;
                          }
                          
                          const isSelected = selectedAssignments.includes(assignment.id);
                          
                          return (
                            <div key={assignment.id} className={`border rounded-md p-3 flex justify-between items-center ${isSelected ? 'bg-primary/5 border-primary/20' : ''}`}>
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  id={`assignment-${assignment.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectAssignment(assignment.id, checked as boolean)}
                                />
                                <div>
                                  <div className="font-medium">{assignment.part.partId} - {assignment.part.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    <span className="inline-flex items-center mr-3">
                                      Status: 
                                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                        assignment.status === 'completed' 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                      }`}>
                                        {assignment.status === 'completed' ? 'Completed' : 'Pending'}
                                      </span>
                                    </span>
                                    <span>
                                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                                    </span>
                                    {assignment.completedAt && (
                                      <span className="ml-3">
                                        Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                                disabled={deleteAssignmentMutation.isPending}
                              >
                                {deleteAssignmentMutation.isPending && (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                )}
                                Delete
                              </Button>
                            </div>
                          );
                        }).filter(Boolean) /* Filter out null values */}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-muted-foreground">No assignments found</p>
                      </div>
                    )}
                  </div>

                  {/* Create New Assignments Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Create New Assignments</h3>
                    <div className="border rounded-md p-4">
                      <p className="mb-4">Select parts from the list below to assign for counting:</p>
                      
                      {/* Location and Shelf Filters */}
                      <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <Label htmlFor="location-filter-manage" className="mb-2 block">Filter by Location</Label>
                          <Select 
                            value={selectedLocationId} 
                            onValueChange={(value) => {
                              setSelectedLocationId(value);
                              setSelectedShelfId(""); // Reset shelf when location changes
                            }}
                          >
                            <SelectTrigger id="location-filter-manage" className="w-full">
                              <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex-1">
                          <Label htmlFor="shelf-filter-manage" className="mb-2 block">Filter by Shelf</Label>
                          <Select 
                            value={selectedShelfId} 
                            onValueChange={setSelectedShelfId}
                            disabled={!selectedLocationId || shelvesLoading}
                          >
                            <SelectTrigger id="shelf-filter-manage" className="w-full">
                              <SelectValue placeholder={selectedLocationId ? "Select a shelf" : "Select a location first"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Shelves</SelectItem>
                              {shelves.map((shelf) => (
                                <SelectItem key={shelf.id} value={shelf.id.toString()}>
                                  {shelf.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter parts by name or ID..."
                          value={partsListFilter}
                          onChange={(e) => setPartsListFilter(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      
                      <ScrollArea className="h-[300px] border rounded-md p-2 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {filteredAllParts.slice(0, 50).map(part => (
                            <div 
                              key={part.id}
                              className="border rounded p-2 flex items-center space-x-2 hover:bg-accent/30"
                            >
                              <Checkbox 
                                id={`assign-part-${part.id}`}
                                checked={selectedParts[part.id] || false}
                                onCheckedChange={() => togglePartSelection(part.id)}
                              />
                              <label 
                                htmlFor={`assign-part-${part.id}`} 
                                className="flex-1 text-sm cursor-pointer"
                              >
                                <div className="font-medium">{part.partId}</div>
                                <div className="text-xs truncate text-muted-foreground">
                                  {part.name}
                                </div>
                                <div className="text-xs flex items-center text-muted-foreground">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {part.location || "No Location"} 
                                  {part.shelfId && ` / Shelf ${part.shelfId}`}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Selected: {Object.values(selectedParts).filter(Boolean).length} part(s)
                        </div>
                        <Button
                          onClick={assignSelectedPartsForCounting}
                          disabled={Object.values(selectedParts).filter(Boolean).length === 0 || createAssignmentMutation.isPending}
                        >
                          {createAssignmentMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          )}
                          Assign for Counting
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}