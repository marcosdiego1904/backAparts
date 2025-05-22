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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.updateUserStatus = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const saltRounds = 10;
const mapDbUserToUserResponse = (dbUser) => {
    const { password_hash } = dbUser, userResponse = __rest(dbUser, ["password_hash"]);
    return Object.assign(Object.assign({}, userResponse), { is_active: Boolean(dbUser.is_active) });
};
// Controlador para obtener todos los usuarios
const getAllUsers = (_req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield db_1.default.query('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users');
        console.log('Filas crudas recibidas de la base de datos (getAllUsers):', JSON.stringify(rows, null, 2));
        console.log('Número de filas recibidas:', rows.length);
        const users = rows.map(mapDbUserToUserResponse);
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.getAllUsers = getAllUsers;
// Controlador para obtener un usuario por ID
const getUserById = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }
        const [rows] = yield db_1.default.query('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?', [numericId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    }
    catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.getUserById = getUserById;
// Crear un nuevo usuario
const createUser = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, last_name, email, password, role, unit_id, phone_number, number_of_family_members, is_active = true } = req.body;
        if (!first_name || !last_name || !email || !password || !role) {
            res.status(400).json({ message: 'Faltan campos requeridos (first_name, last_name, email, password, role).' });
            return;
        }
        const password_hash = yield bcryptjs_1.default.hash(password, saltRounds);
        const sql = `
            INSERT INTO users (
                first_name, last_name, email, password_hash, role, 
                unit_id, phone_number, number_of_family_members, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            first_name, last_name, email, password_hash, role,
            unit_id || null, phone_number || null,
            number_of_family_members || 0, is_active
        ];
        const [result] = yield db_1.default.query(sql, params);
        res.status(201).json({
            id: result.insertId,
            first_name, last_name, email, role,
            unit_id: unit_id || null,
            phone_number: phone_number || null,
            number_of_family_members: number_of_family_members || 0,
            is_active
        });
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: El email ya está registrado.', error: error.message });
        }
        else {
            res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }
});
exports.createUser = createUser;
// Actualizar solo el estado (activo/inactivo) de un usuario
const updateUserStatus = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }
        if (typeof is_active !== 'boolean') {
            res.status(400).json({ message: 'El campo is_active debe ser un valor booleano.' });
            return;
        }
        const [userRows] = yield db_1.default.query('SELECT id FROM users WHERE id = ?', [numericId]);
        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        yield db_1.default.query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [is_active, numericId]);
        const [rows] = yield db_1.default.query('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?', [numericId]);
        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    }
    catch (error) {
        console.error('Error al actualizar estado del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.updateUserStatus = updateUserStatus;
// Actualizar un usuario existente
const updateUser = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, password } = req.body;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }
        const [userRows] = yield db_1.default.query('SELECT id FROM users WHERE id = ?', [numericId]);
        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        let fieldsToUpdate = {};
        if (first_name !== undefined) {
            fieldsToUpdate.first_name = first_name;
        }
        if (last_name !== undefined) {
            fieldsToUpdate.last_name = last_name;
        }
        if (email !== undefined) {
            fieldsToUpdate.email = email;
        }
        if (role !== undefined) {
            fieldsToUpdate.role = role;
        }
        if (unit_id !== undefined) {
            fieldsToUpdate.unit_id = unit_id;
        }
        if (phone_number !== undefined) {
            fieldsToUpdate.phone_number = phone_number;
        }
        if (number_of_family_members !== undefined) {
            fieldsToUpdate.number_of_family_members = number_of_family_members;
        }
        if (is_active !== undefined) {
            fieldsToUpdate.is_active = is_active;
        }
        if (password) {
            const password_hash = yield bcryptjs_1.default.hash(password, saltRounds);
            fieldsToUpdate.password_hash = password_hash;
        }
        fieldsToUpdate.updated_at = new Date();
        const entries = Object.entries(fieldsToUpdate);
        if (entries.length === 0) {
            res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
            return;
        }
        let updateQuery = 'UPDATE users SET ';
        updateQuery += entries.map(([key]) => `${key} = ?`).join(', ');
        updateQuery += ' WHERE id = ?';
        const queryParams = [...entries.map(([_, value]) => value), numericId];
        yield db_1.default.query(updateQuery, queryParams);
        const [rows] = yield db_1.default.query('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?', [numericId]);
        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    }
    catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: El email ya está registrado por otro usuario.', error: error.message });
            return;
        }
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.updateUser = updateUser;
// NUEVA FUNCIÓN: Eliminar un usuario existente
const deleteUser = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        console.log(`Attempting to delete user with ID: ${numericId}`);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }
        // Verificar si el usuario existe
        const [userRows] = yield db_1.default.query('SELECT id, first_name, last_name, email FROM users WHERE id = ?', [numericId]);
        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        const userToDelete = userRows[0];
        console.log(`User found for deletion:`, userToDelete);
        // Verificar si el usuario tiene datos asociados
        const [associatedPayments] = yield db_1.default.query('SELECT COUNT(*) as count FROM payments WHERE user_id = ?', [numericId]);
        const [associatedMaintenance] = yield db_1.default.query('SELECT COUNT(*) as count FROM maintenance_requests WHERE user_id = ?', [numericId]);
        console.log(`Associated data - Payments: ${associatedPayments[0].count}, Maintenance: ${associatedMaintenance[0].count}`);
        // Eliminar datos asociados en cascada
        if (associatedMaintenance[0].count > 0) {
            yield db_1.default.query('DELETE FROM maintenance_requests WHERE user_id = ?', [numericId]);
            console.log(`Deleted ${associatedMaintenance[0].count} maintenance requests`);
        }
        if (associatedPayments[0].count > 0) {
            yield db_1.default.query('DELETE FROM payments WHERE user_id = ?', [numericId]);
            console.log(`Deleted ${associatedPayments[0].count} payments`);
        }
        // Finalmente, eliminar el usuario
        const [deleteResult] = yield db_1.default.query('DELETE FROM users WHERE id = ?', [numericId]);
        if (deleteResult.affectedRows === 0) {
            res.status(404).json({ message: 'No se pudo eliminar el usuario' });
            return;
        }
        console.log(`User ${numericId} deleted successfully`);
        res.status(200).json({
            message: 'Usuario eliminado exitosamente',
            deletedUserId: numericId,
            deletedUser: {
                id: userToDelete.id,
                name: `${userToDelete.first_name} ${userToDelete.last_name}`,
                email: userToDelete.email
            },
            deletedAssociatedData: {
                payments: associatedPayments[0].count,
                maintenanceRequests: associatedMaintenance[0].count
            }
        });
    }
    catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});
exports.deleteUser = deleteUser;
