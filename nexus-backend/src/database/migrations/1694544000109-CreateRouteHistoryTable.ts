import { type MigrationInterface, type QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRouteHistoryTable1694544000109 implements MigrationInterface {
  name = 'CreateRouteHistoryTable1694544000109';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para route_status se ainda não existir (para previous_status e new_status)
    // Nota: Já foi criado na migration de FixRouteStatusEnum, então só precisamos referenciar

    // Criar tabela route_history
    await queryRunner.createTable(
      new Table({
        name: 'route_history',
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
            name: 'event_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo de evento/alteração',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
            comment: 'Descrição do evento',
          },
          {
            name: 'previous_status',
            type: 'route_status_enum',
            isNullable: true,
            comment: 'Status anterior',
          },
          {
            name: 'new_status',
            type: 'route_status_enum',
            isNullable: true,
            comment: 'Novo status',
          },
          {
            name: 'changed_fields',
            type: 'jsonb',
            isNullable: true,
            comment: 'Campos que foram alterados',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que fez a alteração',
          },
          {
            name: 'user_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
            comment: 'Nome do usuário que fez a alteração',
          },
          {
            name: 'user_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Tipo de usuário (admin, driver, system, etc)',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'IP de origem da alteração',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'User agent (navegador/app)',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadados adicionais do evento',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre a alteração',
          },
        ],
      }),
      true
    );

    // Criar Foreign Key
    await queryRunner.createForeignKey(
      'route_history',
      new TableForeignKey({
        name: 'FK_route_history_route',
        columnNames: ['route_id'],
        referencedTableName: 'routes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    );

    // Criar Índices
    await queryRunner.createIndex(
      'route_history',
      new TableIndex({
        name: 'IDX_route_history_route_id',
        columnNames: ['route_id'],
      })
    );

    await queryRunner.createIndex(
      'route_history',
      new TableIndex({
        name: 'IDX_route_history_event_type',
        columnNames: ['event_type'],
      })
    );

    await queryRunner.createIndex(
      'route_history',
      new TableIndex({
        name: 'IDX_route_history_created_at',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'route_history',
      new TableIndex({
        name: 'IDX_route_history_user_id',
        columnNames: ['user_id'],
      })
    );

    // Índice composto para busca por rota + data
    await queryRunner.createIndex(
      'route_history',
      new TableIndex({
        name: 'IDX_route_history_route_created',
        columnNames: ['route_id', 'created_at'],
      })
    );

    // Comentário na tabela
    await queryRunner.query(`
      COMMENT ON TABLE route_history IS 'Histórico de alterações e eventos de rotas'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('route_history', 'IDX_route_history_route_created');
    await queryRunner.dropIndex('route_history', 'IDX_route_history_user_id');
    await queryRunner.dropIndex('route_history', 'IDX_route_history_created_at');
    await queryRunner.dropIndex('route_history', 'IDX_route_history_event_type');
    await queryRunner.dropIndex('route_history', 'IDX_route_history_route_id');

    // Remover foreign key
    await queryRunner.dropForeignKey('route_history', 'FK_route_history_route');

    // Remover tabela
    await queryRunner.dropTable('route_history');
  }
}
