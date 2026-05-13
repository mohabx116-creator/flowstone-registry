import type { AuthUser } from './auth-api';

export const TOKEN_STORAGE_KEY = 'flowstone_token';
export const USER_STORAGE_KEY = 'flowstone_user';

export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);

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
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
}

export function isAuthenticated() {
    return Boolean(getStoredToken() && getStoredUser());
}