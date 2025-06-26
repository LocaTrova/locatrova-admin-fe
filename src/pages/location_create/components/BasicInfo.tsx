import { FC, useState, ChangeEvent } from 'react';
import { inputStyle, sectionStyle } from '../styles';
import styles from '../styles/BasicInfo.module.css';
import { getAddressSuggestions } from '../../../api/utils/api';

// Update the type to match the backend response
type AddressSuggestion = {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
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
        if (res) {
          setAddressSuggestions(res);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleSelectAddress = (feature: AddressSuggestion) => {
    // Extract city from formatted address (simple approach - take the part after the first comma)
    const addressParts = feature.formattedAddress.split(',');
    const city = addressParts.length > 1 ? addressParts[1].trim() : '';

    setFormData(prev => ({
      ...prev,
      address: feature.formattedAddress,
      city,
      coordinates: [feature.lng, feature.lat],
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
                {suggestion.formattedAddress}
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