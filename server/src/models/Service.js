import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 300 },
  averageMinutes: { type: Number, default: 5, min: 1, max: 120 },
  isActive: { type: Boolean, default: true },
  isPaused: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);
