import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Migration para implementar particionamento da tabela tracking_events por mês
 *
 * Esta estratégia melhora a performance de consultas e facilita o arquivamento
 * de dados históricos. Eventos são particionados por timestamp (mês).
 */

interface ExistsResult {
  exists: boolean;
}

interface CountResult {
  count: number;
}

interface PartitionInfo {
  name: string;
  start: string;
  end: string;
}

export class PartitionTrackingEvents1734574800000 implements MigrationInterface {
  name = 'PartitionTrackingEvents1734574800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Nota: Esta migration requer que a tabela tracking_events esteja vazia ou
    // que os dados sejam migrados manualmente. Para produção, criar um script
    // de migração de dados separado.

    // 0. Verificar se a tabela original existe
    const tableExistsResult = (await queryRunner.query(`
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'tracking_events'
  ) as exists
`)) as ExistsResult[];

    const tableExists = tableExistsResult[0]?.exists ?? false;

    if (!tableExists) {
      throw new Error(
        'Tabela tracking_events não encontrada. Execute a migration de criação primeiro.',
      );
    }

    // 1. Renomear tabela existente para backup temporário
    await queryRunner.query(`
      ALTER TABLE tracking_events RENAME TO tracking_events_old
    `);

    // 2. Criar nova tabela particionada
    await queryRunner.query(`
      CREATE TABLE tracking_events (
        event_id UUID NOT NULL,
        delivery_id UUID NOT NULL,
        route_id UUID,
        driver_id UUID,
        event_type event_type_enum NOT NULL,
        event_status event_status_enum NOT NULL DEFAULT 'SUCCESS',
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        location geometry(Point, 4326),
        location_address VARCHAR(500),
        accuracy DECIMAL(10, 2),
        speed DECIMAL(10, 2),
        battery_level INTEGER,
        notes TEXT,
        metadata JSONB,
        is_automatic BOOLEAN NOT NULL DEFAULT false,
        created_by_user_id UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        PRIMARY KEY (event_id, timestamp)
      ) PARTITION BY RANGE (timestamp)
    `);

    // 3. Criar partições para os últimos 3 meses e próximos 3 meses
    const now = new Date();
    const partitions: PartitionInfo[] = [];

    // Gerar partições
    for (let i = -3; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const nextMonth = new Date(year, date.getMonth() + 1, 1);
      const nextYear = nextMonth.getFullYear();
      const nextMonthStr = String(nextMonth.getMonth() + 1).padStart(2, '0');

      partitions.push({
        name: `tracking_events_${year}_${month}`,
        start: `${year}-${month}-01`,
        end: `${nextYear}-${nextMonthStr}-01`,
      });
    }

    // Criar partições
    for (const partition of partitions) {
      await queryRunner.query(
        `CREATE TABLE ${this.escapeIdentifier(partition.name)} PARTITION OF tracking_events
         FOR VALUES FROM ('${partition.start}') TO ('${partition.end}')`,
      );
    }

    // 4. Criar índices em cada partição
    for (const partition of partitions) {
      await this.createPartitionIndexes(queryRunner, partition.name);
    }

    // 5. Recriar foreign keys (serão aplicadas a todas as partições)
    await queryRunner.query(`
      ALTER TABLE tracking_events
      ADD CONSTRAINT fk_tracking_events_delivery
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE tracking_events
      ADD CONSTRAINT fk_tracking_events_route
      FOREIGN KEY (route_id) REFERENCES routes(id)
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE tracking_events
      ADD CONSTRAINT fk_tracking_events_driver
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
      ON DELETE RESTRICT
    `);

    // 6. Criar schema para arquivos (deve vir antes das funções que o usam)
    await queryRunner.query(`
      CREATE SCHEMA IF NOT EXISTS archive
    `);

