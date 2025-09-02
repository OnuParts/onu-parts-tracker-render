import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2, Package, User, Building, ArrowLeft, CheckCircle, Plus, Minus, Wrench, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Extend Window interface for scanner timeout
declare global {
  interface Window {
    scannerTimeout: NodeJS.Timeout;
  }
}

interface ScannedPart {
  id: number;
  partId: string;
  name: string;
  description: string;
  currentStock: number;
  unitCost: string;
  location: string;
  quantity: number;
  isManualEntry?: boolean;
  scannedBarcode?: string;
}

interface PendingReviewPart {
  id: string;
  scannedBarcode: string;
  description: string;
  quantity: number;
  technicianUsed: string;
  dateScanned: string;
}

export default function BarcodeKiosk() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [kioskMode, setKioskMode] = useState<'menu' | 'parts' | 'tools' | 'pickup'>('menu');
  const [isUsbScanningActive, setIsUsbScanningActive] = useState(false);
  const [scannedParts, setScannedParts] = useState<ScannedPart[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<number | undefined>();
  const [selectedCostCenter, setSelectedCostCenter] = useState("");
  const [notes, setNotes] = useState("");
  
  // Additional state for tool and pickup modes
  const [toolMode, setToolMode] = useState<'signout' | 'return'>('signout');
  const [pickupCode, setPickupCode] = useState("");
  const [manualToolNumber, setManualToolNumber] = useState("");
  
  // Quantity prompt dialog
  const [showQuantityPrompt, setShowQuantityPrompt] = useState(false);
  const [pendingPart, setPendingPart] = useState<any>(null);
  const [quantityInput, setQuantityInput] = useState("1");
  
  // Manual entry dialog
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
  const [manualEntryBarcode, setManualEntryBarcode] = useState("");
  const [manualEntryDescription, setManualEntryDescription] = useState("");
  
  // USB Scanner handling
  const [lastScanTime, setLastScanTime] = useState(0);
  const [usbScanBuffer, setUsbScanBuffer] = useState("");
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Get data for selections
  const { data: buildings = [] } = useQuery({
    queryKey: ['/api/buildings-public'],
    retry: 3,
  });
  
  const { data: technicians = [] } = useQuery({
    queryKey: ['/api/technicians-list'],
    retry: 3,
  });
  
  const { data: costCenters = [] } = useQuery({
    queryKey: ['/api/cost-centers-public'],
    retry: 3,
  });

  // Auto-select cost center based on building
  useEffect(() => {
    if (selectedBuilding && costCenters && Array.isArray(costCenters) && costCenters.length > 0) {
      const buildingData = (buildings as any[]).find(b => b.id === selectedBuilding);
      if (buildingData) {
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
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    } else {
      setIsUsbScanningActive(false);
    }
  }, [kioskMode, user?.role]);

  // Handle USB Barcode Scanner Input - Works on all devices
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only process when USB scanning is active and dialogs are closed
      if (!isUsbScanningActive || showQuantityPrompt || showManualEntryDialog) return;

      // Ignore system keys and shortcuts
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      const char = event.key;

      // Handle Enter key (end of barcode scan) - Universal across all devices
      if (char === 'Enter' || char === 'Return') {
        event.preventDefault();
        event.stopPropagation();
        
        if (usbScanBuffer.trim().length > 3) { // Minimum barcode length
          console.log(`USB Scanner: Processing complete barcode: ${usbScanBuffer.trim()}`);
          handleBarcodeScanned(usbScanBuffer.trim());
          setUsbScanBuffer("");
        }
        return;
      }

      // Handle backspace for corrections
      if (char === 'Backspace') {
        event.preventDefault();
        setUsbScanBuffer(prev => prev.slice(0, -1));
        return;
      }

      // Handle all printable characters including special characters common in barcodes
      if (char.length === 1 && char.match(/[a-zA-Z0-9\-_\.\+\*\#\@\!\$\%\&\(\)\[\]\{\}\|\\\:\;\'\"\,\<\>\?\=\~\`]/)) {
        event.preventDefault();
        event.stopPropagation();
        
        setUsbScanBuffer(prev => {
          const newBuffer = prev + char;
          console.log(`USB Scanner: Buffer: "${newBuffer}"`);
          return newBuffer;
        });
        
        // Clear buffer after 150ms of inactivity (compatible with all scanner speeds)
        clearTimeout(window.scannerTimeout);
        window.scannerTimeout = setTimeout(() => {
          setUsbScanBuffer("");
          console.log('USB Scanner: Buffer cleared due to timeout');
        }, 150);
      }
    };

    // Handle input events for touch devices and alternative input methods
    const handleInput = (event: Event) => {
      if (!isUsbScanningActive || showQuantityPrompt || showManualEntryDialog) return;
      
      const target = event.target as HTMLInputElement;
      if (target && target.value) {
        const scannedValue = target.value.trim();
        if (scannedValue.length > 3) {
          console.log(`USB Scanner: Input event detected: ${scannedValue}`);
          handleBarcodeScanned(scannedValue);
          target.value = ""; // Clear the input
        }
      }
    };

    if (isUsbScanningActive) {
      // Add both keyboard and input listeners for maximum compatibility
      document.addEventListener('keydown', handleKeyPress, true);
      
      // Focus the hidden input for better capture
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
        hiddenInputRef.current.addEventListener('input', handleInput);
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyPress, true);
        clearTimeout(window.scannerTimeout);
        
        if (hiddenInputRef.current) {
          hiddenInputRef.current.removeEventListener('input', handleInput);
        }
      };
    }
  }, [isUsbScanningActive, usbScanBuffer, showQuantityPrompt, showManualEntryDialog]);

  // Handle scanned barcode
  const handleBarcodeScanned = (barcode: string) => {
    console.log(`USB Scanner: Scanned barcode: ${barcode}`);
    
    const now = Date.now();
    if (now - lastScanTime < 2000) {
      console.log('USB Scanner: Ignoring duplicate scan');
      return;
    }
    setLastScanTime(now);

    lookupPartMutation.mutate(barcode);
  };

  // Part lookup mutation
  const lookupPartMutation = useMutation({
    mutationFn: async (barcode: string) => {
      console.log(`Looking up part with barcode: ${barcode}`);
      const response = await apiRequest("GET", `/api/parts-lookup/${encodeURIComponent(barcode)}`);
      return response.json();
    },
    onSuccess: (part) => {
      console.log(`Found part:`, part);
      
      if (part && part.name) {
        setPendingPart({
          ...part,
          isManualEntry: false,
          scannedBarcode: part.partId
        });
        setQuantityInput("1");
        setShowQuantityPrompt(true);
      }
    },
    onError: (error, variables) => {
      console.log('Part lookup failed for barcode:', variables);
      setManualEntryBarcode(variables); // variables is the barcode passed to mutate()
      setManualEntryDescription("");
      setShowManualEntryDialog(true);
      
      toast({
        title: "Part Not Found",
        description: "Please enter a description for this new part",
        variant: "destructive",
      });
    },
  });

  // Handle quantity confirmation
  const handleQuantityConfirm = () => {
    const qty = parseInt(quantityInput);
    if (qty > 0 && pendingPart) {
      const existingIndex = scannedParts.findIndex(p => p.partId === pendingPart.partId);
      
      if (existingIndex >= 0) {
        const updated = [...scannedParts];
        updated[existingIndex].quantity += qty;
        setScannedParts(updated);
        toast({
          title: "✓ Quantity Updated",
          description: `${pendingPart.name} quantity: ${updated[existingIndex].quantity}`,
        });
      } else {
        setScannedParts(prev => [...prev, {
          ...pendingPart,
          quantity: qty
        }]);
        toast({
          title: "✓ Part Added to Cart",
          description: `${pendingPart.name} x${qty}`,
        });
      }
    }
    
    setShowQuantityPrompt(false);
    setPendingPart(null);
    setQuantityInput("1");
  };

  // Manual entry save mutation
  const manualEntrySaveMutation = useMutation({
    mutationFn: async (data: { 
      scannedBarcode: string; 
      description: string; 
      quantity: number; 
      technicianUsed: string; 
      dateScanned: string; 
    }) => {
      console.log('Saving manual entry to database:', data);
      const response = await apiRequest("POST", "/api/manual-parts-review", data);
      return response.json();
    },
    onSuccess: () => {
      console.log('Manual entry saved successfully');
    },
    onError: (error) => {
      console.error('Manual entry save error:', error);
      toast({
        title: "Save Error",
        description: "Failed to save manual entry for review",
        variant: "destructive",
      });
    },
  });

  // Handle manual entry confirmation
  const handleManualEntryConfirm = async () => {
    if (!manualEntryDescription.trim() || !manualEntryBarcode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for this part",
        variant: "destructive",
      });
      return;
    }

    // For manual entries, use admin as default technician if none selected
    const technicianToUse = selectedTechnician || "admin";

    const qty = parseInt(quantityInput);
    if (qty <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save to manual review database first
      await manualEntrySaveMutation.mutateAsync({
        scannedBarcode: manualEntryBarcode,
        description: manualEntryDescription.trim(),
        quantity: qty,
        technicianUsed: technicianToUse,
        dateScanned: new Date().toISOString(),
      });

      // Add as manual entry part to cart
      const manualPart: ScannedPart = {
        id: Date.now(), // Temporary ID
        partId: manualEntryBarcode,
        name: manualEntryDescription.trim(),
        description: manualEntryDescription.trim(),
        currentStock: 0,
        unitCost: "0.00",
        location: "Manual Entry",
        quantity: qty,
        isManualEntry: true,
        scannedBarcode: manualEntryBarcode
      };
      
      setScannedParts(prev => [...prev, manualPart]);
      
      toast({
        title: "✓ Manual Entry Added",
        description: `${manualEntryDescription.trim()} x${qty} saved for admin review and added to cart`,
      });
      
      // Reset dialog
      setShowManualEntryDialog(false);
      setManualEntryBarcode("");
      setManualEntryDescription("");
      setQuantityInput("1");
    } catch (error) {
      console.error('Manual entry error:', error);
    }
  };

  // Charge out mutation
  const chargeOutMutation = useMutation({
    mutationFn: async (parts: ScannedPart[]) => {
      const results = [];
      
      for (const part of parts) {
        if (!part.isManualEntry) {
          const response = await apiRequest("POST", "/api/parts-charge-out-public", {
            partId: part.id,
            quantity: part.quantity,
            issuedTo: selectedTechnician,
            reason: "maintenance",
            notes: notes.trim() || undefined,
            costCenter: selectedCostCenter || undefined,
            buildingId: selectedBuilding,
          });
          results.push(await response.json());
        } else {
          // Save manual entry for admin review
          const response = await apiRequest("POST", "/api/manual-parts-review", {
            scannedBarcode: part.scannedBarcode,
            description: part.description,
            quantity: part.quantity,
            technicianUsed: selectedTechnician,
            dateScanned: new Date().toISOString(),
          });
          results.push(await response.json());
        }
      }
      
      return results;
    },
    onSuccess: () => {
      toast({
        title: "✓ Checkout Complete",
        description: "All parts processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process checkout",
        variant: "destructive",
      });
    },
  });

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

  const resetForm = () => {
    setScannedParts([]);
    setSelectedTechnician("");
    setSelectedBuilding(undefined);
    setSelectedCostCenter("");
    setNotes("");
    setKioskMode('menu');
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

    chargeOutMutation.mutate(scannedParts);
  };

  // Render main menu - Responsive for all devices
  if (kioskMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="text-center bg-primary text-white p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">ONU Parts Tracker Kiosk</CardTitle>
              <p className="text-primary-foreground/80 text-sm sm:text-base">Universal USB scanner interface for all devices</p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {user?.role !== 'controller' && (
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
                onClick={() => setKioskMode('parts')}
              >
                <CardHeader className="text-center p-6 sm:p-8">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-blue-600 mb-3 sm:mb-4" />
                  <CardTitle className="text-lg sm:text-xl">Parts Checkout</CardTitle>
                  <p className="text-muted-foreground text-sm sm:text-base">Scan parts with USB scanner</p>
                </CardHeader>
              </Card>
            )}
            
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
              onClick={() => setKioskMode('tools')}
            >
              <CardHeader className="text-center p-6 sm:p-8">
                <Wrench className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-600 mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">Tool SignOut</CardTitle>
                <p className="text-muted-foreground text-sm sm:text-base">Scan tool barcodes to sign out</p>
              </CardHeader>
            </Card>
            
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
              onClick={() => setKioskMode('pickup')}
            >
              <CardHeader className="text-center p-6 sm:p-8">
                <Truck className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-orange-600 mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">Parts Pickup</CardTitle>
                <p className="text-muted-foreground text-sm sm:text-base">Enter 4-digit pickup code</p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render parts checkout mode - Universal device support
  if (kioskMode === 'parts') {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile optimized */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">Parts Checkout - Universal USB Scanner</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isUsbScanningActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {isUsbScanningActive ? "Ready for scanning on all devices" : "Activating scanner..."}
                    </p>
                  </div>
                  {usbScanBuffer && (
                    <p className="text-xs text-blue-600 mt-1">
                      Scanning: {usbScanBuffer}
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setKioskMode('menu')}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Required Information First - Top Priority */}
          <Card className="mb-4 sm:mb-6 border-orange-200">
            <CardHeader className="p-4 sm:p-6 bg-orange-50 border-b border-orange-200">
              <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                ⚠️ Required Before Scanning
              </CardTitle>
              <p className="text-sm text-orange-700">Please select technician and building before scanning parts</p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Technician *</Label>
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger className="h-12 mt-2">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {(technicians as any[]).map((tech) => (
                        <SelectItem key={tech.id} value={tech.name} className="text-base">
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Building *</Label>
                  <Select value={selectedBuilding?.toString()} onValueChange={(value) => setSelectedBuilding(parseInt(value))}>
                    <SelectTrigger className="h-12 mt-2">
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {(buildings as any[]).map((building) => (
                        <SelectItem key={building.id} value={building.id.toString()} className="text-base">
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4">
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Input
                  className="h-12 mt-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Work order, repair notes, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Only show scanning section AFTER required fields are selected */}
          {selectedTechnician && selectedBuilding && (
            <Card className="mb-4 sm:mb-6 border-green-200">
              <CardHeader className="p-4 sm:p-6 bg-green-50 border-b border-green-200">
                <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                  ✓ Ready to Scan Parts
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${isUsbScanningActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                  <p className="text-sm text-green-700">
                    {isUsbScanningActive ? "USB scanner active - scan barcodes now" : "Activating scanner..."}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Scan part barcodes with your USB scanner.<br/>
                    For unknown parts, you can enter descriptions manually.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Shopping Cart - Always visible */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg">Shopping Cart ({scannedParts.length})</CardTitle>
                {!selectedTechnician || !selectedBuilding ? (
                  <p className="text-sm text-orange-600">Complete required information above to start scanning</p>
                ) : null}
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {scannedParts.map((part) => (
                    <div key={part.partId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0 mb-3 sm:mb-0 sm:mr-3">
                        <p className="font-medium text-sm sm:text-base truncate">{part.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{part.partId}</p>
                        {part.isManualEntry && (
                          <Badge variant="outline" className="text-orange-600 text-xs mt-1">
                            Manual Entry - Pending Review
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updatePartQuantity(part.partId, part.quantity - 1)}
                            className="h-8 w-8 p-0 touch-manipulation"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{part.quantity}</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updatePartQuantity(part.partId, part.quantity + 1)}
                            className="h-8 w-8 p-0 touch-manipulation"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => removePart(part.partId)}
                          className="h-8 w-8 p-0 touch-manipulation"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {scannedParts.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-muted-foreground">
                        Cart is empty. Scan a barcode to add parts.
                      </p>
                    </div>
                  )}
                </div>

                {scannedParts.length > 0 && (
                  <Button 
                    className="w-full mt-4 h-12 text-base font-medium touch-manipulation" 
                    onClick={processChargeOut}
                    disabled={chargeOutMutation.isPending || !selectedTechnician || !selectedBuilding}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete Checkout ({scannedParts.length} item{scannedParts.length > 1 ? 's' : ''})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hidden input for USB scanner focus - Enhanced for all devices */}
          <input
            ref={hiddenInputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{ 
              position: 'absolute', 
              left: '-9999px', 
              opacity: 0,
              width: '1px',
              height: '1px',
              border: 'none',
              outline: 'none',
              background: 'transparent'
            }}
            autoFocus
            tabIndex={-1}
            onBlur={() => {
              // Immediately refocus to maintain scanner input capture
              if (isUsbScanningActive && hiddenInputRef.current) {
                setTimeout(() => {
                  hiddenInputRef.current?.focus();
                }, 10);
              }
            }}
          />

          {/* Quantity Prompt Dialog - Touch optimized */}
          <Dialog open={showQuantityPrompt} onOpenChange={setShowQuantityPrompt}>
            <DialogContent className="max-w-sm sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">Enter Quantity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-base">How many <strong className="text-primary">{pendingPart?.name}</strong> do you need?</p>
                <Input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  min="1"
                  className="h-12 text-lg text-center"
                  autoFocus
                />
              </div>
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuantityPrompt(false)}
                  className="h-12 flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleQuantityConfirm}
                  className="h-12 flex-1"
                >
                  Add to Cart
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Manual Entry Dialog - Touch optimized */}
          <Dialog open={showManualEntryDialog} onOpenChange={setShowManualEntryDialog}>
            <DialogContent className="max-w-sm sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">Manual Part Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-base">Barcode <strong className="text-primary">{manualEntryBarcode}</strong> not found in system.</p>
                <div>
                  <Label className="text-sm font-medium">Part Description</Label>
                  <Input
                    className="h-12 mt-2"
                    value={manualEntryDescription}
                    onChange={(e) => setManualEntryDescription(e.target.value)}
                    placeholder="Describe the part..."
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <Input
                    type="number"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    min="1"
                    className="h-12 mt-2 text-center"
                  />
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-800">
                    This entry will be saved for admin review and can be added to inventory later.
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowManualEntryDialog(false)}
                  className="h-12 flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualEntryConfirm}
                  className="h-12 flex-1"
                  disabled={manualEntrySaveMutation.isPending}
                >
                  {manualEntrySaveMutation.isPending ? "Saving..." : "Add to Cart"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Render tool signout mode
  if (kioskMode === 'tools') {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Tool SignOut</CardTitle>
                  <p className="text-sm sm:text-base text-muted-foreground">Scan tool barcodes or enter manually</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setKioskMode('menu')}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tool SignOut Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tool signout functionality will be added in the next update.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render parts pickup mode
  if (kioskMode === 'pickup') {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Parts Pickup</CardTitle>
                  <p className="text-sm sm:text-base text-muted-foreground">Enter your 4-digit pickup code</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setKioskMode('menu')}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parts Pickup Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Parts pickup functionality will be added in the next update.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}