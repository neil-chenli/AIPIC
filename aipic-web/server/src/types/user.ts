export interface User {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  role: 'owner' | 'member';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  username: string;
  email?: string;
  password: string;
  role?: 'owner' | 'member';
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

