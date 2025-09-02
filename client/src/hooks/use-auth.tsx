import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginMutation: any;
  logoutMutation: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null, Error>({
    queryKey: ["/api/current-user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 300000,
  });
  
  // Ensure user is never undefined for type safety
  const safeUser = user === undefined ? null : user;

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; role?: string }) => {
      console.log("Login attempt for:", credentials.username, "as role:", credentials.role || "not specified");
      
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login error response:", errorText);
        throw new Error(errorText || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: (user: User) => {
      console.log("Login successful for:", user.username, "role:", user.role);
      queryClient.setQueryData(["/api/current-user"], user);
      
      const redirectPath = user.role === 'admin' ? '/dashboard' :
                         user.role === 'student' ? '/parts-inventory' :
                         '/parts-issuance';
                         
      console.log("Redirecting to:", redirectPath);
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      console.error("Login error:", error.message);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/current-user"], null);
      window.location.href = '/login';
    },
  });

  return (
    <AuthContext.Provider value={{ user: safeUser, isLoading, loginMutation, logoutMutation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}