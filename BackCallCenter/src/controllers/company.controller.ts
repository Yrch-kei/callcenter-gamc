import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';

const companyService = new CompanyService();

export const createCompany = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    const company = await companyService.create(req.body, authUserId!);
    res.status(201).json(company);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCompanies = async (_req: Request, res: Response) => {
  try {
    const companies = await companyService.findAll();
    res.status(200).json(companies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const company = await companyService.findOne(Number(req.params.id));
    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }
    res.status(200).json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    const company = await companyService.update(Number(req.params.id), req.body, authUserId!);
    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }
    res.status(200).json(company);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    await companyService.delete(Number(req.params.id), authUserId!);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};