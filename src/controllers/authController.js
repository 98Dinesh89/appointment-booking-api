import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createUser, findUserByEmail, findUserById } from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function signToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
    });
}

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.validated.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const id = await createUser({ name, email, passwordHash, role });

    const user = { id, name, email, role };
    res.status(201).json({ user, token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.validated.body;

    const record = await findUserByEmail(email);
    const passwordMatches = record
        ? await bcrypt.compare(password, record.password_hash)
        : false;

    if (!record || !passwordMatches) {
        throw new AppError(401, 'Invalid email or password');
    }

    const user = {
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role,
    };
    res.status(200).json({ user, token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
    const user = await findUserById(req.user.id);
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    res.status(200).json({ user });
});