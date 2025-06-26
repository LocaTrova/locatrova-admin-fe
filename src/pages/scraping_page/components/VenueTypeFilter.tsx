import React, { useState, useEffect } from 'react';
import { getVenueTypes } from '../../../api/scraping/api';
import { VenueType } from './types';

interface VenueTypeFilterProps {
  selectedVenueType: string;
  onChange: (venueTypeId: string) => void;
}

const VenueTypeFilter: React.FC<VenueTypeFilterProps> = ({ selectedVenueType, onChange }) => {
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenueTypes = async () => {
      try {
        const types = await getVenueTypes();
        if (Array.isArray(types)) {
          const typedVenueTypes: VenueType[] = types.map((typeName: string, index: number) => ({
            _id: `venue-type-${index}`,
            name: typeName
          }));
          setVenueTypes(typedVenueTypes);
        }
      } catch (err) {
        console.error("Failed to fetch venue types:", err);
        setError("Failed to load venue types");
      } finally {
        setLoading(false);
      }
    };

    fetchVenueTypes();
  }, []);

  if (loading) {
    return (
      <div className="filter-item">
        <label className="filter-label">Venue Type</label>
        <select className="filter-select" disabled>
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="filter-item">
        <label className="filter-label">Venue Type</label>
        <select className="filter-select" disabled>
          <option>Error loading venue types</option>
        </select>
      </div>
    );
  }

  return (
    <div className="filter-item">
      <label className="filter-label">Venue Type</label>
      <select 
        className="filter-select" 
        value={selectedVenueType}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Venue Types</option>
        {venueTypes.map((venueType) => (
          <option key={venueType._id} value={venueType._id}>
            {venueType.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VenueTypeFilter; 