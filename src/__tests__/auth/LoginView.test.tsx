import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import { LoginView } from '../../pages/LoginView';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import { server } from '../../setupTests';

function renderLoginView() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <LoginView />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('LoginView', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders login form correctly', () => {
    renderLoginView();
    
    expect(screen.getByText(/Welcome to Kebab Partners/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter phone number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Code/i })).toBeInTheDocument();
  });

  it('validates phone number input', async () => {
    renderLoginView();
    
    const phoneInput = screen.getByPlaceholderText(/Enter phone number/i);
    const submitButton = screen.getByRole('button', { name: /Send Code/i });

    // Test invalid phone number
    await userEvent.type(phoneInput, '123');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid phone number/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    renderLoginView();
    
    const phoneInput = screen.getByPlaceholderText(/Enter phone number/i);
    const submitButton = screen.getByRole('button', { name: /Send Code/i });

    // Test valid German phone number
    await userEvent.type(phoneInput, '1234567890');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(window.localStorage.getItem('authToken')).toBeTruthy();
    });
  });

  it('handles network errors', async () => {
    // Mock failed API call
    server.use(
      http.post('https://del-qa-api.kebapp-chefs.com/graphql', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    renderLoginView();
    
    const phoneInput = screen.getByPlaceholderText(/Enter phone number/i);
    const submitButton = screen.getByRole('button', { name: /Send Code/i });

    await userEvent.type(phoneInput, '1234567890');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to send verification code/i)).toBeInTheDocument();
    });
  });
});