import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Download, 
  Upload,
  FileSpreadsheet,
  Search
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/app-layout";
import LoadingSpinner from "@/components/loading-spinner";
import { useRole } from "@/hooks/use-role";

interface StaffMember {
  id: number;
  name: string;
  buildingId: number;
  costCenterId: number;
  email?: string;
  phone?: string;
  building?: {
    id: number;
    name: string;
  };
  costCenter?: {
    id: number;
    code: string;
    name: string;
  };
}

interface Building {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  code: string;
  name: string;
}

export default function StaffManagement() {
  const { isAdmin } = useRole();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    buildingId: 0,
    costCenterId: 0,
    email: "",
    phone: ""
  });
  const { toast } = useToast();

  // Fetch staff members
  const { data: staffMembers, isLoading: isLoadingStaff, error: staffError } = useQuery<StaffMember[]>({
    queryKey: ['/api/staff'],
    retry: 1
  });

  // Fetch buildings
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery<Building[]>({
    queryKey: ['/api/buildings'],
    retry: 1
  });

  // Fetch cost centers
  const { data: costCenters, isLoading: isLoadingCostCenters } = useQuery<CostCenter[]>({
    queryKey: ['/api/cost-centers'],
    retry: 1
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<StaffMember, "id" | "building" | "costCenter">) => {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create staff member");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: "Staff member created",
        description: "Staff member was created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating staff member",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<StaffMember, "id" | "building" | "costCenter">> }) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update staff member");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: "Staff member updated",
        description: "Staff member was updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating staff member",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete staff member");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: "Staff member deleted",
        description: "Staff member was deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting staff member",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.buildingId || !formData.costCenterId) {
      toast({
        title: "Validation Error",
        description: "Name, Building, and Cost Center are required fields",
        variant: "destructive"
      });
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.buildingId || !formData.costCenterId) {
      toast({
        title: "Validation Error",
        description: "Name, Building, and Cost Center are required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedStaff) {
      updateMutation.mutate({
        id: selectedStaff.id,
        data: formData
      });
    }
  };

  const handleDelete = (staff: StaffMember) => {
    if (confirm(`Are you sure you want to delete ${staff.name}?`)) {
      deleteMutation.mutate(staff.id);
    }
  };

  const handleEditClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      buildingId: staff.buildingId,
      costCenterId: staff.costCenterId,
      email: staff.email || "",
      phone: staff.phone || ""
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      buildingId: 0,
      costCenterId: 0,
      email: "",
      phone: ""
    });
    setSelectedStaff(null);
  };

  // Export staff
  const handleExport = async () => {
    try {
      const response = await fetch("/api/staff/export");
      
      if (!response.ok) {
        throw new Error("Failed to export staff members");
      }
      
      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "staff-members.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Staff members exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Get template
  const handleGetTemplate = async () => {
    try {
      const response = await fetch("/api/staff/template");
      
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      
      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "staff-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Template download successful",
        description: "Staff members template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Template download failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Import staff
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("/api/staff/import", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Import failed");
      }
      
      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: "Import successful",
        description: `Imported ${result.importedRows} staff members successfully.`,
      });
      
      // Reset the file input
      e.target.value = "";
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      // Reset the file input
      e.target.value = "";
    }
  };

  // Filter staff members by search term
  const filteredStaff = staffMembers?.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.building?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.costCenter?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.costCenter?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingStaff || isLoadingBuildings || isLoadingCostCenters) return <LoadingSpinner />;

  if (staffError) {
    return (
      <AppLayout title="Staff Management">
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error loading staff members: {staffError instanceof Error ? staffError.message : "Unknown error"}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Staff Management">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              Manage staff members for parts deliveries
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGetTemplate}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative"
                    onClick={() => document.getElementById("import-staff-file")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <input
                    id="import-staff-file"
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleImport}
                  />
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Staff Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Staff Member</DialogTitle>
                      <DialogDescription>
                        Add a new staff member to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="building" className="text-right">
                            Building <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            onValueChange={(value) => setFormData({...formData, buildingId: parseInt(value)})}
                            value={formData.buildingId ? formData.buildingId.toString() : ""}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a building" />
                            </SelectTrigger>
                            <SelectContent>
                              {buildings?.map(building => (
                                <SelectItem key={building.id} value={building.id.toString()}>
                                  {building.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="costCenter" className="text-right">
                            Cost Center <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            onValueChange={(value) => setFormData({...formData, costCenterId: parseInt(value)})}
                            value={formData.costCenterId ? formData.costCenterId.toString() : ""}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a cost center" />
                            </SelectTrigger>
                            <SelectContent>
                              {costCenters?.map(center => (
                                <SelectItem key={center.id} value={center.id.toString()}>
                                  {center.code} - {center.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="phone" className="text-right">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            resetForm();
                            setIsCreateDialogOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending ? "Creating..." : "Create Staff Member"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff members..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff && filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.building?.name}</TableCell>
                    <TableCell>{staff.costCenter?.code} - {staff.costCenter?.name}</TableCell>
                    <TableCell>{staff.email || "-"}</TableCell>
                    <TableCell>{staff.phone || "-"}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(staff)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(staff)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center">
                    {searchTerm 
                      ? "No staff members found matching your search." 
                      : `No staff members found. ${isAdmin ? "Create one to get started." : ""}`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-building" className="text-right">
                  Building <span className="text-red-500">*</span>
                </Label>
                <Select 
                  onValueChange={(value) => setFormData({...formData, buildingId: parseInt(value)})}
                  value={formData.buildingId ? formData.buildingId.toString() : ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings?.map(building => (
                      <SelectItem key={building.id} value={building.id.toString()}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-costCenter" className="text-right">
                  Cost Center <span className="text-red-500">*</span>
                </Label>
                <Select 
                  onValueChange={(value) => setFormData({...formData, costCenterId: parseInt(value)})}
                  value={formData.costCenterId ? formData.costCenterId.toString() : ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a cost center" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters?.map(center => (
                      <SelectItem key={center.id} value={center.id.toString()}>
                        {center.code} - {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Staff Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}