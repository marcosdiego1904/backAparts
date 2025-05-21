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
// Tipo para el cuerpo de la solicitud al crear o actualizar una Unidad
type CreateUnitPayload = {
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
// Add these functions to your src/controllers/unitController.ts file

// Update an existing unit
export const updateUnit: RequestHandler<GetUnitByIdParams> = async (req, res) => {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);

        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID de la unidad debe ser un número.' });
            return;
        }

        // Check if unit exists
        const [existingUnit] = await pool.query<Unit[]>('SELECT * FROM units WHERE id = ?', [numericId]);
        
        if (existingUnit.length === 0) {
            res.status(404).json({ message: 'Unidad no encontrada' });
            return;
        }

        const {
            unit_number,
            building,
            floor,
            square_footage,
            number_of_bedrooms,
            number_of_bathrooms,
            is_occupied
        } = req.body as Partial<CreateUnitPayload>;

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
            const unit = {
                ...existingUnit[0],
                is_occupied: Boolean(existingUnit[0].is_occupied),
            };
            res.status(200).json(unit);
            return;
        }

        // Add ID to params
        queryParams.push(numericId);

        // Execute update query
        const sql = `UPDATE units SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.query(sql, queryParams);

        // Get the updated unit
        const [updatedUnit] = await pool.query<Unit[]>('SELECT * FROM units WHERE id = ?', [numericId]);
        
        const unit = {
            ...updatedUnit[0],
            is_occupied: Boolean(updatedUnit[0].is_occupied),
        };
        
        res.status(200).json(unit);
    } catch (error) {
        console.error('Error al actualizar unidad:', error);
        
        // Handle duplicate entry error
        if ((error as any).code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Error: Ya existe una unidad con ese número.', error: (error as Error).message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
        }
    }
};

// Delete a unit
export const deleteUnit: RequestHandler<GetUnitByIdParams> = async (req, res) => {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);

        if (isNaN(numericId)) {
            res.status(400).json({ message: 'El ID de la unidad debe ser un número.' });
            return;
        }

        // Check if unit exists
        const [existingUnit] = await pool.query<Unit[]>('SELECT * FROM units WHERE id = ?', [numericId]);
        
        if (existingUnit.length === 0) {
            res.status(404).json({ message: 'Unidad no encontrada' });
            return;
        }

        // Check if the unit has associated users or other entities (if needed)
        // This is important to maintain data integrity
        const [associatedUsers] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE unit_id = ?', [numericId]);
        
        if (associatedUsers[0].count > 0) {
            res.status(400).json({ message: 'No se puede eliminar la unidad porque tiene usuarios asociados.' });
            return;
        }

        // Delete the unit
        await pool.query('DELETE FROM units WHERE id = ?', [numericId]);
        
        res.status(200).json({ message: 'Unidad eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar unidad:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: (error as Error).message });
    }
};
// Aquí puedes añadir funciones para actualizar (updateUnit) y eliminar (deleteUnit) unidades en el futuro.