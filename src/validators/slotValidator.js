import { z } from 'zod';

const isoDateTime = z
    .string()
    .datetime({
        offset: true,
        message: 'must be an ISO 8601 date-time, e.g. 2026-11-20T14:00:00.000Z',
    })
    .transform((value) => {
        const date = new Date(value);
        date.setUTCMilliseconds(0);
        return date;
    });

function isRealDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export const createSlotSchema = z
    .object({
        startTime: isoDateTime,
        endTime: isoDateTime,
    })
    .refine((data) => data.endTime > data.startTime, {
        message: 'endTime must be after startTime',
        path: ['endTime'],
    })
    .refine((data) => data.startTime > new Date(), {
        message: 'Slot must start in the future',
        path: ['startTime'],
    });

export const listSlotsQuerySchema = z.object({
    providerId: z.coerce.number().int().positive().optional(),
    date: z
        .string()
        .refine(isRealDate, 'date must be a real date in YYYY-MM-DD format')
        .optional(),
});