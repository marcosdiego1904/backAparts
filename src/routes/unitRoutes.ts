// src/routes/unitRoutes.ts
import { Router } from 'express';
import {
    getAllUnits,
    getUnitById,
    createUnit,
    updateUnit,
    deleteUnit
} from '../controllers/unitController';

const router = Router();

router.get('/', getAllUnits);
router.get('/:id', getUnitById);
router.post('/', createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

export default router;