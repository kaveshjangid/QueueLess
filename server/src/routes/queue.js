import { Router } from 'express';
import mongoose from 'mongoose';
import QueueToken from '../models/QueueToken.js';
import TokenCounter from '../models/TokenCounter.js';
import Service from '../models/Service.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { localDateKey, estimateWait } from '../utils.js';
import { emitQueueUpdate } from '../socket.js';

const router = Router();
const activeStatuses = ['waiting', 'called', 'serving'];

async function queueSnapshot(serviceId, dateKey = localDateKey()) {
  const service = await Service.findById(serviceId);
  if (!service) return null;
  const tokens = await QueueToken.find({ serviceId, dateKey, status: { $in: activeStatuses } })
    .populate('userId', 'name email')
    .sort({ tokenNumber: 1 });
  return {
    service: { id: service._id, name: service.name, averageMinutes: service.averageMinutes, isPaused: service.isPaused },
    tokens: tokens.map((token, index) => ({
      id: token._id,
      tokenNumber: token.tokenNumber,
      status: token.status,
      customer: token.userId ? { id: token.userId._id, name: token.userId.name } : null,
      position: token.status === 'serving' || token.status === 'called' ? 0 : index + 1,
      estimatedWaitMinutes: token.status === 'serving' || token.status === 'called' ? 0 : estimateWait(index + 1, service.averageMinutes),
      joinedAt: token.joinedAt
    }))
  };
}

async function publish(serviceId) {
  const snapshot = await queueSnapshot(serviceId);
  if (snapshot) emitQueueUpdate(serviceId.toString(), snapshot);
}

router.get('/my', requireAuth, allowRoles('customer'), async (req, res, next) => {
  try {
    const dateKey = localDateKey();
    const tokens = await QueueToken.find({ userId: req.user._id, dateKey }).populate('serviceId', 'name averageMinutes isPaused').sort({ createdAt: -1 });
    const active = tokens.filter(t => activeStatuses.includes(t.status));
    const enriched = await Promise.all(active.map(async token => {
      const ahead = await QueueToken.countDocuments({
        serviceId: token.serviceId._id, dateKey, status: { $in: ['waiting', 'called', 'serving'] },
        tokenNumber: { $lt: token.tokenNumber }
      });
      return {
        id: token._id, tokenNumber: token.tokenNumber, status: token.status, joinedAt: token.joinedAt,
        service: token.serviceId, peopleAhead: token.status === 'waiting' ? ahead : 0,
        estimatedWaitMinutes: token.status === 'waiting' ? estimateWait(ahead, token.serviceId.averageMinutes) : 0
      };
    }));
    res.json({ tokens: enriched });
  } catch (error) { next(error); }
});

router.post('/join', requireAuth, allowRoles('customer'), async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    if (!mongoose.isValidObjectId(serviceId)) return res.status(400).json({ message: 'Choose a valid service.' });
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) return res.status(404).json({ message: 'Service not found or inactive.' });
    if (service.isPaused) return res.status(409).json({ message: 'This queue is temporarily paused.' });
    const dateKey = localDateKey();
    const existing = await QueueToken.findOne({ serviceId, userId: req.user._id, dateKey, status: { $in: activeStatuses } });
    if (existing) return res.status(409).json({ message: 'You already have an active token for this service today.', token: existing });
    const counter = await TokenCounter.findOneAndUpdate(
      { serviceId, dateKey }, { $inc: { value: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const token = await QueueToken.create({ serviceId, userId: req.user._id, dateKey, tokenNumber: counter.value });
    await publish(serviceId);
    res.status(201).json({ token, message: 'You have joined the queue.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A token conflict occurred. Please try again.' });
    next(error);
  }
});

router.patch('/:id/cancel', requireAuth, allowRoles('customer'), async (req, res, next) => {
  try {
    const token = await QueueToken.findOne({ _id: req.params.id, userId: req.user._id, status: 'waiting' });
    if (!token) return res.status(404).json({ message: 'Waiting token not found. Called tokens cannot be cancelled here.' });
    token.status = 'cancelled';
    token.cancelledAt = new Date();
    await token.save();
    await publish(token.serviceId);
    res.json({ token, message: 'Token cancelled.' });
  } catch (error) { next(error); }
});

router.get('/service/:serviceId', requireAuth, allowRoles('staff', 'admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.serviceId)) return res.status(400).json({ message: 'Invalid service ID.' });
    const snapshot = await queueSnapshot(req.params.serviceId);
    if (!snapshot) return res.status(404).json({ message: 'Service not found.' });
    const dateKey = localDateKey();
    const history = await QueueToken.find({ serviceId: req.params.serviceId, dateKey }).populate('userId', 'name email').sort({ tokenNumber: 1 }).limit(100);
    res.json({
      ...snapshot,
      history: history.map(t => ({ id: t._id, tokenNumber: t.tokenNumber, status: t.status, customer: t.userId ? { name: t.userId.name, email: t.userId.email } : null, joinedAt: t.joinedAt }))
    });
  } catch (error) { next(error); }
});

router.post('/service/:serviceId/next', requireAuth, allowRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    if (service.isPaused) return res.status(409).json({ message: 'Resume the queue before calling the next token.' });
    const dateKey = localDateKey();
    // One token is advanced per request. For high-concurrency production use an atomic claim/transaction.
    const current = await QueueToken.findOne({ serviceId: service._id, dateKey, status: 'called' });
    if (current) return res.status(409).json({ message: `Token ${current.tokenNumber} is already called. Mark it served or skip it first.` });
    const nextToken = await QueueToken.findOne({ serviceId: service._id, dateKey, status: 'waiting' }).sort({ tokenNumber: 1 });
    if (!nextToken) return res.status(404).json({ message: 'There are no waiting tokens.' });
    nextToken.status = 'called';
    nextToken.calledAt = new Date();
    await nextToken.save();
    await publish(service._id);
    res.json({ token: nextToken, message: `Token ${nextToken.tokenNumber} has been called.` });
  } catch (error) { next(error); }
});

router.patch('/:id/serve', requireAuth, allowRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const token = await QueueToken.findOne({ _id: req.params.id, status: 'called' });
    if (!token) return res.status(404).json({ message: 'Called token not found.' });
    token.status = 'served';
    token.servedAt = new Date();
    await token.save();
    await publish(token.serviceId);
    res.json({ token, message: `Token ${token.tokenNumber} marked as served.` });
  } catch (error) { next(error); }
});

router.patch('/:id/skip', requireAuth, allowRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const token = await QueueToken.findOne({ _id: req.params.id, status: { $in: ['waiting', 'called'] } });
    if (!token) return res.status(404).json({ message: 'Token cannot be skipped.' });
    token.status = 'skipped';
    await token.save();
    await publish(token.serviceId);
    res.json({ token, message: `Token ${token.tokenNumber} skipped.` });
  } catch (error) { next(error); }
});

router.patch('/service/:serviceId/pause', requireAuth, allowRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    service.isPaused = Boolean(req.body.isPaused);
    await service.save();
    await publish(service._id);
    res.json({ service, message: service.isPaused ? 'Queue paused.' : 'Queue resumed.' });
  } catch (error) { next(error); }
});

export default router;
