export const processRooms = (data: Record<string, unknown>[]): unknown[] => {
  const rooms: Record<string, Record<string, unknown>> = {};
  
  data.forEach(({key, value}) => {
    const match = key.match(/^rooms\[(\d+)\]\.(.+)$/);
    if (!match) return;
    
    const [, index, field] = match;
    rooms[index] = rooms[index] || {};
    
    // Handle nested daily fields
    if (field.startsWith('daily.')) {
      rooms[index].daily = rooms[index].daily || {};
      const dailyField = field.replace('daily.', '');
      
      if (dailyField === 'available') {
        rooms[index].daily[dailyField] = value === 'on' || value === 'true';
      } else if (dailyField === 'price') {
        rooms[index].daily[dailyField] = Number(value);
      } else if (dailyField === 'days') {
        rooms[index].daily!.days = value.split(',').map((v: string) => Number(v.trim()));
      } else {
        rooms[index].daily[dailyField] = value;
      }
    }

    // Handle regular fields
    else if (field === 'images') {
      rooms[index].images = rooms[index].images || [];
      rooms[index].images.push(value);
    }  else if (field.startsWith('unavailableDates')) {

      // This is applied for every single room
      // The field is like:
      // unavailableDates[0].date datevalue
      // unavailableDates[0].start startvalue
      // unavailableDates[0].end endvalue
      // unavailableDates[1].date datevalue
      // unavailableDates[1].start startvalue
      // unavailableDates[1].end endvalue

      const udMatch = field.match(/^unavailableDates\[(\d+)\]\.(date|start|end)$/);
      if (udMatch) {
        const [, unavailableIndex, dateField] = udMatch;
        rooms[index].unavailableDates = rooms[index].unavailableDates || [];
        rooms[index].unavailableDates[unavailableIndex] = rooms[index].unavailableDates[unavailableIndex] || { date: '', start: '', end: '' };
        rooms[index].unavailableDates[unavailableIndex][dateField] = value;

        // Now the field has been put into the array of objects
        // like this:
        // [
        //   { date: 'datevalue', start: 'startvalue', end: 'endvalue' },
        //   etc...
        // ]

      }
    } else {
      rooms[index][field] = field.match(/^(maxPeople|pricePerHour|squareMeters)$/) 
        ? Number(value) 
        : value;
    }
  });
  
  // Ensure daily is in the following format if not present
  Object.values(rooms).forEach((room: Record<string, unknown>) => {
    if (!room.daily || Object.keys(room.daily).length === 0) {
      room.daily = {
        available: false,
      };
    }
  });
  
  return Object.values(rooms);
};

export const processWeekAvailability = (data: Record<string, unknown>[]) => {
  const availabilityMap: Record<string, unknown> = {};

  console.log('data', data)

  data.forEach(({ key, value }) => {
    const match = key.match(/^availability\[(\d+)\]\.slots\[(\d+)\]\.(.*)$/);
    if (!match) return;

    const [, dayIndex, slotIndex, field] = match;
    
    availabilityMap[dayIndex] = availabilityMap[dayIndex] || { slots: [] };
    availabilityMap[dayIndex].slots[slotIndex] = availabilityMap[dayIndex].slots[slotIndex] || {};
    availabilityMap[dayIndex].slots[slotIndex][field] = value;
  });

  return Object.entries(availabilityMap).map(([, { slots }]) => {
    // If all slots are empty (i.e. both start and end are empty strings),
    // return an empty array for that day.
    if (slots.every((slot: Record<string, string>) => slot.start === 'EMPTY' && slot.end === 'EMPTY')) {
      return [];
    }
    return slots;
  });
};

export const processTipologie = (data: string[]) => {
  return data.map(key => {
    const match = key.match(/^tipologia\[(\d+)\]$/);
    if (!match) {
      throw new Error(`Invalid tipologia key: "${key}"`);
    }
    return Number(match[1]);
  });
};

export const processServizi = (data: string[]) => {
  return data.map(key => {
    const match = key.match(/^servizio-(.+)$/);
    if (!match) {
      throw new Error(`Invalid servizio key: "${key}"`);
    }
    return match[1];
  });
};

export interface ImageHandlerState {
  imagePreview: string[];
  files: File[];
}

export const handleImageRemoval = (
  indexToRemove: number,
  state: ImageHandlerState,
  inputName: string,
  setState: (newState: ImageHandlerState) => void
) => {
  URL.revokeObjectURL(state.imagePreview[indexToRemove]);
  
  const newFiles = state.files.filter((_, index) => index !== indexToRemove);
  const newPreviews = state.imagePreview.filter((_, index) => index !== indexToRemove);
  
  // Update the file input's FileList
  const fileInput = document.querySelector(`input[name="${inputName}"]`) as HTMLInputElement;
  if (fileInput) {
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
  }
  
  setState({ imagePreview: newPreviews, files: newFiles });
};

export const processGeneralImages = (data: Record<string, unknown>[]) => {
  const images: unknown[] = [];
  
  data.forEach(({key, value}) => {
    if (key === 'images') {
      if (Array.isArray(value)) {
        images.push(...value);
      } else {
        images.push(value);
      }
    }
  });
  
  return images;
}; 