import {
    createSlot,
    findSlotById,
    listAvailableSlots,
    listSlotsByProvider,
} from '../models/slotModel.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function addSlot(req, res, next) {
    try {
        const { startTime, endTime } = req.validated.body;

        const id = await createSlot({
            providerId: req.user.id,
            startTime,
            endTime,
        });
        const slot = await findSlotById(id);
        return res.status(201).json({ slot });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res
                .status(409)
                .json({ message: 'You already have a slot starting at that time' });
        }
        return next(error);
    }
}

export async function getAvailableSlots(req, res, next) {
    try {
        const { providerId, date } = req.validated.query;
        const filters = { providerId };

        if (date) {
            const dayStart = new Date(`${date}T00:00:00.000Z`);
            filters.dayStart = dayStart;
            filters.dayEnd = new Date(dayStart.getTime() + DAY_IN_MS);
        }

        const slots = await listAvailableSlots(filters);
        return res.status(200).json({ count: slots.length, slots });
    } catch (error) {
        return next(error);
    }
}

export async function getMySlots(req, res, next) {
    try {
        const slots = await listSlotsByProvider(req.user.id);
        return res.status(200).json({ count: slots.length, slots });
    } catch (error) {
        return next(error);
    }
}