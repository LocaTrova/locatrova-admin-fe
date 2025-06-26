import React, { useState } from 'react';
import { createUser } from '../../api/users/api';
import { Link, useNavigate } from 'react-router-dom';
import './user_create.css';

interface UserFormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  phone: string;
  active: boolean;
}

const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    surname: '',
    email: '',
    password: '',
    phone: '',
    active: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }
    
    if (!formData.surname.trim()) {
      newErrors.surname = 'Il cognome è obbligatorio';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    if (!formData.password) {
      newErrors.password = 'La password è obbligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La password deve essere di almeno 6 caratteri';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Il telefono è obbligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser(formData);
      
      // Show success feedback
      const successToast = document.createElement('div');
      successToast.className = 'toast success';
      successToast.textContent = 'Utente creato con successo!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
      
      // Navigate to users list
      setTimeout(() => navigate('/users'), 1500);
    } catch (error) {
      console.error('Failed to create user:', error);
      
      // Show error feedback
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error';
      errorToast.textContent = 'Errore nella creazione dell\'utente';
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-create-container">
      <div className="page-header">
        <div>
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/users">Utenti</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Nuovo utente</span>
          </nav>
          <h1 className="page-title">Crea Nuovo Utente</h1>
          <p className="page-subtitle">Aggiungi un nuovo utente al sistema</p>
        </div>
        <div className="header-actions">
          <button 
            className="button button-secondary"
            onClick={() => navigate('/users')}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
            Annulla
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="user-form">
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
                <label htmlFor="name">Nome *</label>
                <input 
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Mario"
                  className={errors.name ? 'error' : ''}
                  required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="surname">Cognome *</label>
                <input 
                  id="surname"
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleChange('surname', e.target.value)}
                  placeholder="Rossi"
                  className={errors.surname ? 'error' : ''}
                  required
                />
                {errors.surname && <span className="error-message">{errors.surname}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input 
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="mario.rossi@esempio.com"
                className={errors.email ? 'error' : ''}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefono *</label>
              <input 
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+39 123 456 7890"
                className={errors.phone ? 'error' : ''}
                required
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          {/* Security Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
              </svg>
              Sicurezza
            </h2>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div className="password-input-wrapper">
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Inserisci una password sicura"
                  className={errors.password ? 'error' : ''}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"/>
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
              <p className="field-hint">Minimo 6 caratteri</p>
            </div>

            <div className="form-group">
              <label>Stato Account</label>
              <div className="status-item">
                <div className="status-info">
                  <span className="status-label">Utente Attivo</span>
                  <span className="status-description">L'utente potrà accedere immediatamente al sistema</span>
                </div>
                <label className="status-toggle">
                  <input 
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                  />
                  <span className="status-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button"
            className="button button-secondary"
            onClick={() => navigate('/users')}
          >
            Annulla
          </button>
          <button 
            type="submit"
            className="button button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                Creazione in corso...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Crea Utente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreatePage;