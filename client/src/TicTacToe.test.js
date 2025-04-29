// src/TicTacToe.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TicTacToe from './TicTacToe';
import '@testing-library/jest-dom';
import * as PlaySound from './PlaySound';

// Mock the playSound function
jest.mock('./PlaySound', () => ({
  playSound: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      aiResponse: JSON.stringify({ 
        board: [
          ["X", "", ""],
          ["O", "", ""],
          ["", "", ""]
        ] 
      }) 
    }),
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn().mockImplementation((key) => {
    if (key === 'ticTacToePlayerName') return 'TestPlayer';
    if (key === 'ticTacToeAiScores') return JSON.stringify({ X: 0, O: 0, "◼": 0, "🔺": 0, Ties: 0 });
    if (key === 'ticTacToePvpScores') return JSON.stringify({ player1: 0, player2: 0, ties: 0 });
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('TicTacToe Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case 1: Renders the game board correctly
  test('renders the Tic Tac Toe board with empty cells', () => {
    render(<TicTacToe />);
    
    // Check if the title is rendered
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
    
    // Check if there are 9 cell buttons
    const cells = screen.getAllByRole('button', { name: '' });
    expect(cells.length).toBe(9);
  });

  // Test case 2: Verify basic component rendering
  test('renders the game title and board', async () => {
    render(<TicTacToe />);
    
    // Check if the title is rendered
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
    
    // Check if there are cell buttons (without checking the exact count)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check if the game has a scoreboard section
    expect(screen.getByText(/Scores/i) || screen.getByText(/score/i)).toBeInTheDocument();
  });

  // Test case 3: Game mode can be switched to PvP
  test('can switch game mode to PvP', () => {
    render(<TicTacToe />);
    
    // Find and click the PvP mode button
    const pvpButton = screen.getByText(/Player vs Player/i);
    fireEvent.click(pvpButton);
    
    // Verify the button is now active
    expect(pvpButton).toHaveClass('active-mode');
    
    // The AI mode button should not be active
    const aiButton = screen.getByText(/Player vs AI/i);
    expect(aiButton).not.toHaveClass('active-mode');
  });

  // Test case 4: Reset game functionality works
  test('can reset the game board', async () => {
    render(<TicTacToe />);
    
    await waitFor(() => {
      expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
    });
    
    // Make a move
    const cells = screen.getAllByRole('button', { name: '' });
    fireEvent.click(cells[0]);
    
    // Find and click the End Round button
    const resetButton = screen.getByText('End Round');
    fireEvent.click(resetButton);
    
    // The board should be reset, check if all cells are empty again
    const newCells = screen.getAllByRole('button', { name: '' });
    expect(newCells.length).toBe(9);
  });

  // Test case 5: Player can select a different shape
  test('player can select a different shape', async () => {
    render(<TicTacToe />);
    
    await waitFor(() => {
      expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
    });
    
    // Find the shape selector dropdown
    const shapeSelect = screen.getByLabelText(/Choose your shape/i);
    
    // Change the shape to O
    fireEvent.change(shapeSelect, { target: { value: 'O' } });
    
    // Verify the shape changed
    expect(shapeSelect.value).toBe('O');
  });
});