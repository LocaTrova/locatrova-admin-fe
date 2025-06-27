import { useEffect, useState } from "react";
import { checkAuth } from "../api/auth/api";

interface AuthResponse {
  isAuthenticated: boolean;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await checkAuth();
        const authData = data as AuthResponse;
        setIsAuthenticated(authData.isAuthenticated);
      } catch (err) {
        setIsAuthenticated(false);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  return { isAuthenticated, isLoading, error };
}