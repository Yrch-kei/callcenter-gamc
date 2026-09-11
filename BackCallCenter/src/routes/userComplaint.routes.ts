import { Router } from 'express';
import * as userComplaintController from '../controllers/userComplaint.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Asignar denuncia - Solo Supervisor
router.post(
  '/assign',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad']),
  userComplaintController.assignComplaint
);

// Cancelar asignación - Supervisor y Obrero
router.put(
  '/:id/cancel',
  authMiddleware,
  authorizeRoles(['Administrador', 'Jefe de Unidad', 'Tecnico de campo']),
  userComplaintController.cancelAssignment
);

// Completar asignación - Supervisor y Obrero
router.put(
  '/:id/complete',
  authMiddleware,
  authorizeRoles(['Jefe de Unidad', 'Tecnico de campo']),
  userComplaintController.completeAssignment
);

// Obtener asignaciones por usuario
router.get(
  '/user/:userId',
  authMiddleware,
  userComplaintController.getUserAssignments
);

// Obtener historial de asignaciones por denuncia
router.get(
  '/complaint/:complaintId',
  authMiddleware,
  userComplaintController.getComplaintAssignments
);

export default router;