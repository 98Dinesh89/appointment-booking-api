import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
});

try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\``);
    await connection.query(`USE \`${env.db.name}\``);

    const schema = await fs.readFile(path.join(currentDir, 'schema.sql'), 'utf8');
    await connection.query(schema);

    console.log('Database and tables are ready');
} catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
} finally {
    await connection.end();
}