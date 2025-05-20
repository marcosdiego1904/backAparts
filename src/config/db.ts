// src/config/db.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Carga las variables de entorno desde .env

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar la conexión (opcional pero recomendado)
pool.getConnection()
    .then(connection => {
        console.log('Conectado a la base de datos MySQL! ID de conexión:', connection.threadId);
        connection.release(); // Liberar la conexión de prueba
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
             console.error('La conexión a la base de datos fue cerrada.');
}
if (err.code === 'ER_CON_COUNT_ERROR') {
console.error('La base de datos tiene demasiadas conexiones.');
}
if (err.code === 'ECONNREFUSED') {
console.error('La conexión a la base de datos fue rechazada.');
}
if (err.code === 'ER_BAD_DB_ERROR') {
console.error('La base de datos especificada no existe.');
}
if (err.code === 'ER_ACCESS_DENIED_ERROR') {
console.error('Acceso denegado. Verifica tu usuario y contraseña de MySQL.');
}
});

export default pool;