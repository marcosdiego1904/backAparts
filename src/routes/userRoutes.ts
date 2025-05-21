// src/routes/userRoutes.ts
import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus
} from '../controllers/userController';

const router = Router();

// Rutas existentes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);

// Nuevas rutas
router.put('/:id', updateUser); // Actualizar un usuario completo
router.patch('/:id/status', updateUserStatus); // Actualizar solo el estado activo/inactivo

export default router;