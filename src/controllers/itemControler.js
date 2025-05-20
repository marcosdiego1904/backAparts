"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = exports.getItemById = exports.getAllItems = void 0;
const db_1 = __importDefault(require("../config/db"));
// Explicitly type controller functions as RequestHandler
const getAllItems = (_req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield db_1.default.query('SELECT * FROM items');
        res.status(200).json(rows);
    }
    catch (error) {
        console.error('Error al obtener items:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        // If you have an error handling middleware, you might call next(error) here
    }
});
exports.getAllItems = getAllItems;
const getItemById = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // id is string here
        const numericId = parseInt(id, 10); // Convert to number for DB query
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del item debe ser un número.' });
            return;
        }
        const [rows] = yield db_1.default.query('SELECT * FROM items WHERE id = ?', [numericId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Item no encontrado' });
            return;
        }
        res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Error al obtener item por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.getItemById = getItemById;
const createItem = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Explicitly type req.body for better safety
        const { nombre, descripcion } = req.body;
        if (!nombre) {
            res.status(400).json({ message: 'El campo "nombre" es requerido' });
            return;
        }
        const [result] = yield db_1.default.query('INSERT INTO items (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion || null] // Handle potentially undefined descripcion
        );
        res.status(201).json({ id: result.insertId, nombre, descripcion });
    }
    catch (error) {
        console.error('Error al crear item:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.createItem = createItem;
