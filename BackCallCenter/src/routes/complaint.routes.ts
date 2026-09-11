import { Router } from 'express';
import * as complaintController from '../controllers/complaint.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';
import { upload } from '../utils/storagePhoto';
import { uploadBefore, uploadAfter } from '../utils/storageIntervention';

const router = Router();
router.get('/heatmap', authMiddleware, authorizeRoles(['Administrador', 'Jefe de Unidad']), complaintController.getHeatmap);

// Rutas Públicas (sin autenticación JWT requerida)
router.get('/public/status/:code', complaintController.getPublicStatus);
router.get('/track/:code', complaintController.getPublicStatus);
router.get('/code/:code', complaintController.getPublicStatus);
router.post('/public', upload.single('evidence'), complaintController.createPublicComplaint);
router.post('/public/:code/rate', complaintController.rateComplaint);
router.post('/public/:code/request-reopen', complaintController.requestReopen);

// Middleware para multer aceptando campos múltiples de imágenes
const uploadAfterFields = upload.fields([
  { name: 'afterImages', maxCount: 5 },
  { name: 'afterImage', maxCount: 5 },
  { name: 'file', maxCount: 5 },
  { name: 'evidence', maxCount: 5 },
  { name: 'image', maxCount: 5 },
  { name: 'photos', maxCount: 5 }
]);

router.get('/assigned', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad','Personal de Campo','Tecnico de campo']), complaintController.getComplaints);
router.post('/', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center']),upload.single('evidence'), complaintController.createComplaint);
router.get('/', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad','Personal de Campo','Tecnico de campo']), complaintController.getComplaints);
router.get('/:id', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad','Personal de Campo','Tecnico de campo']), complaintController.getComplaintById);
router.get('/:id/pdf', authMiddleware, authorizeRoles(['Administrador', 'Jefe de Unidad', 'Operador de Call Center']), complaintController.downloadPdf);
router.put('/:id/status', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center']), complaintController.updateComplaintStatus);
router.put('/:id', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center']),upload.single('evidence'), complaintController.updateComplaint);
router.delete('/:id', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center']), complaintController.deleteComplaint);
router.post('/:id/note',   authMiddleware, authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad','Personal de Campo','Tecnico de campo']), complaintController.addNote);
router.post('/:id/derive', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center','Jefe de Unidad']), complaintController.deriveComplaint);
router.post('/:id/evaluate-reopen', authMiddleware, authorizeRoles(['Administrador','Operador de Call Center']), complaintController.evaluateReopen);
router.post('/:id/start', authMiddleware, authorizeRoles(['Personal de Campo', 'Tecnico de campo']), uploadBefore.array('photos', 5), complaintController.startIntervention);
router.post('/:id/finish', authMiddleware, authorizeRoles(['Personal de Campo', 'Tecnico de campo']), uploadAfter.array('photos', 5), complaintController.finishIntervention);
router.post('/:id/arrive', authMiddleware, authorizeRoles(['Administrador', 'Personal de Campo', 'Tecnico de campo']), complaintController.arriveAtSite);
router.post('/:id/resolve', authMiddleware, authorizeRoles(['Administrador', 'Personal de Campo', 'Tecnico de campo']), uploadAfterFields, complaintController.resolveComplaint);
router.post('/:id/assign', authMiddleware, authorizeRoles(['Administrador', 'Operador de Call Center', 'Jefe de Unidad']), complaintController.assignComplaint);

export default router;

