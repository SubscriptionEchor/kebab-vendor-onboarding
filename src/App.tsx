import { AuthProvider } from './context/AuthContext';
import { RestaurantApplicationProvider } from './context/RestaurantApplicationContext';
import { MainLayout } from './layouts/MainLayout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VerifyPhonePage } from './pages/VerifyPhonePage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { useAuth } from './context/AuthContext';
import { LoginView } from './pages/LoginView';
import { ToastProvider } from './context/ToastContext';
import { VerifyOTPPage } from './pages/VerifyOTPPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { RestaurantRegistrationPage } from './pages/restaurant/RestaurantRegistrationPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <LoginView />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <RestaurantApplicationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/verify-phone" element={<VerifyPhonePage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LoginView />} />
          <Route
            path="/restaurants/new"
            element={
              <PrivateRoute>
                <MainLayout>
                  <RestaurantRegistrationPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <PrivateRoute>
                <MainLayout>
                  <ApplicationsPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={
              <Navigate to="/dashboard" replace />
            }
          />
        </Routes>
      </BrowserRouter>
      </RestaurantApplicationProvider>
      </ToastProvider>
    </AuthProvider>
  );

}
export default App;
