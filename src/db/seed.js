import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const SEED_PASSWORD = 'Password@123';
const SLOT_HOURS_UTC = [9, 10, 11];
const DAYS_AHEAD = 7;

const providers = [
    { name: 'Dr. Asha Verma', email: 'asha.provider@example.com' },
    { name: 'Rohan Mehta', email: 'rohan.provider@example.com' },
    { name: 'Neha Kapoor', email: 'neha.provider@example.com' },
];

const connection = await pool.getConnection();

try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['bookings', 'slots', 'users']) {
        await connection.query(`TRUNCATE TABLE ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    const providerIds = [];
    for (const provider of providers) {
        const [result] = await connection.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [provider.name, provider.email, passwordHash, 'provider']
        );
        providerIds.push(result.insertId);
    }

    await connection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Test User', 'user@example.com', passwordHash, 'user']
    );

    const now = new Date();
    const slotRows = [];

    for (const providerId of providerIds) {
        for (let day = 1; day <= DAYS_AHEAD; day += 1) {
            for (const hour of SLOT_HOURS_UTC) {
                const start = new Date(
                    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, hour)
                );
                const end = new Date(start.getTime() + 60 * 60 * 1000);
                slotRows.push([providerId, start, end]);
            }
        }
    }

    await connection.query(
        'INSERT INTO slots (provider_id, start_time, end_time) VALUES ?',
        [slotRows]
    );

    console.log(`Seeded ${providers.length} providers, 1 user and ${slotRows.length} slots`);
} catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
} finally {
    connection.release();
    await pool.end();
}