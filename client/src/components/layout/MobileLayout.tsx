import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MobileBottomNav } from "@/components/mobile/MobileNav";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // If there's no user, provide a simple loading screen with a return to login button
  if (!user) {
    // No need for state hooks, just show a direct return to login option
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-center text-muted-foreground mb-4">Loading user information...</p>
        
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            If you're not automatically redirected, please try logging in again.
          </p>
          <a 
            href="/mobile-login" 
            className="bg-primary text-white px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the system",
      });
      window.location.href = '/mobile-login';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // No extra navigation items needed - using MobileBottomNav component
  
  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      {/* Mobile header */}
      <header className="sticky top-0 z-10 bg-primary text-white shadow-md">
        <div className="flex justify-between items-center p-3">
          <div className="h-16">
            <img src="/external-logo.png" alt="Logo" className="h-full" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm truncate max-w-[130px]">{user?.name}</span>
            <button 
              onClick={handleLogout}
              className="bg-white/20 rounded-full p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}