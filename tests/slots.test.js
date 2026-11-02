import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import {
    bearer,
    closePool,
    createFutureSlot,
    registerUser,
    resetDatabase,
} from './helpers.js';

let provider;
let user;

beforeEach(async () => {
    await resetDatabase();
    provider = await registerUser({
        name: 'Provider One',
        email: 'provider1@example.com',
        role: 'provider',
    });
    user = await registerUser({ name: 'User One', email: 'user1@example.com' });
});

afterAll(closePool);

function futureTimes(daysAhead = 3, hour = 14) {
    const now = new Date();
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead, hour)
    );
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { startTime: start.toISOString(), endTime: end.toISOString() };
}

describe('POST /api/slots', () => {
    test('forbids a user from creating a slot', async () => {
        const response = await request(app)
            .post('/api/slots')
            .set('Authorization', bearer(user.token))
            .send(futureTimes());

        expect(response.status).toBe(403);
    });

    test('lets a provider create a slot', async () => {
        const times = futureTimes();
        const response = await request(app)
            .post('/api/slots')
            .set('Authorization', bearer(provider.token))
            .send(times);

        expect(response.status).toBe(201);
        expect(response.body.slot).toEqual({
            id: expect.any(Number),
            providerId: provider.id,
            startTime: times.startTime,
            endTime: times.endTime,
        });
    });

    test('rejects an end time before the start time', async () => {
        const { startTime, endTime } = futureTimes();
        const response = await request(app)
            .post('/api/slots')
            .set('Authorization', bearer(provider.token))
            .send({ startTime: endTime, endTime: startTime });

        expect(response.status).toBe(400);
        expect(response.body.errors[0]).toEqual({
            field: 'endTime',
            message: 'endTime must be after startTime',
        });
    });

    test('rejects a slot that starts in the past', async () => {
        const response = await request(app)
            .post('/api/slots')
            .set('Authorization', bearer(provider.token))
            .send({
                startTime: '2020-01-01T10:00:00.000Z',
                endTime: '2020-01-01T11:00:00.000Z',
            });

        expect(response.status).toBe(400);
        expect(response.body.errors[0].field).toBe('startTime');
    });

    test('rejects a duplicate start time for the same provider with 409', async () => {
        const times = futureTimes();
        await request(app)
            .post('/api/slots')
            .set('Authorization', bearer(provider.token))
            .send(times);

        const response = await request(app)
            .post('/api/slots')
            .set('Authorization', bearer(provider.token))
            .send(times);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('You already have a slot starting at that time');
    });
});

describe('GET /api/slots', () => {
    test('requires authentication', async () => {
        const response = await request(app).get('/api/slots');

        expect(response.status).toBe(401);
    });

    test('lists available future slots', async () => {
        const slot = await createFutureSlot(provider.token);

        const response = await request(app)
            .get('/api/slots')
            .set('Authorization', bearer(user.token));

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1);
        expect(response.body.slots[0].id).toBe(slot.id);
    });

    test('filters by providerId', async () => {
        const otherProvider = await registerUser({
            name: 'Provider Two',
            email: 'provider2@example.com',
            role: 'provider',
        });
        await createFutureSlot(provider.token);
        await createFutureSlot(otherProvider.token);

        const response = await request(app)
            .get(`/api/slots?providerId=${provider.id}`)
            .set('Authorization', bearer(user.token));

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1);
        expect(response.body.slots[0].providerId).toBe(provider.id);
    });
});

describe('GET /api/slots/mine', () => {
    test('returns only the provider own slots and forbids users', async () => {
        const otherProvider = await registerUser({
            name: 'Provider Two',
            email: 'provider2@example.com',
            role: 'provider',
        });
        await createFutureSlot(provider.token);
        await createFutureSlot(otherProvider.token);

        const response = await request(app)
            .get('/api/slots/mine')
            .set('Authorization', bearer(provider.token));

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1);
        expect(response.body.slots[0].providerId).toBe(provider.id);
        expect(response.body.slots[0].isBooked).toBe(false);

        const forbidden = await request(app)
            .get('/api/slots/mine')
            .set('Authorization', bearer(user.token));
        expect(forbidden.status).toBe(403);
    });
});