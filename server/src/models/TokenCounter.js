import mongoose from 'mongoose';

const tokenCounterSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  dateKey: { type: String, required: true },
  value: { type: Number, default: 0 }
});
tokenCounterSchema.index({ serviceId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model('TokenCounter', tokenCounterSchema);
