import * as bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

// Define mocks outside jest.mock to allow access for expect calls
const mockSet = jest.fn();
const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: jest.fn(() => ({
    exists: true,
    data: jest.fn(() => ({
      uid: 'test-uid',
      nickname: 'test-nickname',
      password: 'hashed-password',
    })),
  })),
}));
const mockWhere = jest.fn(() => ({
  limit: jest.fn(() => ({
    get: jest.fn(() => ({
      empty: false,
      docs: [
        {
          doc: 'mock-doc',
          data: jest.fn(() => ({
            uid: 'test-uid',
            nickname: 'test-nickname',
            password: 'hashed-password',
          })),
        },
      ],
    })),
  })),
}));
const mockCollection = jest.fn((collectionName) => ({
  doc: mockDoc,
  where: mockWhere,
}));

// Define mockAuth separately to be accessible for assertions
const mockAuth = {
  createUser: jest.fn(() => Promise.resolve({ uid: 'new-test-uid' })),
  createCustomToken: jest.fn(() => Promise.resolve('mock-custom-token')),
  verifySessionCookie: jest.fn(() => Promise.resolve({ uid: 'test-uid' })),
};

// Mock firebaseAdmin
jest.mock('@/lib/firebaseAdmin', () => ({
  db: {
    collection: mockCollection,
  },
  auth: mockAuth, // Use the separately defined mockAuth
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

// Mock fetch for /api/session calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: 'success' }),
  }) as any
);

// Import the module under test AFTER all mocks are defined
const { createAccountAction, loginAction, logoutAction } = require('../actions');

describe('staff actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccountAction', () => {
    it('should create an account and redirect on success', async () => {
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('nickname', 'test-nickname');
      formData.append('password', '1234');
      formData.append('phoneNumber', '010-1234-5678');
      formData.append('employmentStartDate', '2023-01-01');
      formData.append('position', 'buttoner');

      const result = await createAccountAction({ message: '' }, formData);

      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        displayName: 'test-nickname',
        password: 'hashed-password', // Firebase Auth expects hashed password for direct setting
        phoneNumber: '010-1234-5678',
      });
      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('new-test-uid');
      expect(mockSet).toHaveBeenCalled();
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith('new-test-uid');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/session',
        expect.objectContaining({ method: 'POST' })
      );
      expect(redirect).toHaveBeenCalledWith('/');
      expect(result).toEqual({ message: 'success' });
    });

    it('should return an error message if required fields are missing', async () => {
      const formData = new FormData();
      formData.append('name', 'Test User');
      // Missing nickname, password, etc.

      const result = await createAccountAction({ message: '' }, formData);

      expect(result).toEqual({ message: '모든 필수 정보를 입력해주세요.' });
      expect(mockAuth.createUser).not.toHaveBeenCalled();
    });

    // Add more test cases for error scenarios (Firebase errors, session API errors, etc.)
  });

  describe('loginAction', () => {
    it('should log in a user and redirect on success', async () => {
      const formData = new FormData();
      formData.append('name', 'test-nickname');
      formData.append('password', '1234');

      const result = await loginAction({ message: '' }, formData);

      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockWhere).toHaveBeenCalledWith('nickname', '==', 'test-nickname');
      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hashed-password');
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith('test-uid');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/session',
        expect.objectContaining({ method: 'POST' })
      );
      expect(redirect).toHaveBeenCalledWith('/');
      expect(result).toEqual({ message: 'success' });
    });

    it('should return an error message for incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const formData = new FormData();
      formData.append('name', 'test-nickname');
      formData.append('password', 'wrong-password');

      const result = await loginAction({ message: '' }, formData);

      expect(result).toEqual({ message: '비밀번호가 일치하지 않습니다.' });
      expect(redirect).not.toHaveBeenCalled();
    });

    // Add more test cases for user not found, missing fields, Firebase errors, session API errors
  });

  describe('logoutAction', () => {
    it('should log out a user and redirect to login page', async () => {
      await logoutAction();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/session',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(redirect).toHaveBeenCalledWith('/login');
    });

    // Add more test cases for error scenarios
  });
});
