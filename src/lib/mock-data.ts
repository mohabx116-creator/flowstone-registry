export type TransferStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "blocked"
  | "expired"
  | "completed";

export type Priority = "high" | "medium" | "low";

export interface Transfer {
  id: string;
  asset: string;
  assetType: string;
  seller: string;
  buyer: string;
  value: number;
  status: TransferStatus;
  priority: Priority;
  createdAt: string;
  settlement: string;
}

export const transfers: Transfer[] = [
  {
    id: "TX-2048-A91",
    asset: "Manhattan Sky Tower B-4",
    assetType: "Real Estate",
    seller: "Sterling Capital Partners",
    buyer: "Atlas Sovereign Fund",
    value: 12_450_000,
    status: "pending",
    priority: "high",
    createdAt: "2025-05-09T10:24:00Z",
    settlement: "Atomic DvP",
  },
  {
    id: "TX-2049-B12",
    asset: "Growth Alpha Fund III",
    assetType: "Private Equity",
    seller: "Northbridge Holdings",
    buyer: "Meridian Pension Trust",
    value: 4_200_000,
    status: "approved",
    priority: "medium",
    createdAt: "2025-05-08T14:02:00Z",
    settlement: "T+1 Bilateral",
  },
  {
    id: "TX-2050-C77",
    asset: "Corporate Series B Debt",
    assetType: "Debt",
    seller: "Halcyon Credit",
    buyer: "Ironwood Asset Mgmt",
    value: 8_900_000,
    status: "completed",
    priority: "low",
    createdAt: "2025-05-07T08:45:00Z",
    settlement: "Atomic DvP",
  },
  {
    id: "TX-2051-D03",
    asset: "Singapore Marina Logistics Hub",
    assetType: "Real Estate",
    seller: "Pacific Yield Trust",
    buyer: "Atlas Sovereign Fund",
    value: 22_800_000,
    status: "pending",
    priority: "high",
    createdAt: "2025-05-09T07:11:00Z",
    settlement: "Atomic DvP",
  },
  {
    id: "TX-2052-E18",
    asset: "Renewables Yield Note 2031",
    assetType: "Debt",
    seller: "Helios Infrastructure",
    buyer: "Verde Capital",
    value: 6_350_000,
    status: "rejected",
    priority: "medium",
    createdAt: "2025-05-06T12:00:00Z",
    settlement: "Bilateral",
  },
  {
    id: "TX-2053-F44",
    asset: "Geneva Vault Gold Series 7",
    assetType: "Commodities",
    seller: "Helvetia Custody",
    buyer: "Atlas Sovereign Fund",
    value: 3_180_000,
    status: "blocked",
    priority: "high",
    createdAt: "2025-05-05T16:30:00Z",
    settlement: "Atomic DvP",
  },
  {
    id: "TX-2054-G91",
    asset: "Tokyo Prime Office Tranche II",
    assetType: "Real Estate",
    seller: "Sakura REIT",
    buyer: "Northbridge Holdings",
    value: 14_750_000,
    status: "expired",
    priority: "low",
    createdAt: "2025-04-28T09:00:00Z",
    settlement: "T+2 Bilateral",
  },
];

export interface Holding {
  id: string;
  name: string;
  type: string;
  registryId: string;
  units: number;
  registryStatus: "Registered" | "Under Review";
  complianceStatus: "Cleared" | "Flagged";
  eligibility: "Eligible" | "Locked";
  value: number;
}

export const holdings: Holding[] = [
  {
    id: "HLD-001",
    name: "Manhattan Sky Tower B-4",
    type: "Real Estate",
    registryId: "REG-NY-2048-A91",
    units: 12_500,
    registryStatus: "Registered",
    complianceStatus: "Cleared",
    eligibility: "Eligible",
    value: 12_450_000,
  },
  {
    id: "HLD-002",
    name: "Growth Alpha Fund III",
    type: "Private Equity",
    registryId: "REG-PE-2049-B12",
    units: 4_200,
    registryStatus: "Registered",
    complianceStatus: "Cleared",
    eligibility: "Eligible",
    value: 4_200_000,
  },
  {
    id: "HLD-003",
    name: "Singapore Marina Logistics Hub",
    type: "Real Estate",
    registryId: "REG-SG-2051-D03",
    units: 22_800,
    registryStatus: "Under Review",
    complianceStatus: "Flagged",
    eligibility: "Locked",
    value: 22_800_000,
  },
];

export interface TokenizedAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  price: number;
  change: number;
  supply: string;
  settlement: "Live" | "Settling" | "Paused";
}

export const tokenized: TokenizedAsset[] = [
  {
    id: "TKN-001",
    symbol: "MST.B4",
    name: "Manhattan Sky Tower B-4",
    type: "Real Estate",
    price: 1024.4,
    change: 1.42,
    supply: "12,500 / 20,000",
    settlement: "Live",
  },
  {
    id: "TKN-002",
    symbol: "GAF.III",
    name: "Growth Alpha Fund III",
    type: "Private Equity",
    price: 512.18,
    change: -0.32,
    supply: "4,200 / 10,000",
    settlement: "Live",
  },
  {
    id: "TKN-003",
    symbol: "RYN.31",
    name: "Renewables Yield Note 2031",
    type: "Debt",
    price: 98.62,
    change: 0.08,
    supply: "63,500 / 100,000",
    settlement: "Settling",
  },
  {
    id: "TKN-004",
    symbol: "GVG.7",
    name: "Geneva Vault Gold Series 7",
    type: "Commodities",
    price: 318.5,
    change: 0.74,
    supply: "31,800 / 50,000",
    settlement: "Live",
  },
];

export const complianceAlerts = [
  {
    id: "CA-001",
    title: "KYC re-verification required",
    entity: "Atlas Sovereign Fund",
    severity: "medium" as Priority,
  },
  {
    id: "CA-002",
    title: "Sanctions list update — review counterparty",
    entity: "Helvetia Custody",
    severity: "high" as Priority,
  },
  {
    id: "CA-003",
    title: "Beneficial owner disclosure pending",
    entity: "Verde Capital",
    severity: "low" as Priority,
  },
];

export function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
