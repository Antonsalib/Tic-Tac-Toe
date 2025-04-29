import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Greeting from '../components/Greeting';

describe('Greeting', () => {
  it('should render the greeting with provided name', () => {
    render(<Greeting name="Mariam" />);
    const greetingEl = screen.getByText(/hello, mariam!/i);
    expect(greetingEl).toBeInTheDocument();
    expect(greetingEl).toHaveTextContent('Hello, Mariam!');
  });
});
