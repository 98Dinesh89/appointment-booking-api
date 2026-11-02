import { Router } from 'express';
import {
    bookSlot,
    cancelMyBooking,
    getMyBookings,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { bookingIdParamSchema, bookSlotSchema } from '../validators/bookingValidator.js';

const router = Router();

router.use(authenticate, authorizeRoles('user'));

router.post('/', validate({ body: bookSlotSchema }), bookSlot);
router.get('/mine', getMyBookings);
router.patch('/:id/cancel', validate({ params: bookingIdParamSchema }), cancelMyBooking);

export default router;