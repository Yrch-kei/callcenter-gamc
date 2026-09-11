import { Router, Request, Response, NextFunction } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';
import { reportValidations } from '../validations/report.validations';

const router = Router();
const exportController = new ExportController();

router.get(
  '/excel/:type/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  (req: Request, res: Response, next: NextFunction) => exportController.exportExcel(req, res).catch(next)
);

router.get(
  '/pdf/:type/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  (req: Request, res: Response, next: NextFunction) => exportController.exportPDF(req, res).catch(next)
);

export default router;