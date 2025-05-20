// scripts/seed.ts
import pool from '../src/config/db'; // Ensure this path is correct from your project root
import bcrypt from 'bcryptjs';
import { PoolConnection, OkPacket } from 'mysql2/promise'; // Import OkPacket for insert results

// --- 1. Interface Definitions ---
interface DemoUnit {
    unit_number: string;
    building: string;
    floor: number;
    is_occupied: boolean;
}

interface InsertedUnit extends DemoUnit {
    id: number;
}

interface DemoUser {
    first_name: string;
    last_name: string;
    email: string;
    password_raw: string; // Using password_raw for clarity
    role: 'manager' | 'tenant';
    unit_number: string | null; // unit_number from demo data to find unit_id
}

interface InsertedUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: 'manager' | 'tenant';
    unit_id: number | null; // Foreign key to units table
}

const saltRounds = 10;

async function seedDatabase() {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        console.log('Iniciando proceso de seeding...');

        // --- 2. Limpiar Tablas y Resetear AUTO_INCREMENT ---
        console.log('Limpiando tablas existentes...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('TRUNCATE TABLE maintenance_requests');
        await connection.execute('ALTER TABLE maintenance_requests AUTO_INCREMENT = 1');
        await connection.execute('TRUNCATE TABLE payments');
        await connection.execute('ALTER TABLE payments AUTO_INCREMENT = 1');
        await connection.execute('TRUNCATE TABLE users');
        await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
        await connection.execute('TRUNCATE TABLE units');
        await connection.execute('ALTER TABLE units AUTO_INCREMENT = 1');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Tablas limpiadas y AUTO_INCREMENT reseteado.');

        // --- 3. Definir Datos de Ejemplo ---
        const demoUnitsData: DemoUnit[] = [
            { unit_number: '101', building: 'A', floor: 1, is_occupied: true },
            { unit_number: '102', building: 'A', floor: 1, is_occupied: true },
            { unit_number: '201', building: 'B', floor: 2, is_occupied: false },
            { unit_number: '202', building: 'B', floor: 2, is_occupied: true },
            { unit_number: '301', building: 'C', floor: 3, is_occupied: true },
        ];

        const demoUsersData: DemoUser[] = [
            { first_name: 'Admin', last_name: 'Manager', email: 'manager@demo.com', password_raw: 'password123', role: 'manager', unit_number: null },
            { first_name: 'Tenant', last_name: 'Demo', email: 'tenant@demo.com', password_raw: 'password123', role: 'tenant', unit_number: '101' },
            { first_name: 'Juan', last_name: 'Perez', email: 'juan.perez@example.com', password_raw: 'password456', role: 'tenant', unit_number: '102' },
            { first_name: 'Maria', last_name: 'Gomez', email: 'maria.gomez@example.com', password_raw: 'password789', role: 'tenant', unit_number: '202' },
            { first_name: 'Carlos', last_name: 'Lopez', email: 'carlos.lopez@example.com', password_raw: 'passwordabc', role: 'tenant', unit_number: '301' },
        ];

        // --- 4. Insertar Datos ---
        const insertedUnits: InsertedUnit[] = [];
        console.log('Insertando unidades...');
        for (const unit of demoUnitsData) {
            const [result] = await connection.execute<OkPacket>(
                'INSERT INTO units (unit_number, building, floor, is_occupied) VALUES (?, ?, ?, ?)',
                [unit.unit_number, unit.building, unit.floor, unit.is_occupied]
            );
            insertedUnits.push({ ...unit, id: result.insertId });
        }
        console.log(`${insertedUnits.length} unidades insertadas.`);

        const insertedUsers: InsertedUser[] = [];
        console.log('Insertando usuarios...');
        for (const user of demoUsersData) {
            const unitData = user.unit_number ? insertedUnits.find(u => u.unit_number === user.unit_number) : null;
            const unitId = unitData ? unitData.id : null;
            const passwordHash = await bcrypt.hash(user.password_raw, saltRounds);

            const [result] = await connection.execute<OkPacket>(
                'INSERT INTO users (first_name, last_name, email, password_hash, role, unit_id) VALUES (?, ?, ?, ?, ?, ?)',
                [user.first_name, user.last_name, user.email, passwordHash, user.role, unitId]
            );
            insertedUsers.push({
                id: result.insertId,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                unit_id: unitId
            });
        }
        console.log(`${insertedUsers.length} usuarios insertados.`);

        // --- 5. Insertar Pagos y Solicitudes de Mantenimiento (con lógica corregida) ---
        console.log('Insertando pagos y mantenimientos específicos...');

        const tenantDemoUser = insertedUsers.find(u => u.email === 'tenant@demo.com');
        const unit101 = insertedUnits.find(u => u.unit_number === '101');

        if (tenantDemoUser && unit101) {
            console.log(`Configurando pagos y mantenimientos para ${tenantDemoUser.email} en unidad ${unit101.unit_number}...`);
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
            const currentMonthPeriod = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
            const nextMonthPeriod = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`;

            // Pago de Renta (Vencido para el próximo mes)
            await connection.execute(
                'INSERT INTO payments (unit_id, user_id, payment_type, amount_due, due_date, status, payment_period) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [unit101.id, tenantDemoUser.id, 'rent', 1200.00, nextMonth.toISOString().split('T')[0], 'due', nextMonthPeriod]
            );
            // Pago de Cuotas (Pagado este mes)
            await connection.execute(
                'INSERT INTO payments (unit_id, user_id, payment_type, amount_due, amount_paid, payment_date, due_date, status, payment_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [unit101.id, tenantDemoUser.id, 'dues', 250.00, 250.00, today.toISOString().split('T')[0], today.toISOString().split('T')[0], 'paid', currentMonthPeriod]
            );
            console.log('Pagos de ejemplo insertados para tenantDemoUser y unit101.');

            // Solicitud de Mantenimiento para unit101 ("Luz del pasillo fundida")
            await connection.execute(
                'INSERT INTO maintenance_requests (unit_id, user_id, title, description, status, priority) VALUES (?, ?, ?, ?, ?, ?)',
                [unit101.id, tenantDemoUser.id, 'Luz del pasillo fundida', 'La luz del pasillo principal de la unidad 101 no funciona.', 'open', 'medium']
            );
            console.log('Solicitud de mantenimiento "Luz fundida" insertada para unit101.');
        } else {
            if (!tenantDemoUser) console.warn("ADVERTENCIA: Usuario 'tenant@demo.com' no encontrado. Se omitirán sus pagos y mantenimientos.");
            if (!unit101) console.warn("ADVERTENCIA: Unidad '101' no encontrada. Se omitirán sus pagos y mantenimientos.");
        }

        const juanPerezUser = insertedUsers.find(u => u.email === 'juan.perez@example.com');
        const unit102 = insertedUnits.find(u => u.unit_number === '102');
        const managerUser = insertedUsers.find(u => u.role === 'manager');

        if (juanPerezUser && unit102 && managerUser) {
            console.log(`Configurando mantenimiento para ${juanPerezUser.email} en unidad ${unit102.unit_number} asignado a ${managerUser.email}...`);
            // Solicitud de Mantenimiento para unit102 ("Fuga en el baño")
            await connection.execute(
                'INSERT INTO maintenance_requests (unit_id, user_id, title, description, status, priority, assigned_to_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [unit102.id, juanPerezUser.id, 'Fuga en el baño', 'Hay una gotera constante en el baño principal.', 'in_progress', 'high', managerUser.id]
            );
            console.log('Solicitud de mantenimiento "Fuga en el baño" insertada para unit102.');
        } else {
            if (!juanPerezUser) console.warn("ADVERTENCIA: Usuario 'juan.perez@example.com' no encontrado. Se omitirá su solicitud de mantenimiento.");
            if (!unit102) console.warn("ADVERTENCIA: Unidad '102' no encontrada para la solicitud de juan.perez@example.com.");
            if (!managerUser) console.warn("ADVERTENCIA: Usuario 'manager' no encontrado para asignar la solicitud de juan.perez@example.com.");
        }

        await connection.commit();
        console.log('Seeding completado exitosamente.');

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error durante el seeding:', error);
        throw error; // Relanza para que el catch de abajo lo maneje
    } finally {
        if (connection) {
            connection.release();
        }
        // Considera si pool.end() debe estar aquí o en el bloque de llamada principal.
        // Para un script de seed que se ejecuta una vez, está bien aquí.
        await pool.end();
    }
}

seedDatabase()
    .then(() => {
        console.log('Script de seeding finalizado.');
        process.exit(0);
    })
    .catch(err => {
        console.error('El script de seeding falló gravemente:', err);
        process.exit(1);
    });