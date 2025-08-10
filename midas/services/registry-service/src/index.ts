import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3002);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'registry-service' });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'db_unavailable' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Registry service listening on :${PORT}`);
});