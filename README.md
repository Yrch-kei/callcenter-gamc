# 📞 ProyectoCallCenter — Sistema de Denuncias Ciudadanas GAMC

Sistema integral de gestión de denuncias ciudadanas para el **Gobierno Autónomo Municipal de Cochabamba (GAMC)**, con clasificación automática mediante Inteligencia Artificial, transcripción de voz y geolocalización.

---

## 📋 Tabla de Contenido

- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Prerrequisitos](#-prerrequisitos)
- [Estructura del Monorepo](#-estructura-del-monorepo)
- [Configuración Inicial](#-configuración-inicial)
- [Base de Datos](#-base-de-datos)
- [Modelo de IA (Ollama)](#-modelo-de-ia-ollama)
- [Arranque Completo con Docker](#-arranque-completo-con-docker)
- [Desarrollo Local (Sin Docker)](#-desarrollo-local-sin-docker)
- [Mapa de Puertos](#-mapa-de-puertos)
- [Variables de Entorno](#-variables-de-entorno)
- [Usuarios por Defecto](#-usuarios-por-defecto)
- [Verificación de Servicios](#-verificación-de-servicios)
- [Comandos Útiles](#-comandos-útiles)
- [Solución de Problemas](#-solución-de-problemas)

---

## 🏗 Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                                 │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐  │
│  │ LandingCallCenter│   │ FrontCallCenter  │   │  gamc-frontend   │  │
│  │ Portal Ciudadano │   │ Panel Admin/Ops  │   │ Panel IA (GAMC)  │  │
│  │    :5174         │   │    :5173         │   │    :5175         │  │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘ │
└───────────┼──────────────────────┼──────────────────────┼────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌───────────────────────┐ ┌────────────────────┐ ┌─────────────────────┐
│   BackCallCenter      │ │   gamc-backend     │ │   CochaExacta       │
│   API Principal       │ │   API Satélite IA  │ │   Microservicio GIS │
│   Express + TypeORM   │ │   Express + Prisma │ │   .NET 8 Web API    │
│       :3000           │ │       :4000        │ │       :5011         │
└──────────┬────────────┘ └────────┬───────────┘ └─────────────────────┘
           │                       │
           ▼                       ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     SERVICIOS DE SOPORTE                              │
│  ┌──────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │   PostgreSQL 16  │  │   Ollama (LLM)     │  │   Whisper (STT)  │  │
│  │   + PostGIS      │  │   llama3.2 +       │  │   FastAPI +      │  │
│  │   :5432          │  │   gamc-clasificador │  │   OpenAI Whisper │  │
│  │                  │  │   :11434           │  │   :5000          │  │
│  └──────────────────┘  └────────────────────┘  └──────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### Flujo Principal

1. El **ciudadano** registra su denuncia en `LandingCallCenter` (:5174) mediante texto o audio.
2. Si es audio, **Whisper** (:5000) lo transcribe a texto.
3. **Ollama** (:11434) clasifica automáticamente la categoría, subcategoría, unidad de derivación y prioridad.
4. La denuncia se persiste en `dbCallCenter` a través de **BackCallCenter** (:3000), generando un código único `GAMC-YYYY-XXXXX`.
5. **Operadores y administradores** gestionan las denuncias en `FrontCallCenter` (:5173).
6. El ciudadano puede consultar el estado de su denuncia con su código de seguimiento.

---

## 🛠 Tecnologías Utilizadas

| Componente | Tecnología |
|---|---|
| **BackCallCenter** | Node.js 20, Express 5, TypeORM 0.3, TypeScript |
| **gamc-backend** | Node.js 20, Express 4, Prisma 5, TypeScript |
| **FrontCallCenter** | React 19, Vite 8, TailwindCSS 4, Recharts, Leaflet |
| **LandingCallCenter** | React 19, Vite 8, TailwindCSS 4, GSAP |
| **gamc-frontend** | React, Vite, TypeScript |
| **CochaExacta** | .NET 8, ASP.NET Core Web API |
| **whisper-service** | Python 3.11, FastAPI, OpenAI Whisper, PyTorch |
| **Base de datos** | PostgreSQL 16 + PostGIS 3.4 |
| **IA / LLM** | Ollama + llama3.2 (modelo personalizado `gamc-clasificador`) |
| **Contenedores** | Docker + Docker Compose |

---

## ✅ Prerrequisitos

### Obligatorios

- **Docker Desktop** ≥ 4.x (con WSL2 en Windows)
- **Docker Compose V2** (`docker compose` — sin guion)
- **Git** ≥ 2.x
- Al menos **8 GB de RAM** libres (Ollama + Whisper son intensivos)
- Al menos **15 GB de disco** disponibles (imágenes Docker + modelo LLM)

### Opcionales (para desarrollo local sin Docker)

- **Node.js** ≥ 20.x y **npm** ≥ 10.x
- **PostgreSQL** 16 + extensión PostGIS
- **Python** 3.11 + pip
- **.NET SDK** 8.0
- **Ollama** instalado nativamente: https://ollama.com

---

## 📁 Estructura del Monorepo

```
ProyectoCallCenter/
├── BackCallCenter/          # API principal (Express + TypeORM)
│   ├── database/
│   │   └── schema.sql       # DDL + datos semilla de dbCallCenter
│   ├── src/
│   │   ├── config/          # Conexión a DB, configuración general
│   │   ├── controllers/     # Controladores REST
│   │   ├── models/          # Entidades TypeORM
│   │   ├── services/        # Lógica de negocio
│   │   ├── routes/          # Definición de rutas
│   │   ├── middlewares/     # Auth JWT, CORS, roles
│   │   └── app.ts           # Entry point
│   ├── uploads/             # Fotos subidas (gitignored)
│   ├── Dockerfile.dev
│   └── package.json
│
├── gamc-backend/            # Backend satélite IA (Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma    # Esquema de gamc_db
│   ├── src/
│   ├── Dockerfile.dev
│   └── package.json
│
├── FrontCallCenter/         # Panel administrativo (React + Vite)
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── context/         # Contextos React (Auth, Denuncias)
│   │   ├── pages/           # Vistas principales
│   │   ├── services/        # Servicios HTTP (axios)
│   │   └── utils/           # Constantes, helpers
│   ├── Dockerfile.dev
│   └── package.json
│
├── LandingCallCenter/       # Portal ciudadano (React + Vite)
│   ├── src/
│   │   ├── components/      # CitizenComplaintAI, etc.
│   │   ├── sections/        # TrackComplaint, Hero, etc.
│   │   └── services/        # aiService, api
│   ├── Dockerfile.dev
│   └── package.json
│
├── gamc-frontend/           # Frontend satélite IA (React + Vite)
│   ├── src/
│   ├── Dockerfile.dev
│   └── package.json
│
├── CochaExacta/             # Microservicio GIS (.NET 8)
│   ├── CochaExacta/         # Proyecto principal
│   ├── CochaExacta.sln
│   └── Dockerfile.dev
│
├── whisper-service/         # Microservicio STT (Python + Whisper)
│   ├── app.py               # FastAPI app
│   └── Dockerfile.dev
│
├── ollama-config/           # Configuración del modelo IA
│   └── Modelfile            # Definición del modelo gamc-clasificador
│
├── docker-compose.yml       # Orquestación de todos los servicios
├── .env                     # Variables de entorno (gitignored)
├── .env.example             # Plantilla de variables de entorno
└── .gitignore
```

---

## ⚙ Configuración Inicial

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/Yrch-kei/callcenter-gamc.git
cd callcenter-gamc
```

### Paso 2: Crear el archivo `.env`

```bash
# Copiar la plantilla
cp .env.example .env
```

Editar el archivo `.env` con los valores correctos:

```env
# ==========================================
# ProyectoCallCenter - Variables de Entorno
# ==========================================

# Database Config (PostgreSQL 16 + PostGIS)
POSTGRES_DB=dbCallCenter
POSTGRES_USER=postgres
POSTGRES_PASSWORD=huevos123
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=huevos123
DB_NAME=dbCallCenter

# Backend Config (BackCallCenter)
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=tu_clave_secreta_jwt_para_desarrollo
JWT_EXPIRES_IN=8h
COCHAEXACTA_URL=http://cochaexacta:5011

# IA Services
OLLAMA_BASE_URL=http://ollama:11434
WHISPER_URL=http://whisper:5000/transcribe

# Email Credentials (Opcional para desarrollo)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion

# File Upload Storage
MAX_FILE_SIZE=5
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Frontend Apps Config
VITE_API_URL=http://localhost:3000/api
```

> ⚠️ **Importante:** El archivo `.env` está en el `.gitignore`. Nunca subas credenciales reales al repositorio.

---

## 🗄 Base de Datos

El proyecto utiliza **PostgreSQL 16 con PostGIS** y maneja **dos bases de datos**:

| Base de Datos | Usado por | ORM | Descripción |
|---|---|---|---|
| `dbCallCenter` | BackCallCenter | TypeORM | Base principal. Denuncias, usuarios, categorías, historial |
| `gamc_db` | gamc-backend | Prisma | Base satélite IA. Usuarios IA, complaints clasificadas |

### Esquema de `dbCallCenter`

El esquema se inicializa automáticamente desde `BackCallCenter/database/schema.sql` al crear el contenedor de PostgreSQL. Incluye:

**Tablas principales:**

| Tabla | Descripción |
|---|---|
| `Role` | Roles del sistema (Administrador, Jefe de Unidad, Operador, etc.) |
| `Department` | Departamentos municipales |
| `Unit` | Unidades operativas (pertenecen a un departamento) |
| `User` | Usuarios del sistema (operadores, técnicos, admin) |
| `Category` | Categorías de denuncias (jerárquicas con subcategorías) |
| `Company` | Empresas contratistas |
| `Location` | Ubicaciones / distritos |
| `Mandated` | Personal de campo (extensión 1:1 de User) |
| `Complaint` | **Tabla principal de denuncias** |
| `ComplaintImage` | Fotos BEFORE/AFTER de intervención |
| `ComplaintHistory` | Historial de cambios de estado (auditoría) |
| `UserComplaint` | Asignaciones de campo |

**Enums de estado de denuncia:**

```sql
'Pendiente' → 'Derivada' → 'En proceso' → 'Resuelta'
                                          → 'Cancelada'
```

**Datos semilla incluidos:**
- 5 roles del sistema
- 4 departamentos municipales
- 6 unidades operativas
- 11 categorías principales + 4 subcategorías
- 3 empresas contratistas
- 1 usuario administrador por defecto

### Esquema de `gamc_db`

Gestionado por Prisma. Se crea con migraciones automáticas. Tablas:
- `users` — Usuarios del subsistema IA
- `complaints` — Denuncias clasificadas por IA
- `complaint_images` — Imágenes adjuntas
- `complaint_history` — Historial de estados

---

## 🤖 Modelo de IA (Ollama)

El sistema utiliza un modelo **Ollama personalizado** (`gamc-clasificador`) basado en `llama3.2` para clasificar automáticamente las denuncias ciudadanas.

### ¿Qué hace el modelo?

Analiza la descripción del ciudadano y retorna un JSON con:

```json
{
  "categoria": "ALUMBRADO_PUBLICO",
  "subcategoria": "POSTE_DANADO",
  "unidad_derivacion": "DEPARTAMENTO DE ALUMBRADO PUBLICO",
  "prioridad": "ALTA",
  "confianza": 0.92,
  "resumen_limpio": "Poste de alumbrado público dañado en Av. Heroínas esquina Ayacucho"
}
```

### Catálogo de derivación

| Categoría | Unidad de Derivación |
|---|---|
| `ALUMBRADO_PUBLICO` | Departamento de Alumbrado Público |
| `BACHEO_Y_VIAS` | Dirección de Obras Públicas |
| `AGUA_Y_ALCANTARILLADO` | SEMAPA |
| `RESIDUOS_SOLIDOS` | EMSA |
| `AREAS_VERDES_Y_FORESTAL` | Unidad Forestal / EMAVRA |
| `TRANSPORTE_PUBLICO` | Dirección de Gestión de Movilidad Urbana |
| `ESTACIONAMIENTO_TARIFADO` | División de Servicio de Estacionamiento Municipal |
| `CONTROL_ACTIVIDADES_E_INTENDENCIA` | Dirección de Intendencia |
| `MEDIO_AMBIENTE` | Dirección de Medio Ambiente |
| `URBANISMO_Y_OBRAS` | Subalcaldía de Jurisdicción |
| `SALUD_Y_SISTEMA_INNOVA` | Soporte de Sistemas / Dirección de Salud |
| `ZOONOSIS` | División de Zoonosis |

---

## 🐳 Arranque Completo con Docker

### Paso 1 — Levantar la base de datos

```bash
docker compose up -d db
```

Esperar a que el healthcheck marque `healthy`:

```bash
docker compose ps db
# STATUS debe mostrar "(healthy)"
```

### Paso 2 — Crear la base de datos `gamc_db`

PostgreSQL solo crea automáticamente `dbCallCenter`. La segunda base (`gamc_db`) se crea manualmente:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE gamc_db;"
```

Verificar que ambas existan:

```bash
docker compose exec db psql -U postgres -c "\l"
# Debe mostrar: dbCallCenter y gamc_db
```

### Paso 3 — Generar el hash del usuario administrador

El `schema.sql` incluye un usuario admin con contraseña placeholder. Hay que generar el hash bcrypt real:

```bash
# Opción A: Desde Node.js local
node -e "const b=require('bcryptjs'); b.hash('Admin2024!',10).then(h=>console.log(h))"

# Opción B: Desde el contenedor backend (después del Paso 4)
docker compose exec backend node -e "const b=require('bcryptjs'); b.hash('Admin2024!',10).then(h=>console.log(h))"
```

Actualizar el hash en la base de datos:

```bash
docker compose exec db psql -U postgres -d dbCallCenter -c "
  UPDATE \"User\" SET \"password\" = '\$2b\$10\$HASH_GENERADO_AQUI' WHERE \"email\" = 'admin@municipio.gob';
"
```

### Paso 4 — Levantar todos los servicios

```bash
docker compose up -d --build
```

Verificar que los 9 contenedores estén corriendo:

```bash
docker compose ps
```

| Contenedor | Puerto | Estado Esperado |
|---|---|---|
| `callcenter-db` | 5432 | healthy |
| `callcenter-ollama` | 11434 | running |
| `callcenter-whisper` | 5000 | running |
| `callcenter-backend` | 3000 | running |
| `callcenter-cochaexacta` | 5011 | running |
| `callcenter-gamc-backend` | 4000 | running |
| `callcenter-frontend` | 5173 | running |
| `callcenter-landing` | 5174 | running |
| `callcenter-gamc-frontend` | 5175 | running |

### Paso 5 — Sincronizar Prisma (gamc-backend)

Ejecutar las migraciones de Prisma para crear las tablas en `gamc_db`:

```bash
docker compose exec gamc_backend npx prisma migrate dev --name init_gamc
```

Verificar las tablas:

```bash
docker compose exec db psql -U postgres -d gamc_db -c "\dt"
```

### Paso 6 — Configurar Ollama

#### 6a. Descargar el modelo base `llama3.2`:

```bash
docker compose exec ollama ollama pull llama3.2
```

> ⏳ Puede tardar varios minutos dependiendo de tu conexión a Internet (~2 GB).

#### 6b. Compilar el modelo personalizado `gamc-clasificador`:

```bash
docker compose exec ollama ollama create gamc-clasificador -f /root/ollama-config/Modelfile
```

#### 6c. Verificar que esté disponible:

```bash
docker compose exec ollama ollama list
# Debe mostrar: gamc-clasificador y llama3.2
```

#### 6d. Probar el modelo (opcional):

```bash
docker compose exec ollama ollama run gamc-clasificador "Hay un poste de luz caído en la avenida Heroínas esquina Ayacucho, los cables están expuestos"
```

### Paso 7 — ¡Listo! Abrir en el navegador

| Aplicación | URL |
|---|---|
| 🏠 Portal Ciudadano | http://localhost:5174 |
| 🖥️ Panel Administrativo | http://localhost:5173 |
| 🤖 Panel IA (GAMC) | http://localhost:5175 |

---

## 💻 Desarrollo Local (Sin Docker)

Si prefieres ejecutar los servicios directamente en tu máquina:

### 1. PostgreSQL

Instalar PostgreSQL 16 + PostGIS. Luego crear las bases de datos:

```sql
CREATE DATABASE "dbCallCenter" OWNER postgres;
CREATE DATABASE "gamc_db" OWNER postgres;
```

Conectar a `dbCallCenter` y ejecutar el esquema:

```bash
psql -U postgres -d dbCallCenter -f BackCallCenter/database/schema.sql
```

### 2. BackCallCenter (API Principal)

```bash
cd BackCallCenter

# Crear .env local
cp .env.example .env
# Editar .env: cambiar DB_HOST=db por DB_HOST=localhost

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
# ✅ Corriendo en http://localhost:3000
```

### 3. gamc-backend (API Satélite IA)

```bash
cd gamc-backend

# Crear .env
echo 'DATABASE_URL="postgresql://postgres:huevos123@localhost:5432/gamc_db?schema=public"' > .env
echo 'OLLAMA_BASE_URL=http://localhost:11434' >> .env
echo 'OLLAMA_MODEL=gamc-clasificador' >> .env
echo 'WHISPER_URL=http://localhost:5000/transcribe' >> .env
echo 'PORT=4000' >> .env

# Instalar dependencias
npm install

# Ejecutar migraciones Prisma
npx prisma migrate dev --name init

# Iniciar servidor
npm run dev
# ✅ Corriendo en http://localhost:4000
```

### 4. FrontCallCenter (Panel Administrativo)

```bash
cd FrontCallCenter

# Instalar dependencias
npm install

# Iniciar dev server
npm run dev
# ✅ Corriendo en http://localhost:5173
```

### 5. LandingCallCenter (Portal Ciudadano)

```bash
cd LandingCallCenter

# Instalar dependencias
npm install

# Iniciar dev server
npm run dev
# ✅ Corriendo en http://localhost:5174
```

### 6. whisper-service (STT)

```bash
cd whisper-service

# Crear entorno virtual Python
python -m venv .venv

# Activar entorno (Windows)
.venv\Scripts\activate
# Activar entorno (Linux/Mac)
source .venv/bin/activate

# Instalar dependencias
pip install fastapi "uvicorn[standard]" openai-whisper python-multipart torch torchaudio

# Iniciar servicio
python app.py
# ✅ Corriendo en http://localhost:5000
```

### 7. Ollama (LLM Local)

```bash
# Instalar Ollama: https://ollama.com
# Luego:
ollama pull llama3.2
ollama create gamc-clasificador -f ollama-config/Modelfile
ollama serve
# ✅ Corriendo en http://localhost:11434
```

### 8. CochaExacta (GIS - .NET 8)

```bash
cd CochaExacta
dotnet watch run --project CochaExacta
# ✅ Corriendo en http://localhost:5011
```

---

## 🗺 Mapa de Puertos

| Puerto | Servicio | Tecnología | Descripción |
|--------|----------|------------|-------------|
| **3000** | BackCallCenter | Node.js + Express + TypeORM | API REST principal |
| **4000** | gamc-backend | Node.js + Express + Prisma | API satélite IA |
| **5000** | whisper-service | Python + FastAPI + Whisper | Transcripción de audio a texto |
| **5011** | CochaExacta | .NET 8 Web API | Microservicio de geolocalización |
| **5173** | FrontCallCenter | React + Vite | Panel admin/operadores |
| **5174** | LandingCallCenter | React + Vite | Portal ciudadano |
| **5175** | gamc-frontend | React + Vite | Panel IA |
| **5432** | PostgreSQL | PostGIS 16-3.4 | Base de datos |
| **11434** | Ollama | LLM Server | Servidor de modelos de lenguaje |

---

## 🔐 Variables de Entorno

### Archivo raíz `.env` (leído por docker-compose.yml)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `POSTGRES_DB` | `dbCallCenter` | Nombre de la base de datos principal |
| `POSTGRES_USER` | `postgres` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | *(requerida)* | Contraseña de PostgreSQL |
| `DB_HOST` | `db` (Docker) / `localhost` | Host de la base de datos |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `PORT` | `3000` | Puerto del BackCallCenter |
| `JWT_SECRET` | *(requerida)* | Clave secreta para tokens JWT |
| `JWT_EXPIRES_IN` | `8h` | Tiempo de expiración del JWT |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | URL del servidor Ollama |
| `WHISPER_URL` | `http://whisper:5000/transcribe` | URL del servicio Whisper STT |
| `COCHAEXACTA_URL` | `http://cochaexacta:5011` | URL del microservicio GIS |
| `VITE_API_URL` | `http://localhost:3000/api` | URL de la API para los frontends |
| `MAX_FILE_SIZE` | `5` | Tamaño máximo de archivo en MB |

> **Nota:** Dentro de Docker, los servicios se comunican por nombre de contenedor (`db`, `ollama`, `whisper`). En desarrollo local, usar `localhost`.

---

## 👤 Usuarios por Defecto

El `schema.sql` crea un usuario administrador con los siguientes datos:

| Campo | Valor |
|---|---|
| **Email** | `admin@municipio.gob` |
| **Contraseña** | `Admin2024!` |
| **Rol** | Administrador |
| **CI** | `0000000` |

> ⚠️ **Importante:** Debes generar el hash bcrypt de la contraseña y actualizar la tabla `User` antes de poder iniciar sesión. Ver [Paso 3](#paso-3--generar-el-hash-del-usuario-administrador) de la guía de arranque.

---

## 🧪 Verificación de Servicios

### Health checks por terminal

```bash
# BackCallCenter (API principal)
curl http://localhost:3000/api/health

# gamc-backend (API satélite IA)
curl http://localhost:4000/api/v1/health

# Whisper STT
curl http://localhost:5000/health

# CochaExacta (GIS)
curl http://localhost:5011/health

# Ollama (listar modelos)
curl http://localhost:11434/api/tags
```

### Probar clasificación IA

```bash
curl -X POST http://localhost:4000/api/v1/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "Hay un bache enorme en la calle Junín, ya se han pinchado varios neumáticos"}'
```

### Probar transcripción de audio

```bash
curl -X POST http://localhost:5000/transcribe \
  -F "file=@mi_audio.wav"
```

### Desde el navegador

| URL | Qué verificar |
|---|---|
| http://localhost:5173 | Pantalla de login del panel administrativo |
| http://localhost:5174 | Landing page del portal ciudadano |
| http://localhost:5175 | Panel de clasificación IA |

---

## 🔄 Comandos Útiles

### Docker

```bash
# Levantar todo
docker compose up -d --build

# Ver estado de todos los servicios
docker compose ps

# Ver logs en tiempo real (todos)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f gamc_backend

# Reiniciar un servicio
docker compose restart backend

# Reconstruir solo un servicio
docker compose up -d --build backend

# Detener todo
docker compose down

# Detener y BORRAR volúmenes (⚠️ elimina datos de la DB)
docker compose down -v

# Acceder a la consola de PostgreSQL
docker compose exec db psql -U postgres -d dbCallCenter

# Acceder al shell de un contenedor
docker compose exec backend sh
```

### Base de datos

```bash
# Conectar a dbCallCenter
docker compose exec db psql -U postgres -d dbCallCenter

# Listar todas las tablas
docker compose exec db psql -U postgres -d dbCallCenter -c "\dt"

# Ver denuncias
docker compose exec db psql -U postgres -d dbCallCenter -c 'SELECT id, code, status, "registerDate" FROM "Complaint" ORDER BY id DESC LIMIT 10;'

# Ver usuarios
docker compose exec db psql -U postgres -d dbCallCenter -c 'SELECT id, names, lastname, email, "roleId" FROM "User";'

# Conectar a gamc_db
docker compose exec db psql -U postgres -d gamc_db

# Listar tablas de gamc_db
docker compose exec db psql -U postgres -d gamc_db -c "\dt"
```

### Prisma (gamc-backend)

```bash
# Ejecutar migraciones
docker compose exec gamc_backend npx prisma migrate dev

# Abrir Prisma Studio (GUI para la DB)
docker compose exec gamc_backend npx prisma studio

# Regenerar el cliente Prisma
docker compose exec gamc_backend npx prisma generate

# Resetear la base de datos gamc_db
docker compose exec gamc_backend npx prisma migrate reset
```

### TypeORM (BackCallCenter)

```bash
# Generar una nueva migración
docker compose exec backend npm run migration:generate -- src/migrations/NombreMigracion

# Ejecutar migraciones pendientes
docker compose exec backend npm run migration:run

# Revertir última migración
docker compose exec backend npm run migration:revert
```

### Ollama

```bash
# Listar modelos instalados
docker compose exec ollama ollama list

# Probar el clasificador interactivamente
docker compose exec ollama ollama run gamc-clasificador

# Descargar un modelo nuevo
docker compose exec ollama ollama pull llama3.2

# Recompilar el clasificador (después de editar Modelfile)
docker compose exec ollama ollama create gamc-clasificador -f /root/ollama-config/Modelfile
```

---

## 🔧 Solución de Problemas

### ❌ Error: `CORS: origen no permitido`

**Causa:** El backend no reconoce el origen de la petición.

**Solución:** Verificar que `BackCallCenter/src/app.ts` incluya todos los orígenes:
```typescript
const allowedOrigins = [
  'http://localhost:5173',   // FrontCallCenter
  'http://localhost:5174',   // LandingCallCenter
  'http://localhost:5175',   // gamc-frontend
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];
```

---

### ❌ Error: `column Complaint.title does not exist`

**Causa:** El campo se llama `incident` en la base de datos, no `title`.

**Solución:** Verificar que la entidad TypeORM use `@Column({ name: 'incident' })`.

---

### ❌ Error: `relation "Complaint" does not exist`

**Causa:** El esquema SQL no se ejecutó correctamente.

**Solución:**
```bash
# Verificar que la tabla existe
docker compose exec db psql -U postgres -d dbCallCenter -c "\dt"

# Si no existe, re-ejecutar el esquema
docker compose exec db psql -U postgres -d dbCallCenter -f /docker-entrypoint-initdb.d/init.sql
```

---

### ❌ Error: `connect ECONNREFUSED 127.0.0.1:5432`

**Causa:** PostgreSQL no está corriendo o el backend intenta conectar a `localhost` dentro de Docker.

**Solución:** Dentro de Docker, el host debe ser `db` (nombre del servicio), no `localhost`. Verificar la variable `DB_HOST=db` en el `.env`.

---

### ❌ Ollama no responde o la clasificación falla

**Causa:** El modelo no está descargado o el contenedor no tiene suficiente memoria.

**Solución:**
```bash
# Verificar que Ollama responde
curl http://localhost:11434/api/tags

# Verificar que el modelo existe
docker compose exec ollama ollama list

# Si no aparece, descargar y compilar
docker compose exec ollama ollama pull llama3.2
docker compose exec ollama ollama create gamc-clasificador -f /root/ollama-config/Modelfile
```

---

### ❌ Whisper tarda mucho o falla

**Causa:** La primera transcripción descarga el modelo (~140 MB). Requiere bastante RAM.

**Solución:** Asignar al menos 4 GB de RAM al contenedor Docker. Verificar:
```bash
docker compose logs whisper
# Debe mostrar "Modelo Whisper listo."
```

---

### ❌ El puerto ya está en uso

**Causa:** Otro proceso ocupa el puerto (ej. una instancia local de PostgreSQL en :5432).

**Solución:**
```bash
# Windows: encontrar qué proceso usa el puerto
netstat -ano | findstr :5432

# Matar el proceso
taskkill /PID <PID> /F

# O cambiar el puerto en docker-compose.yml:
# ports:
#   - "5433:5432"   # Puerto externo → interno
```

---

### ❌ `npm install` falla dentro del contenedor

**Causa:** Conflicto entre `node_modules` local y del contenedor.

**Solución:**
```bash
# Borrar node_modules local del servicio afectado
rm -rf BackCallCenter/node_modules
rm -rf FrontCallCenter/node_modules

# Reconstruir
docker compose up -d --build backend front_call_center
```

---

## 📄 Licencia

MIT — GAMC Dev Team

---

## 👥 Equipo

Desarrollado para el **Gobierno Autónomo Municipal de Cochabamba (GAMC)** como sistema integral de atención ciudadana.
