import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders calculator display and buttons', () => {
  render(<App />);
  expect(screen.getByRole('region', { name: /Calculator Panel/i })).toBeInTheDocument();
  expect(screen.getByText('0')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Input 7/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Action C/i })).toBeInTheDocument();
});

test('performs a basic addition', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Input 7/i }));
  fireEvent.click(screen.getByRole('button', { name: /Input \+/i }));
  fireEvent.click(screen.getByRole('button', { name: /Input 3/i }));
  fireEvent.click(screen.getByRole('button', { name: /Action =/i }));
  // Result appears in expression/result
  expect(screen.getAllByText('10').length).toBeGreaterThan(0);
});
