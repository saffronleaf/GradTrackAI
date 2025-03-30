import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  isVerified: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateVerificationStatus: (status: boolean) => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  isVerified?: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authenticated: false,
  loading: true,
  isVerified: false,
  login: () => {},
  logout: () => {},
  updateVerificationStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    // Check if the user is already logged in when the app loads
    async function checkAuthStatus() {
      try {
        const response = await apiRequest<{
          success: boolean;
          authenticated: boolean;
          user?: User;
        }>({
          url: "/api/me",
          method: "GET",
        });

        if (response.success && response.authenticated && response.user) {
          setUser(response.user);
          setAuthenticated(true);
          setIsVerified(response.user.isVerified || false);
        } else {
          setUser(null);
          setAuthenticated(false);
          setIsVerified(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setUser(null);
        setAuthenticated(false);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setAuthenticated(true);
    setIsVerified(userData.isVerified || false);
  };

  const logout = () => {
    setUser(null);
    setAuthenticated(false);
    setIsVerified(false);
  };
  
  const updateVerificationStatus = (status: boolean) => {
    setIsVerified(status);
    if (user) {
      setUser({
        ...user,
        isVerified: status
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        loading,
        isVerified,
        login,
        logout,
        updateVerificationStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}