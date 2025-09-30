import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { redirect } from 'next/navigation';
import SignupPage from '@/app/signup/page';
import { createAccountAction } from '@/features/staff/actions';

// Mock the server action
jest.mock('@/features/staff/actions', () => ({
  createAccountAction: jest.fn(),
}));

// Mock next/navigation for redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('SignupPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully sign up a user and redirect', async () => {
    // Mock a successful signup action
    (createAccountAction as jest.Mock).mockResolvedValueOnce({ message: 'success', currentUser: { nickname: 'new-user' } });

    render(<SignupPage />);

    // Simulate user input
    await userEvent.type(screen.getByPlaceholderText('이름'), '새로운 사용자');
    await userEvent.type(screen.getByPlaceholderText('닉네임'), 'new-user');
    await userEvent.type(screen.getByPlaceholderText('비밀번호(숫자 4자리)'), '1234');
    await userEvent.type(screen.getByPlaceholderText('비밀번호 확인(숫자 4자리)'), '1234');
    await userEvent.type(screen.getByPlaceholderText('010-0000-0000'), '01012345678');
    fireEvent.change(screen.getByLabelText('입사일자'), { target: { value: '2023-01-01' } });
    fireEvent.click(screen.getByLabelText('위 내용을 확인했으며, 개인정보 수집·이용에 동의합니다.'));

    // Simulate form submission
    fireEvent.click(screen.getByRole('button', { name: /회원가입/i }));

    // Wait for the signup action to be called
    await waitFor(() => {
      expect(createAccountAction).toHaveBeenCalledTimes(1);
      const formData = (createAccountAction as jest.Mock).mock.calls[0][1];
      expect(formData.get('name')).toBe('새로운 사용자');
      expect(formData.get('nickname')).toBe('new-user');
      expect(formData.get('password')).toBe('1234');
      expect(formData.get('phoneNumber')).toBe('010-1234-5678');
      expect(formData.get('employmentStartDate')).toBe('2023-01-01');
    });

    // Expect redirect to have been called
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('should display an error message on failed signup', async () => {
    // Mock a failed signup action
    (createAccountAction as jest.Mock).mockResolvedValueOnce({ message: '이미 존재하는 닉네임입니다.' });

    render(<SignupPage />);

    // Simulate user input
    await userEvent.type(screen.getByPlaceholderText('이름'), '새로운 사용자');
    await userEvent.type(screen.getByPlaceholderText('닉네임'), 'existing-user');
    await userEvent.type(screen.getByPlaceholderText('비밀번호(숫자 4자리)'), '1234');
    await userEvent.type(screen.getByPlaceholderText('비밀번호 확인(숫자 4자리)'), '1234');
    await userEvent.type(screen.getByPlaceholderText('010-0000-0000'), '01012345678');
    fireEvent.change(screen.getByLabelText('입사일자'), { target: { value: '2023-01-01' } });
    fireEvent.click(screen.getByLabelText('위 내용을 확인했으며, 개인정보 수집·이용에 동의합니다.'));

    // Simulate form submission
    fireEvent.click(screen.getByRole('button', { name: /회원가입/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('이미 존재하는 닉네임입니다.')).toBeInTheDocument();
    });

    // Expect no redirect
    expect(redirect).not.toHaveBeenCalled();
  });

  it('should show validation errors for missing fields', async () => {
    render(<SignupPage />);

    // Simulate form submission without filling fields
    fireEvent.click(screen.getByRole('button', { name: /회원가입/i }));

    // Expect validation errors to appear (these are client-side errors from useStaffAuthForm)
    await waitFor(() => {
      expect(screen.getByText('*** 모든 필수 정보를 입력해주세요.')).toBeInTheDocument(); // This error message is from the server action, not client-side validation
    });
  });

  it('should require consent for signup', async () => {
    render(<SignupPage />);

    // Simulate user input without consent
    await userEvent.type(screen.getByPlaceholderText('이름'), '새로운 사용자');
    await userEvent.type(screen.getByPlaceholderText('닉네임'), 'new-user');
    await userEvent.type(screen.getByPlaceholderText('비밀번호(숫자 4자리)'), '1234');
    await userEvent.type(screen.getByPlaceholderText('비밀번호 확인(숫자 4자리)'), '1234');
    await userEvent.type(screen.getByPlaceholderText('010-0000-0000'), '01012345678');
    fireEvent.change(screen.getByLabelText('입사일자'), { target: { value: '2023-01-01' } });

    // Simulate form submission
    fireEvent.click(screen.getByRole('button', { name: /회원가입/i }));

    // Expect consent error to appear
    await waitFor(() => {
      expect(screen.getByText('*** 개인정보 수집·이용에 동의해야 합니다.')).toBeInTheDocument();
    });

    expect(createAccountAction).not.toHaveBeenCalled();
  });
});
