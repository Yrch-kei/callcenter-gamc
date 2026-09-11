import { Request, Response } from 'express';
import ReportService from '../services/ReportService';

export const getEfficiency = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const stats = await ReportService.getEfficiencyStats(year);
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
