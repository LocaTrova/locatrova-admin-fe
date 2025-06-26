import { 
  User, 
  UsersResponse, 
  CreateUserRequest, 
  UpdateUserRequest, 
  FilterParams 
} from '../common/types';
import { validateId, validatePagination, createQueryString } from '../common/validation';
import { apiGet, apiPost, apiDelete, fetchPaginatedData } from '../common/client';

/**
 * Fetches users based on the provided query parameters.
 *
 * @param params - An object containing query parameters.
 * @returns A promise that resolves to the JSON response.
 */
export const getUserDetails = async (userId: string): Promise<User> => {
  const validatedId = validateId(userId, 'User ID');
  const queryString = createQueryString({ userId: validatedId });
  return apiGet<User>(`/users/user?${queryString}`);
};

export const updateUser = async (params: UpdateUserRequest & { id: string }): Promise<User> => {
  validateId(params.id, 'User ID');
  return apiPost<User>('/users/update', params);
};

export const getUsers = async (): Promise<UsersResponse> => {
	return apiGet<UsersResponse>('/users/users');
};

export const getUsersWithFilters = async (params: FilterParams): Promise<UsersResponse> => {
  const { page, limit } = validatePagination(params.page, params.limit);
  const searchParams = { ...params, page, limit };
  return fetchPaginatedData<UsersResponse>('/users/filteredUsers', searchParams);
};

export const saveChanges = async (userIds: Set<string>): Promise<{ success: boolean; modifiedCount: number }> => {
  const userIdsArray = Array.from(userIds);
  
  // Validate all user IDs
  userIdsArray.forEach(id => validateId(id, 'User ID'));
  
  return apiPost<{ success: boolean; modifiedCount: number }>('/users/saveChanges', { usersId: userIdsArray });
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
  const validatedId = validateId(userId, 'User ID');
  return apiDelete<{ success: boolean }>(`/users/delete/${validatedId}`);
};

export const createUser = async (newUserData: CreateUserRequest): Promise<User> => {
  return apiPost<User>('/users/create', newUserData);
};

export async function searchUsers(search: string): Promise<UsersResponse> {
	const queryString = createQueryString({ search });
	return apiGet<UsersResponse>(`/users/searchUsers?${queryString}`);
}


