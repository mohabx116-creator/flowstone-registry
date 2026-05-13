import { redirect } from '@tanstack/react-router';
import { isAuthenticated } from './auth-storage';

export function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({
      to: '/',
    });
  }
}