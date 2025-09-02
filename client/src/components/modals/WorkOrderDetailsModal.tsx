import { useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { WorkOrderStatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Tag, 
  Package2, 
  FileText, 
  PenSquare,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import type { WorkOrderWithAssignee, PartsUsedWithDetails } from "@shared/schema";

interface WorkOrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  workOrderId: string;
}

export function WorkOrderDetailsModal({ open, onClose, workOrderId }: WorkOrderDetailsModalProps) {
  // Fetch work order details
  const { data: workOrder, isLoading } = useQuery<WorkOrderWithAssignee & { partsUsed: PartsUsedWithDetails[] }>({
    queryKey: [`/api/work-orders/${workOrderId}`],
    enabled: open,
  });
  
  if (isLoading || !workOrder) {
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
  
  // Format dates
  const createdDate = format(new Date(workOrder.createdAt), "PPP");
  const dueDate = workOrder.dueDate ? format(new Date(workOrder.dueDate), "PPP") : "No due date";
  const completedDate = workOrder.completedAt ? format(new Date(workOrder.completedAt), "PPP") : "Not completed";
  
  // Calculate total parts cost
  const totalPartsCost = workOrder.partsUsed.reduce((total, pu) => {
    const unitCost = pu.part.unitCost || 0;
    return total + (unitCost * pu.quantity);
  }, 0);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            Work Order: {workOrder.workOrderId}
            <WorkOrderStatusBadge status={workOrder.status} className="ml-2" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">{workOrder.description}</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Tag className="h-4 w-4 mr-1" />
                <span className="capitalize">{workOrder.type.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <PriorityBadge priority={workOrder.priority} />
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                {workOrder.location}
              </div>
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-1" />
                {workOrder.assignedTo?.name || "Unassigned"}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="parts">
                <Package2 className="h-4 w-4 mr-2" />
                Parts ({workOrder.partsUsed.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 pt-4">
              {workOrder.details && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{workOrder.details}</p>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created:
                      </div>
                      <span>{createdDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due:
                      </div>
                      <span className={workOrder.dueDate && new Date(workOrder.dueDate) < new Date() && workOrder.status !== 'completed' ? "text-destructive" : ""}>
                        {dueDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Completed:
                      </div>
                      <span>{completedDate}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Time & Cost</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        Estimated Hours:
                      </div>
                      <span>{workOrder.estimatedHours || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        Actual Hours:
                      </div>
                      <span>{workOrder.actualHours || "Not recorded"}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Package2 className="h-4 w-4 mr-2" />
                        Parts Cost:
                      </div>
                      <span>${totalPartsCost.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {workOrder.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Start Work
                      </Button>
                    )}
                    
                    {workOrder.status === 'in_progress' && (
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}
                    
                    {(workOrder.status === 'pending' || workOrder.status === 'in_progress') && (
                      <Button variant="outline" size="sm">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <PenSquare className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    {(workOrder.status === 'pending' || workOrder.status === 'in_progress') && (
                      <Button variant="outline" size="sm">
                        <Package2 className="h-4 w-4 mr-2" />
                        Issue Parts
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="parts" className="pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Parts Used</CardTitle>
                  <CardDescription>
                    Parts issued to this work order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workOrder.partsUsed.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Part ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Unit Cost</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {workOrder.partsUsed.map((part) => (
                            <tr key={part.id} className="hover:bg-muted">
                              <td className="px-4 py-2">{part.part.partId}</td>
                              <td className="px-4 py-2">{part.part.name}</td>
                              <td className="px-4 py-2 text-center">{part.quantity}</td>
                              <td className="px-4 py-2 text-right">
                                ${part.part.unitCost ? parseFloat(part.part.unitCost.toString()).toFixed(2) : "0.00"}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                ${part.part.unitCost ? (parseFloat(part.part.unitCost.toString()) * part.quantity).toFixed(2) : "0.00"}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-muted">
                            <td colSpan={4} className="px-4 py-2 text-right font-medium">Total:</td>
                            <td className="px-4 py-2 text-right font-medium">
                              ${totalPartsCost.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-md">
                      <Package2 className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No parts have been issued to this work order</p>
                    </div>
                  )}
                </CardContent>
                {workOrder.partsUsed.length > 0 && (
                  <CardFooter className="pt-0">
                    <div className="w-full text-right text-sm text-muted-foreground">
                      Last issued: {workOrder.partsUsed.length > 0 ? format(new Date(workOrder.partsUsed[workOrder.partsUsed.length - 1].issuedAt), "PPp") : "Never"}
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
