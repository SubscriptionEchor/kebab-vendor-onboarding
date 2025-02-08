import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import { DocumentsStep } from '../../pages/restaurant/steps/DocumentsStep';
import { RestaurantApplicationProvider } from '../../context/RestaurantApplicationContext';
import { ToastProvider } from '../../context/ToastContext';
import { server } from '../../setupTests';

function renderDocumentsStep(onBack = vi.fn()) {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <RestaurantApplicationProvider>
          <DocumentsStep onBack={onBack} />
        </RestaurantApplicationProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

describe('DocumentsStep', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders all document sections', () => {
    renderDocumentsStep();
    
    expect(screen.getByText(/Hospitality License/i)).toBeInTheDocument();
    expect(screen.getByText(/Registration Certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/Bank Document/i)).toBeInTheDocument();
    expect(screen.getByText(/Tax Document/i)).toBeInTheDocument();
    expect(screen.getByText(/ID Cards/i)).toBeInTheDocument();
  });

  it('validates required documents', async () => {
    renderDocumentsStep();
    
    // Try to submit without documents
    const submitButton = screen.getByRole('button', { name: /Submit Application/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please upload a Hospitality License/i)).toBeInTheDocument();
    });
  });

  it('validates bank details', async () => {
    renderDocumentsStep();
    
    // Fill in bank details
    const bicInput = screen.getByPlaceholderText(/Enter BIC\/SWIFT code/i);
    fireEvent.change(bicInput, { target: { value: 'INVALID' } });
    
    const submitButton = screen.getByRole('button', { name: /Submit Application/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid BIC\/SWIFT code/i)).toBeInTheDocument();
    });
  });

  it('handles successful submission', async () => {
    const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    renderDocumentsStep();
    
    // Mock successful file upload response
    server.use(
      http.post('https://del-qa-api.kebapp-chefs.com/upload/vendor/vendorDoc', () => {
        return HttpResponse.json({
          success: true,
          key: 'test-file-key'
        });
      })
    );
    
    // Mock file uploads
    const fileInputs = screen.getAllByLabelText(/Upload Document/i);
    for (const input of fileInputs) {
      fireEvent.change(input, { target: { files: [mockFile] } });
    }
    
    // Fill bank details
    const bankFields = [
      { placeholder: /Enter bank name/i, value: 'Test Bank' },
      { placeholder: /Enter account holder name/i, value: 'John Doe' },
      { placeholder: /Enter account number/i, value: '1234567890' },
      { placeholder: /Enter branch name/i, value: 'Main Branch' },
      { placeholder: /Enter BIC\/SWIFT code/i, value: 'DEUTDEFF' },
    ];
    
    for (const field of bankFields) {
      const input = screen.getByPlaceholderText(field.placeholder);
      fireEvent.change(input, { target: { value: field.value } });
    }
    
    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    // Mock successful application submission
    server.use(
      http.post('https://del-qa-api.kebapp-chefs.com/graphql', () => {
        return HttpResponse.json({
          data: {
            createRestaurantOnboardingApplication: {
              _id: 'test-id',
              applicationStatus: 'PENDING',
              restaurantName: 'Test Restaurant',
              createdAt: new Date().toISOString()
            }
          }
        });
      })
    );
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Application/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Application Submitted!/i)).toBeInTheDocument();
    });
  });
});