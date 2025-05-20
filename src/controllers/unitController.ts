// src/controllers/unitController.ts
import { Request, Response, RequestHandler } from 'express';
import pool from '../config/db';
import { OkPacket, RowDataPacket } from 'mysql2/promise';

// Interfaz para una Unidad, basada en tu tabla 'units'
interface Unit extends RowDataPacket {
    id: number; // id es generado por la BD, pero lo incluimos
    unit_number: string;
    building?: string | null;
    floor?: number | null;
    square_footage?: string | number | null; // DECIMAL puede venir como string
    number_of_bedrooms?: number | null;
    number_of_bathrooms?: string | number | null; // DECIMAL puede venir como string
    is_occupied?: boolean | null; // MySQL devuelve 0 o 1 para BOOLEAN
    created_at?: Date | string;
    updated_at?: Date | string;
}

// Tipo para el cuerpo de la solicitud al crear una Unidad
// Solo incluimos los campos que esperamos del cliente al crear una unidad.
// 'unit_number' es obligatorio. Otros son opcionales.
type CreateUnitRequestBody = {
    unit_number: string;
    building?: string;
    floor?: number;
    square_footage?: string | number;
    number_of_bedrooms?: number;
    number_of_bathrooms?: string | number;
    is_occupied?: boolean;
};

// Tipo para los parámetros de ruta (ej: /units/:id)
interface GetUnitByIdParams {
    id: string;
}

// Obtener todas las unidades
export const getAllUnits: RequestHandler = async (_req, res) => {
    try {
        const [rows] = await pool.query<Unit[]>('SELECT * FROM units');
        // Convertir is_occupied (0/1) a boolean (false/true) si es necesario para el frontend
        const units = rows.map(unit => ({
            ...unit,
            is_occupied: Boolean(unit.is_occupied),
        }));
        res.status(200).json(units);
    } catch (error) {
        console.error('Error al obtener unidades:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

// Obtener una unidad por su ID
export const getUnitById: RequestHandler<GetUnitByIdParams> = async (req, res) => {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);

        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID de la unidad debe ser un número.' });
            return;
        }

        const [rows] = await pool.query<Unit[]>('SELECT * FROM units WHERE id = ?', [numericId]);

        if (rows.length === 0) {
            res.status(404).json({ message: 'Unidad no encontrada' });
            return;
        }
        const unit = {
            ...rows[0],
            is_occupied: Boolean(rows[0].is_occupied),
        };
        res.status(200).json(unit);
    } catch (error) {
        console.error('Error al obtener unidad por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};

// Crear una nueva unidad
export const createUnit: RequestHandler = async (req, res) => {
    try {
        const {
            unit_number,
            building,
            floor,
            square_footage,
            number_of_bedrooms,
            number_of_bathrooms,
            is_occupied = false // Valor por defecto si no se envía
        } = req.body as CreateUnitRequestBody;

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

        const [result] = await pool.query<OkPacket>(sql, params);

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
    } catch (error) {
        console.error('Error al crear unidad:', error);
        // Manejo específico para error de entrada duplicada (unit_number UNIQUE)
        if ((error as any).code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: Ya existe una unidad con ese número.', error: (error as Error).message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
        }
    }
};

// Aquí puedes añadir funciones para actualizar (updateUnit) y eliminar (deleteUnit) unidades en el futuro.