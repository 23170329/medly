import { MigrationInterface, QueryRunner } from 'typeorm';

export class CalificacionPacienteCita1747240000000 implements MigrationInterface {
  name = 'CalificacionPacienteCita1747240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "calificacion" (
        "calificacionID" SERIAL PRIMARY KEY,
        "pacienteID" integer NOT NULL,
        "medicoID" integer NOT NULL,
        "citaID" integer NOT NULL UNIQUE,
        "estrellas" integer NOT NULL CHECK ("estrellas" >= 1 AND "estrellas" <= 5),
        "comentario" text,
        "fechaCalificacion" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_calificacion_medico" FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE CASCADE,
        CONSTRAINT "FK_calificacion_paciente" FOREIGN KEY ("pacienteID") REFERENCES "paciente"("pacienteID") ON DELETE CASCADE,
        CONSTRAINT "FK_calificacion_cita" FOREIGN KEY ("citaID") REFERENCES "cita"("citaID") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_calificacion_medico" ON "calificacion" ("medicoID")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "calificacion"`);
  }
}
