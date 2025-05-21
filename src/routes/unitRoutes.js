"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/unitRoutes.ts
const express_1 = require("express");
const unitController_1 = require("../controllers/unitController");
const router = (0, express_1.Router)();
router.get('/', unitController_1.getAllUnits);
router.get('/:id', unitController_1.getUnitById);
router.post('/', unitController_1.createUnit);
router.put('/:id', unitController_1.updateUnit);
router.delete('/:id', unitController_1.deleteUnit);
exports.default = router;
