import type { AuthUser } from './auth-api';

export const TOKEN_STORAGE_KEY = 'flowstone_token';
export const USER_STORAGE_KEY = 'flowstone_user';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredAuth(token: string, user: AuthUser) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function isAuthenticated() {
  return Boolean(getStoredToken() && getStoredUser());
}