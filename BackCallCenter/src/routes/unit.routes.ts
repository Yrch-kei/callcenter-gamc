import { Router } from 'express';
import * as unitController from '../controllers/unit.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, authorizeRoles(['Administrador']), unitController.createUnit);
router.get('/', authMiddleware, authorizeRoles(['Administrador','Jefe de Unidad','Operador de Call Center']), unitController.getUnits);
router.get('/:id', authMiddleware, authorizeRoles(['Administrador','Jefe de Unidad','Operador de Call Center']), unitController.getUnitById);
router.put('/:id', authMiddleware, authorizeRoles(['Administrador']), unitController.updateUnit);
router.delete('/:id', authMiddleware, authorizeRoles(['Administrador']), unitController.deleteUnit);

export default router;