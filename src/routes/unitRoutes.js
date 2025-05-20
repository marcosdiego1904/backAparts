"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/unitRoutes.ts
const express_1 = require("express");
const unitController_1 = require("../controllers/unitController"); // Asegúrate que la ruta y el nombre del archivo sean correctos
const router = (0, express_1.Router)();
router.get('/', unitController_1.getAllUnits);
router.get('/:id', unitController_1.getUnitById);
router.post('/', unitController_1.createUnit);
// Aquí podrías añadir router.put('/:id', updateUnit); y router.delete('/:id', deleteUnit);
exports.default = router;
