import { MigrationInterface, QueryRunner } from 'typeorm';

/** Apellido materno obligatorio en registro; filas antiguas sin dato reciben marcador. */
export class PacienteApellidoMatNotNull1747130000000 implements MigrationInterface {
  name = 'PacienteApellidoMatNotNull1747130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "paciente"
      SET "apellido_mat" = '-'
      WHERE "apellido_mat" IS NULL OR TRIM("apellido_mat") = ''
    `);
    await queryRunner.query(
      `ALTER TABLE "paciente" ALTER COLUMN "apellido_mat" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "paciente" ALTER COLUMN "apellido_mat" DROP NOT NULL`,
    );
  }
}
