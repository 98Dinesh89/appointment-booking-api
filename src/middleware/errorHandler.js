import { AppError } from '../utils/AppError.js';

const DUPLICATE_KEY_MESSAGES = [
    { key: 'uq_users_email', message: 'Email is already registered' },
    {
        key: 'uq_slots_provider_start',
        message: 'You already have a slot starting at that time',
    },
    { key: 'uq_bookings_active_slot', message: 'Slot is already booked' },
];

export function notFoundHandler(req, res, next) {
    next(new AppError(404, 'Route not found'));
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        const body = { message: err.message };
        if (err.errors) {
            body.errors = err.errors;
        }
        return res.status(err.statusCode).json(body);
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Malformed JSON body' });
    }

    if (err.code === 'ER_DUP_ENTRY') {
        const text = err.sqlMessage || err.message || '';
        const match = DUPLICATE_KEY_MESSAGES.find((entry) => text.includes(entry.key));
        return res.status(409).json({ message: match ? match.message : 'Duplicate entry' });
    }

    if (process.env.NODE_ENV !== 'test') {
        console.error(err);
    }
    return res.status(500).json({ message: 'Internal server error' });
}