import { Switch, Route, Redirect, useLocation, useRouter, Link as WouterLink } from "wouter";
import { queryClient, setNavigating } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PartsInventory from "@/pages/parts-inventory";
import PartsIssuance from "@/pages/parts-issuance";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
// Mobile login removed - unified login experience
import TestPage from "@/pages/test-page";
import Technicians from "@/pages/technicians";
import Buildings from "@/pages/buildings";
import QuickCount from "@/pages/quick-count";
import Locations from "@/pages/locations";
import TestComponent from "@/pages/test-component";
import PartsPickup from "@/pages/parts-pickup";
import ToolSignout from "@/pages/tool-signout";
import AdminSettings from "@/pages/admin-settings";
import Deliveries from "@/pages/deliveries";
import StaffManagement from "@/pages/staff-management";
import CostCenters from "@/pages/cost-centers";
import SystemAdmin from "@/pages/system-admin";
import PartsUsageAnalytics from "@/pages/parts-usage-analytics";
import BarcodeKiosk from "@/pages/barcode-kiosk-new";
import BulkInventory from "@/pages/bulk-inventory";
import InventoryAging from "@/pages/inventory-aging";
import PerformanceDashboard from "@/pages/performance-dashboard";
import ManualPartsReview from "@/pages/manual-parts-review";
import DeliveryRequestsAdmin from "@/pages/delivery-requests-admin";
import CombinedReports from "@/pages/combined-reports";
// Use type for component prop in ProtectedRoute
type ComponentType = () => React.JSX.Element;
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { useEffect, useCallback } from "react";
import type { FC } from "react";
import { initializeWebSocketConnection } from "./lib/websocket";

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
  
  // Detect as mobile explicitly with URL parameters
  const params = new URLSearchParams(window.location.search);
  const forceMobile = params.get('mobile') === 'true';
  const directMode = params.get('direct') === 'true';
  
  // Check localStorage flag set by the static HTML page
  const localStorageMobile = localStorage.getItem('mobile_device') === 'true';
  
  // Also check screen size as a fallback
  const smallScreen = window.innerWidth <= 768;
  
  // Combine all checks
  const isMobile = hasMobilePattern || hasMobileKeyword || forceMobile || localStorageMobile || smallScreen || directMode;
  
  // Log key flags
  console.log(`Direct mode: ${directMode}`);
  
  console.log(`User agent: ${userAgent}`);
  console.log(`Detected as mobile device: ${isMobile}`);
  
  // Store the result for future page loads
  if (isMobile) {
    localStorage.setItem('mobile_device', 'true');
  }
  
  // Return the result of our combined checks
  return isMobile;
}

// Root route handler to redirect to login if not authenticated
function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const router = useRouter();
  const isMobile = isMobileDevice();
  
  // Helper for safe navigation using our tracking system
  const safeNavigate = useCallback((path: string) => {
    console.log('Navigation started - setting navigation flag');
    setNavigating(true);
    
    // Use setTimeout to ensure the navigation flag is set after any current microtasks
    setTimeout(() => {
      navigate(path);
      
      // Reset the flag after navigation is likely complete
      setTimeout(() => {
        console.log('Navigation complete - resetting navigation flag');
        setNavigating(false);
      }, 1000);
    }, 0);
  }, [navigate]);
  
  useEffect(() => {
    // Wait for auth state to load
    if (!isLoading) {
      if (user) {
        console.log("User authenticated at root URL, redirecting based on role:", user.role);
        
        // For mobile users, check role
        if (isMobile) {
          if (user.role === 'technician') {
            // Technicians now go to a menu page that shows both issuance and pickup options
            console.log("Mobile technician detected, redirecting to menu");
            safeNavigate("/dashboard"); // Using dashboard as the entry point for technicians
          } else if (user.role === 'admin') {
            // Admins go to dashboard, even on mobile
            console.log("Mobile admin detected, redirecting to dashboard");
            safeNavigate("/dashboard");
          } else if (user.role === 'controller') {
            // Controllers go to dashboard
            console.log("Mobile controller detected, redirecting to dashboard");
            safeNavigate("/dashboard");
          } else if (user.role === 'student') {
            // Student workers go to parts inventory
            console.log("Mobile student worker detected, redirecting to parts inventory");
            safeNavigate("/parts-inventory");
          } else {
            // Unknown role - default to dashboard
            safeNavigate("/dashboard");
          }
        } else {
          // Desktop users
          if (user.role === 'technician') {
            // Technicians also get menu options in desktop view
            console.log("Desktop technician detected, redirecting to dashboard");
            safeNavigate("/dashboard");
          } else if (user.role === 'controller') {
            // Controllers go to dashboard
            console.log("Desktop controller detected, redirecting to dashboard");
            safeNavigate("/dashboard");
          } else {
            // All other desktop users go to dashboard
            console.log("Desktop user detected, redirecting to dashboard");
            safeNavigate("/dashboard");
          }
        }
      } else {
        console.log("User is not authenticated at root URL, redirecting to login");
        
        // First, set the navigating flag to prevent AbortErrors
        setNavigating(true);
        
        // All users get the regular login page regardless of device
        console.log("User not authenticated, redirecting to login page");
        window.location.href = "/login";
        
        // Reset the flag after a reasonable timeout - the page will reload anyway
        setTimeout(() => {
          setNavigating(false);
        }, 2000);
      }
    }
  }, [user, isLoading, isMobile, safeNavigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
      <p className="text-center text-muted-foreground">Redirecting...</p>
    </div>
  );
}

// Import the MobileLayout component
import { MobileLayout } from "@/components/layout/MobileLayout";

