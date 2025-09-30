// next/navigation의 redirect 함수를 모의(mock)합니다.
// 테스트 중에 실제 리디렉션이 발생하지 않도록 합니다.
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Provide a safe mock for Next.js headers/cookies in non-request tests
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Mock experimental React DOM form hooks used in App Router during tests
jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    useFormState: (action, initialState) => {
      const wrapped = async (...args) => action(initialState, ...args);
      return [initialState, wrapped];
    },
    useFormStatus: () => ({ pending: false, data: null, method: 'post', action: null }),
  };
});

// Load minimal env from .env.local without external deps
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^\"]*)"?\s*$/i);
      if (m) {
        const key = m[1];
        const val = m[2];
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
} catch {}
