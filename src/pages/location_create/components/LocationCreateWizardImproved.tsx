import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../LocationCreate.css';

// Import step components
import BasicInfoStep from './steps/BasicInfoStep';
import OwnerSelectionStep from './steps/OwnerSelectionStep';
import ActivityTypesStep from './steps/ActivityTypesStep';
import PricingStep from './steps/PricingStep';
import AvailabilityStep from './steps/AvailabilityStep';
import ReviewStep from './steps/ReviewStep';

// Import utilities
import { LocationFormData, validateCompleteForm } from '../validation';
import { createLocation } from '../../../api/locations/api';

interface WizardStep {
  id: string;
  title: string;
  component: FC<WizardStepProps>;
  isValid?: boolean;
  required?: string[];
}

interface WizardStepProps {
  data: LocationFormData;
  updateData: (updates: Partial<LocationFormData>) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  { 
    id: 'basic', 
    title: 'Informazioni Base', 
    component: BasicInfoStep,
    required: ['name', 'address', 'city']
  },
  { 
    id: 'owner', 
    title: 'Proprietario', 
    component: OwnerSelectionStep,
    required: ['ownerId', 'special']
  },
  { 
    id: 'activities', 
    title: 'Tipologie Attività', 
    component: ActivityTypesStep,
    required: ['type']
  },
  { 
    id: 'pricing', 
    title: 'Prezzi e Durata', 
    component: PricingStep,
    required: ['durationType', 'duration', 'fee', 'refundPolicyId']
  },
  { 
    id: 'availability', 
    title: 'Disponibilità', 
    component: AvailabilityStep,
    required: ['availability', 'capacityPricing']
  },
  { 
    id: 'review', 
    title: 'Revisione', 
    component: ReviewStep,
    required: []
  }
];

const STORAGE_KEY = 'location-create-draft';

