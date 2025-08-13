import express from 'express';
import db from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware para verificar token
const verifyToken = (req, res, next) => {
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

// Obtener todos los servicios
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tipo } = req.query;
    let query = 'SELECT * FROM servicios ORDER BY tipo, descripcion';
    let params = [];

    if (tipo) {
      query = 'SELECT * FROM servicios WHERE tipo = ? ORDER BY descripcion';
      params = [tipo];
    }

    const [servicios] = await db.execute(query, params);
    res.json({ success: true, data: servicios });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Buscar servicios por descripción o código
router.get('/buscar/:termino', verifyToken, async (req, res) => {
  try {
    const { termino } = req.params;
    const [servicios] = await db.execute(
      'SELECT * FROM servicios WHERE codigo LIKE ? OR descripcion LIKE ? ORDER BY tipo, descripcion',
      [`%${termino}%`, `%${termino}%`]
    );
    res.json({ success: true, data: servicios });
  } catch (error) {
    console.error('Error al buscar servicios:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener servicios por tipo (para técnicos)
router.get('/tipo/:tipo', verifyToken, async (req, res) => {
  try {
    const { tipo } = req.params;
    const [servicios] = await db.execute(
      'SELECT * FROM servicios WHERE tipo = ? ORDER BY descripcion',
      [tipo]
    );
    res.json({ success: true, data: servicios });
  } catch (error) {
    console.error('Error al obtener servicios por tipo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
