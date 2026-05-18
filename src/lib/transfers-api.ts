import { apiRequest } from './api-client';
import { getStoredToken } from './auth-storage';

export type TransferStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "BLOCKED" | "EXPIRED" | "COMPLETED";
export type TransferPriority = "NORMAL" | "HIGH" | "URGENT";

export type ComplianceCheckStatus = "PENDING" | "PASSED" | "FAILED" | "REQUIRES_REVIEW";

export type ComplianceCheck = {
  id: string;
  transferId: string;
  checkType: string;
  status: ComplianceCheckStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransferUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type TransferAsset = {
  id: string;
  name: string;
  type: string;
  location?: string | null;
  valuation: number;
  currency: string;
  registryStatus: string;
  complianceStatus: string;
  tokenizationStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type TransferHolding = {
  id: string;
  userId: string;
  assetId: string;
  units: number;
  ownershipPercentage: number;
  status: "ACTIVE" | "LOCKED" | "RELEASED";
  acquiredAt: string;
  createdAt: string;
  updatedAt: string;
  asset?: TransferAsset;
  user?: TransferUser;
};

export type Transfer = {
  id: string;
  holdingId: string;
  recipientUserId?: string | null;
  units: number;
  status: TransferStatus;
  priority: TransferPriority;
  requestedAt: string;
  completedAt?: string | null;
  updatedAt: string;
  holding?: TransferHolding;
  recipient?: TransferUser | null;
  complianceChecks?: ComplianceCheck[];
};

export type CreateTransferPayload = {
  holdingId: string;
  units: number;
  recipientEmail: string;
  priority?: TransferPriority;
};

function requireToken() {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Missing authentication token');
  }
  return token;
}

export function getTransfers() {
  return apiRequest<Transfer[]>('/transfers', {
    method: 'GET',
    token: requireToken(),
  });
}

export function getTransferById(id: string) {
  return apiRequest<Transfer>(`/transfers/${id}`, {
    method: 'GET',
    token: requireToken(),
  });
}

export function createTransfer(payload: CreateTransferPayload) {
  return apiRequest<Transfer>('/transfers', {
    method: 'POST',
    body: JSON.stringify(payload),
    token: requireToken(),
  });
}

export function approveTransfer(id: string) {
  return apiRequest<Transfer>(`/transfers/${id}/approve`, {
    method: 'PATCH',
    token: requireToken(),
  });
}

export function rejectTransfer(id: string) {
  return apiRequest<Transfer>(`/transfers/${id}/reject`, {
    method: 'PATCH',
    token: requireToken(),
  });
}

export function blockTransfer(id: string) {
  return apiRequest<Transfer>(`/transfers/${id}/block`, {
    method: 'PATCH',
    token: requireToken(),
  });
}

export function completeTransfer(id: string) {
  return apiRequest<Transfer>(`/transfers/${id}/complete`, {
    method: 'PATCH',
    token: requireToken(),
  });
}
