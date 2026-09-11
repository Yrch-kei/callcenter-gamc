import { Request, Response } from 'express';
import { ComplaintHistoryService } from '../services/complaintHistory.service';

const service = new ComplaintHistoryService();

export const createHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const dto = { ...req.body, userId: req.user!.id };
    const entry = await service.create(dto);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllHistory = async (_req: Request, res: Response): Promise<void> => {
  const list = await service.findAll();
  res.status(200).json(list);
};

export const getHistoryByComplaint = async (req: Request, res: Response): Promise<void> => {
  const complaintId = Number(req.params.complaintId);
  const list = await service.findByComplaint(complaintId);
  res.status(200).json(list);
};

export const updateHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const entry = await service.update(id, req.body);
    if (!entry) {
      res.status(404).json({ message: 'Historial no encontrado' });
      return;
    }
    res.status(200).json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
