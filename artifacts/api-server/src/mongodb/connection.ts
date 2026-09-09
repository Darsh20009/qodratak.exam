import mongoose from 'mongoose';

let isConnected = false;
let connectionListenersRegistered = false;

function registerConnectionListeners(): void {
  if (connectionListenersRegistered) return;
  connectionListenersRegistered = true;

  mongoose.connection.on('connected', () => {
    isConnected = true;
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
  });
}

export async function connectToMongoDB(): Promise<boolean> {
  if (getConnectionStatus()) {
    console.log('📦 MongoDB-backed storage is already active');
    return true;
  }

  registerConnectionListeners();

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
    console.log(`✅ MongoDB-backed storage active (database: ${mongoose.connection.name})`);

    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
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
