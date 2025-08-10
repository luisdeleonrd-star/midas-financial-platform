import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = Number(process.env.PORT || 8080);
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;

if (!JWT_PUBLIC_KEY) {
  // eslint-disable-next-line no-console
  console.warn('JWT_PUBLIC_KEY is not set. Requests will be treated as anonymous.');
}

function verifyJwtMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!JWT_PUBLIC_KEY) return next();
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing bearer token' });
  const token = authHeader.substring('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Basic RBAC check via claim "roles"
function requireRole(role: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const roles: string[] = user?.roles || [];
    if (!roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Proxy config
const targets = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  registry: process.env.REGISTRY_SERVICE_URL || 'http://localhost:3002',
  finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
  billing: process.env.BILLING_SERVICE_URL || 'http://localhost:3004',
  messaging: process.env.MESSAGING_SERVICE_URL || 'http://localhost:3005',
  reporting: process.env.REPORTING_SERVICE_URL || 'http://localhost:3006',
};

app.use('/auth', createProxyMiddleware({ target: targets.auth, changeOrigin: true, pathRewrite: { '^/auth': '' } }));
app.use('/registry', verifyJwtMiddleware, createProxyMiddleware({ target: targets.registry, changeOrigin: true, pathRewrite: { '^/registry': '' } }));
app.use('/finance', verifyJwtMiddleware, createProxyMiddleware({ target: targets.finance, changeOrigin: true, pathRewrite: { '^/finance': '' } }));
app.use('/billing', verifyJwtMiddleware, createProxyMiddleware({ target: targets.billing, changeOrigin: true, pathRewrite: { '^/billing': '' } }));
app.use('/messaging', verifyJwtMiddleware, createProxyMiddleware({ target: targets.messaging, changeOrigin: true, pathRewrite: { '^/messaging': '' } }));
app.use('/reporting', verifyJwtMiddleware, requireRole('admin'), createProxyMiddleware({ target: targets.reporting, changeOrigin: true, pathRewrite: { '^/reporting': '' } }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on :${PORT}`);
});