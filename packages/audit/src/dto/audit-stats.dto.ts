import { ApiProperty } from "@nestjs/swagger";
import { AuditAction, AuditCategory } from "../enums";

export class AuditStatisticsDto {
  @ApiProperty({
    description: "Total de logs no período",
    example: 1234,
  })
  totalLogs!: number;

  @ApiProperty({
    description: "Logs por ação",
    example: {
      CREATE: 450,
      UPDATE: 600,
      DELETE: 184,
    },
  })
  byAction!: Record<AuditAction, number>;

  @ApiProperty({
    description: "Logs por categoria",
    example: {
      SYSTEM: 800,
      SECURITY: 234,
      USER_ACTION: 200,
    },
  })
  byCategory!: Record<AuditCategory, number>;

  @ApiProperty({
    description: "Top 10 usuários mais ativos",
    example: [
      { userId: "abc-123", userEmail: "user@example.com", count: 150 },
      { userId: "def-456", userEmail: "admin@example.com", count: 120 },
    ],
  })
  topUsers!: Array<{
    userId: string;
    userEmail: string | null;
    count: number;
  }>;

  @ApiProperty({
    description: "Top 10 entidades mais modificadas",
    example: [
      { entityName: "Vehicle", count: 300 },
      { entityName: "Driver", count: 250 },
    ],
  })
  topEntities!: Array<{
    entityName: string;
    count: number;
  }>;

  @ApiProperty({
    description: "Tempo médio de execução em ms",
    example: 45.5,
  })
  avgExecutionTime!: number;

  @ApiProperty({
    description: "Taxa de erro (%)",
    example: 2.3,
  })
  errorRate!: number;

  @ApiProperty({
    description: "Dados agrupados por dia",
    example: [
      { date: "2024-12-20", count: 123 },
      { date: "2024-12-21", count: 156 },
    ],
  })
  dataByDay!: Array<{
    date: string;
    count: number;
  }>;

  @ApiProperty({
    description: "Período analisado",
    example: "last_7_days",
  })
  period!: string;
}
