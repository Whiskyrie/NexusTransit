import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrackingTable1765305000000 implements MigrationInterface {
  name = 'CreateTrackingTable1765305000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela tracking
    await queryRunner.query(`
      CREATE TABLE "tracking" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "delivery_id" uuid NOT NULL,
        "status" character varying(50) NOT NULL,
        "event_type" character varying(50) NOT NULL,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "location_address" character varying(500),
        "city" character varying(100),
        "state" character varying(2),
        "description" text,
        "driver_name" character varying(200),
        "vehicle_plate" character varying(100),
        "event_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "metadata" jsonb,
        "is_critical" boolean NOT NULL DEFAULT false,
        "hub_name" character varying(200),
        "delivery_attempt" integer,
        "failure_reason" text,
        "estimated_delivery" TIMESTAMP,
        "received_by" character varying(100),
        "proof_url" character varying(500),
        CONSTRAINT "PK_tracking" PRIMARY KEY ("id")
      )
    `);

    // Adicionar comentários nas colunas
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."delivery_id" IS 'ID da entrega rastreada'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."status" IS 'Status atual do rastreamento'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."event_type" IS 'Tipo de evento de rastreamento'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "tracking"."latitude" IS 'Latitude da localização'`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."longitude" IS 'Longitude da localização'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."location_address" IS 'Endereço legível da localização'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "tracking"."city" IS 'Cidade'`);
    await queryRunner.query(`COMMENT ON COLUMN "tracking"."state" IS 'Estado (UF)'`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."description" IS 'Descrição ou observações do evento'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."driver_name" IS 'Nome do motorista/responsável'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "tracking"."vehicle_plate" IS 'Placa do veículo'`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."event_timestamp" IS 'Data e hora do evento'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."metadata" IS 'Metadados adicionais do evento'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."is_critical" IS 'Indica se é uma entrega crítica'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."hub_name" IS 'Hub ou centro de distribuição'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."delivery_attempt" IS 'Número da tentativa de entrega'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."failure_reason" IS 'Motivo de falha ou atraso'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."estimated_delivery" IS 'Previsão de entrega atualizada'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."received_by" IS 'Nome de quem recebeu a entrega'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tracking"."proof_url" IS 'URL da foto/assinatura de comprovação'`,
    );

    // Criar índices
    await queryRunner.query(
      `CREATE INDEX "IDX_tracking_delivery_id_created_at" ON "tracking" ("delivery_id", "created_at")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_tracking_status" ON "tracking" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_tracking_event_type" ON "tracking" ("event_type")`);

    // Adicionar foreign key para deliveries
    await queryRunner.query(`
      ALTER TABLE "tracking" 
      ADD CONSTRAINT "FK_tracking_delivery" 
      FOREIGN KEY ("delivery_id") 
      REFERENCES "deliveries"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key
    await queryRunner.query(`ALTER TABLE "tracking" DROP CONSTRAINT "FK_tracking_delivery"`);

    // Remover índices
    await queryRunner.query(`DROP INDEX "public"."IDX_tracking_event_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tracking_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tracking_delivery_id_created_at"`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE "tracking"`);
  }
}
