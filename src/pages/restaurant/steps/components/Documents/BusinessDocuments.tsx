import { FileText } from 'lucide-react';
import { ImageUpload } from '../../../../../components/ui/ImageUpload';

interface BusinessDocumentsProps {
  documents: {
    hospitalityLicense: Array<{ key: string; previewUrl: string }>;
    registrationCertificate: Array<{ key: string; previewUrl: string }>;
    bankDocument: Array<{ key: string; previewUrl: string }>;
    taxDocument: Array<{ key: string; previewUrl: string }>;
    idCards: Array<{ key: string; previewUrl: string }>;
  };
  setDocuments: (documents: any) => void;
}

export function BusinessDocuments({ documents, setDocuments }: BusinessDocumentsProps) {
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
              acceptDocuments={true}
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
  );
}