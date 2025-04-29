import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from '../components/Modal';

describe('Modal', () => {
  it('does not render content when closed', () => {
    render(<Modal open={false}><p>Secret</p></Modal>);
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Modal open={true}><p>Secret</p></Modal>);
    const content = screen.getByText('Secret');
    expect(content).toBeVisible();
  });
});
