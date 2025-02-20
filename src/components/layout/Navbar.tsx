import React, { useState } from 'react';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog } from '../ui/Dialog';
import { motion } from 'framer-motion';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <motion.nav
      className="border-b bg-white"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link
                to="/"
                className="flex items-center space-x-2"
              >
                <motion.img
                  src="https://vendor-onboarding-qa.kebapp-chefs.com/static/media/logo-kp.4d8a59f505edc841df24.png"
                  alt="Kebab Partners Logo"
                  className="h-8 w-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
                <span className="text-xl font-semibold font-display hover:text-brand-primary transition-colors">
                  Kebab Partners
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative group">
                  <button
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => navigate('/profile')}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-brand-primary" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">My Profile</span>
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogoutDialog(true)}
                  className="text-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <Dialog
                  isOpen={showLogoutDialog}
                  onClose={() => setShowLogoutDialog(false)}
                  title="Confirm Logout"
                  description="Are you sure you want to log out? You'll need to sign in again to access your account."
                  confirmLabel="Log Out"
                  variant="danger"
                  onConfirm={logout}
                />
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}