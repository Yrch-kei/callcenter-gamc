-- =============================================================
-- CallCenter Municipal — Script de creación de base de datos
-- PostgreSQL 14+ con PostGIS
--
-- USO:
--   1. Crear la base de datos primero:
--        CREATE DATABASE "dbCallCenter" OWNER postgres;
--   2. Conectarse y ejecutar este script:
--        \c dbCallCenter
--        \i schema.sql
-- =============================================================

-- Extensión espacial (requerida para columnas geometry)
CREATE EXTENSION IF NOT EXISTS postgis;


-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE "Complaint_status_enum" AS ENUM (
    'Pendiente',
    'Derivada',
    'En proceso',
    'Resuelta',
    'Cancelada'
);

CREATE TYPE "Complaint_resolutionresult_enum" AS ENUM (
    'Resuelto',
    'Parcial',
    'No Resuelto'
);

CREATE TYPE "ComplaintImage_type_enum" AS ENUM (
    'BEFORE',
    'AFTER'
);

CREATE TYPE "UserComplaint_status_enum" AS ENUM (
    'active',
    'completed',
    'reassigned',
    'cancelled'
);

CREATE TYPE "complaint_history_tipo_enum" AS ENUM (
    'creacion',
    'asignacion',
    'cambio_estado',
    'nota',
    'derivacion',
    'edicion',
    'intervencion'
);


-- =============================================================
-- TABLAS BASE (sin dependencias)
-- =============================================================

CREATE TABLE "Role" (
    "id"   SERIAL        NOT NULL,
    "name" VARCHAR(40)   NOT NULL DEFAULT 'Usuario',
    CONSTRAINT "PK_Role" PRIMARY KEY ("id")
);

CREATE TABLE "Department" (
    "id"           SERIAL       NOT NULL,
    "name"         VARCHAR(200) NOT NULL,
    "description"  VARCHAR(500) NOT NULL DEFAULT '',
    "status"       INTEGER      NOT NULL DEFAULT 1,
    "registerDate" TIMESTAMP    NOT NULL DEFAULT now(),
    "userId"       INTEGER      NOT NULL,            -- referencia lógica (sin FK intencional)
    CONSTRAINT "PK_Department" PRIMARY KEY ("id")
);

CREATE TABLE "Company" (
    "id"           SERIAL       NOT NULL,
    "name"         VARCHAR(150) NOT NULL DEFAULT 'Empresa Sin Nombre',
    "status"       INTEGER      NOT NULL DEFAULT 1,
    "registerDate" TIMESTAMP    NOT NULL DEFAULT now(),
    "userId"       INTEGER      NOT NULL,            -- referencia lógica (sin FK intencional)
    CONSTRAINT "PK_Company" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
    "id"           SERIAL       NOT NULL,
    "deputtyMajor" VARCHAR(255) NOT NULL DEFAULT 'Sin información',
    "district"     VARCHAR(255) NOT NULL DEFAULT 'Distrito no especificado',
    CONSTRAINT "PK_Location" PRIMARY KEY ("id")
);


-- =============================================================
-- UNIT (depende de Department)
-- =============================================================

CREATE TABLE "Unit" (
    "id"           SERIAL       NOT NULL,
    "name"         VARCHAR(200) NOT NULL,
    "description"  VARCHAR(600) NOT NULL,
    "status"       INTEGER      NOT NULL DEFAULT 1,
    "registerDate" TIMESTAMP    NOT NULL DEFAULT now(),
    "userId"       INTEGER      NOT NULL,            -- referencia lógica (sin FK intencional)
    "departmentId" INTEGER,
    CONSTRAINT "PK_Unit" PRIMARY KEY ("id"),
    CONSTRAINT "FK_Unit_departmentId"
        FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL
);


-- =============================================================
-- USER (depende de Role, Unit)
-- =============================================================

