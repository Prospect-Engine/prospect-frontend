"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { User } from "@/types/sales-types";
import authService from "@/services/sales-services/authService";

interface AuthContextType {
  user: User | null;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  refreshUserData: () => Promise<boolean>;
  refreshAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  // Return default values during SSR or when context is not yet available
  if (!context) {
    // During SSR or initial render, return safe defaults
    if (typeof window === "undefined") {
      return {
        user: null,
        login: async () => false,
        logout: () => {},
        isLoading: true,
        isAuthenticated: false,
        refreshUser: async () => {},
        refreshUserData: async () => false,
        refreshAuthState: () => {},
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing authentication on mount and when user changes
  useEffect(() => {
    const initializeAuth = () => {
      // Only run on client side
      if (typeof window === "undefined") {
        //
        setIsLoading(false);
        return;
      }

      //
      const token = authService.getAccessToken();
      const storedUser = authService.getUser();

      //

      if (token && storedUser) {
        //
        setUser(storedUser);
        setIsAuthenticated(true);
        //
      } else {
        //
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
      //
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      //
      setIsLoading(false);
    }, 5000); // 5 second timeout

    initializeAuth();

    return () => clearTimeout(timeoutId);
  }, []); // Only run on mount

  // For SSR, immediately return consistent state
  if (typeof window === "undefined") {
    return {
      user: null,
      login: async () => false,
      logout: () => {},
      isLoading: false,
      isAuthenticated: false,
      refreshUser: async () => {},
      refreshUserData: async () => false,
      refreshAuthState: () => {},
    };
  }

  const refreshUser = async (): Promise<void> => {
    const token = authService.getAccessToken();
    if (!token) return;

    try {
      const response = await authService.getProfile(token);
      if (response.success && response.data) {
        const updatedUser = response.data as unknown as User;
        authService.setUser(updatedUser);
        setUser(updatedUser);
      }
    } catch (error) {}
  };

  // Enhanced refresh function that returns success status
  const refreshUserData = async (): Promise<boolean> => {
    const token = authService.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      //
      const response = await authService.getProfile(token);

      if (response.success && response.data) {
        const updatedUser = response.data as unknown as User;
        //

        // Update localStorage and state
        authService.setUser(updatedUser);
        setUser(updatedUser);

        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const login = async (email?: string, password?: string): Promise<boolean> => {
    //
    setIsLoading(true);

    try {
      // Use real API login
      if (email && password) {
        const response = await authService.login({
          email,
          password,
        });

        if (response.success && response.data) {
          //
          //

          // The backend returns { accessToken, refreshToken, user }
          const user = authService.createUserFromResponse(response.data);

          // Store tokens and user data
          authService.setTokens(
            response.data.accessToken ?? "",
            response.data.refreshToken ?? ""
          );
          authService.setUser(user);

          //
          setUser(user);
          setIsAuthenticated(true);
          setIsLoading(false);
          //

          // Force a re-check of authentication state
          setTimeout(() => {
            //
            const token = authService.getAccessToken();
            const storedUser = authService.getUser();
            //
          }, 100);

          return true;
        } else {
          //
          setIsLoading(false);
          return false;
        }
      } else {
        // Check for existing authentication
        //
        const token = authService.getAccessToken();
        const storedUser = authService.getUser();

        //

        if (token && storedUser) {
          //
          setUser(storedUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return true;
        }

        //
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const refreshAuthState = () => {
    //
    const token = authService.getAccessToken();
    const storedUser = authService.getUser();

    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
      //
    } else {
      setUser(null);
      setIsAuthenticated(false);
      //
    }
  };

  const logout = () => {
    authService.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: isAuthenticated || false,
    refreshUser,
    refreshUserData,
    refreshAuthState,
  };
};

export { AuthContext };
