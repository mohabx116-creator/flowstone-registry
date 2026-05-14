import { apiRequest } from './api-client';
import { getStoredToken } from './auth-storage';

export type HoldingStatus = 'ACTIVE' | 'LOCKED' | 'RELEASED';

export type HoldingAsset = {
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

export type HoldingUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
};

export type Holding = {
    id: string;
    userId: string;
    assetId: string;
    units: number;
    ownershipPercentage: number;
    status: HoldingStatus;
    acquiredAt: string;
    createdAt: string;
    updatedAt: string;
    asset?: HoldingAsset;
    user?: HoldingUser;
};

function requireToken() {
    const token = getStoredToken();

    if (!token) {
        throw new Error('Missing authentication token');
    }

    return token;
}

export function getHoldings() {
    return apiRequest<Holding[]>('/holdings', {
        method: 'GET',
        token: requireToken(),
    });
}

export function getMyHoldings() {
    return apiRequest<Holding[]>('/holdings/my', {
        method: 'GET',
        token: requireToken(),
    });
}

export function getHoldingById(id: string) {
    return apiRequest<Holding>(`/holdings/${id}`, {
        method: 'GET',
        token: requireToken(),
    });
}