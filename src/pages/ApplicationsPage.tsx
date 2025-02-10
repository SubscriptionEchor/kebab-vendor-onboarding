import { motion } from 'framer-motion';
import { 
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  FileText,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getApplications } from '../services/restaurant';
import { useToast } from '../context/ToastContext';

interface Application {
  id: string;
  restaurantName: string;
  status: 'pending' | 'approved' | 'rejected' | 'requested_onboarding';
  submittedAt: string;
  address: string;
  documents: {
    type: string;
    status: 'verified' | 'pending' | 'rejected';
  }[];
}

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditApplication = (applicationId: string) => {
    // Load the application data into the form context
    const application = applications.find(app => app.id === applicationId);
    if (application) {
      // Navigate to the edit form
      navigate(`/restaurants/new?edit=${applicationId}`);
    }
  };

  const fetchApplicationData = async () => {
    if (!localStorage.getItem('authToken')) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsError(false);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await getApplications(token);
      const applications = response.getRestaurantOnboardingApplication;
      
      if (!applications || applications.length === 0) {
        setApplications([]);
        return;
      }

      const formattedApplications = applications.map(app => {
        const documents = [
          {
            type: 'Hospitality License',
            status: app.businessDocuments?.hospitalityLicense ? 'verified' : 'pending'
          },
          {
            type: 'Registration Certificate',
            status: app.businessDocuments?.registrationCertificate ? 'verified' : 'pending'
          },
          {
            type: 'Tax Document',
            status: app.businessDocuments?.taxId?.documentUrl ? 'verified' : 'pending'
          }
        ];

        return {
          id: app._id,
          restaurantName: app.restaurantName || 'Unnamed Restaurant',
          status: app.applicationStatus.toLowerCase() as Application['status'],
          submittedAt: new Date(parseInt(app.createdAt)).toLocaleDateString(),
          address: app.location?.address || 'Address not provided',
          documents
        };
      });

      setApplications(formattedApplications);

    } catch (error) {
      console.error('Failed to fetch applications:', error);
      if (error instanceof Error) {
        if (error.message.includes('Session expired') || 
            error.message.includes('Invalid token') ||
            error.message.includes('Authentication required')) {
          localStorage.removeItem('authToken');
          navigate('/login');
        } else {
          setError(error.message);
        }
      } else {
        setIsError(true);
        setError('Failed to load applications. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch applications on mount if we have an auth token
  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      await fetchApplicationData();
    };

    fetchApplications();
  }, []);
  
  // Retry loading on error
  const handleRetry = () => {
    setError(null);
    setIsError(false);
    fetchApplicationData();
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'requested_onboarding':
        return { icon: Clock, color: 'text-blue-500', bgColor: 'blue' };
      case 'requested_changes':
        return { icon: AlertCircle, color: 'text-orange-500', bgColor: 'orange' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', bgColor: 'yellow' };
      case 'approved':
        return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'green' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'red' };
      default:
        return { icon: Clock, color: 'text-gray-500', bgColor: 'gray' };
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
            onClick={() => navigate('/dashboard')}
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

        {isError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center justify-between">
            <p className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </p>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm">
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredApplications.length > 0 ? (
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
                        <div className={`w-10 h-10 rounded-lg bg-${getStatusIcon(application.status).bgColor}-100 flex items-center justify-center`}>
                          <Building2 className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{application.restaurantName}</h3>
                          <p className="text-sm text-gray-500">{application.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {StatusIcon && <StatusIcon className={`w-4 h-4 ${color}`} />}
                            <span className={`text-sm font-medium capitalize ${
                              application.status === 'approved' ? 'text-green-600' :
                              application.status === 'rejected' ? 'text-red-600' :
                              application.status === 'requested_changes' ? 'text-orange-600' :
                              application.status === 'requested_onboarding' ? 'text-blue-600' :
                              'text-yellow-600'
                            }`}>
                              {application.status.replace('_', ' ')}
                            </span>
                            {application.status === 'requested_changes' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditApplication(application.id)}
                                className="ml-4"
                              >
                                Edit Application
                              </Button>
                            )}
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

                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-500 mb-6">You haven't submitted any restaurant applications yet.</p>
            <Button
              onClick={() => navigate('/restaurants/new')}
              variant="primary"
            >
              Submit New Application
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}