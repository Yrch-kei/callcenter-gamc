import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware,authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/',authMiddleware,authorizeRoles(['Administrador']), userController.createUser);
router.post('/mandateds',authMiddleware,authorizeRoles(['Administrador','Jefe de Unidad']), userController.createMandated);
router.get('/',authMiddleware,authorizeRoles(['Administrador']),userController.getUsers);
router.get('/technicians', authMiddleware, userController.getTechnicians);
router.get('/mandateds',authMiddleware,authorizeRoles(['Administrador','Jefe de Unidad']), userController.getMandateds);
router.put('/change-password', authMiddleware, userController.changePassword);
router.get('/:id',authMiddleware,authorizeRoles(['Administrador']), userController.getUserById);
router.get('/mandateds/:id',authMiddleware,authorizeRoles(['Administrador','Jefe de Unidad']), userController.getMandatedById);
router.put('/:id',authMiddleware,authorizeRoles(['Administrador']), userController.updateUser);
router.put('/mandateds/:id',authMiddleware,authorizeRoles(['Administrador','Jefe de Unidad']), userController.updateMandated);
router.delete('/:id', authMiddleware,authorizeRoles(['Administrador']), userController.deleteUser);
router.delete('/mandateds/:id', authMiddleware,authorizeRoles(['Administrador','Jefe de Unidad']), userController.deleteMandated);

export default router;
