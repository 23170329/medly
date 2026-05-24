import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApellidoMatOpcionalOrigenRegistro1747230000000
  implements MigrationInterface
{
  name = 'ApellidoMatOpcionalOrigenRegistro1747230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "paciente"
      SET "apellido_mat" = NULL
      WHERE "apellido_mat" IS NULL OR TRIM("apellido_mat") = '' OR "apellido_mat" = '-'
    `);

    await queryRunner.query(`
      ALTER TABLE "paciente"
      ALTER COLUMN "apellido_mat" DROP NOT NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "origen_registro_enum" AS ENUM ('AUTOREGISTRO', 'RECEPCION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "cuenta_usuario"
      ADD COLUMN IF NOT EXISTS "origenRegistro" "origen_registro_enum"
      NOT NULL DEFAULT 'AUTOREGISTRO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cuenta_usuario"
      DROP COLUMN IF EXISTS "origenRegistro"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "origen_registro_enum"
    `);

    await queryRunner.query(`
      UPDATE "paciente"
      SET "apellido_mat" = '-'
      WHERE "apellido_mat" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "paciente"
      ALTER COLUMN "apellido_mat" SET NOT NULL
    `);
  }
}
