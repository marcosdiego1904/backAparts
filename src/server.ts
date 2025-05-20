// src/server.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from '../src/config/db';
import unitRoutes from './routes/unitRoutes';
import userRoutes from './routes/userRoutes'; // NUEVA LÍNEA: Importar las rutas de usuarios

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3001;

// Middleware "espía" global (CORREGIDO y colocado al principio)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`PETICIÓN RECIBIDA: Método: ${req.method}, URL: ${req.originalUrl}`);
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        console.log('Body (después de middlewares de parseo si este espía se mueve después):', req.body);
    }
    next();
});

// Middlewares principales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba para la conexión a la BD
app.get('/test-db', async (_req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        interface SolutionRow { solution: number; }
        const result = rows as SolutionRow[];
        res.json({ success: true, message: 'Conexión a BD exitosa', data: result[0] });
    } catch (error) {
        console.error('Error al probar la conexión a la BD:', error);
        res.status(500).json({ success: false, message: 'Error al conectar a la BD', error: (error as Error).message });
    }
});

// Rutas de la API
app.use('/api/units', unitRoutes); // Rutas para las unidades
app.use('/api/users', userRoutes); // NUEVA LÍNEA: Rutas para los usuarios

// Ruta de bienvenida
app.get('/', (_req: Request, res: Response) => {
    res.send('¡Bienvenido a mi API de Apartamentos!');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});