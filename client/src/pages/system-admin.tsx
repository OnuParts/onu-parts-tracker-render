import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  Database, 
  Shield, 
  Activity, 
  FileText, 
  Package,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock
} from "lucide-react";

interface SystemStatus {
  status: string;
  database: string;
  lastBackup: string | null;
  errors: any[];
  requests: number;
  uptime: number;
  recentErrors: any[];
}

interface HealthCheck {
  status: string;
  timestamp: string;
  database: string;
  fileSystem: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  version: string;
}

export default function SystemAdmin() {
  const { toast } = useToast();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDownloadingGuide, setIsDownloadingGuide] = useState(false);
  const [isDownloadingPackage, setIsDownloadingPackage] = useState(false);

  // Fetch system status
  const { data: systemStatus, refetch: refetchStatus } = useQuery<SystemStatus>({
    queryKey: ['/api/system-status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch health check
  const { data: healthCheck, refetch: refetchHealth } = useQuery<HealthCheck>({
    queryKey: ['/api/health'],
    refetchInterval: 60000, // Refresh every minute
  });

  const formatUptime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/create-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Backup Created",
          description: `Backup file: ${result.file}`,
        });
        refetchStatus();
      } else {
        toast({
          title: "Backup Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Backup Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadGuide = async () => {
    setIsDownloadingGuide(true);
    try {
      const response = await fetch('/api/download-deployment-guide');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ONU-Parts-Tracker-Deployment-Guide.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Started",
          description: "Deployment guide PDF download started",
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download deployment guide",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingGuide(false);
    }
  };

  const handleDownloadPackage = async () => {
    setIsDownloadingPackage(true);
    try {
      const response = await fetch('/api/download-export-package');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'onu-parts-tracker-complete.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Started",
          description: "Complete export package download started",
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download export package",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPackage(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'accessible':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
      case 'disconnected':
      case 'inaccessible':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'accessible':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'unhealthy':
      case 'disconnected':
      case 'inaccessible':
        return <Badge variant="destructive">Unhealthy</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">Monitor system health and manage deployments</p>
        </div>
        <div className="flex items-center gap-2">
          {healthCheck && getStatusIcon(healthCheck.status)}
          {healthCheck && getStatusBadge(healthCheck.status)}
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {healthCheck && getStatusIcon(healthCheck.status)}
              <div className="text-2xl font-bold">
                {healthCheck?.status || 'Unknown'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {healthCheck ? formatUptime(healthCheck.uptime * 1000) : 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {healthCheck && getStatusIcon(healthCheck.database)}
              <div className="text-2xl font-bold">
                {healthCheck?.database || 'Unknown'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              PostgreSQL Connection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthCheck ? formatMemory(healthCheck.memory.heapUsed) : 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              of {healthCheck ? formatMemory(healthCheck.memory.heapTotal) : 'Unknown'} allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.requests?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total requests served
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup and Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup and Maintenance
          </CardTitle>
          <CardDescription>
            Create database backups and maintain system health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Database Backup</h4>
              <p className="text-sm text-muted-foreground">
                Last backup: {systemStatus?.lastBackup ? 
                  new Date(systemStatus.lastBackup).toLocaleString() : 
                  'Never'}
              </p>
            </div>
            <Button 
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              {isCreatingBackup ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">System Errors</h4>
            {systemStatus?.recentErrors && systemStatus.recentErrors.length > 0 ? (
              <div className="space-y-2">
                {systemStatus.recentErrors.slice(0, 3).map((error, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{error.error}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-sm">No recent errors</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Local Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Local Deployment
          </CardTitle>
          <CardDescription>
            Download everything needed to run this application locally and privately
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Deployment Guide
                </h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive PDF guide with step-by-step installation instructions
                </p>
              </div>
              <Button 
                onClick={handleDownloadGuide}
                disabled={isDownloadingGuide}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloadingGuide ? 'Generating...' : 'Download PDF Guide'}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Complete Export Package
                </h4>
                <p className="text-sm text-muted-foreground">
                  Full application source code, database backup, and setup scripts
                </p>
              </div>
              <Button 
                onClick={handleDownloadPackage}
                disabled={isDownloadingPackage}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloadingPackage ? 'Creating...' : 'Download Complete Package'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Local Deployment Benefits</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete control over your data and infrastructure</li>
              <li>• No dependency on external servers or internet connectivity</li>
              <li>• Enhanced security with private network deployment</li>
              <li>• Customizable to meet specific organizational requirements</li>
              <li>• Full source code access for modifications and integrations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}