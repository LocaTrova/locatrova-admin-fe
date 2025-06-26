import { 
  Reservation, 
  ReservationsResponse, 
  UpdateReservationRequest, 
  FilterParams 
} from '../common/types';
import { validateId, validatePagination } from '../common/validation';
import { apiGet, apiPost, fetchPaginatedData } from '../common/client';

export const getReservations = async (params: FilterParams): Promise<ReservationsResponse> => {
  const { page, limit } = validatePagination(params.page, params.limit);
  const searchParams = { ...params, page, limit };
  return fetchPaginatedData<ReservationsResponse>('/reservations/reservations', searchParams);
};

export const getReservation = async (reservationId: string): Promise<Reservation> => {
  const validatedId = validateId(reservationId, 'Reservation ID');
  return apiGet<Reservation>(`/reservations/reservation?reservationId=${validatedId}`);
};

export const updateReservation = async (updateData: UpdateReservationRequest): Promise<Reservation> => {
  validateId(updateData.reservationId, 'Reservation ID');
  
  console.log('In reservation update, reservation request received: ', {
    reservationId: updateData.reservationId
  });
  
  return apiPost<Reservation>('/reservations/update', updateData);
};
