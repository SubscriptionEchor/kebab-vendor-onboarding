import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import { RestaurantInfoStep } from '../../pages/restaurant/steps/RestaurantInfoStep';
import { RestaurantApplicationProvider } from '../../context/RestaurantApplicationContext';
import { ToastProvider } from '../../context/ToastContext';
import { server } from '../../setupTests';

function renderRestaurantInfoStep(onNext = vi.fn()) {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <RestaurantApplicationProvider>
          <RestaurantInfoStep onNext={onNext} />
        </RestaurantApplicationProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

describe('RestaurantInfoStep', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders form fields correctly', () => {
    renderRestaurantInfoStep();
    
    // Check required fields
    expect(screen.getByPlaceholderText(/Enter your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your business email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter phone number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter company name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter restaurant name/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const onNext = vi.fn();
    renderRestaurantInfoStep(onNext);
    
    const submitButton = screen.getByRole('button', { name: /Save & continue/i });
    fireEvent.click(submitButton);
    
    // Accept terms checkbox
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    await waitFor(() => {
      expect(onNext).not.toHaveBeenCalled();
      expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
    });
  });

  it('handles multiple owners', async () => {
    renderRestaurantInfoStep();
    
    // Enable multiple owners
    const yesRadio = screen.getByLabelText(/Yes/i);
    fireEvent.click(yesRadio);
    
    // Add owner button should appear
    const addButton = screen.getByRole('button', { name: /Add Another Owner/i });
    expect(addButton).toBeInTheDocument();
    
    // Add an owner
    fireEvent.click(addButton);
    
    // New owner form should appear
    expect(screen.getByText(/Additional Owner 1/i)).toBeInTheDocument();
  });

  it('saves form data correctly', async () => {
    const onNext = vi.fn();
    renderRestaurantInfoStep(onNext);
    
    // Fill in required fields
    await userEvent.type(screen.getByPlaceholderText(/Enter your first name/i), 'John');
    await userEvent.type(screen.getByPlaceholderText(/Enter your last name/i), 'Doe');
    await userEvent.type(screen.getByPlaceholderText(/Enter your business email/i), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Enter phone number/i), '1234567890');
    await userEvent.type(screen.getByPlaceholderText(/Enter company name/i), 'Test Company');
    await userEvent.type(screen.getByPlaceholderText(/Enter restaurant name/i), 'Test Restaurant');
    
    // Accept terms checkbox
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Save & continue/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onNext).toHaveBeenCalled();
      const savedData = JSON.parse(window.localStorage.getItem('restaurantApplication') || '{}');
      expect(savedData.restaurantName).toBe('Test Restaurant');
    });
  });
});