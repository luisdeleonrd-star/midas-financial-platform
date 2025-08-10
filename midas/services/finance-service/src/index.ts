import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3003);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Swagger
const openapiPath = path.join(__dirname, '..', 'openapi.yml');
const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'finance-service' });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'db_unavailable' });
  }
});

// Placeholder schema init for receivables
async function ensureSchema() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  await pool.query(`CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominium_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    resident_id UUID NOT NULL,
    due_date DATE NOT NULL,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    reference TEXT
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS payment_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL
  );`);
}

ensureSchema().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Schema init failed', e);
});

// Placeholder: Accounts Receivable endpoints
app.get('/receivables', async (_req, res) => {
  res.json({ data: [] });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Finance service listening on :${PORT}`);
});