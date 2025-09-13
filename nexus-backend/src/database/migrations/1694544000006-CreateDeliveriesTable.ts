import { type MigrationInterface, type QueryRunner, Table } from 'typeorm';

export class CreateDeliveriesTable1694544000006 implements MigrationInterface {
  name = 'CreateDeliveriesTable1694544000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums para status de entrega
    await queryRunner.query(`
      CREATE TYPE "delivery_status_enum" AS ENUM (
        'pending',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'failed',
        'cancelled',
        'returned'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "delivery_priority_enum" AS ENUM (
        'low',
        'normal',
        'high',
        'urgent',
        'express'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "delivery_type_enum" AS ENUM (
        'standard',
        'express',
        'same_day',
        'scheduled',
        'fragile',
        'dangerous',
        'refrigerated',
        'oversized'
      )
    `);

    // Criar tabela deliveries
    await queryRunner.createTable(
      new Table({
        name: 'deliveries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tracking_number',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
            comment: 'Número único de rastreamento da entrega',
          },
          {
            name: 'route_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID da rota associada à entrega',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID do cliente que solicita a entrega',
          },
          {
            name: 'driver_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do motorista responsável pela entrega',
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do veículo utilizado na entrega',
          },
          {
            name: 'pickup_address',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Endereço completo de coleta',
          },
          {
            name: 'pickup_coordinates',
            type: 'point',
            isNullable: true,
            comment: 'Coordenadas geográficas de coleta (lat, lng)',
          },
          {
            name: 'delivery_address',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Endereço completo de entrega',
          },
          {
            name: 'delivery_coordinates',
            type: 'point',
            isNullable: true,
            comment: 'Coordenadas geográficas de entrega (lat, lng)',
          },
          {
            name: 'recipient_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nome do destinatário',
          },
          {
            name: 'recipient_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Telefone do destinatário',
          },
          {
            name: 'recipient_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Email do destinatário',
          },
          {
            name: 'package_description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada do pacote',
          },
          {
            name: 'package_weight_kg',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
            comment: 'Peso do pacote em quilogramas',
          },
          {
            name: 'package_volume_m3',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
            comment: 'Volume do pacote em metros cúbicos',
          },
          {
            name: 'package_dimensions',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
            comment: 'Dimensões do pacote (comprimento, largura, altura)',
          },
          {
            name: 'declared_value',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: 'Valor declarado do item para seguro',
          },
          {
            name: 'delivery_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Taxa de entrega cobrada',
          },
          {
            name: 'type',
            type: 'delivery_type_enum',
            isNullable: false,
            default: "'standard'",
            comment: 'Tipo de entrega',
          },
          {
            name: 'priority',
            type: 'delivery_priority_enum',
            isNullable: false,
            default: "'normal'",
            comment: 'Prioridade da entrega',
          },
          {
            name: 'status',
            type: 'delivery_status_enum',
            isNullable: false,
            default: "'pending'",
            comment: 'Status atual da entrega',
          },
          {
            name: 'scheduled_pickup_time',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Horário agendado para coleta',
          },
          {
            name: 'scheduled_delivery_time',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Horário agendado para entrega',
          },
          {
            name: 'actual_pickup_time',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Horário real de coleta',
          },
          {
            name: 'actual_delivery_time',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Horário real de entrega',
          },
          {
            name: 'estimated_delivery_time',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Estimativa de horário de entrega',
          },
          {
            name: 'delivery_window_start',
            type: 'time',
            isNullable: true,
            comment: 'Início da janela de entrega',
          },
          {
            name: 'delivery_window_end',
            type: 'time',
            isNullable: true,
            comment: 'Fim da janela de entrega',
          },
          {
            name: 'special_instructions',
            type: 'text',
            isNullable: true,
            comment: 'Instruções especiais de entrega',
          },
          {
            name: 'proof_of_delivery',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
            comment: 'Comprovantes de entrega (fotos, assinaturas, etc.)',
          },
          {
            name: 'delivery_attempts',
            type: 'integer',
            isNullable: false,
            default: 0,
            comment: 'Número de tentativas de entrega',
          },
          {
            name: 'max_delivery_attempts',
            type: 'integer',
            isNullable: false,
            default: 3,
            comment: 'Número máximo de tentativas de entrega',
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo da falha de entrega',
          },
          {
            name: 'tracking_events',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
            comment: 'Histórico de eventos de rastreamento',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
            comment: 'Metadados adicionais da entrega',
          },
          {
            name: 'requires_signature',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'Indica se requer assinatura na entrega',
          },
          {
            name: 'is_fragile',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'Indica se o item é frágil',
          },
          {
            name: 'is_insured',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'Indica se a entrega está segurada',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que criou a entrega',
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que fez a última atualização',
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
            comment: 'Indica se a entrega está ativa',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data da última atualização',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data de exclusão lógica (soft delete)',
          },
        ],
        indices: [
          {
            name: 'IDX_deliveries_tracking_number',
            columnNames: ['tracking_number'],
            isUnique: true,
          },
          {
            name: 'IDX_deliveries_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_deliveries_priority',
            columnNames: ['priority'],
          },
          {
            name: 'IDX_deliveries_type',
            columnNames: ['type'],
          },
          {
            name: 'IDX_deliveries_route_id',
            columnNames: ['route_id'],
          },
          {
            name: 'IDX_deliveries_customer_id',
            columnNames: ['customer_id'],
          },
          {
            name: 'IDX_deliveries_driver_id',
            columnNames: ['driver_id'],
          },
          {
            name: 'IDX_deliveries_vehicle_id',
            columnNames: ['vehicle_id'],
          },
          {
            name: 'IDX_deliveries_scheduled_delivery_time',
            columnNames: ['scheduled_delivery_time'],
          },
          {
            name: 'IDX_deliveries_actual_delivery_time',
            columnNames: ['actual_delivery_time'],
          },
          {
            name: 'IDX_deliveries_created_at',
            columnNames: ['created_at'],
          },
          {
            name: 'IDX_deliveries_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_deliveries_status_route',
            columnNames: ['status', 'route_id'],
          },
          {
            name: 'IDX_deliveries_status_driver',
            columnNames: ['status', 'driver_id'],
          },
          {
            name: 'IDX_deliveries_active_status',
            columnNames: ['is_active', 'status'],
          },
        ],
        foreignKeys: [
          {
            name: 'FK_deliveries_route_id',
            columnNames: ['route_id'],
            referencedTableName: 'routes',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_deliveries_customer_id',
            columnNames: ['customer_id'],
            referencedTableName: 'users', // Assumindo que customers são users
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_deliveries_driver_id',
            columnNames: ['driver_id'],
            referencedTableName: 'users', // Assumindo que drivers são users
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_deliveries_vehicle_id',
            columnNames: ['vehicle_id'],
            referencedTableName: 'vehicles',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_deliveries_created_by',
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_deliveries_updated_by',
            columnNames: ['updated_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
        ],
      }),
    );

