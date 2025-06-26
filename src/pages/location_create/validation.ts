// Enhanced validation utilities for location creation

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface LocationFormData {
  // Basic Info
  name: string;
  address: string;
  city: string;
  cap?: string;
  description?: string;
  rules?: string;
  
  // Owner
  ownerId?: string;
  special: boolean;
  
  // Location
  coordinates: [number, number];
  addressSelected: boolean;
  
  // Duration & Pricing
  durationType: 'FIXED' | 'MIN';
  duration?: number;
  fee: number;
  stripeId?: string;
  refundPolicyId: string;
  
  // Status
  active: boolean;
  verified: boolean;
  
  // Complex data
  type: number[];
  services: string[];
  images: File[];
  capacityPricing: CapacityPricingFormData[];
  availability: TimeSlot[][];
}

export interface CapacityPricingFormData {
  name: string;
  maxPeople: number;
  pricePerHour: number;
  squareMeters: number;
  images: File[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export function validateBasicInfo(data: Partial<LocationFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Il nome della location è obbligatorio';
  } else if (data.name.length < 3) {
    errors.name = 'Il nome deve essere di almeno 3 caratteri';
  }

  if (!data.address?.trim()) {
    errors.address = 'L\'indirizzo è obbligatorio';
  } else if (!data.addressSelected) {
    errors.address = 'Seleziona un indirizzo dalla lista dei suggerimenti';
  }

  if (!data.city?.trim()) {
    errors.city = 'La città è obbligatoria';
  }

  if (data.cap && !/^\d{5}$/.test(data.cap)) {
    errors.cap = 'Il CAP deve essere di 5 cifre';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateOwnerInfo(data: Partial<LocationFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.special && !data.ownerId) {
    errors.ownerId = 'Seleziona un proprietario o marca la location come speciale';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validatePricingInfo(data: Partial<LocationFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.durationType) {
    errors.durationType = 'Seleziona il tipo di durata';
  }

  if (data.durationType && !data.duration) {
    errors.duration = 'Inserisci la durata';
  } else if (data.duration && data.duration < 1) {
    errors.duration = 'La durata deve essere almeno 1 ora';
  }

  if (!data.fee) {
    errors.fee = 'La commissione è obbligatoria';
  } else if (data.fee < 10 || data.fee > 30) {
    errors.fee = 'La commissione deve essere tra 10% e 30%';
  }

  if (!data.special && !data.stripeId?.trim()) {
    errors.stripeId = 'Lo Stripe ID è obbligatorio per location non speciali';
  }

  if (!data.refundPolicyId) {
    errors.refundPolicyId = 'Seleziona una politica di rimborso';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateActivityTypes(data: Partial<LocationFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.type || data.type.length === 0) {
    errors.type = 'Seleziona almeno un tipo di attività';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateCapacityPricing(capacityPricing: CapacityPricingFormData[]): ValidationResult {
  const errors: Record<string, string> = {};

  if (capacityPricing.length === 0) {
    errors.rooms = 'Aggiungi almeno una sala/spazio';
    return { isValid: false, errors };
  }

  capacityPricing.forEach((room, index) => {
    if (!room.name?.trim()) {
      errors[`room_${index}_name`] = `Nome sala ${index + 1} obbligatorio`;
    }
    
    if (!room.maxPeople || room.maxPeople < 1) {
      errors[`room_${index}_maxPeople`] = `Numero massimo persone per sala ${index + 1} deve essere almeno 1`;
    }
    
    if (!room.pricePerHour || room.pricePerHour < 1) {
      errors[`room_${index}_pricePerHour`] = `Prezzo orario per sala ${index + 1} deve essere almeno €1`;
    }
    
    if (!room.squareMeters || room.squareMeters < 1) {
      errors[`room_${index}_squareMeters`] = `Metri quadri per sala ${index + 1} deve essere almeno 1`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateAvailability(availability: TimeSlot[][]): ValidationResult {
  const errors: Record<string, string> = {};

  const hasAnyAvailability = availability.some(daySlots => daySlots.length > 0);
  
  if (!hasAnyAvailability) {
    errors.availability = 'Imposta almeno un orario di disponibilità';
    return { isValid: false, errors };
  }

  // Validate time slot format and logic
  availability.forEach((daySlots, dayIndex) => {
    daySlots.forEach((slot, slotIndex) => {
      if (!slot.start || !slot.end) {
        errors[`availability_${dayIndex}_${slotIndex}`] = 'Orario di inizio e fine obbligatori';
      } else if (slot.start >= slot.end) {
        errors[`availability_${dayIndex}_${slotIndex}`] = 'L\'orario di fine deve essere dopo quello di inizio';
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateImages(images: File[]): ValidationResult {
  const errors: Record<string, string> = {};
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  images.forEach((file, index) => {
    if (file.size > MAX_FILE_SIZE) {
      errors[`image_${index}`] = `Immagine ${index + 1}: dimensione massima 15MB`;
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors[`image_${index}`] = `Immagine ${index + 1}: formato non supportato (usa JPG, PNG o WebP)`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateCompleteForm(data: LocationFormData): ValidationResult {
  const basicInfo = validateBasicInfo(data);
  const ownerInfo = validateOwnerInfo(data);
  const pricingInfo = validatePricingInfo(data);
  const activityTypes = validateActivityTypes(data);
  const capacityPricing = validateCapacityPricing(data.capacityPricing);
  const availability = validateAvailability(data.availability);
  const images = validateImages(data.images);

  const allErrors = {
    ...basicInfo.errors,
    ...ownerInfo.errors,
    ...pricingInfo.errors,
    ...activityTypes.errors,
    ...capacityPricing.errors,
    ...availability.errors,
    ...images.errors
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors
  };
}