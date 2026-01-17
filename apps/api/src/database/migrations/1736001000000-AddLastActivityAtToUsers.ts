import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

export class AddLastActivityAtToUsers1736001000000 implements MigrationInterface {
  name = 'AddLastActivityAtToUsers1736001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'last_activity_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'last_activity_at');
  }
}
