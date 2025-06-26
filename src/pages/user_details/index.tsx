import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getUserDetails, updateUser } from '../../api/users/api';
import './user_details.css';

interface UserData {
  _id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
  lastLogin?: string;
  [key: string]: unknown;
}

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [initialData, setInitialData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) {
        navigate('/users');
        return;
      }

      try {
        const userDetails = await getUserDetails(userId);
        if (!userDetails) {
          navigate('/users');
          return;
        }
        
        setInitialData(userDetails);
        setFormData(userDetails);
      } catch (error) {
        console.error('Error fetching user details:', error);
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, navigate]);

  // Optimized change detection using useMemo
  const hasChanges = useMemo(() => {
    if (!initialData || !formData) return false;
    
    // Compare only the fields that can be changed
    const fieldsToCompare = ['name', 'surname', 'email', 'phone', 'active', 'verified'];
    return fieldsToCompare.some(field => initialData[field] !== formData[field]);
  }, [initialData, formData]);


  const handleChange = (field: string, value: unknown) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData || !hasChanges) return;

    setSaving(true);
    try {
      await updateUser({ ...formData, userId });
      setInitialData(formData);
      
      // Show success feedback
      const successToast = document.createElement('div');
      successToast.className = 'toast success';
      successToast.textContent = 'Utente aggiornato con successo!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Show error feedback
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error';
      errorToast.textContent = 'Errore durante l\'aggiornamento';
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Caricamento dettagli utente...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="error-container">
        <svg className="error-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 className="error-title">Utente non trovato</h2>
        <Link to="/users" className="button button-primary">
          Torna agli utenti
        </Link>
      </div>
    );
  }

  return (
    <div className="user-detail-container">
      <div className="page-header">
        <div>
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/users">Utenti</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{formData.name} {formData.surname}</span>
          </nav>
          <h1 className="page-title">Dettagli Utente</h1>
          <p className="page-subtitle">ID: {userId}</p>
        </div>
        <div className="header-actions">
          <button 
            className="button button-secondary"
            onClick={() => navigate('/users')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
            Indietro
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="user-form">
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar">
              {getInitials(formData.name, formData.surname)}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{formData.name} {formData.surname}</h2>
              <p className="profile-email">{formData.email}</p>
              <div className="profile-badges">
                <span className={`badge ${formData.active ? 'badge-success' : 'badge-error'}`}>
                  {formData.active ? 'Attivo' : 'Inattivo'}
                </span>
                {formData.verified && (
                  <span className="badge badge-info">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path fillRule="evenodd" d="M7 0a7 7 0 110 14A7 7 0 017 0zM10.28 5.28a.75.75 0 00-1.06-1.06L6.25 7.19 4.78 5.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z"/>
                    </svg>
                    Verificato
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-grid">
          {/* Personal Information Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
              </svg>
              Informazioni Personali
            </h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nome</label>
                <input 
                  id="name"
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nome"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="surname">Cognome</label>
                <input 
                  id="surname"
                  type="text" 
                  value={formData.surname} 
                  onChange={(e) => handleChange('surname', e.target.value)}
                  placeholder="Cognome"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                value={formData.email} 
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@esempio.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefono</label>
              <input 
                id="phone"
                type="tel" 
                value={formData.phone || ''} 
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>

          {/* Account Status Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"/>
              </svg>
              Stato Account
            </h2>

            <div className="status-section">
              <div className="status-item">
                <div className="status-info">
                  <label htmlFor="active-toggle">Stato Attivo</label>
                  <span className="status-description">L'utente può accedere al sistema</span>
                </div>
                <label className="status-toggle">
                  <input 
                    id="active-toggle"
                    type="checkbox" 
                    checked={formData.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                  />
                  <span className="status-slider"></span>
                </label>
              </div>

              <div className="status-item">
                <div className="status-info">
                  <label htmlFor="verified-toggle">Email Verificata</label>
                  <span className="status-description">L'email dell'utente è stata confermata</span>
                </div>
                <label className="status-toggle">
                  <input 
                    id="verified-toggle"
                    type="checkbox" 
                    checked={formData.verified || false}
                    onChange={(e) => handleChange('verified', e.target.checked)}
                  />
                  <span className="status-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* System Information Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
              </svg>
              Informazioni Sistema
            </h2>

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">ID Utente</span>
                <span className="info-value">{formData._id}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Data Creazione</span>
                <span className="info-value">{formatDate(formData.createdAt)}</span>
              </div>

              {formData.lastLogin && (
                <div className="info-item">
                  <span className="info-label">Ultimo Accesso</span>
                  <span className="info-value">{formatDate(formData.lastLogin)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="form-actions-sticky">
            <div className="changes-indicator">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              Hai modifiche non salvate
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="button button-secondary"
                onClick={handleReset}
              >
                Annulla modifiche
              </button>
              <button 
                type="submit" 
                className="button button-primary"
                disabled={saving}
              >
                {saving ? (
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
      </form>
    </div>
  );
};

export default UserDetail;