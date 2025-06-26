import React, { useState, useEffect } from 'react';
import { Service } from './types';
import { getServices } from '../../../api/scraping/api';

interface ServicesFilterProps {
  serviceSearch: string;
  selectedServices: Service[];
  onSearchChange: (search: string) => void;
  onAddService: (service: Service) => void;
  onRemoveService: (serviceId: string) => void;
}

const ServicesFilter: React.FC<ServicesFilterProps> = ({ 
  serviceSearch, 
  selectedServices, 
  onSearchChange, 
  onAddService, 
  onRemoveService 
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch services when search text changes
  useEffect(() => {
    const fetchServices = async () => {
      if (!serviceSearch.trim()) {
        setServices([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const servicesData = await getServices(serviceSearch);
        console.log('services: ', servicesData);
        setServices(servicesData);
      } catch (err) {
        setError('Failed to fetch services');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [serviceSearch]);

  return (
    <div className="services-section">
      <label className="filter-label">Services</label>
      <div className="services-tags">
        {selectedServices.map(service => (
          <div key={service._id} className="service-tag">
            {service.name}
            <button 
              className="tag-remove-btn" 
              onClick={() => onRemoveService(service._id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="services-input-container">
        <input 
          type="text" 
          className="services-input" 
          value={serviceSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for services..."
        />
        {loading && <div className="services-loading">Loading...</div>}
        {error && <div className="services-error">{error}</div>}
        {!loading && services.length > 0 && (
          <div className="services-dropdown">
            {services.map(service => (
              <div 
                key={service._id} 
                className="service-option"
                onClick={() => {
                  onAddService(service);
                }}
              >
                {service.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesFilter; 