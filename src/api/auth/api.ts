import apiClient from "../../services/apiClient";
import { User, AuthCheckResponse } from '../common/types';
import { validateEmail } from '../common/validation';


/**
 * Sends a login request to the server with the provided email and password.
 */
export const login = async (email: string, password: string): Promise<unknown> => {
  const validatedEmail = validateEmail(email);
  if (!password || password.trim().length === 0) {
    throw new Error('Password is required');
  }
  return apiClient.login(validatedEmail, password.trim());
};

/**
 * Logs out the current user
 */
export const logout = async (): Promise<void> => {
  await apiClient.logout();
};

/**
 * Checks if the user is authenticated
 */
export const checkAuth = async (): Promise<AuthCheckResponse> => {
  const response = await apiClient.request('/auth/check-auth', 'GET');
  return response.data as AuthCheckResponse;
};

/**
 * Fetches the currently logged-in user.
 */
export const getLoggedUser = async (): Promise<User | null> => {
  try {
    const data = await checkAuth();
    if (data && data.isAuthenticated && data.user) {
      return data.user;
    }
    return null;
  } catch (error) {
    console.error("Failed to authenticate user:", error);
    return null;
  }
};
