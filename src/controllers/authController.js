import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createUser, findUserByEmail, findUserById } from '../models/userModel.js';

function signToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
    });
}

export async function register(req, res, next) {
    try {
        const { name, email, password, role } = req.validated.body;
        const passwordHash = await bcrypt.hash(password, 10);

        const id = await createUser({ name, email, passwordHash, role });

        const user = { id, name, email, role };
        return res.status(201).json({ user, token: signToken(user) });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email is already registered' });
        }
        return next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.validated.body;

        const record = await findUserByEmail(email);
        const passwordMatches = record
            ? await bcrypt.compare(password, record.password_hash)
            : false;

        if (!record || !passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = {
            id: record.id,
            name: record.name,
            email: record.email,
            role: record.role,
        };
        return res.status(200).json({ user, token: signToken(user) });
    } catch (error) {
        return next(error);
    }
}

export async function me(req, res, next) {
    try {
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user });
    } catch (error) {
        return next(error);
    }
}