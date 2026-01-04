import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

export class AddDisplayNameToRoles1736002000000 implements MigrationInterface {
  name = 'AddDisplayNameToRoles1736002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'roles',
      new TableColumn({
        name: 'display_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    // Atualizar registros existentes
    await queryRunner.query(`
      UPDATE roles 
      SET display_name = CASE 
        WHEN name = 'admin' THEN 'Administrador'
        WHEN name = 'manager' THEN 'Gerente'
        WHEN name = 'operator' THEN 'Operador'
        WHEN name = 'driver' THEN 'Motorista'
        WHEN name = 'customer' THEN 'Cliente'
        ELSE name
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('roles', 'display_name');
  }
}
