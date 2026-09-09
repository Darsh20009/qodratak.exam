import mongoose from 'mongoose';

let isConnected = false;

export async function connectToMongoDB(): Promise<boolean> {
  if (isConnected) {
    console.log('📦 Already connected to MongoDB');
    return true;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production; refusing to start without persistent database storage.');
    }
    console.warn('⚠️ MONGODB_URI not set - using in-memory storage as fallback');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return false;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  }
}
