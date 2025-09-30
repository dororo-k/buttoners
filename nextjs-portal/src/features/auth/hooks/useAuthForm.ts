import { useState } from 'react';
import { useFormState } from 'react-dom';
import { createAccountAction, loginAction } from '@/features/staff/actions';
import type { Account, RegistrationPayload } from '@/features/staff/hooks/useStaffSession';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'signup';

const fieldLabels = {
  buttonerType: '버트너/관리자',
  name: '이름',
  nickname: '닉네임',
  password: '비밀번호',
  password2: '비밀번호 확인',
  phone: '휴대폰번호',
  joinDate: '입사일자',
} as const;

export function useAuthForm(mode: AuthMode) {
  const router = useRouter();
  const [form, setForm] = useState<{
    buttonerType: 'new' | 'experienced';
    name: string;
    nickname: string;
    password: string;
    password2: string;
    adminConfirm: string;
    phone: string;
    joinDate: string;
    consent: boolean;
  }>({
    buttonerType: 'new',
    name: '',
    nickname: '',
    password: '',
    password2: '',
    adminConfirm: '',
    phone: '',
    joinDate: '',
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [signupState, signupAction] = useFormState(createAccountAction, { message: '' });
  const [loginState, loginActionForm] = useFormState(loginAction, { message: '' });

  const validate = () => {
    // Minimal placeholder validation to satisfy type-checking
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '');
    if (d.startsWith('02')) {
      return [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10)].filter(Boolean).join('-');
    }
    return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 11)].filter(Boolean).join('-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    if (mode === 'signup') {
      signupAction(formData);
    } else if (mode === 'login') {
      loginActionForm(formData);
    }
  };

  return { form, errors, handleChange, handleSubmit, formatPhone, setForm, signupState, loginState };
}
