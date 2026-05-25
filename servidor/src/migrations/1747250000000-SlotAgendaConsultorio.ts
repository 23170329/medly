import { MigrationInterface, QueryRunner } from 'typeorm';

export class SlotAgendaConsultorio1747250000000 implements MigrationInterface {
  name = 'SlotAgendaConsultorio1747250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "slot_agenda"
      ADD COLUMN IF NOT EXISTS "consultorioID" integer NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "slot_agenda"
      DROP CONSTRAINT IF EXISTS "FK_slot_agenda_consultorio"
    `);
    await queryRunner.query(`
      ALTER TABLE "slot_agenda"
      ADD CONSTRAINT "FK_slot_agenda_consultorio"
      FOREIGN KEY ("consultorioID") REFERENCES "consultorio"("consultorioID")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "slot_agenda" DROP CONSTRAINT IF EXISTS "FK_slot_agenda_consultorio"
    `);
    await queryRunner.query(`
      ALTER TABLE "slot_agenda" DROP COLUMN IF EXISTS "consultorioID"
    `);
  }
}
