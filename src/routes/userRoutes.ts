// src/routes/userRoutes.ts - VERSIÓN COMPLETA
import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser  // ← Asegúrate de que esta importación esté presente
} from '../controllers/userController';

const router = Router();

// Rutas existentes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);

// Rutas de actualización
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);

// Ruta DELETE - ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ PRESENTE
router.delete('/:id', deleteUser);

export default router;