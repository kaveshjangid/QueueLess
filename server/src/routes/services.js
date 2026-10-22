import { Router } from 'express';
import Service from '../models/Service.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    res.json({ services });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const averageMinutes = Number(req.body.averageMinutes || 5);
    if (name.length < 2) return res.status(400).json({ message: 'Service name must be at least 2 characters.' });
    if (!Number.isFinite(averageMinutes) || averageMinutes < 1 || averageMinutes > 120) {
      return res.status(400).json({ message: 'Average minutes must be between 1 and 120.' });
    }
    const service = await Service.create({ name, description, averageMinutes });
    res.status(201).json({ service });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A service with this name already exists.' });
    next(error);
  }
});

router.patch('/:id', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const update = {};
    if (typeof req.body.isActive === 'boolean') update.isActive = req.body.isActive;
    if (typeof req.body.averageMinutes === 'number' && req.body.averageMinutes >= 1 && req.body.averageMinutes <= 120) update.averageMinutes = req.body.averageMinutes;
    const service = await Service.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    res.json({ service });
  } catch (error) { next(error); }
});

export default router;
