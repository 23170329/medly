import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificacionCancelacion1747210000000 implements MigrationInterface {
  name = 'NotificacionCancelacion1747210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificacion"
      ADD COLUMN IF NOT EXISTS "tipo" character varying(40),
      ADD COLUMN IF NOT EXISTS "citaID" integer,
      ADD COLUMN IF NOT EXISTS "permiteReagendar" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notificacion_medico" (
        "notificacionID" SERIAL NOT NULL,
        "medicoID" integer NOT NULL,
        "titulo" character varying(100) NOT NULL,
        "mensaje" character varying(500) NOT NULL,
        "leida" boolean NOT NULL DEFAULT false,
        "tipo" character varying(40),
        "citaID" integer,
        "permiteReagendar" boolean NOT NULL DEFAULT false,
        "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notificacion_medico" PRIMARY KEY ("notificacionID"),
        CONSTRAINT "FK_notificacion_medico_medico"
          FOREIGN KEY ("medicoID") REFERENCES "medico"("medicoID") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notificacion_medico"`);
    await queryRunner.query(`
      ALTER TABLE "notificacion"
      DROP COLUMN IF EXISTS "permiteReagendar",
      DROP COLUMN IF EXISTS "citaID",
      DROP COLUMN IF EXISTS "tipo"
    `);
  }
}
