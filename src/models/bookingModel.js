import pool from '../config/db.js';

const BOOKING_SELECT = `
  SELECT
    b.id,
    b.user_id AS userId,
    b.slot_id AS slotId,
    b.status,
    b.created_at AS createdAt,
    b.cancelled_at AS cancelledAt,
    s.start_time AS startTime,
    s.end_time AS endTime,
    s.provider_id AS providerId,
    p.name AS providerName
  FROM bookings b
  JOIN slots s ON s.id = b.slot_id
  JOIN users p ON p.id = s.provider_id
`;

export async function createBooking({ userId, slotId }) {
    const [result] = await pool.query(
        'INSERT INTO bookings (user_id, slot_id) VALUES (?, ?)',
        [userId, slotId]
    );
    return result.insertId;
}

export async function findActiveBookingBySlot(slotId) {
    const [rows] = await pool.query(
        "SELECT id FROM bookings WHERE slot_id = ? AND status = 'confirmed' LIMIT 1",
        [slotId]
    );
    return rows[0] || null;
}

export async function findBookingById(id) {
    const [rows] = await pool.query(`${BOOKING_SELECT} WHERE b.id = ?`, [id]);
    return rows[0] || null;
}

export async function listBookingsByUser(userId) {
    const [rows] = await pool.query(
        `${BOOKING_SELECT} WHERE b.user_id = ? ORDER BY s.start_time ASC`,
        [userId]
    );
    return rows;
}

export async function cancelBooking({ id, cancelledAt }) {
    const [result] = await pool.query(
        "UPDATE bookings SET status = 'cancelled', cancelled_at = ? WHERE id = ? AND status = 'confirmed'",
        [cancelledAt, id]
    );
    return result.affectedRows;
}