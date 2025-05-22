// src/controllers/userController.ts - VERSIÓN COMPLETA
import { Request, Response, NextFunction } from 'express';
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
    password: string;
    role: 'manager' | 'tenant';
    unit_id?: number | null;
    phone_number?: string;
    number_of_family_members?: number;
    is_active?: boolean;
};

interface GetUserByIdParams {
    id: string;
}

interface UpdateUserStatusParams {
    id: string;
}

interface UpdateUserParams {
    id: string;
}

interface DeleteUserParams {
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
export const getAllUsers = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
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
export const getUserById = async (req: Request<GetUserByIdParams>, res: Response, _next: NextFunction): Promise<void> => {
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
export const createUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
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
export const updateUserStatus = async (req: Request<UpdateUserStatusParams>, res: Response, _next: NextFunction): Promise<void> => {
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

        const [userRows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE id = ?', 
            [numericId]
        );

        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }

        await pool.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [is_active, numericId]
        );

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

// Actualizar un usuario existente
export const updateUser = async (req: Request<UpdateUserParams>, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { 
            first_name, last_name, email, role, unit_id, 
            phone_number, number_of_family_members, is_active, password 
        } = req.body;

        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }

        const [userRows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE id = ?', 
            [numericId]
        );

        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }

        let fieldsToUpdate: {[key: string]: any} = {};
        
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
            const password_hash = await bcrypt.hash(password, saltRounds);
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

        await pool.query(updateQuery, queryParams);

        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?',
            [numericId]
        );

        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        
        if ((error as any).code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: El email ya está registrado por otro usuario.', error: (error as Error).message });
            return;
        }
        
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

// NUEVA FUNCIÓN: Eliminar un usuario existente
export const deleteUser = async (req: Request<DeleteUserParams>, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);

        console.log(`Attempting to delete user with ID: ${numericId}`);

        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return;
        }

        // Verificar si el usuario existe
        const [userRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, first_name, last_name, email FROM users WHERE id = ?', 
            [numericId]
        );

        if (userRows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }

        const userToDelete = userRows[0];
        console.log(`User found for deletion:`, userToDelete);

        // Verificar si el usuario tiene datos asociados
        const [associatedPayments] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM payments WHERE user_id = ?', 
            [numericId]
        );

        const [associatedMaintenance] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM maintenance_requests WHERE user_id = ?', 
            [numericId]
        );

        console.log(`Associated data - Payments: ${associatedPayments[0].count}, Maintenance: ${associatedMaintenance[0].count}`);

        // Eliminar datos asociados en cascada
        if (associatedMaintenance[0].count > 0) {
            await pool.query('DELETE FROM maintenance_requests WHERE user_id = ?', [numericId]);
            console.log(`Deleted ${associatedMaintenance[0].count} maintenance requests`);
        }
        
        if (associatedPayments[0].count > 0) {
            await pool.query('DELETE FROM payments WHERE user_id = ?', [numericId]);
            console.log(`Deleted ${associatedPayments[0].count} payments`);
        }
        
        // Finalmente, eliminar el usuario
        const [deleteResult] = await pool.query<OkPacket>('DELETE FROM users WHERE id = ?', [numericId]);
        
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

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor', 
            error: (error as Error).message 
        });
    }
};