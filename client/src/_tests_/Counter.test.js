import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Counter from '../components/Counter';

describe('Counter', () => {
  it('starts at 0 and increments/decrements correctly', () => {
    render(<Counter />);
    const countEl = screen.getByRole('heading', { level: 1 });
    const incButton = screen.getByText('+');
    const decButton = screen.getByText('-');
    
    expect(countEl).toHaveTextContent('0');
    
    fireEvent.click(incButton);
    expect(countEl).toHaveTextContent('1');
    
    fireEvent.click(decButton);
    fireEvent.click(decButton);
    expect(countEl).toHaveTextContent('-1');
  });
});
