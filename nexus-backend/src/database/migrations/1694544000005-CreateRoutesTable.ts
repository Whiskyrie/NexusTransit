import { type MigrationInterface, type QueryRunner, Table } from 'typeorm';

export class CreateRoutesTable1694544000005 implements MigrationInterface {
  name = 'CreateRoutesTable1694544000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para status da rota
    await queryRunner.query(`
      CREATE TYPE "route_status_enum" AS ENUM (
        'active',
        'inactive', 
        'under_maintenance',
        'blocked'
      )
    `);

    // Criar enum para tipo de rota
    await queryRunner.query(`
      CREATE TYPE "route_type_enum" AS ENUM (
        'urban',
        'interstate',
        'rural',
        'express',
        'local'
      )
    `);

    // Criar tabela routes
    await queryRunner.createTable(
      new Table({
        name: 'routes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'route_code',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: false,
            comment: 'Código único da rota',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nome identificador da rota',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada da rota',
          },
          {
            name: 'origin_address',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Endereço de origem completo',
          },
          {
            name: 'origin_coordinates',
            type: 'point',
            isNullable: true,
            comment: 'Coordenadas geográficas de origem (lat, lng)',
          },
          {
            name: 'destination_address',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Endereço de destino completo',
          },
          {
            name: 'destination_coordinates',
            type: 'point',
            isNullable: true,
            comment: 'Coordenadas geográficas de destino (lat, lng)',
          },
          {
            name: 'waypoints',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
            comment: 'Pontos intermediários da rota em formato JSON',
          },
          {
            name: 'distance_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Distância total da rota em quilômetros',
          },
          {
            name: 'estimated_duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo estimado de viagem em minutos',
          },
          {
            name: 'type',
            type: 'route_type_enum',
            isNullable: false,
            default: "'urban'",
            comment: 'Tipo da rota',
          },
          {
            name: 'status',
            type: 'route_status_enum',
            isNullable: false,
            default: "'active'",
            comment: 'Status atual da rota',
          },
          {
            name: 'max_vehicle_capacity_kg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Capacidade máxima de carga para esta rota',
          },
          {
            name: 'max_vehicle_volume_m3',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Volume máximo de carga para esta rota',
          },
          {
            name: 'allowed_vehicle_types',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
            comment: 'Tipos de veículos permitidos nesta rota',
          },
          {
            name: 'traffic_restrictions',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
            comment: 'Restrições de tráfego (horários, dias, etc.)',
          },
          {
            name: 'toll_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Custo de pedágios na rota',
          },
          {
            name: 'fuel_consumption_estimate',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Estimativa de consumo de combustível',
          },
          {
            name: 'difficulty_level',
            type: 'integer',
            isNullable: true,
            default: 1,
            comment: 'Nível de dificuldade da rota (1-5)',
          },
          {
            name: 'optimization_data',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
            comment: 'Dados de otimização de rota (algoritmos, histórico)',
          },
          {
            name: 'last_updated_by',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que fez a última atualização',
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
            comment: 'Indica se a rota está ativa para uso',
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
            comment: 'Configurações específicas da rota',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre a rota',
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
            name: 'IDX_routes_route_code',
            columnNames: ['route_code'],
          },
          {
            name: 'IDX_routes_name',
            columnNames: ['name'],
          },
          {
            name: 'IDX_routes_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_routes_type',
            columnNames: ['type'],
          },
          {
            name: 'IDX_routes_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_routes_distance',
            columnNames: ['distance_km'],
          },
          {
            name: 'IDX_routes_duration',
            columnNames: ['estimated_duration_minutes'],
          },
          {
            name: 'IDX_routes_created_at',
            columnNames: ['created_at'],
          },
          {
            name: 'IDX_routes_deleted_at',
            columnNames: ['deleted_at'],
          },
          {
            name: 'IDX_routes_active_status',
            columnNames: ['is_active', 'status'],
          },
          {
            name: 'IDX_routes_type_status',
            columnNames: ['type', 'status'],
          },
        ],
        foreignKeys: [
          {
            name: 'FK_routes_last_updated_by',
            columnNames: ['last_updated_by'],
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
      CREATE TRIGGER update_routes_updated_at 
        BEFORE UPDATE ON routes 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Criar função para calcular distância entre pontos
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_route_distance()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Calcular distância automática se as coordenadas foram fornecidas
        IF NEW.origin_coordinates IS NOT NULL AND NEW.destination_coordinates IS NOT NULL THEN
          NEW.distance_km = ST_Distance(
            ST_Transform(ST_GeomFromText('POINT(' || ST_X(NEW.origin_coordinates) || ' ' || ST_Y(NEW.origin_coordinates) || ')', 4326), 3857),
            ST_Transform(ST_GeomFromText('POINT(' || ST_X(NEW.destination_coordinates) || ' ' || ST_Y(NEW.destination_coordinates) || ')', 4326), 3857)
          ) / 1000; -- Converter para quilômetros
        END IF;
        
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Criar trigger para cálculo automático de distância
    await queryRunner.query(`
      CREATE TRIGGER calculate_route_distance_trigger
        BEFORE INSERT OR UPDATE ON routes
        FOR EACH ROW
        WHEN (NEW.origin_coordinates IS NOT NULL AND NEW.destination_coordinates IS NOT NULL)
        EXECUTE FUNCTION calculate_route_distance()
    `);

    // Adicionar comentários na tabela
    await queryRunner.query(`
      COMMENT ON TABLE routes IS 'Sistema de gerenciamento de rotas do Nexus Transit';
      COMMENT ON COLUMN routes.route_code IS 'Código único da rota (ex: RT-20240115-001)';
      COMMENT ON COLUMN routes.name IS 'Nome identificador da rota';
      COMMENT ON COLUMN routes.description IS 'Descrição detalhada da rota';
      COMMENT ON COLUMN routes.origin_address IS 'Endereço de origem completo';
      COMMENT ON COLUMN routes.origin_coordinates IS 'Coordenadas geográficas de origem (lat, lng)';
      COMMENT ON COLUMN routes.destination_address IS 'Endereço de destino completo';
      COMMENT ON COLUMN routes.destination_coordinates IS 'Coordenadas geográficas de destino (lat, lng)';
      COMMENT ON COLUMN routes.waypoints IS 'Pontos intermediários da rota em formato JSON';
      COMMENT ON COLUMN routes.distance_km IS 'Distância total da rota em quilômetros';
      COMMENT ON COLUMN routes.estimated_duration_minutes IS 'Tempo estimado de viagem em minutos';
      COMMENT ON COLUMN routes.type IS 'Tipo da rota';
      COMMENT ON COLUMN routes.status IS 'Status atual da rota';
      COMMENT ON COLUMN routes.optimization_data IS 'Dados de otimização de rota (algoritmos, histórico)';
      COMMENT ON COLUMN routes.last_updated_by IS 'ID do usuário que fez a última atualização';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover triggers
    await queryRunner.query('DROP TRIGGER IF EXISTS calculate_route_distance_trigger ON routes');
    await queryRunner.query('DROP TRIGGER IF EXISTS update_routes_updated_at ON routes');

    // Remover função
    await queryRunner.query('DROP FUNCTION IF EXISTS calculate_route_distance()');

    // Remover tabela
    await queryRunner.dropTable('routes');

    // Remover enums
    await queryRunner.query('DROP TYPE IF EXISTS "route_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "route_status_enum"');
  }
}
