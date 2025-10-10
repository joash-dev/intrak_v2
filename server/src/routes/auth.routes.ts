import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty(),
    validate
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
    validate
  ],
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;