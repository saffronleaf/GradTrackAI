import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/ui/auth/loginForm";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const { authenticated, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to home if already authenticated
    if (authenticated) {
      setLocation("/");
    }
  }, [authenticated, setLocation]);

  const handleLoginSuccess = (userData: any) => {
    login(userData);
    setLocation("/");
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">College Admission Advisor</h1>
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}