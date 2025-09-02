import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Building,
  Users,
  MapPin,
  Database,
  Layers,
  Settings,
  ClipboardList,
  ChevronRight,
  Home
} from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  
  // Only admins should see this page
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-[calc(100vh-4rem)]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <Link href="/dashboard">
            <Button className="mt-4">
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const adminMenuItems = [
    { 
      title: 'Buildings', 
      icon: <Building className="h-5 w-5" />, 
      description: 'Manage building locations',
      href: '/buildings'
    },
    { 
      title: 'Technicians', 
      icon: <Users className="h-5 w-5" />, 
      description: 'Manage technician accounts',
      href: '/technicians'
    },
    { 
      title: 'Storage Locations', 
      icon: <MapPin className="h-5 w-5" />, 
      description: 'Manage storage locations',
      href: '/locations'
    },
    { 
      title: 'Reports', 
      icon: <ClipboardList className="h-5 w-5" />, 
      description: 'View system reports',
      href: '/reports'
    },
    { 
      title: 'Quick Count', 
      icon: <Database className="h-5 w-5" />, 
      description: 'Perform quick inventory counts',
      href: '/quick-count'
    },
    { 
      title: 'System Settings', 
      icon: <Settings className="h-5 w-5" />, 
      description: 'Configure system settings',
      href: '/settings'
    }
  ];

  return (
    <div className="container mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      
      <div className="grid gap-4">
        {adminMenuItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}