import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Service from './models/Service.js';

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Configure MONGODB_URI and JWT_SECRET in server/.env first.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const passwordHash = await bcrypt.hash('QueueLess123!', 12);

for (const user of [
  { name: 'QueueLess Admin', email: 'admin@queueless.local', role: 'admin' },
  { name: 'Demo Staff', email: 'staff@queueless.local', role: 'staff' },
  { name: 'Demo Customer', email: 'customer@queueless.local', role: 'customer' }
]) {
  await User.updateOne({ email: user.email }, { $set: { ...user, passwordHash } }, { upsert: true });
}

for (const service of [
  { name: 'Document Verification', description: 'Submit and verify documents.', averageMinutes: 6 },
  { name: 'Fee Payment', description: 'Fee and payment support.', averageMinutes: 4 },
  { name: 'General Enquiry', description: 'Questions and general assistance.', averageMinutes: 3 }
]) {
  await Service.updateOne({ name: service.name }, { $setOnInsert: service }, { upsert: true });
}

console.log('Seed complete. Demo accounts use password: QueueLess123!');
await mongoose.disconnect();
