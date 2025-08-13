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

// Obtener vehículos por cliente
router.get('/cliente/:clienteId', verifyToken, async (req, res) => {
  try {
    const { clienteId } = req.params;
    const [vehiculos] = await db.execute(
      'SELECT v.*, c.nombres, c.apellidos, c.razon_social FROM vehiculos v JOIN clientes c ON v.id_cliente = c.id WHERE v.id_cliente = ?',
      [clienteId]
    );
    res.json({ success: true, data: vehiculos });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nuevo vehículo
router.post('/', verifyToken, async (req, res) => {
  try {
    const { id_cliente, marca, modelo, placa, kilometraje } = req.body;

    if (!id_cliente || !marca || !modelo || !placa) {
      return res.status(400).json({ success: false, message: 'Cliente, marca, modelo y placa son requeridos' });
    }

    // Verificar si ya existe un vehículo con esa placa
    const [existing] = await db.execute('SELECT id FROM vehiculos WHERE placa = ?', [placa]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya existe un vehículo con esa placa' });
    }

    const [result] = await db.execute(
      'INSERT INTO vehiculos (id_cliente, marca, modelo, placa, kilometraje) VALUES (?, ?, ?, ?, ?)',
      [id_cliente, marca, modelo, placa, kilometraje || 0]
    );

    res.json({ success: true, message: 'Vehículo creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Buscar vehículo por placa
router.get('/buscar/:placa', verifyToken, async (req, res) => {
  try {
    const { placa } = req.params;
    const [vehiculos] = await db.execute(
      `SELECT v.*, 
              CASE 
                WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
                ELSE c.razon_social
              END as cliente_nombre,
              c.identificacion, c.telefono, c.correo
       FROM vehiculos v 
       JOIN clientes c ON v.id_cliente = c.id 
       WHERE v.placa LIKE ? AND c.estado = 'activo'`,
      [`%${placa}%`]
    );
    res.json({ success: true, data: vehiculos });
  } catch (error) {
    console.error('Error al buscar vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
