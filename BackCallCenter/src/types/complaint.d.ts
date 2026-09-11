export type ComplaintStatus = 'Pendiente' | 'Atendido' | 'Derivado';

export interface ComplaintInput {
  names: string;
  lastname: string;
  phone: string;
  code?: string;
  incident: string;
  latitude: string;
  longitude: string;
  address: string;
  risk?: number;
  amount?: number;
  evidence?: string;
  status?: ComplaintStatus;
  createdBy: number;
  editBy?: number;
  categoryId: number;
  mandatedId?: number;
  companyId?: number;
  locationId: number;
}
