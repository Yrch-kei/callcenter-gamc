import { Request, Response } from 'express';
import { DepartmentService } from '../services/department.service';

const service = new DepartmentService();

export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await service.findAll();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const dept = await service.findOne(Number(req.params.id));
    if (!dept) { res.status(404).json({ message: 'Departamento no encontrado' }); return; }
    res.json(dept);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const dept = await service.create(req.body, req.user!.id);
    res.status(201).json(dept);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await service.update(Number(req.params.id), req.body);
    if (!updated) { res.status(404).json({ message: 'Departamento no encontrado' }); return; }
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = await service.remove(Number(req.params.id));
    if (!ok) { res.status(404).json({ message: 'Departamento no encontrado' }); return; }
    res.json({ message: 'Departamento eliminado' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
