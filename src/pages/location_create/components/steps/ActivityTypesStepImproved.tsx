import { FC, useState, useEffect, useCallback, useMemo } from 'react';
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

interface ActivityType {
  id: number;
  name: string;
  description: string;
  category: string;
  popularity: number;
  keywords: string[];
}

// Enhanced activity types with categories and search keywords
const ACTIVITY_TYPES: ActivityType[] = [
  { 
    id: 1, 
    name: 'Feste Private', 
    description: 'Compleanni, anniversari, celebrazioni private', 
    category: 'Sociale',
    popularity: 90,
    keywords: ['festa', 'compleanno', 'anniversario', 'celebrazione', 'party']
  },
  { 
    id: 2, 
    name: 'Eventi Aziendali', 
    description: 'Riunioni, conferenze, team building', 
    category: 'Business',
    popularity: 85,
    keywords: ['business', 'aziendale', 'riunione', 'conferenza', 'meeting', 'team building']
  },
  { 
    id: 3, 
    name: 'Matrimoni', 
    description: 'Cerimonie e ricevimenti matrimoniali', 
    category: 'Celebrazioni',
    popularity: 95,
    keywords: ['matrimonio', 'wedding', 'cerimonia', 'ricevimento', 'nozze']
  },
  { 
    id: 4, 
    name: 'Formazione', 
    description: 'Corsi, workshop, seminari', 
    category: 'Educazione',
    popularity: 70,
    keywords: ['corso', 'workshop', 'seminario', 'formazione', 'training', 'educazione']
  },
  { 
    id: 5, 
    name: 'Fotografia', 
    description: 'Set fotografici e videografici', 
    category: 'Arte',
    popularity: 60,
    keywords: ['foto', 'fotografia', 'video', 'set', 'shooting', 'produzione']
  },
  { 
    id: 6, 
    name: 'Sport', 
    description: 'Attività sportive e fitness', 
    category: 'Sport',
    popularity: 75,
    keywords: ['sport', 'fitness', 'allenamento', 'palestra', 'attività fisica']
  },
  { 
    id: 7, 
    name: 'Arte e Cultura', 
    description: 'Mostre, spettacoli, eventi culturali', 
    category: 'Cultura',
    popularity: 65,
    keywords: ['arte', 'cultura', 'mostra', 'spettacolo', 'teatro', 'musica']
  },
  { 
    id: 8, 
    name: 'Gastronomia', 
    description: 'Cene, degustazioni, eventi enogastronomici', 
    category: 'Cibo',
    popularity: 80,
    keywords: ['cena', 'degustazione', 'gastronomia', 'food', 'wine', 'cucina']
  },
  { 
    id: 9, 
    name: 'Presentazioni', 
    description: 'Lanci prodotto, presentazioni aziendali', 
    category: 'Business',
    popularity: 55,
    keywords: ['presentazione', 'lancio', 'prodotto', 'demo', 'pitch']
  },
  { 
    id: 10, 
    name: 'Networking', 
    description: 'Eventi di networking e socializzazione', 
    category: 'Sociale',
    popularity: 65,
    keywords: ['networking', 'social', 'incontro', 'business networking']
  }
];

const CATEGORIES = [...new Set(ACTIVITY_TYPES.map(a => a.category))];

const ActivityTypesStep: FC<ActivityTypesStepProps> = ({
  data,
  updateData,
  errors,
  onNext,
  onPrevious
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtered and sorted activity types
  const filteredActivities = useMemo(() => {
    let filtered = ACTIVITY_TYPES;

    // Filter by category
    if (selectedCategory !== 'Tutti') {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.name.toLowerCase().includes(term) ||
        activity.description.toLowerCase().includes(term) ||
        activity.keywords.some(keyword => keyword.toLowerCase().includes(term))
      );
    }

    // Sort by popularity and selection status
    return filtered.sort((a, b) => {
      const aSelected = data.type?.includes(a.id) ? 1 : 0;
      const bSelected = data.type?.includes(b.id) ? 1 : 0;
      
      if (aSelected !== bSelected) {
        return bSelected - aSelected; // Selected items first
      }
      
      return b.popularity - a.popularity; // Then by popularity
    });
  }, [searchTerm, selectedCategory, data.type]);

  // Popular suggestions based on unselected high-popularity items
  const suggestions = useMemo(() => {
    if (!data.type || data.type.length === 0) {
      return ACTIVITY_TYPES
        .filter(a => a.popularity >= 80)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 3);
    }
    return [];
  }, [data.type]);

  // Enhanced validation
  const validateField = useCallback((): string | null => {
    if (!data.type || data.type.length === 0) {
      return 'Seleziona almeno una tipologia di attività';
    }
    if (data.type.length > 8) {
      return 'Massimo 8 tipologie selezionabili';
    }
    return null;
  }, [data.type]);

  // Update field errors when data changes
  useEffect(() => {
    const error = validateField();
    setFieldErrors(prev => ({ ...prev, type: error || '' }));
  }, [validateField]);

  const handleActivityToggle = useCallback((activityId: number) => {
    const currentTypes = data.type || [];
    const isSelected = currentTypes.includes(activityId);
    
    let newTypes: number[];
    
    if (isSelected) {
      newTypes = currentTypes.filter(id => id !== activityId);
    } else {
      // Check max limit
      if (currentTypes.length >= 8) {
        setFieldErrors(prev => ({ 
          ...prev, 
          type: 'Massimo 8 tipologie selezionabili. Rimuovi una tipologia per aggiungerne un\'altra.' 
        }));
        return;
      }
      newTypes = [...currentTypes, activityId];
    }
    
    updateData({ type: newTypes });
    
    // Clear errors when user makes valid selection
    if (newTypes.length > 0) {
      setFieldErrors(prev => ({ ...prev, type: '' }));
    }
  }, [data.type, updateData]);

  const handleSelectAll = useCallback((category?: string) => {
    const categoriesToSelect = category ? [category] : CATEGORIES;
    const activitiesToAdd = ACTIVITY_TYPES
      .filter(a => categoriesToSelect.includes(a.category))
      .filter(a => !data.type?.includes(a.id))
      .map(a => a.id);

    const currentTypes = data.type || [];
    const newTypes = [...currentTypes, ...activitiesToAdd].slice(0, 8); // Limit to 8
    
    updateData({ type: newTypes });
  }, [data.type, updateData]);

  const handleClearAll = useCallback(() => {
    updateData({ type: [] });
  }, [updateData]);

  const handleSuggestionSelect = useCallback((activityId: number) => {
    handleActivityToggle(activityId);
    setShowSuggestions(false);
  }, [handleActivityToggle]);

  const handleNext = useCallback(() => {
    // Comprehensive validation before proceeding
    const validationResult = validateActivityTypes(data);
    const fieldError = validateField();
    
    const allErrors = {
      ...validationResult.errors,
      ...(fieldError ? { type: fieldError } : {})
    };
    
    if (Object.keys(allErrors).length === 0) {
      onNext();
    } else {
      setFieldErrors(allErrors);
    }
  }, [data, validateField, onNext]);

  // Keyboard handler for activity cards
  const handleKeyDown = useCallback((e: React.KeyboardEvent, activityId: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivityToggle(activityId);
    }
  }, [handleActivityToggle]);

  const selectedCount = data.type?.length || 0;
  const isFormValid = selectedCount > 0 && selectedCount <= 8;

  return (
    <div className="form-section">
      <h2 className="form-section-title">Tipologie di Attività</h2>
      <p className="form-section-description">
        Seleziona i tipi di attività che possono essere svolte in questa location. 
        Puoi selezionare fino a 8 tipologie.
      </p>

      {/* Search and Filter Controls */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Search */}
          <div className="form-group">
            <label htmlFor="activity-search" className="form-label">
              Cerca Attività
            </label>
            <input
              id="activity-search"
              type="text"
              className="form-input"
              placeholder="es. matrimonio, conferenza, sport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Category Filter */}
          <div className="form-group">
            <label htmlFor="category-filter" className="form-label">
              Categoria
            </label>
            <select
              id="category-filter"
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="Tutti">Tutte le categorie</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleSelectAll()}
            disabled={selectedCount >= 8}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            Seleziona Popolari
          </button>
          
          {selectedCategory !== 'Tutti' && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleSelectAll(selectedCategory)}
              disabled={selectedCount >= 8}
              style={{ fontSize: '0.9rem', padding: '8px 16px' }}
            >
              Seleziona {selectedCategory}
            </button>
          )}
          
          {selectedCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearAll}
              style={{ fontSize: '0.9rem', padding: '8px 16px' }}
            >
              Rimuovi Tutto
            </button>
          )}

          <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.9rem' }}>
            {selectedCount}/8 selezionate
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(fieldErrors.type || errors.type) && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span>
          {fieldErrors.type || errors.type}
        </div>
      )}

      {/* Suggestions for new users */}
      {suggestions.length > 0 && !showSuggestions && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0c4a6e' }}>
              💡 Tipologie Popolari
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748b' }}>
              Inizia con queste tipologie molto richieste:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {suggestions.map(activity => (
                <button
                  key={activity.id}
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleSuggestionSelect(activity.id)}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  + {activity.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => {
            const isSelected = data.type?.includes(activity.id) || false;
            const isDisabled = !isSelected && selectedCount >= 8;
            
            return (
              <div
                key={activity.id}
                className={`capacity-pricing-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  border: isSelected 
                    ? '2px solid #3b82f6' 
                    : '1px solid #e2e8f0',
                  background: isSelected 
                    ? '#f0f4ff' 
                    : isDisabled 
                    ? '#f9fafb'
                    : '#ffffff',
                  opacity: isDisabled ? 0.6 : 1,
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
                }}
                onClick={() => !isDisabled && handleActivityToggle(activity.id)}
                onKeyDown={(e) => !isDisabled && handleKeyDown(e, activity.id)}
                tabIndex={isDisabled ? -1 : 0}
                role="checkbox"
                aria-checked={isSelected}
                aria-disabled={isDisabled}
                aria-describedby={`activity-${activity.id}-desc`}
              >
                <div className="checkbox-group" style={{ marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={isSelected}
                    onChange={() => !isDisabled && handleActivityToggle(activity.id)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isDisabled}
                    aria-label={`Seleziona ${activity.name}`}
                  />
                  <label className="checkbox-label">
                    <strong>{activity.name}</strong>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: '#9ca3af', 
                      marginLeft: '8px',
                      fontWeight: 'normal'
                    }}>
                      {activity.category}
                    </span>
                  </label>
                </div>
                <p 
                  id={`activity-${activity.id}-desc`}
                  style={{ 
                    margin: 0, 
                    fontSize: '0.9rem', 
                    color: '#64748b',
                    paddingLeft: '26px',
                    lineHeight: '1.4'
                  }}
                >
                  {activity.description}
                </p>
                {activity.popularity >= 80 && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#fbbf24',
                    color: '#92400e',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    POPOLARE
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '40px',
            color: '#6b7280'
          }}>
            <p>Nessuna attività trovata per "{searchTerm}"</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSearchTerm('')}
              style={{ marginTop: '8px' }}
            >
              Rimuovi filtri
            </button>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <div className="alert alert-success">
          <span>✓</span>
          <div>
            <strong>{selectedCount} tipologie selezionate:</strong>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ACTIVITY_TYPES
                .filter(a => data.type?.includes(a.id))
                .map(activity => (
                  <span
                    key={activity.id}
                    style={{
                      background: '#e0f2fe',
                      color: '#0c4a6e',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {activity.name}
                    <button
                      type="button"
                      onClick={() => handleActivityToggle(activity.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0c4a6e',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '4px'
                      }}
                      aria-label={`Rimuovi ${activity.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="form-help">
        <strong>Suggerimenti:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Seleziona tutte le tipologie pertinenti per aumentare la visibilità</li>
          <li>Le tipologie "Popolari" sono molto richieste dai clienti</li>
          <li>Puoi modificare la selezione in qualsiasi momento</li>
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
            Passo 3 di 6 - Tipologie Attività
          </span>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!isFormValid}
            aria-describedby="form-status"
          >
            Continua →
          </button>
        </div>
        <div id="form-status" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          {selectedCount === 0 ? (
            <span style={{ color: '#ef4444' }}>
              Seleziona almeno una tipologia di attività per continuare
            </span>
          ) : selectedCount > 8 ? (
            <span style={{ color: '#ef4444' }}>
              Massimo 8 tipologie selezionabili (attualmente: {selectedCount})
            </span>
          ) : (
            <span style={{ color: '#10b981' }}>
              ✓ {selectedCount} tipologie selezionate
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTypesStep;