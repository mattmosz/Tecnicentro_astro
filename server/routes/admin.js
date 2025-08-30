import express from 'express';
import db from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware para verificar token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// GET /api/admin/stats - Estadísticas del dashboard
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    // Contar clientes activos
    const [clientesResult] = await db.execute('SELECT COUNT(*) as total FROM clientes WHERE estado = "activo"');
    
    // Contar vehículos
    const [vehiculosResult] = await db.execute('SELECT COUNT(*) as total FROM vehiculos');

    const stats = {
      clientes: clientesResult[0].total,
      vehiculos: vehiculosResult[0].total,
      ordenesActivas: 0, // Por ahora 0 hasta crear la tabla
      facturacionHoy: 0  // Por ahora 0 hasta crear la tabla
    };

    res.json(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor'
    });
  }
});

export default router;
