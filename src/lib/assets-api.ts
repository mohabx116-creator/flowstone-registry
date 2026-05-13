import { apiRequest } from './api-client';
import { getStoredToken } from './auth-storage';

export type AssetType = 'REAL_ESTATE' | 'EQUITY' | 'FIXED_INCOME' | 'COMMODITY' | 'OTHER';
export type RegistryStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type ComplianceStatus = 'VERIFIED' | 'PENDING' | 'FAILED';
export type TokenizationStatus = 'NONE' | 'PENDING' | 'TOKENIZED';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  location?: string | null;
  valuation: number;
  currency: string;
  registryStatus: RegistryStatus;
  complianceStatus: ComplianceStatus;
  tokenizationStatus: TokenizationStatus;
  createdAt: string;
  updatedAt: string;
}

export async function getAssets(): Promise<Asset[]> {
  const token = getStoredToken();
  return apiRequest<Asset[]>('/assets', {
    token,
  });
}

export async function getAssetById(id: string): Promise<Asset> {
  const token = getStoredToken();
  return apiRequest<Asset>(`/assets/${id}`, {
    token,
  });
}
