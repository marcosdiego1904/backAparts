"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userRoutes.ts - VERSIÓN COMPLETA
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Rutas existentes
router.get('/', userController_1.getAllUsers);
router.get('/:id', userController_1.getUserById);
router.post('/', userController_1.createUser);
// Rutas de actualización
router.put('/:id', userController_1.updateUser);
router.patch('/:id/status', userController_1.updateUserStatus);
// Ruta DELETE - ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ PRESENTE
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