CREATE TABLE "User" (
    "id"             SERIAL       NOT NULL,
    "names"          VARCHAR(100) NOT NULL,
    "lastname"       VARCHAR(70)  NOT NULL,
    "secondLastname" VARCHAR(70),
    "ci"             VARCHAR(13)  NOT NULL,
    "phone"          VARCHAR(13)  NOT NULL,
    "birthdate"      DATE         NOT NULL,
    "gender"         VARCHAR(10)  NOT NULL,
    "email"          VARCHAR(255) NOT NULL,
    "password"       VARCHAR(255) NOT NULL,
    "status"         INTEGER      NOT NULL DEFAULT 1,   -- 1=activo, 0=inactivo
    "registerDate"   TIMESTAMP    NOT NULL DEFAULT now(),
    "updateDate"     TIMESTAMP,
    "deleteDate"     TIMESTAMP,                         -- soft delete
    "userId"         INTEGER      NOT NULL,             -- referencia lógica (sin FK intencional)
    "roleId"         INTEGER,
    "unitId"         INTEGER,
    CONSTRAINT "UQ_User_ci"    UNIQUE ("ci"),
    CONSTRAINT "UQ_User_email" UNIQUE ("email"),
    CONSTRAINT "PK_User"       PRIMARY KEY ("id"),
    CONSTRAINT "FK_User_roleId"
        FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE NO ACTION,
    CONSTRAINT "FK_User_unitId"
        FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE NO ACTION
);


-- =============================================================
-- CATEGORY (depende de Unit; autorreferencial para subcategorías)
-- =============================================================

CREATE TABLE "Category" (
    "id"               SERIAL       NOT NULL,
    "name"             VARCHAR(55)  NOT NULL,
    "status"           INTEGER      NOT NULL DEFAULT 1,
    "registerDate"     TIMESTAMP    NOT NULL DEFAULT now(),
    "userId"           INTEGER      NOT NULL,           -- referencia lógica (sin FK intencional)
    "unitId"           INTEGER,
    "parentCategoryId" INTEGER,
    CONSTRAINT "PK_Category" PRIMARY KEY ("id"),
    CONSTRAINT "FK_Category_unitId"
        FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Category_parentCategoryId"
        FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL
);


-- =============================================================
-- MANDATED — Personal de campo (1:1 con User, mismo PK)
-- =============================================================

CREATE TABLE "Mandated" (
    "id"         INTEGER      NOT NULL,
    "speciality" VARCHAR(150) NOT NULL DEFAULT 'General',
    CONSTRAINT "PK_Mandated" PRIMARY KEY ("id"),
    CONSTRAINT "FK_Mandated_id"
        FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE NO ACTION
);


-- =============================================================
-- COMPLAINT (tabla principal)
-- =============================================================

