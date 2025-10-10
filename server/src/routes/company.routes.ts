import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as companyController from '../controllers/company.controller';

const router = Router();

router.use(authenticate);

router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompanyById);
router.post('/', authorize(['ADMIN']), companyController.createCompany);
router.put('/:id', authorize(['ADMIN']), companyController.updateCompany);
router.delete('/:id', authorize(['ADMIN']), companyController.deleteCompany);

export default router;