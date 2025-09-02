import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { WorkOrderStatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { CreateWorkOrderModal } from "@/components/modals/CreateWorkOrderModal";
import { WorkOrderDetailsModal } from "@/components/modals/WorkOrderDetailsModal";
import { EditWorkOrderModal } from "@/components/modals/EditWorkOrderModal";
import { PartsIssuanceModal } from "@/components/modals/PartsIssuanceModal";
import { 
  Plus, 
  Search, 
  User,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Filter,
  ArrowUpDown,
  Eye,
  PenSquare,
  Package,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WorkOrderWithAssignee } from "@shared/schema";

export default function WorkOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithAssignee | null>(null);
  const [editWorkOrder, setEditWorkOrder] = useState<WorkOrderWithAssignee | null>(null);
  const [issueParts, setIssueParts] = useState<WorkOrderWithAssignee | null>(null);
  
  // Fetch work orders
  const { data: workOrders, isLoading } = useQuery<WorkOrderWithAssignee[]>({
    queryKey: ['/api/work-orders'],
  });
  
  // Filter and sort work orders
  const filteredWorkOrders = workOrders?.filter(wo => {
    let matches = true;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      matches = matches && (
        wo.workOrderId.toLowerCase().includes(searchLower) ||
        wo.description.toLowerCase().includes(searchLower) ||
        wo.location.toLowerCase().includes(searchLower) ||
        wo.assignedTo?.name.toLowerCase().includes(searchLower) ||
        false
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      matches = matches && wo.status === statusFilter;
    }
    
    // Apply priority filter
    if (priorityFilter) {
      matches = matches && wo.priority === priorityFilter;
    }
    
    return matches;
  }) || [];
  
  // Sort by created date (newest first)
  const sortedWorkOrders = [...filteredWorkOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Table columns
  const columns = [
    {
      header: "ID",
      accessor: "workOrderId",
      className: "whitespace-nowrap",
    },
    {
      header: "Description",
      accessor: "description",
    },
    {
      header: "Type",
      accessor: (wo: WorkOrderWithAssignee) => (
        <span className="capitalize">{wo.type.replace('_', ' ')}</span>
      ),
    },
    {
      header: "Priority",
      accessor: (wo: WorkOrderWithAssignee) => (
        <PriorityBadge priority={wo.priority} />
      ),
    },
    {
      header: "Status",
      accessor: (wo: WorkOrderWithAssignee) => (
        <WorkOrderStatusBadge status={wo.status} />
      ),
    },
    {
      header: "Location",
      accessor: "location",
    },
    {
      header: "Assigned To",
      accessor: (wo: WorkOrderWithAssignee) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          {wo.assignedTo?.name || "Unassigned"}
        </div>
      ),
    },
    {
      header: "Due Date",
      accessor: (wo: WorkOrderWithAssignee) => (
        wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "No Due Date"
      ),
      className: "whitespace-nowrap",
    },
    {
      header: "Actions",
      accessor: (wo: WorkOrderWithAssignee) => (
        <div className="flex justify-end space-x-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedWorkOrder(wo);
            }}
          >
            <Eye className="h-4 w-4 text-primary" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditWorkOrder(wo);
            }}
          >
            <PenSquare className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIssueParts(wo);
            }}
            disabled={wo.status === 'completed' || wo.status === 'cancelled'}
          >
            <Package className="h-4 w-4 text-secondary" />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading work orders...</span>
      </div>
    );
  }
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Work Orders</h2>
          <p className="text-muted-foreground">Manage maintenance tasks and repairs</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Work Order
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine work orders by search term or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setPriorityFilter("");
                }}
              >
                <Filter className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button variant="outline" className="flex-1">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Sort
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="py-4">
          <CardTitle>All Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sortedWorkOrders}
            columns={columns}
            itemsPerPage={10}
            onRowClick={(wo) => setSelectedWorkOrder(wo)}
          />
        </CardContent>
      </Card>
      
      {isCreateModalOpen && (
        <CreateWorkOrderModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
      
      {selectedWorkOrder && (
        <WorkOrderDetailsModal
          open={!!selectedWorkOrder}
          workOrderId={selectedWorkOrder.workOrderId}
          onClose={() => setSelectedWorkOrder(null)}
        />
      )}
      
      {editWorkOrder && (
        <EditWorkOrderModal
          open={!!editWorkOrder}
          workOrderId={editWorkOrder.workOrderId}
          onClose={() => setEditWorkOrder(null)}
        />
      )}
      
      {issueParts && (
        <PartsIssuanceModal
          open={!!issueParts}
          workOrderId={issueParts.workOrderId}
          onClose={() => setIssueParts(null)}
        />
      )}
    </>
  );
}
