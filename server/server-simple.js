import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Health check simple
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor del taller funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
