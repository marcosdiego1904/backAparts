// src/controllers/userController.ts
import { Request, Response, RequestHandler, NextFunction } from 'express'; // Asegúrate que NextFunction esté importado
import pool from '../config/db';
import { OkPacket, RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

// Interfaz UserResponse y tipo CreateUserRequestBody (como estaban antes)
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
    password_raw: string;
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

// src/controllers/userController.ts
// ... (otras importaciones y código) ...

export const getAllUsers: RequestHandler = async (_req, res, _next) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users');

        // ----> AÑADE ESTAS LÍNEAS PARA DEPURAR <----
        console.log('Filas crudas recibidas de la base de datos (getAllUsers):', JSON.stringify(rows, null, 2));
        console.log('Número de filas recibidas:', rows.length);
        // ----> FIN DE LÍNEAS PARA DEPURAR <----

        const users = rows.map(mapDbUserToUserResponse);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

export const getUserById: RequestHandler<GetUserByIdParams> = async (req, res, _next) => { // _next ya estaba aquí, bien.
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);

        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID del usuario debe ser un número.' });
            return; // Esto está bien (plain return)
        }

        const [rows] = await pool.query<RowDataPacket[]>('SELECT id, first_name, last_name, email, role, unit_id, phone_number, number_of_family_members, is_active, created_at, updated_at FROM users WHERE id = ?', [numericId]);

        if (rows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return; // Esto está bien
        }
        res.status(200).json(mapDbUserToUserResponse(rows[0]));
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

// Crear un nuevo usuario (CORREGIDO)
export const createUser: RequestHandler = async (req, res, _next) => { // Añadido _next para consistencia con RequestHandler
    try {
        const {
            first_name,
            last_name,
            email,
            password_raw,
            role,
            unit_id,
            phone_number,
            number_of_family_members,
            is_active = true
        } = req.body as CreateUserRequestBody;

        if (!first_name || !last_name || !email || !password_raw || !role) {
            // CORRECCIÓN AQUÍ:
            res.status(400).json({ message: 'Faltan campos requeridos (first_name, last_name, email, password_raw, role).' });
            return; // Simplemente 'return;' después de enviar la respuesta
        }

        const password_hash = await bcrypt.hash(password_raw, saltRounds);

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

        // Enviar respuesta de éxito (no es necesario 'return' aquí porque es la última acción del try)
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
            // Opcional: return; (para claridad, aunque es el final de esta ruta del catch)
        } else {
            res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
            // Opcional: return;
        }
    }
};