    // 7. Criar função para criação automática de partições futuras
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_tracking_events_partition()
      RETURNS VOID AS $$
      DECLARE
        next_month_start DATE;
        next_month_end DATE;
        partition_name TEXT;
      BEGIN
        next_month_start := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
        next_month_end := next_month_start + INTERVAL '1 month';
        partition_name := 'tracking_events_' || TO_CHAR(next_month_start, 'YYYY_MM');
        
        -- Verificar se partição já existe
        IF NOT EXISTS (
          SELECT 1 FROM pg_tables 
          WHERE tablename = partition_name
        ) THEN
          EXECUTE format(
            'CREATE TABLE %I PARTITION OF tracking_events FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            next_month_start,
            next_month_end
          );
          
          -- Criar índices na nova partição
          EXECUTE format('CREATE INDEX idx_%I_delivery_id ON %I (delivery_id)', partition_name, partition_name);
          EXECUTE format('CREATE INDEX idx_%I_route_id ON %I (route_id) WHERE route_id IS NOT NULL', partition_name, partition_name);
          EXECUTE format('CREATE INDEX idx_%I_driver_id ON %I (driver_id) WHERE driver_id IS NOT NULL', partition_name, partition_name);
          EXECUTE format('CREATE INDEX idx_%I_event_type ON %I (event_type)', partition_name, partition_name);
          EXECUTE format('CREATE INDEX idx_%I_timestamp ON %I (timestamp DESC)', partition_name, partition_name);
          EXECUTE format('CREATE INDEX idx_%I_location ON %I USING GIST (location) WHERE location IS NOT NULL', partition_name, partition_name);
          EXECUTE format('CREATE INDEX idx_%I_delivery_timestamp ON %I (delivery_id, timestamp DESC)', partition_name, partition_name);
          
          RAISE NOTICE 'Partição criada: %', partition_name;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 8. Criar função para arquivamento de partições antigas (> 6 meses)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION archive_old_tracking_partitions()
      RETURNS VOID AS $$
      DECLARE
        partition_record RECORD;
        archive_threshold DATE;
        partition_date DATE;
        partition_date_str TEXT;
      BEGIN
        archive_threshold := DATE_TRUNC('month', NOW() - INTERVAL '6 months');
        
        FOR partition_record IN 
          SELECT tablename 
          FROM pg_tables 
          WHERE tablename LIKE 'tracking_events_%'
            AND tablename ~ '^tracking_events_[0-9]{4}_[0-9]{2}$'
        LOOP
          -- Extrair data da partição do nome
          partition_date_str := SUBSTRING(partition_record.tablename FROM 'tracking_events_([0-9]{4}_[0-9]{2})');
          partition_date := TO_DATE(partition_date_str, 'YYYY_MM');
          
          IF partition_date < archive_threshold THEN
            -- Desanexar partição (mantém dados mas não é mais consultada)
            EXECUTE format('ALTER TABLE tracking_events DETACH PARTITION %I', partition_record.tablename);
            
            -- Mover para schema de arquivo
            EXECUTE format('ALTER TABLE %I SET SCHEMA archive', partition_record.tablename);
            
            RAISE NOTICE 'Partição arquivada: %', partition_record.tablename;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 9. Migrar dados da tabela antiga (se houver)
    const countResult = (await queryRunner.query(`
  SELECT COUNT(*)::integer as count FROM tracking_events_old
`)) as CountResult[];

    const oldDataCount = countResult[0]?.count ?? 0;

    if (oldDataCount > 0) {
      await queryRunner.query(`
        INSERT INTO tracking_events 
        SELECT * FROM tracking_events_old
      `);
    }

    // 10. Dropar materialized view antes de remover tabela antiga
    await queryRunner.query(`
      DROP MATERIALIZED VIEW IF EXISTS tracking_history CASCADE
    `);

    // 11. Remover tabela antiga
    await queryRunner.query(`
      DROP TABLE tracking_events_old
    `);

