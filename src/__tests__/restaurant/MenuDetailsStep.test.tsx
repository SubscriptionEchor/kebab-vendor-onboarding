import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import { MenuDetailsStep } from '../../pages/restaurant/steps/MenuDetailsStep';
import { RestaurantApplicationProvider } from '../../context/RestaurantApplicationContext';
import { ToastProvider } from '../../context/ToastContext';
import { server } from '../../setupTests';

function renderMenuDetailsStep(onNext = vi.fn(), onBack = vi.fn()) {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <RestaurantApplicationProvider>
          <MenuDetailsStep onNext={onNext} onBack={onBack} />
        </RestaurantApplicationProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

describe('MenuDetailsStep', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders all sections correctly', () => {
    renderMenuDetailsStep();
    
    expect(screen.getByText(/Restaurant Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Restaurant Images/i)).toBeInTheDocument();
    expect(screen.getByText(/Menu Images/i)).toBeInTheDocument();
    expect(screen.getByText(/Kebab Cuisines/i)).toBeInTheDocument();
    expect(screen.getByText(/Opening Hours/i)).toBeInTheDocument();
  });

  it('loads cuisines from API', async () => {
    renderMenuDetailsStep();
    
    await waitFor(() => {
      expect(screen.getByText(/Turkish/i)).toBeInTheDocument();
      expect(screen.getByText(/Mediterranean/i)).toBeInTheDocument();
      expect(screen.getByText(/Middle Eastern/i)).toBeInTheDocument();
    });
  });

  it('validates cuisine selection', async () => {
    const onNext = vi.fn();
    renderMenuDetailsStep(onNext);
    
    // Try to submit without selecting cuisines
    const nextButton = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextButton);
    
    // Mock file upload
    const mockFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInputs = screen.getAllByLabelText(/Upload/i);
    for (const input of fileInputs) {
      fireEvent.change(input, { target: { files: [mockFile] } });
    }
    
    await waitFor(() => {
      expect(onNext).not.toHaveBeenCalled();
      expect(screen.getByText(/Please select exactly 3 cuisines/i)).toBeInTheDocument();
    });
  });

  it('handles opening hours changes', () => {
    renderMenuDetailsStep();
    
    // Toggle a day's opening status
    const mondayCheckbox = screen.getByLabelText(/Open/i);
    fireEvent.click(mondayCheckbox);
    
    // Time inputs should disappear when closed
    expect(screen.queryByDisplayValue('09:00')).not.toBeInTheDocument();
  });

  it('persists data between navigation', async () => {
    const onNext = vi.fn();
    renderMenuDetailsStep(onNext);
    
    // Select cuisines
    const cuisineButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Turkish') ||
      button.textContent?.includes('Mediterranean')
    );
    
    // Select 3 cuisines
    for (let i = 0; i < 2; i++) {
      fireEvent.click(cuisineButtons[i]);
    }
    
    // Mock file upload
    const mockFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInputs = screen.getAllByLabelText(/Upload/i);
    for (const input of fileInputs) {
      fireEvent.change(input, { target: { files: [mockFile] } });
    }
    
    // Submit form
    const nextButton = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      const savedData = JSON.parse(window.localStorage.getItem('restaurantApplication') || '{}');
      expect(savedData.cuisines.length).toBe(3);
    });
  });
});