// src/routes/userRoutes.ts
import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    createUser
    // Importa aquí futuras funciones como updateUser, deleteUser cuando las crees
} from '../controllers/userController'; // Verifica que la ruta al controlador sea correcta

const router = Router();

// Ruta para obtener todos los usuarios
router.get('/', getAllUsers);

// Ruta para obtener un usuario específico por su ID
router.get('/:id', getUserById);

// Ruta para crear un nuevo usuario
router.post('/', createUser);

// Aquí podrías añadir en el futuro:
// router.put('/:id', updateUser); // Para actualizar un usuario
// router.delete('/:id', deleteUser); // Para eliminar un usuario

export default router;