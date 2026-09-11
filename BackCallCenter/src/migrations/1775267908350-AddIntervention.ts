import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIntervention1775267908350 implements MigrationInterface {
    name = 'AddIntervention1775267908350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ComplaintImage_type_enum" AS ENUM('BEFORE', 'AFTER')`);
        await queryRunner.query(`CREATE TABLE "ComplaintImage" ("id" SERIAL NOT NULL, "url" character varying(255) NOT NULL, "type" "public"."ComplaintImage_type_enum" NOT NULL, "complaintId" integer, CONSTRAINT "PK_0ce7043385015a065696e020c3c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD "arrivalTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD "finishTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD "technicalNotes" text`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD "materialsUsed" text`);
        await queryRunner.query(`CREATE TYPE "public"."Complaint_resolutionresult_enum" AS ENUM('Resuelto', 'Parcial', 'No Resuelto')`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD "resolutionResult" "public"."Complaint_resolutionresult_enum"`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD "arrivalLocation" geometry(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "ComplaintImage" ADD CONSTRAINT "FK_03cca2b110846e52fc6a06f9188" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ComplaintImage" DROP CONSTRAINT "FK_03cca2b110846e52fc6a06f9188"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "arrivalLocation"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "resolutionResult"`);
        await queryRunner.query(`DROP TYPE "public"."Complaint_resolutionresult_enum"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "materialsUsed"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "technicalNotes"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "finishTime"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "arrivalTime"`);
        await queryRunner.query(`DROP TABLE "ComplaintImage"`);
        await queryRunner.query(`DROP TYPE "public"."ComplaintImage_type_enum"`);
    }

}
