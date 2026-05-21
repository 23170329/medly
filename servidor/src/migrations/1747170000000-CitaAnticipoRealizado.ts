import { MigrationInterface, QueryRunner } from 'typeorm';

export class CitaAnticipoRealizado1747170000000 implements MigrationInterface {
  name = 'CitaAnticipoRealizado1747170000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "cita_estado_enum" ADD VALUE IF NOT EXISTS 'ANTICIPO_REALIZADO'`,
    );
  }

  public async down(): Promise<void> {
    /* PostgreSQL no permite quitar valores de un ENUM de forma segura. */
  }
}
