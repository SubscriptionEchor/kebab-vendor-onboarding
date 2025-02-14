import { FileText } from 'lucide-react';
import { ImageUpload } from '../../../../../components/ui/ImageUpload';
import { useEffect, useState } from 'react';

interface BusinessDocumentsProps {
  documents: {
    hospitalityLicense: Array<{ key: string; previewUrl: string }>;
    registrationCertificate: Array<{ key: string; previewUrl: string }>;
    bankDocument: Array<{ key: string; previewUrl: string }>;
    taxDocument: Array<{ key: string; previewUrl: string }>;
    idCards: Array<{ key: string; previewUrl: string }>;
  };
  setDocuments: (documents: any) => void;
  application?: {
    businessDocuments?: {
      hospitalityLicense?: string;
      registrationCertificate?: string;
      bankDetails?: {
        documentUrl?: string;
      };
      taxId?: {
        documentUrl?: string;
      };
    };
    beneficialOwners?: Array<{
      isPrimary?: boolean;
      idCardDocuments?: string[];
    }>;
  };
}

// Helper function to format document
const formatDocument = (doc: string | null | undefined): Array<{ key: string; previewUrl: string }> => {
  if (!doc) return [];
  return [{
    key: doc,
    previewUrl: doc
  }];
};
export function BusinessDocuments({ documents: initialDocuments, setDocuments, application }: BusinessDocumentsProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Log document state changes
  useEffect(() => {
    console.log('[BusinessDocuments] Current documents state:', initialDocuments);
  }, [initialDocuments]);

  // Initialize documents from application data
  useEffect(() => {
    if (application && !isInitialized) {
      console.log('[BusinessDocuments] Initializing from application:', application);
      
      // Initialize business documents
      const { businessDocuments } = application;
      if (businessDocuments) {
        console.log('[BusinessDocuments] Found business documents:', businessDocuments);
        
        setDocuments(prev => ({
          ...prev,
          hospitalityLicense: formatDocument(businessDocuments.hospitalityLicense),
          registrationCertificate: formatDocument(businessDocuments.registrationCertificate),
          bankDocument: formatDocument(businessDocuments.bankDetails?.documentUrl),
          taxDocument: formatDocument(businessDocuments.taxId?.documentUrl),
        }));
      }
      
      // Initialize ID cards
      const primaryOwner = application.beneficialOwners?.find(owner => owner.isPrimary);
      
      if (primaryOwner?.idCardDocuments?.length) {
        console.log('[BusinessDocuments] Found ID cards:', primaryOwner.idCardDocuments);
        const formattedIdCards = primaryOwner.idCardDocuments
          .filter(Boolean) // Remove any null/undefined entries
          .map(doc => ({
            key: doc,
            previewUrl: doc
          }));
        
        console.log('[BusinessDocuments] Formatted ID cards:', formattedIdCards);
        
        setDocuments(prev => ({
          ...prev,
          idCards: formattedIdCards
        }));
      }
      
      setIsInitialized(true);
    }
  }, [application, setDocuments, isInitialized]);

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

  const handleDocumentChange = (docType: keyof typeof documents, newDocs: Array<{ key: string; previewUrl: string }>) => {
    console.log(`[BusinessDocuments] Updating ${docType}:`, newDocs);
    
    // Validate and format documents
    const validDocs = newDocs
      .filter(doc => doc && doc.key && doc.previewUrl)
      .map(doc => ({
        key: doc.key,
        previewUrl: doc.previewUrl
      }));
    
    console.log(`[BusinessDocuments] Formatted ${docType} documents:`, validDocs);
    
    setDocuments(prev => ({
      ...prev,
      [docType]: validDocs
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>
      <div className="grid gap-6">
        {documentTypes.map((doc) => (
          <div
            key={`doc-type-${doc.key}`}
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
              maxImages={doc.key === 'idCards' ? 2 : 1}
              imageType="DOCUMENT"
              acceptDocuments={true}
              images={initialDocuments[doc.key]}
              onImagesChange={(images) => handleDocumentChange(doc.key, images)}
              required={doc.required}
            />
          </div>
        ))}
      </div>
    </div>
  );
}