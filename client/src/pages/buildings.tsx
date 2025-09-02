import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Download, Upload, FileSpreadsheet, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function BuildingsPage() {
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({
    name: "",
    location: "",
    description: ""
  });
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

  // Check if we're on a mobile device to use the special endpoint that doesn't require authentication
  const isMobile = window.innerWidth <= 768 || navigator.userAgent.toLowerCase().includes('mobile');
  
  // Helper function to invalidate queries based on device
  const invalidateQueries = () => {
    // Always invalidate the regular endpoint
    queryClient.invalidateQueries({ queryKey: ["/api/buildings"] });
    // Also invalidate the mobile endpoint if on mobile
    if (isMobile) {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-admin/buildings"] });
    }
  };
  
  const {
    data: buildings,
    isLoading,
    error
  } = useQuery<Building[]>({
    queryKey: [isMobile ? "/api/mobile-admin/buildings" : "/api/buildings"],
    refetchOnWindowFocus: false
  });

  const addBuildingMutation = useMutation({
    mutationFn: async (data: typeof newBuilding) => {
      const response = await apiRequest("POST", `/api/buildings`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Building added",
        description: "The building has been successfully added",
      });
      setIsAddDialogOpen(false);
      setNewBuilding({
        name: "",
        location: "",
        description: ""
      });
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add building: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: async (data: Building) => {
      const response = await apiRequest("PATCH", `/api/buildings/${data.id}`, {
        name: data.name,
        location: data.location,
        description: data.description
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Building updated",
        description: "The building has been successfully updated",
      });
      setIsEditDialogOpen(false);
      setEditingBuilding(null);
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update building: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/buildings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Building deleted",
        description: "The building has been successfully deleted",
      });
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete building: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleImportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await fetch("/api/buildings/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Import successful",
          description: `Imported ${result.importedRows} of ${result.totalRows} buildings`,
        });
        setIsImportDialogOpen(false);
        setImportFile(null);
        invalidateQueries();
      } else {
        toast({
          title: "Import failed",
          description: result.error || "An error occurred during import",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    }
  };

  const handleAddSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    addBuildingMutation.mutate(newBuilding);
  };

  const handleEditSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingBuilding) {
      updateBuildingMutation.mutate(editingBuilding);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = "/api/buildings/template";
  };

  const handleExportBuildings = () => {
    window.location.href = "/api/buildings/export";
  };

  const handleDeleteBuilding = (id: number) => {
    deleteBuildingMutation.mutate(id);
  };

  const handleEditBuilding = (building: Building) => {
    setEditingBuilding(building);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load buildings: {(error as Error).message}</p>
            {(error as Error).message.includes("401") && (
              <p className="mt-2 text-sm text-destructive">You must be logged in as an administrator to access this page.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => invalidateQueries()}>
              Try again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Check if the current user is not an admin
  const { user } = useAuth();
  if (user && user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access this page. This area is restricted to administrators only.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = "/parts-issuance"}>
              Go to Parts Issuance
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Buildings Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" onClick={handleExportBuildings}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Buildings</DialogTitle>
                <DialogDescription>
                  Upload an Excel file with building data. 
                  Download the template first if you're not sure about the format.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleImportSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="file">Excel File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Only .xlsx files are supported
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Import</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Building
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Building</DialogTitle>
                <DialogDescription>
                  Enter the details for the new building.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newBuilding.name}
                      onChange={(e) => setNewBuilding({...newBuilding, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newBuilding.location}
                      onChange={(e) => setNewBuilding({...newBuilding, location: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newBuilding.description}
                      onChange={(e) => setNewBuilding({...newBuilding, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Building</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Building</DialogTitle>
            <DialogDescription>
              Update the building details.
            </DialogDescription>
          </DialogHeader>
          {editingBuilding && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingBuilding.name}
                    onChange={(e) => setEditingBuilding({...editingBuilding, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editingBuilding.location || ''}
                    onChange={(e) => setEditingBuilding({...editingBuilding, location: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingBuilding.description || ''}
                    onChange={(e) => setEditingBuilding({...editingBuilding, description: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Building</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Buildings</CardTitle>
          <CardDescription>
            Manage buildings for parts issuance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings && buildings.length > 0 ? (
                buildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-medium">{building.name}</TableCell>
                    <TableCell>{building.location || '-'}</TableCell>
                    <TableCell>{building.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditBuilding(building)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the building "{building.name}".
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBuilding(building.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No buildings found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}