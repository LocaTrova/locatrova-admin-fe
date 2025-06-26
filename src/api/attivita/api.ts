import { ServicesResponse } from '../common/types';
import { apiGet } from '../common/client';

export const getTipologieAttivita = async (): Promise<ServicesResponse> => {
  return apiGet<ServicesResponse>('/attivita/tipologie');
};

export const getServiziAttivita = async (): Promise<ServicesResponse> => {
  return apiGet<ServicesResponse>('/attivita/servizi');
};


