import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaInicialPostgres1775266274599 implements MigrationInterface {
    name = 'SchemaInicialPostgres1775266274599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Role" ("id" SERIAL NOT NULL, "name" character varying(40) NOT NULL DEFAULT 'Usuario', CONSTRAINT "PK_9309532197a7397548e341e5536" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Unit" ("id" SERIAL NOT NULL, "name" character varying(200) NOT NULL, "description" character varying(600) NOT NULL, "status" integer NOT NULL DEFAULT '1', "registerDate" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, CONSTRAINT "PK_0a83556fc363a57bdeee23f9a9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "User" ("id" SERIAL NOT NULL, "names" character varying(100) NOT NULL, "lastname" character varying(70) NOT NULL, "secondLastname" character varying(70), "ci" character varying(13) NOT NULL, "phone" character varying(13) NOT NULL, "birthdate" date NOT NULL, "gender" character varying NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "status" integer NOT NULL DEFAULT '1', "registerDate" TIMESTAMP NOT NULL DEFAULT now(), "updateDate" TIMESTAMP, "deleteDate" TIMESTAMP, "userId" integer NOT NULL, "roleId" integer, "unitId" integer, CONSTRAINT "UQ_4050206b9de559c77726907a79d" UNIQUE ("ci"), CONSTRAINT "UQ_4a257d2c9837248d70640b3e36e" UNIQUE ("email"), CONSTRAINT "PK_9862f679340fb2388436a5ab3e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Category" ("id" SERIAL NOT NULL, "name" character varying(55) NOT NULL, "status" integer NOT NULL DEFAULT '1', "registerDate" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "unitId" integer, CONSTRAINT "PK_c2727780c5b9b0c564c29a4977c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Mandated" ("id" integer NOT NULL, "speciality" character varying(150) NOT NULL DEFAULT 'General', CONSTRAINT "PK_15a33e36786390c0728d2c2a33c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Company" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL DEFAULT 'Empresa Sin Nombre', "status" integer NOT NULL DEFAULT '1', "registerDate" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, CONSTRAINT "PK_b4993a6b3d3194767a59698298f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Location" ("id" SERIAL NOT NULL, "deputtyMajor" character varying(255) NOT NULL DEFAULT 'Sin información', "district" character varying(255) NOT NULL DEFAULT 'Distrito no especificado', CONSTRAINT "PK_d0125e359cde2707aec388b9c59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Complaint_status_enum" AS ENUM('Pendiente', 'Derivada', 'Resuelta', 'Cancelada')`);
        await queryRunner.query(`CREATE TABLE "Complaint" ("id" SERIAL NOT NULL, "ubicacion" geometry(Point,4326) NOT NULL, "names" character varying(100) NOT NULL DEFAULT 'Anónimo', "lastname" character varying(160) NOT NULL DEFAULT '', "phone" character varying(13) NOT NULL DEFAULT '0000000', "code" character varying(20) NOT NULL, "incident" character varying(255) NOT NULL DEFAULT 'Incidente no especificado', "latitude" numeric(10,8) NOT NULL DEFAULT '0', "longitude" numeric(11,8) NOT NULL DEFAULT '0', "address" character varying(255) NOT NULL DEFAULT 'Dirección no especificada', "risk" integer NOT NULL DEFAULT '1', "amount" integer NOT NULL DEFAULT '1', "evidence" character varying(255) NOT NULL, "status" "public"."Complaint_status_enum" NOT NULL DEFAULT 'Pendiente', "registerDate" TIMESTAMP NOT NULL DEFAULT now(), "updateDate" TIMESTAMP, "createdBy" integer, "editBy" integer, "categoryId" integer, "mandatedId" integer, "companyId" integer, "locationId" integer, CONSTRAINT "UQ_61434a77ac11e28a36a7dcbc94d" UNIQUE ("code"), CONSTRAINT "PK_8b1c25f99a597f56f9c80a10283" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_55cc9284a05adfde66e66eb3eb" ON "Complaint" USING GiST ("ubicacion") `);
        await queryRunner.query(`CREATE TYPE "public"."UserComplaint_status_enum" AS ENUM('active', 'completed', 'reassigned', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "UserComplaint" ("id" SERIAL NOT NULL, "status" "public"."UserComplaint_status_enum" NOT NULL DEFAULT 'active', "startDate" TIMESTAMP NOT NULL DEFAULT now(), "endDate" TIMESTAMP, "cancellationReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP, "userId" integer, "complaintId" integer, "assignedById" integer, CONSTRAINT "PK_957d45d0a3312cbd5691dc3e159" PRIMARY KEY ("id"))`);
       await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5d03ca290db0b6b309531aca64" ON "UserComplaint" ("userId", "complaintId", "status") WHERE status = 'active'`);
        await queryRunner.query(`CREATE TABLE "ComplaintHistory" ("id" SERIAL NOT NULL, "complaintId" integer NOT NULL, "description" character varying(300) NOT NULL, "status" smallint NOT NULL DEFAULT '1', "registerDate" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, CONSTRAINT "PK_2310bc462b3382742243090fb70" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "User" ADD CONSTRAINT "FK_0b8c60cc29663fa5b9fb108edd7" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "User" ADD CONSTRAINT "FK_bc9dfcd9ccc9a843ef3ee8d3fb8" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Category" ADD CONSTRAINT "FK_810f93fa78575dd29b815abba46" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Mandated" ADD CONSTRAINT "FK_15a33e36786390c0728d2c2a33c" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD CONSTRAINT "FK_825ad7c2a9434fef85ee0bb81eb" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD CONSTRAINT "FK_f62f4b5e2a4288f083c9db04462" FOREIGN KEY ("editBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD CONSTRAINT "FK_8a8561853982e872b2de7f33b3e" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD CONSTRAINT "FK_0e6a9876d1b7b389d51a937b63c" FOREIGN KEY ("mandatedId") REFERENCES "Mandated"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD CONSTRAINT "FK_4dc5ef466ddbfeddabf3176b4c1" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Complaint" ADD CONSTRAINT "FK_e1252aa662d5814ba972d5befaf" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserComplaint" ADD CONSTRAINT "FK_2297c8b737a4160fdb8afec61ee" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserComplaint" ADD CONSTRAINT "FK_f8fba1ddad2f5770b546d21efc9" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserComplaint" ADD CONSTRAINT "FK_330d1a922687c6dc9a84d8e6284" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ComplaintHistory" ADD CONSTRAINT "FK_d5a0dda547f7e712bf9baf8c08f" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ComplaintHistory" ADD CONSTRAINT "FK_4e5bed8b954422347a4afce5b27" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ComplaintHistory" DROP CONSTRAINT "FK_4e5bed8b954422347a4afce5b27"`);
        await queryRunner.query(`ALTER TABLE "ComplaintHistory" DROP CONSTRAINT "FK_d5a0dda547f7e712bf9baf8c08f"`);
        await queryRunner.query(`ALTER TABLE "UserComplaint" DROP CONSTRAINT "FK_330d1a922687c6dc9a84d8e6284"`);
        await queryRunner.query(`ALTER TABLE "UserComplaint" DROP CONSTRAINT "FK_f8fba1ddad2f5770b546d21efc9"`);
        await queryRunner.query(`ALTER TABLE "UserComplaint" DROP CONSTRAINT "FK_2297c8b737a4160fdb8afec61ee"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP CONSTRAINT "FK_e1252aa662d5814ba972d5befaf"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP CONSTRAINT "FK_4dc5ef466ddbfeddabf3176b4c1"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP CONSTRAINT "FK_0e6a9876d1b7b389d51a937b63c"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP CONSTRAINT "FK_8a8561853982e872b2de7f33b3e"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP CONSTRAINT "FK_f62f4b5e2a4288f083c9db04462"`);
        await queryRunner.query(`ALTER TABLE "Complaint" DROP CONSTRAINT "FK_825ad7c2a9434fef85ee0bb81eb"`);
        await queryRunner.query(`ALTER TABLE "Mandated" DROP CONSTRAINT "FK_15a33e36786390c0728d2c2a33c"`);
        await queryRunner.query(`ALTER TABLE "Category" DROP CONSTRAINT "FK_810f93fa78575dd29b815abba46"`);
        await queryRunner.query(`ALTER TABLE "User" DROP CONSTRAINT "FK_bc9dfcd9ccc9a843ef3ee8d3fb8"`);
        await queryRunner.query(`ALTER TABLE "User" DROP CONSTRAINT "FK_0b8c60cc29663fa5b9fb108edd7"`);
        await queryRunner.query(`DROP TABLE "ComplaintHistory"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d03ca290db0b6b309531aca64"`);
        await queryRunner.query(`DROP TABLE "UserComplaint"`);
        await queryRunner.query(`DROP TYPE "public"."UserComplaint_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_55cc9284a05adfde66e66eb3eb"`);
        await queryRunner.query(`DROP TABLE "Complaint"`);
        await queryRunner.query(`DROP TYPE "public"."Complaint_status_enum"`);
        await queryRunner.query(`DROP TABLE "Location"`);
        await queryRunner.query(`DROP TABLE "Company"`);
        await queryRunner.query(`DROP TABLE "Mandated"`);
        await queryRunner.query(`DROP TABLE "Category"`);
        await queryRunner.query(`DROP TABLE "User"`);
        await queryRunner.query(`DROP TABLE "Unit"`);
        await queryRunner.query(`DROP TABLE "Role"`);
    }

}
