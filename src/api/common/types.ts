// Common API types and interfaces

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  active: boolean;
  verified?: boolean;
  username?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface Location {
  _id: string;
  name: string;
  city: string;
  stripeId?: string;
  special: boolean;
  fee: number;
  active: boolean;
  verified?: boolean;
  ownerId?: string;
  ownerName?: string;
  ownerSurname?: string;
}

export interface Reservation {
  _id: string;
  locationId: string;
  locationName?: string;
  userName?: string;
  roomId: number;
  userId: string;
  timeSlot: {
    start: string;
    end: string;
  };
  startDate: string;
  endDate: string;
  capacity: number;
  amount: number;
  payment: 'SUCCESS' | 'REFUNDED';
  stripeId: string;
  createdAt?: string;
}

export interface FilterParams {
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CreateUserRequest {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export interface UpdateReservationRequest {
  reservationId: string;
  payment?: 'SUCCESS' | 'REFUNDED';
  capacity?: number;
  amount?: number;
}

export interface Service {
  _id: string;
  name: string;
  category?: string;
}

export interface RefundPolicy {
  _id: string;
  name: string;
  description: string;
  refundPercentage: number;
  timeLimit: number;
  active: boolean;
}

// Response type aliases for better readability (matching backend structure)
export interface UsersResponse {
  users: User[];
  total: number;
  page?: number;
  totalPages?: number;
}

export interface LocationsResponse {
  locations: Location[];
  total: number;
  page?: number;
  totalPages?: number;
}

export interface ReservationsResponse {
  reservations: Reservation[];
  total: number;
  page?: number;
  totalPages?: number;
}

export type ServicesResponse = Service[];
export type RefundPoliciesResponse = RefundPolicy[];

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token?: string;
}

export interface AuthCheckResponse {
  isAuthenticated: boolean;
  user: User | null;
}