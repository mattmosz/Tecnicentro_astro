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

// Obtener todos los clientes
router.get('/', verifyToken, async (req, res) => {
  try {
    const [clientes] = await db.execute('SELECT * FROM clientes WHERE estado = "activo" ORDER BY nombres, apellidos, razon_social');
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nuevo cliente
router.post('/', verifyToken, async (req, res) => {
  try {
    const { tipo, identificacion, nombres, apellidos, razon_social, telefono, correo, direccion } = req.body;

    if (!tipo || !identificacion) {
      return res.status(400).json({ success: false, message: 'Tipo e identificación son requeridos' });
    }

    // Verificar si ya existe un cliente con esa identificación
    const [existing] = await db.execute('SELECT id FROM clientes WHERE identificacion = ?', [identificacion]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya existe un cliente con esa identificación' });
    }

    const [result] = await db.execute(
      'INSERT INTO clientes (tipo, identificacion, nombres, apellidos, razon_social, telefono, correo, direccion, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "activo")',
      [tipo, identificacion, nombres || null, apellidos || null, razon_social || null, telefono || null, correo || null, direccion || null]
    );

    res.json({ success: true, message: 'Cliente creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
