import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3001);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY as string;
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'auth-service' });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'db_unavailable' });
  }
});

app.get('/.well-known/jwks.json', (_req, res) => {
  // For brevity, serve raw PEM public key in simple shape
  res.json({ keys: [{ kid: 'midas-default', kty: 'RSA', alg: 'RS256', use: 'sig', pem: JWT_PUBLIC_KEY }] });
});

app.post('/signup', async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_password_required' });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        roles TEXT[] NOT NULL DEFAULT ARRAY['resident']::TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );`
    );
    const result = await pool.query(
      'INSERT INTO users(email, password_hash, roles) VALUES($1, $2, $3) RETURNING id, email, roles',
      [email, passwordHash, role ? [role] : ['resident']]
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'email_exists' });
    res.status(500).json({ error: 'signup_failed' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_password_required' });
  try {
    const result = await pool.query('SELECT id, email, password_hash, roles FROM users WHERE email=$1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'invalid_credentials' });
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = jwt.sign({ sub: user.id, email: user.email, roles: user.roles }, JWT_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn: JWT_EXPIRES_IN as any,
      keyid: 'midas-default',
    } as jwt.SignOptions);
    res.json({ access_token: token, token_type: 'Bearer', expires_in: JWT_EXPIRES_IN });
  } catch (e) {
    res.status(500).json({ error: 'login_failed' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth service listening on :${PORT}`);
});