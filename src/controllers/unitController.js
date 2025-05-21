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
exports.deleteUnit = exports.updateUnit = exports.createUnit = exports.getUnitById = exports.getAllUnits = void 0;
const db_1 = __importDefault(require("../config/db"));
// Obtener todas las unidades
const getAllUnits = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield db_1.default.query('SELECT * FROM units');
        // Convertir is_occupied (0/1) a boolean (false/true) si es necesario para el frontend
        const units = rows.map(unit => (Object.assign(Object.assign({}, unit), { is_occupied: Boolean(unit.is_occupied) })));
        res.status(200).json(units);
    }
    catch (error) {
        console.error('Error al obtener unidades:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.getAllUnits = getAllUnits;
// Obtener una unidad por su ID
const getUnitById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID de la unidad debe ser un número.' });
            return;
        }
        const [rows] = yield db_1.default.query('SELECT * FROM units WHERE id = ?', [numericId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Unidad no encontrada' });
            return;
        }
        const unit = Object.assign(Object.assign({}, rows[0]), { is_occupied: Boolean(rows[0].is_occupied) });
        res.status(200).json(unit);
    }
    catch (error) {
        console.error('Error al obtener unidad por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.getUnitById = getUnitById;
// Crear una nueva unidad
const createUnit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { unit_number, building, floor, square_footage, number_of_bedrooms, number_of_bathrooms, is_occupied = false // Valor por defecto si no se envía
         } = req.body;
        if (!unit_number) {
            res.status(400).json({ message: 'El campo "unit_number" es requerido' });
            return;
        }
        // Asegúrate que los nombres de las columnas en VALUES() coincidan con tu tabla 'units'
        const sql = `
            INSERT INTO units (
                unit_number, building, floor, square_footage, 
                number_of_bedrooms, number_of_bathrooms, is_occupied
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            unit_number,
            building || null,
            floor || null,
            square_footage || null,
            number_of_bedrooms || null,
            number_of_bathrooms || null,
            is_occupied
        ];
        const [result] = yield db_1.default.query(sql, params);
        res.status(201).json({
            id: result.insertId,
            unit_number,
            building,
            floor,
            square_footage,
            number_of_bedrooms,
            number_of_bathrooms,
            is_occupied
        });
    }
    catch (error) {
        console.error('Error al crear unidad:', error);
        // Manejo específico para error de entrada duplicada (unit_number UNIQUE)
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: Ya existe una unidad con ese número.', error: error.message });
        }
        else {
            res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }
});
exports.createUnit = createUnit;
// Add these functions to your src/controllers/unitController.ts file
// Update an existing unit
const updateUnit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID de la unidad debe ser un número.' });
            return;
        }
        // Check if unit exists
        const [existingUnit] = yield db_1.default.query('SELECT * FROM units WHERE id = ?', [numericId]);
        if (existingUnit.length === 0) {
            res.status(404).json({ message: 'Unidad no encontrada' });
            return;
        }
        const { unit_number, building, floor, square_footage, number_of_bedrooms, number_of_bathrooms, is_occupied } = req.body;
        // Validate unit_number if provided
        if (unit_number !== undefined && !unit_number.trim()) {
            res.status(400).json({ message: 'El campo "unit_number" no puede estar vacío' });
            return;
        }
        // Prepare the SQL query
        let updateFields = [];
        let queryParams = [];
        if (unit_number !== undefined) {
            updateFields.push('unit_number = ?');
            queryParams.push(unit_number);
        }
        if (building !== undefined) {
            updateFields.push('building = ?');
            queryParams.push(building || null);
        }
        if (floor !== undefined) {
            updateFields.push('floor = ?');
            queryParams.push(floor || null);
        }
        if (square_footage !== undefined) {
            updateFields.push('square_footage = ?');
            queryParams.push(square_footage || null);
        }
        if (number_of_bedrooms !== undefined) {
            updateFields.push('number_of_bedrooms = ?');
            queryParams.push(number_of_bedrooms || null);
        }
        if (number_of_bathrooms !== undefined) {
            updateFields.push('number_of_bathrooms = ?');
            queryParams.push(number_of_bathrooms || null);
        }
        if (is_occupied !== undefined) {
            updateFields.push('is_occupied = ?');
            queryParams.push(is_occupied);
        }
        // Add updated_at timestamp
        updateFields.push('updated_at = NOW()');
        // If there are no fields to update, return the existing unit
        if (updateFields.length === 0) {
            const unit = Object.assign(Object.assign({}, existingUnit[0]), { is_occupied: Boolean(existingUnit[0].is_occupied) });
            res.status(200).json(unit);
            return;
        }
        // Add ID to params
        queryParams.push(numericId);
        // Execute update query
        const sql = `UPDATE units SET ${updateFields.join(', ')} WHERE id = ?`;
        yield db_1.default.query(sql, queryParams);
        // Get the updated unit
        const [updatedUnit] = yield db_1.default.query('SELECT * FROM units WHERE id = ?', [numericId]);
        const unit = Object.assign(Object.assign({}, updatedUnit[0]), { is_occupied: Boolean(updatedUnit[0].is_occupied) });
        res.status(200).json(unit);
    }
    catch (error) {
        console.error('Error al actualizar unidad:', error);
        // Handle duplicate entry error
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: Ya existe una unidad con ese número.', error: error.message });
        }
        else {
            res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }
});
exports.updateUnit = updateUnit;
// Delete a unit
const deleteUnit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID de la unidad debe ser un número.' });
            return;
        }
        // Check if unit exists
        const [existingUnit] = yield db_1.default.query('SELECT * FROM units WHERE id = ?', [numericId]);
        if (existingUnit.length === 0) {
            res.status(404).json({ message: 'Unidad no encontrada' });
            return;
        }
        // Check if the unit has associated users or other entities (if needed)
        // This is important to maintain data integrity
        const [associatedUsers] = yield db_1.default.query('SELECT COUNT(*) as count FROM users WHERE unit_id = ?', [numericId]);
        if (associatedUsers[0].count > 0) {
            res.status(400).json({ message: 'No se puede eliminar la unidad porque tiene usuarios asociados.' });
            return;
        }
        // Delete the unit
        yield db_1.default.query('DELETE FROM units WHERE id = ?', [numericId]);
        res.status(200).json({ message: 'Unidad eliminada exitosamente' });
    }
    catch (error) {
        console.error('Error al eliminar unidad:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.deleteUnit = deleteUnit;
// Aquí puedes añadir funciones para actualizar (updateUnit) y eliminar (deleteUnit) unidades en el futuro.
