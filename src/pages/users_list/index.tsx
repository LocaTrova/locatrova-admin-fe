import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getUsersWithFilters, saveChanges, deleteUser } from '../../api/users/api';
import { User } from '../../api/common/types';
import './users.css';
import { useNavigate } from 'react-router-dom';

interface SearchParams {
  username?: string;
  email?: string;
  phone?: string;
  active?: string;
  page?: number;
  limit?: number;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userChanges, setUserChanges] = useState<Set<string>>(new Set<string>());
  const [usersActive, setUsersActive] = useState<Map<string, boolean>>(new Map<string,boolean>());
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const [params, setParams] = useState<SearchParams>({
    username: '',
    email: '',
    phone: '',
    active: '',
    page: 1,
    limit: 10
  });

  // Memoize the stable query params to prevent unnecessary re-renders
  const queryParams = useMemo(() => ({
    username: params.username,
    email: params.email,
    phone: params.phone,
    active: params.active,
    page: params.page,
    limit: params.limit
  }), [params.username, params.email, params.phone, params.active, params.page, params.limit]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsersWithFilters(queryParams);

      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setTotalUsers(0);
      alert('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const updatedUsersActive = new Map<string, boolean>();
    if(users.length !== 0){
      for(const user of users){ 
        updatedUsersActive.set(user._id, user.active);
      }
    }
    setUsersActive(updatedUsersActive);
  }, [users]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try{
      await saveChanges(userChanges);
      setUserChanges(new Set<string>);
      fetchUsers();
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

  const handleUserActiveToggle = (userId: string) => {
    const updatedUsersActive = new Map(usersActive);
    const updatedUserChanges = new Set(userChanges);
    updatedUsersActive.set(userId, !updatedUsersActive.get(userId));
    if(updatedUserChanges.has(userId)){
      updatedUserChanges.delete(userId);
    }
    else{
      updatedUserChanges.add(userId);
    }
    setUserChanges(updatedUserChanges);
    setUsersActive(updatedUsersActive);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'utente ${userName}?`)) {
      setLoading(true);
      try {
        const response = await deleteUser(userId);
        if (response.success) {
          fetchUsers();
          // Show success feedback
          const successToast = document.createElement('div');
          successToast.className = 'toast success';
          successToast.textContent = 'Utente eliminato con successo!';
          document.body.appendChild(successToast);
          setTimeout(() => successToast.remove(), 3000);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('Errore nell\'eliminazione dell\'utente');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearFilters = () => {
    setParams({
      username: '',
      email: '',
      phone: '',
      active: '',
      page: 1,
      limit: 10
    });
  };

  const totalPages = Math.ceil(totalUsers / (params.limit || 10));

  return (
    <div className="users-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestione Utenti</h1>
          <p className="page-subtitle">Visualizza e gestisci gli utenti della piattaforma</p>
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
            <label htmlFor="username-filter" className="filter-label">Nome utente</label>
            <input 
              id="username-filter"
              className="filter-input"
              type="text" 
              placeholder="Cerca per nome..." 
              value={params.username} 
              onChange={(e) => setParams({ ...params, username: e.target.value, page: 1 })} 
            />
          </div>
          <div className="filter-group">
            <label htmlFor="email-filter" className="filter-label">Email</label>
            <input 
              id="email-filter"
              className="filter-input"
              type="text" 
              placeholder="Cerca per email..." 
              value={params.email} 
              onChange={(e) => setParams({ ...params, email: e.target.value, page: 1 })} 
            />
          </div>
          <div className="filter-group">
            <label htmlFor="phone-filter" className="filter-label">Telefono</label>
            <input 
              id="phone-filter"
              className="filter-input"
              type="text" 
              placeholder="Cerca per telefono..." 
              value={params.phone} 
              onChange={(e) => setParams({ ...params, phone: e.target.value, page: 1 })} 
            />
          </div>
          <div className="filter-group">
            <label htmlFor="status-filter" className="filter-label">Stato</label>
            <select 
              id="status-filter"
              className="filter-select"
              value={params.active} 
              onChange={(e) => setParams({ ...params, active: e.target.value, page: 1 })}
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
              <p className="results-count">
                {totalUsers} utenti trovati
                {userChanges.size > 0 && (
                  <span className="changes-count"> • {userChanges.size} modifiche non salvate</span>
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
            
            {users.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h3 className="empty-title">Nessun utente trovato</h3>
                <p className="empty-text">Prova a modificare i filtri di ricerca</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th className="th-actions">Azioni</th>
                      <th>Nome e Cognome</th>
                      <th>Email</th>
                      <th>Telefono</th>
                      <th className="th-status">Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className={userChanges.has(user._id) ? 'row-modified' : ''}>
                        <td className="td-actions">
                          <button
                            onClick={() => handleDeleteUser(user._id, `${user.name} ${user.surname}`)}
                            className="action-button delete-button"
                            aria-label={`Elimina ${user.name} ${user.surname}`}
                            title="Elimina utente"
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
                        >
                          <div className="user-name-cell">
                            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                            <span className="user-name">{user.name} {user.surname}</span>
                          </div>
                        </td>
                        <td className="email-cell">{user.email}</td>
                        <td>{user.phone || '-'}</td>
                        <td>
                          <label className="status-toggle">
                            <input 
                              type="checkbox" 
                              checked={usersActive.get(user._id)}
                              onChange={() => handleUserActiveToggle(user._id)}
                              aria-label={`Stato attivo per ${user.name} ${user.surname}`}
                            />
                            <span className="status-slider"></span>
                            <span className="status-label">
                              {usersActive.get(user._id) ? 'Attivo' : 'Inattivo'}
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {userChanges.size > 0 && (
            <div className="changes-panel">
              <div className="changes-header">
                <h3 className="changes-title">Modifiche non salvate</h3>
                <button 
                  className="close-button"
                  onClick={() => setUserChanges(new Set())}
                  aria-label="Annulla modifiche"
                >
                  ×
                </button>
              </div>
              <div className="changed-users">
                {Array.from(userChanges).map((userId) => {
                  const user = users.find(u => u._id === userId);
                  return (
                    <div key={userId} className="changed-user-item">
                      <span className="changed-user-name">
                        {user?.name} {user?.surname}
                      </span>
                      <span className="changed-user-status">
                        → {usersActive.get(userId) ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="changes-actions">
                <button 
                  className="button button-secondary"
                  onClick={() => {
                    setUserChanges(new Set());
                    fetchUsers();
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

export default UsersPage;