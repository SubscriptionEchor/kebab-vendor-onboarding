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
      console.log('Initializing documents from application:', application);
      const { businessDocuments } = application;
      const primaryOwner = application.beneficialOwners?.find(owner => owner.isPrimary);
      
      console.log('Primary owner:', primaryOwner);
      console.log('ID card documents:', primaryOwner?.idCardDocuments);
      
      setDocuments({
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
      });

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
    setIsValidating(true);
    setIsSubmitting(true);
    
    // Don't validate if component hasn't finished initializing
    if (!isInitialized) {
      console.log('Component not fully initialized, waiting...');
      setIsSubmitting(false);
      setIsValidating(false);
      return;
    }
    
    setErrors([]);
    
    console.log('Starting form submission with documents:', documents);
    console.log('Current application state:', application);
    
    const searchParams = new URLSearchParams(location.search);
    const applicationId = searchParams.get('edit');
    
    // Wait for documents to be saved to context
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const validationErrors = [];
    
      // Log current state for debugging
      console.log('Current documents state:', documents);
      console.log('Current application state:', application);

      // Log current state for debugging
      console.log('Current documents state:', documents);
      console.log('Current application state:', application);

      // Document validations
      if (!documents.hospitalityLicense?.length) {
        validationErrors.push('Hospitality License is required');
      }
      if (!documents.registrationCertificate?.length) {
        validationErrors.push('Registration Certificate is required');
      }
      if (!documents.taxDocument?.length) {
        validationErrors.push('Tax Document is required');
      }
      if (!documents.idCards?.length || documents.idCards.length < 2) {
        validationErrors.push('Please upload both front and back sides of your ID card');
      }

      if (validationErrors.length > 0) {
        console.log('Validation errors found:', validationErrors);
        setErrors(validationErrors);
        setIsSubmitting(false);
        setIsValidating(false);
        showToast('Please complete all required documents before submitting', 'error');
        return;
      }

      setIsValidating(false);

      // Prepare application data with proper formatting
      const applicationData = {
        companyName: application.companyName,
        restaurantName: application.restaurantName,
        restaurantContactInfo: {
          email: application.restaurantContactInfo.email,
          phone: application.restaurantContactInfo.phone,
          countryCode: application.restaurantContactInfo.countryCode
        },
        beneficialOwners: (application?.beneficialOwners || []).map(owner => {
          return {
            ...owner,
            idCardDocuments: owner.isPrimary ? documents.idCards.map(doc => doc.key) : []
          };
        }),
        location: {
          coordinates: {
            type: 'Point',
            coordinates: [
              application.location.coordinates.coordinates[0],
              application.location.coordinates.coordinates[1]
            ]
          },
          address: application.location.address
        },
        restaurantImages: application.restaurantImages,
        menuImages: application.menuImages,
        profileImage: application.profileImage,
        cuisines: application.cuisines,
        openingTimes: application.openingTimes,
        businessDocuments: {
          hospitalityLicense: documents.hospitalityLicense[0]?.key || '',
          registrationCertificate: documents.registrationCertificate[0]?.key || '',
          bankDetails: {
            ...application.businessDocuments.bankDetails,
            documentUrl: documents.bankDocument[0]?.key || ''
          },
          taxId: {
            documentNumber: bankDetails.bankIdentifierCode || 'default',
            documentUrl: documents.taxDocument[0]?.key || ''
          }
        }
      };

      // Log the application data for debugging
      console.log('Final application data:', {
        applicationData,
        documents,
        bankDetails
      });

      // Update application state
      await updateApplication(applicationData);
      
      let response;
      if (isResubmission) {
        if (!applicationId?.trim()) {
          throw new Error('Invalid application ID for resubmission');
        }
        response = await resubmitApplication(applicationId, applicationData);
        console.log('Application resubmitted successfully:', response);
      } else {
        response = await submitApplication();
        console.log('New application submitted successfully:', response);
      }

      if (!response) {
        throw new Error('Failed to submit application. Please try again.');
      }

      setShowSuccess(true);
      // Only clear data after dialog is closed
      // clearApplicationData() will be called in handleGoHome

    } catch (error) {
      console.error('Submission failed:', error);
      if (error instanceof Error) {
        setErrors([error.message]);
        showToast(error.message, 'error');
      } else {
        setErrors(['An unexpected error occurred. Please try again.']);
        showToast('Failed to submit application. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoHome = () => {
    // Clear all application-related data
    clearApplicationData();
    navigate('/dashboard');
  };

  // Function to clear all application data
  const clearApplicationData = () => {
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
      console.log('Saving documents to localStorage:', documents);
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