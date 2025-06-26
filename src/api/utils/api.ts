import { apiGet } from '../common/client';

interface AddressSuggestion {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export const getAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  if (!query || query.trim().length < 3) {
    throw new Error('Query must be at least 3 characters long');
  }
  
  const encodedQuery = encodeURIComponent(query.trim());
  return apiGet<AddressSuggestion[]>(`/utils/geocode?address=${encodedQuery}`);
};
