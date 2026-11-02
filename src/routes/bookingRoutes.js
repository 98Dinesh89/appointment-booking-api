import { Router } from 'express';
import {
    bookSlot,
    cancelMyBooking,
    getMyBookings,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate, authorizeRoles('user'));

router.post('/', bookSlot);
router.get('/mine', getMyBookings);
router.patch('/:id/cancel', cancelMyBooking);

export default router;