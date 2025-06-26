import { FC } from 'react';
import { LocationFormData } from '../../validation';

interface ReviewStepProps {
  data: LocationFormData;
  updateData: (updates: Partial<LocationFormData>) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ACTIVITY_TYPES = [
  { id: 1, name: 'Feste Private' },
  { id: 2, name: 'Eventi Aziendali' },
  { id: 3, name: 'Matrimoni' },
  { id: 4, name: 'Formazione' },
  { id: 5, name: 'Fotografia' },
  { id: 6, name: 'Sport' },
  { id: 7, name: 'Arte e Cultura' },
  { id: 8, name: 'Gastronomia' }
];

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const ReviewStep: FC<ReviewStepProps> = ({
  data,
  onPrevious
}) => {
  const selectedActivityTypes = ACTIVITY_TYPES.filter(a => data.type?.includes(a.id));
  const daysWithAvailability = data.availability.filter(day => day.length > 0).length;

  return (
    <div className="form-section">
      <h2 className="form-section-title">Revisione Finale</h2>
      <p className="form-section-description">
        Controlla tutti i dati inseriti prima di creare la location. 
        Puoi tornare indietro per modificare qualsiasi informazione.
      </p>

      {/* Basic Information */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>📍 Informazioni di Base</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <strong>Nome:</strong> {data.name}
          </div>
          <div>
            <strong>Città:</strong> {data.city}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Indirizzo:</strong> {data.address}
          </div>
          {data.cap && (
            <div>
              <strong>CAP:</strong> {data.cap}
            </div>
          )}
          {data.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Descrizione:</strong> {data.description}
            </div>
          )}
        </div>
      </div>

      {/* Owner Information */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>👤 Proprietario</h3>
        {data.special ? (
          <div className="alert alert-warning">
            <span>🏛️</span>
            Location Speciale/Storica - Nessun proprietario specifico
          </div>
        ) : (
          <div>
            <strong>ID Proprietario:</strong> {data.ownerId || 'Non selezionato'}
          </div>
        )}
      </div>

      {/* Activity Types */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🎯 Tipologie di Attività</h3>
        {selectedActivityTypes.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedActivityTypes.map(activity => (
              <span 
                key={activity.id}
                style={{
                  background: '#e0f2fe',
                  color: '#0c4a6e',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.9rem',
                  border: '1px solid #7dd3fc'
                }}
              >
                {activity.name}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>Nessuna tipologia selezionata</div>
        )}
      </div>

      {/* Pricing & Duration */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>💰 Prezzi e Durata</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <strong>Tipo Durata:</strong> {data.durationType === 'FIXED' ? 'Fissa' : 'Minima'}
          </div>
          <div>
            <strong>Durata:</strong> {data.duration} ore
          </div>
          <div>
            <strong>Commissione:</strong> {data.fee}%
          </div>
          {!data.special && (
            <div>
              <strong>Stripe ID:</strong> {data.stripeId || 'Non impostato'}
            </div>
          )}
          <div>
            <strong>Politica Rimborso:</strong> {data.refundPolicyId || 'Non selezionata'}
          </div>
          <div>
            <strong>Stato:</strong>{' '}
            <span style={{ color: data.active ? '#10b981' : '#ef4444' }}>
              {data.active ? 'Attiva' : 'Inattiva'}
            </span>
            {data.verified && (
              <span style={{ color: '#10b981', marginLeft: '8px' }}>• Verificata</span>
            )}
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>⏰ Disponibilità</h3>
        {daysWithAvailability > 0 ? (
          <div>
            <p style={{ margin: '0 0 12px 0' }}>
              Configurata per <strong>{daysWithAvailability}</strong> giorni della settimana
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.availability.map((daySlots, index) => (
                daySlots.length > 0 && (
                  <div key={index} style={{ fontSize: '0.9rem' }}>
                    <strong>{DAYS[index]}:</strong>{' '}
                    {daySlots.map(slot => `${slot.start}-${slot.end}`).join(', ')}
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>Nessuna disponibilità configurata</div>
        )}
      </div>

      {/* Capacity Pricing */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🏢 Sale/Spazi</h3>
        {data.capacityPricing.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.capacityPricing.map((room, index) => (
              <div 
                key={index}
                style={{
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{room.name}</div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  {room.maxPeople} persone • €{room.pricePerHour}/ora • {room.squareMeters} m²
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>Nessuna sala configurata</div>
        )}
      </div>

      {/* Final Checks */}
      <div className="alert alert-info">
        <span>ℹ️</span>
        <div>
          <strong>Prima di procedere, verifica che:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Tutte le informazioni siano corrette</li>
            <li>I prezzi e gli orari siano accurati</li>
            <li>Le sale/spazi siano configurati correttamente</li>
            {!data.special && <li>Lo Stripe ID sia valido e attivo</li>}
          </ul>
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPrevious}
          >
            ← Modifica
          </button>
          
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Passo 6 di 6 - Revisione Finale
          </span>
          
          <div style={{ color: '#10b981', fontWeight: '600' }}>
            ✓ Pronto per la creazione
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;