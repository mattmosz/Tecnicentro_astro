import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import vehiculosRoutes from './routes/vehiculos.js';
import serviciosRoutes from './routes/servicios.js';
import ordenesRoutes from './routes/ordenes.js';
import facturasRoutes from './routes/facturas.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:4321', 'http://localhost:4322', 'http://localhost:4323'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/facturas', facturasRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor del taller funcionando correctamente' });
});

// Database connection test
app.get('/api/test-db', async (req, res) => {
  try {
    const db = await import('./config/database.js');
    const [rows] = await db.default.execute('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      message: 'Conexión a base de datos exitosa',
      test: rows[0]
    });
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Error conectando a la base de datos',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
