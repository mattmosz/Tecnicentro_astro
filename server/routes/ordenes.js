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

// Generar número de orden
async function generarNumeroOrden() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const prefijo = `ORD-${año}${mes}-`;
  
  const [result] = await db.execute(
    'SELECT MAX(CAST(SUBSTRING(numero_orden, 9) AS UNSIGNED)) as ultimo FROM ordenes_servicio WHERE numero_orden LIKE ?',
    [`${prefijo}%`]
  );
  
  const siguiente = (result[0].ultimo || 0) + 1;
  return `${prefijo}${String(siguiente).padStart(4, '0')}`;
}

// Crear nueva orden de servicio
router.post('/', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id_vehiculo, observaciones, servicios } = req.body;
    const id_tecnico = req.user.id;

    if (!id_vehiculo || !servicios || servicios.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehículo y servicios son requeridos' 
      });
    }

    // Generar número de orden
    const numero_orden = await generarNumeroOrden();

    // Crear la orden
    const [ordenResult] = await connection.execute(
      'INSERT INTO ordenes_servicio (numero_orden, id_vehiculo, id_tecnico, observaciones, estado) VALUES (?, ?, ?, ?, "pendiente")',
      [numero_orden, id_vehiculo, id_tecnico, observaciones || null]
    );

    const id_orden = ordenResult.insertId;

    // Agregar los servicios a la orden
    for (const servicio of servicios) {
      await connection.execute(
        'INSERT INTO detalle_ordenes (id_orden, id_servicio, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [id_orden, servicio.id_servicio, servicio.cantidad, servicio.precio_unitario]
      );
    }

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'Orden creada exitosamente', 
      numero_orden,
      id_orden 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear orden:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Obtener todas las órdenes (para administradores)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    const [ordenes] = await db.execute(`
      SELECT o.*, 
             v.marca, v.modelo, v.placa,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             u.nombre as tecnico_nombre, u.apellido as tecnico_apellido
      FROM ordenes_servicio o
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN usuarios u ON o.id_tecnico = u.id
      ORDER BY o.fecha_ingreso DESC
    `);

    res.json({ success: true, data: ordenes });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener órdenes por técnico
router.get('/mis-ordenes', verifyToken, async (req, res) => {
  try {
    const [ordenes] = await db.execute(`
      SELECT o.*, 
             v.marca, v.modelo, v.placa,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre
      FROM ordenes_servicio o
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      WHERE o.id_tecnico = ?
      ORDER BY o.fecha_ingreso DESC
    `, [req.user.id]);

    res.json({ success: true, data: ordenes });
  } catch (error) {
    console.error('Error al obtener órdenes del técnico:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener detalle de una orden
router.get('/:id/detalle', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [detalle] = await db.execute(`
      SELECT do.*, s.codigo, s.descripcion, s.tipo
      FROM detalle_ordenes do
      JOIN servicios s ON do.id_servicio = s.id
      WHERE do.id_orden = ?
      ORDER BY s.tipo, s.descripcion
    `, [id]);

    res.json({ success: true, data: detalle });
  } catch (error) {
    console.error('Error al obtener detalle de orden:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
