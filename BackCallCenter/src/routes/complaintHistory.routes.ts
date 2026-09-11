import { Router } from 'express';
import {
  createHistory,
  getAllHistory,
  getHistoryByComplaint,
  updateHistory,
} from '../controllers/complaintHistory.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Solo Administrador puede crear o editar historial
router.post(
  '/',
  authMiddleware,
  authorizeRoles(['Administrador']),
  createHistory
);

router.get(
  '/',
  authMiddleware,
  authorizeRoles(['Administrador', 'Operador de Call Center', 'Jefe de Unidad']),
  getAllHistory
);

// Listar historial de una denuncia concreta (campo también puede verlo)
router.get(
  '/complaint/:complaintId',
  authMiddleware,
  authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad','Personal de Campo','Tecnico de campo']),
  getHistoryByComplaint
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles(['Administrador']),
  updateHistory
);

export default router;
