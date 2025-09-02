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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Download, 
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/app-layout";
import LoadingSpinner from "@/components/loading-spinner";
import { useRole } from "@/hooks/use-role";

interface CostCenter {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export default function CostCenters() {
  const { isAdmin } = useRole();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: ""
  });
  const { toast } = useToast();

  // Fetch cost centers
  const { data: costCenters, isLoading, error } = useQuery<CostCenter[]>({
    queryKey: ['/api/cost-centers'],
    retry: 1
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<CostCenter, "id">) => {
      const response = await fetch("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create cost center");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: "Cost center created",
        description: "Cost center was created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating cost center",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CostCenter> }) => {
      const response = await fetch(`/api/cost-centers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update cost center");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: "Cost center updated",
        description: "Cost center was updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating cost center",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/cost-centers/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete cost center");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: "Cost center deleted",
        description: "Cost center was deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting cost center",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCostCenter) {
      updateMutation.mutate({
        id: selectedCostCenter.id,
        data: formData
      });
    }
  };

  const handleDelete = (costCenter: CostCenter) => {
    if (confirm(`Are you sure you want to delete ${costCenter.name}?`)) {
      deleteMutation.mutate(costCenter.id);
    }
  };

  const handleEditClick = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    setFormData({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description || ""
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: ""
    });
    setSelectedCostCenter(null);
  };

  // Export cost centers
  const handleExport = async () => {
    try {
      const response = await fetch("/api/cost-centers/export", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to export cost centers");
      }
      
      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "cost-centers.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Cost centers exported successfully",
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
      const response = await fetch("/api/cost-centers/template", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      
      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "cost-centers-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Template download successful",
        description: "Cost centers template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Template download failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Import cost centers
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("/api/cost-centers/import", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Import failed");
      }
      
      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: "Import successful",
        description: `Imported ${result.importedRows} cost centers successfully.`,
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

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <AppLayout title="Cost Centers">
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error loading cost centers: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Cost Centers">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cost Centers</CardTitle>
            <CardDescription>
              Manage cost centers for parts deliveries
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
                    onClick={() => document.getElementById("import-file")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <input
                    id="import-file"
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
                      Add Cost Center
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Cost Center</DialogTitle>
                      <DialogDescription>
                        Add a new cost center to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right">
                            Code
                          </Label>
                          <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
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
                          <Label htmlFor="description" className="text-right">
                            Description
                          </Label>
                          <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                          {createMutation.isPending ? "Creating..." : "Create Cost Center"}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters && costCenters.length > 0 ? (
                costCenters.map((costCenter) => (
                  <TableRow key={costCenter.id}>
                    <TableCell className="font-medium">{costCenter.code}</TableCell>
                    <TableCell>{costCenter.name}</TableCell>
                    <TableCell>{costCenter.description}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(costCenter)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(costCenter)}
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
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center">
                    No cost centers found. {isAdmin && "Create one to get started."}
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
            <DialogTitle>Edit Cost Center</DialogTitle>
            <DialogDescription>
              Update cost center information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">
                  Code
                </Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
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
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                {updateMutation.isPending ? "Updating..." : "Update Cost Center"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}