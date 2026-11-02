import { Router } from 'express';
import { addSlot, getAvailableSlots, getMySlots } from '../controllers/slotController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', authenticate, getAvailableSlots);
router.get('/mine', authenticate, authorizeRoles('provider'), getMySlots);
router.post('/', authenticate, authorizeRoles('provider'), addSlot);

export default router;