function Router() {
  const isMobile = isMobileDevice();
  const [location] = useLocation();
  
  // This hook simply sets the navigating flag to prevent AbortErrors during navigation
  useEffect(() => {
    console.log('Navigation started - setting navigation flag');
    setNavigating(true);
    
    // Reset the flag after navigation is likely complete
    const timer = setTimeout(() => {
      console.log('Navigation complete - resetting navigation flag');
      setNavigating(false);
    }, 1000);
    
    // Clean up the timer if component unmounts
    return () => clearTimeout(timer);
  }, [location]); // Dependency on location ensures this runs on every route change
  
  return (
    <Switch>
      {/* Root path redirects based on auth state */}
      <Route path="/" component={RootRedirect} />
      
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      {/* Mobile login removed - redirect to main login page */}
      <Route path="/mobile-login">
        <Redirect to="/login" />
      </Route>
      <Route path="/test-page" component={TestPage} />
      <Route path="/test-component" component={TestComponent} />
      <Route path="/auth">
        <Redirect to="/login" />
      </Route>
      
      {/* Public kiosk route - no authentication required */}
      <Route path="/barcode-kiosk" component={BarcodeKiosk} />
      
      {/* Conditionally use mobile or desktop layout */}
      {isMobile ? (
        <Switch>
          {/* Mobile routes with proper authentication protection */}
          <ProtectedRoute path="/dashboard" component={() => (
            <MobileLayout>
              <Dashboard />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/parts-issuance" component={() => (
            <MobileLayout>
              <PartsIssuance />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/parts-pickup" component={() => (
            <MobileLayout>
              <PartsPickup />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/parts-inventory" component={() => (
            <MobileLayout>
              <PartsInventory />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/reports" component={() => (
            <MobileLayout>
              <Reports />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/settings" component={() => (
            <MobileLayout>
              <Settings />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/technicians" component={() => (
            <MobileLayout>
              <Technicians />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/buildings" component={() => (
            <MobileLayout>
              <Buildings />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/locations" component={() => (
            <MobileLayout>
              <Locations />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/quick-count" component={() => (
            <MobileLayout>
              <QuickCount />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/tool-signout" component={() => (
            <MobileLayout>
              <ToolSignout />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/admin-settings" component={() => (
            <MobileLayout>
              <AdminSettings />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/deliveries" component={() => (
            <MobileLayout>
              <Deliveries />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/staff-management" component={() => (
            <MobileLayout>
              <StaffManagement />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/cost-centers" component={() => (
            <MobileLayout>
              <CostCenters />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/system-admin" component={() => (
            <MobileLayout>
              <SystemAdmin />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/parts-usage-analytics" component={() => (
            <MobileLayout>
              <PartsUsageAnalytics />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/bulk-inventory" component={() => (
            <MobileLayout>
              <BulkInventory />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/inventory-aging" component={() => (
            <MobileLayout>
              <InventoryAging />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/performance-dashboard" component={() => (
            <MobileLayout>
              <PerformanceDashboard />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/manual-parts-review" component={() => (
            <MobileLayout>
              <ManualPartsReview />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/delivery-requests-admin" component={() => (
            <MobileLayout>
              <DeliveryRequestsAdmin />
            </MobileLayout>
          )} />
          
          <ProtectedRoute path="/combined-reports" component={() => (
            <MobileLayout>
              <CombinedReports />
            </MobileLayout>
          )} />
          
          <Route component={() => (
            <MobileLayout>
              <NotFound />
            </MobileLayout>
          )} />
        </Switch>
      ) : (
        <Layout>
          <Switch>
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute path="/parts-inventory" component={PartsInventory} />
            <ProtectedRoute path="/parts-issuance" component={PartsIssuance} />
            <ProtectedRoute path="/parts-pickup" component={PartsPickup} />
            <ProtectedRoute path="/quick-count" component={QuickCount} />
            <ProtectedRoute path="/reports" component={Reports} />
            <ProtectedRoute path="/settings" component={Settings} />
            <ProtectedRoute path="/technicians" component={Technicians} />
            <ProtectedRoute path="/buildings" component={Buildings} />
            <ProtectedRoute path="/locations" component={Locations} />
            <ProtectedRoute path="/tool-signout" component={ToolSignout} />
            <ProtectedRoute path="/admin-settings" component={AdminSettings} />
            <ProtectedRoute path="/deliveries" component={Deliveries} />
            <ProtectedRoute path="/staff-management" component={StaffManagement} />
            <ProtectedRoute path="/cost-centers" component={CostCenters} />
            <ProtectedRoute path="/system-admin" component={SystemAdmin} />
            <ProtectedRoute path="/parts-usage-analytics" component={PartsUsageAnalytics} />
            <ProtectedRoute path="/bulk-inventory" component={BulkInventory} />
            <ProtectedRoute path="/inventory-aging" component={InventoryAging} />
            <ProtectedRoute path="/performance-dashboard" component={PerformanceDashboard} />
            <ProtectedRoute path="/manual-parts-review" component={ManualPartsReview} />
            <ProtectedRoute path="/delivery-requests-admin" component={DeliveryRequestsAdmin} />
            <ProtectedRoute path="/combined-reports" component={CombinedReports} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      )}
    </Switch>
  );
}

function App() {
  // Initialize WebSocket connection when the app loads
  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/current-user', {
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (res.ok) {
          // If the user is authenticated, initialize WebSocket connection
          console.log('User is authenticated, initializing WebSocket connection');
          initializeWebSocketConnection();
        } else {
          console.log('User is not authenticated, not initializing WebSocket connection');
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
