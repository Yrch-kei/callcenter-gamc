import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, authorizeRoles(['Administrador']), companyController.createCompany);
router.get('/', authMiddleware, authorizeRoles(['Administrador', 'Jefe de Unidad', 'Operador de Call Center']), companyController.getCompanies);
router.get('/:id', authMiddleware, authorizeRoles(['Administrador', 'Jefe de Unidad', 'Operador de Call Center']), companyController.getCompanyById);
router.put('/:id', authMiddleware, authorizeRoles(['Administrador']), companyController.updateCompany);
router.delete('/:id', authMiddleware, authorizeRoles(['Administrador']), companyController.deleteCompany);

export default router;