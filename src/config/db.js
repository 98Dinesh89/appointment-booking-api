import mysql from 'mysql2/promise';
import { env } from './env.js';

const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
});

pool.on('connection', (connection) => {
    connection.query("SET time_zone = '+00:00'");
});

export default pool;