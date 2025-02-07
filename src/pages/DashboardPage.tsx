import { motion } from 'framer-motion';
import { 
  PlusCircle,
  ClipboardList,
  Store,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Application {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    // Simulating API call to fetch applications
    const mockApplications: Application[] = [
      {
        id: '1',
        name: 'Kebab Express Downtown',
        status: 'pending',
        submittedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: '2',
        name: 'Kebab House Central',
        status: 'approved',
        submittedAt: '2024-03-10',
      },
      {
        id: '3',
        name: 'Kebab Corner',
        status: 'rejected',
        submittedAt: '2024-03-05',
      },
    ];
    setApplications(mockApplications);
  }, []);

  const mainActions = [
    {
      title: 'Add New Restaurant',
      icon: PlusCircle,
      description: 'Start a new restaurant application',
      link: '/restaurants/new',
      color: 'bg-brand-primary',
    },
    {
      title: 'View Applications',
      icon: ClipboardList,
      description: 'Check your application status',
      link: '/applications',
      color: 'bg-brand-secondary',
    }
  ];

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Dashboard
        </h1>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainActions.map((action, index) => (
            <motion.div
              key={action.title}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(action.link)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-8">
                <div className={`w-16 h-16 ${action.color} rounded-xl flex items-center justify-center mb-6`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {action.title}
                </h3>
                <p className="text-gray-600">
                  {action.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
            <Store className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {applications.map((application, index) => {
              const { icon: StatusIcon, color } = getStatusIcon(application.status);
              return (<motion.div
                key={application.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-4">
                  <StatusIcon className={`w-5 h-5 ${color}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{application.name}</h3>
                    <p className="text-sm text-gray-500">Submitted on {application.submittedAt}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status}
                </span>
              </motion.div>);
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}