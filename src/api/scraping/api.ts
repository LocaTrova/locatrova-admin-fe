import { Room, SearchParams, Service } from '../../pages/scraping_page/components/types';
import { Location } from '../common/types';
import { apiGet } from '../common/client';
import { validateId } from '../common/validation';

export const getServices = async (text: string): Promise<Service[]> => {
  if (!text || text.trim().length === 0) {
    throw new Error('Search text is required');
  }
  
  const encodedText = encodeURIComponent(text.trim());
  const data = await apiGet<Service[]>(`/scraping/services?text=${encodedText}`);
  
  return Array.isArray(data) ? data : [];
};

export const getCities = async (): Promise<string[]> => {
  return apiGet<string[]>('/scraping/cities');
};

export const getEventTypes = async (): Promise<string[]> => {
  return apiGet<string[]>('/scraping/event-types');
};

export const getVenueTypes = async (): Promise<string[]> => {
  return apiGet<string[]>('/scraping/venue-types');
};

export const getLocationByRoomId = async (roomId: string): Promise<Location> => {
  validateId(roomId, 'Room ID');
  return apiGet<Location>(`/scraping/location?roomId=${roomId}`);
};

export const searchRooms = async (params: SearchParams, page: number = 1): Promise<{
  rooms: Room[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  }
}> => {
  const queryParams = {
    city: params.city || '',
    capacity: params.capacity?.toString() || '0',
    requiresParking: params.requiresParking?.toString() || 'false',
    serviceIds: Array.isArray(params.serviceIds) ? params.serviceIds.join(',') : '',
    eventType: params.eventType || '',
    venueType: params.venueType || '',
    page: Math.max(1, page).toString()
  };

  const queryString = new URLSearchParams(queryParams).toString();
  return apiGet<{
    rooms: Room[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      itemsPerPage: number;
    }
  }>(`/scraping/search-rooms?${queryString}`);
};

export const getContactsByRoomId = async (roomId: string): Promise<unknown[]> => {
  validateId(roomId, 'Room ID');
  
  try {
    const data = await apiGet<unknown[]>(`/scraping/contacts?roomId=${roomId}`);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
};

export const getLocationById = async (locationId: string): Promise<Location> => {
  validateId(locationId, 'Location ID');
  return apiGet<Location>(`/scraping/location?locationId=${locationId}`);
};
