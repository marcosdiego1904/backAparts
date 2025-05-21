"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userRoutes.ts
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Rutas existentes
router.get('/', userController_1.getAllUsers);
router.get('/:id', userController_1.getUserById);
router.post('/', userController_1.createUser);
// Nuevas rutas
router.put('/:id', userController_1.updateUser); // Actualizar un usuario completo
router.patch('/:id/status', userController_1.updateUserStatus); // Actualizar solo el estado activo/inactivo
exports.default = router;
