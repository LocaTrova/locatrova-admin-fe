import { FC } from 'react';
import { LocationFormData, validateAvailability } from '../../validation';

interface AvailabilityStepProps {
  data: LocationFormData;
  updateData: (updates: Partial<LocationFormData>) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const DAYS = [
  'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 
  'Venerdì', 'Sabato', 'Domenica'
];

const AvailabilityStep: FC<AvailabilityStepProps> = ({
  data,
  updateData,
  errors,
  onNext,
  onPrevious
}) => {
  const addTimeSlot = (dayIndex: number) => {
    const newAvailability = [...data.availability];
    newAvailability[dayIndex] = [
      ...newAvailability[dayIndex],
      { start: '09:00', end: '18:00' }
    ];
    updateData({ availability: newAvailability });
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newAvailability = [...data.availability];
    newAvailability[dayIndex].splice(slotIndex, 1);
    updateData({ availability: newAvailability });
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newAvailability = [...data.availability];
    newAvailability[dayIndex][slotIndex][field] = value;
    updateData({ availability: newAvailability });
  };

  const copyToDays = (sourceDayIndex: number) => {
    const sourceSlots = data.availability[sourceDayIndex];
    const newAvailability = data.availability.map((daySlots, index) => 
      index === sourceDayIndex ? daySlots : [...sourceSlots]
    );
    updateData({ availability: newAvailability });
  };

  const hasAnyAvailability = data.availability.some(daySlots => daySlots.length > 0);

  const handleNext = () => {
    const validation = validateAvailability(data.availability);
    if (validation.isValid) {
      onNext();
    }
  };

  return (
    <div className="form-section">
      <h2 className="form-section-title">Disponibilità Settimanale</h2>
      <p className="form-section-description">
        Configura gli orari di disponibilità per ogni giorno della settimana. 
        Puoi aggiungere più fasce orarie per giorno.
      </p>

      {errors.availability && (
        <div className="alert alert-error">
          <span>⚠️</span>
          {errors.availability}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {DAYS.map((day, dayIndex) => (
          <div key={dayIndex} className="capacity-pricing-item">
            <div className="capacity-pricing-header">
              <h4 className="capacity-pricing-title">{day}</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                {data.availability[dayIndex].length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => copyToDays(dayIndex)}
                    title="Copia orari a tutti i giorni"
                  >
                    Copia a tutti
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => addTimeSlot(dayIndex)}
                >
                  + Orario
                </button>
              </div>
            </div>

            {data.availability[dayIndex].length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#6b7280', 
                fontStyle: 'italic',
                padding: '16px'
              }}>
                Nessun orario impostato per {day.toLowerCase()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.availability[dayIndex].map((slot, slotIndex) => (
                  <div 
                    key={slotIndex} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Da:</label>
                      <input
                        type="time"
                        className="form-input"
                        style={{ width: '120px' }}
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start', e.target.value)}
                      />
                      <label style={{ fontSize: '0.9rem', color: '#64748b' }}>A:</label>
                      <input
                        type="time"
                        className="form-input"
                        style={{ width: '120px' }}
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="capacity-pricing-remove"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                      title="Rimuovi orario"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasAnyAvailability && (
        <div className="alert alert-success">
          <span>✓</span>
          Disponibilità configurata per {data.availability.filter(day => day.length > 0).length} giorni
        </div>
      )}

      <div className="form-help">
        <strong>Suggerimenti:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Aggiungi più fasce orarie se ci sono pause durante il giorno</li>
          <li>Usa "Copia a tutti" per applicare gli stessi orari a tutti i giorni</li>
          <li>Assicurati che l'orario di fine sia dopo quello di inizio</li>
        </ul>
      </div>

      {/* Add capacity pricing rooms */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>Sale/Spazi della Location</h3>
        <p style={{ marginBottom: '16px', color: '#64748b' }}>
          Aggiungi le sale o spazi disponibili con prezzi e capacità specifici.
        </p>
        
        {data.capacityPricing.map((room, index) => (
          <div key={index} className="capacity-pricing-item">
            <div className="capacity-pricing-header">
              <h4>Sala {index + 1}</h4>
              <button
                type="button"
                className="capacity-pricing-remove"
                onClick={() => {
                  const newRooms = data.capacityPricing.filter((_, i) => i !== index);
                  updateData({ capacityPricing: newRooms });
                }}
              >
                ×
              </button>
            </div>
            <div className="capacity-pricing-grid">
              <div className="form-group">
                <label className="form-label required">Nome Sala</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="es. Sala Conferenze A"
                  value={room.name}
                  onChange={(e) => {
                    const newRooms = [...data.capacityPricing];
                    newRooms[index].name = e.target.value;
                    updateData({ capacityPricing: newRooms });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Persone Max</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="50"
                  value={room.maxPeople}
                  onChange={(e) => {
                    const newRooms = [...data.capacityPricing];
                    newRooms[index].maxPeople = parseInt(e.target.value) || 0;
                    updateData({ capacityPricing: newRooms });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Prezzo/Ora (€)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="100"
                  value={room.pricePerHour}
                  onChange={(e) => {
                    const newRooms = [...data.capacityPricing];
                    newRooms[index].pricePerHour = parseInt(e.target.value) || 0;
                    updateData({ capacityPricing: newRooms });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Metri Quadri</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="80"
                  value={room.squareMeters}
                  onChange={(e) => {
                    const newRooms = [...data.capacityPricing];
                    newRooms[index].squareMeters = parseInt(e.target.value) || 0;
                    updateData({ capacityPricing: newRooms });
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="add-item-btn"
          onClick={() => {
            const newRoom = {
              name: '',
              maxPeople: 0,
              pricePerHour: 0,
              squareMeters: 0,
              images: []
            };
            updateData({ capacityPricing: [...data.capacityPricing, newRoom] });
          }}
        >
          + Aggiungi Sala/Spazio
        </button>
      </div>

      {/* Progress Indicator */}
      <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPrevious}
          >
            ← Indietro
          </button>
          
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Passo 5 di 6 - Disponibilità
          </span>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!hasAnyAvailability || data.capacityPricing.length === 0}
          >
            Continua →
          </button>
        </div>
        {(!hasAnyAvailability || data.capacityPricing.length === 0) && (
          <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
            Configura disponibilità e aggiungi almeno una sala per continuare
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityStep;