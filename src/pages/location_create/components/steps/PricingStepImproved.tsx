import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { LocationFormData, validatePricingInfo } from '../../validation';

interface PricingStepProps {
  data: LocationFormData;
  updateData: (updates: Partial<LocationFormData>) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface RefundPolicy {
  id: string;
  name: string;
  description: string;
  cancellationHours: number;
  refundPercentage: number;
  businessLevel: 'basic' | 'standard' | 'premium';
}

// Enhanced refund policies with business rules
const REFUND_POLICIES: RefundPolicy[] = [
  {
    id: 'strict',
    name: 'Rigorosa',
    description: 'Nessun rimborso una volta confermata la prenotazione',
    cancellationHours: 0,
    refundPercentage: 0,
    businessLevel: 'basic'
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Rimborso completo fino a 24 ore prima dell\'evento',
    cancellationHours: 24,
    refundPercentage: 100,
    businessLevel: 'standard'
  },
  {
    id: 'flexible',
    name: 'Flessibile',
    description: 'Rimborso completo fino a 2 ore prima dell\'evento',
    cancellationHours: 2,
    refundPercentage: 100,
    businessLevel: 'premium'
  },
  {
    id: 'very-flexible',
    name: 'Molto Flessibile',
    description: 'Rimborso del 95% fino a 30 minuti prima dell\'evento',
    cancellationHours: 0.5,
    refundPercentage: 95,
    businessLevel: 'premium'
  },
  {
    id: 'custom-48h',
    name: '48 Ore',
    description: 'Rimborso completo fino a 48 ore prima dell\'evento',
    cancellationHours: 48,
    refundPercentage: 100,
    businessLevel: 'standard'
  }
];

// Business rules for commission rates
const COMMISSION_RULES = {
  min: 10,
  max: 30,
  standard: 20,
  special: 15, // For special locations
  premium: 25  // For premium locations
};

const PricingStep: FC<PricingStepProps> = ({
  data,
  updateData,
  errors,
  onNext,
  onPrevious
}) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showCommissionCalculator, setShowCommissionCalculator] = useState(false);
  const [estimatedRevenue, setEstimatedRevenue] = useState({ monthly: 0, yearly: 0 });

  // Enhanced validation with business logic
  const validateField = useCallback((field: string, value: unknown): string | null => {
    switch (field) {
      case 'durationType':
        if (!value) return 'Seleziona un tipo di durata';
        return null;
      
      case 'duration':
        if (!value || value <= 0) return 'La durata deve essere maggiore di 0';
        if (value > 24) return 'La durata massima è 24 ore';
        if (value < 0.5) return 'La durata minima è 30 minuti (0.5 ore)';
        // Business rule: warn about odd durations
        if (value % 0.5 !== 0) return 'La durata deve essere un multiplo di 30 minuti';
        return null;
      
      case 'fee':
        if (!value || value <= 0) return 'La commissione è obbligatoria';
        if (value < COMMISSION_RULES.min) return `La commissione minima è ${COMMISSION_RULES.min}%`;
        if (value > COMMISSION_RULES.max) return `La commissione massima è ${COMMISSION_RULES.max}%`;
        // Business rule: warn about non-standard rates
        if (value !== COMMISSION_RULES.standard && value !== COMMISSION_RULES.special && value !== COMMISSION_RULES.premium) {
          return `Commissione personalizzata: ${value}%. Standard: ${COMMISSION_RULES.standard}%`;
        }
        return null;
      
      case 'stripeId':
        if (!data.special && (!value || !value.trim())) {
          return 'Stripe Account ID è obbligatorio per location non speciali';
        }
        if (value && !value.startsWith('acct_')) {
          return 'L\'ID Stripe deve iniziare con "acct_"';
        }
        if (value && value.length < 21) {
          return 'L\'ID Stripe sembra troppo corto';
        }
        return null;
      
      case 'refundPolicyId': {
        if (!value) return 'Seleziona una politica di rimborso';
        const policy = REFUND_POLICIES.find(p => p.id === value);
        if (!policy) return 'Politica di rimborso non valida';
        return null;
      }
      
      default:
        return null;
    }
  }, [data.special]);

  // Update field errors when data changes
  useEffect(() => {
    const fields = ['durationType', 'duration', 'fee', 'stripeId', 'refundPolicyId'];
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const error = validateField(field, (data as Record<string, unknown>)[field]);
      if (error) newErrors[field] = error;
    });
    
    setFieldErrors(newErrors);
  }, [data, validateField]);

  // Enhanced handlers with validation
  const handleDurationTypeChange = useCallback((durationType: 'FIXED' | 'MIN') => {
    updateData({ durationType });
    
    // Clear duration if changing type to suggest re-evaluation
    if (data.durationType !== durationType) {
      setFieldErrors(prev => ({ ...prev, durationType: '', duration: '' }));
    }
  }, [updateData, data.durationType]);

  const handleDurationChange = useCallback((value: string) => {
    const numValue = parseFloat(value);
    const validValue = isNaN(numValue) ? 0 : Math.max(0, Math.min(24, numValue));
    
    updateData({ duration: validValue });
    
    // Clear errors when user provides valid input
    if (validValue > 0) {
      setFieldErrors(prev => ({ ...prev, duration: '' }));
    }
  }, [updateData]);

  const handleFeeChange = useCallback((value: string) => {
    const numValue = parseInt(value);
    const validValue = isNaN(numValue) ? 0 : Math.max(0, Math.min(100, numValue));
    
    updateData({ fee: validValue });
    
    // Auto-suggest standard rates
    if (validValue === 0) {
      // Suggest appropriate rate based on location type
      const suggestedRate = data.special ? COMMISSION_RULES.special : COMMISSION_RULES.standard;
      setTimeout(() => updateData({ fee: suggestedRate }), 100);
    }
  }, [updateData, data.special]);

  const handleStripeIdChange = useCallback((value: string) => {
    const sanitizedValue = value.trim().replace(/[<>]/g, '');
    updateData({ stripeId: sanitizedValue });
    
    if (sanitizedValue) {
      setFieldErrors(prev => ({ ...prev, stripeId: '' }));
    }
  }, [updateData]);

  const handleRefundPolicyChange = useCallback((policyId: string) => {
    updateData({ refundPolicyId: policyId });
    
    if (policyId) {
      setFieldErrors(prev => ({ ...prev, refundPolicyId: '' }));
    }
  }, [updateData]);

  // Revenue estimation calculator
  const calculateEstimatedRevenue = useMemo(() => {
    if (!data.duration || !data.fee) return { monthly: 0, yearly: 0 };
    
    // Simple estimation based on average booking price and frequency
    const averageHourlyRate = 50; // EUR per hour (configurable)
    const averageBookingsPerMonth = 10; // Conservative estimate
    const totalBookingValue = data.duration * averageHourlyRate;
    const platformRevenue = (totalBookingValue * data.fee) / 100;
    
    return {
      monthly: platformRevenue * averageBookingsPerMonth,
      yearly: platformRevenue * averageBookingsPerMonth * 12
    };
  }, [data.duration, data.fee]);

  useEffect(() => {
    setEstimatedRevenue(calculateEstimatedRevenue);
  }, [calculateEstimatedRevenue]);

  const handleNext = useCallback(() => {
    // Comprehensive validation before proceeding
    const validationResult = validatePricingInfo(data);
    
    // Also check our enhanced field validations
    const enhancedErrors: Record<string, string> = {};
    const fields = ['durationType', 'duration', 'fee', 'stripeId', 'refundPolicyId'];
    
    fields.forEach(field => {
      const error = validateField(field, (data as Record<string, unknown>)[field]);
      if (error && !error.includes('personalizzata')) { // Don't block on custom rates
        enhancedErrors[field] = error;
      }
    });

    const allErrors = { ...validationResult.errors, ...enhancedErrors };
    
    if (Object.keys(allErrors).length === 0) {
      onNext();
    } else {
      setFieldErrors(allErrors);
      
      // Focus first field with error
      const firstErrorField = Object.keys(allErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [data, validateField, onNext]);

  // Get field state for styling
  const getFieldState = (field: string, value: unknown) => {
    const error = fieldErrors[field] || errors[field];
    if (error && !error.includes('personalizzata')) return 'error';
    if (error && error.includes('personalizzata')) return 'warning';
    
    switch (field) {
      case 'duration':
        return value > 0 ? 'success' : '';
      case 'fee':
        return value >= COMMISSION_RULES.min && value <= COMMISSION_RULES.max ? 'success' : '';
      case 'stripeId':
        return value && value.startsWith('acct_') && value.length >= 21 ? 'success' : '';
      default:
        return value ? 'success' : '';
    }
  };

  const selectedPolicy = REFUND_POLICIES.find(p => p.id === data.refundPolicyId);
  const isFormValid = data.durationType && 
                     data.duration > 0 && 
                     data.fee >= COMMISSION_RULES.min && 
                     data.fee <= COMMISSION_RULES.max &&
                     (data.special || (data.stripeId && data.stripeId.startsWith('acct_'))) &&
                     data.refundPolicyId;

  return (
    <div className="form-section">
      <h2 className="form-section-title">Prezzi e Durata</h2>
      <p className="form-section-description">
        Configura le impostazioni di prezzo, durata e pagamento per la location. 
        Questi parametri influenzano la visibilità e la competitività della tua location.
      </p>

      {/* Duration Type */}
      <div className="form-group">
        <label className="form-label required">
          Tipo di Durata
        </label>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div className="checkbox-group">
            <input
              type="radio"
              id="duration-fixed"
              name="durationType"
              value="FIXED"
              checked={data.durationType === 'FIXED'}
              onChange={() => handleDurationTypeChange('FIXED')}
              aria-describedby="duration-type-help"
            />
            <label htmlFor="duration-fixed" className="checkbox-label">
              <strong>Durata Fissa</strong>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>
                L'evento deve durare esattamente il tempo specificato
              </div>
            </label>
          </div>
          <div className="checkbox-group">
            <input
              type="radio"
              id="duration-min"
              name="durationType"
              value="MIN"
              checked={data.durationType === 'MIN'}
              onChange={() => handleDurationTypeChange('MIN')}
              aria-describedby="duration-type-help"
            />
            <label htmlFor="duration-min" className="checkbox-label">
              <strong>Durata Minima</strong>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>
                L'evento può durare almeno il tempo specificato
              </div>
            </label>
          </div>
        </div>
        
        {(fieldErrors.durationType || errors.durationType) && (
          <div className="form-error" role="alert">
            <span>⚠️</span>
            {fieldErrors.durationType || errors.durationType}
          </div>
        )}
        
        <div id="duration-type-help" className="form-help">
          <strong>Suggerimento:</strong> La durata fissa è ideale per eventi strutturati, 
          la durata minima per location flessibili.
        </div>
      </div>

      {/* Duration Hours */}
      <div className="form-group">
        <label htmlFor="duration" className="form-label required">
          {data.durationType === 'FIXED' ? 'Durata Fissa (ore)' : 'Durata Minima (ore)'}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="duration"
            type="number"
            className={`form-input ${getFieldState('duration', data.duration)}`}
            placeholder="es. 2.5"
            value={data.duration || ''}
            onChange={(e) => handleDurationChange(e.target.value)}
            min="0.5"
            max="24"
            step="0.5"
            aria-describedby="duration-error duration-help"
            aria-invalid={!!(fieldErrors.duration || errors.duration)}
          />
          
          {data.duration > 0 && (
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.8rem',
              color: '#64748b',
              pointerEvents: 'none'
            }}>
              {data.duration === 1 ? '1 ora' : `${data.duration} ore`}
            </div>
          )}
        </div>
        
        {(fieldErrors.duration || errors.duration) && (
          <div id="duration-error" className="form-error" role="alert">
            <span>⚠️</span>
            {fieldErrors.duration || errors.duration}
          </div>
        )}
        
        {!fieldErrors.duration && !errors.duration && data.duration > 0 && (
          <div className="form-success">
            <span>✓</span>
            Durata valida: {data.duration} {data.duration === 1 ? 'ora' : 'ore'}
          </div>
        )}
        
        <div id="duration-help" className="form-help">
          La durata può essere impostata in incrementi di 30 minuti (0.5 ore).
          Range: 30 minuti - 24 ore.
        </div>
      </div>

      {/* Platform Fee with Calculator */}
      <div className="form-group">
        <label htmlFor="fee" className="form-label required">
          Commissione LocaTrova (%)
          <button
            type="button"
            onClick={() => setShowCommissionCalculator(!showCommissionCalculator)}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              marginLeft: '8px',
              fontSize: '0.8rem'
            }}
            aria-label="Mostra calcolatore commissioni"
          >
            {showCommissionCalculator ? '🧮 Nascondi' : '🧮 Calcola'}
          </button>
        </label>
        
        <div style={{ position: 'relative' }}>
          <input
            id="fee"
            type="number"
            className={`form-input ${getFieldState('fee', data.fee)}`}
            placeholder={data.special ? "15" : "20"}
            value={data.fee || ''}
            onChange={(e) => handleFeeChange(e.target.value)}
            min={COMMISSION_RULES.min}
            max={COMMISSION_RULES.max}
            step="1"
            aria-describedby="fee-error fee-help"
            aria-invalid={!!(fieldErrors.fee || errors.fee)}
          />
          
          {data.fee > 0 && (
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.8rem',
              color: '#64748b',
              pointerEvents: 'none'
            }}>
              {data.fee}%
            </div>
          )}
        </div>
        
        {(fieldErrors.fee || errors.fee) && (
          <div id="fee-error" className={`form-error ${fieldErrors.fee?.includes('personalizzata') ? 'warning' : ''}`} role="alert">
            <span>{fieldErrors.fee?.includes('personalizzata') ? '⚠️' : '⚠️'}</span>
            {fieldErrors.fee || errors.fee}
          </div>
        )}
        
        {!fieldErrors.fee && !errors.fee && data.fee > 0 && (
          <div className="form-success">
            <span>✓</span>
            Commissione: {data.fee}% 
            {data.fee === COMMISSION_RULES.standard && ' (Standard)'}
            {data.fee === COMMISSION_RULES.special && ' (Speciale)'}
            {data.fee === COMMISSION_RULES.premium && ' (Premium)'}
          </div>
        )}
        
        {/* Quick Commission Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            onClick={() => updateData({ fee: COMMISSION_RULES.special })}
            disabled={data.fee === COMMISSION_RULES.special}
          >
            Speciale ({COMMISSION_RULES.special}%)
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            onClick={() => updateData({ fee: COMMISSION_RULES.standard })}
            disabled={data.fee === COMMISSION_RULES.standard}
          >
            Standard ({COMMISSION_RULES.standard}%)
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            onClick={() => updateData({ fee: COMMISSION_RULES.premium })}
            disabled={data.fee === COMMISSION_RULES.premium}
          >
            Premium ({COMMISSION_RULES.premium}%)
          </button>
        </div>
        
        <div id="fee-help" className="form-help">
          Range consentito: {COMMISSION_RULES.min}%-{COMMISSION_RULES.max}%. 
          Standard: {COMMISSION_RULES.standard}%, Speciale: {COMMISSION_RULES.special}%, Premium: {COMMISSION_RULES.premium}%
        </div>

        {/* Commission Calculator */}
        {showCommissionCalculator && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '12px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0c4a6e' }}>
              💰 Stima Ricavi Mensili
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <strong>Ricavi Mensili Stimati:</strong>
                <div style={{ color: '#059669', fontWeight: '600' }}>
                  €{estimatedRevenue.monthly.toFixed(2)}
                </div>
              </div>
              <div>
                <strong>Ricavi Annuali Stimati:</strong>
                <div style={{ color: '#059669', fontWeight: '600' }}>
                  €{estimatedRevenue.yearly.toFixed(2)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
              *Stima basata su 10 prenotazioni/mese con tariffa media di €50/ora
            </div>
          </div>
        )}
      </div>

      {/* Stripe ID (only for non-special locations) */}
      {!data.special && (
        <div className="form-group">
          <label htmlFor="stripeId" className="form-label required">
            Stripe Account ID
          </label>
          <input
            id="stripeId"
            type="text"
            className={`form-input ${getFieldState('stripeId', data.stripeId)}`}
            placeholder="acct_1234567890abcdefghij"
            value={data.stripeId || ''}
            onChange={(e) => handleStripeIdChange(e.target.value)}
            aria-describedby="stripeId-error stripeId-help"
            aria-invalid={!!(fieldErrors.stripeId || errors.stripeId)}
            maxLength={50}
          />
          
          {(fieldErrors.stripeId || errors.stripeId) && (
            <div id="stripeId-error" className="form-error" role="alert">
              <span>⚠️</span>
              {fieldErrors.stripeId || errors.stripeId}
            </div>
          )}
          
          {!fieldErrors.stripeId && !errors.stripeId && data.stripeId && data.stripeId.startsWith('acct_') && (
            <div className="form-success">
              <span>✓</span>
              ID Stripe valido
            </div>
          )}
          
          <div id="stripeId-help" className="form-help">
            ID del conto Stripe Connect del proprietario per ricevere i pagamenti.
            Deve iniziare con "acct_". 
            <a 
              href="https://dashboard.stripe.com/connect/accounts" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', marginLeft: '4px' }}
            >
              Trova ID su Stripe →
            </a>
          </div>
        </div>
      )}

      {/* Enhanced Refund Policy */}
      <div className="form-group">
        <label htmlFor="refundPolicy" className="form-label required">
          Politica di Rimborso
        </label>
        <select
          id="refundPolicy"
          className={`form-select ${getFieldState('refundPolicyId', data.refundPolicyId)}`}
          value={data.refundPolicyId || ''}
          onChange={(e) => handleRefundPolicyChange(e.target.value)}
          aria-describedby="refundPolicy-error refundPolicy-help"
          aria-invalid={!!(fieldErrors.refundPolicyId || errors.refundPolicyId)}
        >
          <option value="">Seleziona una politica...</option>
          {REFUND_POLICIES.map(policy => (
            <option key={policy.id} value={policy.id}>
              {policy.name} - {policy.description}
            </option>
          ))}
        </select>
        
        {(fieldErrors.refundPolicyId || errors.refundPolicyId) && (
          <div id="refundPolicy-error" className="form-error" role="alert">
            <span>⚠️</span>
            {fieldErrors.refundPolicyId || errors.refundPolicyId}
          </div>
        )}
        
        {!fieldErrors.refundPolicyId && !errors.refundPolicyId && selectedPolicy && (
          <div className="form-success">
            <span>✓</span>
            Politica selezionata: {selectedPolicy.name}
          </div>
        )}
        
        {/* Policy Details */}
        {selectedPolicy && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            marginTop: '8px'
          }}>
            <div style={{ fontSize: '0.9rem' }}>
              <strong>{selectedPolicy.name}</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                {selectedPolicy.description}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.8rem' }}>
                <span>
                  ⏰ Cancellazione: {selectedPolicy.cancellationHours === 0 ? 'Non consentita' : 
                    selectedPolicy.cancellationHours < 1 ? `${selectedPolicy.cancellationHours * 60} minuti prima` :
                    `${selectedPolicy.cancellationHours} ore prima`}
                </span>
                <span>
                  💰 Rimborso: {selectedPolicy.refundPercentage}%
                </span>
                <span style={{ 
                  color: selectedPolicy.businessLevel === 'premium' ? '#059669' : 
                        selectedPolicy.businessLevel === 'standard' ? '#0ea5e9' : '#6b7280'
                }}>
                  📊 {selectedPolicy.businessLevel.charAt(0).toUpperCase() + selectedPolicy.businessLevel.slice(1)}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div id="refundPolicy-help" className="form-help">
          La politica di rimborso influenza la fiducia dei clienti e il tasso di conversione.
          Politiche flessibili aumentano le prenotazioni ma comportano più rischi.
        </div>
      </div>

      {/* Status Settings */}
      <div className="form-group">
        <label className="form-label">Stato della Location</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <div className="checkbox-group">
            <input
              id="active"
              type="checkbox"
              className="checkbox-input"
              checked={data.active}
              onChange={(e) => updateData({ active: e.target.checked })}
              aria-describedby="status-help"
            />
            <label htmlFor="active" className="checkbox-label">
              <strong>Location Attiva</strong>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>
                La location è visibile e prenotabile dagli utenti
              </div>
            </label>
          </div>
          <div className="checkbox-group">
            <input
              id="verified"
              type="checkbox"
              className="checkbox-input"
              checked={data.verified}
              onChange={(e) => updateData({ verified: e.target.checked })}
              aria-describedby="status-help"
            />
            <label htmlFor="verified" className="checkbox-label">
              <strong>Location Verificata</strong>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>
                La location è stata verificata dal team LocaTrova
              </div>
            </label>
          </div>
        </div>
        
        {(data.active || data.verified) && (
          <div className="alert alert-info" style={{ marginTop: '12px' }}>
            <span>ℹ️</span>
            <div>
              {data.active && data.verified && 'Location attiva e verificata - massima visibilità'}
              {data.active && !data.verified && 'Location attiva ma non verificata - visibilità limitata'}
              {!data.active && data.verified && 'Location verificata ma non attiva - non visibile agli utenti'}
            </div>
          </div>
        )}
        
        <div id="status-help" className="form-help">
          Le location attive e verificate hanno maggiore visibilità nei risultati di ricerca.
          Solo gli amministratori possono modificare lo stato di verifica.
        </div>
      </div>

      {/* Business Summary */}
      {isFormValid && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#15803d' }}>
            📊 Riepilogo Configurazione
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.9rem' }}>
            <div>
              <strong>Durata:</strong> {data.duration} ore ({data.durationType === 'FIXED' ? 'fissa' : 'minima'})
            </div>
            <div>
              <strong>Commissione:</strong> {data.fee}%
            </div>
            <div>
              <strong>Rimborso:</strong> {selectedPolicy?.name || 'Non configurato'}
            </div>
            <div>
              <strong>Stato:</strong> {data.active ? '✅ Attiva' : '❌ Inattiva'} | {data.verified ? '✅ Verificata' : '❌ Non verificata'}
            </div>
          </div>
        </div>
      )}

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
            Passo 4 di 6 - Prezzi e Durata
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
          {!isFormValid ? (
            <span style={{ color: '#ef4444' }}>
              Completa tutti i campi obbligatori per continuare
            </span>
          ) : (
            <span style={{ color: '#10b981' }}>
              ✓ Configurazione prezzi completata
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingStep;