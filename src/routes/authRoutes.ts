import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema } from '../dto/auth.dto';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = Router();

// Public login route
authRoutes.post(
    '/login',
    validate(loginSchema),
    asyncHandler(AuthController.login)
);

// Protected current-user route
authRoutes.get(
    '/me',
    authMiddleware,
    asyncHandler(AuthController.getMe)
);