    // Criar trigger para updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_deliveries_updated_at 
        BEFORE UPDATE ON deliveries 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Criar função para gerar tracking number único
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION generate_tracking_number()
      RETURNS TRIGGER AS $$
      DECLARE
        new_tracking_number VARCHAR(100);
        year_suffix VARCHAR(2);
        unique_suffix VARCHAR(10);
      BEGIN
        -- Se tracking_number não foi fornecido, gerar automaticamente
        IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
          year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
          year_suffix := RIGHT(year_suffix, 2);
          
          -- Gerar número único baseado em timestamp e random
          unique_suffix := LPAD(
            (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT::TEXT || 
            LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
            10, '0'
          );
          
          new_tracking_number := 'NT' || year_suffix || unique_suffix;
          NEW.tracking_number := new_tracking_number;
        END IF;
        
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Criar trigger para gerar tracking number automaticamente
    await queryRunner.query(`
      CREATE TRIGGER generate_tracking_number_trigger
        BEFORE INSERT ON deliveries
        FOR EACH ROW
        EXECUTE FUNCTION generate_tracking_number()
    `);

    // Criar função para validar tentativas de entrega
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_delivery_attempts()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Validar que delivery_attempts não excede max_delivery_attempts
        IF NEW.delivery_attempts > NEW.max_delivery_attempts THEN
          RAISE EXCEPTION 'Número de tentativas de entrega (%) não pode exceder o máximo permitido (%)', 
            NEW.delivery_attempts, NEW.max_delivery_attempts;
        END IF;
        
        -- Se atingiu o máximo de tentativas e status não é 'failed', atualizar
        IF NEW.delivery_attempts >= NEW.max_delivery_attempts AND NEW.status NOT IN ('delivered', 'failed', 'cancelled') THEN
          NEW.status := 'failed';
          NEW.failure_reason := COALESCE(NEW.failure_reason, 'Máximo de tentativas de entrega atingido');
        END IF;
        
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Criar trigger para validação de tentativas
    await queryRunner.query(`
      CREATE TRIGGER validate_delivery_attempts_trigger
        BEFORE INSERT OR UPDATE ON deliveries
        FOR EACH ROW
        EXECUTE FUNCTION validate_delivery_attempts()
    `);

    // Adicionar comentários na tabela
    await queryRunner.query(`
      COMMENT ON TABLE deliveries IS 'Sistema de gerenciamento de entregas do Nexus Transit';
      COMMENT ON COLUMN deliveries.tracking_number IS 'Número único de rastreamento da entrega';
      COMMENT ON COLUMN deliveries.package_description IS 'Descrição detalhada do pacote';
      COMMENT ON COLUMN deliveries.special_instructions IS 'Instruções especiais de entrega';
      COMMENT ON COLUMN deliveries.proof_of_delivery IS 'Comprovantes de entrega (fotos, assinaturas, etc.)';
      COMMENT ON COLUMN deliveries.tracking_events IS 'Histórico de eventos de rastreamento';
      COMMENT ON COLUMN deliveries.delivery_attempts IS 'Número de tentativas de entrega';
      COMMENT ON COLUMN deliveries.failure_reason IS 'Motivo da falha de entrega';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover triggers
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS validate_delivery_attempts_trigger ON deliveries',
    );
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS generate_tracking_number_trigger ON deliveries',
    );
    await queryRunner.query('DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries');

    // Remover funções
    await queryRunner.query('DROP FUNCTION IF EXISTS validate_delivery_attempts()');
    await queryRunner.query('DROP FUNCTION IF EXISTS generate_tracking_number()');

    // Remover tabela
    await queryRunner.dropTable('deliveries');

    // Remover enums
    await queryRunner.query('DROP TYPE IF EXISTS "delivery_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "delivery_priority_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "delivery_status_enum"');
  }
}
