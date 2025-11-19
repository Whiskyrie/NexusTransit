import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateRouteStopsTable1694544000108 implements MigrationInterface {
  name = 'CreateRouteStopsTable1694544000108';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela route_stops
    await queryRunner.createTable(
      new Table({
        name: 'route_stops',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
            comment: 'Identificador único',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            comment: 'Data de criação',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            comment: 'Data de atualização',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Soft delete timestamp',
          },
          {
            name: 'route_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID da rota',
          },
          {
            name: 'customer_address_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID do endereço do cliente',
          },
          {
            name: 'sequence_order',
            type: 'integer',
            isNullable: false,
            comment: 'Ordem de parada na rota',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'PENDING'",
            comment: 'Status da parada: PENDING, IN_PROGRESS, COMPLETED, SKIPPED, FAILED',
          },
          {
            name: 'address',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Endereço completo da parada',
          },
          {
            name: 'coordinates',
            type: 'point',
            isNullable: true,
            comment: 'Coordenadas geográficas (lat, lng)',
          },
          {
            name: 'planned_arrival_time',
            type: 'time',
            isNullable: true,
            comment: 'Horário de chegada planejado',
          },
          {
            name: 'planned_departure_time',
            type: 'time',
            isNullable: true,
            comment: 'Horário de partida planejado',
          },
          {
            name: 'estimated_stop_duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo estimado de parada em minutos',
          },
          {
            name: 'actual_arrival_time',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Horário real de chegada',
          },
          {
            name: 'actual_departure_time',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Horário real de partida',
          },
          {
            name: 'actual_stop_duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Duração real da parada em minutos',
          },
          {
            name: 'distance_from_previous_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Distância desde a parada anterior em km',
          },
          {
            name: 'estimated_time_from_previous_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo estimado desde parada anterior em minutos',
          },
          {
            name: 'delivery_data',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados da entrega/coleta nesta parada',
          },
          {
            name: 'contact_info',
            type: 'jsonb',
            isNullable: true,
            comment: 'Informações de contato do destinatário',
          },
          {
            name: 'restrictions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Restrições específicas desta parada',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações gerais da parada',
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo de falha ou problema (se aplicável)',
          },
          {
            name: 'completed_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora que foi marcada como completa',
          },
          {
            name: 'skipped_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora que foi pulada',
          },
          {
            name: 'proof_of_delivery',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados da prova de entrega',
          },
        ],
      }),
      true,
    );

    // Criar Foreign Keys
    await queryRunner.createForeignKey(
      'route_stops',
      new TableForeignKey({
        name: 'FK_route_stops_route',
        columnNames: ['route_id'],
        referencedTableName: 'routes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'route_stops',
      new TableForeignKey({
        name: 'FK_route_stops_customer_address',
        columnNames: ['customer_address_id'],
        referencedTableName: 'customer_addresses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Criar Índices
    await queryRunner.createIndex(
      'route_stops',
      new TableIndex({
        name: 'IDX_route_stops_route_id',
        columnNames: ['route_id'],
      }),
    );

    await queryRunner.createIndex(
      'route_stops',
      new TableIndex({
        name: 'IDX_route_stops_customer_address_id',
        columnNames: ['customer_address_id'],
      }),
    );

    await queryRunner.createIndex(
      'route_stops',
      new TableIndex({
        name: 'IDX_route_stops_sequence_order',
        columnNames: ['sequence_order'],
      }),
    );

    await queryRunner.createIndex(
      'route_stops',
      new TableIndex({
        name: 'IDX_route_stops_status',
        columnNames: ['status'],
      }),
    );

    // Índice composto para busca por rota + sequência
    await queryRunner.createIndex(
      'route_stops',
      new TableIndex({
        name: 'IDX_route_stops_route_sequence',
        columnNames: ['route_id', 'sequence_order'],
      }),
    );

    // Comentário na tabela
    await queryRunner.query(`
      COMMENT ON TABLE route_stops IS 'Pontos de parada em rotas de entrega'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('route_stops', 'IDX_route_stops_route_sequence');
    await queryRunner.dropIndex('route_stops', 'IDX_route_stops_status');
    await queryRunner.dropIndex('route_stops', 'IDX_route_stops_sequence_order');
    await queryRunner.dropIndex('route_stops', 'IDX_route_stops_customer_address_id');
    await queryRunner.dropIndex('route_stops', 'IDX_route_stops_route_id');

    // Remover foreign keys
    await queryRunner.dropForeignKey('route_stops', 'FK_route_stops_customer_address');
    await queryRunner.dropForeignKey('route_stops', 'FK_route_stops_route');

    // Remover tabela
    await queryRunner.dropTable('route_stops');
  }
}
