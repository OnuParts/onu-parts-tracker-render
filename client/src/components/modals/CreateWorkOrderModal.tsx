import { useState } from "react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import type { User, Part } from "@shared/schema";

interface CreateWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
}

// Work order form schema
const workOrderSchema = z.object({
  type: z.enum(["maintenance", "repair", "installation", "inspection"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(5, "Description must be at least 5 characters"),
  details: z.string().optional(),
  location: z.string().min(2, "Location must be at least 2 characters"),
  dueDate: z.date().optional(),
  estimatedHours: z.coerce.number().min(0.5, "Estimated hours must be at least 0.5").optional(),
  assignedToId: z.coerce.number().optional(),
  createdById: z.coerce.number().default(1), // Default to current user (admin)
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

interface SelectedPart {
  id: number;
  partId: string;
  name: string;
  quantity: number;
}

export function CreateWorkOrderModal({ open, onClose }: CreateWorkOrderModalProps) {
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [partId, setPartId] = useState<number | null>(null);
  const [partQuantity, setPartQuantity] = useState<number>(1);
  
  const { toast } = useToast();
  
  // Fetch technicians
  const { data: technicians, isLoading: techLoading } = useQuery<User[]>({
    queryKey: ['/api/technicians'],
  });
  
  // Fetch parts
  const { data: parts, isLoading: partsLoading } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
  });
  
  // Create work order mutation
  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: WorkOrderFormValues) => {
      const response = await apiRequest("POST", "/api/work-orders", data);
      return response.json();
    },
    onSuccess: (data) => {
      // If parts were selected, issue them to the work order
      if (selectedParts.length > 0) {
        Promise.all(
          selectedParts.map(part => 
            apiRequest("POST", "/api/parts-used", {
              workOrderId: data.id,
              partId: part.id,
              quantity: part.quantity,
              issuedById: 1, // Current user (admin)
            })
          )
        ).then(() => {
          // Invalidate parts query after all parts have been issued
          queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Work Order Created",
        description: `Work order ${data.workOrderId} has been created successfully.`,
      });
      
      form.reset();
      setSelectedParts([]);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create work order: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Initialize form
  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      type: "maintenance",
      priority: "medium",
      description: "",
      details: "",
      location: "",
      estimatedHours: 1,
    },
  });
  
  // Handle form submission
  const onSubmit = (data: WorkOrderFormValues) => {
    createWorkOrderMutation.mutate(data);
  };
  
  // Add part to the selected parts list
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
      // Add new part if it doesn't exist
      setSelectedParts([
        ...selectedParts,
        {
          id: part.id,
          partId: part.partId,
          name: part.name,
          quantity: partQuantity
        }
      ]);
    }
    
    // Reset selection
    setPartId(null);
    setPartQuantity(1);
  };
  
  // Remove part from the selected parts list
  const removePart = (id: number) => {
    setSelectedParts(selectedParts.filter(p => p.id !== id));
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Work Order</DialogTitle>
          <DialogDescription>
            Create a new work order and assign it to a technician.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the work order" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed information about the work order" 
                        rows={3} 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Building, room, area" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select Technician --" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">-- Select Technician --</SelectItem>
                        {technicians?.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id.toString()}>
                            {tech.name} ({tech.specialty || 'General'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.5" 
                        step="0.5" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Parts Needed</h4>
              
              <div className="mb-2 flex items-center space-x-2">
                <Select onValueChange={(value) => setPartId(Number(value))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="-- Select Part --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Select Part --</SelectItem>
                    {parts?.map((part) => (
                      <SelectItem key={part.id} value={part.id.toString()}>
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
              
              {selectedParts.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Part ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Quantity</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {selectedParts.map((part) => (
                        <tr key={part.id} className="hover:bg-muted">
                          <td className="px-4 py-2">{part.partId}</td>
                          <td className="px-4 py-2">{part.name}</td>
                          <td className="px-4 py-2 text-center">{part.quantity}</td>
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
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createWorkOrderMutation.isPending}
              >
                {createWorkOrderMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Work Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
