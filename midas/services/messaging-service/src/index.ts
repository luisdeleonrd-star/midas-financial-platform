import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3005);
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.get('/health', async (_req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', service: 'messaging-service' });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'redis_unavailable' });
  }
});

app.post('/whatsapp/send', async (req, res) => {
  // Placeholder for WhatsApp Business API integration
  res.json({ queued: true });
});

app.post('/email/send', async (req, res) => {
  // Placeholder for email provider integration
  res.json({ queued: true });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Messaging service listening on :${PORT}`);
});