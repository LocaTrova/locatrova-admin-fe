export interface LocationCreateRequest {
  name: string;
  city: string;
  cap?: string;
  address: string;
  description?: string;
  rules?: string;
  durationType: 'FIXED' | 'MIN';
  duration?: number;
  stripeId?: string;
  special: boolean;
  active: boolean;
  verified: boolean;
  capacityPricing: {
    name: string;
    maxPeople: number;
    pricePerHour: number;
    squareMeters: number;
    images: string[];
    unavailableDates: object[];
    daily: object[];
  }[];
  images: string[];
  type: number[];
  services: string[];
  availability: {
    start: string;
    end: string;
  }[][];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
} 