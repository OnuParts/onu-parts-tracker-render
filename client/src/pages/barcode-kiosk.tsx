import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2, Package, Scan, User, FileText, Plus, Wrench, Truck, Building, ArrowLeft, CheckCircle, Clock, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";


interface ScannedPart {
  id: number;
  partId: string;
  name: string;
  description: string;
  currentStock: number;
  unitCost: string;
  location: string;
  quantity: number;
  isManualEntry?: boolean; // Track if this was manually entered (not found in system)
  scannedBarcode?: string; // Store the barcode that was scanned for manual entries
}

interface PendingReviewPart {
  id: string;
  scannedBarcode: string;
  description: string;
  quantity: number;
  technicianUsed: string;
  dateScanned: string;
}

interface ChargeOutData {
  partId: number;
  quantity: number;
  issuedTo: string;
  reason: string;
  notes?: string;
  costCenter?: string;
  buildingId?: number;
}

interface ToolSignOutData {
  toolNumber: number;
  borrowerName: string;
  buildingId: number;
  notes?: string;
}

interface ToolReturnData {
  toolNumber: number;
  returnedBy: string;
  notes?: string;
}

interface PartPickupData {
  id: number;
  code: string;
  partName: string;
  quantity: number;
  requestedBy: string;
}

type KioskMode = 'menu' | 'parts' | 'tools' | 'pickup';
type ToolMode = 'signout' | 'return';

