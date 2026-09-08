# 🚀 ARRANQUE.md — Guía de Arranque del Entorno de Desarrollo

## Prerrequisitos

- **Docker Desktop** instalado y corriendo (con WSL2 en Windows)
- **Docker Compose V2** (`docker compose` — sin guion)
- **Puerto 5432** libre (detener cualquier instancia local de PostgreSQL)

---

## 🟢 Paso 1: Levantar la Base de Datos primero

```bash
docker compose up -d db
```

Esperar a que el healthcheck marque `healthy`:

```bash
docker compose ps db
# Verificar que STATUS muestre "(healthy)"
```

---

## 🟢 Paso 2: Crear la base de datos `gamc_db`

PostgreSQL solo crea automáticamente la DB definida en `POSTGRES_DB` (`dbCallCenter`).
El servicio `gamc_backend` (Prisma) necesita `gamc_db`, así que la creamos manualmente:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE gamc_db;"
```

Verificar que ambas bases de datos existan:

```bash
docker compose exec db psql -U postgres -c "\l"
# Debe mostrar: dbCallCenter y gamc_db
```

---

## 🟢 Paso 3: Levantar todos los servicios

```bash
docker compose up -d --build
```

Verificar que todos los contenedores estén corriendo:

```bash
docker compose ps
```

Servicios esperados (9 contenedores):
| Contenedor | Puerto | Estado esperado |
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

---

## 🟢 Paso 4: Sincronizar Prisma (gamc_backend)

Ejecutar las migraciones de Prisma dentro del contenedor `gamc_backend`:

```bash
docker compose exec gamc_backend npx prisma migrate dev --name init_gamc
```

> **Nota:** Si es la primera vez, esto creará las tablas en `gamc_db` según el esquema definido en `prisma/schema.prisma`.

Para verificar las tablas creadas:

```bash
docker compose exec db psql -U postgres -d gamc_db -c "\dt"
```

---

## 🟢 Paso 5: Configurar Ollama — Descargar modelo y compilar clasificador

### 5a. Descargar el modelo base `llama3.2`:

```bash
docker compose exec ollama ollama pull llama3.2
```

> ⏳ Este paso puede tardar varios minutos dependiendo de tu conexión.

### 5b. Compilar el modelo personalizado `gamc-clasificador`:

```bash
docker compose exec ollama ollama create gamc-clasificador -f /root/ollama-config/Modelfile
```

### 5c. Verificar que el modelo esté disponible:

```bash
docker compose exec ollama ollama list
# Debe mostrar: gamc-clasificador y llama3.2
```

### 5d. Probar el modelo (opcional):

```bash
docker compose exec ollama ollama run gamc-clasificador "Hay un poste de luz caído en la avenida Heroínas esquina Ayacucho, los cables están expuestos y es peligroso para los peatones"
```

---

## 🧪 Verificación Rápida de Servicios

### Backend principal (BackCallCenter):
```bash
curl http://localhost:3000/api/health
```

### GAMC Backend:
```bash
curl http://localhost:4000/api/v1/health
```

### Whisper STT:
```bash
curl http://localhost:5000/health
```

### CochaExacta:
```bash
curl http://localhost:5011/health
```

### Ollama:
```bash
curl http://localhost:11434/api/tags
```

### Frontends (abrir en navegador):
- **Panel Administrativo:** http://localhost:5173
- **Portal Ciudadano:** http://localhost:5174
- **GAMC Frontend (IA):** http://localhost:5175

---

## 🔄 Comandos Útiles

### Reiniciar un servicio específico:
```bash
docker compose restart gamc_backend
```

### Ver logs en tiempo real:
```bash
docker compose logs -f gamc_backend whisper ollama
```

### Reconstruir un servicio (después de cambios en Dockerfile):
```bash
docker compose up -d --build gamc_backend
```

### Detener todo:
```bash
docker compose down
```

### Detener y eliminar volúmenes (⚠️ borra datos de DB):
```bash
docker compose down -v
```

---

## 🗺️ Mapa de Puertos

| Puerto | Servicio | Tecnología |
|--------|----------|------------|
| 3000 | BackCallCenter | Node.js + Express + TypeORM |
| 4000 | gamc-backend | Node.js + Express + Prisma |
| 5000 | whisper-service | Python + FastAPI + Whisper |
| 5011 | CochaExacta | .NET 8 Web API |
| 5173 | FrontCallCenter | React + Vite |
| 5174 | LandingCallCenter | React + Vite |
| 5175 | gamc-frontend | React + Vite |
| 5432 | PostgreSQL | PostGIS 16-3.4 |
| 11434 | Ollama | LLM Server |
