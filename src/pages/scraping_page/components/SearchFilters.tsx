import React, { useState, useEffect } from 'react';
import CityFilter from './CityFilter';
import CapacityFilter from './CapacityFilter';
import ParkingFilter from './ParkingFilter';
import EventTypeFilter from './EventTypeFilter';
import VenueTypeFilter from './VenueTypeFilter';
import ServicesFilter from './ServicesFilter';
import { Service, EventType, VenueType } from './types';
import { getEventTypes, getVenueTypes } from '../../../api/scraping/api';

interface SearchFiltersProps {
  selectedCity: string;
  capacity: number | '';
  requiresParking: boolean;
  serviceSearch: string;
  selectedServices: Service[];
  selectedEventType: string;
  selectedVenueType: string;
  onCityChange: (city: string) => void;
  onCapacityChange: (capacity: number | '') => void;
  onParkingChange: (requiresParking: boolean) => void;
  onServiceSearchChange: (search: string) => void;
  onAddService: (service: Service) => void;
  onRemoveService: (serviceId: string) => void;
  onEventTypeChange: (eventType: EventType | null) => void;
  onVenueTypeChange: (venueType: VenueType | null) => void;
  onSearch: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  selectedCity,
  capacity,
  requiresParking,
  serviceSearch,
  selectedServices,
  selectedEventType,
  selectedVenueType,
  onCityChange,
  onCapacityChange,
  onParkingChange,
  onServiceSearchChange,
  onAddService,
  onRemoveService,
  onEventTypeChange,
  onVenueTypeChange,
  onSearch
}) => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);

  useEffect(() => {
    // Fetch event types
    const fetchEventTypes = async () => {
      try {
        const types = await getEventTypes();
        if (Array.isArray(types)) {
          // Convert string array to EventType objects
          const typedEventTypes: EventType[] = types.map((typeName: string, index: number) => ({
            _id: `event-type-${index}`,
            name: typeName
          }));
          setEventTypes(typedEventTypes);
        }
      } catch (err) {
        console.error("Failed to fetch event types:", err);
      }
    };

    // Fetch venue types
    const fetchVenueTypes = async () => {
      try {
        const types = await getVenueTypes();
        if (Array.isArray(types)) {
          // Convert string array to VenueType objects  
          const typedVenueTypes: VenueType[] = types.map((typeName: string, index: number) => ({
            _id: `venue-type-${index}`,
            name: typeName
          }));
          setVenueTypes(typedVenueTypes);
        }
      } catch (err) {
        console.error("Failed to fetch venue types:", err);
      }
    };

    fetchEventTypes();
    fetchVenueTypes();
  }, []);

  // Find the full event type object by ID
  const findEventType = (eventTypeId: string): EventType | null => {
    if (!eventTypeId) return null;
    return eventTypes.find(type => type._id === eventTypeId) || null;
  };

  // Find the full venue type object by ID
  const findVenueType = (venueTypeId: string): VenueType | null => {
    if (!venueTypeId) return null;
    return venueTypes.find(type => type._id === venueTypeId) || null;
  };

  return (
    <>
      <div className="filters-grid">
        <CityFilter 
          selectedCity={selectedCity} 
          onChange={onCityChange} 
        />
        
        <CapacityFilter 
          capacity={capacity} 
          onChange={onCapacityChange} 
        />
        
        <ParkingFilter 
          requiresParking={requiresParking} 
          onChange={onParkingChange} 
        />
        
        <EventTypeFilter 
          selectedEventType={selectedEventType} 
          onChange={(eventTypeId: string) => {
            const eventType = findEventType(eventTypeId);
            onEventTypeChange(eventType);
          }}
        />
        
        <VenueTypeFilter 
          selectedVenueType={selectedVenueType} 
          onChange={(venueTypeId: string) => {
            const venueType = findVenueType(venueTypeId);
            onVenueTypeChange(venueType);
          }}
        />
      </div>
      
      <ServicesFilter 
        serviceSearch={serviceSearch}
        selectedServices={selectedServices}
        onSearchChange={onServiceSearchChange}
        onAddService={onAddService}
        onRemoveService={onRemoveService}
      />
      
      <div className="search-button-container">
        <button className="search-button" onClick={onSearch}>
          Search Rooms
        </button>
      </div>
    </>
  );
};

export default SearchFilters; 