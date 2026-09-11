import { Router } from 'express';
import * as ctrl from '../controllers/department.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.get(
  '/',
  authMiddleware,
  authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad','Tecnico de campo']),
  ctrl.getDepartments
);
router.get(
  '/:id',
  authMiddleware,
  authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad']),
  ctrl.getDepartmentById
);
router.post('/', authMiddleware, authorizeRoles(['Administrador']), ctrl.createDepartment);
router.put('/:id', authMiddleware, authorizeRoles(['Administrador']), ctrl.updateDepartment);
router.delete('/:id', authMiddleware, authorizeRoles(['Administrador']), ctrl.deleteDepartment);

export default router;
