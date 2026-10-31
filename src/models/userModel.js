import pool from '../config/db.js';

export async function createUser({ name, email, passwordHash, role }) {
    const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role]
    );
    return result.insertId;
}

export async function findUserByEmail(email) {
    const [rows] = await pool.query(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
        [email]
    );
    return rows[0] || null;
}

export async function findUserById(id) {
    const [rows] = await pool.query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
        [id]
    );
    return rows[0] || null;
}