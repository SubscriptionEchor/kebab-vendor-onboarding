import { motion } from 'framer-motion'; 
import { useState } from 'react';
import { 
  PlusCircle,
  ClipboardList,
  Mail,
  FileCheck,
  Camera,
  MenuSquare,
  UserSquare2,
  BadgeCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';

export function DashboardPage() {
  const navigate = useNavigate();
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);

  const handleAddRestaurant = () => {
    const isEmailVerified = localStorage.getItem('emailVerified') === 'true';
    if (!isEmailVerified) {
      setShowEmailVerificationDialog(true);
      return;
    }
    navigate('/restaurants/new');
  };

  const mainActions = [
    {
      title: 'Add New Restaurant',
      icon: PlusCircle,
      description: 'Start a new restaurant application',
      onClick: handleAddRestaurant,
      color: 'bg-brand-primary',
    },
    {
      title: 'View Applications',
      icon: ClipboardList,
      description: 'Check your application status',
      onClick: () => navigate('/applications'),
      color: 'bg-brand-secondary',
    }
  ];

  const requiredDocuments = [
    {
      title: 'Hospitality business license',
      icon: FileCheck,
      description: 'Valid business license for food service operations'
    },
    {
      title: 'Certificate of registration',
      icon: BadgeCheck,
      description: 'Official business registration document'
    },
    {
      title: 'Menu details',
      icon: MenuSquare,
      description: 'Current menu items and pricing'
    },
    {
      title: 'Kitchen photos',
      icon: Camera,
      description: 'High-quality images of your kitchen facilities'
    },
    {
      title: 'ID card',
      icon: UserSquare2,
      description: 'Valid government-issued identification'
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
              onClick={action.onClick}
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

        {/* Get Started Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">
              Get Started - It only takes 10 minutes
            </h2>
            <p className="text-gray-600 mb-8">
              Please be ready with the following for a smooth registration
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Required Documents */}
              <div className="space-y-6">
                {requiredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-brand-accent/5 rounded-lg border border-brand-accent/10"
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      <doc.icon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Column - Video Guide */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="rounded-xl overflow-hidden border border-brand-accent/20 h-full flex flex-col"
                >
                  <div className="aspect-video w-full">
                    <iframe
                      src="https://www.youtube.com/embed/p6CiAhoPAGc"
                      title="Restaurant Registration Guide"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-4 bg-brand-accent/5 flex-1">
                    <h3 className="font-medium text-gray-900">Watch Our Registration Guide</h3>
                    <p className="text-sm text-gray-600">Learn how to complete your restaurant registration in just a few minutes</p>
                  </div>
                </motion.div>
              </div>
            </div>


            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex justify-center"
            >
              <Button
                onClick={handleAddRestaurant}
                size="lg"
                className="px-8"
              >
                Start Registration
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Email Verification Dialog */}
      <Dialog
        isOpen={showEmailVerificationDialog}
        onClose={() => setShowEmailVerificationDialog(false)}
        title="Email Verification Required"
        description="To add a new restaurant, you need to verify your email address first. This helps us ensure secure communication and proper notifications for your restaurant."
        confirmLabel="Verify Email"
        onConfirm={() => {
          setShowEmailVerificationDialog(false);
          navigate('/profile');
        }}
      >
        <div className="flex items-center gap-3 p-4 bg-brand-accent/10 rounded-lg mb-4">
          <Mail className="w-5 h-5 text-brand-primary" />
          <p className="text-sm text-gray-600">
            Please verify your email in your profile settings to continue. This is a one-time process that helps us ensure the security of your account.
          </p>
        </div>
      </Dialog>
    </div>
  );
}