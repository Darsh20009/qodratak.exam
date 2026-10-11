import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { User } from '../../src/mongodb/models';

// Temporary, notification-disabled account for protected UI verification.
// Credentials stay in /tmp; never use this helper against a production runtime.
const file = '/tmp/qodratak-student-ui-fixture.json';
if (process.env.NODE_ENV === 'production') throw new Error('Development verification only');
if (!process.env.MONGODB_URI) throw new Error('MongoDB is not configured');
await mongoose.connect(process.env.MONGODB_URI);
try {
  if (process.argv.includes('--cleanup')) {
    const fixture = JSON.parse(await fs.readFile(file, 'utf8'));
    if (!/^uihub-[0-9a-f-]+$/.test(fixture.username)) throw new Error('Not a temporary UI fixture');
    const user = await User.findOne({ _id: fixture.id, username: fixture.username });
    if (user) {
      if (!user.email?.endsWith('@example.invalid') || user.fullName !== 'طالب اختبار الواجهة') {
        throw new Error('Fixture ownership check failed');
      }
      const db = mongoose.connection.db!;
      const ids = [String(user._id), user._id];
      for (const collection of await db.listCollections().toArray()) {
        if (collection.name === User.collection.name) continue;
        await db.collection(collection.name).deleteMany({ $or: [
          { userId: { $in: ids } }, { studentId: { $in: ids } },
        ] });
      }
      await User.deleteOne({ _id: user._id, username: fixture.username });
    }
    await fs.unlink(file);
    console.log('Temporary student fixture removed');
  } else {
    const username = `uihub-${crypto.randomUUID()}`;
    const password = `Fixture!${crypto.randomBytes(18).toString('hex')}`;
    const now = new Date();
    const end = new Date(now.getTime() + 3 * 86_400_000);
    const user = await User.create({
      username, email: `${username}@example.invalid`, fullName: 'طالب اختبار الواجهة',
      password: await bcrypt.hash(password, 10), role: 'student',
      isActive: true, isVerified: true, emailVerified: true,
      notifWhatsApp: false, notifEmail: false, notifWeeklyReport: false,
      trialUsed: true, trialStartDate: now, trialEndDate: end,
      subscription: { type: 'trial', status: 'active', startDate: now.toISOString(), endDate: end.toISOString() },
    });
    await fs.writeFile(file, JSON.stringify({
      id: String(user._id), username, email: user.email, password,
      loginEndpoint: '/api/auth/login', loginIdentifier: username,
    }), { mode: 0o600 });
    console.log('Temporary student fixture prepared at /tmp/qodratak-student-ui-fixture.json');
  }
} finally {
  await mongoose.disconnect();
}
