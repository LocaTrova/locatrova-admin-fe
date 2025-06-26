export interface Daily {
  price?: number;
  available: boolean;
  start?: string;
  end?: string;
  days?: number[];
}

export interface Room {
  roomId: number;
  name: string;
  maxPeople: number;
  pricePerHour: number;
  squareMeters: number;
  daily: Daily | null;
  images?: File[];
}

export interface DayAvailability {
  day: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
} 