import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { filteredLocations, saveChanges, deleteLocation } from '../../api/locations/api';
import './locations.css';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Location {
  _id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerSurname: string;
  city: string;
  stripeId: string;
  special: boolean;
  fee: number;
  active: boolean;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SearchParams {
  name?: string;
  owner?: string;
  city?: string;
  active?: string;
  stripeId?: string;
  fee?: string;
  special?: string;
  verified?: string;
  page?: number;
  limit?: number;
}

interface LocationChange {
  locationId: string;
  field: keyof Location;
  oldValue: unknown;
  newValue: unknown;
  locationName: string;
}

// Enhanced error handling for location operations (currently unused but kept for future use)
// class LocationOperationError extends Error {
//   constructor(message: string, public operation: string, public locationId?: string) {
//     super(message);
//     this.name = 'LocationOperationError';
//   }
// }

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [modifiedLocations, setModifiedLocations] = useState<Map<string, Location>>(new Map());
  const [totalLocations, setTotalLocations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationChanges, setLocationChanges] = useState<Map<string, LocationChange[]>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize params from URL search params
  const [params, setParams] = useState<SearchParams>(() => ({
    name: searchParams.get('name') || '',
    owner: searchParams.get('owner') || '',
    city: searchParams.get('city') || '',
    active: searchParams.get('active') || '',
    stripeId: searchParams.get('stripeId') || '',
    fee: searchParams.get('fee') || '',
    special: searchParams.get('special') || '',
    verified: searchParams.get('verified') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10')
  }));

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

  // Sync URL params with state
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '' && value !== 1 && value !== 10) {
        newSearchParams.set(key, value.toString());
      }
    });
    
    setSearchParams(newSearchParams, { replace: true });
  }, [params, setSearchParams]);

  // Enhanced debounced search
  const debouncedFetchLocations = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchLocations();
    }, isInitialLoad ? 0 : 500);
  }, [isInitialLoad, fetchLocations]);

  useEffect(() => {
    debouncedFetchLocations();
  }, [debouncedFetchLocations]);

  const fetchLocations = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setErrors({});
    
    try {
      const data = await filteredLocations({
        name: params.name || undefined,
        owner: params.owner || undefined,
        city: params.city || undefined,
        active: params.active || undefined,
        stripeId: params.stripeId || undefined,
        fee: params.fee || undefined,
        special: params.special || undefined,
        verified: params.verified || undefined,
        page: params.page,
        limit: params.limit
      });

      if (abortControllerRef.current.signal.aborted) return;

      setLocations(data.locations || []);
      setTotalLocations(data.total || 0);
      
      // Reset modifications on new data
      setModifiedLocations(new Map());
      setLocationChanges(new Map());
      setSelectedLocations(new Set());
      setIsInitialLoad(false);
      
    } catch (error) {
      if (abortControllerRef.current.signal.aborted) return;
      
      console.error("Error fetching locations:", error);
      setErrors({ fetch: 'Errore nel caricamento delle location. Riprova.' });
      setLocations([]);
      setTotalLocations(0);
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [params]);

  // Get display locations (original + modifications)
  const displayLocations = useMemo(() => {
    return locations.map(location => {
      const modified = modifiedLocations.get(location._id);
      return modified || location;
    });
  }, [locations, modifiedLocations]);

  const handleLocationChange = useCallback(<K extends keyof Location>(
    locationId: string, 
    field: K, 
    newValue: Location[K]
  ) => {
    const originalLocation = locations.find(l => l._id === locationId);
    if (!originalLocation) return;

    const oldValue = originalLocation[field];
    
    // Update modified locations
    setModifiedLocations(prev => {
      const newMap = new Map(prev);
      const currentModified = newMap.get(locationId) || { ...originalLocation };
      
      if (newValue === oldValue) {
        // Back to original value
        if (Object.keys(currentModified).every(key => 
          currentModified[key as keyof Location] === originalLocation[key as keyof Location]
        )) {
          newMap.delete(locationId);
        } else {
          newMap.set(locationId, { ...currentModified, [field]: newValue });
        }
      } else {
        // New modification
        newMap.set(locationId, { ...currentModified, [field]: newValue });
      }
      
      return newMap;
    });

    // Track changes for display
    setLocationChanges(prev => {
      const newMap = new Map(prev);
      const locationChanges = newMap.get(locationId) || [];
      
      const existingChangeIndex = locationChanges.findIndex(change => change.field === field);
      const newChange: LocationChange = {
        locationId,
        field,
        oldValue,
        newValue,
        locationName: originalLocation.name
      };
      
      if (newValue === oldValue) {
        // Remove change if back to original
        if (existingChangeIndex >= 0) {
          locationChanges.splice(existingChangeIndex, 1);
        }
      } else {
        // Add or update change
        if (existingChangeIndex >= 0) {
          locationChanges[existingChangeIndex] = newChange;
        } else {
          locationChanges.push(newChange);
        }
      }
      
      if (locationChanges.length === 0) {
        newMap.delete(locationId);
      } else {
        newMap.set(locationId, locationChanges);
      }
      
      return newMap;
    });
  }, [locations]);

  const handleSaveChanges = useCallback(async () => {
    if (modifiedLocations.size === 0) return;

    setIsSaving(true);
    setErrors({});
    
    try {
      const locationsToSave = Array.from(modifiedLocations.values()).map(location => {
        // Remove owner fields as they shouldn't be updated
        const { ownerId, ownerName, ownerSurname, ...locationData } = location;
        // Remove owner fields as they shouldn't be updated
        void ownerId; void ownerName; void ownerSurname;
        return locationData;
      });

      await saveChanges(locationsToSave);
      
      // Success feedback
      setModifiedLocations(new Map());
      setLocationChanges(new Map());
      await fetchLocations();
      
      showNotification(`${locationsToSave.length} location aggiornate con successo!`, 'success');
      
    } catch (error) {
      console.error("Error saving changes:", error);
      setErrors({ save: 'Errore nel salvare le modifiche. Riprova.' });
      showNotification('Errore nel salvare le modifiche', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [modifiedLocations, fetchLocations, showNotification]);

  const handleDeleteLocation = useCallback(async (locationId: string, locationName: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la location "${locationName}"? Questa azione non può essere annullata.`)) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      await deleteLocation(locationId);
      
      await fetchLocations();
      showNotification(`Location "${locationName}" eliminata con successo!`, 'success');
      
      // Remove from local state
      setModifiedLocations(prev => {
        const newMap = new Map(prev);
        newMap.delete(locationId);
        return newMap;
      });
      
      setLocationChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(locationId);
        return newMap;
      });
      
      setSelectedLocations(prev => {
        const newSet = new Set(prev);
        newSet.delete(locationId);
        return newSet;
      });
      
    } catch (error) {
      console.error("Error deleting location:", error);
      const errorMessage = `Errore nell'eliminazione della location "${locationName}"`;
      setErrors({ delete: errorMessage });
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchLocations, showNotification]);

  // Bulk operations
  const handleBulkToggle = useCallback((field: 'active' | 'verified', value: boolean) => {
    if (selectedLocations.size === 0) return;

    selectedLocations.forEach(locationId => {
      handleLocationChange(locationId, field, value);
    });
  }, [selectedLocations, handleLocationChange]);

  const handleSelectAll = useCallback(() => {
    if (selectedLocations.size === displayLocations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(displayLocations.map(l => l._id)));
    }
  }, [selectedLocations.size, displayLocations]);

  const handleLocationSelection = useCallback((locationId: string) => {
    setSelectedLocations(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(locationId)) {
        newSelection.delete(locationId);
      } else {
        newSelection.add(locationId);
      }
      return newSelection;
    });
  }, []);

  // Enhanced parameter updates
  const updateParams = useCallback((updates: Partial<SearchParams>) => {
    setParams(prev => ({ 
      ...prev, 
      ...updates, 
      page: updates.page !== undefined ? updates.page : 1
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setParams({
      name: '',
      owner: '',
      city: '',
      active: '',
      stripeId: '',
      fee: '',
      special: '',
      verified: '',
      page: 1,
      limit: 10
    });
    setErrors({});
  }, []);

  const handleCancelChanges = useCallback(() => {
    setModifiedLocations(new Map());
    setLocationChanges(new Map());
  }, []);

  // Enhanced notification system (same as users page)
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  }, []);

  // Calculations
  const totalPages = Math.ceil(totalLocations / (params.limit || 10));
  const hasChanges = modifiedLocations.size > 0;
  const hasSelection = selectedLocations.size > 0;
  const allSelected = displayLocations.length > 0 && selectedLocations.size === displayLocations.length;
  const totalChanges = Array.from(locationChanges.values()).reduce((sum, changes) => sum + changes.length, 0);

  return (
    <div className="locations-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestione Location</h1>
          <p className="page-subtitle">
            Visualizza e gestisci le location della piattaforma
            {totalLocations > 0 && ` • ${totalLocations} location totali`}
          </p>
        </div>
        <button 
          className="button button-primary"
          onClick={() => navigate('/location/create')}
          aria-label="Crea nuova location"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
          </svg>
          Nuova Location
        </button>
      </div>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span>
          <div>
            {Object.values(errors).map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="filters-card">
        <div className="filters-header">
          <h2 className="filters-title">Filtri di ricerca</h2>
          <button 
            className="clear-filters-btn"
            onClick={handleClearFilters}
            aria-label="Pulisci filtri"
            disabled={loading}
          >
            Pulisci filtri
          </button>
        </div>
        
        <div className="search-filters">
          <div className="filter-group">
            <label htmlFor="name-filter" className="filter-label">Nome Location</label>
            <input 
              id="name-filter"
              className="filter-input"
              type="text" 
              placeholder="Cerca per nome..." 
              value={params.name || ''} 
              onChange={(e) => updateParams({ name: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="owner-filter" className="filter-label">Proprietario</label>
            <input 
              id="owner-filter"
              className="filter-input"
              type="text" 
              placeholder="Cerca per proprietario..." 
              value={params.owner || ''} 
              onChange={(e) => updateParams({ owner: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="city-filter" className="filter-label">Città</label>
            <input 
              id="city-filter"
              className="filter-input"
              type="text" 
              placeholder="Cerca per città..." 
              value={params.city || ''} 
              onChange={(e) => updateParams({ city: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="status-filter" className="filter-label">Stato</label>
            <select 
              id="status-filter"
              className="filter-select"
              value={params.active || ''} 
              onChange={(e) => updateParams({ active: e.target.value })}
              disabled={loading}
            >
              <option value="">Tutti gli stati</option>
              <option value="true">Attive</option>
              <option value="false">Inattive</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="special-filter" className="filter-label">Tipo</label>
            <select 
              id="special-filter"
              className="filter-select"
              value={params.special || ''} 
              onChange={(e) => updateParams({ special: e.target.value })}
              disabled={loading}
            >
              <option value="">Tutti i tipi</option>
              <option value="true">Speciali</option>
              <option value="false">Standard</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="verified-filter" className="filter-label">Verifica</label>
            <select 
              id="verified-filter"
              className="filter-select"
              value={params.verified || ''} 
              onChange={(e) => updateParams({ verified: e.target.value })}
              disabled={loading}
            >
              <option value="">Tutte</option>
              <option value="true">Verificate</option>
              <option value="false">Non verificate</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Caricamento location...</p>
        </div>
      ) : (
        <>
          <div className="table-card">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <p className="results-count">
                  {totalLocations} location trovate
                  {hasChanges && (
                    <span className="changes-count"> • {totalChanges} modifiche non salvate</span>
                  )}
                </p>
                
                {/* Bulk actions */}
                {hasSelection && (
                  <div className="bulk-actions">
                    <span className="bulk-count">{selectedLocations.size} selezionate</span>
                    <button 
                      className="bulk-btn"
                      onClick={() => handleBulkToggle('active', true)}
                      title="Attiva location selezionate"
                    >
                      Attiva
                    </button>
                    <button 
                      className="bulk-btn"
                      onClick={() => handleBulkToggle('active', false)}
                      title="Disattiva location selezionate"
                    >
                      Disattiva
                    </button>
                    <button 
                      className="bulk-btn"
                      onClick={() => handleBulkToggle('verified', true)}
                      title="Verifica location selezionate"
                    >
                      Verifica
                    </button>
                  </div>
                )}
              </div>
              
              <div className="table-actions">
                <select 
                  className="limit-select"
                  value={params.limit || 10} 
                  onChange={(e) => updateParams({ limit: Number(e.target.value) })}
                  aria-label="Risultati per pagina"
                  disabled={loading}
                >
                  <option value="10">10 per pagina</option>
                  <option value="25">25 per pagina</option>
                  <option value="50">50 per pagina</option>
                  <option value="100">100 per pagina</option>
                </select>
              </div>
            </div>
            
            {displayLocations.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <h3 className="empty-title">Nessuna location trovata</h3>
                <p className="empty-text">
                  {Object.values(params).some(v => v && v !== '' && v !== 1 && v !== 10) 
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Non ci sono ancora location registrate'
                  }
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="locations-table">
                  <thead>
                    <tr>
                      <th className="th-select">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          aria-label="Seleziona tutte le location"
                        />
                      </th>
                      <th className="th-actions">Azioni</th>
                      <th>Nome</th>
                      <th>Proprietario</th>
                      <th>Città</th>
                      <th>Tipo</th>
                      <th>Commissione</th>
                      <th className="th-status">Stato</th>
                      <th className="th-status">Verificata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLocations.map((location) => {
                      const hasChange = modifiedLocations.has(location._id);
                      const isSelected = selectedLocations.has(location._id);
                      const changes = locationChanges.get(location._id) || [];
                      
                      return (
                        <tr 
                          key={location._id} 
                          className={`${hasChange ? 'row-modified' : ''} ${isSelected ? 'row-selected' : ''}`}
                        >
                          <td className="td-select">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleLocationSelection(location._id)}
                              aria-label={`Seleziona ${location.name}`}
                            />
                          </td>
                          <td className="td-actions">
                            <button
                              onClick={() => handleDeleteLocation(location._id, location.name)}
                              className="action-button delete-button"
                              aria-label={`Elimina ${location.name}`}
                              title="Elimina location"
                              disabled={loading}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                              </svg>
                            </button>
                          </td>
                          <td 
                            onClick={() => navigate(`/locations/${location._id}`)} 
                            className="clickable-cell"
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="location-name-cell">
                              <span className="location-name">{location.name}</span>
                              {hasChange && (
                                <div className="change-indicator">
                                  {changes.length} modifica{changes.length > 1 ? 'he' : ''}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {location.special ? (
                              <span className="special-badge">Speciale</span>
                            ) : (
                              `${location.ownerName} ${location.ownerSurname}`
                            )}
                          </td>
                          <td>{location.city}</td>
                          <td>
                            <label className="toggle-switch">
                              <input 
                                type="checkbox" 
                                checked={location.special}
                                onChange={(e) => handleLocationChange(location._id, 'special', e.target.checked)}
                                aria-label={`Tipo speciale per ${location.name}`}
                                disabled={loading}
                              />
                              <span className="toggle-slider"></span>
                              <span className="toggle-label">
                                {location.special ? 'Speciale' : 'Standard'}
                              </span>
                            </label>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={location.fee}
                              onChange={(e) => handleLocationChange(location._id, 'fee', Number(e.target.value))}
                              min="10"
                              max="30"
                              step="1"
                              className="fee-input"
                              aria-label={`Commissione per ${location.name}`}
                              disabled={loading}
                            />
                            <span className="fee-unit">%</span>
                          </td>
                          <td>
                            <label className="status-toggle">
                              <input 
                                type="checkbox" 
                                checked={location.active}
                                onChange={(e) => handleLocationChange(location._id, 'active', e.target.checked)}
                                aria-label={`Stato attivo per ${location.name}`}
                                disabled={loading}
                              />
                              <span className="status-slider"></span>
                              <span className="status-label">
                                {location.active ? 'Attiva' : 'Inattiva'}
                              </span>
                            </label>
                          </td>
                          <td>
                            <label className="status-toggle">
                              <input 
                                type="checkbox" 
                                checked={location.verified}
                                onChange={(e) => handleLocationChange(location._id, 'verified', e.target.checked)}
                                aria-label={`Stato verificato per ${location.name}`}
                                disabled={loading}
                              />
                              <span className="status-slider"></span>
                              <span className="status-label">
                                {location.verified ? 'Verificata' : 'Non verificata'}
                              </span>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Enhanced Changes Panel */}
          {hasChanges && (
            <div className="changes-panel">
              <div className="changes-header">
                <h3 className="changes-title">
                  Modifiche non salvate ({totalChanges})
                </h3>
                <button 
                  className="close-button"
                  onClick={handleCancelChanges}
                  aria-label="Annulla tutte le modifiche"
                  title="Annulla tutte le modifiche"
                >
                  ×
                </button>
              </div>
              
              <div className="changed-locations">
                {Array.from(locationChanges.entries()).map(([locationId, changes]) => (
                  <div key={locationId} className="changed-location-item">
                    <div className="location-name">{changes[0].locationName}</div>
                    <div className="location-changes">
                      {changes.map((change, index) => (
                        <div key={index} className="change-detail">
                          <span className="change-field">{change.field}</span>
                          <span className="change-arrow">→</span>
                          <span className="change-value">
                            {typeof change.newValue === 'boolean' 
                              ? (change.newValue ? 'Sì' : 'No')
                              : String(change.newValue)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="changes-actions">
                <button 
                  className="button button-secondary"
                  onClick={handleCancelChanges}
                  disabled={isSaving}
                >
                  Annulla tutto
                </button>
                <button 
                  className="button button-primary"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="button-spinner"></span>
                      Salvataggio...
                    </>
                  ) : (
                    <>Salva {totalChanges} modifiche</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button"
                disabled={params.page === 1 || loading} 
                onClick={() => updateParams({ page: (params.page || 1) - 1 })}
                aria-label="Pagina precedente"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                </svg>
                Precedente
              </button>
              
              <div className="pagination-info">
                <span className="page-numbers">
                  Pagina {params.page} di {totalPages}
                </span>
                <div className="page-dots">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if ((params.page || 1) <= 3) {
                      pageNum = i + 1;
                    } else if ((params.page || 1) >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = (params.page || 1) - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        className={`page-dot ${pageNum === params.page ? 'active' : ''}`}
                        onClick={() => updateParams({ page: pageNum })}
                        aria-label={`Vai a pagina ${pageNum}`}
                        disabled={loading}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button 
                className="pagination-button"
                disabled={(params.page || 1) >= totalPages || loading} 
                onClick={() => updateParams({ page: (params.page || 1) + 1 })}
                aria-label="Pagina successiva"
              >
                Successiva
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationsPage;