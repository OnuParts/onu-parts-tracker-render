import { useAuth } from "@/hooks/use-auth";

export function useRole() {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.role === "admin",
    isTechnician: user?.role === "technician",
    isStudent: user?.role === "student",
    userRole: user?.role
  };
}