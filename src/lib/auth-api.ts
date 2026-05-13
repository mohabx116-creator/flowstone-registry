import { apiRequest } from './api-client';

export type UserRole = 'ADMIN' | 'COMPLIANCE_OFFICER' | 'ISSUER' | 'INVESTOR';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token: string) {
  return apiRequest<AuthUser>('/auth/me', {
    method: 'GET',
    token,
  });
}
