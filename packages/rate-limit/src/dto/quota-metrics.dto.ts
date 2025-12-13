import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO de métricas de quota
 */
export class QuotaMetricsDto {
  @ApiProperty({
    description: "Período das métricas",
    example: {
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-01T01:00:00Z",
    },
  })
  period!: {
    from: Date;
    to: Date;
  };

  @ApiProperty({
    description: "Total de requests no período",
    example: 10000,
  })
  totalRequests!: number;

  @ApiProperty({
    description: "Requests bloqueados no período",
    example: 150,
  })
  blockedRequests!: number;

  @ApiProperty({
    description: "Taxa de bloqueio em porcentagem",
    example: 1.5,
  })
  blockRate!: number;

  @ApiProperty({
    description: "Top violadores",
    type: "array",
    example: [
      {
        clientId: "abc123",
        ip: "192.168.1.1",
        userId: "123e4567-e89b-12d3-a456-426614174000",
        violationCount: 25,
        lastViolation: "2024-01-01T00:30:00Z",
        endpoints: ["/api/users", "/api/orders"],
      },
    ],
  })
  topViolators!: {
    clientId: string;
    ip: string;
    userId?: string | undefined;
    violationCount: number;
    lastViolation: Date;
    endpoints: string[];
  }[];

  @ApiProperty({
    description: "Uso de quota por endpoint",
    type: "array",
    example: [
      {
        endpoint: "/api/users",
        method: "GET",
        totalRequests: 5000,
        blockedRequests: 50,
        blockRate: 1.0,
        uniqueUsers: 100,
        uniqueIPs: 150,
      },
    ],
  })
  quotaUsageByEndpoint!: {
    endpoint: string;
    method: string;
    totalRequests: number;
    blockedRequests: number;
    blockRate: number;
    uniqueUsers: number;
    uniqueIPs: number;
  }[];

  @ApiProperty({
    description: "Uso de quota por usuário",
    type: "array",
    example: [
      {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        totalRequests: 500,
        blockedRequests: 10,
        blockRate: 2.0,
        endpoints: ["/api/users", "/api/orders"],
      },
    ],
  })
  quotaUsageByUser!: {
    userId: string;
    totalRequests: number;
    blockedRequests: number;
    blockRate: number;
    endpoints: string[];
  }[];

  @ApiProperty({
    description: "Uso de quota por IP",
    type: "array",
    example: [
      {
        ip: "192.168.1.1",
        totalRequests: 300,
        blockedRequests: 15,
        blockRate: 5.0,
        suspiciousActivity: false,
      },
    ],
  })
  quotaUsageByIP!: {
    ip: string;
    totalRequests: number;
    blockedRequests: number;
    blockRate: number;
    suspiciousActivity: boolean;
  }[];
}
