import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { loginAction, createAccountAction } from '../actions';

type AuthMode = 'login' | 'signup';

const fieldLabels = {
  name: '이름',
  nickname: '닉네임',
  password: '비밀번호',
  password2: '비밀번호 확인',
  phone: '휴대폰번호',
  joinDate: '입사일자',
} as const;

export function useStaffAuthForm(mode: AuthMode) {
  const [signupState, signupAction] = useFormState(createAccountAction, { message: '' });
  const [loginState, loginActionForm] = useFormState(loginAction, { message: '' });

  const [form, setForm] = useState({ // Only for controlled inputs
    name: '',
    nickname: '',
    password: '',
    password2: '',
    phone: '',
    joinDate: '',
    consent: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '');
    if (d.startsWith('02')) {
      return [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10)].filter(Boolean).join('-');
    }
    return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 11)].filter(Boolean).join('-');
  };

  return {
    form,
    handleChange,
    formatPhone,
    setForm,
    signupState,
    signupAction,
    loginState,
    loginActionForm,
  };
}