CREATE TABLE "Complaint" (
    "id"               SERIAL                           NOT NULL,
    "ubicacion"        GEOMETRY(Point, 4326)            NOT NULL,
    "names"            VARCHAR(100)                     NOT NULL DEFAULT 'Anónimo',
    "lastname"         VARCHAR(160)                     NOT NULL DEFAULT '',
    "phone"            VARCHAR(13)                      NOT NULL DEFAULT '0000000',
    "code"             VARCHAR(20)                      NOT NULL,
    "incident"         VARCHAR(255)                     NOT NULL DEFAULT 'Incidente no especificado',
    "latitude"         NUMERIC(10, 8)                   NOT NULL DEFAULT 0,
    "longitude"        NUMERIC(11, 8)                   NOT NULL DEFAULT 0,
    "address"          VARCHAR(255)                     NOT NULL DEFAULT 'Dirección no especificada',
    "risk"             INTEGER                          NOT NULL DEFAULT 1,
    "amount"           INTEGER                          NOT NULL DEFAULT 1,
    "evidence"         VARCHAR(255)                     NOT NULL,
    "status"           "Complaint_status_enum"          NOT NULL DEFAULT 'Pendiente',
    "registerDate"     TIMESTAMP                        NOT NULL DEFAULT now(),
    "updateDate"       TIMESTAMP,
    -- Intervención
    "arrivalTime"      TIMESTAMP,
    "finishTime"       TIMESTAMP,
    "technicalNotes"   TEXT,
    "materialsUsed"    TEXT,
    "resolutionResult" "Complaint_resolutionresult_enum",
    "arrivalLocation"  GEOMETRY(Point, 4326),
    "operatorSignature" TEXT,
    -- Relaciones
    "createdBy"    INTEGER,
    "editBy"       INTEGER,
    "attendedById" INTEGER,
    "categoryId"   INTEGER,
    "mandatedId"   INTEGER,
    "companyId"    INTEGER,
    "locationId"   INTEGER,
    CONSTRAINT "UQ_Complaint_code" UNIQUE ("code"),
    CONSTRAINT "PK_Complaint"      PRIMARY KEY ("id"),
    CONSTRAINT "FK_Complaint_createdBy"
        FOREIGN KEY ("createdBy")    REFERENCES "User"("id")     ON DELETE NO ACTION,
    CONSTRAINT "FK_Complaint_editBy"
        FOREIGN KEY ("editBy")       REFERENCES "User"("id")     ON DELETE NO ACTION,
    CONSTRAINT "FK_Complaint_attendedBy"
        FOREIGN KEY ("attendedById") REFERENCES "User"("id")     ON DELETE SET NULL,
    CONSTRAINT "FK_Complaint_categoryId"
        FOREIGN KEY ("categoryId")   REFERENCES "Category"("id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Complaint_mandatedId"
        FOREIGN KEY ("mandatedId")   REFERENCES "Mandated"("id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Complaint_companyId"
        FOREIGN KEY ("companyId")    REFERENCES "Company"("id")  ON DELETE NO ACTION,
    CONSTRAINT "FK_Complaint_locationId"
        FOREIGN KEY ("locationId")   REFERENCES "Location"("id") ON DELETE NO ACTION
);

CREATE INDEX "IDX_Complaint_ubicacion"      ON "Complaint" USING GiST ("ubicacion");
CREATE INDEX "IDX_Complaint_arrivalLocation" ON "Complaint" USING GiST ("arrivalLocation");
CREATE INDEX "IDX_Complaint_status"         ON "Complaint" ("status");
CREATE INDEX "IDX_Complaint_registerDate"   ON "Complaint" ("registerDate");
CREATE INDEX "IDX_Complaint_categoryId"     ON "Complaint" ("categoryId");
CREATE INDEX "IDX_Complaint_createdBy"      ON "Complaint" ("createdBy");


-- =============================================================
-- COMPLAINT IMAGE — Fotos BEFORE/AFTER de intervención
-- =============================================================

CREATE TABLE "ComplaintImage" (
    "id"          SERIAL                       NOT NULL,
    "url"         VARCHAR(500)                 NOT NULL,
    "type"        "ComplaintImage_type_enum"   NOT NULL,
    "complaintId" INTEGER,
    CONSTRAINT "PK_ComplaintImage" PRIMARY KEY ("id"),
    CONSTRAINT "FK_ComplaintImage_complaintId"
        FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE
);

CREATE INDEX "IDX_ComplaintImage_complaintId" ON "ComplaintImage" ("complaintId");
CREATE INDEX "IDX_ComplaintImage_type"        ON "ComplaintImage" ("type");


-- =============================================================
-- USER COMPLAINT — Asignaciones campo
-- =============================================================

CREATE TABLE "UserComplaint" (
    "id"                 SERIAL                       NOT NULL,
    "status"             "UserComplaint_status_enum"  NOT NULL DEFAULT 'active',
    "startDate"          TIMESTAMP                    NOT NULL DEFAULT now(),
    "endDate"            TIMESTAMP,
    "cancellationReason" TEXT,
    "createdAt"          TIMESTAMP                    NOT NULL DEFAULT now(),
    "updatedAt"          TIMESTAMP,
    "userId"             INTEGER,
    "complaintId"        INTEGER,
    "assignedById"       INTEGER,
    CONSTRAINT "PK_UserComplaint" PRIMARY KEY ("id"),
    CONSTRAINT "FK_UserComplaint_userId"
        FOREIGN KEY ("userId")       REFERENCES "User"("id")      ON DELETE NO ACTION,
    CONSTRAINT "FK_UserComplaint_complaintId"
        FOREIGN KEY ("complaintId")  REFERENCES "Complaint"("id") ON DELETE NO ACTION,
    CONSTRAINT "FK_UserComplaint_assignedById"
        FOREIGN KEY ("assignedById") REFERENCES "User"("id")      ON DELETE NO ACTION
);

-- Solo puede haber una asignación activa por usuario+denuncia
CREATE UNIQUE INDEX "IDX_UserComplaint_active"
    ON "UserComplaint" ("userId", "complaintId", "status")
    WHERE status = 'active';

CREATE INDEX "IDX_UserComplaint_userId"      ON "UserComplaint" ("userId");
CREATE INDEX "IDX_UserComplaint_complaintId" ON "UserComplaint" ("complaintId");
CREATE INDEX "IDX_UserComplaint_status"      ON "UserComplaint" ("status");


-- =============================================================
-- COMPLAINT HISTORY — Auditoría
-- =============================================================

CREATE TABLE "ComplaintHistory" (
    "id"           SERIAL                          NOT NULL,
    "complaintId"  INTEGER                         NOT NULL,
    "description"  VARCHAR(300)                    NOT NULL,
    "status"       SMALLINT                        NOT NULL DEFAULT 1,
    "registerDate" TIMESTAMP                       NOT NULL DEFAULT now(),
    "userId"       INTEGER                         NOT NULL,
    "tipo"         "complaint_history_tipo_enum"   NOT NULL DEFAULT 'cambio_estado',
    CONSTRAINT "PK_ComplaintHistory" PRIMARY KEY ("id"),
    CONSTRAINT "FK_ComplaintHistory_complaintId"
        FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_ComplaintHistory_userId"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION
);

CREATE INDEX "IDX_ComplaintHistory_complaintId"  ON "ComplaintHistory" ("complaintId");
CREATE INDEX "IDX_ComplaintHistory_registerDate" ON "ComplaintHistory" ("registerDate");


-- =============================================================
-- SEED — Datos iniciales obligatorios
-- =============================================================

-- Roles del sistema
INSERT INTO "Role" ("name") VALUES
    ('Administrador'),
    ('Jefe de Unidad'),
    ('Operador de Call Center'),
    ('Personal de Campo'),
    ('Tecnico de campo');

-- Departamentos municipales
INSERT INTO "Department" ("name", "description", "userId") VALUES
    ('Infraestructura Vial',  'Gestión de vías, calles y pavimentación',         1),
    ('Servicios Públicos',    'Alumbrado, agua potable y alcantarillado',         1),
    ('Medio Ambiente',        'Residuos sólidos, áreas verdes y contaminación',   1),
    ('Seguridad Ciudadana',   'Fiscalización, vigilancia y orden público',        1);

-- Unidades por departamento
INSERT INTO "Unit" ("name", "description", "userId", "departmentId") VALUES
    ('Mantenimiento Vial',    'Bacheo, señalización y reparación de calles',       1, 1),
    ('Alumbrado Público',     'Mantenimiento de postes, luminarias y cableado',    1, 2),
    ('Agua y Alcantarillado', 'Tuberías, desagüe y conexiones domiciliarias',      1, 2),
    ('Residuos Sólidos',      'Recolección, transporte y disposición de basura',   1, 3),
    ('Áreas Verdes',          'Parques, jardines y arborización urbana',           1, 3),
    ('Orden Público',         'Fiscalización de comercio informal y seguridad',    1, 4);

-- Categorías principales
INSERT INTO "Category" ("name", "userId", "unitId", "parentCategoryId") VALUES
    ('Bache en calzada',        1, 1, NULL),
    ('Señalización dañada',     1, 1, NULL),
    ('Poste sin luz',           1, 2, NULL),
    ('Cable eléctrico caído',   1, 2, NULL),
    ('Fuga de agua',            1, 3, NULL),
    ('Tapón de alcantarilla',   1, 3, NULL),
    ('Basura acumulada',        1, 4, NULL),
    ('Contenedor dañado',       1, 4, NULL),
    ('Árbol peligroso',         1, 5, NULL),
    ('Parque en mal estado',    1, 5, NULL),
    ('Comercio informal',       1, 6, NULL);

-- Subcategorías (parentCategoryId apunta a una categoría padre)
INSERT INTO "Category" ("name", "userId", "unitId", "parentCategoryId") VALUES
    ('Bache grande (> 1m²)',         1, 1, 1),
    ('Bache pequeño (< 1m²)',        1, 1, 1),
    ('Fuga en tubería matriz',       1, 3, 5),
    ('Fuga en conexión domiciliaria',1, 3, 5);

-- Empresas contratistas de ejemplo
INSERT INTO "Company" ("name", "userId") VALUES
    ('Constructora Municipal S.R.L.',  1),
    ('Servicios Técnicos Andinos',     1),
    ('Electro Obras Cochabamba',       1);

-- =============================================================
-- USUARIO ADMINISTRADOR POR DEFECTO
--
-- Contraseña en texto plano: Admin2024!
-- Para generar el hash bcrypt (ejecutar en terminal del backend):
--
--   node -e "const b=require('bcryptjs'); b.hash('Admin2024!',10).then(h=>console.log(h))"
--
-- Reemplazar el valor de "password" con el hash resultante antes
-- de ejecutar este INSERT.
-- =============================================================

INSERT INTO "User" (
    "names", "lastname", "ci", "phone", "birthdate", "gender",
    "email", "password", "status", "userId", "roleId", "unitId"
) VALUES (
    'Administrador',
    'Sistema',
    '0000000',
    '70000000',
    '1990-01-01',
    'M',
    'admin@municipio.gob',
    '$2b$10$REEMPLAZAR_CON_HASH_REAL_GENERADO_CON_BCRYPTJS',
    1,
    1,   -- auto-referencia (requerida por el esquema)
    1,   -- roleId = Administrador
    NULL -- Admin no pertenece a ninguna unidad
);
