import { AuthProvider } from './context/AuthContext';
import { RestaurantApplicationProvider } from './context/RestaurantApplicationContext';
import { MainLayout } from './layouts/MainLayout';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { VerifyPhonePage } from './pages/VerifyPhonePage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { useAuth } from './context/AuthContext';
import { LoginView } from './pages/LoginView';
import { ToastProvider } from './context/ToastContext';
import { VerifyOTPPage } from './pages/VerifyOTPPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { RestaurantRegistrationPage } from './pages/restaurant/RestaurantRegistrationPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginView />} />
            <Route path="/verify-phone" element={<VerifyPhonePage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute><RestaurantApplicationProvider><MainLayout /></RestaurantApplicationProvider></PrivateRoute>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/restaurants/new" element={<RestaurantRegistrationPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
            </Route>
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );

}
export default App;
