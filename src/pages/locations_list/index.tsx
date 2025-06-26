import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { filteredLocations, saveChanges, deleteLocation } from '../../api/locations/api';
import './locations.css';
import LocationsError from './error';
import { useNavigate } from 'react-router-dom';

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

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [totalLocations, setTotalLocations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [changedLocations, setChangedLocations] = useState<Set<string>>(new Set<string>());
  const [paramsLocations, setParamsLocations] = useState<Location[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState<boolean>(false);

  const [params, setParams] = useState<SearchParams>({
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

  // Memoize the stable query params to prevent unnecessary re-renders
  const queryParams = useMemo(() => ({
    name: params.name,
    owner: params.owner,
    city: params.city,
    active: params.active,
    stripeId: params.stripeId,
    fee: params.fee,
    special: params.special,
    verified: params.verified,
    page: params.page,
    limit: params.limit
  }), [params.name, params.owner, params.city, params.active, params.stripeId, params.fee, params.special, params.verified, params.page, params.limit]);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setChangedLocations(new Set());
    setParamsLocations([]);
    try {
      const data = await filteredLocations(queryParams);
      
      setLocations(data.locations || []);
      setTotalLocations(data.total || 0);
      setError(false);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]);
      setTotalLocations(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (locations && Array.isArray(locations)) {
      setParamsLocations([...locations]);
      setChangedLocations(new Set()); // Reset changes when fresh data loads
    }
  }, [locations]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const locationsToSave = paramsLocations
        .filter(l => changedLocations.has(l._id))
        .map(({ ownerId, ownerName, ownerSurname, ...rest }) => {
          // Remove owner fields as they shouldn't be updated
          void ownerId; void ownerName; void ownerSurname;
          return rest;
        });

      await saveChanges(locationsToSave);
      setChangedLocations(new Set());
      fetchLocations();
      
      // Show success feedback
      const successToast = document.createElement('div');
      successToast.className = 'toast success';
      successToast.textContent = 'Modifiche salvate con successo!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (error) {
      console.error("Error saving changes:", error);
      alert('Errore nel salvare le modifiche. Riprova.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const handleLocationChange = <K extends keyof Location>(locationId: string, key: K, value: Location[K]) => {
    setParamsLocations(prevLocations => 
      prevLocations.map(location => 
        location._id === locationId ? { ...location, [key]: value } : location
      )
    );
    
    // Check if this change should be tracked
    const originalLocation = locations.find(l => l._id === locationId);
    if (originalLocation) {
      const updatedLocation = { ...originalLocation, [key]: value };
      const hasChanges = (
        originalLocation.special !== updatedLocation.special ||
        originalLocation.fee !== updatedLocation.fee ||
        originalLocation.active !== updatedLocation.active
      );
      
      setChangedLocations(prev => {
        const newSet = new Set(prev);
        if (hasChanges) {
          newSet.add(locationId);
        } else {
          newSet.delete(locationId);
        }
        return newSet;
      });
    }
  };

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la location ${locationName}?`)) {
      setLoading(true);
      try {
        await deleteLocation(locationId);
        fetchLocations();
        
        // Show success feedback
        const successToast = document.createElement('div');
        successToast.className = 'toast success';
        successToast.textContent = 'Location eliminata con successo!';
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 3000);
      } catch (error) {
        console.error("Error deleting location:", error);
        alert('Errore nell\'eliminazione della location');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearFilters = () => {
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
  };

  const totalPages = Math.ceil(totalLocations / (params.limit || 10));

  return (
    <div className="locations-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestione Location</h1>
          <p className="page-subtitle">Visualizza e gestisci le location della piattaforma</p>
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
      
      <div className="filters-card">
        <div className="filters-header">
          <h2 className="filters-title">Filtri di ricerca</h2>
          <button 
            className="clear-filters-btn"
            onClick={handleClearFilters}
            aria-label="Pulisci filtri"
          >
            Pulisci filtri
          </button>
        </div>
        <div className="search-filters">
          <div className="filter-group">
            <label htmlFor="name-filter" className="filter-label">Nome location</label>
            <input
              id="name-filter"
              className="filter-input"
              type="text"
              placeholder="Cerca per nome..."
              value={params.name}
              onChange={(e) => setParams({ ...params, name: e.target.value, page: 1 })}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="owner-filter" className="filter-label">Proprietario</label>
            <input
              id="owner-filter"
              className="filter-input"
              type="text"
              placeholder="Nome proprietario..."
              value={params.owner}
              onChange={(e) => setParams({ ...params, owner: e.target.value, page: 1 })}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="city-filter" className="filter-label">Città</label>
            <input
              id="city-filter"
              className="filter-input"
              type="text"
              placeholder="Cerca città..."
              value={params.city}
              onChange={(e) => setParams({ ...params, city: e.target.value, page: 1 })}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="stripe-filter" className="filter-label">Stripe ID</label>
            <input
              id="stripe-filter"
              className="filter-input"
              type="text"
              placeholder="ID Stripe..."
              value={params.stripeId}
              onChange={(e) => setParams({ ...params, stripeId: e.target.value, page: 1 })}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="fee-filter" className="filter-label">Commissione</label>
            <select
              id="fee-filter"
              className="filter-select"
              value={params.fee}
              onChange={(e) => setParams({ ...params, fee: e.target.value, page: 1 })}
            >
              <option value="">Tutte</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
              <option value="25">25%</option>
              <option value="30">30%</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="type-filter" className="filter-label">Tipo</label>
            <select
              id="type-filter"
              className="filter-select"
              value={params.special}
              onChange={(e) => setParams({ ...params, special: e.target.value, page: 1 })}
            >
              <option value="">Tutti i tipi</option>
              <option value="true">Speciali</option>
              <option value="false">Normali</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="active-filter" className="filter-label">Stato</label>
            <select
              id="active-filter"
              className="filter-select"
              value={params.active}
              onChange={(e) => setParams({ ...params, active: e.target.value, page: 1 })}
            >
              <option value="">Tutti</option>
              <option value="true">Attive</option>
              <option value="false">Inattive</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="verified-filter" className="filter-label">Verifica</label>
            <select
              id="verified-filter"
              className="filter-select"
              value={params.verified}
              onChange={(e) => setParams({ ...params, verified: e.target.value, page: 1 })}
            >
              <option value="">Tutte</option>
              <option value="true">Verificate</option>
              <option value="false">Non Verificate</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Caricamento location...</p>
        </div>
      ) : error ? (
        <LocationsError />
      ) : (
        <>
          <div className="table-card">
            <div className="table-header">
              <p className="results-count">
                {totalLocations} location trovate
                {changedLocations.size > 0 && (
                  <span className="changes-count"> • {changedLocations.size} modifiche non salvate</span>
                )}
              </p>
              <div className="table-actions">
                <select 
                  className="limit-select"
                  value={params.limit} 
                  onChange={(e) => setParams({ ...params, limit: Number(e.target.value), page: 1 })}
                  aria-label="Risultati per pagina"
                >
                  <option value="10">10 per pagina</option>
                  <option value="25">25 per pagina</option>
                  <option value="50">50 per pagina</option>
                </select>
              </div>
            </div>
            
            {paramsLocations.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <h3 className="empty-title">Nessuna location trovata</h3>
                <p className="empty-text">Prova a modificare i filtri di ricerca</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="locations-table">
                  <thead>
                    <tr>
                      <th className="th-actions">Azioni</th>
                      <th>Nome</th>
                      <th>Proprietario</th>
                      <th>Città</th>
                      <th>Stripe ID</th>
                      <th className="th-checkbox">Speciale</th>
                      <th className="th-fee">Commissione</th>
                      <th className="th-checkbox">Attiva</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paramsLocations.map((location) => (
                      <tr key={location._id} className={changedLocations.has(location._id) ? 'row-modified' : ''}>
                        <td className="td-actions">
                          <button
                            onClick={() => handleDeleteLocation(location._id, location.name)}
                            className="action-button delete-button"
                            aria-label={`Elimina ${location.name}`}
                            title="Elimina location"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                          </button>
                        </td>
                        <td 
                          className="clickable-cell location-name"
                          onClick={() => navigate(`/locations/${location._id}`)}
                        >
                          <div className="location-name-wrapper">
                            <svg className="location-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                            </svg>
                            {location.name}
                          </div>
                        </td>
                        <td 
                          className="clickable-cell owner-name"
                          onClick={() => navigate(`/users/${location.ownerId}`)}
                        >
                          {location.ownerName} {location.ownerSurname}
                        </td>
                        <td>{location.city}</td>
                        <td className="stripe-id">{location.stripeId || '-'}</td>
                        <td className="td-checkbox">
                          <label className="checkbox-wrapper">
                            <input 
                              type="checkbox" 
                              checked={location.special}
                              onChange={(e) => handleLocationChange(location._id, 'special', e.target.checked)}
                              aria-label={`Location speciale per ${location.name}`}
                            />
                            <span className="checkbox-custom"></span>
                          </label>
                        </td>
                        <td className="td-fee">
                          <div className="fee-input-wrapper">
                            <input
                              type="number"
                              min="10"
                              max="30"
                              value={location.fee}
                              step="5"
                              className="fee-input"
                              onChange={(e) => handleLocationChange(location._id, 'fee', parseInt(e.target.value) || 10)}
                              aria-label={`Commissione per ${location.name}`}
                            />
                            <span className="fee-suffix">%</span>
                          </div>
                        </td>
                        <td className="td-checkbox">
                          <label className="status-toggle">
                            <input 
                              type="checkbox" 
                              checked={location.active}
                              onChange={(e) => handleLocationChange(location._id, 'active', e.target.checked)}
                              aria-label={`Stato attivo per ${location.name}`}
                            />
                            <span className="status-slider"></span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {changedLocations.size > 0 && (
            <div className="changes-panel">
              <div className="changes-header">
                <h3 className="changes-title">Modifiche non salvate</h3>
                <button 
                  className="close-button"
                  onClick={() => {
                    setChangedLocations(new Set());
                    setParamsLocations([...locations]);
                  }}
                  aria-label="Annulla modifiche"
                >
                  ×
                </button>
              </div>
              <div className="changed-locations">
                {Array.from(changedLocations).map(locationId => {
                  const location = paramsLocations.find(l => l._id === locationId);
                  const original = locations.find(l => l._id === locationId);
                  return (
                    <div key={locationId} className="changed-location-item">
                      <span className="changed-location-name">{location?.name}</span>
                      <div className="changed-details">
                        {original && location && (
                          <>
                            {original.special !== location.special && (
                              <span className="change-badge">
                                Speciale: {location.special ? 'Sì' : 'No'}
                              </span>
                            )}
                            {original.fee !== location.fee && (
                              <span className="change-badge">
                                Commissione: {location.fee}%
                              </span>
                            )}
                            {original.active !== location.active && (
                              <span className="change-badge">
                                {location.active ? 'Attiva' : 'Inattiva'}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="changes-actions">
                <button 
                  className="button button-secondary"
                  onClick={() => {
                    setChangedLocations(new Set());
                    setParamsLocations([...locations]);
                  }}
                >
                  Annulla
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
                    'Salva modifiche'
                  )}
                </button>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                disabled={params.page === 1}
                onClick={() => handlePageChange((params.page || 1) - 1)}
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
                    } else if (params.page! <= 3) {
                      pageNum = i + 1;
                    } else if (params.page! >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = params.page! - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        className={`page-dot ${pageNum === params.page ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                        aria-label={`Vai a pagina ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button
                className="pagination-button"
                disabled={(params.page || 1) >= totalPages}
                onClick={() => handlePageChange((params.page || 1) + 1)}
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