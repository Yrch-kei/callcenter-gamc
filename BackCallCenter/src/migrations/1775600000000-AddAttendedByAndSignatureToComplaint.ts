import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendedByAndSignatureToComplaint1775600000000 implements MigrationInterface {
  name = 'AddAttendedByAndSignatureToComplaint1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Complaint" ADD "attendedById" integer`);
    await queryRunner.query(`ALTER TABLE "Complaint" ADD "operatorSignature" text`);
    await queryRunner.query(
      `ALTER TABLE "Complaint" ADD CONSTRAINT "FK_Complaint_attendedBy" FOREIGN KEY ("attendedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Complaint" DROP CONSTRAINT "FK_Complaint_attendedBy"`);
    await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "operatorSignature"`);
    await queryRunner.query(`ALTER TABLE "Complaint" DROP COLUMN "attendedById"`);
  }
}
