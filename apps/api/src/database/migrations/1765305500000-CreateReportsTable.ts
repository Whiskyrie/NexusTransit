import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportsTable1765305500000 implements MigrationInterface {
  name = 'CreateReportsTable1765305500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela reports
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "name" character varying(100) NOT NULL,
        "type" character varying(50) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'PENDING',
        "format" character varying(50) NOT NULL,
        "period" character varying(50),
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "requested_by" uuid NOT NULL,
        "requested_by_name" character varying(200),
        "description" text,
        "filters" jsonb,
        "settings" jsonb,
        "file_url" character varying(500),
        "file_name" character varying(255),
        "file_size" bigint,
        "processing_started_at" TIMESTAMP,
        "processing_completed_at" TIMESTAMP,
        "processing_duration_ms" integer,
        "error_message" text,
        "error_details" jsonb,
        "records_count" integer NOT NULL DEFAULT 0,
        "is_scheduled" boolean NOT NULL DEFAULT false,
        "schedule_cron" character varying(100),
        "next_execution" TIMESTAMP,
        "expires_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "download_count" integer NOT NULL DEFAULT 0,
        "last_downloaded_at" TIMESTAMP,
        CONSTRAINT "PK_reports" PRIMARY KEY ("id")
      )
    `);

    // Adicionar comentários nas colunas
    await queryRunner.query(`COMMENT ON COLUMN "reports"."name" IS 'Nome/título do relatório'`);
    await queryRunner.query(`COMMENT ON COLUMN "reports"."type" IS 'Tipo do relatório'`);
    await queryRunner.query(`COMMENT ON COLUMN "reports"."status" IS 'Status do relatório'`);
    await queryRunner.query(`COMMENT ON COLUMN "reports"."format" IS 'Formato de exportação'`);
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."period" IS 'Período pré-definido do relatório'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."start_date" IS 'Data inicial do período customizado'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."end_date" IS 'Data final do período customizado'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."requested_by" IS 'ID do usuário que solicitou o relatório'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."requested_by_name" IS 'Nome do usuário que solicitou'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."description" IS 'Descrição ou observações do relatório'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."filters" IS 'Filtros aplicados no relatório'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."settings" IS 'Configurações adicionais do relatório'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "reports"."file_url" IS 'URL do arquivo gerado'`);
    await queryRunner.query(`COMMENT ON COLUMN "reports"."file_name" IS 'Nome do arquivo gerado'`);
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."file_size" IS 'Tamanho do arquivo em bytes'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."processing_started_at" IS 'Data de início do processamento'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."processing_completed_at" IS 'Data de conclusão do processamento'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."processing_duration_ms" IS 'Tempo de processamento em milissegundos'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."error_message" IS 'Mensagem de erro (se houver)'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "reports"."error_details" IS 'Detalhes do erro'`);
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."records_count" IS 'Número de registros incluídos no relatório'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."is_scheduled" IS 'Se o relatório está agendado'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."schedule_cron" IS 'Expressão cron para agendamento'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."next_execution" IS 'Próxima execução agendada'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."expires_at" IS 'Data de expiração do arquivo'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."is_active" IS 'Se o relatório está ativo'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."download_count" IS 'Número de downloads do relatório'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reports"."last_downloaded_at" IS 'Data do último download'`,
    );

    // Criar índices
    await queryRunner.query(`CREATE INDEX "IDX_reports_name" ON "reports" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_type" ON "reports" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_status" ON "reports" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_requested_by" ON "reports" ("requested_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_processing_started_at" ON "reports" ("processing_started_at")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_reports_expires_at" ON "reports" ("expires_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_expires_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_processing_started_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_requested_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_name"`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE "reports"`);
  }
}
