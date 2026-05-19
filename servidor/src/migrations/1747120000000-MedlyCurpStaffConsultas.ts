import { MigrationInterface, QueryRunner } from 'typeorm';

export class MedlyCurpStaffConsultas1747120000000 implements MigrationInterface {
  name = 'MedlyCurpStaffConsultas1747120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "paciente" ADD COLUMN IF NOT EXISTS "curp" character varying(18)`,
    );
    await queryRunner.query(
      `UPDATE "paciente" SET "curp" = ('XAXX' || LPAD("pacienteID"::text, 14, '0')) WHERE "curp" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "paciente" ALTER COLUMN "curp" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_paciente_curp" ON "paciente" (UPPER(TRIM("curp")))`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cuenta_staff_rol_enum" AS ENUM ('RECEPCIONISTA', 'MEDICO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuenta_staff" (
        "cuentaStaffID" SERIAL NOT NULL,
        "nombre" character varying(120) NOT NULL,
        "correo" character varying(150) NOT NULL,
        "password" character varying(255) NOT NULL,
        "rol" "cuenta_staff_rol_enum" NOT NULL,
        "medicoID" integer,
        CONSTRAINT "UQ_cuenta_staff_correo" UNIQUE ("correo"),
        CONSTRAINT "UQ_cuenta_staff_medico" UNIQUE ("medicoID"),
        CONSTRAINT "PK_cuenta_staff" PRIMARY KEY ("cuentaStaffID"),
        CONSTRAINT "FK_cuenta_staff_medico" FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bloqueo_agenda" (
        "bloqueoID" SERIAL NOT NULL,
        "medicoID" integer NOT NULL,
        "inicio" TIMESTAMPTZ NOT NULL,
        "fin" TIMESTAMPTZ NOT NULL,
        "motivo" character varying(300),
        CONSTRAINT "PK_bloqueo_agenda" PRIMARY KEY ("bloqueoID"),
        CONSTRAINT "FK_bloqueo_medico" FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bloqueo_medico_inicio" ON "bloqueo_agenda" ("medicoID", "inicio")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consulta_clinica" (
        "consultaID" SERIAL NOT NULL,
        "pacienteID" integer NOT NULL,
        "medicoID" integer NOT NULL,
        "citaID" integer,
        "fechaRegistro" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "identificacion" text,
        "antecedentes" text,
        "interrogatorio" text,
        "exploracionFisica" text,
        "diagnosticos" text,
        "tratamiento" text,
        "evolucion" text,
        "pronostico" text,
        "notasConfidenciales" text,
        CONSTRAINT "PK_consulta_clinica" PRIMARY KEY ("consultaID"),
        CONSTRAINT "FK_consulta_paciente" FOREIGN KEY ("pacienteID") REFERENCES "paciente"("pacienteID") ON DELETE CASCADE,
        CONSTRAINT "FK_consulta_medico" FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE CASCADE,
        CONSTRAINT "FK_consulta_cita" FOREIGN KEY ("citaID") REFERENCES "cita"("citaID") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consulta_medico" ON "consulta_clinica" ("medicoID")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consulta_paciente_medico" ON "consulta_clinica" ("pacienteID", "medicoID")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "consulta_clinica"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bloqueo_agenda"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuenta_staff"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cuenta_staff_rol_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_paciente_curp"`);
    await queryRunner.query(
      `ALTER TABLE "paciente" DROP COLUMN IF EXISTS "curp"`,
    );
  }
}
