# Documentación: Sistema de Reportes - CallCenter

## 1. Descripción General
Módulo que genera y visualiza reportes estadísticos de reclamos agrupados por diferentes criterios (oficina, categoría, recepcionista, subalcaldía, distrito, estado). Todos los endpoints requieren autenticación JWT y rol de **Administrador** o **Gerente**.

---

## 2. Endpoints Disponibles

### 2.1. Reportes Individuales

| Endpoint                              | Método | Parámetro | Descripción                     |
|--------------------------------------|--------|-----------|---------------------------------|
| `/api/reports/by-office/:year`       | GET    | year      | Reporte por oficina             |
| `/api/reports/by-category/:year`     | GET    | year      | Reporte por categoría de reclamo|
| `/api/reports/by-receptionist/:year` | GET    | year      | Reporte por recepcionista       |
| `/api/reports/by-submayor/:year`     | GET    | year      | Reporte por subalcaldía         |
| `/api/reports/by-district/:year`     | GET    | year      | Reporte por distrito            |
| `/api/reports/by-status/:year`       | GET    | year      | Reporte por estado de reclamo   |

### 2.2. Reporte Consolidado

| Endpoint               | Método | Parámetro | Descripción                            |
|------------------------|--------|-----------|----------------------------------------|
| `/api/reports/all/:year` | GET  | year      | Todos los reportes en una sola llamada |

---

## 3. Estructura de Respuesta

Todos los endpoints devuelven el siguiente formato JSON:

```typescript
{
  "total": number,    // Total de reclamos
  "results": [
    {
      "name": string,      // Nombre del grupo (ej: nombre de oficina)
      "count": number,     // Cantidad de reclamos
      "percentage": number // Porcentaje (0–100)
    }
  ]
}
