import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { getQueryFn } from "./queryClient";
import { User } from "@shared/schema";
import { useEffect } from "react";

// Helper function to detect mobile devices with enhanced detection
function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check common mobile device signatures
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini',
    'mobi', 'tablet', 'phone', 'mobile', 'samsung', 'pixel', 'windows phone'
  ];
  
  // Test against broad patterns and specific keywords
  const hasMobilePattern = /iphone|ipad|ipod|android|blackberry|windows phone/i.test(userAgent);
  const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Detect as mobile explicitly with URL parameter
  const params = new URLSearchParams(window.location.search);
  const forceMobile = params.get('mobile') === 'true';
  
  // Also check screen size as a fallback
  const smallScreen = window.innerWidth <= 768;
  
  // Combine all checks
  const isMobile = hasMobilePattern || hasMobileKeyword || forceMobile || smallScreen;
  
  console.log(`User agent: ${userAgent}`);
  console.log(`Detected as mobile device: ${isMobile}`);
  
  return isMobile;
}

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/current-user"],
    queryFn: getQueryFn<User | null>({ on401: "returnNull" }),
    retry: 2, // Retry a few times in case of network issues
  });

  console.log(`Protected route ${path} - auth status:`, { 
    isLoading, 
    isAuthenticated: !!user,
    userName: user?.name,
    userRole: user?.role
  });

  // For mobile devices, we'll use a more direct approach if authentication fails
  useEffect(() => {
    // Only execute this logic when we're confident the user is not authenticated
    if (!isLoading && !user && error) {
      const isMobile = isMobileDevice();
      console.log(`Protected route check on mobile: ${isMobile}, path: ${path}`);
      
      if (isMobile) {
        console.log("Mobile device detected with auth failure, redirecting to /login");
        // Force a hard redirect to login for all devices
        window.location.href = "/login";
      }
    }
  }, [isLoading, user, error, path]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log(`No user detected, redirecting from ${path} to login`);
    
    // Store the intended destination
    sessionStorage.setItem('redirectAfterLogin', path);
    
    // For mobile, the useEffect will handle hard redirect
    // For desktop, use the standard Redirect component
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // Check user role permissions for routes
  const adminControllerPaths = ['/technicians', '/buildings', '/reports', '/settings', '/staff-management', '/cost-centers', '/locations', '/dashboard'];
  const requiresAdminOrController = adminControllerPaths.some(adminPath => path.startsWith(adminPath));
  
  // Parts inventory can be accessed by admin, student workers, and controller
  const partsInventoryPath = '/parts-inventory';
  const isPartsInventoryPath = path.startsWith(partsInventoryPath);
  const canAccessPartsInventory = user.role === 'admin' || user.role === 'student' || user.role === 'controller';
  
  // Access denied if:
  // 1. Path requires admin/controller and user is neither
  // 2. Path is parts-inventory and user is not admin, student, or controller
  if ((requiresAdminOrController && user.role !== 'admin' && user.role !== 'controller') || 
      (isPartsInventoryPath && !canAccessPartsInventory)) {
    console.log(`User ${user.name} with role ${user.role} attempted to access restricted route ${path}`);
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
          <p className="text-center text-muted-foreground mb-8">
            You do not have permission to access this page.
            {user.role === 'student' ? 
              "You can only access Parts Inventory." : 
              "This area is restricted to administrators only."}
          </p>
          <Redirect to={user.role === 'student' ? "/parts-inventory" : "/parts-issuance"} />
        </div>
      </Route>
    );
  }

  // User is authenticated and has proper permissions, render the protected component
  console.log(`User authenticated for ${path}: ${user.name} (${user.role})`);
  return <Route path={path} component={Component} />
}