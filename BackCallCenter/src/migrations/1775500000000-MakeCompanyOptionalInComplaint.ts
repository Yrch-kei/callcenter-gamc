import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeCompanyOptionalInComplaint1775500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Complaint"
      ALTER COLUMN "companyId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Complaint"
      ALTER COLUMN "companyId" SET NOT NULL
    `);
  }
}
