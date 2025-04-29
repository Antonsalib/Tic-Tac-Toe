import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../components/LoginForm';

describe('LoginForm', () => {
  it('calls onSubmit with username and password when submitted', () => {
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'mariam123' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      username: 'mariam123',
      password: 'secret!',
    });
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
