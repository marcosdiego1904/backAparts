// src/controllers/userController.ts
import { Request, Response, RequestHandler, NextFunction } from 'express';
import pool from '../config/db';
import { OkPacket, RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

// Interfaz UserResponse y tipo CreateUserRequestBody
interface UserResponse extends RowDataPacket {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: 'manager' | 'tenant';
    unit_id?: number | null;
    phone_number?: string | null;
    number_of_family_members?: number;
    is_active?: boolean;
    created_at?: Date | string;
    updated_at?: Date | string;
}

type CreateUserRequestBody = {
    first_name: string;
    last_name: string;
    email: string;
    password: string; // Cambio de password_raw a password
    role: 'manager' | 'tenant';
    unit_id?: number | null;
    phone_number?: string;
    number_of_family_members?: number;
    is_active?: boolean;
};

interface GetUserByIdParams {
    id: string;
}

const mapDbUserToUserResponse = (dbUser: any): UserResponse => {
    const { password_hash, ...userResponse } = dbUser;
    return {
        ...userResponse,
        is_active: Boolean(dbUser.is_active),
    };
};

// Controlador para obtener todos los usuarios
export const getAllUsers: RequestHandler = async (_req, res, _next) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users');

        console.log('Filas crudas recibidas de la base de datos (getAllUsers):', JSON.stringify(rows, null, 2));
        console.log('Número de filas recibidas:', rows.length);

        const users = rows.map(mapDbUserToUserResponse);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

// Controlador para obtener un usuario por ID
export const getUserById: RequestHandler<GetUserByIdParams> = async (req, res, _next) => {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);

        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }

        const [rows] = await pool.query<RowDataPacket[]>('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?', [numericId]);

        if (rows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

// Crear un nuevo usuario
export const createUser: RequestHandler = async (req, res, _next) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password, // Cambio: password en lugar de password_raw
            role,
            unit_id,
            phone_number,
            number_of_family_members,
            is_active = true
        } = req.body as CreateUserRequestBody;

        if (!first_name || !last_name || !email || !password || !role) {
            res.status(400).json({ message: 'Faltan campos requeridos (first_name, last_name, email, password, role).' });
            return;
        }

        const password_hash = await bcrypt.hash(password, saltRounds);

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

        const [result] = await pool.query<OkPacket>(sql, params);

        // Enviar respuesta de éxito
        res.status(201).json({
            id: result.insertId,
            first_name, last_name, email, role,
            unit_id: unit_id || null,
            phone_number: phone_number || null,
            number_of_family_members: number_of_family_members || 0,
            is_active
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        if ((error as any).code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: El email ya está registrado.', error: (error as Error).message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
        }
    }
};

// Actualizar solo el estado (activo/inactivo) de un usuario
export const updateUserStatus: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
        }

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ message: 'El campo is_active debe ser un valor booleano.' });
        }

        // Verificar si el usuario existe
        const [userRows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE id = ?', 
            [numericId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar solo el estado del usuario
        await pool.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [is_active, numericId]
        );

        // Obtener los datos actualizados del usuario
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?',
            [numericId]
        );

        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    } catch (error) {
        console.error('Error al actualizar estado del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

// Actualizar un usuario existente (todos los campos excepto password_hash)
export const updateUser: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            first_name, last_name, email, role, unit_id, 
            phone_number, number_of_family_members, is_active, password 
        } = req.body;

        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
        }

        // Verificar si el usuario existe
        const [userRows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE id = ?', 
            [numericId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Preparar los campos y valores a actualizar
        let fieldsToUpdate: {[key: string]: any} = {};
        let updateQuery = 'UPDATE users SET ';
        let queryParams: any[] = [];

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
            const password_hash = await bcrypt.hash(password, saltRounds);
            fieldsToUpdate.password_hash = password_hash;
        }

        // Añadir updated_at
        fieldsToUpdate.updated_at = new Date();

        // Construir la consulta dinámicamente
        const entries = Object.entries(fieldsToUpdate);
        updateQuery += entries.map(([key], index) => `${key} = ?`).join(', ');
        updateQuery += ' WHERE id = ?';
        queryParams = [...entries.map(([_, value]) => value), numericId];

        // Ejecutar la actualización
        if (entries.length > 0) {
            await pool.query(updateQuery, queryParams);
        }

        // Obtener los datos actualizados del usuario
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?',
            [numericId]
        );

        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        
        // Manejo de error para email duplicado
        if ((error as any).code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: El email ya está registrado por otro usuario.', error: (error as Error).message });
        }
        
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};