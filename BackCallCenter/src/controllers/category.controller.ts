import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';

const categoryService = new CategoryService();

export const createCategory = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    const category = await categoryService.create(req.body, authUserId!);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const unitId = req.query.unitId ? Number(req.query.unitId) : null;
    let categories;
    if (unitId) {
      categories = await categoryService.findByUnit(unitId);
    } else {
      categories = await categoryService.findAllFlat();
    }
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.findOne(Number(req.params.id));
    if (!category) {
      res.status(404).json({ message: 'Categoría no encontrada' });
      return;
    }
    res.status(200).json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.update(Number(req.params.id), req.body);
    if (!category) {
      res.status(404).json({ message: 'Categoría no encontrada' });
      return;
    }
    res.status(200).json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    await categoryService.delete(Number(req.params.id), authUserId!);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};