import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle, Download, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function TechniciansPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTechnician, setNewTechnician] = useState({
    name: "",
    username: "",
    password: "",
    role: "technician",
    department: ""
  });

  // Check if we're on a mobile device to use the special endpoint that doesn't require authentication
  const isMobile = window.innerWidth <= 768 || navigator.userAgent.toLowerCase().includes('mobile');
  
  // Helper function to invalidate queries based on device
  const invalidateQueries = () => {
    // Always invalidate the regular endpoint
    queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
    // Also invalidate the mobile endpoint if on mobile
    if (isMobile) {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-admin/technicians"] });
    }
  };

  const {
    data: technicians,
    isLoading,
    error
  } = useQuery<User[]>({
    queryKey: [isMobile ? "/api/mobile-admin/technicians" : "/api/technicians"],
    refetchOnWindowFocus: false
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/technicians/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Technician deleted",
        description: "The technician has been successfully deleted",
      });
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete technician: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const addTechnicianMutation = useMutation({
    mutationFn: async (data: typeof newTechnician) => {
      const response = await apiRequest("POST", `/api/technicians`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Technician added",
        description: "The technician has been successfully added",
      });
      setIsAddDialogOpen(false);
      setNewTechnician({
        name: "",
        username: "",
        password: "",
        role: "technician",
        department: ""
      });
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add technician: ${error.message}`,
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
      const response = await fetch("/api/technicians/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Import successful",
          description: `Imported ${result.importedRows} of ${result.totalRows} technicians`,
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
    addTechnicianMutation.mutate(newTechnician);
  };

  const handleDownloadTemplate = () => {
    window.location.href = "/api/technicians/template";
  };

  const handleExportTechnicians = () => {
    window.location.href = "/api/technicians/export";
  };

  const handleDeleteTechnician = (id: number) => {
    deleteTechnicianMutation.mutate(id);
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
            <p>Failed to load technicians: {(error as Error).message}</p>
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
  
  // Check if the current user is not an admin and redirect them
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
        <h1 className="text-3xl font-bold">Technicians Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" onClick={handleExportTechnicians}>
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
                <DialogTitle>Import Technicians</DialogTitle>
                <DialogDescription>
                  Upload an Excel file with technician data. 
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
                Add Technician
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Technician</DialogTitle>
                <DialogDescription>
                  Enter the details for the new technician.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newTechnician.name}
                      onChange={(e) => setNewTechnician({...newTechnician, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newTechnician.department}
                      onChange={(e) => setNewTechnician({...newTechnician, department: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username (Optional)</Label>
                    <Input
                      id="username"
                      value={newTechnician.username}
                      onChange={(e) => setNewTechnician({...newTechnician, username: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newTechnician.password}
                      onChange={(e) => setNewTechnician({...newTechnician, password: e.target.value})}
                    />
                    <p className="text-sm text-muted-foreground">
                      Only needed if this technician will login to the system
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Technician</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Technicians</CardTitle>
          <CardDescription>
            Manage technicians who can issue parts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians && technicians.length > 0 ? (
                technicians.map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className="font-medium">{tech.name}</TableCell>
                    <TableCell>{tech.department || '-'}</TableCell>
                    <TableCell>{tech.role}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={tech.id === user?.id} // Prevent deleting current user
                            className={tech.id === user?.id ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the technician.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTechnician(tech.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No technicians found. Add one to get started.
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