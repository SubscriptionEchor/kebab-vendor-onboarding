import { motion } from 'framer-motion';
import { ChefHat, Utensils, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-5xl font-bold text-gray-900 font-display"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          Welcome to Kebab Partners
        </motion.h1>
        <motion.p
          className="mt-6 text-xl text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Streamline your restaurant operations with our powerful management system
        </motion.p>
        <motion.div
          className="mt-8 flex justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button size="lg" onClick={() => navigate('/register')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-center p-6">
          <ChefHat className="w-12 h-12 text-brand-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Menu Management</h3>
          <p className="text-gray-600">Easily update and organize your menu items</p>
        </div>
        <div className="text-center p-6">
          <Utensils className="w-12 h-12 text-brand-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Order Tracking</h3>
          <p className="text-gray-600">Real-time order management and tracking</p>
        </div>
        <div className="text-center p-6">
          <Clock className="w-12 h-12 text-brand-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reservations</h3>
          <p className="text-gray-600">Handle reservations with ease</p>
        </div>
      </motion.div>
    </div>
  );
}