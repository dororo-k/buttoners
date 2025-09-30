import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { redirect } from 'next/navigation';
import AuthForm from '@/features/auth/components/AuthForm';
import { loginAction } from '@/features/staff/actions';

// Mock the server action
jest.mock('@/features/staff/actions', () => ({
  loginAction: jest.fn(),
}));

// Mock next/navigation for redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('AuthForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully log in a user and redirect', async () => {
    // Mock a successful login action
    (loginAction as jest.Mock).mockResolvedValueOnce({ message: 'success', currentUser: { nickname: 'test-user' } });

    render(<AuthForm />);

    // Simulate user input
    await userEvent.type(screen.getByPlaceholderText('닉네임'), 'test-user');
    await userEvent.type(screen.getByPlaceholderText('비밀번호(숫자 4자리)'), '1234');

    // Simulate form submission
    fireEvent.submit(screen.getByRole('button', { name: /로그인/i }));

    // Wait for the login action to be called
    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledTimes(1);
      const formData = (loginAction as jest.Mock).mock.calls[0][1];
      expect(formData.get('name')).toBe('test-user');
      expect(formData.get('password')).toBe('1234');
    });

    // Expect redirect to have been called
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('should display an error message on failed login', async () => {
    // Mock a failed login action
    (loginAction as jest.Mock).mockResolvedValueOnce({ message: '잘못된 닉네임 또는 비밀번호입니다.' });

    render(<AuthForm />);

    // Simulate user input
    await userEvent.type(screen.getByPlaceholderText('닉네임'), 'wrong-user');
    await userEvent.type(screen.getByPlaceholderText('비밀번호(숫자 4자리)'), '0000');

    // Simulate form submission
    fireEvent.submit(screen.getByRole('button', { name: /로그인/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('잘못된 닉네임 또는 비밀번호입니다.')).toBeInTheDocument();
    });

    // Expect no redirect
    expect(redirect).not.toHaveBeenCalled();
  });

  it('should show loading state during login', async () => {
    // Mock login action to return a pending promise
    (loginAction as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    render(<AuthForm />);

    // Simulate user input
    await userEvent.type(screen.getByPlaceholderText('닉네임'), 'test-user');
    await userEvent.type(screen.getByPlaceholderText('비밀번호(숫자 4자리)'), '1234');

    // Simulate form submission
    fireEvent.submit(screen.getByRole('button', { name: /로그인/i }));

    // Expect the button to be disabled and show loading text
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /로그인 중.../i })).toBeDisabled();
    });
  });
});
