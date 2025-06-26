import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getLocationDetails, updateLocation } from '../../api/locations/api';
import { Location } from '../../api/common/types';
import './location_details.css';

interface LocationData extends Location {
  [key: string]: unknown;
}

const LocationDetail: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const [initialData, setInitialData] = useState<LocationData | null>(null);
  const [formData, setFormData] = useState<LocationData | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!locationId) {
        navigate('/locations');
        return;
      }

      try {
        const locationDetails = await getLocationDetails(locationId);

        if (!locationDetails) {
          navigate('/locations');
          return;
        }

        setInitialData(locationDetails as LocationData);
        setFormData(locationDetails as LocationData);
      } catch (error) {
        console.error('Error fetching location details:', error);
        navigate('/locations');
      }
    };

    fetchLocationDetails();
  }, [locationId, navigate]);

  /*const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };*/

  const handleNestedChange = (path: string[], value: unknown) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newData = { ...prev } as any;
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData || !initialData) return;

    const modifiedData = Object.keys(formData).reduce((acc, key) => {
      if (formData[key] !== initialData[key]) {
        acc[key] = formData[key];
      }
      return acc;
    }, {} as Record<string, unknown>);

    // Remove locationId from here as it's added below

    try {
      const response = await updateLocation({ id: locationId!, ...modifiedData });
      setSuccess(!!response);
    } catch (error) {
      console.error('Error updating location: ', error);
      setSuccess(false);
    }
  };

  const renderField = (key: string, value: unknown, path: string[] = []) => {
    const fullPath = [...path, key];
    const isReadOnly = ['stripeId', 'location', 'ownerId'].includes(key);

    const commonProps = {
      id: key,
      name: key,
      disabled: isReadOnly,
    };

    if (Array.isArray(value)) {
      return (
        <div key={key} className="form-group">
          <label>{key}:</label>
          <div className="nested-group">
            {value.map((item, index) => (
              <div key={index} className={key === 'images' ? 'image-group' : ''}>
                {key === 'images' ? (
                  <>
                    <img src={item} alt={`Image ${index}`} className="image-preview" />
                    <input
                      {...commonProps}
                      className="image-input"
                      type="text"
                      value={item}
                      onChange={(e) => handleNestedChange([...fullPath, index.toString()], e.target.value)}
                    />
                  </>
                ) : (
                  renderField(`${key}[${index}]`, item, fullPath)
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="form-group">
          <label>{key}:</label>
          <div className="nested-group">
            {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) =>
              renderField(subKey, subValue, fullPath)
            )}
          </div>
        </div>
      );
    } else if (typeof value === 'boolean') {
      return (
        <div key={key} className="form-group">
          <label htmlFor={key}>{key}:</label>
          <input
            {...commonProps}
            type="checkbox"
            checked={value}
            onChange={(e) => handleNestedChange(fullPath, e.target.checked)}
          />
        </div>
      );
    } else if (typeof value === 'number') {
      return (
        <div key={key} className="form-group">
          <label htmlFor={key}>{key}:</label>
          <input
            {...commonProps}
            type="number"
            value={value}
            onChange={(e) => handleNestedChange(fullPath, parseFloat(e.target.value))}
          />
        </div>
      );
    } else if (key === 'description' || key === 'rules') {
      return (
        <div key={key} className="form-group">
          <label htmlFor={key}>{key}:</label>
          <textarea
            {...commonProps}
            value={String(value || '')}
            onChange={(e) => handleNestedChange(fullPath, e.target.value)}
          />
        </div>
      );
    } else {
      return (
        <div key={key} className="form-group">
          <label htmlFor={key}>{key}:</label>
          <input
            {...commonProps}
            type="text"
            value={String(value || '')}
            onChange={(e) => handleNestedChange(fullPath, e.target.value)}
          />
        </div>
      );
    }
  };

  if (!formData || !Object.keys(formData).length) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="location-container">
      <h1 className="location-title">Modifica della Location</h1>
      <p style={{color: 'black'}}>Link Utili: <Link to="/">[Home]</Link> - <Link to="/locations">[Lista Location]</Link></p>
      <form onSubmit={handleSubmit} className="location-form">
        <input 
          type="text" 

          value={locationId} 
          className="location-id" 
          disabled 
        />
        {Object.entries(formData).map(([key, value]) => renderField(key, value))}
        {success !== null && (
          <div className={success ? 'success-message' : 'error-message'}>
            {success ? 'Salvataggio avvenuto con successo' : 'Errore durante il salvataggio'}
          </div>
        )}
        <button type="submit" className="submit-button">Salva</button>
      </form>
    </div>
  );
};

export default LocationDetail;