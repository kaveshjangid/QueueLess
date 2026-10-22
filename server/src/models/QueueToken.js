import mongoose from 'mongoose';

const queueTokenSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true, index: true },
  tokenNumber: { type: Number, required: true },
  status: { type: String, enum: ['waiting', 'called', 'serving', 'served', 'skipped', 'cancelled'], default: 'waiting', index: true },
  joinedAt: { type: Date, default: Date.now },
  calledAt: Date,
  servedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

queueTokenSchema.index({ serviceId: 1, dateKey: 1, tokenNumber: 1 }, { unique: true });
queueTokenSchema.index({ serviceId: 1, userId: 1, dateKey: 1, status: 1 });

export default mongoose.model('QueueToken', queueTokenSchema);
