import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';

// Test database connection
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncup_test';
  await mongoose.connect(mongoUri);
  console.log('✅ Test database connected');
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.connection.close();
  console.log('✅ Test database disconnected');
});
