import { Input } from '../../../../../components/ui/Input';

interface BankDetailsProps {
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    branchName: string;
    bankIdentifierCode: string;
  };
  setBankDetails: (details: any) => void;
}

export function BankDetails({ bankDetails, setBankDetails }: BankDetailsProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Bank Account Details</h2>
      <p className="text-sm text-gray-600 mb-6">Optional: You can provide your bank details now or add them later</p>
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
          <label className="block text-sm text-gray-700 mb-1">
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
  );
}