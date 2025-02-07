import { motion } from 'framer-motion';
import { 
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  FileText,
  Building2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';

interface Application {
  id: string;
  restaurantName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  address: string;
  reviewNotes?: string;
  documents: {
    type: string;
    status: 'verified' | 'pending' | 'rejected';
  }[];
}

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating API call to fetch applications
    const fetchApplications = async () => {
      try {
        // Simulated API response
        const mockApplications: Application[] = [
          {
            id: '1',
            restaurantName: 'Kebab Express Downtown',
            status: 'pending',
            submittedAt: new Date().toISOString().split('T')[0],
            address: 'Friedrichstraße 123, 10117 Berlin',
            documents: [
              { type: 'Hospitality License', status: 'pending' },
              { type: 'Registration Certificate', status: 'verified' },
              { type: 'Tax Document', status: 'pending' },
            ],
          },
          {
            id: '2',
            restaurantName: 'Kebab House Central',
            status: 'approved',
            submittedAt: '2024-03-10',
            address: 'Kantstraße 45, 10627 Berlin',
            reviewNotes: 'All documents verified. Welcome to Kebab Partners!',
            documents: [
              { type: 'Hospitality License', status: 'verified' },
              { type: 'Registration Certificate', status: 'verified' },
              { type: 'Tax Document', status: 'verified' },
            ],
          },
          {
            id: '3',
            restaurantName: 'Kebab Corner',
            status: 'rejected',
            submittedAt: '2024-03-05',
            address: 'Torstraße 89, 10119 Berlin',
            reviewNotes: 'Missing required documentation. Please resubmit with valid hospitality license.',
            documents: [
              { type: 'Hospitality License', status: 'rejected' },
              { type: 'Registration Certificate', status: 'verified' },
              { type: 'Tax Document', status: 'verified' },
            ],
          },
        ];

        setApplications(mockApplications);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500' };
      case 'approved':
        return { icon: CheckCircle2, color: 'text-green-500' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-500' };
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 font-display">
            Applications
          </h1>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
              />
            </div>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-48 pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-brand-primary bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const { icon: StatusIcon, color } = getStatusIcon(application.status);
            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-${color.split('-')[1]}-100 flex items-center justify-center`}>
                        <Building2 className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{application.restaurantName}</h3>
                        <p className="text-sm text-gray-500">{application.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={`w-4 h-4 ${color}`} />
                          <span className={`text-sm font-medium capitalize ${
                            application.status === 'approved' ? 'text-green-600' :
                            application.status === 'rejected' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {application.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            • Submitted on {application.submittedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents Status */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Documents Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {application.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{doc.type}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ml-auto ${
                            doc.status === 'verified' ? 'bg-green-100 text-green-600' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review Notes */}
                  {application.reviewNotes && (
                    <div className="mt-4 p-4 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Review Notes</h4>
                      <p className="text-sm text-gray-600">{application.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredApplications.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No applications found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}