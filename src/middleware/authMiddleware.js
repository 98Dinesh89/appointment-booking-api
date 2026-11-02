import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return next(new AppError(401, 'Authentication token missing'));
    }

    let payload;
    try {
        payload = jwt.verify(token, env.jwt.secret);
    } catch (error) {
        return next(new AppError(401, 'Invalid or expired token'));
    }

    req.user = { id: payload.id, role: payload.role };
    return next();
}