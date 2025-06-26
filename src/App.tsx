import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import UsersPage from "./pages/users_list";
import UserDetail from "./pages/user_details";
import LocationsPage from "./pages/locations_list";
import LocationDetailsPage from "./pages/location_details";
import LocationCreatePage from "./pages/location_create";
import ReservationsPage from "./pages/reservations";
import ReservationDetailsPage from "./pages/reservation_details";
import ScrapingPage from "./pages/scraping_page";
import NavigationLayout from "./components/NavigationLayout";

import { checkAuth } from "./api/auth/api";
import "./App.css";

function ProtectedLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await checkAuth();
        setIsAuthenticated((data as { isAuthenticated: boolean }).isAuthenticated);
      } catch {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  if (isAuthenticated === null) {
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

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<UserDetail />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/locations/:locationId" element={<LocationDetailsPage />} />
        <Route path="/location/create" element={<LocationCreatePage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservation/:reservationId" element={<ReservationDetailsPage />} />
        <Route path="/refund-policies" element={<div>Refund Policies Page - Coming Soon</div>} />
        <Route path="/scraping" element={<ScrapingPage />} />
      </Route>

      {/* Fallback for unmatched routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;