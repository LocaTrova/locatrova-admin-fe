import { RouteObject } from "react-router-dom";
import HomePage from "../pages/home";
import LoginPage from "../pages/login";
import UsersPage from "../pages/users_list";
import UserDetail from "../pages/user_details";
import LocationsPage from "../pages/locations_list";
import LocationDetailsPage from "../pages/location_details";
import LocationCreatePage from "../pages/location_create";
import ReservationsPage from "../pages/reservations";
import ReservationDetailsPage from "../pages/reservation_details";
import ScrapingPage from "../pages/scraping_page";

export const publicRoutes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />
  }
];

export const protectedRoutes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/users",
    element: <UsersPage />
  },
  {
    path: "/users/:userId",
    element: <UserDetail />
  },
  {
    path: "/locations",
    element: <LocationsPage />
  },
  {
    path: "/locations/:locationId",
    element: <LocationDetailsPage />
  },
  {
    path: "/location/create",
    element: <LocationCreatePage />
  },
  {
    path: "/reservations",
    element: <ReservationsPage />
  },
  {
    path: "/reservation/:reservationId",
    element: <ReservationDetailsPage />
  },
  {
    path: "/refund-policies",
    element: <div>Refund Policies Page - Coming Soon</div>
  },
  {
    path: "/scraping",
    element: <ScrapingPage />
  }
];