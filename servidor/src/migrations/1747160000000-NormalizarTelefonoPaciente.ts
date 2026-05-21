import { MigrationInterface, QueryRunner } from 'typeorm';

/** Teléfonos solo dígitos para login por teléfono. */
export class NormalizarTelefonoPaciente1747160000000
  implements MigrationInterface
{
  name = 'NormalizarTelefonoPaciente1747160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "paciente"
      SET "telefono" = REGEXP_REPLACE("telefono", '[^0-9]', '', 'g')
      WHERE "telefono" ~ '[^0-9]'
    `);
    await queryRunner.query(`
      UPDATE "paciente"
      SET "curp" = UPPER(TRIM("curp"))
      WHERE "curp" <> UPPER(TRIM("curp"))
    `);
  }

  public async down(): Promise<void> {
    /* irreversible */
  }
}
