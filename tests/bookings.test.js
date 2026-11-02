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
let otherUser;
let slot;

beforeEach(async () => {
    await resetDatabase();
    provider = await registerUser({
        name: 'Provider One',
        email: 'provider1@example.com',
        role: 'provider',
    });
    user = await registerUser({ name: 'User One', email: 'user1@example.com' });
    otherUser = await registerUser({ name: 'User Two', email: 'user2@example.com' });
    slot = await createFutureSlot(provider.token);
});

afterAll(closePool);

function book(token, slotId) {
    return request(app)
        .post('/api/bookings')
        .set('Authorization', bearer(token))
        .send({ slotId });
}

function cancel(token, bookingId) {
    return request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', bearer(token));
}

function listAvailable(token) {
    return request(app).get('/api/slots').set('Authorization', bearer(token));
}

describe('booking a slot', () => {
    test('lets a user book an available slot', async () => {
        const response = await book(user.token, slot.id);

        expect(response.status).toBe(201);
        expect(response.body.booking).toMatchObject({
            userId: user.id,
            slotId: slot.id,
            status: 'confirmed',
            providerId: provider.id,
        });
    });

    test('forbids a provider from booking', async () => {
        const response = await book(provider.token, slot.id);

        expect(response.status).toBe(403);
    });

    test('returns 404 for an unknown slot', async () => {
        const response = await book(user.token, 99999);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Slot not found');
    });

    test('returns 400 for an invalid slotId', async () => {
        const response = await request(app)
            .post('/api/bookings')
            .set('Authorization', bearer(user.token))
            .send({ slotId: '1' });

        expect(response.status).toBe(400);
        expect(response.body.errors[0].field).toBe('slotId');
    });

    test('removes the booked slot from the available list', async () => {
        await book(user.token, slot.id);

        const response = await listAvailable(user.token);

        expect(response.status).toBe(200);
        expect(response.body.slots.map((item) => item.id)).not.toContain(slot.id);
    });

    test('lists only the user own bookings', async () => {
        const secondSlot = await createFutureSlot(provider.token, { daysAhead: 3 });
        await book(user.token, slot.id);
        await book(otherUser.token, secondSlot.id);

        const response = await request(app)
            .get('/api/bookings/mine')
            .set('Authorization', bearer(user.token));

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1);
        expect(response.body.bookings[0].slotId).toBe(slot.id);
    });
});

describe('double booking', () => {
    test('rejects a second booking of the same slot with 409', async () => {
        await book(user.token, slot.id);

        const response = await book(otherUser.token, slot.id);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Slot is already booked');
    });

    test('allows exactly one of several simultaneous bookings', async () => {
        const responses = await Promise.all(
            Array.from({ length: 6 }, (_, index) =>
                book(index % 2 === 0 ? user.token : otherUser.token, slot.id)
            )
        );
        const statuses = responses.map((response) => response.status);

        expect(statuses.filter((status) => status === 201)).toHaveLength(1);
        expect(statuses.filter((status) => status === 409)).toHaveLength(5);
    });
});

describe('cancelling a booking', () => {
    test('cancels a booking and returns the slot to the available list', async () => {
        const booked = await book(user.token, slot.id);

        const response = await cancel(user.token, booked.body.booking.id);

        expect(response.status).toBe(200);
        expect(response.body.booking.status).toBe('cancelled');
        expect(response.body.booking.cancelledAt).not.toBeNull();

        const available = await listAvailable(user.token);
        expect(available.body.slots.map((item) => item.id)).toContain(slot.id);
    });

    test('rejects cancelling the same booking twice with 409', async () => {
        const booked = await book(user.token, slot.id);
        await cancel(user.token, booked.body.booking.id);

        const response = await cancel(user.token, booked.body.booking.id);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Booking is already cancelled');
    });

    test('forbids cancelling another user booking', async () => {
        const booked = await book(user.token, slot.id);

        const response = await cancel(otherUser.token, booked.body.booking.id);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('You can only cancel your own bookings');
    });

    test('lets someone book a slot again after it was cancelled', async () => {
        const booked = await book(user.token, slot.id);
        await cancel(user.token, booked.body.booking.id);

        const response = await book(otherUser.token, slot.id);

        expect(response.status).toBe(201);
        expect(response.body.booking.userId).toBe(otherUser.id);
    });
});