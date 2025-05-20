// src/routes/unitRoutes.ts
import { Router } from 'express';
import {
    getAllUnits,
    getUnitById,
    createUnit
} from '../controllers/unitController'; // Asegúrate que la ruta y el nombre del archivo sean correctos

const router = Router();

router.get('/', getAllUnits);
router.get('/:id', getUnitById);
router.post('/', createUnit);

// Aquí podrías añadir router.put('/:id', updateUnit); y router.delete('/:id', deleteUnit);

export default router;