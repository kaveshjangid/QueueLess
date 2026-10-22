import { Router } from 'express';
import QueueToken from '../models/QueueToken.js';
import Service from '../models/Service.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { localDateKey } from '../utils.js';

const router = Router();

router.get('/summary', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const dateKey = localDateKey();
    const [services, total, waiting, called, served, skipped] = await Promise.all([
      Service.countDocuments({ isActive: true }),
      QueueToken.countDocuments({ dateKey }),
      QueueToken.countDocuments({ dateKey, status: 'waiting' }),
      QueueToken.countDocuments({ dateKey, status: 'called' }),
      QueueToken.countDocuments({ dateKey, status: 'served' }),
      QueueToken.countDocuments({ dateKey, status: 'skipped' })
    ]);
    res.json({ dateKey, services, total, waiting, called, served, skipped });
  } catch (error) { next(error); }
});

export default router;
