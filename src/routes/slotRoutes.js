import { Router } from 'express';
import { addSlot, getAvailableSlots, getMySlots } from '../controllers/slotController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createSlotSchema, listSlotsQuerySchema } from '../validators/slotValidator.js';

const router = Router();

router.get('/', authenticate, validate({ query: listSlotsQuerySchema }), getAvailableSlots);
router.get('/mine', authenticate, authorizeRoles('provider'), getMySlots);
router.post(
    '/',
    authenticate,
    authorizeRoles('provider'),
    validate({ body: createSlotSchema }),
    addSlot
);

export default router;