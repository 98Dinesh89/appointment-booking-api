import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { bearer, closePool, PASSWORD, registerUser, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);
afterAll(closePool);

describe('POST /api/auth/register', () => {
    test('registers a user and returns a token', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'alice@example.com', password: PASSWORD });

        expect(response.status).toBe(201);
        expect(response.body.token).toEqual(expect.any(String));
        expect(response.body.user).toEqual({
            id: expect.any(Number),
            name: 'Alice',
            email: 'alice@example.com',
            role: 'user',
        });
    });

    test('rejects a duplicate email with 409', async () => {
        await registerUser({ name: 'Alice', email: 'alice@example.com' });

        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice Again', email: 'alice@example.com', password: PASSWORD });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Email is already registered');
    });

    test('rejects an invalid body with 400 and field errors', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: '', email: 'not-an-email', password: '123' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        const fields = response.body.errors.map((error) => error.field);
        expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
    });

    test('rejects an unknown role with 400', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Eve', email: 'eve@example.com', password: PASSWORD, role: 'admin' });

        expect(response.status).toBe(400);
        expect(response.body.errors[0].field).toBe('role');
    });
});

describe('POST /api/auth/login', () => {
    test('logs in with correct credentials', async () => {
        await registerUser({ name: 'Alice', email: 'alice@example.com' });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com', password: PASSWORD });

        expect(response.status).toBe(200);
        expect(response.body.token).toEqual(expect.any(String));
        expect(response.body.user.email).toBe('alice@example.com');
    });

    test('rejects a wrong password with 401', async () => {
        await registerUser({ name: 'Alice', email: 'alice@example.com' });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com', password: 'WrongPassword1' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid email or password');
    });

    test('rejects an unknown email with 401', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: PASSWORD });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid email or password');
    });
});

describe('GET /api/auth/me', () => {
    test('returns 401 without a token', async () => {
        const response = await request(app).get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication token missing');
    });

    test('returns the logged-in user with a valid token', async () => {
        const alice = await registerUser({ name: 'Alice', email: 'alice@example.com' });

        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', bearer(alice.token));

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe('alice@example.com');
    });
});