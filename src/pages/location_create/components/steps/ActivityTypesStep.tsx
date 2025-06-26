import { FC } from 'react';
import { LocationFormData, validateActivityTypes } from '../../validation';

interface ActivityTypesStepProps {
  data: LocationFormData;
  updateData: (updates: Partial<LocationFormData>) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// Common activity types - in real app these would come from API
const ACTIVITY_TYPES = [
  { id: 1, name: 'Feste Private', description: 'Compleanni, anniversari, celebrazioni private' },
  { id: 2, name: 'Eventi Aziendali', description: 'Riunioni, conferenze, team building' },
  { id: 3, name: 'Matrimoni', description: 'Cerimonie e ricevimenti matrimoniali' },
  { id: 4, name: 'Formazione', description: 'Corsi, workshop, seminari' },
  { id: 5, name: 'Fotografia', description: 'Set fotografici e videografici' },
  { id: 6, name: 'Sport', description: 'Attività sportive e fitness' },
  { id: 7, name: 'Arte e Cultura', description: 'Mostre, spettacoli, eventi culturali' },
  { id: 8, name: 'Gastronomia', description: 'Cene, degustazioni, eventi enogastronomici' }
];

const ActivityTypesStep: FC<ActivityTypesStepProps> = ({
  data,
  updateData,
  errors,
  onNext,
  onPrevious
}) => {
  const handleActivityToggle = (activityId: number) => {
    const currentTypes = data.type || [];
    const newTypes = currentTypes.includes(activityId)
      ? currentTypes.filter(id => id !== activityId)
      : [...currentTypes, activityId];
    
    updateData({ type: newTypes });
  };

  const handleNext = () => {
    const validation = validateActivityTypes(data);
    if (validation.isValid) {
      onNext();
    }
  };

  const isFormValid = data.type && data.type.length > 0;

  return (
    <div className="form-section">
      <h2 className="form-section-title">Tipologie di Attività</h2>
      <p className="form-section-description">
        Seleziona i tipi di attività che possono essere svolte in questa location. 
        Puoi selezionare più tipologie.
      </p>

      {errors.type && (
        <div className="alert alert-error">
          <span>⚠️</span>
          {errors.type}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {ACTIVITY_TYPES.map(activity => (
          <div
            key={activity.id}
            className={`capacity-pricing-item ${
              data.type?.includes(activity.id) ? 'selected' : ''
            }`}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: data.type?.includes(activity.id) 
                ? '2px solid #3b82f6' 
                : '1px solid #e2e8f0',
              background: data.type?.includes(activity.id) 
                ? '#f0f4ff' 
                : '#f8fafc'
            }}
            onClick={() => handleActivityToggle(activity.id)}
          >
            <div className="checkbox-group" style={{ marginBottom: '8px' }}>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={data.type?.includes(activity.id) || false}
                onChange={() => handleActivityToggle(activity.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <label className="checkbox-label">
                <strong>{activity.name}</strong>
              </label>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '0.9rem', 
              color: '#64748b',
              paddingLeft: '26px'
            }}>
              {activity.description}
            </p>
          </div>
        ))}
      </div>

      {data.type && data.type.length > 0 && (
        <div className="alert alert-success">
          <span>✓</span>
          {data.type.length} tipologie selezionate: {
            ACTIVITY_TYPES
              .filter(a => data.type?.includes(a.id))
              .map(a => a.name)
              .join(', ')
          }
        </div>
      )}

      <div className="form-help">
        <strong>Suggerimento:</strong> Seleziona tutte le tipologie pertinenti per aumentare 
        la visibilità della location nei risultati di ricerca.
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
            Passo 3 di 6 - Tipologie Attività
          </span>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!isFormValid}
          >
            Continua →
          </button>
        </div>
        {!isFormValid && (
          <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
            Seleziona almeno una tipologia di attività per continuare
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTypesStep;