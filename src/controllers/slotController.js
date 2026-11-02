import {
    createSlot,
    findSlotById,
    listAvailableSlots,
    listSlotsByProvider,
} from '../models/slotModel.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(value) {
    if (typeof value !== 'string') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setUTCMilliseconds(0);
    return date;
}

export async function addSlot(req, res, next) {
    try {
        const { startTime, endTime } = req.body ?? {};
        const start = parseIsoDate(startTime);
        const end = parseIsoDate(endTime);

        if (!start || !end) {
            return res
                .status(400)
                .json({ message: 'startTime and endTime must be valid ISO date strings' });
        }
        if (end <= start) {
            return res.status(400).json({ message: 'endTime must be after startTime' });
        }
        if (start <= new Date()) {
            return res.status(400).json({ message: 'Slot must start in the future' });
        }

        const id = await createSlot({
            providerId: req.user.id,
            startTime: start,
            endTime: end,
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
        const { providerId, date } = req.query;
        const filters = {};

        if (providerId !== undefined) {
            if (!/^[1-9]\d*$/.test(providerId)) {
                return res.status(400).json({ message: 'providerId must be a positive integer' });
            }
            filters.providerId = Number(providerId);
        }

        if (date !== undefined) {
            const dayStart = /^\d{4}-\d{2}-\d{2}$/.test(date)
                ? new Date(`${date}T00:00:00.000Z`)
                : null;
            if (!dayStart || Number.isNaN(dayStart.getTime())) {
                return res
                    .status(400)
                    .json({ message: 'date must be a valid date in YYYY-MM-DD format' });
            }
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