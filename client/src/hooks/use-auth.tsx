import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getCurrentUser, signOut, isEmailVerified, onAuthStateChange } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  isVerified: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateVerificationStatus: (status: boolean) => void;
}

interface User {
  id: string;
  username?: string;
  email: string;
  isVerified: boolean;
}

// Convert Supabase user to our app's user format
function formatSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '',
    isVerified: supabaseUser.email_confirmed_at ? true : false
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authenticated: false,
  loading: true,
  isVerified: false,
  login: () => {},
  logout: async () => {},
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
        const supabaseUser = await getCurrentUser();
        const verified = await isEmailVerified();
        
        if (supabaseUser) {
          const formattedUser = formatSupabaseUser(supabaseUser);
          if (formattedUser) {
            setUser(formattedUser);
            setAuthenticated(true);
            setIsVerified(verified);
          }
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

    // Setup auth state change listener
    const { data: authListener } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const formattedUser = formatSupabaseUser(session.user);
        if (formattedUser) {
          setUser(formattedUser);
          setAuthenticated(true);
          setIsVerified(formattedUser.isVerified);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthenticated(false);
        setIsVerified(false);
      } else if (event === 'USER_UPDATED' && session?.user) {
        const formattedUser = formatSupabaseUser(session.user);
        if (formattedUser) {
          setUser(formattedUser);
          setIsVerified(formattedUser.isVerified);
        }
      }
    });

    checkAuthStatus();
    
    // Clean up subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setAuthenticated(true);
    setIsVerified(userData.isVerified || false);
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setAuthenticated(false);
      setIsVerified(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
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