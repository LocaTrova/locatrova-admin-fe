import { FC } from 'react';
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

const PricingStep: FC<PricingStepProps> = ({
  data,
  updateData,
  errors,
  onNext,
  onPrevious
}) => {
  const handleNext = () => {
    const validation = validatePricingInfo(data);
    if (validation.isValid) {
      onNext();
    }
  };

  const isFormValid = data.durationType && data.duration && data.fee && 
    (data.special || data.stripeId);

  return (
    <div className="form-section">
      <h2 className="form-section-title">Prezzi e Durata</h2>
      <p className="form-section-description">
        Configura le impostazioni di prezzo, durata e pagamento per la location.
      </p>

      {/* Duration Type */}
      <div className="form-group">
        <label className="form-label required">Tipo di Durata</label>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div className="checkbox-group">
            <input
              type="radio"
              id="duration-fixed"
              name="durationType"
              value="FIXED"
              checked={data.durationType === 'FIXED'}
              onChange={(e) => updateData({ durationType: e.target.value as 'FIXED' | 'MIN' })}
            />
            <label htmlFor="duration-fixed" className="checkbox-label">
              Durata Fissa
            </label>
          </div>
          <div className="checkbox-group">
            <input
              type="radio"
              id="duration-min"
              name="durationType"
              value="MIN"
              checked={data.durationType === 'MIN'}
              onChange={(e) => updateData({ durationType: e.target.value as 'FIXED' | 'MIN' })}
            />
            <label htmlFor="duration-min" className="checkbox-label">
              Durata Minima
            </label>
          </div>
        </div>
      </div>

      {/* Duration Hours */}
      <div className="form-group">
        <label htmlFor="duration" className="form-label required">
          {data.durationType === 'FIXED' ? 'Durata Fissa (ore)' : 'Durata Minima (ore)'}
        </label>
        <input
          id="duration"
          type="number"
          className={`form-input ${errors.duration ? 'error' : data.duration ? 'success' : ''}`}
          placeholder="es. 2"
          value={data.duration || ''}
          onChange={(e) => updateData({ duration: parseInt(e.target.value) || 0 })}
          min="1"
          max="24"
        />
        {errors.duration && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.duration}
          </div>
        )}
      </div>

      {/* Platform Fee */}
      <div className="form-group">
        <label htmlFor="fee" className="form-label required">
          Commissione LocaTrova (%)
        </label>
        <input
          id="fee"
          type="number"
          className={`form-input ${errors.fee ? 'error' : data.fee ? 'success' : ''}`}
          placeholder="20"
          value={data.fee || ''}
          onChange={(e) => updateData({ fee: parseInt(e.target.value) || 0 })}
          min="10"
          max="30"
          step="5"
        />
        {errors.fee && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.fee}
          </div>
        )}
        <div className="form-help">
          Commissione standard: 20%. Range consentito: 10%-30%
        </div>
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
            className={`form-input ${errors.stripeId ? 'error' : data.stripeId ? 'success' : ''}`}
            placeholder="acct_..."
            value={data.stripeId || ''}
            onChange={(e) => updateData({ stripeId: e.target.value })}
          />
          {errors.stripeId && (
            <div className="form-error">
              <span>⚠️</span>
              {errors.stripeId}
            </div>
          )}
          <div className="form-help">
            ID del conto Stripe Connect del proprietario per ricevere i pagamenti
          </div>
        </div>
      )}

      {/* Refund Policy - Simplified */}
      <div className="form-group">
        <label htmlFor="refundPolicy" className="form-label required">
          Politica di Rimborso
        </label>
        <select
          id="refundPolicy"
          className={`form-select ${errors.refundPolicyId ? 'error' : data.refundPolicyId ? 'success' : ''}`}
          value={data.refundPolicyId || ''}
          onChange={(e) => updateData({ refundPolicyId: e.target.value })}
        >
          <option value="">Seleziona una politica...</option>
          <option value="standard">Standard (rimborso fino a 24h prima)</option>
          <option value="flexible">Flessibile (rimborso fino a 2h prima)</option>
          <option value="strict">Rigorosa (nessun rimborso)</option>
        </select>
        {errors.refundPolicyId && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.refundPolicyId}
          </div>
        )}
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
            />
            <label htmlFor="active" className="checkbox-label">
              Location Attiva
            </label>
          </div>
          <div className="checkbox-group">
            <input
              id="verified"
              type="checkbox"
              className="checkbox-input"
              checked={data.verified}
              onChange={(e) => updateData({ verified: e.target.checked })}
            />
            <label htmlFor="verified" className="checkbox-label">
              Location Verificata
            </label>
          </div>
        </div>
        <div className="form-help">
          Le location attive sono visibili agli utenti. La verifica indica che sono state controllate dal team.
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
          >
            Continua →
          </button>
        </div>
        {!isFormValid && (
          <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
            Completa tutti i campi obbligatori per continuare
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingStep;