import { apiRequest } from './api-client';
import { getStoredToken } from './auth-storage';

export type ComplianceCheckStatus =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'REQUIRES_REVIEW';

export type UpdateComplianceCheckPayload = {
  status?: ComplianceCheckStatus;
  notes?: string;
};

export type ComplianceCheck = {
  id: string;
  transferId: string;
  checkType: string;
  status: ComplianceCheckStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

function requireToken() {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Missing authentication token');
  }
  return token;
}

export function updateComplianceCheck(
  checkId: string,
  payload: UpdateComplianceCheckPayload,
) {
  return apiRequest<ComplianceCheck>(`/compliance/${checkId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token: requireToken(),
  });
}
