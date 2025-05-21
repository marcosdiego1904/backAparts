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
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("../src/config/db"));
const unitRoutes_1 = __importDefault(require("./routes/unitRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // NUEVA LÍNEA: Importar las rutas de usuarios
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware "espía" global (CORREGIDO y colocado al principio)
app.use((req, res, next) => {
    console.log(`PETICIÓN RECIBIDA: Método: ${req.method}, URL: ${req.originalUrl}`);
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        console.log('Body (después de middlewares de parseo si este espía se mueve después):', req.body);
    }
    next();
});
// Middlewares principales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Ruta de prueba para la conexión a la BD
app.get('/test-db', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield db_1.default.query('SELECT 1 + 1 AS solution');
        const result = rows;
        res.json({ success: true, message: 'Conexión a BD exitosa', data: result[0] });
    }
    catch (error) {
        console.error('Error al probar la conexión a la BD:', error);
        res.status(500).json({ success: false, message: 'Error al conectar a la BD', error: error.message });
    }
}));
// Rutas de la API
app.use('/api/units', unitRoutes_1.default); // Rutas para las unidades
app.use('/api/users', userRoutes_1.default); // NUEVA LÍNEA: Rutas para los usuarios
// Ruta de bienvenida
app.get('/', (_req, res) => {
    res.send('¡Bienvenido a mi API de Apartamentos!');
});
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
