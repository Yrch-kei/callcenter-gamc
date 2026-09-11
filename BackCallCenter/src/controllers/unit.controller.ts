import { Request, Response } from 'express';
import { UnitService } from '../services/unit.service';

const unitService = new UnitService();

export const createUnit = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    const unit = await unitService.create(req.body, authUserId!);
    res.status(201).json(unit);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUnits = async (_req: Request, res: Response) => {
  try {
    const units = await unitService.findAll();
    res.status(200).json(units);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnitById = async (req: Request, res: Response) => {
  try {
    const unit = await unitService.findOne(Number(req.params.id));
    if (!unit) {
      res.status(404).json({ message: 'Unidad no encontrada' });
      return;
    }
    res.status(200).json(unit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUnit = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    const unit = await unitService.update(Number(req.params.id), req.body, authUserId!);
    if (!unit) {
      res.status(404).json({ message: 'Unidad no encontrada' });
      return;
    }
    res.status(200).json(unit);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUnit = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    await unitService.delete(Number(req.params.id), authUserId!);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};