"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/itemRoutes.ts
const express_1 = require("express");
const itemControler_1 = require("../controllers/itemControler"); // Verify this path
const router = (0, express_1.Router)();
router.get('/', itemControler_1.getAllItems);
router.get('/:id', itemControler_1.getItemById); // This was line 12 in your error
router.post('/', itemControler_1.createItem); // This was line 13 in your error
exports.default = router;