export default function BarcodeKiosk() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [kioskMode, setKioskMode] = useState<KioskMode>('menu');
  const [isUsbScanningActive, setIsUsbScanningActive] = useState(false);
  const [scannedParts, setScannedParts] = useState<ScannedPart[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<number | undefined>();
  const [selectedCostCenter, setSelectedCostCenter] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupCode, setPickupCode] = useState("");
  const [toolMode, setToolMode] = useState<ToolMode>('signout');
  const [manualToolNumber, setManualToolNumber] = useState("");
  const [showQuantityPrompt, setShowQuantityPrompt] = useState(false);
  const [pendingPart, setPendingPart] = useState<any>(null);
  const [quantityInput, setQuantityInput] = useState("1");
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
  const [manualEntryBarcode, setManualEntryBarcode] = useState("");
  const [manualEntryDescription, setManualEntryDescription] = useState("");
  const [lastScanTime, setLastScanTime] = useState(0);
  const [usbScanBuffer, setUsbScanBuffer] = useState("");
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Get data for selections using public endpoints
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['/api/buildings-public'],
    retry: 3,
    retryDelay: 1000,
  });
  
  const { data: technicians = [], isLoading: techniciansLoading } = useQuery({
    queryKey: ['/api/technicians-list'],
    retry: 3,
    retryDelay: 1000,
  });
  
  const { data: costCenters = [], isLoading: costCentersLoading } = useQuery({
    queryKey: ['/api/cost-centers-public'],
    retry: 3,
    retryDelay: 1000,
  });
  
  const { data: partsPickups = [] } = useQuery({
    queryKey: ['/api/parts-pickup', 'pending-only'], // Force cache refresh
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache this data
  });

  // Get all parts for manual search using public endpoint
  const { data: allParts = [] } = useQuery({
    queryKey: ['/api/parts-lookup-all'],
    enabled: false, // Disable for now since we don't have a public all-parts endpoint
  });

  // Auto-select cost center based on building
  useEffect(() => {
    if (selectedBuilding && costCenters && Array.isArray(costCenters) && costCenters.length > 0) {
      const buildingData = (buildings as any[]).find(b => b.id === selectedBuilding);
      if (buildingData) {
        // Find cost center matching building name or code
        const matchingCostCenter = (costCenters as any[]).find(cc => 
          cc.name?.toLowerCase().includes(buildingData.name?.toLowerCase()) ||
          buildingData.name?.toLowerCase().includes(cc.name?.toLowerCase())
        );
        if (matchingCostCenter) {
          setSelectedCostCenter(matchingCostCenter.code);
        }
      }
    }
  }, [selectedBuilding, buildings, costCenters]);

  // USB Barcode Scanner Setup - Auto-activate when Parts Checkout is selected
  useEffect(() => {
    if (kioskMode === 'parts' && user?.role !== 'controller') {
      setIsUsbScanningActive(true);
      // Focus the hidden input to capture barcode scanner input
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    } else {
      setIsUsbScanningActive(false);
    }
  }, [kioskMode, user?.role]);

  // Handle USB Barcode Scanner Input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isUsbScanningActive || showQuantityPrompt || showManualEntryDialog) return;

      // Ignore modifier keys
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const char = event.key;

      // Handle Enter key (end of barcode scan)
      if (char === 'Enter') {
        event.preventDefault();
        if (usbScanBuffer.trim().length > 0) {
          handleBarcodeScanned(usbScanBuffer.trim());
          setUsbScanBuffer("");
        }
        return;
      }

      // Handle printable characters
      if (char.length === 1 && char.match(/[a-zA-Z0-9\-_]/)) {
        event.preventDefault();
        setUsbScanBuffer(prev => prev + char);
        
        // Auto-clear buffer after 100ms of inactivity (typical for USB scanners)
        setTimeout(() => {
          setUsbScanBuffer("");
        }, 100);
      }
    };

    if (isUsbScanningActive) {
      document.addEventListener('keydown', handleKeyPress, true);
      return () => {
        document.removeEventListener('keydown', handleKeyPress, true);
      };
    }
  }, [isUsbScanningActive, usbScanBuffer, showQuantityPrompt, showManualEntryDialog]);

  // Handle scanned barcode
  const handleBarcodeScanned = (barcode: string) => {
    console.log(`USB Scanner: Scanned barcode: ${barcode}`);
    
    // Prevent duplicate scans
    const now = Date.now();
    if (now - lastScanTime < 2000) {
      console.log('USB Scanner: Ignoring duplicate scan');
      return;
    }
    setLastScanTime(now);

    // Look up the part
    lookupPartMutation.mutate(barcode);
  };

  // Mutations
  const chargeOutMutation = useMutation({
    mutationFn: async (chargeOutData: ChargeOutData) => {
      const response = await apiRequest("POST", "/api/parts-charge-out-public", chargeOutData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✓ Parts Charged Out",
        description: "All parts processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to charge out parts",
        variant: "destructive",
      });
    },
  });

  const toolSignOutMutation = useMutation({
    mutationFn: async (toolData: ToolSignOutData) => {
      const response = await apiRequest("POST", "/api/tool-signout", {
        toolNumber: toolData.toolNumber,
        borrowerName: toolData.borrowerName,
        buildingId: toolData.buildingId,
        notes: toolData.notes,
        borrowedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✓ Tool Signed Out",
        description: "Tool checked out successfully",
      });
      resetForm(); // Return to main kiosk menu
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out tool",
        variant: "destructive",
      });
    },
  });

  const toolReturnMutation = useMutation({
    mutationFn: async (toolData: ToolReturnData) => {
      const response = await apiRequest("POST", "/api/tool-return", {
        toolNumber: toolData.toolNumber,
        returnedBy: toolData.returnedBy,
        notes: toolData.notes,
        returnedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✓ Tool Returned",
        description: "Tool checked in successfully",
      });
      resetForm(); // Return to main kiosk menu
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return tool",
        variant: "destructive",
      });
    },
  });

  const pickupMutation = useMutation({
    mutationFn: async (pickupId: number) => {
      const response = await apiRequest("PATCH", `/api/parts-pickup/${pickupId}/complete`, {
        technicianId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✓ Parts Picked Up",
        description: "Pickup completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete pickup",
        variant: "destructive",
      });
    },
  });

  const lookupPartMutation = useMutation({
    mutationFn: async (partId: string) => {
      console.log(`Kiosk: Looking up part with barcode: ${partId}`);
      const response = await fetch(`/api/parts-lookup/${partId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Part not found');
        }
        throw new Error('Failed to lookup part');
      }
      const result = await response.json();
      console.log(`Kiosk: Found part:`, result);
      return result;
    },
    onSuccess: (part) => {
      console.log(`Kiosk: Successfully found part for mode ${kioskMode}:`, part);
      if (kioskMode === 'parts') {
        const existingIndex = scannedParts.findIndex(p => p.partId === part.partId);
        if (existingIndex >= 0) {
          const updated = [...scannedParts];
          updated[existingIndex].quantity += 1;
          setScannedParts(updated);
        } else {
          setScannedParts(prev => [...prev, {
            id: part.id,
            partId: part.partId,
            name: part.name,
            description: part.description,
            currentStock: part.quantity,
            unitCost: part.unitCost,
            location: part.location,
            quantity: 1
          }]);
        }
        toast({
          title: "✓ Part Added",
          description: `${part.name} (${part.partId})`,
        });
        // Re-enable scanning after successful add
        setTimeout(() => {
          setCanScan(true);
        }, 500);
      }
    },
    onError: (error: Error) => {
      console.error(`Kiosk: Error looking up part:`, error);
      // Re-enable scanning on error
      setTimeout(() => {
        setCanScan(true);
      }, 500);
      toast({
        title: "Part Not Found",
        description: error.message || "Could not find part with that barcode - try again or contact admin",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isScanning && scannerContainerRef.current) {
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
          // Prevent rapid scanning - only allow one scan per 2 seconds
          const now = Date.now();
          if (now - lastScanTime < 2000 || !canScan) {
            return;
          }
          setLastScanTime(now);
          setCanScan(false);
          
          if (kioskMode === 'tools') {
            // For tools, process directly without part lookup
            const toolNumber = parseInt(decodedText);
            if (!isNaN(toolNumber)) {
              processToolSignOut(toolNumber);
            } else {
              toast({
                title: "Invalid Tool Code",
                description: "Please scan a valid tool barcode",
                variant: "destructive",
              });
            }
          } else if (kioskMode === 'parts') {
            // For parts mode, lookup the part
            console.log(`Kiosk: Scanning part barcode: ${decodedText}`);
            // Stop scanning immediately when we get a scan
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
            setIsScanning(false);
            lookupPartMutation.mutate(decodedText);
          } else if (kioskMode === 'pickup') {
            // For pickup mode, process the code
            setPickupCode(decodedText);
            processPickup(parseInt(decodedText));
          }
          
          // Re-enable scanning after 2 seconds (reduced from 3)
          setTimeout(() => {
            setCanScan(true);
          }, 2000);
        },
        (errorMessage) => {
          // Ignore scan errors
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  // Manual parts search using parts lookup mutation
  const manualLookupMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      const response = await fetch(`/api/parts-lookup/${searchTerm}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Part not found');
        }
        throw new Error('Failed to lookup part');
      }
      return response.json();
    },
    onSuccess: (part) => {
      const existingIndex = scannedParts.findIndex(p => p.partId === part.partId);
      if (existingIndex >= 0) {
        const updated = [...scannedParts];
        updated[existingIndex].quantity += 1;
        setScannedParts(updated);
      } else {
        setScannedParts(prev => [...prev, {
          id: part.id,
          partId: part.partId,
          name: part.name,
          description: part.description,
          currentStock: part.quantity,
          unitCost: part.unitCost,
          location: part.location,
          quantity: 1
        }]);
      }
      toast({
        title: "✓ Part Added",
        description: `${part.name} (${part.partId})`,
      });
      setManualPartSearch("");
    },
    onError: (error: Error) => {
      toast({
        title: "Part Not Found",
        description: "Could not find a part with that ID or barcode - contact admin to add this part",
        variant: "destructive",
      });
    },
  });

  // Handle manual part search
  const handleManualSearch = () => {
    if (manualPartSearch.trim()) {
      console.log(`Kiosk: Manual search for: ${manualPartSearch.trim()}`);
      lookupPartMutation.mutate(manualPartSearch.trim());
    }
  };

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  const updatePartQuantity = (partId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setScannedParts(prev => prev.filter(p => p.partId !== partId));
    } else {
      setScannedParts(prev => prev.map(p => 
        p.partId === partId ? { ...p, quantity: newQuantity } : p
      ));
    }
  };

  const removePart = (partId: string) => {
    setScannedParts(prev => prev.filter(p => p.partId !== partId));
  };

  const addPartToCart = (part: any) => {
    const existingIndex = scannedParts.findIndex(p => p.partId === part.partId);
    if (existingIndex >= 0) {
      const updated = [...scannedParts];
      updated[existingIndex].quantity += 1;
      setScannedParts(updated);
    } else {
      setScannedParts(prev => [...prev, {
        id: part.id,
        partId: part.partId,
        name: part.name,
        description: part.description,
        currentStock: part.quantity,
        unitCost: part.unitCost,
        location: part.location,
        quantity: 1
      }]);
    }
    toast({
      title: "Part Added",
      description: `${part.name} (${part.partId})`,
    });
    setManualPartSearch(""); // Clear search after adding
  };

  const resetForm = () => {
    setScannedParts([]);
    setSelectedTechnician("");
    setSelectedBuilding(undefined);
    setSelectedCostCenter("");
    setNotes("");
    setPickupCode("");
    resetToolForm();
    if (isScanning) {
      stopScanning();
    }
    setKioskMode('menu');
  };

  const resetToolForm = () => {
    setManualToolNumber("");
    setNotes("");
  };

  const processChargeOut = async () => {
    if (scannedParts.length === 0 || !selectedTechnician || !selectedBuilding) {
      toast({
        title: "Missing Information",
        description: "Please select technician and building",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const part of scannedParts) {
      try {
        await chargeOutMutation.mutateAsync({
          partId: part.id, // Database ID from parts lookup
          quantity: part.quantity,
          issuedTo: selectedTechnician,
          reason: "maintenance",
          notes: notes.trim() || undefined,
          costCenter: selectedCostCenter || undefined,
          buildingId: selectedBuilding,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to charge out ${part.partId}:`, error);
        failCount++;
        toast({
          title: "Charge-out Failed",
          description: `Failed to charge out ${part.name} (${part.partId})`,
          variant: "destructive",
        });
      }
    }

    if (successCount > 0) {
      toast({
        title: "Charge-out Complete",
        description: `Successfully charged out ${successCount} part${successCount > 1 ? 's' : ''}`,
      });
      resetForm();
    }
  };

  const processToolSignOut = async (toolNumber: number) => {
    if (!selectedTechnician || !selectedBuilding) {
      toast({
        title: "Missing Information",
        description: "Please select technician and building first",
        variant: "destructive",
      });
      return;
    }

    await toolSignOutMutation.mutateAsync({
      toolNumber,
      borrowerName: selectedTechnician,
      buildingId: selectedBuilding,
      notes: notes.trim() || undefined,
    });
  };

  const processToolReturn = async (toolNumber: number) => {
    if (!selectedTechnician) {
      toast({
        title: "Missing Information",
        description: "Please select technician first",
        variant: "destructive",
      });
      return;
    }

    await toolReturnMutation.mutateAsync({
      toolNumber,
      returnedBy: selectedTechnician,
      notes: notes.trim() || undefined,
    });
  };

  const handleManualToolEntry = () => {
    const toolNumber = parseInt(manualToolNumber);
    if (isNaN(toolNumber) || toolNumber <= 0) {
      toast({
        title: "Invalid Tool Number",
        description: "Please enter a valid tool number",
        variant: "destructive",
      });
      return;
    }

    if (toolMode === 'signout') {
      processToolSignOut(toolNumber);
    } else {
      processToolReturn(toolNumber);
    }
  };

  const processPickup = async (pickupId: number) => {
    await pickupMutation.mutateAsync(pickupId);
  };

  const handlePickupByCode = () => {
    if (!pickupCode.trim()) return;
    
    const pickup = (partsPickups as any[]).find(p => p.code === pickupCode.trim());
    if (pickup) {
      processPickup(pickup.id);
    } else {
      toast({
        title: "Invalid Code",
        description: "Pickup code not found",
        variant: "destructive",
      });
    }
  };

  const totalValue = scannedParts.reduce((sum, part) => 
    sum + (part.quantity * parseFloat(part.unitCost || '0')), 0
  );

  // Filter parts for manual search
  const filteredParts = (allParts as any[]).filter(part => 
    part.partId?.toLowerCase().includes(manualPartSearch.toLowerCase()) ||
    part.name?.toLowerCase().includes(manualPartSearch.toLowerCase()) ||
    part.description?.toLowerCase().includes(manualPartSearch.toLowerCase())
  ).slice(0, 10); // Limit to first 10 results

  // Menu Mode - Main selection screen
  if (kioskMode === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div 
          className="p-6 rounded-lg mb-8 bg-cover bg-center relative"
          style={{
            backgroundImage: "url('/kiosk-header-bg.png')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            minHeight: "160px"
          }}
        >
          <div className="text-center relative z-10">
            <h1 className="text-4xl font-bold text-orange-600 mt-4">ONU Parts</h1>
            <p className="text-xl text-gray-700 mt-2">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              onClick={() => setKioskMode('parts')}
              className="h-32 text-xl flex flex-col gap-4 bg-orange-600 hover:bg-orange-700"
            >
              <Package className="h-12 w-12" />
              <span>Parts Checkout</span>
            </Button>
            
            <Button
              onClick={() => setKioskMode('tools')}
              className="h-32 text-xl flex flex-col gap-4 bg-gray-600 hover:bg-gray-700"
            >
              <Wrench className="h-12 w-12" />
              <span>Tool Signout</span>
            </Button>
            
            <Button
              onClick={() => setKioskMode('pickup')}
              className="h-32 text-xl flex flex-col gap-4 bg-white hover:bg-gray-100 text-gray-800 border-2 border-gray-300"
            >
              <Truck className="h-12 w-12" />
              <span>Parts Pickup</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-4">
      {/* Header with Back Button */}
      <div className="bg-orange-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={resetForm}
              variant="ghost"
              className="text-white hover:bg-orange-700 p-2"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-3">
              {kioskMode === 'parts' && <Package className="h-8 w-8" />}
              {kioskMode === 'tools' && <Wrench className="h-8 w-8" />}
              {kioskMode === 'pickup' && <Truck className="h-8 w-8" />}
              <div>
                <h1 className="text-2xl font-bold">
                  {kioskMode === 'parts' && 'Parts Checkout'}
                  {kioskMode === 'tools' && 'Tool Signout'}
                  {kioskMode === 'pickup' && 'Parts Pickup'}
                </h1>
                <p className="text-orange-100">
                  {kioskMode === 'parts' && 'Scan barcodes or search manually to charge out parts'}
                  {kioskMode === 'tools' && 'Scan tools to sign them out'}
                  {kioskMode === 'pickup' && 'Complete parts pickup requests'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Common Info Panel */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Technician Selection */}
              <div>
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Technician *
                </Label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger className="mt-2 text-lg py-3 border-2 border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder={techniciansLoading ? "Loading..." : "Select Technician"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {techniciansLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading technicians...
                      </SelectItem>
                    ) : (technicians as any[]).length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        No technicians available
                      </SelectItem>
                    ) : (
                      (technicians as any[]).map((tech: any) => (
                        <SelectItem key={tech.id} value={tech.name}>
                          {tech.name} {tech.department && `(${tech.department})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedTechnician && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    ✓ Selected: {selectedTechnician}
                  </div>
                )}
              </div>

              {/* Building Selection */}
              <div>
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Building *
                </Label>
                <Select value={selectedBuilding?.toString()} onValueChange={(value) => setSelectedBuilding(value ? parseInt(value) : undefined)}>
                  <SelectTrigger className="mt-2 text-lg py-3 border-2 border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder={buildingsLoading ? "Loading..." : "Select Building"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {buildingsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading buildings...
                      </SelectItem>
                    ) : (buildings as any[]).length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        No buildings available
                      </SelectItem>
                    ) : (
                      (buildings as any[]).map((building: any) => (
                        <SelectItem key={building.id} value={building.id.toString()}>
                          {building.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedBuilding && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    ✓ Selected: {(buildings as any[])?.find((b: any) => b.id === selectedBuilding)?.name}
                  </div>
                )}
              </div>

              {/* Cost Center (for parts only) */}
              {kioskMode === 'parts' && (
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cost Center
                  </Label>
                  <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                    <SelectTrigger className="mt-2 text-lg py-3 border-2 border-orange-200 focus:border-orange-500">
                      <SelectValue placeholder={costCentersLoading ? "Loading..." : "Auto-selected"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {costCentersLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading cost centers...
                        </SelectItem>
                      ) : (costCenters as any[]).length === 0 ? (
                        <SelectItem value="no-data" disabled>
                          No cost centers available
                        </SelectItem>
                      ) : (
                        (costCenters as any[]).map((cc: any) => (
                          <SelectItem key={cc.id} value={cc.code}>
                            {cc.code} - {cc.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mode-specific content */}
        {kioskMode === 'parts' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Scanner and Manual Entry Section */}
            <div className="space-y-4">
              {/* Scanner Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Scan className="h-6 w-6" />
                    Scan Parts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isScanning ? (
                    <Button 
                      onClick={startScanning} 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-xl" 
                      size="lg"
                      disabled={!canScan}
                    >
                      <Scan className="h-8 w-8 mr-3" />
                      {!canScan ? "Please Wait..." : "Start Scanning"}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={stopScanning} variant="outline" className="flex-1 py-4 text-lg">
                          Stop Scanning
                        </Button>
                        <Button 
                          onClick={() => {
                            if (canScan) {
                              // Manual trigger for single scan - restart scanner for one scan
                              setCanScan(false);
                              // Briefly restart the scanner to trigger a fresh scan
                              if (scannerRef.current) {
                                scannerRef.current.clear();
                              }
                              setTimeout(() => {
                                startScanning();
                                setCanScan(true);
                              }, 500);
                            }
                          }}
                          disabled={!canScan}
                          className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
                        >
                          {!canScan ? "Wait..." : "SCAN"}
                        </Button>
                      </div>
                      <div 
                        id="barcode-scanner" 
                        ref={scannerContainerRef}
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Part Entry Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Plus className="h-6 w-6" />
                    Manual Part Entry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={manualPartSearch}
                          onChange={(e) => setManualPartSearch(e.target.value)}
                          placeholder="Enter part ID or barcode..."
                          className="text-lg py-3"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleManualSearch();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleManualSearch}
                          disabled={!manualPartSearch.trim() || manualLookupMutation.isPending}
                          className="px-6 py-3 text-lg bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {manualLookupMutation.isPending ? "Searching..." : "Search"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Cart - Selected Parts List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-6 w-6" />
                  Cart ({scannedParts.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scannedParts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No parts added</p>
                    <p>Scan barcodes or search manually to add parts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scannedParts.map((part) => (
                      <div key={part.partId} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">{part.partId}</Badge>
                            <span className="font-medium text-lg">{part.name}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Stock: {part.currentStock}</span>
                            <span>Location: {part.location}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => updatePartQuantity(part.partId, part.quantity - 1)}
                            className="w-12 h-12 text-xl"
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max="999"
                            value={part.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              updatePartQuantity(part.partId, newQty);
                            }}
                            className="w-16 text-center font-bold text-xl h-12"
                          />
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => updatePartQuantity(part.partId, part.quantity + 1)}
                            className="w-12 h-12 text-xl"
                          >
                            +
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => removePart(part.partId)}
                            className="ml-2 text-red-600 hover:text-red-800 w-12 h-12"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      onClick={processChargeOut}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8 mt-6"
                      size="lg"
                      disabled={chargeOutMutation.isPending || scannedParts.length === 0 || !selectedTechnician || !selectedBuilding}
                    >
                      <CheckCircle className="h-8 w-8 mr-3" />
                      {chargeOutMutation.isPending ? "Processing..." : `Charge Out ${scannedParts.length} Parts`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {kioskMode === 'tools' && (
          <div className="space-y-6">
            {/* Tool Mode Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Wrench className="h-6 w-6" />
                  Tool Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setToolMode('signout')}
                    className={`py-6 text-lg ${toolMode === 'signout' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                  >
                    <Wrench className="h-6 w-6 mr-2" />
                    Sign Out Tools
                  </Button>
                  <Button
                    onClick={() => setToolMode('return')}
                    className={`py-6 text-lg ${toolMode === 'return' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                  >
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Return Tools
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Tool Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    value={manualToolNumber}
                    onChange={(e) => setManualToolNumber(e.target.value)}
                    placeholder="Enter tool number"
                    className="text-xl py-4 flex-1"
                    type="number"
                  />
                  <Button 
                    onClick={handleManualToolEntry}
                    className={`py-4 px-8 text-lg ${toolMode === 'signout' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={!manualToolNumber || (!selectedTechnician || (toolMode === 'signout' && !selectedBuilding))}
                  >
                    {toolMode === 'signout' ? 'Sign Out' : 'Return'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Barcode Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Barcode Scanner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  {!isScanning ? (
                    <div className="space-y-6">
                      <Wrench className="h-16 w-16 mx-auto text-gray-300" />
                      <div className="space-y-4">
                        <p className="text-lg">
                          {toolMode === 'signout' ? 'Scan tool barcodes to sign out' : 'Scan tool barcodes to return'}
                        </p>
                        <p className="text-gray-600">
                          {toolMode === 'signout' ? 'Tools will be signed out with today\'s date' : 'Tools will be returned with today\'s date'}
                        </p>
                        <Button 
                          onClick={startScanning} 
                          className={`py-6 px-12 text-xl ${toolMode === 'signout' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          <Scan className="h-8 w-8 mr-3" />
                          Start Scanning
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button onClick={stopScanning} variant="outline" className="py-4 px-8 text-lg">
                        Stop Scanning
                      </Button>
                      <div 
                        id="barcode-scanner" 
                        ref={scannerContainerRef}
                        className="w-full max-w-md mx-auto"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about the tool operation"
                  className="text-lg py-3"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {kioskMode === 'pickup' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Truck className="h-6 w-6" />
                  Parts Pickup - Enter 4-Digit Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    value={pickupCode}
                    onChange={(e) => setPickupCode(e.target.value)}
                    placeholder="Enter 4-digit pickup code"
                    className="text-2xl py-6 text-center font-bold"
                    maxLength={4}
                  />
                  <Button 
                    onClick={handlePickupByCode}
                    className="bg-orange-600 hover:bg-orange-700 text-white py-6 px-8 text-xl"
                    disabled={pickupCode.length !== 4}
                  >
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Complete
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Available Pickups</CardTitle>
              </CardHeader>
              <CardContent>
                {(partsPickups as any[]).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No pickups available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(partsPickups as any[]).map((pickup: any) => (
                      <div key={pickup.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-lg font-bold">{pickup.code}</Badge>
                            <span className="font-medium text-lg">{pickup.partName}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Qty: {pickup.quantity}</span>
                            <span>Requested by: {pickup.requestedBy}</span>
                            <span><Clock className="h-4 w-4 inline mr-1" />{new Date(pickup.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => processPickup(pickup.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6"
                          disabled={pickupMutation.isPending}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}