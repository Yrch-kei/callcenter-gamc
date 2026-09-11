import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentAndCascade1775400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Department table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Department" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying(200) NOT NULL,
        "description" character varying(500) NOT NULL DEFAULT '',
        "status" integer NOT NULL DEFAULT 1,
        "registerDate" timestamp without time zone NOT NULL DEFAULT now(),
        "userId" integer NOT NULL
      )
    `);

    // 2. Add departmentId to Unit (nullable FK to Department)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'Unit' AND column_name = 'departmentId'
        ) THEN
          ALTER TABLE "Unit" ADD COLUMN "departmentId" integer;
          ALTER TABLE "Unit" ADD CONSTRAINT "FK_Unit_departmentId"
            FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL;
        END IF;
      END $$
    `);

    // 3. Add parentCategoryId to Category (self-referential, nullable)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'Category' AND column_name = 'parentCategoryId'
        ) THEN
          ALTER TABLE "Category" ADD COLUMN "parentCategoryId" integer;
          ALTER TABLE "Category" ADD CONSTRAINT "FK_Category_parentCategoryId"
            FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL;
        END IF;
      END $$
    `);

    // 4. Add 'En proceso' to Complaint status enum if missing
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'En proceso'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Complaint_status_enum')
        ) THEN
          ALTER TYPE "Complaint_status_enum" ADD VALUE 'En proceso' AFTER 'Derivada';
        END IF;
      END $$
    `);

    // 5. Create ComplaintImage table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ComplaintImage" (
        "id" SERIAL PRIMARY KEY,
        "url" character varying(500) NOT NULL,
        "type" character varying(10) NOT NULL DEFAULT 'BEFORE',
        "complaintId" integer,
        CONSTRAINT "FK_ComplaintImage_complaintId"
          FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE
      )
    `);

    // 6. Add tipo column to ComplaintHistory if missing
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'ComplaintHistory' AND column_name = 'tipo'
        ) THEN
          ALTER TABLE "ComplaintHistory" ADD COLUMN "tipo" character varying(50) NOT NULL DEFAULT 'nota';
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "FK_Category_parentCategoryId"`);
    await queryRunner.query(`ALTER TABLE "Category" DROP COLUMN IF EXISTS "parentCategoryId"`);
    await queryRunner.query(`ALTER TABLE "Unit" DROP CONSTRAINT IF EXISTS "FK_Unit_departmentId"`);
    await queryRunner.query(`ALTER TABLE "Unit" DROP COLUMN IF EXISTS "departmentId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ComplaintImage"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Department"`);
    await queryRunner.query(`ALTER TABLE "ComplaintHistory" DROP COLUMN IF EXISTS "tipo"`);
  }
}
