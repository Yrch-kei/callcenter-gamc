import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();
router.get('/efficiency', authMiddleware, authorizeRoles(['Administrador', 'Jefe de Unidad']), statsController.getEfficiency);

export default router;
