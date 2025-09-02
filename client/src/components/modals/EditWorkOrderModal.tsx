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
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import type { WorkOrderWithAssignee, User } from "@shared/schema";

interface EditWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  workOrderId: string;
}

// Work order form schema
const workOrderSchema = z.object({
  type: z.enum(["maintenance", "repair", "installation", "inspection"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(5, "Description must be at least 5 characters"),
  details: z.string().optional(),
  location: z.string().min(2, "Location must be at least 2 characters"),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  dueDate: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  estimatedHours: z.coerce.number().min(0.5, "Estimated hours must be at least 0.5").optional(),
  actualHours: z.coerce.number().min(0, "Actual hours must be non-negative").optional(),
  assignedToId: z.coerce.number().optional().nullable(),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export function EditWorkOrderModal({ open, onClose, workOrderId }: EditWorkOrderModalProps) {
  const { toast } = useToast();
  
  // Fetch work order details
  const { data: workOrder, isLoading: workOrderLoading } = useQuery<WorkOrderWithAssignee>({
    queryKey: [`/api/work-orders/${workOrderId}`],
    enabled: open,
  });
  
  // Fetch technicians
  const { data: technicians, isLoading: techLoading } = useQuery<User[]>({
    queryKey: ['/api/technicians'],
    enabled: open,
  });
  
  // Update work order mutation
  const updateWorkOrderMutation = useMutation({
    mutationFn: async (data: WorkOrderFormValues) => {
      const response = await apiRequest("PATCH", `/api/work-orders/${workOrderId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/recent'] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Work Order Updated",
        description: `Work order ${workOrderId} has been updated successfully.`,
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update work order: ${error.message}`,
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
      status: "pending",
      estimatedHours: 1,
      actualHours: undefined,
      assignedToId: null,
    },
  });
  
  // Update form values when work order data is loaded
  useEffect(() => {
    if (workOrder) {
      form.reset({
        type: workOrder.type,
        priority: workOrder.priority,
        description: workOrder.description,
        details: workOrder.details || "",
        location: workOrder.location,
        status: workOrder.status,
        dueDate: workOrder.dueDate ? new Date(workOrder.dueDate) : null,
        completedAt: workOrder.completedAt ? new Date(workOrder.completedAt) : null,
        estimatedHours: workOrder.estimatedHours,
        actualHours: workOrder.actualHours,
        assignedToId: workOrder.assignedToId || null,
      });
    }
  }, [workOrder, form]);
  
  // Watch status field to handle completedAt
  const status = form.watch("status");
  useEffect(() => {
    // Set completedAt to current date if status changes to completed
    // and completedAt is not set
    if (status === "completed" && !form.getValues("completedAt")) {
      form.setValue("completedAt", new Date());
    }
    
    // Clear completedAt if status is not completed
    if (status !== "completed") {
      form.setValue("completedAt", null);
    }
  }, [status, form]);
  
  // Handle form submission
  const onSubmit = (data: WorkOrderFormValues) => {
    updateWorkOrderMutation.mutate(data);
  };
  
  // Show loading state
  if (workOrderLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading work order details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Work Order</DialogTitle>
          <DialogDescription>
            Update work order {workOrderId}.
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
                      value={field.value}
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
                      value={field.value}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)} 
                      value={field.value?.toString() || ""}
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
                          selected={field.value || undefined}
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
                name="completedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            disabled={status !== "completed"}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
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
              
              <FormField
                control={form.control}
                name="actualHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.5" 
                        {...field}
                        value={field.value || ""}
                        disabled={status !== "completed"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={updateWorkOrderMutation.isPending}
              >
                {updateWorkOrderMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Work Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
