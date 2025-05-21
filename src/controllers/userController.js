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
exports.updateUser = exports.updateUserStatus = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
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
        const { first_name, last_name, email, password, // Cambio: password en lugar de password_raw
        role, unit_id, phone_number, number_of_family_members, is_active = true } = req.body;
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
        // Enviar respuesta de éxito
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
        // Verificar si el usuario existe
        const [userRows] = yield db_1.default.query('SELECT id FROM users WHERE id = ?', [numericId]);
        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        // Actualizar solo el estado del usuario
        yield db_1.default.query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [is_active, numericId]);
        // Obtener los datos actualizados del usuario
        const [rows] = yield db_1.default.query('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?', [numericId]);
        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    }
    catch (error) {
        console.error('Error al actualizar estado del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.updateUserStatus = updateUserStatus;
// Actualizar un usuario existente (todos los campos excepto password_hash)
const updateUser = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, password } = req.body;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }
        // Verificar si el usuario existe
        const [userRows] = yield db_1.default.query('SELECT id FROM users WHERE id = ?', [numericId]);
        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        // Preparar los campos y valores a actualizar
        let fieldsToUpdate = {};
        // Añadir campos solo si están presentes en el cuerpo de la solicitud
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
        // Manejar actualización de contraseña si se proporciona
        if (password) {
            const password_hash = yield bcryptjs_1.default.hash(password, saltRounds);
            fieldsToUpdate.password_hash = password_hash;
        }
        // Añadir updated_at
        fieldsToUpdate.updated_at = new Date();
        // Construir la consulta dinámicamente
        const entries = Object.entries(fieldsToUpdate);
        if (entries.length === 0) {
            res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
            return;
        }
        let updateQuery = 'UPDATE users SET ';
        updateQuery += entries.map(([key]) => `${key} = ?`).join(', ');
        updateQuery += ' WHERE id = ?';
        const queryParams = [...entries.map(([_, value]) => value), numericId];
        // Ejecutar la actualización
        yield db_1.default.query(updateQuery, queryParams);
        // Obtener los datos actualizados del usuario
        const [rows] = yield db_1.default.query('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?', [numericId]);
        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    }
    catch (error) {
        console.error('Error al actualizar usuario:', error);
        // Manejo de error para email duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: El email ya está registrado por otro usuario.', error: error.message });
            return;
        }
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});
exports.updateUser = updateUser;
