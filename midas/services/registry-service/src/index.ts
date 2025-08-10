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

const PORT = Number(process.env.PORT || 3002);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Swagger
const openapiPath = path.join(__dirname, '..', 'openapi.yml');
const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

async function ensureSchema() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  await pool.query(`CREATE TABLE IF NOT EXISTS condominiums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'DOP',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS towers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tower_id UUID NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    owner_name TEXT,
    owner_email TEXT
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT
  );`);
}

ensureSchema().catch((e) => console.error('registry schema init failed', e));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'registry-service' });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'db_unavailable' });
  }
});

app.post('/condominiums', async (req, res) => {
  const { name, currency } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name_required' });
  try {
    const result = await pool.query(
      'INSERT INTO condominiums(name, currency) VALUES($1, $2) RETURNING id, name, currency, created_at',
      [name, currency || 'DOP']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'create_failed' });
  }
});

app.get('/condominiums', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, currency, created_at FROM condominiums ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (e) {
    res.status(500).json({ error: 'list_failed' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Registry service listening on :${PORT}`);
});