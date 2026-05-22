import { MigrationInterface, QueryRunner } from 'typeorm';

export class StaffSucursal1747180000000 implements MigrationInterface {
  name = 'StaffSucursal1747180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cuenta_staff" ADD COLUMN IF NOT EXISTS "sucursalID" integer`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "cuenta_staff"
          ADD CONSTRAINT "FK_cuenta_staff_sucursal"
          FOREIGN KEY ("sucursalID") REFERENCES "sucursal"("sucursalID")
          ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cuenta_staff" DROP CONSTRAINT IF EXISTS "FK_cuenta_staff_sucursal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cuenta_staff" DROP COLUMN IF EXISTS "sucursalID"`,
    );
  }
}
