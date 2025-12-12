/**
 * Monitoring Service Interfaces
 *
 * Interfaces for quota metrics, violations, and suspicious activity detection
 */

export interface QuotaMetrics {
  period: {
    from: Date;
    to: Date;
  };
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  topViolators: ViolatorInfo[];
  quotaUsageByEndpoint: EndpointUsage[];
  quotaUsageByUser: UserUsage[];
  quotaUsageByIP: IPUsage[];
}

export interface ViolatorInfo {
  clientId: string;
  ip: string;
  userId?: string | undefined;
  violationCount: number;
  lastViolation: Date;
  endpoints: string[];
}

export interface EndpointUsage {
  endpoint: string;
  method: string;
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  uniqueUsers: number;
  uniqueIPs: number;
}

export interface UserUsage {
  userId: string;
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  endpoints: string[];
}

export interface IPUsage {
  ip: string;
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  suspiciousActivity: boolean;
}

export interface SuspiciousActivity {
  identifier: string;
  type: "IP" | "USER" | "API_KEY";
  violationCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string[];
  detectedAt: Date;
}

// Interfaces para resultados de queries TypeORM
export interface ViolatorQueryResult {
  clientid: string;
  ip: string;
  userid: string | null;
  violationcount: string;
  lastviolation: string;
  endpoints: string[];
}

export interface EndpointQueryResult {
  endpoint: string;
  method: string;
  totalrequests: string;
  blockedrequests: string;
  uniqueusers: string;
  uniqueips: string;
}

export interface UserQueryResult {
  userid: string;
  totalrequests: string;
  blockedrequests: string;
  endpoints: string[];
}

export interface IPQueryResult {
  ip: string;
  totalrequests: string;
  blockedrequests: string;
}

export interface SuspiciousIPQueryResult {
  ip: string;
  totalrequests: string;
  blockedrequests: string;
  uniqueendpoints: string;
}

export interface SuspiciousUserQueryResult {
  userid: string;
  uniqueips: string;
  blockedrequests: string;
}

export interface DistributedAttackQueryResult {
  endpoint: string;
  uniqueips: string;
  totalrequests: string;
  blockedrequests: string;
}
