import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from '../components/TodoList';

describe('TodoList', () => {
  it('allows users to add and remove todos', () => {
    render(<TodoList />);
    const input = screen.getByPlaceholderText(/add new todo/i);
    const addButton = screen.getByText(/add/i);

    fireEvent.change(input, { target: { value: 'Write tests' } });
    fireEvent.click(addButton);
    expect(screen.getByText('Write tests')).toBeInTheDocument();

    // remove the todo
    fireEvent.click(screen.getByRole('button', { name: /remove write tests/i }));
    expect(screen.queryByText('Write tests')).not.toBeInTheDocument();
  });
});
