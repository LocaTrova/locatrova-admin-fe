import React, { useState, useEffect } from 'react';
import { getCities } from '../../../api/scraping/api';

interface CityFilterProps {
  selectedCity: string;
  onChange: (city: string) => void;
}

const CityFilter: React.FC<CityFilterProps> = ({ selectedCity, onChange }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
        setError("Failed to load cities");
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  if (loading) {
    return (
      <div className="filter-item">
        <label className="filter-label">City</label>
        <select className="filter-select" disabled>
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="filter-item">
        <label className="filter-label">City</label>
        <select className="filter-select" disabled>
          <option>Error loading cities</option>
        </select>
      </div>
    );
  }

  return (
    <div className="filter-item">
      <label className="filter-label">City</label>
      <select 
        className="filter-select" 
        value={selectedCity}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Cities</option>
        {cities.map((city, index) => (
          <option key={index} value={city}>
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CityFilter; 