import {
    cancelBooking,
    createBooking,
    findActiveBookingBySlot,
    findBookingById,
    listBookingsByUser,
} from '../models/bookingModel.js';
import { findSlotById } from '../models/slotModel.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const bookSlot = asyncHandler(async (req, res) => {
    const { slotId } = req.validated.body;

    const slot = await findSlotById(slotId);
    if (!slot) {
        throw new AppError(404, 'Slot not found');
    }
    if (slot.startTime <= new Date()) {
        throw new AppError(400, 'This slot has already started');
    }

    const existing = await findActiveBookingBySlot(slotId);
    if (existing) {
        throw new AppError(409, 'Slot is already booked');
    }

    const id = await createBooking({ userId: req.user.id, slotId });
    const booking = await findBookingById(id);
    res.status(201).json({ booking });
});

export const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await listBookingsByUser(req.user.id);
    res.status(200).json({ count: bookings.length, bookings });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
    const { id: bookingId } = req.validated.params;

    const booking = await findBookingById(bookingId);
    if (!booking) {
        throw new AppError(404, 'Booking not found');
    }
    if (booking.userId !== req.user.id) {
        throw new AppError(403, 'You can only cancel your own bookings');
    }
    if (booking.status === 'cancelled') {
        throw new AppError(409, 'Booking is already cancelled');
    }
    if (booking.startTime <= new Date()) {
        throw new AppError(400, 'Cannot cancel a booking whose slot has already started');
    }

    const affectedRows = await cancelBooking({ id: bookingId, cancelledAt: new Date() });
    if (affectedRows === 0) {
        throw new AppError(409, 'Booking is already cancelled');
    }

    const updated = await findBookingById(bookingId);
    res.status(200).json({ booking: updated });
});