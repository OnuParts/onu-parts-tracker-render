import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { WorkOrderWithAssignee, Part } from "@shared/schema";

interface PartsIssuanceModalProps {
  open: boolean;
  onClose: () => void;
  workOrderId: string;
}

interface SelectedPart {
  id: number;
  partId: string;
  name: string;
  quantity: number;
  available: number;
}

export function PartsIssuanceModal({ open, onClose, workOrderId }: PartsIssuanceModalProps) {
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [partId, setPartId] = useState<number | null>(null);
  const [partQuantity, setPartQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [isIssuing, setIsIssuing] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Fetch work order details
  const { data: workOrder } = useQuery<WorkOrderWithAssignee>({
    queryKey: [`/api/work-orders/${workOrderId}`],
    enabled: open,
  });
  
  // Fetch parts
  const { data: parts, isLoading: partsLoading } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
    enabled: open,
  });
  
  // Issue parts mutation
  const issuePartsMutation = useMutation({
    mutationFn: async ({ 
      workOrderId, 
      partId, 
      quantity, 
      notes 
    }: { 
      workOrderId: number; 
      partId: number; 
      quantity: number; 
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/parts-used", {
        workOrderId,
        partId,
        quantity,
        issuedById: 1, // Current user (admin)
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/low-stock'] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to issue part: ${error.message}`,
        variant: "destructive",
      });
      setIsIssuing(false);
    },
  });
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedParts([]);
      setPartId(null);
      setPartQuantity(1);
      setNotes("");
      setIsIssuing(false);
    }
  }, [open]);
  
  // Add part to selected parts
  const addPart = () => {
    if (!partId) return;
    
    const part = parts?.find(p => p.id === partId);
    if (!part) return;
    
    // Check if part already exists in the list
    const existingPartIndex = selectedParts.findIndex(p => p.id === partId);
    
    if (existingPartIndex >= 0) {
      // Update quantity if part already exists
      const updatedParts = [...selectedParts];
      updatedParts[existingPartIndex].quantity += partQuantity;
      setSelectedParts(updatedParts);
    } else {
      // Add new part
      setSelectedParts([
        ...selectedParts,
        {
          id: part.id,
          partId: part.partId,
          name: part.name,
          quantity: partQuantity,
          available: part.quantity
        }
      ]);
    }
    
    // Reset selection
    setPartId(null);
    setPartQuantity(1);
  };
  
  // Remove part from selected parts
  const removePart = (id: number) => {
    setSelectedParts(selectedParts.filter(p => p.id !== id));
  };
  
  // Issue parts to work order
  const issueParts = async () => {
    if (!workOrder || selectedParts.length === 0) return;
    
    setIsIssuing(true);
    
    try {
      // Issue each part sequentially
      for (const part of selectedParts) {
        await issuePartsMutation.mutateAsync({
          workOrderId: workOrder.id,
          partId: part.id,
          quantity: part.quantity,
          notes,
        });
      }
      
      toast({
        title: "Parts Issued",
        description: `Parts have been issued to work order ${workOrderId}.`,
      });
      
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error issuing parts:", error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue Parts to Work Order</DialogTitle>
          <DialogDescription>
            Select parts to issue to work order {workOrderId}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Work Order</Label>
            <div className="border p-3 rounded-md">
              <p className="font-medium">{workOrderId}: {workOrder?.description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {workOrder?.location} • Assigned to: {workOrder?.assignedTo?.name || "Unassigned"}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Add Parts</Label>
            <div className="flex items-center space-x-2">
              <Select onValueChange={(value) => setPartId(Number(value))}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="-- Select Part --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Select Part --</SelectItem>
                  {parts?.map((part) => (
                    <SelectItem 
                      key={part.id} 
                      value={part.id.toString()}
                      disabled={part.quantity <= 0}
                    >
                      {part.partId}: {part.name} ({part.quantity} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input 
                type="number" 
                min="1"
                max={partId ? parts?.find(p => p.id === partId)?.quantity || 1 : 1}
                value={partQuantity} 
                onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              
              <Button 
                type="button"
                size="icon"
                onClick={addPart}
                disabled={!partId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {selectedParts.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Part ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {selectedParts.map((part) => (
                    <tr key={part.id} className="hover:bg-muted">
                      <td className="px-4 py-2">{part.partId}</td>
                      <td className="px-4 py-2">{part.name}</td>
                      <td className="px-4 py-2 text-center">
                        {part.quantity}
                        {part.quantity > part.available && (
                          <span className="ml-1 text-destructive text-xs">
                            (Only {part.available} in stock)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removePart(part.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 border rounded-md">
              <p className="text-muted-foreground">No parts selected</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes"
              placeholder="Optional notes about this parts issuance"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isIssuing}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={issueParts}
            disabled={isIssuing || selectedParts.length === 0}
          >
            {isIssuing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Issuing...
              </>
            ) : (
              "Issue Parts"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
