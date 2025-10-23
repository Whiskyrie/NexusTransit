import { type MigrationInterface, type QueryRunner, TableIndex, TableColumn } from 'typeorm';
export class AddRouteCodeColumn1694544000102 implements MigrationInterface {
  name = 'AddRouteCodeColumn1694544000102';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const table = await queryRunner.getTable('routes');
    const column = table?.findColumnByName('route_code');

    if (!column) {
      // Adicionar coluna route_code temporariamente nullable
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'route_code',
          type: 'varchar',
          length: '20',
          isNullable: true,
          isUnique: false,
          comment: 'Código único da rota',
        }),
      );

      // Popular valores únicos usando CTE (corrigido)
      await queryRunner.query(`
        WITH numbered_routes AS (
          SELECT 
            id,
            'RT-' || to_char(created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') as new_code
          FROM routes
          WHERE route_code IS NULL
        )
        UPDATE routes
        SET route_code = numbered_routes.new_code
        FROM numbered_routes
        WHERE routes.id = numbered_routes.id;
      `);

      // Tornar coluna NOT NULL e UNIQUE
      await queryRunner.changeColumn(
        'routes',
        'route_code',
        new TableColumn({
          name: 'route_code',
          type: 'varchar',
          length: '20',
          isNullable: false,
          isUnique: true,
          comment: 'Código único da rota',
        }),
      );

      // Criar índice único
      await queryRunner.createIndex(
        'routes',
        new TableIndex({
          name: 'IDX_routes_route_code',
          columnNames: ['route_code'],
          isUnique: true,
        }),
      );

      // Adicionar comentário
      await queryRunner.query(`
        COMMENT ON COLUMN routes.route_code IS 'Código único da rota (ex: RT-20240115-001)';
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('routes');
    const index = table?.indices.find(idx => idx.name === 'IDX_routes_route_code');

    if (index) {
      await queryRunner.dropIndex('routes', 'IDX_routes_route_code');
    }

    const column = table?.findColumnByName('route_code');
    if (column) {
      await queryRunner.dropColumn('routes', 'route_code');
    }
  }
}