    // 12. Comentários
    await queryRunner.query(`
      COMMENT ON TABLE tracking_events IS 
      'Tabela particionada de eventos de rastreamento. 
      Particionamento mensal por timestamp para melhor performance e gerenciamento de dados históricos.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar tabela temporária para backup dos dados
    await queryRunner.query(`
      CREATE TABLE tracking_events_backup (
        event_id UUID NOT NULL,
        delivery_id UUID NOT NULL,
        route_id UUID,
        driver_id UUID,
        event_type event_type_enum NOT NULL,
        event_status event_status_enum NOT NULL DEFAULT 'SUCCESS',
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        location geometry(Point, 4326),
        location_address VARCHAR(500),
        accuracy DECIMAL(10, 2),
        speed DECIMAL(10, 2),
        battery_level INTEGER,
        notes TEXT,
        metadata JSONB,
        is_automatic BOOLEAN NOT NULL DEFAULT false,
        created_by_user_id UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // 2. Copiar dados da tabela particionada
    await queryRunner.query(`
      INSERT INTO tracking_events_backup
      SELECT * FROM tracking_events
    `);

    // 3. Remover tabela particionada (remove todas as partições)
    await queryRunner.query(`
      DROP TABLE tracking_events CASCADE
    `);

    // 4. Renomear backup para nome original
    await queryRunner.query(`
      ALTER TABLE tracking_events_backup RENAME TO tracking_events
    `);

    // 5. Adicionar primary key
    await queryRunner.query(`
      ALTER TABLE tracking_events
      ADD CONSTRAINT pk_tracking_events PRIMARY KEY (event_id)
    `);

    // 6. Recriar índices
    await queryRunner.query(`
      CREATE INDEX idx_tracking_events_delivery_id ON tracking_events (delivery_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_events_route_id ON tracking_events (route_id) WHERE route_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_events_driver_id ON tracking_events (driver_id) WHERE driver_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_events_event_type ON tracking_events (event_type)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_events_timestamp ON tracking_events (timestamp DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_events_location ON tracking_events USING GIST (location) WHERE location IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_events_delivery_timestamp ON tracking_events (delivery_id, timestamp DESC)
    `);

    // 7. Recriar foreign keys
    await queryRunner.query(`
      ALTER TABLE tracking_events
      ADD CONSTRAINT fk_tracking_events_delivery
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE tracking_events
      ADD CONSTRAINT fk_tracking_events_route
      FOREIGN KEY (route_id) REFERENCES routes(id)
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE tracking_events
      ADD CONSTRAINT fk_tracking_events_driver
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
      ON DELETE RESTRICT
    `);

    // 8. Remover funções
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS archive_old_tracking_partitions()
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS create_tracking_events_partition()
    `);

    // 9. Remover schema de arquivo
    await queryRunner.query(`
      DROP SCHEMA IF EXISTS archive CASCADE
    `);
  }

  /**
   * Cria índices para uma partição específica
   */
  private async createPartitionIndexes(
    queryRunner: QueryRunner,
    partitionName: string,
  ): Promise<void> {
    const safeName = this.escapeIdentifier(partitionName);

    await queryRunner.query(`
      CREATE INDEX idx_${partitionName}_delivery_id 
      ON ${safeName} (delivery_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_${partitionName}_route_id 
      ON ${safeName} (route_id) 
      WHERE route_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_${partitionName}_driver_id 
      ON ${safeName} (driver_id) 
      WHERE driver_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_${partitionName}_event_type 
      ON ${safeName} (event_type)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_${partitionName}_timestamp 
      ON ${safeName} (timestamp DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_${partitionName}_location 
      ON ${safeName} 
      USING GIST (location) 
      WHERE location IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_${partitionName}_delivery_timestamp 
      ON ${safeName} (delivery_id, timestamp DESC)
    `);
  }

  /**
   * Escapa identificador SQL para prevenir injection
   */
  private escapeIdentifier(identifier: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error(`Identificador inválido: ${identifier}`);
    }
    return `"${identifier}"`;
  }
}
