import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
        } else {
          setUser(null);
          setAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setUser(null);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}