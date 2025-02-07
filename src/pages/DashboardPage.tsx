import { motion } from 'framer-motion';
import { 
  PlusCircle,
  ClipboardList,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();

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
      </motion.div>
    </div>
  );
}