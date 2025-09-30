export interface User {
  id: string;
  name: string;
  role: 'staff' | 'manager';
  createdAt: string; // ISO string
}

export interface Account {
  uid: string;
  email?: string; // Made optional for registration
  password?: string; // Assuming password might be optional in some contexts
  nickname: string;
  name: string;
  phoneNumber?: string;
  employmentStartDate?: string;
  position: string;
  points?: number; // Made optional for registration
  favorites?: string[];
  exp?: number; // Made optional for registration
  adminConfirm?: string; // Added for admin registration
}

