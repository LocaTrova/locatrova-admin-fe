import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getUsersWithFilters, saveChanges, deleteUser } from '../../api/users/api';
import { User } from '../../api/common/types';
import './users.css';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SearchParams {
  username?: string;
  email?: string;
  phone?: string;
  active?: string;
  page?: number;
  limit?: number;
}

interface UserChange {
  userId: string;
  field: 'active';
  oldValue: boolean;
  newValue: boolean;
  userName: string;
}

// Enhanced error handling for user operations
class UserOperationError extends Error {
  constructor(message: string, public operation: string, public userId?: string) {
    super(message);
    this.name = 'UserOperationError';
  }
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userChanges, setUserChanges] = useState<Map<string, UserChange>>(new Map());
  const [usersActive, setUsersActive] = useState<Map<string, boolean>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize params from URL search params
  const [params, setParams] = useState<SearchParams>(() => ({
    username: searchParams.get('username') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    active: searchParams.get('active') || '',
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

  const fetchUsers = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setErrors({});
    
    try {
      const data = await getUsersWithFilters({
        username: params.username || undefined,
        email: params.email || undefined,
        phone: params.phone || undefined,
        active: params.active || undefined,
        page: params.page,
        limit: params.limit
      });

      if (abortControllerRef.current.signal.aborted) return;

      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      
    } catch (error) {
      if (abortControllerRef.current.signal.aborted) return;
      
      console.error("Error fetching users:", error);
      setErrors({ fetch: 'Errore nel caricamento degli utenti. Riprova.' });
      setUsers([]);
      setTotalUsers(0);
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [params]);

  // Enhanced debounced search
  const debouncedFetchUsers = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers();
    }, isInitialLoad ? 0 : 500); // No delay on initial load
  }, [isInitialLoad, fetchUsers]);

  useEffect(() => {
    debouncedFetchUsers();
  }, [debouncedFetchUsers]);

  // Update local active state when users change
  useEffect(() => {
    const updatedUsersActive = new Map<string, boolean>();
    if (users && Array.isArray(users)) {
      users.forEach(user => {
        updatedUsersActive.set(user._id, user.active);
      });
    }
    setUsersActive(updatedUsersActive);
    setIsInitialLoad(false);
  }, [users]);

  // Enhanced notification system (moved before usage)
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

  const handleSaveChanges = useCallback(async () => {
    if (userChanges.size === 0) return;

    setIsSaving(true);
    setErrors({});
    
    try {
      // Convert changes to API format
      const userIds = new Set(Array.from(userChanges.values()).map(change => change.userId));

      await saveChanges(userIds);
      
      // Success feedback
      setUserChanges(new Map());
      await fetchUsers();
      
      // Show success notification
      showNotification('Modifiche salvate con successo!', 'success');
      
    } catch (error) {
      console.error("Error saving changes:", error);
      setErrors({ save: 'Errore nel salvare le modifiche. Riprova.' });
      showNotification('Errore nel salvare le modifiche', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [userChanges, fetchUsers, showNotification]);

  const handleUserActiveToggle = useCallback((userId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const currentActive = usersActive.get(userId) ?? user.active;
    const newActive = !currentActive;
    
    // Update local state
    setUsersActive(prev => new Map(prev.set(userId, newActive)));
    
    // Track change
    setUserChanges(prev => {
      const newChanges = new Map(prev);
      
      if (newActive === user.active) {
        // Back to original state - remove change
        newChanges.delete(userId);
      } else {
        // New change
        newChanges.set(userId, {
          userId,
          field: 'active',
          oldValue: user.active,
          newValue: newActive,
          userName: `${user.name} ${user.surname}`
        });
      }
      
      return newChanges;
    });
  }, [users, usersActive]);

  const handleDeleteUser = useCallback(async (userId: string, userName: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'utente "${userName}"? Questa azione non può essere annullata.`)) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await deleteUser(userId);
      
      if (response.success) {
        await fetchUsers();
        showNotification(`Utente "${userName}" eliminato con successo!`, 'success');
        
        // Remove from changes if it was there
        setUserChanges(prev => {
          const newChanges = new Map(prev);
          newChanges.delete(userId);
          return newChanges;
        });
        
        // Remove from selection
        setSelectedUsers(prev => {
          const newSelection = new Set(prev);
          newSelection.delete(userId);
          return newSelection;
        });
      } else {
        throw new UserOperationError('Risposta non valida dal server', 'delete', userId);
      }
      
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = error instanceof UserOperationError 
        ? error.message 
        : `Errore nell'eliminazione dell'utente "${userName}"`;
      setErrors({ delete: errorMessage });
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, showNotification]);

  // Bulk operations
  const handleBulkToggle = useCallback((active: boolean) => {
    if (selectedUsers.size === 0) return;

    selectedUsers.forEach(userId => {
      const user = users.find(u => u._id === userId);
      if (!user) return;

      // Update local state
      setUsersActive(prev => new Map(prev.set(userId, active)));
      
      // Track change
      setUserChanges(prev => {
        const newChanges = new Map(prev);
        
        if (active === user.active) {
          newChanges.delete(userId);
        } else {
          newChanges.set(userId, {
            userId,
            field: 'active',
            oldValue: user.active,
            newValue: active,
            userName: `${user.name} ${user.surname}`
          });
        }
        
        return newChanges;
      });
    });
  }, [selectedUsers, users]);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u._id)));
    }
  }, [selectedUsers.size, users]);

  const handleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(userId)) {
        newSelection.delete(userId);
      } else {
        newSelection.add(userId);
      }
      return newSelection;
    });
  }, []);

  // Enhanced parameter updates with validation
  const updateParams = useCallback((updates: Partial<SearchParams>) => {
    setParams(prev => ({ 
      ...prev, 
      ...updates, 
      page: updates.page !== undefined ? updates.page : 1 // Reset page when filtering
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setParams({
      username: '',
      email: '',
      phone: '',
      active: '',
      page: 1,
      limit: 10
    });
    setErrors({});
  }, []);

  const handleCancelChanges = useCallback(() => {
    setUserChanges(new Map());
    // Reset local state to original
    const resetUsersActive = new Map<string, boolean>();
    if (users && Array.isArray(users)) {
      users.forEach(user => {
        resetUsersActive.set(user._id, user.active);
      });
    }
    setUsersActive(resetUsersActive);
  }, [users]);


  // Calculations
  const totalPages = Math.ceil(totalUsers / (params.limit || 10));
  const hasChanges = userChanges.size > 0;
  const hasSelection = selectedUsers.size > 0;
  const allSelected = users.length > 0 && selectedUsers.size === users.length;

  return (
    <div className="users-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestione Utenti</h1>
          <p className="page-subtitle">
            Visualizza e gestisci gli utenti della piattaforma
            {totalUsers > 0 && ` • ${totalUsers} utenti totali`}
          </p>
        </div>
        <button 
          className="button button-primary"
          onClick={() => navigate('/user/create')}
          aria-label="Crea nuovo utente"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
          </svg>
          Nuovo Utente
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="clear-filters-btn"
              onClick={handleClearFilters}
              aria-label="Pulisci filtri"
              disabled={loading}
            >
              Pulisci filtri
            </button>
          </div>
        </div>
        
        <div className="search-filters">
          <div className="filter-group">
            <label htmlFor="username-filter" className="filter-label">Nome/Cognome</label>
            <input 
              id="username-filter"
              className="filter-input"
              type="text" 
              placeholder="Cerca per nome o cognome..." 
              value={params.username || ''} 
              onChange={(e) => updateParams({ username: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="email-filter" className="filter-label">Email</label>
            <input 
              id="email-filter"
              className="filter-input"
              type="email" 
              placeholder="Cerca per email..." 
              value={params.email || ''} 
              onChange={(e) => updateParams({ email: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="phone-filter" className="filter-label">Telefono</label>
            <input 
              id="phone-filter"
              className="filter-input"
              type="tel" 
              placeholder="Cerca per telefono..." 
              value={params.phone || ''} 
              onChange={(e) => updateParams({ phone: e.target.value })}
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
              <option value="true">Attivi</option>
              <option value="false">Inattivi</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Caricamento utenti...</p>
        </div>
      ) : (
        <>
          <div className="table-card">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <p className="results-count">
                  {totalUsers} utenti trovati
                  {hasChanges && (
                    <span className="changes-count"> • {userChanges.size} modifiche non salvate</span>
                  )}
                </p>
                
                {/* Bulk actions */}
                {hasSelection && (
                  <div className="bulk-actions">
                    <span className="bulk-count">{selectedUsers.size} selezionati</span>
                    <button 
                      className="bulk-btn"
                      onClick={() => handleBulkToggle(true)}
                      title="Attiva utenti selezionati"
                    >
                      Attiva
                    </button>
                    <button 
                      className="bulk-btn"
                      onClick={() => handleBulkToggle(false)}
                      title="Disattiva utenti selezionati"
                    >
                      Disattiva
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
            
            {users.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h3 className="empty-title">Nessun utente trovato</h3>
                <p className="empty-text">
                  {Object.values(params).some(v => v && v !== '' && v !== 1 && v !== 10) 
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Non ci sono ancora utenti registrati'
                  }
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th className="th-select">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          aria-label="Seleziona tutti gli utenti"
                        />
                      </th>
                      <th className="th-actions">Azioni</th>
                      <th>Nome e Cognome</th>
                      <th>Email</th>
                      <th>Telefono</th>
                      <th className="th-status">Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const hasChange = userChanges.has(user._id);
                      const isSelected = selectedUsers.has(user._id);
                      
                      return (
                        <tr 
                          key={user._id} 
                          className={`${hasChange ? 'row-modified' : ''} ${isSelected ? 'row-selected' : ''}`}
                        >
                          <td className="td-select">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleUserSelection(user._id)}
                              aria-label={`Seleziona ${user.name} ${user.surname}`}
                            />
                          </td>
                          <td className="td-actions">
                            <button
                              onClick={() => handleDeleteUser(user._id, `${user.name} ${user.surname}`)}
                              className="action-button delete-button"
                              aria-label={`Elimina ${user.name} ${user.surname}`}
                              title="Elimina utente"
                              disabled={loading}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                              </svg>
                            </button>
                          </td>
                          <td 
                            onClick={() => navigate(`/users/${user._id}`)} 
                            className="clickable-cell"
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="user-name-cell">
                              <span className="user-avatar">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <span className="user-name">{user.name} {user.surname}</span>
                                {hasChange && (
                                  <div className="change-indicator">Modificato</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="email-cell">
                            <a href={`mailto:${user.email}`} className="email-link">
                              {user.email}
                            </a>
                          </td>
                          <td>
                            {user.phone ? (
                              <a href={`tel:${user.phone}`} className="phone-link">
                                {user.phone}
                              </a>
                            ) : (
                              <span className="no-data">-</span>
                            )}
                          </td>
                          <td>
                            <label className="status-toggle">
                              <input 
                                type="checkbox" 
                                checked={usersActive.get(user._id) ?? user.active}
                                onChange={() => handleUserActiveToggle(user._id)}
                                aria-label={`Stato attivo per ${user.name} ${user.surname}`}
                                disabled={loading}
                              />
                              <span className="status-slider"></span>
                              <span className="status-label">
                                {usersActive.get(user._id) ?? user.active ? 'Attivo' : 'Inattivo'}
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
                  Modifiche non salvate ({userChanges.size})
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
              
              <div className="changed-users">
                {Array.from(userChanges.values()).map((change) => (
                  <div key={change.userId} className="changed-user-item">
                    <span className="changed-user-name">{change.userName}</span>
                    <span className="change-arrow">→</span>
                    <span className={`changed-user-status ${change.newValue ? 'active' : 'inactive'}`}>
                      {change.newValue ? 'Attivo' : 'Inattivo'}
                    </span>
                    <button
                      className="undo-change-btn"
                      onClick={() => handleUserActiveToggle(change.userId)}
                      title="Annulla questa modifica"
                      aria-label={`Annulla modifica per ${change.userName}`}
                    >
                      ↶
                    </button>
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
                    <>Salva {userChanges.size} modifiche</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Pagination */}
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

export default UsersPage;