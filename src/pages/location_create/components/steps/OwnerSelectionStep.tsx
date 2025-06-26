import { FC, useState, useEffect, useCallback } from 'react';
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
}

const OwnerSelectionStep: FC<OwnerSelectionStepProps> = ({
  data,
  updateData,
  errors,
  onNext,
  onPrevious
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load selected user on component mount
  useEffect(() => {
    if (data.ownerId && !selectedUser) {
      // Try to find user in current results first
      const foundUser = users.find(u => u._id === data.ownerId);
      if (foundUser) {
        setSelectedUser(foundUser);
      }
    }
  }, [data.ownerId, selectedUser, users]);

  const searchUsers = useCallback(async (term: string) => {
    if (!term.trim()) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await getUsersWithFilters({ username: term });
      setUsers(result.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && !selectedUser) {
        searchUsers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedUser, searchUsers]);

  const handleSpecialChange = (isSpecial: boolean) => {
    updateData({ 
      special: isSpecial,
      ownerId: isSpecial ? '' : data.ownerId // Clear owner if special
    });
    
    if (isSpecial) {
      setSelectedUser(null);
      setSearchTerm('');
      setShowResults(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    updateData({ ownerId: user._id });
    setSearchTerm('');
    setShowResults(false);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    setSelectedUser(null);
    updateData({ ownerId: '' });
    setShowResults(true);
  };

  const handleNext = () => {
    const validation = validateOwnerInfo(data);
    if (validation.isValid) {
      onNext();
    }
  };

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
          />
          <label htmlFor="special" className="checkbox-label">
            <strong>Location Speciale/Storica</strong>
          </label>
        </div>
        <p>
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
                errors.ownerId ? 'error' : 
                selectedUser ? 'success' : ''
              }`}
              placeholder="Inizia a digitare nome, cognome o email..."
              value={selectedUser ? `${selectedUser.name} ${selectedUser.surname}` : searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => !selectedUser && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              autoComplete="off"
            />

            {isSearching && (
              <div style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)' 
              }}>
                <div className="loading-spinner" />
              </div>
            )}

            {showResults && (searchTerm || users.length > 0) && !selectedUser && (
              <div className="user-search-results">
                {users.length > 0 ? (
                  users.map(user => (
                    <div
                      key={user._id}
                      className="user-search-item"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div>
                        <strong>{user.name} {user.surname}</strong>
                        {user.email && (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
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

          {errors.ownerId && (
            <div className="form-error">
              <span>⚠️</span>
              {errors.ownerId}
            </div>
          )}

          {!errors.ownerId && selectedUser && (
            <div className="form-success">
              <span>✓</span>
              Proprietario selezionato: {selectedUser.name} {selectedUser.surname}
            </div>
          )}

          <div className="form-help">
            Cerca per nome, cognome o email. Se non trovi l'utente, 
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
                  {selectedUser.email}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                ID: {selectedUser._id}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              onClick={() => {
                setSelectedUser(null);
                updateData({ ownerId: '' });
                setSearchTerm('');
              }}
            >
              Cambia
            </button>
          </div>
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
          >
            Continua →
          </button>
        </div>
        {!isFormValid && (
          <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
            {data.special ? 
              'Location speciale configurata' : 
              'Seleziona un proprietario per continuare'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerSelectionStep;