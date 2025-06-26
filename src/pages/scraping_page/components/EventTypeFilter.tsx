import React, { useState, useEffect } from 'react';
import { getEventTypes } from '../../../api/scraping/api';
import { EventType } from './types';

interface EventTypeFilterProps {
  selectedEventType: string;
  onChange: (eventTypeId: string) => void;
}

const EventTypeFilter: React.FC<EventTypeFilterProps> = ({ selectedEventType, onChange }) => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const types = await getEventTypes();
        // Convert string array to EventType objects
        if (Array.isArray(types)) {
          const typedEventTypes: EventType[] = types.map((typeName: string, index: number) => ({
            _id: `event-type-${index}`,
            name: typeName
          }));
          setEventTypes(typedEventTypes);
        }
      } catch (err) {
        console.error("Failed to fetch event types:", err);
        setError("Failed to load event types");
      } finally {
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, []);

  if (loading) {
    return (
      <div className="filter-item">
        <label className="filter-label">Event Type</label>
        <select className="filter-select" disabled>
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="filter-item">
        <label className="filter-label">Event Type</label>
        <select className="filter-select" disabled>
          <option>Error loading event types</option>
        </select>
      </div>
    );
  }

  return (
    <div className="filter-item">
      <label className="filter-label">Event Type</label>
      <select 
        className="filter-select" 
        value={selectedEventType}
        onChange={(e) => {
          const selectedId = e.target.value;
          // Just pass the ID to the parent - the parent component will convert this to the full object
          onChange(selectedId);
        }}
      >
        <option value="">All Event Types</option>
        {eventTypes.map((eventType) => (
          <option key={eventType._id} value={eventType._id}>
            {eventType.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EventTypeFilter; 