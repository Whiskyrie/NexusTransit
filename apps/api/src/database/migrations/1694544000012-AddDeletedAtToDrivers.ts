import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToDrivers1694544000012 implements MigrationInterface {
  name = 'AddDeletedAtToDrivers1694544000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna deleted_at na tabela drivers
    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Data de exclusão lógica (soft delete)',
      }),
    );

    // Adicionar coluna deleted_at na tabela driver_licenses
    await queryRunner.addColumn(
      'driver_licenses',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Data de exclusão lógica (soft delete)',
      }),
    );

    // Adicionar coluna deleted_at na tabela driver_documents
    await queryRunner.addColumn(
      'driver_documents',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Data de exclusão lógica (soft delete)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover coluna deleted_at da tabela driver_documents
    await queryRunner.dropColumn('driver_documents', 'deleted_at');

    // Remover coluna deleted_at da tabela driver_licenses
    await queryRunner.dropColumn('driver_licenses', 'deleted_at');

    // Remover coluna deleted_at da tabela drivers
    await queryRunner.dropColumn('drivers', 'deleted_at');
  }
}
