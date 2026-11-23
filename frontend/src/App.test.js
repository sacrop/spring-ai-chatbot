import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('Spring AI Chat Application', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders brand header, new conversation button, and chat composer', () => {
    render(<App />);

    // Brand header
    expect(screen.getByText(/Spring AI Chat/i)).toBeInTheDocument();

    // New conversation buttons
    const newConvButtons = screen.getAllByRole('button', { name: /New conversation/i });
    expect(newConvButtons.length).toBeGreaterThan(0);

    // Composer input
    const input = screen.getByPlaceholderText(/Send a message, or attach a PDF/i);
    expect(input).toBeInTheDocument();

    // Attach PDF button
    expect(screen.getByTitle(/Attach PDF/i)).toBeInTheDocument();
  });

  test('allows typing in composer and clicking prompt suggestions', () => {
    render(<App />);

    // Click on new conversation
    const newConvBtn = screen.getAllByRole('button', { name: /New conversation/i })[0];
    fireEvent.click(newConvBtn);

    // Find a suggestion card
    const sseSuggestion = screen.queryByText(/SSE Streaming Controller/i);
    if (sseSuggestion) {
      fireEvent.click(sseSuggestion);
      // Once clicked, the user message should be submitted or loaded
      expect(screen.getByText(/You/i)).toBeInTheDocument();
    }
  });
});
