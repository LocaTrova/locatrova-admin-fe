import { FC, useState, useCallback, useMemo } from 'react';
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
  onPrevious,
  onNext
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data validation and completeness check
  const validationSummary = useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Basic info validation
    if (!data.name?.trim()) issues.push('Nome location mancante');
    if (!data.address?.trim()) issues.push('Indirizzo mancante');
    if (!data.city?.trim()) issues.push('Città mancante');
    if (!data.addressSelected) warnings.push('Indirizzo non confermato dai suggerimenti');

    // Owner validation
    if (!data.special && !data.ownerId) issues.push('Proprietario non selezionato');

    // Activity types validation
    if (!data.type || data.type.length === 0) issues.push('Nessuna tipologia di attività selezionata');
    if (data.type && data.type.length > 8) warnings.push('Troppe tipologie selezionate (max 8)');

    // Pricing validation
    if (!data.durationType) issues.push('Tipo di durata non selezionato');
    if (!data.duration || data.duration <= 0) issues.push('Durata non valida');
    if (!data.fee || data.fee < 10 || data.fee > 30) issues.push('Commissione non valida (10-30%)');
    if (!data.special && !data.stripeId?.startsWith('acct_')) issues.push('Stripe ID mancante o non valido');
    if (!data.refundPolicyId) issues.push('Politica di rimborso non selezionata');

    // Availability validation
    const hasAvailability = data.availability.some(day => day.length > 0);
    if (!hasAvailability) issues.push('Nessun orario di disponibilità configurato');

    // Rooms validation
    if (data.capacityPricing.length === 0) issues.push('Nessuna sala/spazio configurato');
    const invalidRooms = data.capacityPricing.filter(room => 
      !room.name?.trim() || room.maxPeople <= 0 || room.pricePerHour <= 0
    );
    if (invalidRooms.length > 0) issues.push(`${invalidRooms.length} sale con dati incompleti`);

    return { issues, warnings, isValid: issues.length === 0 };
  }, [data]);

  const selectedActivityTypes = ACTIVITY_TYPES.filter(a => data.type?.includes(a.id));
  const daysWithAvailability = data.availability.filter(day => day.length > 0).length;
  const totalRoomCapacity = data.capacityPricing.reduce((sum, room) => sum + (room.maxPeople || 0), 0);
  const averageRoomPrice = data.capacityPricing.length > 0 
    ? data.capacityPricing.reduce((sum, room) => sum + (room.pricePerHour || 0), 0) / data.capacityPricing.length 
    : 0;

  const handleSubmit = useCallback(async () => {
    if (!validationSummary.isValid) return;
    
    setIsSubmitting(true);
    try {
      await onNext();
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validationSummary.isValid, onNext]);

  return (
    <div className="form-section">
      <h2 className="form-section-title">Revisione Finale</h2>
      <p className="form-section-description">
        Controlla tutti i dati prima di creare la location. 
        Verifica che tutte le informazioni siano corrette.
      </p>

      {/* Validation Status */}
      {validationSummary.issues.length > 0 && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>
            <strong>Problemi da risolvere:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {validationSummary.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validationSummary.warnings.length > 0 && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <div>
            <strong>Avvisi:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {validationSummary.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validationSummary.isValid && (
        <div className="alert alert-success">
          <span>✓</span>
          <strong>Dati completi e validi - Pronto per la creazione!</strong>
        </div>
      )}

      {/* Basic Information */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>📍 Informazioni di Base</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <strong>Nome:</strong> {data.name || '❌ Mancante'}
          </div>
          <div>
            <strong>Città:</strong> {data.city || '❌ Mancante'}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Indirizzo:</strong> {data.address || '❌ Mancante'}
            {data.address && !data.addressSelected && (
              <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⚠️ Non confermato</span>
            )}
          </div>
          {data.cap && (
            <div>
              <strong>CAP:</strong> {data.cap}
            </div>
          )}
          {data.coordinates && data.coordinates[0] !== 0 && (
            <div style={{ gridColumn: '1 / -1', fontSize: '0.9rem', color: '#64748b' }}>
              <strong>Coordinate:</strong> {data.coordinates[1].toFixed(6)}, {data.coordinates[0].toFixed(6)}
            </div>
          )}
          {data.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Descrizione:</strong> 
              <div style={{ 
                marginTop: '4px', 
                padding: '8px', 
                background: '#f8fafc', 
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                {data.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Owner Information */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>👤 Proprietario</h3>
        {data.special ? (
          <div className="alert alert-info">
            <span>🏛️</span>
            Location Speciale/Storica - Nessun proprietario specifico
          </div>
        ) : data.ownerId ? (
          <div>
            <strong>ID Proprietario:</strong> {data.ownerId}
            <span style={{ color: '#10b981', marginLeft: '8px' }}>✓</span>
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>
            ❌ Proprietario non selezionato
          </div>
        )}
      </div>

      {/* Activity Types */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🎯 Tipologie di Attività</h3>
        {selectedActivityTypes.length > 0 ? (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
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
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {selectedActivityTypes.length} tipologie selezionate
              {selectedActivityTypes.length > 8 && (
                <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⚠️ Troppe (max 8)</span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>❌ Nessuna tipologia selezionata</div>
        )}
      </div>

      {/* Pricing & Duration */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>💰 Prezzi e Durata</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <strong>Tipo Durata:</strong> {
              data.durationType === 'FIXED' ? 'Fissa' : 
              data.durationType === 'MIN' ? 'Minima' : 
              '❌ Non selezionato'
            }
          </div>
          <div>
            <strong>Durata:</strong> {data.duration ? `${data.duration} ore` : '❌ Non impostata'}
          </div>
          <div>
            <strong>Commissione:</strong> {
              data.fee ? `${data.fee}%` : '❌ Non impostata'
            }
            {data.fee && (data.fee < 10 || data.fee > 30) && (
              <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⚠️ Fuori range</span>
            )}
          </div>
          {!data.special && (
            <div>
              <strong>Stripe ID:</strong> {
                data.stripeId && data.stripeId.startsWith('acct_') 
                  ? `${data.stripeId.substring(0, 15)}...` 
                  : '❌ Non valido'
              }
            </div>
          )}
          <div>
            <strong>Politica Rimborso:</strong> {data.refundPolicyId || '❌ Non selezionata'}
          </div>
          <div>
            <strong>Stato:</strong>{' '}
            <span style={{ color: data.active ? '#10b981' : '#ef4444' }}>
              {data.active ? '✓ Attiva' : '❌ Inattiva'}
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px',
              background: '#f0fdf4',
              borderRadius: '6px'
            }}>
              <span>
                <strong>{daysWithAvailability}</strong> giorni configurati
              </span>
              <span style={{ fontSize: '0.8rem', color: '#059669' }}>
                ✓ Valida
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.availability.map((daySlots, index) => (
                daySlots.length > 0 && (
                  <div key={index} style={{ 
                    fontSize: '0.9rem',
                    padding: '6px 8px',
                    background: '#f8fafc',
                    borderRadius: '4px'
                  }}>
                    <strong>{DAYS[index]}:</strong>{' '}
                    {daySlots.map(slot => `${slot.start}-${slot.end}`).join(', ')}
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>❌ Nessuna disponibilità configurata</div>
        )}
      </div>

      {/* Capacity Pricing */}
      <div className="capacity-pricing-item">
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🏢 Sale/Spazi</h3>
        {data.capacityPricing.length > 0 ? (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px',
              background: '#f0fdf4',
              borderRadius: '6px'
            }}>
              <span>
                <strong>{data.capacityPricing.length}</strong> spazi configurati
              </span>
              <div style={{ fontSize: '0.8rem', color: '#059669' }}>
                <span>Capacità totale: {totalRoomCapacity}</span>
                {averageRoomPrice > 0 && (
                  <span style={{ marginLeft: '12px' }}>
                    Prezzo medio: €{averageRoomPrice.toFixed(0)}/h
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.capacityPricing.map((room, index) => {
                const isValid = room.name?.trim() && room.maxPeople > 0 && room.pricePerHour > 0;
                
                return (
                  <div 
                    key={index}
                    style={{
                      background: isValid ? '#f8fafc' : '#fef2f2',
                      padding: '12px',
                      borderRadius: '6px',
                      border: isValid ? '1px solid #e2e8f0' : '1px solid #fca5a5'
                    }}
                  >
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      color: isValid ? '#1e293b' : '#ef4444'
                    }}>
                      {room.name || `❌ Sala ${index + 1} (nome mancante)`}
                      {!isValid && <span style={{ marginLeft: '8px' }}>❌</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      {room.maxPeople || 0} persone • €{room.pricePerHour || 0}/ora
                      {room.squareMeters > 0 && ` • ${room.squareMeters} m²`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>❌ Nessuna sala configurata</div>
        )}
      </div>

      {/* Data Summary */}
      {validationSummary.isValid && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#15803d' }}>
            📊 Riepilogo Configurazione
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.9rem' }}>
            <div>✓ <strong>{selectedActivityTypes.length}</strong> tipologie attività</div>
            <div>✓ <strong>{daysWithAvailability}</strong> giorni disponibilità</div>
            <div>✓ <strong>{data.capacityPricing.length}</strong> spazi configurati</div>
            <div>✓ <strong>{totalRoomCapacity}</strong> capacità totale</div>
            <div>✓ <strong>{data.fee}%</strong> commissione</div>
            <div>✓ <strong>{data.duration}h</strong> durata {data.durationType === 'FIXED' ? 'fissa' : 'minima'}</div>
          </div>
        </div>
      )}

      {/* Final Instructions */}
      <div className="alert alert-info">
        <span>ℹ️</span>
        <div>
          <strong>Verifica finale:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>I dati di contatto del proprietario sono corretti</li>
            <li>I prezzi sono competitivi per il mercato</li>
            <li>Gli orari riflettono la reale disponibilità</li>
            {!data.special && <li>Lo Stripe ID è testato e funzionante</li>}
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
            disabled={isSubmitting}
          >
            ← Modifica
          </button>
          
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Passo 6 di 6 - Revisione Finale
          </span>
          
          <button
            type="button"
            className={`btn ${validationSummary.isValid ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleSubmit}
            disabled={!validationSummary.isValid || isSubmitting}
            style={{ minWidth: '140px' }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                Creazione...
              </span>
            ) : validationSummary.isValid ? (
              '✓ Crea Location'
            ) : (
              '❌ Dati Incompleti'
            )}
          </button>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
          {validationSummary.isValid ? (
            <span style={{ color: '#10b981' }}>
              ✓ Tutti i dati sono validi - Pronto per la creazione
            </span>
          ) : (
            <span style={{ color: '#ef4444' }}>
              {validationSummary.issues.length} problemi da risolvere prima di continuare
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;