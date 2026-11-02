import {
    cancelBooking,
    createBooking,
    findActiveBookingBySlot,
    findBookingById,
    listBookingsByUser,
} from '../models/bookingModel.js';
import { findSlotById } from '../models/slotModel.js';

export async function bookSlot(req, res, next) {
    try {
        const { slotId } = req.body ?? {};

        if (!Number.isInteger(slotId) || slotId < 1) {
            return res.status(400).json({ message: 'slotId must be a positive integer' });
        }

        const slot = await findSlotById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }
        if (slot.startTime <= new Date()) {
            return res.status(400).json({ message: 'This slot has already started' });
        }

        const existing = await findActiveBookingBySlot(slotId);
        if (existing) {
            return res.status(409).json({ message: 'Slot is already booked' });
        }

        const id = await createBooking({ userId: req.user.id, slotId });
        const booking = await findBookingById(id);
        return res.status(201).json({ booking });
    } catch (error) {
        return next(error);
    }
}

export async function getMyBookings(req, res, next) {
    try {
        const bookings = await listBookingsByUser(req.user.id);
        return res.status(200).json({ count: bookings.length, bookings });
    } catch (error) {
        return next(error);
    }
}

export async function cancelMyBooking(req, res, next) {
    try {
        if (!/^[1-9]\d*$/.test(req.params.id)) {
            return res.status(400).json({ message: 'Booking id must be a positive integer' });
        }
        const bookingId = Number(req.params.id);

        const booking = await findBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.userId !== req.user.id) {
            return res.status(403).json({ message: 'You can only cancel your own bookings' });
        }
        if (booking.status === 'cancelled') {
            return res.status(409).json({ message: 'Booking is already cancelled' });
        }
        if (booking.startTime <= new Date()) {
            return res
                .status(400)
                .json({ message: 'Cannot cancel a booking whose slot has already started' });
        }

        const affectedRows = await cancelBooking({ id: bookingId, cancelledAt: new Date() });
        if (affectedRows === 0) {
            return res.status(409).json({ message: 'Booking is already cancelled' });
        }

        const updated = await findBookingById(bookingId);
        return res.status(200).json({ booking: updated });
    } catch (error) {
        return next(error);
    }
}