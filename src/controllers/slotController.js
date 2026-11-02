import {
    createSlot,
    findSlotById,
    listAvailableSlots,
    listSlotsByProvider,
} from '../models/slotModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const addSlot = asyncHandler(async (req, res) => {
    const { startTime, endTime } = req.validated.body;

    const id = await createSlot({
        providerId: req.user.id,
        startTime,
        endTime,
    });
    const slot = await findSlotById(id);
    res.status(201).json({ slot });
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
    const { providerId, date } = req.validated.query;
    const filters = { providerId };

    if (date) {
        const dayStart = new Date(`${date}T00:00:00.000Z`);
        filters.dayStart = dayStart;
        filters.dayEnd = new Date(dayStart.getTime() + DAY_IN_MS);
    }

    const slots = await listAvailableSlots(filters);
    res.status(200).json({ count: slots.length, slots });
});

export const getMySlots = asyncHandler(async (req, res) => {
    const slots = await listSlotsByProvider(req.user.id);
    res.status(200).json({ count: slots.length, slots });
});