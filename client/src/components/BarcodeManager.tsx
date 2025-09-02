import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Star, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PartBarcode {
  id: number;
  partId: number;
  barcode: string;
  supplier?: string | null;
  isPrimary: boolean;
  active: boolean;
  createdAt: Date;
}

interface PartBarcodeWithPart extends PartBarcode {
  part: {
    id: number;
    partId: string;
    name: string;
    description: string | null;
  };
}

interface BarcodeManagerProps {
  partId?: number;
  partNumber?: string;
  showAllBarcodes?: boolean;
}

export function BarcodeManager({ partId, partNumber, showAllBarcodes = false }: BarcodeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState<PartBarcode | null>(null);
  const [newBarcode, setNewBarcode] = useState({
    barcode: '',
    supplier: '',
    isPrimary: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for barcodes
  const { data: barcodes, isLoading } = useQuery({
    queryKey: showAllBarcodes ? ['barcodes'] : ['part-barcodes', partNumber],
    queryFn: () => showAllBarcodes 
      ? fetch('/api/barcodes').then(res => res.json())
      : fetch(`/api/parts/${partNumber}/barcodes`).then(res => res.json()),
    enabled: showAllBarcodes || !!partNumber
  });

  // Create barcode mutation
  const createBarcodeMutation = useMutation({
    mutationFn: (data: { partId: number; barcode: string; supplier?: string; isPrimary?: boolean }) =>
      apiRequest('POST', '/api/barcodes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      queryClient.invalidateQueries({ queryKey: ['part-barcodes'] });
      setNewBarcode({ barcode: '', supplier: '', isPrimary: false });
      setIsOpen(false);
      toast({
        title: "Barcode Added",
        description: "Barcode has been successfully added to the part.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add barcode. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update barcode mutation
  const updateBarcodeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PartBarcode> }) =>
      apiRequest('PUT', `/api/barcodes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      queryClient.invalidateQueries({ queryKey: ['part-barcodes'] });
      setEditingBarcode(null);
      toast({
        title: "Barcode Updated",
        description: "Barcode has been successfully updated.",
      });
    }
  });

  // Delete barcode mutation
  const deleteBarcodeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/barcodes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      queryClient.invalidateQueries({ queryKey: ['part-barcodes'] });
      toast({
        title: "Barcode Deleted",
        description: "Barcode has been successfully removed.",
      });
    }
  });

  // Set primary barcode mutation
  const setPrimaryMutation = useMutation({
    mutationFn: ({ barcodeId, partId }: { barcodeId: number; partId: number }) =>
      apiRequest('PUT', `/api/barcodes/${barcodeId}/primary`, { partId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      queryClient.invalidateQueries({ queryKey: ['part-barcodes'] });
      toast({
        title: "Primary Barcode Set",
        description: "Primary barcode has been updated.",
      });
    }
  });

  const handleCreateBarcode = () => {
    if (!partId || !newBarcode.barcode.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid barcode.",
        variant: "destructive"
      });
      return;
    }

    createBarcodeMutation.mutate({
      partId,
      barcode: newBarcode.barcode.trim(),
      supplier: newBarcode.supplier.trim() || undefined,
      isPrimary: newBarcode.isPrimary
    });
  };

  const handleUpdateBarcode = () => {
    if (!editingBarcode) return;

    updateBarcodeMutation.mutate({
      id: editingBarcode.id,
      data: editingBarcode
    });
  };

  const handleSetPrimary = (barcodeId: number, partId: number) => {
    setPrimaryMutation.mutate({ barcodeId, partId });
  };

  const displayBarcodes = showAllBarcodes ? barcodes : barcodes;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {showAllBarcodes ? "All Barcodes" : "Part Barcodes"}
        </h3>
        
        {!showAllBarcodes && partId && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Barcode
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Barcode</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={newBarcode.barcode}
                    onChange={(e) => setNewBarcode(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Enter barcode"
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier">Supplier (Optional)</Label>
                  <Input
                    id="supplier"
                    value={newBarcode.supplier}
                    onChange={(e) => setNewBarcode(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Enter supplier name"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="isPrimary"
                    type="checkbox"
                    checked={newBarcode.isPrimary}
                    onChange={(e) => setNewBarcode(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  />
                  <Label htmlFor="isPrimary">Set as primary barcode</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateBarcode} disabled={createBarcodeMutation.isPending}>
                    {createBarcodeMutation.isPending ? "Adding..." : "Add Barcode"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading barcodes...</div>
      ) : !displayBarcodes || displayBarcodes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No barcodes found for this part.
        </div>
      ) : (
        <div className="grid gap-3">
          {displayBarcodes.map((barcode: PartBarcodeWithPart | PartBarcode) => (
            <Card key={barcode.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {barcode.barcode}
                    </code>
                    {barcode.isPrimary && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  
                  {barcode.supplier && (
                    <div className="text-sm text-gray-600">
                      Supplier: {barcode.supplier}
                    </div>
                  )}
                  
                  {showAllBarcodes && 'part' in barcode && (
                    <div className="text-sm">
                      <span className="font-medium">{barcode.part.partId}</span> - {barcode.part.name}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {!barcode.isPrimary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPrimary(barcode.id, barcode.partId)}
                      disabled={setPrimaryMutation.isPending}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingBarcode(barcode)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteBarcodeMutation.mutate(barcode.id)}
                    disabled={deleteBarcodeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingBarcode && (
        <Dialog open={!!editingBarcode} onOpenChange={() => setEditingBarcode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Barcode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-barcode">Barcode</Label>
                <Input
                  id="edit-barcode"
                  value={editingBarcode.barcode}
                  onChange={(e) => setEditingBarcode(prev => prev ? { ...prev, barcode: e.target.value } : null)}
                  placeholder="Enter barcode"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={editingBarcode.supplier || ''}
                  onChange={(e) => setEditingBarcode(prev => prev ? { ...prev, supplier: e.target.value } : null)}
                  placeholder="Enter supplier name"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateBarcode} disabled={updateBarcodeMutation.isPending}>
                  {updateBarcodeMutation.isPending ? "Updating..." : "Update Barcode"}
                </Button>
                <Button variant="outline" onClick={() => setEditingBarcode(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}