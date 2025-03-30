import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserProfile } from "@/components/ui/auth/userProfile";

export default function Profile() {
  const { authenticated, user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!authenticated && !loading) {
      setLocation("/login");
    }
  }, [authenticated, loading, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Profile</h1>
        <UserProfile user={user} onLogout={handleLogout} />
      </div>
    </div>
  );
}