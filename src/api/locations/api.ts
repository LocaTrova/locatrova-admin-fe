import { LocationCreateRequest } from './types';
import { 
  Location, 
  LocationsResponse, 
  FilterParams
} from '../common/types';
import { validateId, validatePagination } from '../common/validation';
import { apiGet, apiPost, apiDelete, fetchPaginatedData, uploadFile } from '../common/client';

interface ProgressCallback {
	(progress: number): void;
}

export const getLocations = async (): Promise<LocationsResponse> => {
	return apiGet<LocationsResponse>('/locations/locations');
};

export const filteredLocations = async (params: FilterParams): Promise<LocationsResponse> => {
	const { page, limit } = validatePagination(params.page, params.limit);
	const searchParams = { ...params, page, limit };
	return fetchPaginatedData<LocationsResponse>('/locations/filteredLocations', searchParams);
};

export const saveChanges = async (params: Array<{ id: string; [key: string]: unknown }>): Promise<{ success: boolean; modifiedCount: number }> => {
	if (!Array.isArray(params) || params.length === 0) {
		throw new Error('No changes to save');
	}

	// Validate all IDs
	params.forEach(change => {
		if (!change.id) {
			throw new Error('Missing ID in change object');
		}
		validateId(change.id, 'Location ID');
	});

	return apiPost<{ success: boolean; modifiedCount: number }>('/locations/saveChanges', params);
};

export const deleteLocation = async (locationId: string): Promise<{ success: boolean }> => {
	const validatedId = validateId(locationId, 'Location ID');
	return apiDelete<{ success: boolean }>(`/locations/delete/${validatedId}`);
};

export const getLocationDetails = async (locationId: string): Promise<Location> => {
	const validatedId = validateId(locationId, 'Location ID');
	return apiGet<Location>(`/locations/location?locationId=${validatedId}`);
};

export const updateLocation = async (params: { id: string; [key: string]: unknown }): Promise<Location> => {
	validateId(params.id, 'Location ID');
	return apiPost<Location>('/locations/update', params);
};

export async function createLocation(
	newLocationData: LocationCreateRequest | FormData,
	onProgress?: ProgressCallback
): Promise<Location> {
	if (!newLocationData) {
		throw new Error('Dati location mancanti');
	}

	// Progress tracking
	const progressCallback = onProgress || (() => {});
	progressCallback(10);

	// Use uploadFile for FormData, regular apiPost for JSON
	if (newLocationData instanceof FormData) {
		return uploadFile<Location>('/locations/create', newLocationData, {
			timeout: 60000,
			retries: 1
		});
	} else {
		return apiPost<Location>('/locations/create', newLocationData);
	}
};

export async function searchLocations(search: string): Promise<LocationsResponse> {
	if (!search || search.trim().length < 2) {
		throw new Error('Search term must be at least 2 characters');
	}
	return apiGet<LocationsResponse>(`/locations/searchLocations?search=${encodeURIComponent(search.trim())}`);
};

// Export types for better TypeScript support
export type { ProgressCallback };