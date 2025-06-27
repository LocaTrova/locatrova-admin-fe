import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, checkAuth } from '../../api/auth/api.ts';
import './login.css';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const verifyAuthentication = async () => {
      try {
        const data = await checkAuth();
        if (data.isAuthenticated) {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthentication();
  }, [navigate]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      await login(formData.email.trim(), formData.password);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Login Error: ', error);
      setError('Email o password errati');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.email, formData.password, navigate]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="loading-spinner" role="status" aria-label="Verifica autenticazione">
          <span className="spinner"></span>
          <span className="sr-only">Caricamento...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">LocaTrova Admin</h1>
          <p className="login-subtitle">Accedi al portale di amministrazione</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="nome@esempio.com"
              aria-label="Indirizzo email"
              aria-describedby={error ? "login-error" : undefined}
              disabled={isSubmitting}
              required
              autoComplete="email"
              autoFocus
            />  
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input password-input"
                placeholder="Inserisci password"
                aria-label="Password"
                aria-describedby={error ? "login-error" : undefined}
                disabled={isSubmitting}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="error-message" id="login-error" role="alert" aria-live="polite">
              <svg className="error-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting || !formData.email.trim() || !formData.password}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                <span>Accesso in corso...</span>
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;