import { FC, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LocationFormData, validateOwnerInfo } from '../../validation';
import { getUsersWithFilters } from '../../../../api/users/api';

interface OwnerSelectionStepProps {
  data: LocationFormData;
  updateData: (updates: Partial<LocationFormData>) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface User {
  _id: string;
  name: string;
  surname: string;
  email?: string;
  username?: string;
}

interface UserSearchState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  showResults: boolean;
}

const OwnerSelectionStep: FC<OwnerSelectionStepProps> = ({
  data,
  updateData,
  errors,
  onNext,
  onPrevious
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchState, setSearchState] = useState<UserSearchState>({
    users: [],
    isLoading: false,
    error: null,
    showResults: false
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeUserIndex, setActiveUserIndex] = useState(-1);

  // Refs for cleanup and focus management
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Memoize whether we should load user by ID to prevent excessive calls
  const shouldLoadUserById = useMemo(() => {
    return data.ownerId && !selectedUser && !searchState.users.find(u => u._id === data.ownerId);
  }, [data.ownerId, selectedUser, searchState.users]);

  // Load selected user on component mount or when ownerId changes
  useEffect(() => {
    if (data.ownerId && !selectedUser) {
      // Try to find user in current results first
      const foundUser = searchState.users.find(u => u._id === data.ownerId);
      if (foundUser) {
        setSelectedUser(foundUser);
      } else if (shouldLoadUserById) {
        // Try to fetch user by ID if not in current results
        loadUserById(data.ownerId);
      }
    } else if (!data.ownerId && selectedUser) {
      setSelectedUser(null);
    }
  }, [data.ownerId, selectedUser, searchState.users, shouldLoadUserById, loadUserById]);

  // Input sanitization
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  // Load user by ID (when component mounts with existing ownerId)
  const loadUserById = useCallback(async (userId: string) => {
    try {
      // This is a simplified approach - in production you might have a getUserById API
      const result = await getUsersWithFilters({ userId });
      const user = result.users?.[0];
      if (user) {
        setSelectedUser(user);
      }
    } catch (error) {
      console.error('Failed to load user by ID:', error);
      // Clear invalid ownerId
      updateData({ ownerId: '' });
    }
  }, [updateData]);

  // Enhanced user search with proper error handling and cleanup
  const searchUsers = useCallback(async (term: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const sanitizedTerm = sanitizeInput(term);

    if (!sanitizedTerm || sanitizedTerm.length < 2) {
      setSearchState(prev => ({
        ...prev,
        users: [],
        showResults: false,
        error: null
      }));
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      showResults: true
    }));

    try {
      // Add delay to avoid too many requests
      await new Promise(resolve => {
        searchTimeoutRef.current = setTimeout(resolve, 300);
      });

      if (signal.aborted) return;

      const result = await getUsersWithFilters({ 
        username: sanitizedTerm,
        name: sanitizedTerm,
        email: sanitizedTerm 
      });

      if (signal.aborted) return;

      const users = result.users || [];
      setSearchState(prev => ({
        ...prev,
        users: users.slice(0, 10), // Limit to 10 results
        isLoading: false,
        error: users.length === 0 ? 'Nessun utente trovato' : null
      }));

    } catch (error) {
      if (signal.aborted) return;

      console.error('User search error:', error);
      setSearchState(prev => ({
        ...prev,
        users: [],
        isLoading: false,
        error: 'Errore durante la ricerca degli utenti. Riprova.'
      }));
    }
  }, []);

  // Enhanced validation
  const validateField = useCallback((field: string, value: unknown): string | null => {
    switch (field) {
      case 'ownerId':
        if (!data.special && (!value || !value.trim())) {
          return 'Seleziona un proprietario o marca la location come speciale';
        }
        return null;
      default:
        return null;
    }
  }, [data.special]);

  const handleSpecialChange = useCallback((isSpecial: boolean) => {
    updateData({ 
      special: isSpecial,
      ownerId: isSpecial ? '' : data.ownerId // Clear owner if special
    });
    
    if (isSpecial) {
      setSelectedUser(null);
      setSearchTerm('');
      setSearchState(prev => ({ ...prev, showResults: false }));
      setFieldErrors(prev => ({ ...prev, ownerId: '' }));
    }
  }, [updateData, data.ownerId]);

  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
    updateData({ ownerId: user._id });
    setSearchTerm('');
    setSearchState(prev => ({ ...prev, showResults: false }));
    setActiveUserIndex(-1);
    setFieldErrors(prev => ({ ...prev, ownerId: '' }));
  }, [updateData]);

  const handleSearchInputChange = useCallback((value: string) => {
    const sanitizedValue = sanitizeInput(value);
    
    setSearchTerm(sanitizedValue);
    setSelectedUser(null);
    updateData({ ownerId: '' });
    setActiveUserIndex(-1);
    
    // Clear field error when user starts typing
    if (fieldErrors.ownerId) {
      setFieldErrors(prev => ({ ...prev, ownerId: '' }));
    }

    if (sanitizedValue) {
      searchUsers(sanitizedValue);
    } else {
      setSearchState(prev => ({ ...prev, showResults: false, users: [] }));
    }
  }, [updateData, fieldErrors.ownerId, searchUsers]);

  // Keyboard navigation for user results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!searchState.showResults || searchState.users.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveUserIndex(prev => 
          prev < searchState.users.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setActiveUserIndex(prev => 
          prev > 0 ? prev - 1 : searchState.users.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (activeUserIndex >= 0) {
          handleUserSelect(searchState.users[activeUserIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setSearchState(prev => ({ ...prev, showResults: false }));
        setActiveUserIndex(-1);
        break;
    }
  }, [searchState.showResults, searchState.users, activeUserIndex, handleUserSelect]);

  const handleNext = useCallback(() => {
    // Comprehensive validation before proceeding
    const validationResult = validateOwnerInfo(data);
    
    // Also check our enhanced field validations
    const enhancedErrors: Record<string, string> = {};
    const ownerError = validateField('ownerId', data.ownerId);
    if (ownerError) enhancedErrors.ownerId = ownerError;

    const allErrors = { ...validationResult.errors, ...enhancedErrors };
    
    if (Object.keys(allErrors).length === 0) {
      onNext();
    } else {
      setFieldErrors(allErrors);
      
      // Focus first field with error
      const firstErrorField = Object.keys(allErrors)[0];
      if (firstErrorField === 'ownerId') {
        const element = document.getElementById('owner-search');
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [data, validateField, onNext]);

  const clearSelection = useCallback(() => {
    setSelectedUser(null);
    updateData({ ownerId: '' });
    setSearchTerm('');
    setFieldErrors(prev => ({ ...prev, ownerId: '' }));
  }, [updateData]);

  const isFormValid = data.special || (data.ownerId && selectedUser);

  return (
    <div className="form-section">
      <h2 className="form-section-title">Selezione Proprietario</h2>
      <p className="form-section-description">
        Seleziona il proprietario della location o marcala come location speciale/storica.
      </p>

      {/* Special Location Toggle */}
      <div className="special-location-card">
        <div className="checkbox-group">
          <input
            id="special"
            type="checkbox"
            className="checkbox-input"
            checked={data.special}
            onChange={(e) => handleSpecialChange(e.target.checked)}
            aria-describedby="special-help"
          />
          <label htmlFor="special" className="checkbox-label">
            <strong>Location Speciale/Storica</strong>
          </label>
        </div>
        <p id="special-help">
          Le location speciali sono luoghi storici o di particolare interesse che non richiedono 
          un proprietario specifico e possono avere configurazioni particolari.
        </p>
        {data.special && (
          <div className="alert alert-info">
            <span>ℹ️</span>
            Hai selezionato una location speciale. Non è necessario selezionare un proprietario.
          </div>
        )}
      </div>

      {/* Owner Selection (only if not special) */}
      {!data.special && (
        <div className="form-group">
          <label htmlFor="owner-search" className="form-label required">
            Cerca Proprietario
          </label>
          <div className="user-search-container">
            <input
              id="owner-search"
              type="text"
              className={`form-input ${
                fieldErrors.ownerId || errors.ownerId ? 'error' : 
                selectedUser ? 'success' : ''
              }`}
              placeholder="Inizia a digitare nome, cognome o email..."
              value={selectedUser ? `${selectedUser.name} ${selectedUser.surname}` : searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!selectedUser && searchTerm) {
                  setSearchState(prev => ({ ...prev, showResults: true }));
                }
              }}
              onBlur={() => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => {
                  setSearchState(prev => ({ ...prev, showResults: false }));
                  setActiveUserIndex(-1);
                }, 200);
              }}
              autoComplete="off"
              aria-describedby="owner-search-error owner-search-help"
              aria-invalid={!!(fieldErrors.ownerId || errors.ownerId)}
              aria-expanded={searchState.showResults}
              aria-haspopup="listbox"
              role="combobox"
              maxLength={100}
            />

            {searchState.isLoading && (
              <div style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)' 
              }}>
                <div className="loading-spinner" aria-label="Ricerca utenti..." />
              </div>
            )}

            {searchState.showResults && (
              <div 
                className="user-search-results"
                role="listbox"
                aria-label="Risultati ricerca utenti"
              >
                {searchState.users.length > 0 ? (
                  searchState.users.map((user, index) => (
                    <div
                      key={user._id}
                      ref={el => userRefs.current[index] = el}
                      className={`user-search-item ${index === activeUserIndex ? 'active' : ''}`}
                      onClick={() => handleUserSelect(user)}
                      onMouseEnter={() => setActiveUserIndex(index)}
                      role="option"
                      aria-selected={index === activeUserIndex}
                      tabIndex={-1}
                    >
                      <div>
                        <strong>{user.name} {user.surname}</strong>
                        {user.email && (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            {user.email}
                          </div>
                        )}
                        {user.username && (
                          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                            @{user.username}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : searchState.error ? (
                  <div className="user-search-no-results error" role="alert">
                    {searchState.error}
                  </div>
                ) : searchTerm ? (
                  <div className="user-search-no-results">
                    Nessun utente trovato per "{searchTerm}"
                  </div>
                ) : (
                  <div className="user-search-no-results">
                    Inizia a digitare per cercare un utente
                  </div>
                )}
              </div>
            )}
          </div>

          {(fieldErrors.ownerId || errors.ownerId) && (
            <div id="owner-search-error" className="form-error" role="alert">
              <span>⚠️</span>
              {fieldErrors.ownerId || errors.ownerId}
            </div>
          )}

          {!fieldErrors.ownerId && !errors.ownerId && selectedUser && (
            <div className="form-success">
              <span>✓</span>
              Proprietario selezionato: {selectedUser.name} {selectedUser.surname}
            </div>
          )}

          <div id="owner-search-help" className="form-help">
            Cerca per nome, cognome o email. Usa le frecce ↑↓ per navigare, Invio per selezionare.
            Se non trovi l'utente, 
            <a 
              href="/users" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: '4px' }}
            >
              crealo prima dalla gestione utenti
            </a>.
          </div>
        </div>
      )}

      {/* Selected Owner Display */}
      {selectedUser && !data.special && (
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #0ea5e9', 
          borderRadius: '8px', 
          padding: '16px',
          margin: '16px 0'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}>
            Proprietario Selezionato
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600' }}>
                {selectedUser.name} {selectedUser.surname}
              </div>
              {selectedUser.email && (
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  📧 {selectedUser.email}
                </div>
              )}
              {selectedUser.username && (
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  👤 @{selectedUser.username}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                🆔 {selectedUser._id}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              onClick={clearSelection}
              aria-label="Cambia proprietario selezionato"
            >
              Cambia
            </button>
          </div>
        </div>
      )}

      {/* Validation Summary */}
      {!data.special && !selectedUser && searchTerm && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          Seleziona un utente dalla lista dei risultati per continuare
        </div>
      )}

      {/* Progress Indicator */}
      <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPrevious}
          >
            ← Indietro
          </button>
          
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Passo 2 di 6 - Proprietario
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
          {data.special ? (
            <span style={{ color: '#10b981' }}>
              ✓ Location speciale configurata
            </span>
          ) : selectedUser ? (
            <span style={{ color: '#10b981' }}>
              ✓ Proprietario selezionato
            </span>
          ) : (
            <span style={{ color: '#ef4444' }}>
              Seleziona un proprietario o marca come location speciale
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerSelectionStep;