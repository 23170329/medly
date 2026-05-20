import { MigrationInterface, QueryRunner } from 'typeorm';

export class SucursalLatLng1747150000000 implements MigrationInterface {
  name = 'SucursalLatLng1747150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sucursal" ADD "latitud" numeric(10,7) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sucursal" ADD "longitud" numeric(10,7) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sucursal" DROP COLUMN "longitud"`);
    await queryRunner.query(`ALTER TABLE "sucursal" DROP COLUMN "latitud"`);
  }
}
