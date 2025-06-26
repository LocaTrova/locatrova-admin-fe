import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getReservation, updateReservation } from '../../api/reservations/api';
import './reservation_details.css';

interface TimeSlot {
  start: string;
  end: string;
}

interface ReservationData {
  _id: string;
  locationId: string;
  locationName?: string;
  userName?: string;
  roomId: number;
  userId: string;
  timeSlot: TimeSlot;
  startDate: string;
  endDate: string;
  capacity: number;
  amount: number;
  payment: 'SUCCESS' | 'REFUNDED';
  stripeId: string;
  createdAt?: string;
  [key: string]: unknown;
}

const ReservationDetail: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [initialData, setInitialData] = useState<ReservationData | null>(null);
  const [formData, setFormData] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!reservationId) {
        navigate('/reservations');
        return;
      }

      try {
        const reservationDetails = await getReservation(reservationId);
        if (!reservationDetails) {
          navigate('/reservations');
          return;
        }
        setInitialData(reservationDetails as ReservationData);
        setFormData(reservationDetails as ReservationData);
      } catch (error) {
        console.error('Error fetching reservation details:', error);
        navigate('/reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchReservationDetails();
  }, [reservationId, navigate]);

  // Optimized change detection using useMemo
  const hasChanges = useMemo(() => {
    if (!initialData || !formData) return false;
    
    // Compare only the fields that can be changed in reservation details
    const fieldsToCompare = ['payment', 'capacity', 'amount'];
    return fieldsToCompare.some(field => initialData[field] !== formData[field]);
  }, [initialData, formData]);

  const handleChange = (field: string, value: unknown) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleTimeSlotChange = (field: 'start' | 'end', value: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      timeSlot: {
        ...formData.timeSlot,
        [field]: value
      }
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData || !hasChanges) return;

    setSaving(true);
    try {
      await updateReservation({ reservationId: reservationId!, ...formData });
      setInitialData(formData);
      
      // Show success feedback
      const successToast = document.createElement('div');
      successToast.className = 'toast success';
      successToast.textContent = 'Prenotazione aggiornata con successo!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (error) {
      console.error('Error updating reservation:', error);
      
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Caricamento dettagli prenotazione...</p>
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
        <h2 className="error-title">Prenotazione non trovata</h2>
        <Link to="/reservations" className="button button-primary">
          Torna alle prenotazioni
        </Link>
      </div>
    );
  }

  return (
    <div className="reservation-detail-container">
      <div className="page-header">
        <div>
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/reservations">Prenotazioni</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{reservationId}</span>
          </nav>
          <h1 className="page-title">Dettagli Prenotazione</h1>
          <p className="page-subtitle">ID: {reservationId}</p>
        </div>
        <div className="header-actions">
          <button 
            className="button button-secondary"
            onClick={() => navigate('/reservations')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
            Indietro
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-grid">
          {/* Basic Information Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H4v10h12V5h-2a1 1 0 100-2 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
              </svg>
              Informazioni Base
            </h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>ID Prenotazione</label>
                <input 
                  type="text" 
                  value={formData._id} 
                  disabled 
                  className="input-disabled"
                />
              </div>
              
              <div className="form-group">
                <label>Data Creazione</label>
                <input 
                  type="text" 
                  value={formatDate(formData.createdAt || '')} 
                  disabled 
                  className="input-disabled"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="stripe-id">Stripe ID</label>
                <input 
                  id="stripe-id"
                  type="text" 
                  value={formData.stripeId || ''} 
                  onChange={(e) => handleChange('stripeId', e.target.value)}
                  placeholder="ID transazione Stripe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment-status">Stato Pagamento</label>
                <select
                  id="payment-status"
                  value={formData.payment}
                  onChange={(e) => handleChange('payment', e.target.value)}
                  className={`payment-select ${formData.payment === 'SUCCESS' ? 'success' : 'refunded'}`}
                >
                  <option value="SUCCESS">Completato</option>
                  <option value="REFUNDED">Rimborsato</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location and User Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              Location e Utente
            </h2>

            <div className="info-section">
              <div className="info-item">
                <span className="info-label">Location</span>
                <Link to={`/locations/${formData.locationId}`} className="info-link">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                  </svg>
                  {formData.locationName || formData.locationId}
                </Link>
              </div>

              <div className="info-item">
                <span className="info-label">Utente</span>
                <Link to={`/users/${formData.userId}`} className="info-link">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z"/>
                  </svg>
                  {formData.userName || formData.userId}
                </Link>
              </div>

              <div className="info-item">
                <span className="info-label">ID Stanza</span>
                <span className="info-value">{formData.roomId}</span>
              </div>
            </div>
          </div>

          {/* Date and Time Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z"/>
              </svg>
              Date e Orari
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-date">Data Inizio</label>
                <input 
                  id="start-date"
                  type="date" 
                  value={formData.startDate} 
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="end-date">Data Fine</label>
                <input 
                  id="end-date"
                  type="date" 
                  value={formData.endDate} 
                  onChange={(e) => handleChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="time-start">Orario Inizio</label>
                <input 
                  id="time-start"
                  type="time" 
                  value={formData.timeSlot.start} 
                  onChange={(e) => handleTimeSlotChange('start', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="time-end">Orario Fine</label>
                <input 
                  id="time-end"
                  type="time" 
                  value={formData.timeSlot.end} 
                  onChange={(e) => handleTimeSlotChange('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Capacity and Amount Card */}
          <div className="form-card">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.003 8 7.71c0-.293.07-.543.433-.632zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.57.433.632 0 .293-.07.632-.433.842a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.766 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.766-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"/>
              </svg>
              Capacità e Importo
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="capacity">Capacità (persone)</label>
                <input 
                  id="capacity"
                  type="number" 
                  value={formData.capacity} 
                  onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Importo</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">€</span>
                  <input 
                    id="amount"
                    type="number" 
                    value={formData.amount} 
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="summary-box">
              <div className="summary-item">
                <span className="summary-label">Totale prenotazione</span>
                <span className="summary-value">{formatCurrency(formData.amount)}</span>
              </div>
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

export default ReservationDetail;