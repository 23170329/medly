import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsultaLabNotifReagendar1747220000000 implements MigrationInterface {
  name = 'ConsultaLabNotifReagendar1747220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "consulta_clinica"
      ADD COLUMN IF NOT EXISTS "estudiosLaboratorio" text
    `);

    await queryRunner.query(`
      ALTER TABLE "notificacion"
      ADD COLUMN IF NOT EXISTS "medicoID" integer,
      ADD COLUMN IF NOT EXISTS "sucursalID" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificacion"
      DROP COLUMN IF EXISTS "sucursalID",
      DROP COLUMN IF EXISTS "medicoID"
    `);
    await queryRunner.query(`
      ALTER TABLE "consulta_clinica"
      DROP COLUMN IF EXISTS "estudiosLaboratorio"
    `);
  }
}
