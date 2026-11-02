import pool from '../config/db.js';

const SLOT_COLUMNS = `
  s.id,
  s.provider_id AS providerId,
  s.start_time AS startTime,
  s.end_time AS endTime
`;

export async function createSlot({ providerId, startTime, endTime }) {
    const [result] = await pool.query(
        'INSERT INTO slots (provider_id, start_time, end_time) VALUES (?, ?, ?)',
        [providerId, startTime, endTime]
    );
    return result.insertId;
}

export async function findSlotById(id) {
    const [rows] = await pool.query(
        `SELECT ${SLOT_COLUMNS} FROM slots s WHERE s.id = ?`,
        [id]
    );
    return rows[0] || null;
}

export async function listAvailableSlots({ providerId, dayStart, dayEnd }) {
    const conditions = ['s.start_time > ?', 'b.id IS NULL'];
    const params = [new Date()];

    if (providerId) {
        conditions.push('s.provider_id = ?');
        params.push(providerId);
    }
    if (dayStart && dayEnd) {
        conditions.push('s.start_time >= ? AND s.start_time < ?');
        params.push(dayStart, dayEnd);
    }

    const [rows] = await pool.query(
        `SELECT ${SLOT_COLUMNS}, u.name AS providerName
     FROM slots s
     JOIN users u ON u.id = s.provider_id
     LEFT JOIN bookings b ON b.slot_id = s.id AND b.status = 'confirmed'
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.start_time ASC`,
        params
    );
    return rows;
}

export async function listSlotsByProvider(providerId) {
    const [rows] = await pool.query(
        `SELECT ${SLOT_COLUMNS}, (b.id IS NOT NULL) AS isBooked
     FROM slots s
     LEFT JOIN bookings b ON b.slot_id = s.id AND b.status = 'confirmed'
     WHERE s.provider_id = ?
     ORDER BY s.start_time ASC`,
        [providerId]
    );
    return rows.map((row) => ({ ...row, isBooked: Boolean(row.isBooked) }));
}