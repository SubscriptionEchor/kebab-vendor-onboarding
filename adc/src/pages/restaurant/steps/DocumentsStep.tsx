import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { useRestaurantApplication } from '../../../context/RestaurantApplicationContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { SuccessDialog } from '../../../components/ui/SuccessDialog';
import { useLocation } from 'react-router-dom';
import { resubmitApplication } from '../../../services/restaurant';
import { ValidationError, formatOpeningTimes } from '../../../utils/validation';
import { BusinessDocuments, BankDetails } from './components/Documents';
import { AlertCircle } from 'lucide-react';

interface DocumentsStepProps {
  onBack: () => void;
}

interface BankDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
  bankIdentifierCode: string;
}

// Validation function for documents snapshot
const validateDocumentsSnapshot = (snapshot: any): void => {
  const errors = [];

  if (!snapshot.businessDocuments.hospitalityLicense) {
    errors.push('Hospitality License is required');
  }
  if (!snapshot.businessDocuments.registrationCertificate) {
    errors.push('Registration Certificate is required');
  }
  if (!snapshot.businessDocuments.taxId.documentUrl) {
    errors.push('Tax Document is required');
  }
  if (!snapshot.beneficialOwners.some(owner => 
    owner.isPrimary && owner.idCardDocuments?.length >= 2
  )) {
    errors.push('Both front and back sides of ID card are required');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Helper function to format document keys
const formatDocumentKey = (doc: any): string => {
  if (!doc) return '';
  return typeof doc === 'string' ? doc : doc.key || '';
};

// Helper function to format phone numbers
const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
  return phone.startsWith('+') ? phone : `+${countryCode === 'IN' ? '91' : '49'}${cleanPhone}`;
};

export function DocumentsStep({ onBack }: DocumentsStepProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();
  const { application, updateApplication, submitApplication } = useRestaurantApplication();
  const isResubmission = new URLSearchParams(location.search).has('edit');

  // Clear documents from localStorage when component mounts for new applications
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isNewApplication = !searchParams.has('edit');
    
    if (isNewApplication) {
      localStorage.removeItem('restaurantDocuments');
      setDocuments({
        hospitalityLicense: [],
        registrationCertificate: [],
        bankDocument: [],
        taxDocument: [],
        idCards: [],
      });
    }
  }, []);

  // Initialize documents state from application
  useEffect(() => {
    if (application?.businessDocuments) {
      console.log('[DocumentsStep] Initializing documents from application:', {
        businessDocuments: application.businessDocuments,
        primaryOwner: application.beneficialOwners?.find(owner => owner.isPrimary)
      });

      const { businessDocuments } = application;
      const primaryOwner = application.beneficialOwners?.find(owner => owner.isPrimary);
      
      const initialDocuments = {
        hospitalityLicense: businessDocuments.hospitalityLicense ? [{
          key: businessDocuments.hospitalityLicense,
          previewUrl: businessDocuments.hospitalityLicense
        }] : [],
        registrationCertificate: businessDocuments.registrationCertificate ? [{
          key: businessDocuments.registrationCertificate,
          previewUrl: businessDocuments.registrationCertificate
        }] : [],
        bankDocument: businessDocuments.bankDetails?.documentUrl ? [{
          key: businessDocuments.bankDetails.documentUrl,
          previewUrl: businessDocuments.bankDetails.documentUrl
        }] : [],
        taxDocument: businessDocuments.taxId?.documentUrl ? [{
          key: businessDocuments.taxId.documentUrl,
          previewUrl: businessDocuments.taxId.documentUrl
        }] : [],
        idCards: primaryOwner?.idCardDocuments?.map(doc => ({
          key: doc,
          previewUrl: doc
        })) || []
      };

      console.log('[DocumentsStep] Setting initial documents:', initialDocuments);
      setDocuments(initialDocuments);

      console.log('Initialized documents state:', documents);
      setIsInitialized(true);
      // Initialize bank details
      const { bankDetails: existingBankDetails } = businessDocuments;
      if (existingBankDetails) {
        setBankDetails({
          bankName: existingBankDetails.bankName || '',
          accountHolderName: existingBankDetails.accountHolderName || '',
          accountNumber: existingBankDetails.accountNumber || '',
          branchName: existingBankDetails.branchName || '',
          bankIdentifierCode: existingBankDetails.bankIdentifierCode || ''
        });
      }
    }
  }, [application]);

  const { errors: validationErrors, validate, clearErrors } = useFormValidation({
    // Only validate required documents
    hospitalityLicense: (value: boolean) => value,
    registrationCertificate: (value: boolean) => value,
    taxDocument: (value: boolean) => value,
    idCards: (value: boolean) => value,
  });
  const [documents, setDocuments] = useState({
    hospitalityLicense: [] as { key: string; previewUrl: string }[],
    registrationCertificate: [] as { key: string; previewUrl: string }[],
    bankDocument: [] as { key: string; previewUrl: string }[],
    taxDocument: [] as { key: string; previewUrl: string }[],
    idCards: [] as { key: string; previewUrl: string }[],
  });

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    branchName: '',
    bankIdentifierCode: '', // This is used as the tax document number
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    console.log('[DocumentsStep] Starting submission with documents:', {
      hospitalityLicense: documents.hospitalityLicense[0]?.key,
      registrationCertificate: documents.registrationCertificate[0]?.key,
      taxDocument: documents.taxDocument[0]?.key,
      idCards: documents.idCards.map(doc => doc.key)
    });
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      // Validate document uploads first
      const documentValidationErrors = [];
      
      if (!documents.hospitalityLicense[0]?.key) {
        documentValidationErrors.push('Please upload a valid hospitality license');
      }
      if (!documents.registrationCertificate[0]?.key) {
        documentValidationErrors.push('Please upload a valid registration certificate');
      }
      if (!documents.taxDocument[0]?.key) {
        documentValidationErrors.push('Please upload a valid tax document');
      }
      if (documents.idCards.length < 2 || !documents.idCards.every(doc => doc.key)) {
        documentValidationErrors.push('Please upload both front and back sides of your ID card');
      }
      
      if (documentValidationErrors.length > 0) {
        throw new ValidationError(documentValidationErrors);
      }

      // Create a complete snapshot first
      const applicationSnapshot = {
        ...application!,
        openingTimes: application!.openingTimes.map(time => ({
          day: time.day,
          isOpen: time.isOpen,
          times: time.isOpen && time.times?.length > 0 ? [{
            startTime: Array.isArray(time.times[0].startTime) ? 
              time.times[0].startTime : 
              [time.times[0].startTime],
            endTime: Array.isArray(time.times[0].endTime) ? 
              time.times[0].endTime : 
              [time.times[0].endTime]
          }] : []
        })),
        businessDocuments: {
          hospitalityLicense: documents.hospitalityLicense[0]?.key,
          registrationCertificate: documents.registrationCertificate[0]?.key,
          bankDetails: {
            ...bankDetails,
            documentUrl: documents.bankDocument[0]?.key
          },
          taxId: {
            documentNumber: bankDetails.bankIdentifierCode || 'default',
            documentUrl: documents.taxDocument[0]?.key
          }
        },
        beneficialOwners: application!.beneficialOwners.map(owner => ({
          ...owner,
          idCardDocuments: owner.isPrimary ? 
            documents.idCards.map(doc => doc.key) : 
            []
        }))
      };

      console.log('[DocumentsStep] Final snapshot before validation:', JSON.stringify({
        businessDocuments: applicationSnapshot.businessDocuments,
        beneficialOwners: applicationSnapshot.beneficialOwners?.map(owner => ({
          isPrimary: owner.isPrimary,
          idCardDocuments: owner.idCardDocuments
        }))
      }, null, 2));

      // Validate the snapshot
      validateDocumentsSnapshot(applicationSnapshot);
      
      const searchParams = new URLSearchParams(location.search);
      const applicationId = searchParams.get('edit');

      console.log('[DocumentsStep] Submitting with snapshot:', {
        businessDocuments: applicationSnapshot.businessDocuments,
        beneficialOwners: applicationSnapshot.beneficialOwners?.map(owner => ({
          isPrimary: owner.isPrimary,
          idCardDocuments: owner.idCardDocuments
        }))
      });

      // Submit the application
      let response;
      if (isResubmission) {
        if (!applicationId?.trim()) {
          throw new Error('Invalid application ID for resubmission');
        }
        response = await resubmitApplication(applicationId, { ...applicationSnapshot });
      } else {
        response = await submitApplication({ ...applicationSnapshot });
      }

      if (!response) {
        throw new Error('Failed to submit application. Please try again.');
      }
      
      setShowSuccess(true);
    } catch (error) {
      console.error('Submission failed:', error);
      
      if (error instanceof ValidationError) {
        setErrors(Array.isArray(error.errors) ? error.errors : [error.errors]);
        showToast('Please fix the validation errors and try again', 'error');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
        setErrors([errorMessage]);
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error states when unmounting
  useEffect(() => {
    return () => {
      setErrors([]);
      setIsSubmitting(false); 
    };
  }, []);

  const handleGoHome = () => {
    // Clear all application-related data
    clearApplicationData();
    setShowSuccess(false);
    navigate('/dashboard');
  };

  // Function to clear all application data
  const clearApplicationData = () => {
    setErrors([]);
    setIsSubmitting(false);
    
    // Clear localStorage
    localStorage.removeItem('restaurantApplication');
    localStorage.removeItem('restaurantDocuments');
    localStorage.removeItem('cachedCuisines');
    
    // Clear sessionStorage
    sessionStorage.removeItem('currentStep');
    
    // Reset form state
    setDocuments({
      hospitalityLicense: [],
      registrationCertificate: [],
      bankDocument: [],
      taxDocument: [],
      idCards: [],
    });
    
    setBankDetails({
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      branchName: '',
      bankIdentifierCode: '',
    });
    
    // Reset application context
    updateApplication({
      beneficialOwners: [],
      companyName: '',
      restaurantName: '',
      restaurantContactInfo: {
        email: '',
        phone: '',
        countryCode: 'DE',
      },
      location: {
        coordinates: {
          type: 'Point',
          coordinates: [0, 0],
        },
        address: '',
      },
      restaurantImages: [],
      menuImages: [],
      profileImage: '',
      cuisines: [],
      openingTimes: [],
      businessDocuments: {
        hospitalityLicense: '',
        registrationCertificate: '',
        bankDetails: {
          accountNumber: '',
          bankName: '',
          branchName: '',
          bankIdentifierCode: '',
          accountHolderName: '',
          documentUrl: '',
        },
        taxId: {
          documentNumber: '',
          documentUrl: '',
        }
      },
    });
  };

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (Object.values(documents).some(arr => arr.length > 0)) {
      console.log('[DocumentsStep] Saving documents to localStorage:', {
        hospitalityLicense: documents.hospitalityLicense.map(d => d.key),
        registrationCertificate: documents.registrationCertificate.map(d => d.key),
        taxDocument: documents.taxDocument.map(d => d.key),
        idCards: documents.idCards.map(d => d.key)
      });
      localStorage.setItem('restaurantDocuments', JSON.stringify(documents));
    }
  }, [documents]);

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocuments = localStorage.getItem('restaurantDocuments');
    const searchParams = new URLSearchParams(location.search);
    const isEditing = searchParams.has('edit');
    
    // Only load saved documents if we're editing an application
    if (savedDocuments && isEditing) {
      try {
        const parsedDocuments = JSON.parse(savedDocuments);
        setDocuments(parsedDocuments);
      } catch (error) {
        console.error('Failed to parse saved documents:', error);
        // Reset documents state on error
        setDocuments({
          hospitalityLicense: [],
          registrationCertificate: [],
          bankDocument: [],
          taxDocument: [],
          idCards: [],
        });
      }
    }
  }, []);

  const documentTypes = [
    {
      key: 'hospitalityLicense' as const,
      label: 'Hospitality License',
      description: 'Upload your valid hospitality or food service license',
      required: true
    },
    {
      key: 'registrationCertificate' as const,
      label: 'Registration Certificate',
      description: 'Business or company registration certificate',
      required: true
    },
    {
      key: 'bankDocument' as const,
      label: 'Bank Document',
      description: 'Recent bank statement or voided check',
      required: false
    },
    {
      key: 'taxDocument' as const,
      label: 'Tax Document',
      description: 'Valid tax registration or clearance certificate',
      required: true
    },
    {
      key: 'idCards' as const,
      label: 'ID Cards',
      description: 'Upload exactly 2 government-issued ID cards (front and back). Both sides must be clear and legible.',
      required: true,
      maxFiles: 2
    },
  ];

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Error Alerts */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <ErrorAlert
              key={`error-${index}`}
              message={error}
              onClose={() => setErrors([])}
            />
          ))}
        </div>
      )}
      
      {/* Document Upload Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Required Documents</h2>
        <div className="bg-brand-accent/10 rounded-lg p-4 mb-6">
          <div className="flex gap-2 text-sm text-gray-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
              Please ensure all documents are clear, legible, and in PDF or image format.
              All documents must be valid and up-to-date.
            </p>
          </div>
        </div>
      </div>

      <BusinessDocuments
        documents={documents}
        setDocuments={setDocuments}
      />

      <BankDetails
        bankDetails={bankDetails}
        setBankDetails={setBankDetails}
      />

      {/* Terms and Conditions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-sm text-gray-600">
            I confirm that all the information and documents provided are true, accurate,
            and complete. I understand that providing false information may result in
            the rejection of my application and potential legal consequences.
          </span>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting || isValidating}
          onClick={onBack}
        >
          Previous Step
        </Button>
        <Button 
          type="submit" 
          size="lg" 
          isLoading={isSubmitting || isValidating}
          disabled={isSubmitting || isValidating}
        >
          {isResubmission ? 'Resubmit Application' : 'Submit Application'}
        </Button>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onGoHome={handleGoHome}
        title={isResubmission ? 'Application Resubmitted!' : 'Application Submitted!'}
        message={
          isResubmission
            ? "Your updated application has been submitted successfully. We will review the changes and get back to you soon."
            : "Thank you for your application. Our team will review it within 4-5 business days. We'll notify you once the review is complete."
        }
      />
    </motion.form>
  );
}