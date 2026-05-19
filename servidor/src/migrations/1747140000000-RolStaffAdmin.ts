import { MigrationInterface, QueryRunner } from 'typeorm';

export class RolStaffAdmin1747140000000 implements MigrationInterface {
  name = 'RolStaffAdmin1747140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "cuenta_staff_rol_enum" ADD VALUE IF NOT EXISTS 'ADMIN'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing values from an enum.
    // This migration is one-way; a full rollback would require recreating the table.
  }
}
