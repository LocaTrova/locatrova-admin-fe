import { Navigate } from "react-router-dom";
import NavigationLayout from "./NavigationLayout";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner" role="status" aria-label="Verifica autenticazione">
          <span className="sr-only">Caricamento...</span>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <NavigationLayout /> : <Navigate to="/login" replace />;
}