import { FC, useState, useCallback } from 'react';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validation helper
  const validateTimeSlot = useCallback((start: string, end: string): string | null => {
    if (!start || !end) return 'Orari obbligatori';
    if (start >= end) return 'Orario di fine deve essere dopo inizio';
    return null;
  }, []);

  const addTimeSlot = useCallback((dayIndex: number) => {
    const newAvailability = [...data.availability];
    newAvailability[dayIndex] = [
      ...newAvailability[dayIndex],
      { start: '09:00', end: '18:00' }
    ];
    updateData({ availability: newAvailability });
  }, [data.availability, updateData]);

  const removeTimeSlot = useCallback((dayIndex: number, slotIndex: number) => {
    const newAvailability = [...data.availability];
    newAvailability[dayIndex].splice(slotIndex, 1);
    updateData({ availability: newAvailability });
  }, [data.availability, updateData]);

  const updateTimeSlot = useCallback((dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newAvailability = [...data.availability];
    newAvailability[dayIndex][slotIndex][field] = value;
    updateData({ availability: newAvailability });

    // Validate this specific slot
    const slot = newAvailability[dayIndex][slotIndex];
    const error = validateTimeSlot(slot.start, slot.end);
    setFieldErrors(prev => ({
      ...prev,
      [`${dayIndex}-${slotIndex}`]: error || ''
    }));
  }, [data.availability, updateData, validateTimeSlot]);

  const copyToDays = useCallback((sourceDayIndex: number) => {
    const sourceSlots = data.availability[sourceDayIndex];
    const newAvailability = data.availability.map((daySlots, index) => 
      index === sourceDayIndex ? daySlots : [...sourceSlots]
    );
    updateData({ availability: newAvailability });
  }, [data.availability, updateData]);

  const updateRoom = useCallback((index: number, field: string, value: unknown) => {
    const newRooms = [...data.capacityPricing];
    newRooms[index] = { ...newRooms[index], [field]: value };
    updateData({ capacityPricing: newRooms });
  }, [data.capacityPricing, updateData]);

  const addRoom = useCallback(() => {
    const newRoom = {
      name: '',
      maxPeople: 0,
      pricePerHour: 0,
      squareMeters: 0,
      images: []
    };
    updateData({ capacityPricing: [...data.capacityPricing, newRoom] });
  }, [data.capacityPricing, updateData]);

  const removeRoom = useCallback((index: number) => {
    const newRooms = data.capacityPricing.filter((_, i) => i !== index);
    updateData({ capacityPricing: newRooms });
  }, [data.capacityPricing, updateData]);

  const handleNext = useCallback(() => {
    const validation = validateAvailability(data.availability);
    if (validation.isValid) {
      onNext();
    } else {
      setFieldErrors(validation.errors || {});
    }
  }, [data.availability, onNext]);

  const hasAnyAvailability = data.availability.some(daySlots => daySlots.length > 0);
  const hasValidRooms = data.capacityPricing.length > 0 && 
                       data.capacityPricing.every(room => room.name && room.maxPeople > 0 && room.pricePerHour > 0);

  return (
    <div className="form-section">
      <h2 className="form-section-title">Disponibilità e Sale</h2>
      <p className="form-section-description">
        Configura gli orari di disponibilità settimanali e le sale della location.
      </p>

      {/* Weekly Availability */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>Orari Settimanali</h3>
        
        {errors.availability && (
          <div className="alert alert-error">
            <span>⚠️</span>
            {errors.availability}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      title="Copia a tutti i giorni"
                    >
                      Copia
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
                  Nessun orario impostato
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.availability[dayIndex].map((slot, slotIndex) => {
                    const slotError = fieldErrors[`${dayIndex}-${slotIndex}`];
                    
                    return (
                      <div 
                        key={slotIndex} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          padding: '12px',
                          background: slotError ? '#fef2f2' : 'white',
                          borderRadius: '6px',
                          border: slotError ? '1px solid #f87171' : '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Da:</label>
                          <input
                            type="time"
                            className={`form-input ${slotError ? 'error' : ''}`}
                            style={{ width: '120px' }}
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start', e.target.value)}
                          />
                          <span style={{ color: '#64748b' }}>-</span>
                          <input
                            type="time"
                            className={`form-input ${slotError ? 'error' : ''}`}
                            style={{ width: '120px' }}
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end', e.target.value)}
                          />
                        </div>
                        
                        {slotError && (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                            {slotError}
                          </span>
                        )}
                        
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
                    );
                  })}
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
      </div>

      {/* Rooms/Spaces */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Sale/Spazi</h3>
        
        {data.capacityPricing.map((room, index) => (
          <div key={index} className="capacity-pricing-item" style={{ marginBottom: '16px' }}>
            <div className="capacity-pricing-header">
              <h4>Spazio {index + 1}</h4>
              <button
                type="button"
                className="capacity-pricing-remove"
                onClick={() => removeRoom(index)}
                title="Rimuovi spazio"
              >
                ×
              </button>
            </div>
            
            <div className="capacity-pricing-grid">
              <div className="form-group">
                <label className="form-label required">Nome</label>
                <input
                  type="text"
                  className={`form-input ${room.name ? 'success' : ''}`}
                  placeholder="es. Sala Conferenze"
                  value={room.name}
                  onChange={(e) => updateRoom(index, 'name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label required">Max Persone</label>
                <input
                  type="number"
                  className={`form-input ${room.maxPeople > 0 ? 'success' : ''}`}
                  placeholder="50"
                  value={room.maxPeople || ''}
                  onChange={(e) => updateRoom(index, 'maxPeople', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label required">Prezzo/Ora (€)</label>
                <input
                  type="number"
                  className={`form-input ${room.pricePerHour > 0 ? 'success' : ''}`}
                  placeholder="100"
                  value={room.pricePerHour || ''}
                  onChange={(e) => updateRoom(index, 'pricePerHour', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Metri Quadri</label>
                <input
                  type="number"
                  className={`form-input ${room.squareMeters > 0 ? 'success' : ''}`}
                  placeholder="80"
                  value={room.squareMeters || ''}
                  onChange={(e) => updateRoom(index, 'squareMeters', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="add-item-btn"
          onClick={addRoom}
        >
          + Aggiungi Spazio
        </button>
      </div>

      {/* Form Help */}
      <div className="form-help" style={{ marginTop: '24px' }}>
        <strong>Suggerimenti:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Configura almeno un orario e uno spazio per continuare</li>
          <li>Usa "Copia" per applicare gli stessi orari a tutti i giorni</li>
          <li>L'orario di fine deve essere dopo quello di inizio</li>
        </ul>
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
            disabled={!hasAnyAvailability || !hasValidRooms}
          >
            Continua →
          </button>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          {!hasAnyAvailability ? (
            <span style={{ color: '#ef4444' }}>
              Configura almeno un orario per continuare
            </span>
          ) : !hasValidRooms ? (
            <span style={{ color: '#ef4444' }}>
              Aggiungi almeno uno spazio valido per continuare
            </span>
          ) : (
            <span style={{ color: '#10b981' }}>
              ✓ Disponibilità e spazi configurati
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityStep;