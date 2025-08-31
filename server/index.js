import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la RAÍZ
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import vehiculosRoutes from './routes/vehiculos.js';
import serviciosRoutes from './routes/servicios.js';
import ordenesRoutes from './routes/ordenes.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:4321','http://localhost:4322','http://localhost:4323'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Log de depuración para /api/auth
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/auth')) {
    console.log(`[${req.method}] ${req.path}`, { body: req.body });
  }
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/admin', adminRoutes);

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Servidor del taller funcionando correctamente' });
});

// DB test
app.get('/api/test-db', async (_req, res) => {
  try {
    const db = (await import('./config/database.js')).default;
    const [rows] = await db.execute('SELECT 1 AS test');
    res.json({ status: 'OK', test: rows[0] });
  } catch (error) {
    console.error('Error conectando a la BD:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log('JWT_SECRET presente:', Boolean(process.env.JWT_SECRET));
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
