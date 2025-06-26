import { FC, useState, ChangeEvent } from 'react';
import { inputStyle, sectionStyle } from '../styles';
import styles from '../styles/BasicInfo.module.css';
import { getAddressSuggestions } from '../../../api/utils/api';

// Update the type to match the backend response
type AddressSuggestion = {
  place_name: string;  // Full address
  geometry: {
    coordinates: [number, number];  // [longitude, latitude]
  };
  context: Array<{
    id: string;
    text: string;
  }>;
};

const BasicInfo: FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    cap: '',
    region: '',
    coordinates: [] as number[],
    addressSelected: false
  });
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);

  const handleAddressChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      address: value,
      addressSelected: false
    }));
    
    if (value.length > 3) {
      try {
        const res = await getAddressSuggestions(value);
        if (res?.features) {
          setAddressSuggestions(res.features);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleSelectAddress = (feature: AddressSuggestion) => {
    let city = "";
    let cap = "";
    let region = "";

    if (feature.context) {
      feature.context.forEach((c) => {
        if (c.id.startsWith("place.")) {
          city = c.text;
        } else if (c.id.startsWith("postcode.")) {
          cap = c.text;
        } else if (c.id.startsWith("region.")) {
          region = c.text;
        }
      });
    }

    setFormData(prev => ({
      ...prev,
      address: feature.place_name,
      city,
      cap,
      region,
      coordinates: feature.geometry.coordinates,
      addressSelected: true
    }));
    setAddressSuggestions([]);
  };

  return (
    <div style={sectionStyle}>
      <h4>Informazioni di base</h4>
      <div>
        <input 
          type="text" 
          placeholder="Name" 
          name="name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required 
          style={inputStyle}
        />
      </div>
      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Address" 
          name="address"
          value={formData.address}
          onChange={handleAddressChange}
          required 
          style={{
            ...inputStyle,
            borderColor: formData.address && !formData.addressSelected ? 'red' : inputStyle.borderColor
          }}
        />
        {formData.address && !formData.addressSelected && (
          <div style={{ color: 'red', fontSize: '0.8em', marginTop: '4px' }}>
            Seleziona un indirizzo nella lista
          </div>
        )}
        {addressSuggestions.length > 0 && (
          <ul className={styles.suggestionsList}>
            {addressSuggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelectAddress(suggestion)}
                className={styles.suggestionItem}
              >
                {suggestion.place_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <input 
          type="text" 
          placeholder="City" 
          name="city"
          value={formData.city}
          onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
          required 
          style={inputStyle}
        />
      </div>
      <div>
        <input 
          type="text" 
          placeholder="CAP" 
          name="cap"
          value={formData.cap}
          onChange={e => setFormData(prev => ({ ...prev, cap: e.target.value }))}
          style={inputStyle}
        />
      </div>
      {/* Add hidden inputs for the coordinates */}
      <input 
        type="hidden"
        name="longitude"
        value={formData.coordinates[0] || ''}
      />
      <input 
        type="hidden"
        name="latitude" 
        value={formData.coordinates[1] || ''}
      />
      <input 
        type="hidden"
        name="addressSelected"
        value={formData.addressSelected.toString()}
      />
    </div>
  );
};

export default BasicInfo; 