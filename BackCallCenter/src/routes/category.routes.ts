import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, authorizeRoles(['Administrador']), categoryController.createCategory);
router.get('/', authMiddleware, authorizeRoles(['Administrador','Jefe de Unidad','Operador de Call Center']), categoryController.getCategories);
router.get('/:id', authMiddleware, authorizeRoles(['Administrador','Jefe de Unidad','Operador de Call Center']), categoryController.getCategoryById);
router.put('/:id', authMiddleware, authorizeRoles(['Administrador']), categoryController.updateCategory);
router.delete('/:id', authMiddleware, authorizeRoles(['Administrador']), categoryController.deleteCategory);

export default router;