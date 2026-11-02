import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().trim().min(1, 'name is required').max(100, 'name is too long'),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email('email must be a valid email address')
        .max(255, 'email is too long'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must be at most 72 characters'),
    role: z.enum(['user', 'provider']).default('user'),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
    password: z.string().min(1, 'password is required'),
});