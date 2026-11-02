import { z } from 'zod';

export const bookSlotSchema = z.object({
    slotId: z.number().int().positive(),
});

export const bookingIdParamSchema = z.object({
    id: z
        .string()
        .regex(/^[1-9]\d*$/, 'id must be a positive integer')
        .transform(Number),
});