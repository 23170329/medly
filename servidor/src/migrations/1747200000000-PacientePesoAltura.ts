import { MigrationInterface, QueryRunner } from 'typeorm';

export class PacientePesoAltura1747200000000 implements MigrationInterface {
  name = 'PacientePesoAltura1747200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "paciente"
      ADD COLUMN IF NOT EXISTS "pesoKg" numeric(6,2),
      ADD COLUMN IF NOT EXISTS "alturaM" numeric(4,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "consulta_clinica"
      ADD COLUMN IF NOT EXISTS "pesoKg" numeric(6,2),
      ADD COLUMN IF NOT EXISTS "alturaM" numeric(4,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "consulta_clinica"
      DROP COLUMN IF EXISTS "alturaM",
      DROP COLUMN IF EXISTS "pesoKg"
    `);
    await queryRunner.query(`
      ALTER TABLE "paciente"
      DROP COLUMN IF EXISTS "alturaM",
      DROP COLUMN IF EXISTS "pesoKg"
    `);
  }
}
