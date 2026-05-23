import { MigrationInterface, QueryRunner } from 'typeorm';

export class CitaCancelacionMotivo1747190000000 implements MigrationInterface {
  name = 'CitaCancelacionMotivo1747190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cita" ADD COLUMN IF NOT EXISTS "causaCancelacion" varchar(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cita" ADD COLUMN IF NOT EXISTS "motivoCancelacion" varchar(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cita" DROP COLUMN IF EXISTS "motivoCancelacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cita" DROP COLUMN IF EXISTS "causaCancelacion"`,
    );
  }
}
