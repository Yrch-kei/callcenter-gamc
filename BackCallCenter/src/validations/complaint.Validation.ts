import { ComplaintInput } from '../types/complaint';

export const isValidLatitude = (lat: string): boolean => {
    const latNum = parseFloat(lat);
    return !isNaN(latNum) && latNum >= -90 && latNum <= 90;
  };
  
  export const isValidLongitude = (lng: string): boolean => {
    const lngNum = parseFloat(lng);
    return !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180;
  };
  
  export const isValidRisk = (risk: number): boolean => {
    return [1, 2, 3, 4].includes(risk); // 1 = Bajo, 2 = Medio, 3 = Alto, 4 = Urgente
  };
  
  export const isValidAmount = (amount: number): boolean => {
    return amount >= 0;
  };
  
  export const isValidEvidence = (evidence?: string): boolean => {
    return evidence === undefined || evidence.length >= 0;
  };
  
export const validateComplaintInput = (data: ComplaintInput) => {
  const errors: Record<string, string> = {};

  if (!data.names || data.names.trim().length === 0) {
    errors.names = 'Nombres requeridos';
  }

  if (!data.lastname || data.lastname.trim().length === 0) {
    errors.lastname = 'Apellido requerido';
  }

  if (!data.incident || data.incident.trim().length === 0) {
    errors.incident = 'Descripción del incidente requerida';
  }

  if (!isValidLatitude(data.latitude)) {
    errors.latitude = 'Latitud inválida';
  }

  if (!isValidLongitude(data.longitude)) {
    errors.longitude = 'Longitud inválida';
  }

  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Dirección requerida';
  }

  if (data.risk !== undefined && !isValidRisk(data.risk)) {
    errors.risk = 'Nivel de riesgo inválido';
  }

  if (data.amount !== undefined && !isValidAmount(data.amount)) {
    errors.amount = 'El monto debe ser positivo';
  }

  if (data.evidence !== undefined && !isValidEvidence(data.evidence)) {
    errors.evidence = 'Evidencia invalida';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};
