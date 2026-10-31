import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/', authenticate, authorizeRoles('provider'), (req, res) => {
    res.status(200).json({ message: 'Provider access confirmed', user: req.user });
});

export default router;