import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserIdNullableInIncidents1768115897134 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar coluna uploaded_by_user_id na tabela incident_attachments para aceitar NULL
    await queryRunner.query(`
            ALTER TABLE "incident_attachments" 
            ALTER COLUMN "uploaded_by_user_id" DROP NOT NULL;
        `);

    // Alterar coluna user_id na tabela incident_comments para aceitar NULL
    await queryRunner.query(`
            ALTER TABLE "incident_comments" 
            ALTER COLUMN "user_id" DROP NOT NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: tornar uploaded_by_user_id obrigatório novamente
    await queryRunner.query(`
            ALTER TABLE "incident_attachments" 
            ALTER COLUMN "uploaded_by_user_id" SET NOT NULL;
        `);

    // Reverter: tornar user_id obrigatório novamente
    await queryRunner.query(`
            ALTER TABLE "incident_comments" 
            ALTER COLUMN "user_id" SET NOT NULL;
        `);
  }
}
