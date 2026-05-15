import mongoose from 'mongoose';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

export async function connectDB(): Promise<void> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGO_URI);
      logger.info('MongoDB connected');
      return;
    } catch (error) {
      attempt += 1;
      logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`, { error });
      if (attempt >= MAX_RETRIES) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
