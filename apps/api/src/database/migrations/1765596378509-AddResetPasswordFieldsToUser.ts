import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Adiciona campos de reset de senha na tabela users
 *
 * Campos adicionados:
 * - reset_password_token: Token para recuperação de senha
 * - reset_password_expires: Data de expiração do token
 */
export class AddResetPasswordFieldsToUser1765596378509 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'reset_password_token',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Token para recuperação de senha',
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'reset_password_expires',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Data de expiração do token de recuperação',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'reset_password_expires');
    await queryRunner.dropColumn('users', 'reset_password_token');
  }
}
