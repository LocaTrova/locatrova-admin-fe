import { FC, useState } from 'react';
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
  { id: 'basic', title: 'Informazioni Base', component: BasicInfoStep },
  { id: 'owner', title: 'Proprietario', component: OwnerSelectionStep },
  { id: 'activities', title: 'Tipologie Attività', component: ActivityTypesStep },
  { id: 'pricing', title: 'Prezzi e Durata', component: PricingStep },
  { id: 'availability', title: 'Disponibilità', component: AvailabilityStep },
  { id: 'review', title: 'Revisione', component: ReviewStep }
];

const LocationCreateWizard: FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
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

  const updateData = (updates: Partial<LocationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors when user updates data
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  };


  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to previous steps only
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    const validation = validateCompleteForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      // Go back to first step with errors
      for (let i = 0; i < WIZARD_STEPS.length; i++) {
        const stepErrors = Object.keys(validation.errors).filter(key => 
          key.includes(WIZARD_STEPS[i].id) || 
          (i === 0 && ['name', 'address', 'city'].includes(key))
        );
        if (stepErrors.length > 0) {
          setCurrentStep(i);
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
      
      // Success - show message and redirect
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
        : 'Errore sconosciuto durante la creazione della location';
      
      setErrors({ submit: errorMessage });
    }
  };

  const currentStepData = WIZARD_STEPS[currentStep];
  const CurrentStepComponent = currentStepData.component;

  const progressPercentage = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

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
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Wizard */}
      <div className="form-wizard">
        {/* Steps Navigation */}
        <div className="wizard-steps">
          {WIZARD_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`wizard-step ${
                index === currentStep ? 'active' : 
                index < currentStep ? 'completed' : 
                'disabled'
              }`}
              onClick={() => handleStepClick(index)}
              disabled={index > currentStep}
            >
              <div className="wizard-step-number">{index + 1}</div>
              <div className="wizard-step-title">{step.title}</div>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="form-content">
          {errors.submit && (
            <div className="alert alert-error">
              <span>⚠️</span>
              {errors.submit}
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
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner" />
                    Creazione... {submitProgress}%
                  </>
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