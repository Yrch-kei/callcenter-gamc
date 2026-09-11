# Documentación: Sistema de Reportes - Frontend CallCenter

## 1. Descripción General
Módulo que permite visualizar reportes estadísticos de reclamos agrupados por oficina, categoría, recepcionista, etc. Todos los endpoints requieren autenticación con JWT y el rol debe ser Administrador o Gerente.

## 2. Cómo Usar los Endpoints

```javascript
// Ejemplo con fetch para obtener reporte por oficina
const getReports = async (year) => {
  const response = await fetch(`/api/reports/by-office/${year}`, {
    headers: {
      'Authorization': `Bearer ${tuTokenJWT}`
    }
  });
  return await response.json();
};

// Uso
getReports(2023)
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
