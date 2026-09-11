// src/routes/report.routes.ts
import { Router } from 'express';
import * as ReportController from '../controllers/report.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';
import { reportValidations } from '../validations/report.validations';

const router = Router();

router.get(
  '/by-office/:year',
  authMiddleware,
  authorizeRoles(['Administrador','Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  ReportController.getReportsByOffice
);

router.get(
  '/by-category/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  ReportController.getReportsByCategory
);

router.get(
  '/by-receptionist/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  ReportController.getReportsByReceptionist
);

router.get(
  '/by-submayor/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  ReportController.getReportsBySubMayor
);

router.get(
  '/by-district/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  ReportController.getReportsByDistrict
);

router.get(
  '/by-status/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  ReportController.getReportsByStatus
);

router.get(
  '/all/:year',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad','Operador de Call Center']),
  reportValidations,
  ReportController.getAllReports
);

export default router;