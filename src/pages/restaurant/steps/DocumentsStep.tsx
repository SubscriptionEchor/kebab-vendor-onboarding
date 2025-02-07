import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRestaurantApplication } from '../../../context/RestaurantApplicationContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { validateDocument, validateBankAccount, validateBIC } from '../../../utils/validation';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Input } from '../../../components/ui/Input';
import { ImageUpload } from '../../../components/ui/ImageUpload';
import { SuccessDialog } from '../../../components/ui/SuccessDialog';
import { FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const { application, updateApplication, submitApplication } = useRestaurantApplication();
  const { errors, validate, clearErrors } = useFormValidation({
    hospitalityLicense: validateDocument,
    registrationCertificate: validateDocument,
    bankDocument: validateDocument,
    taxDocument: validateDocument,
    idCards: (images: string[]) => images?.length > 0,
    bankAccount: validateBankAccount,
    bankIdentifierCode: validateBIC,
  });
  const [documents, setDocuments] = useState({
    hospitalityLicense: [] as string[],
    registrationCertificate: [] as string[],
    bankDocument: [] as string[],
    taxDocument: [] as string[],
    idCards: [] as string[],
  });

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    branchName: '',
    bankIdentifierCode: '',
  });

  const validateForm = useCallback(() => {
    const validationData = {
      hospitalityLicense: documents.hospitalityLicense.length > 0,
      registrationCertificate: documents.registrationCertificate.length > 0,
      idCards: documents.idCards.length > 0
    };
    
    const isValid = validate(validationData);
    
    if (!isValid) {
      const newErrors = [];
      if (!validationData.hospitalityLicense) {
        newErrors.push({ field: 'hospitalityLicense', message: 'Hospitality License is required' });
      }
      if (!validationData.registrationCertificate) {
        newErrors.push({ field: 'registrationCertificate', message: 'Registration Certificate is required' });
      }
      if (!validationData.idCards) {
        newErrors.push({ field: 'idCards', message: 'ID Cards are required' });
      }
      setErrors(newErrors);
      return false;
    }
    
    return isValid;
  }, [documents, validate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (validateForm()) {
      try {
        // Update application with documents and bank details
        updateApplication({
          businessDocuments: {
            hospitalityLicense: documents.hospitalityLicense[0] || '',
            registrationCertificate: documents.registrationCertificate[0] || '',
            bankDetails: {
              ...bankDetails,
              documentUrl: documents.bankDocument[0] || '',
            },
            taxId: {
              documentNumber: bankDetails?.bankIdentifierCode,
              documentUrl: documents.taxDocument[0] || '',
            },
          },
        });

        // Submit the application
        await submitApplication();
        setShowSuccess(true);
      } catch (error) {
        if (error instanceof Error) {
          setErrors([{ field: 'submit', message: error.message }]);
        } else {
          setErrors([{ field: 'submit', message: 'Failed to submit application. Please try again.' }]);
        }
      }
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

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
      required: false
    },
    {
      key: 'idCards' as const,
      label: 'ID Cards',
      description: 'Government-issued ID cards of all owners',
      required: true
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
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <ErrorAlert key={index} message={error.message} onClose={clearErrors} />
          ))}
        </div>
      )}

      {/* Document Upload Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>
        <div className="bg-brand-accent/10 rounded-lg p-4 mb-6">
          <div className="flex gap-2 text-sm text-gray-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
              Please ensure all documents are clear, legible, and in PDF or image format.
              All documents must be valid and up-to-date.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {documentTypes.map((doc) => (
            <div
              key={doc.key}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{doc.label}</h3>
                  <p className="text-sm text-gray-600">{doc.description}</p>
                </div>
              </div>
              <ImageUpload
                label="Upload Document"
                maxImages={doc.key === 'idCards' ? 4 : 1}
                images={documents[doc.key]}
                onImagesChange={(images) => 
                  setDocuments(prev => ({ ...prev, [doc.key]: images }))
                }
                required={doc.required}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bank Details Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bank Account Details</h2>
        <p className="text-sm text-gray-600 mb-6">Optional: You can provide your bank details now or later</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-lg border border-gray-200 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name
            </label>
            <Input
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails(prev => ({
                ...prev,
                bankName: e.target.value
              }))}
              placeholder="Enter bank name"
              className="h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name
            </label>
            <Input
              value={bankDetails.accountHolderName}
              onChange={(e) => setBankDetails(prev => ({
                ...prev,
                accountHolderName: e.target.value
              }))}
              placeholder="Enter account holder name"
              className="h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <Input
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails(prev => ({
                ...prev,
                accountNumber: e.target.value
              }))}
              placeholder="Enter account number"
              className="h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name
            </label>
            <Input
              value={bankDetails.branchName}
              onChange={(e) => setBankDetails(prev => ({
                ...prev,
                branchName: e.target.value
              }))}
              placeholder="Enter branch name"
              className="h-11"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Identifier Code (BIC/SWIFT)
            </label>
            <Input
              value={bankDetails.bankIdentifierCode}
              onChange={(e) => setBankDetails(prev => ({
                ...prev,
                bankIdentifierCode: e.target.value
              }))}
              placeholder="Enter BIC/SWIFT code"
              className="h-11"
            />
          </div>
        </div>
      </div>

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
          onClick={onBack}
        >
          Previous Step
        </Button>
        <Button type="submit" size="lg">
          Submit Application
        </Button>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onGoHome={handleGoHome}
      />
    </motion.form>
  );
}