import { Router } from 'express';
import { getPublicKey, subscribe } from '../controllers/push.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/public-key', getPublicKey);
router.post('/subscribe', authMiddleware, subscribe);

export default router;
