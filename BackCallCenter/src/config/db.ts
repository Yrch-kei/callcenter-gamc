import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true, // Activa temporalmente para ver logs de las migraciones
  entities: [`${__dirname}/../models/*.entity.{js,ts}`],
  migrations: [`${__dirname}/../migrations/*.{js,ts}`], // Descomenta esta línea
  migrationsTableName: "migrations", // Asegura el nombre de la tabla
  migrationsRun: false, // Desactiva para control manual
  subscribers: [],
});

export const initializeDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Garantizar existencia de la columna "title" en la tabla Complaint de PostgreSQL
    try {
      await AppDataSource.query(`ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "title" VARCHAR(255) DEFAULT 'Sin título';`);
      await AppDataSource.query(`ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "citizenEmail" VARCHAR(255) NULL;`);
      await AppDataSource.query(`ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "notifyEmail" BOOLEAN DEFAULT FALSE;`);
      await AppDataSource.query(`ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "satisfactionRating" SMALLINT NULL;`);
      await AppDataSource.query(`ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "reopenReason" TEXT NULL;`);
      await AppDataSource.query(`ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "reopenStatus" VARCHAR(30) DEFAULT 'NONE';`);
      await AppDataSource.query(`ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "reopenResolution" TEXT NULL;`);
      await AppDataSource.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255) NULL;`);
      await AppDataSource.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP NULL;`);
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "PushSubscription" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
          "endpoint" TEXT NOT NULL,
          "p256dh" TEXT NOT NULL,
          "auth" TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e: any) {
      console.warn('[DB] Nota al asegurar las columnas:', e.message);
    }
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1);
  }
};