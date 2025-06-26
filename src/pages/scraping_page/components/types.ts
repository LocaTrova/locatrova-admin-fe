export interface Room {
  _id: string;
  name: string;
  maxCapacity: number;
  mt2: number;
  locationId: string;
  serviceIds: string[];
  services: Service[];
  location?: {
    name: string;
    city: string;
    eventTypeIds: string[];
    parkingInfo: string;
    venueTypeId: string;
  };
  locationServices?: Service[];
  eventTypes?: {name: string}[];
  venueType?: {
    name: string;
  };
}

export interface Location {
  _id: string;
  name: string;
  city: string;
  address: string;
  eventTypeIds: string[];
  roomIds: string[];
  parkingInfo: string | null;
  serviceIds: string[];
  contactIds: string[];
  venueTypeId: string;
}

export interface EventType {
  _id: string;
  name: string;
}

export interface Service {
  _id: string;
  name: string;
}

export interface VenueType {
  _id: string;
  name: string;
}

export interface Contact {
  _id: string; 
  name: string;
  role: string;
  tel: string;
  email: string;
}

export interface SearchParams {
  city: string;
  capacity: string;
  requiresParking: boolean;
  serviceIds: string[];
  eventType: string;
  venueType: string;
}

export type ModalType = "room" | "location" | "contacts" | null; 