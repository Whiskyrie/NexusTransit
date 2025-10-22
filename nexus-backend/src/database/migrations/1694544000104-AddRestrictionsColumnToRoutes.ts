import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRestrictionsColumnToRoutes1694544000104 implements MigrationInterface {
  name = 'AddRestrictionsColumnToRoutes1694544000104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const table = await queryRunner.getTable('routes');
    const column = table?.findColumnByName('restrictions');

    if (!column) {
      // Adicionar coluna restrictions
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'restrictions',
          type: 'jsonb',
          isNullable: true,
          default: "'{}'",
          comment: 'Restrições específicas da rota (peso, altura, etc.)',
        }),
      );

      // Adicionar comentário detalhado
      await queryRunner.query(`
        COMMENT ON COLUMN routes.restrictions IS 'Restrições específicas da rota: weight_limit_kg, height_limit_m, width_limit_m, hazmat_allowed, toll_roads_allowed, night_delivery_allowed';
      `);

      console.log('✅ Coluna restrictions adicionada com sucesso');
    } else {
      console.log('ℹ️ Coluna restrictions já existe, pulando...');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('routes');
    const column = table?.findColumnByName('restrictions');

    if (column) {
      await queryRunner.dropColumn('routes', 'restrictions');
    }
  }
}