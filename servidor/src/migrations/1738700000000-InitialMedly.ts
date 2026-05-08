import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMedly1738700000000 implements MigrationInterface {
  name = 'InitialMedly1738700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "paciente" (
        "pacienteID" SERIAL NOT NULL,
        "nombre" character varying(50) NOT NULL,
        "apellido_pat" character varying(15) NOT NULL,
        "apellido_mat" character varying(15),
        "correoElectronico" character varying(150) NOT NULL,
        "telefono" character varying(15) NOT NULL,
        "fechaNacimiento" date NOT NULL,
        "genero" character varying(10) NOT NULL,
        CONSTRAINT "UQ_paciente_correo" UNIQUE ("correoElectronico"),
        CONSTRAINT "PK_paciente" PRIMARY KEY ("pacienteID")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuenta_usuario" (
        "cuentaID" SERIAL NOT NULL,
        "password" character varying(255) NOT NULL,
        "esInvitado" boolean NOT NULL DEFAULT false,
        "fechaExpiracion" TIMESTAMP,
        "pacienteID" integer NOT NULL,
        CONSTRAINT "REL_cuenta_paciente" UNIQUE ("pacienteID"),
        CONSTRAINT "PK_cuenta_usuario" PRIMARY KEY ("cuentaID"),
        CONSTRAINT "FK_cuenta_paciente" FOREIGN KEY ("pacienteID") REFERENCES "paciente"("pacienteID") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "especialidad" (
        "especialidadID" SERIAL NOT NULL,
        "nombre" character varying(80) NOT NULL,
        "icono" character varying(40),
        CONSTRAINT "UQ_especialidad_nombre" UNIQUE ("nombre"),
        CONSTRAINT "PK_especialidad" PRIMARY KEY ("especialidadID")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sucursal" (
        "sucursalID" SERIAL NOT NULL,
        "nombre" character varying(120) NOT NULL,
        "direccion" character varying(255) NOT NULL,
        "telefono" character varying(20) NOT NULL,
        "capacidadConsultorios" integer NOT NULL DEFAULT 1,
        CONSTRAINT "UQ_sucursal_nombre" UNIQUE ("nombre"),
        CONSTRAINT "PK_sucursal" PRIMARY KEY ("sucursalID")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "medico" (
        "medicoID" SERIAL NOT NULL,
        "nombre" character varying(80) NOT NULL,
        "apellidoPat" character varying(40) NOT NULL,
        "apellidoMat" character varying(40),
        "cedula" character varying(20),
        "precioConsulta" numeric(10,2) NOT NULL,
        "promedioCalificacion" numeric(3,2) NOT NULL DEFAULT 0,
        "totalResenas" integer NOT NULL DEFAULT 0,
        "especialidadID" integer NOT NULL,
        CONSTRAINT "PK_medico" PRIMARY KEY ("medicoID"),
        CONSTRAINT "FK_medico_especialidad" FOREIGN KEY ("especialidadID") REFERENCES "especialidad"("especialidadID") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "medico_sucursal" (
        "medicoID" integer NOT NULL,
        "sucursalID" integer NOT NULL,
        CONSTRAINT "PK_medico_sucursal" PRIMARY KEY ("medicoID", "sucursalID"),
        CONSTRAINT "FK_ms_medico" FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE CASCADE,
        CONSTRAINT "FK_ms_sucursal" FOREIGN KEY ("sucursalID") REFERENCES "sucursal"("sucursalID") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "slot_agenda_estado_enum" AS ENUM ('LIBRE', 'RESERVADO', 'OCUPADO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "slot_agenda" (
        "slotID" SERIAL NOT NULL,
        "medicoID" integer NOT NULL,
        "sucursalID" integer NOT NULL,
        "inicio" TIMESTAMPTZ NOT NULL,
        "fin" TIMESTAMPTZ NOT NULL,
        "estado" "slot_agenda_estado_enum" NOT NULL DEFAULT 'LIBRE',
        CONSTRAINT "PK_slot_agenda" PRIMARY KEY ("slotID"),
        CONSTRAINT "FK_slot_medico" FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE CASCADE,
        CONSTRAINT "FK_slot_sucursal" FOREIGN KEY ("sucursalID") REFERENCES "sucursal"("sucursalID") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_slot_medico_inicio" ON "slot_agenda" ("medicoID", "inicio")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_slot_estado" ON "slot_agenda" ("estado")
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cita_estado_enum" AS ENUM ('PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cita" (
        "citaID" SERIAL NOT NULL,
        "pacienteID" integer NOT NULL,
        "medicoID" integer NOT NULL,
        "sucursalID" integer NOT NULL,
        "slotID" integer NOT NULL,
        "inicio" TIMESTAMPTZ NOT NULL,
        "fin" TIMESTAMPTZ NOT NULL,
        "estado" "cita_estado_enum" NOT NULL DEFAULT 'PENDIENTE_PAGO',
        "montoTotal" numeric(10,2) NOT NULL,
        "montoAnticipo" numeric(10,2) NOT NULL,
        CONSTRAINT "UQ_cita_slot" UNIQUE ("slotID"),
        CONSTRAINT "PK_cita" PRIMARY KEY ("citaID"),
        CONSTRAINT "FK_cita_paciente" FOREIGN KEY ("pacienteID") REFERENCES "paciente"("pacienteID") ON DELETE CASCADE,
        CONSTRAINT "FK_cita_medico" FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE RESTRICT,
        CONSTRAINT "FK_cita_sucursal" FOREIGN KEY ("sucursalID") REFERENCES "sucursal"("sucursalID") ON DELETE RESTRICT,
        CONSTRAINT "FK_cita_slot" FOREIGN KEY ("slotID") REFERENCES "slot_agenda"("slotID") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cita_paciente_inicio" ON "cita" ("pacienteID", "inicio")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cita_medico_inicio" ON "cita" ("medicoID", "inicio")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cita_estado" ON "cita" ("estado")
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "pago_tipo_enum" AS ENUM ('ANTICIPO_50', 'REEMBOLSO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "pago_estado_enum" AS ENUM ('PENDIENTE', 'COMPLETADO', 'FALLIDO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pago" (
        "pagoID" SERIAL NOT NULL,
        "citaID" integer NOT NULL,
        "stripeCheckoutSessionId" character varying(255),
        "stripePaymentIntentId" character varying(255),
        "monto" numeric(10,2) NOT NULL,
        "tipo" "pago_tipo_enum" NOT NULL,
        "estado" "pago_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
        CONSTRAINT "PK_pago" PRIMARY KEY ("pagoID"),
        CONSTRAINT "FK_pago_cita" FOREIGN KEY ("citaID") REFERENCES "cita"("citaID") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pago_stripe_session" ON "pago" ("stripeCheckoutSessionId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pago"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cita"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "slot_agenda"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "medico_sucursal"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "medico"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sucursal"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "especialidad"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuenta_usuario"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "paciente"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pago_estado_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pago_tipo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cita_estado_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "slot_agenda_estado_enum"`);
  }
}