const LocationCreateWizard: FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<LocationFormData>({
    // Basic Info
    name: '',
    address: '',
    city: '',
    cap: '',
    description: '',
    rules: '',
    
    // Owner
    ownerId: '',
    special: false,
    
    // Location
    coordinates: [0, 0],
    addressSelected: false,
    
    // Duration & Pricing
    durationType: 'FIXED',
    duration: 1,
    fee: 20,
    stripeId: '',
    refundPolicyId: '',
    
    // Status
    active: true,
    verified: false,
    
    // Complex data
    type: [],
    services: [],
    images: [],
    capacityPricing: [],
    availability: [[], [], [], [], [], [], []] // 7 days
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft.data);
        setCurrentStep(parsedDraft.step || 0);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Failed to load draft:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Auto-save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: formData,
        step: currentStep,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData, currentStep]);

  // Debounced auto-save
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        saveDraft();
      }, 2000); // Save after 2 seconds of inactivity
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, hasUnsavedChanges, saveDraft]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Hai modifiche non salvate. Vuoi davvero uscire?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateData = useCallback((updates: Partial<LocationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
    
    // Clear related errors when user updates data
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  }, [errors]);

  // Step validation
  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = WIZARD_STEPS[stepIndex];
    if (!step.required) return true;

    const stepErrors: Record<string, string> = {};
    
    step.required.forEach(field => {
      switch (field) {
        case 'name':
          if (!formData.name?.trim()) stepErrors[field] = 'Nome richiesto';
          break;
        case 'address':
          if (!formData.address?.trim()) stepErrors[field] = 'Indirizzo richiesto';
          break;
        case 'city':
          if (!formData.city?.trim()) stepErrors[field] = 'Città richiesta';
          break;
        case 'ownerId':
          if (!formData.special && !formData.ownerId?.trim()) stepErrors[field] = 'Proprietario richiesto';
          break;
        case 'type':
          if (!formData.type || formData.type.length === 0) stepErrors[field] = 'Almeno una tipologia richiesta';
          break;
        case 'durationType':
          if (!formData.durationType) stepErrors[field] = 'Tipo durata richiesto';
          break;
        case 'duration':
          if (!formData.duration || formData.duration <= 0) stepErrors[field] = 'Durata richiesta';
          break;
        case 'fee':
          if (!formData.fee || formData.fee < 10 || formData.fee > 30) stepErrors[field] = 'Commissione non valida';
          break;
        case 'refundPolicyId':
          if (!formData.refundPolicyId) stepErrors[field] = 'Politica rimborso richiesta';
          break;
        case 'availability':
          if (!Array.isArray(formData.availability) || !formData.availability.some(day => day.length > 0)) stepErrors[field] = 'Almeno un orario richiesto';
          break;
        case 'capacityPricing':
          if (!Array.isArray(formData.capacityPricing) || formData.capacityPricing.length === 0) stepErrors[field] = 'Almeno una sala richiesta';
          break;
      }
    });

    if (Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...stepErrors }));
      return false;
    }

    return true;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep) && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Allow navigation to any completed step or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      setErrors({});
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasUnsavedChanges(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Final comprehensive validation
    const validation = validateCompleteForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      
      // Go to first step with errors
      for (let i = 0; i < WIZARD_STEPS.length; i++) {
        const stepFields = WIZARD_STEPS[i].required || [];
        const hasStepErrors = stepFields.some(field => validation.errors[field]);
        if (hasStepErrors) {
          setCurrentStep(i);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        }
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(0);

    try {
      // Convert form data to FormData for API
      const apiFormData = new FormData();
      
      // Add basic data
      const basicData = {
        ownerId: formData.special ? undefined : formData.ownerId,
        name: formData.name,
        city: formData.city,
        cap: formData.cap,
        address: formData.address,
        description: formData.description,
        rules: formData.rules,
        durationType: formData.durationType,
        duration: formData.duration,
        stripeId: formData.special ? undefined : formData.stripeId,
        fee: formData.fee,
        refundPolicyId: formData.refundPolicyId,
        special: formData.special,
        active: formData.active,
        verified: formData.verified,
        type: formData.type,
        services: formData.services,
        availability: formData.availability,
        location: {
          type: 'Point',
          coordinates: formData.coordinates
        }
      };

      apiFormData.append('data', JSON.stringify(basicData));

      // Add general images
      formData.images.forEach(image => {
        apiFormData.append('images', image);
      });

      // Add capacity pricing
      const capacityPricingData = formData.capacityPricing.map((room, index) => ({
        roomId: index,
        name: room.name,
        maxPeople: room.maxPeople,
        pricePerHour: room.pricePerHour,
        squareMeters: room.squareMeters
      }));

      apiFormData.append('capacityPricing', JSON.stringify(capacityPricingData));

      // Add room images
      formData.capacityPricing.forEach((room, roomIndex) => {
        room.images.forEach(image => {
          apiFormData.append(`capacityPricing[${roomIndex}].images`, image);
        });
      });

      await createLocation(apiFormData, setSubmitProgress);
      
      // Success - clear draft and redirect
      clearDraft();
      
      setTimeout(() => {
        navigate('/locations', { 
          state: { 
            message: 'Location creata con successo!',
            type: 'success'
          }
        });
      }, 1000);

    } catch (error) {
      setIsSubmitting(false);
      setSubmitProgress(0);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Errore durante la creazione della location';
      
      setErrors({ submit: errorMessage });
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formData, clearDraft, navigate]);

  // Calculate progress and validation states
  const progressPercentage = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const currentStepData = WIZARD_STEPS[currentStep];
  const CurrentStepComponent = currentStepData.component;

  // Calculate step completion states
  const stepStates = WIZARD_STEPS.map((_, index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'disabled';
  });

  return (
    <div className="location-create-container">
      {/* Header */}
      <div className="location-create-header">
        <h1 className="location-create-title">Crea Nuova Location</h1>
        <p className="location-create-subtitle">
          Segui i passaggi per creare una nuova location sulla piattaforma
        </p>
        <nav className="breadcrumb-nav">
          <Link to="/">Home</Link>
          <span>→</span>
          <Link to="/locations">Location</Link>
          <span>→</span>
          <span>Nuova Location</span>
        </nav>
        
        {/* Draft status */}
        {hasUnsavedChanges && (
          <div style={{ 
            marginTop: '8px', 
            padding: '8px 12px', 
            background: '#fef3c7', 
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#92400e'
          }}>
            💾 Bozza salvata automaticamente
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '0.8rem',
          color: 'white',
          fontWeight: '600'
        }}>
          {Math.round(progressPercentage)}%
        </div>
      </div>

      {/* Wizard */}
      <div className="form-wizard">
        {/* Steps Navigation */}
        <div className="wizard-steps">
          {WIZARD_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`wizard-step ${stepStates[index]}`}
              onClick={() => handleStepClick(index)}
              disabled={index > currentStep || isSubmitting}
              title={
                index > currentStep 
                  ? 'Completa i passaggi precedenti per sbloccare'
                  : `Vai al passo ${index + 1}: ${step.title}`
              }
            >
              <div className="wizard-step-number">
                {stepStates[index] === 'completed' ? '✓' : index + 1}
              </div>
              <div className="wizard-step-title">{step.title}</div>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="form-content">
          {errors.submit && (
            <div className="alert alert-error" role="alert">
              <span>⚠️</span>
              <div>
                <strong>Errore nella creazione:</strong>
                <div>{errors.submit}</div>
              </div>
            </div>
          )}

          <CurrentStepComponent
            data={formData}
            updateData={updateData}
            errors={errors}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirst={currentStep === 0}
            isLast={currentStep === WIZARD_STEPS.length - 1}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <div className="form-actions-left">
            {currentStep > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                ← Indietro
              </button>
            )}
            
            {/* Draft actions */}
            {hasUnsavedChanges && !isSubmitting && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={clearDraft}
                style={{ marginLeft: '8px' }}
                title="Cancella bozza salvata"
              >
                🗑️ Cancella Bozza
              </button>
            )}
          </div>

          <div className="form-actions-center">
            <span style={{ 
              fontSize: '0.9rem', 
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Passo {currentStep + 1} di {WIZARD_STEPS.length}
              {isSubmitting && (
                <span style={{ color: '#059669' }}>
                  • Creazione in corso...
                </span>
              )}
            </span>
          </div>

          <div className="form-actions-right">
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Avanti →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ minWidth: '160px' }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                    Creazione... {submitProgress}%
                  </span>
                ) : (
                  '✓ Crea Location'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationCreateWizard;