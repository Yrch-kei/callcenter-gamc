import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: dos cambios de esquema necesarios para la integración frontend-backend
 *
 * 1. Añade el valor 'En proceso' al enum de status en Complaint
 *    (faltaba — el service ya lo usaba y causaría error en BD)
 *
 * 2. Añade la columna 'tipo' a ComplaintHistory
 *    (permite que el frontend distinga el tipo de evento en el timeline)
 */
export class AddEnProcesoAndHistorialTipo1775300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Añadir 'En proceso' al enum de Complaint.status ────────────────────
    // PostgreSQL no permite eliminar valores de enum, pero sí añadir.
    // ADD VALUE es idempotente con IF NOT EXISTS (PG 9.6+).
    await queryRunner.query(`
      ALTER TYPE "complaint_status_enum"
        ADD VALUE IF NOT EXISTS 'En proceso';
    `);

    // ── 2. Añadir columna 'tipo' a ComplaintHistory ───────────────────────────
    // Primero creamos el enum type, luego lo usamos en la columna.
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "complaint_history_tipo_enum" AS ENUM (
          'creacion',
          'asignacion',
          'cambio_estado',
          'nota',
          'derivacion',
          'edicion',
          'intervencion'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "ComplaintHistory"
        ADD COLUMN IF NOT EXISTS "tipo" "complaint_history_tipo_enum"
        NOT NULL DEFAULT 'cambio_estado';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir 'tipo' de ComplaintHistory
    await queryRunner.query(`
      ALTER TABLE "ComplaintHistory" DROP COLUMN IF EXISTS "tipo";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "complaint_history_tipo_enum";
    `);

    // Nota: PostgreSQL no permite eliminar valores de un enum activo.
    // Si necesitas revertir el valor 'En proceso' del status,
    // deberás recrear el enum manualmente o hacer un dump/restore.
  }
}
