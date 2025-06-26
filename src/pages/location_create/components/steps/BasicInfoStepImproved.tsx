import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { LocationFormData, validateBasicInfo } from '../../validation';
import { getAddressSuggestions } from '../../../../api/utils/api';

interface BasicInfoStepProps {
  data: LocationFormData;
  updateData: (updates: Partial<LocationFormData>) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface AddressSuggestion {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface AddressSearchState {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  showSuggestions: boolean;
}

const BasicInfoStep: FC<BasicInfoStepProps> = ({
  data,
  updateData,
  errors,
  onNext
}) => {
  const [addressState, setAddressState] = useState<AddressSearchState>({
    suggestions: [],
    isLoading: false,
    error: null,
    showSuggestions: false
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Refs for cleanup and focus management
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Input sanitization
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  // Enhanced validation with real-time feedback
  const validateField = useCallback((field: string, value: unknown): string | null => {
    switch (field) {
      case 'name':
        const nameValue = value as string;
        if (!nameValue || !nameValue.trim()) return 'Il nome della location è obbligatorio';
        if (nameValue.length < 3) return 'Il nome deve essere di almeno 3 caratteri';
        if (nameValue.length > 100) return 'Il nome non può superare i 100 caratteri';
        if (!/^[a-zA-ZÀ-ÿ0-9\s\-_.,'()]+$/.test(nameValue)) return 'Il nome contiene caratteri non validi';
        return null;
      
      case 'address':
        const addressValue = value as string;
        if (!addressValue || !addressValue.trim()) return 'L\'indirizzo è obbligatorio';
        if (!data.addressSelected) return 'Seleziona un indirizzo dalla lista dei suggerimenti';
        return null;
      
      case 'city':
        const cityValue = value as string;
        if (!cityValue || !cityValue.trim()) return 'La città è obbligatoria';
        if (cityValue.length > 50) return 'Il nome della città è troppo lungo';
        if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(cityValue)) return 'Il nome della città contiene caratteri non validi';
        return null;
      
      case 'cap':
        const capValue = value as string;
        if (capValue && !/^\d{5}$/.test(capValue)) return 'Il CAP deve essere di 5 cifre';
        return null;
      
      case 'description':
        const descValue = value as string;
        if (descValue && descValue.length > 1000) return 'La descrizione non può superare i 1000 caratteri';
        return null;
      
      case 'rules':
        const rulesValue = value as string;
        if (rulesValue && rulesValue.length > 500) return 'Le regole non possono superare i 500 caratteri';
        return null;
      
      default:
        return null;
    }
  }, [data.addressSelected]);

  // Enhanced address search with proper error handling and cleanup
  const handleAddressSearch = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const sanitizedQuery = sanitizeInput(query);
    
    if (sanitizedQuery.length < 3) {
      setAddressState(prev => ({
        ...prev,
        suggestions: [],
        showSuggestions: false,
        error: null
      }));
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setAddressState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      showSuggestions: true
    }));

    try {
      // Add delay to avoid too many requests
      await new Promise(resolve => {
        searchTimeoutRef.current = setTimeout(resolve, 300);
      });

      if (signal.aborted) return;

      const response = await getAddressSuggestions(sanitizedQuery);
      
      if (signal.aborted) return;

      if (response && Array.isArray(response)) {
        setAddressState(prev => ({
          ...prev,
          suggestions: response.slice(0, 5), // Limit to 5 suggestions
          isLoading: false,
          error: null
        }));
      } else {
        setAddressState(prev => ({
          ...prev,
          suggestions: [],
          isLoading: false,
          error: 'Nessun indirizzo trovato'
        }));
      }
    } catch (error) {
      if (signal.aborted) return;
      
      console.error('Address search error:', error);
      setAddressState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        error: 'Errore durante la ricerca degli indirizzi. Riprova.'
      }));
    }
  }, []);

  const handleAddressChange = useCallback((value: string) => {
    const sanitizedValue = sanitizeInput(value);
    
    updateData({ 
      address: sanitizedValue, 
      addressSelected: false,
      coordinates: [0, 0]
    });

    // Clear field error when user starts typing
    if (fieldErrors.address) {
      setFieldErrors(prev => ({ ...prev, address: '' }));
    }
    
    setActiveSuggestionIndex(-1);
    handleAddressSearch(sanitizedValue);
  }, [updateData, fieldErrors.address, handleAddressSearch]);

  const handleSelectAddress = useCallback((suggestion: AddressSuggestion) => {
    let city = data.city || '';
    let cap = data.cap || '';

    // Extract city from formatted address (simple approach - take the part after the first comma)
    const addressParts = suggestion.formattedAddress.split(',');
    if (addressParts.length > 1 && !city) {
      city = addressParts[1].trim();
    }

    updateData({
      address: suggestion.formattedAddress,
      city,
      cap,
      coordinates: [suggestion.lng, suggestion.lat],
      addressSelected: true
    });
    
    setAddressState(prev => ({
      ...prev,
      suggestions: [],
      showSuggestions: false,
      error: null
    }));

    setActiveSuggestionIndex(-1);

    // Clear related errors
    setFieldErrors(prev => ({
      ...prev,
      address: '',
      city: city ? '' : prev.city,
      cap: cap ? '' : prev.cap
    }));
  }, [data.city, data.cap, updateData]);

  // Enhanced input handlers with validation
  const handleInputChange = useCallback((field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    updateData({ [field]: sanitizedValue });
    
    // Real-time validation
    const fieldError = validateField(field, sanitizedValue);
    setFieldErrors(prev => ({ ...prev, [field]: fieldError || '' }));
  }, [updateData, validateField]);

  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!addressState.showSuggestions || addressState.suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < addressState.suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : addressState.suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSelectAddress(addressState.suggestions[activeSuggestionIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setAddressState(prev => ({ ...prev, showSuggestions: false }));
        setActiveSuggestionIndex(-1);
        break;
    }
  }, [addressState.showSuggestions, addressState.suggestions, activeSuggestionIndex, handleSelectAddress]);

  const handleNext = useCallback(() => {
    // Comprehensive validation before proceeding
    const validationResult = validateBasicInfo(data);
    
    // Also check our enhanced field validations
    const enhancedErrors: Record<string, string> = {};
    
    // Validate individual fields
    const nameError = validateField('name', data.name);
    if (nameError) enhancedErrors.name = nameError;
    
    const addressError = validateField('address', data.address);
    if (addressError) enhancedErrors.address = addressError;
    
    const cityError = validateField('city', data.city);
    if (cityError) enhancedErrors.city = cityError;
    
    const capError = validateField('cap', data.cap);
    if (capError) enhancedErrors.cap = capError;
    
    const descriptionError = validateField('description', data.description);
    if (descriptionError) enhancedErrors.description = descriptionError;
    
    const rulesError = validateField('rules', data.rules);
    if (rulesError) enhancedErrors.rules = rulesError;

    const allErrors = { ...validationResult.errors, ...enhancedErrors };
    
    if (Object.keys(allErrors).length === 0) {
      onNext();
    } else {
      setFieldErrors(allErrors);
      // Focus first field with error
      const firstErrorField = Object.keys(allErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [data, validateField, onNext]);

  // Determine field states
  const getFieldState = (field: string, value: unknown) => {
    const error = fieldErrors[field] || errors[field];
    if (error) return 'error';
    
    switch (field) {
      case 'address':
        return data.address && data.addressSelected ? 'success' : '';
      case 'cap':
        return value && typeof value === 'string' && /^\d{5}$/.test(value) ? 'success' : '';
      default:
        return value && typeof value === 'string' && value.trim() ? 'success' : '';
    }
  };

  const isFormValid = data.name.trim() && 
                     data.address && 
                     data.addressSelected && 
                     data.city.trim() &&
                     Object.keys(fieldErrors).every(key => !fieldErrors[key]);

  return (
    <div className="form-section">
      <h2 className="form-section-title">Informazioni di Base</h2>
      <p className="form-section-description">
        Inserisci le informazioni principali della location. Tutti i campi contrassegnati con * sono obbligatori.
      </p>

      {/* Location Name */}
      <div className="form-group">
        <label htmlFor="name" className="form-label required">
          Nome Location
        </label>
        <input
          id="name"
          type="text"
          className={`form-input ${getFieldState('name', data.name)}`}
          placeholder="es. Villa Sunset, Sala Conferenze Aurora..."
          value={data.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          autoComplete="off"
          maxLength={100}
          aria-describedby="name-error name-help"
          aria-invalid={!!(fieldErrors.name || errors.name)}
        />
        {(fieldErrors.name || errors.name) && (
          <div id="name-error" className="form-error" role="alert">
            <span>⚠️</span>
            {fieldErrors.name || errors.name}
          </div>
        )}
        {!fieldErrors.name && !errors.name && data.name.trim() && (
          <div className="form-success">
            <span>✓</span>
            Nome valido
          </div>
        )}
        <div id="name-help" className="form-help">
          Il nome deve essere unico e descrittivo (3-100 caratteri)
        </div>
      </div>

      {/* Address with Enhanced Suggestions */}
      <div className="form-group">
        <label htmlFor="address" className="form-label required">
          Indirizzo
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="address"
            type="text"
            className={`form-input ${getFieldState('address', data.address)}`}
            placeholder="Inizia a digitare l'indirizzo..."
            value={data.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (addressState.suggestions.length > 0) {
                setAddressState(prev => ({ ...prev, showSuggestions: true }));
              }
            }}
            onBlur={() => {
              // Delay hiding to allow clicking on suggestions
              setTimeout(() => {
                setAddressState(prev => ({ ...prev, showSuggestions: false }));
                setActiveSuggestionIndex(-1);
              }, 200);
            }}
            autoComplete="off"
            aria-describedby="address-error address-help"
            aria-invalid={!!(fieldErrors.address || errors.address)}
            aria-expanded={addressState.showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
          />
          
          {addressState.isLoading && (
            <div style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)' 
            }}>
              <div className="loading-spinner" aria-label="Ricerca indirizzi..." />
            </div>
          )}

          {addressState.showSuggestions && (
            <div 
              className="address-suggestions"
              role="listbox"
              aria-label="Suggerimenti indirizzi"
            >
              {addressState.suggestions.length > 0 ? (
                addressState.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    ref={el => suggestionRefs.current[index] = el}
                    className={`address-suggestion ${index === activeSuggestionIndex ? 'active' : ''}`}
                    onClick={() => handleSelectAddress(suggestion)}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    tabIndex={-1}
                  >
                    {suggestion.formattedAddress}
                  </div>
                ))
              ) : addressState.error ? (
                <div className="address-suggestion error" role="alert">
                  {addressState.error}
                </div>
              ) : (
                <div className="address-suggestion" role="status">
                  Nessun risultato trovato
                </div>
              )}
            </div>
          )}
        </div>
        
        {(fieldErrors.address || errors.address) && (
          <div id="address-error" className="form-error" role="alert">
            <span>⚠️</span>
            {fieldErrors.address || errors.address}
          </div>
        )}
        
        {!fieldErrors.address && !errors.address && data.address && !data.addressSelected && (
          <div className="form-help">
            Seleziona un indirizzo dalla lista dei suggerimenti
          </div>
        )}
        
        {!fieldErrors.address && !errors.address && data.address && data.addressSelected && (
          <div className="form-success">
            <span>✓</span>
            Indirizzo confermato
          </div>
        )}
        
        <div id="address-help" className="form-help">
          Usa le frecce ↑↓ per navigare, Invio per selezionare, Esc per chiudere
        </div>
      </div>

      {/* City */}
      <div className="form-group">
        <label htmlFor="city" className="form-label required">
          Città
        </label>
        <input
          id="city"
          type="text"
          className={`form-input ${getFieldState('city', data.city)}`}
          placeholder="es. Roma, Milano, Napoli..."
          value={data.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          autoComplete="address-level2"
          maxLength={50}
          aria-describedby="city-error city-help"
          aria-invalid={!!(fieldErrors.city || errors.city)}
        />
        {(fieldErrors.city || errors.city) && (
          <div id="city-error" className="form-error" role="alert">
            <span>⚠️</span>
            {fieldErrors.city || errors.city}
          </div>
        )}
        {!fieldErrors.city && !errors.city && data.city.trim() && (
          <div className="form-success">
            <span>✓</span>
            Città valida
          </div>
        )}
        <div id="city-help" className="form-help">
          La città viene spesso compilata automaticamente dall'indirizzo
        </div>
      </div>

      {/* Postal Code */}
      <div className="form-group">
        <label htmlFor="cap" className="form-label">
          CAP
        </label>
        <input
          id="cap"
          type="text"
          className={`form-input ${getFieldState('cap', data.cap)}`}
          placeholder="es. 00100"
          value={data.cap || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ''); // Only digits
            handleInputChange('cap', value);
          }}
          maxLength={5}
          autoComplete="postal-code"
          pattern="\d{5}"
          aria-describedby="cap-error cap-help"
          aria-invalid={!!(fieldErrors.cap || errors.cap)}
        />
        {(fieldErrors.cap || errors.cap) && (
          <div id="cap-error" className="form-error" role="alert">
            <span>⚠️</span>
            {fieldErrors.cap || errors.cap}
          </div>
        )}
        {!fieldErrors.cap && !errors.cap && data.cap && /^\d{5}$/.test(data.cap) && (
          <div className="form-success">
            <span>✓</span>
            CAP valido
          </div>
        )}
        <div id="cap-help" className="form-help">
          Il CAP viene spesso compilato automaticamente dall'indirizzo
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Descrizione
        </label>
        <textarea
          id="description"
          className={`form-textarea ${getFieldState('description', data.description)}`}
          placeholder="Descrivi la location, i suoi punti di forza, le caratteristiche uniche..."
          value={data.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          maxLength={1000}
          aria-describedby="description-help description-count"
          style={{ resize: 'vertical' }}
        />
        <div className="form-help">
          <span id="description-help">
            Una buona descrizione aiuta i clienti a capire meglio la location
          </span>
          <span id="description-count" style={{ float: 'right', fontSize: '0.8rem', color: '#6b7280' }}>
            {(data.description || '').length}/1000
          </span>
        </div>
      </div>

      {/* Rules */}
      <div className="form-group">
        <label htmlFor="rules" className="form-label">
          Regole e Restrizioni
        </label>
        <textarea
          id="rules"
          className={`form-textarea ${getFieldState('rules', data.rules)}`}
          placeholder="es. Vietato fumare, Silenzio dopo le 22:00, Massimo 100 persone..."
          value={data.rules || ''}
          onChange={(e) => handleInputChange('rules', e.target.value)}
          rows={3}
          maxLength={500}
          aria-describedby="rules-help rules-count"
          style={{ resize: 'vertical' }}
        />
        <div className="form-help">
          <span id="rules-help">
            Specifica eventuali regole o restrizioni per l'uso della location
          </span>
          <span id="rules-count" style={{ float: 'right', fontSize: '0.8rem', color: '#6b7280' }}>
            {(data.rules || '').length}/500
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Passo 1 di 6 - Informazioni di Base
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!isFormValid}
            aria-describedby="form-status"
          >
            Continua →
          </button>
        </div>
        <div id="form-status" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          {!isFormValid ? (
            <span style={{ color: '#ef4444' }}>
              Completa i campi obbligatori per continuare
            </span>
          ) : (
            <span style={{ color: '#10b981' }}>
              ✓ Tutti i campi obbligatori completati
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;