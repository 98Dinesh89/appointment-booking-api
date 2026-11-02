import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';

export const PASSWORD = 'Password@123';

export function bearer(token) {
    return `Bearer ${token}`;
}

export async function resetDatabase() {
    if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) {
        throw new Error('Refusing to reset a database whose name does not end with _test');
    }

    const connection = await pool.getConnection();
    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of ['bookings', 'slots', 'users']) {
            await connection.query(`TRUNCATE TABLE ${table}`);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
        connection.release();
    }
}

export async function closePool() {
    await pool.end();
}

export async function registerUser({ name, email, role = 'user' }) {
    const response = await request(app)
        .post('/api/auth/register')
        .send({ name, email, password: PASSWORD, role });

    if (response.status !== 201) {
        throw new Error(`Register failed: ${response.status} ${JSON.stringify(response.body)}`);
    }
    return { id: response.body.user.id, token: response.body.token, role };
}

export async function createFutureSlot(providerToken, { daysAhead = 2, hour = 10 } = {}) {
    const now = new Date();
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead, hour)
    );
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const response = await request(app)
        .post('/api/slots')
        .set('Authorization', bearer(providerToken))
        .send({ startTime: start.toISOString(), endTime: end.toISOString() });

    if (response.status !== 201) {
        throw new Error(`Slot creation failed: ${response.status} ${JSON.stringify(response.body)}`);
    }
    return response.body.slot;
}