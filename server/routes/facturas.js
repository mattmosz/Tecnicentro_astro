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

// Middleware para verificar que sea admin
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  next();
};

// Generar número de factura
async function generarNumeroFactura() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const prefijo = `FAC-${año}${mes}-`;
  
  const [result] = await db.execute(
    'SELECT MAX(CAST(SUBSTRING(numero_factura, 9) AS UNSIGNED)) as ultimo FROM facturas WHERE numero_factura LIKE ?',
    [`${prefijo}%`]
  );
  
  const siguiente = (result[0].ultimo || 0) + 1;
  return `${prefijo}${String(siguiente).padStart(4, '0')}`;
}

// Crear factura desde una orden
router.post('/desde-orden/:ordenId', verifyToken, requireAdmin, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { ordenId } = req.params;
    const { tipo_factura } = req.body;

    // Verificar que la orden existe y no esté ya facturada
    const [orden] = await connection.execute(`
      SELECT o.*, v.id_cliente, c.tipo as tipo_cliente
      FROM ordenes_servicio o
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      WHERE o.id = ? AND o.estado = 'pendiente'
    `, [ordenId]);

    if (orden.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Orden no encontrada o ya facturada' 
      });
    }

    // Obtener detalles de la orden
    const [detalles] = await connection.execute(`
      SELECT do.*, s.descripcion
      FROM detalle_ordenes do
      JOIN servicios s ON do.id_servicio = s.id
      WHERE do.id_orden = ?
    `, [ordenId]);

    if (detalles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'La orden no tiene servicios asociados' 
      });
    }

    // Calcular totales
    const subtotal = detalles.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const iva = subtotal * 0.15; // 15% IVA
    const total = subtotal + iva;

    // Generar número de factura
    const numero_factura = await generarNumeroFactura();

    // Crear la factura
    const [facturaResult] = await connection.execute(
      'INSERT INTO facturas (numero_factura, id_orden, tipo_cliente, tipo_factura, subtotal, iva, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [numero_factura, ordenId, orden[0].tipo_cliente, tipo_factura || 'general', subtotal, iva, total]
    );

    const id_factura = facturaResult.insertId;

    // Agregar detalles de la factura
    for (const detalle of detalles) {
      await connection.execute(
        'INSERT INTO detalle_facturas (id_factura, descripcion, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [id_factura, detalle.descripcion, detalle.cantidad, detalle.precio_unitario]
      );
    }

    // Actualizar estado de la orden
    await connection.execute(
      'UPDATE ordenes_servicio SET estado = "facturada" WHERE id = ?',
      [ordenId]
    );

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'Factura creada exitosamente', 
      numero_factura,
      id_factura,
      total
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear factura:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Obtener todas las facturas
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [facturas] = await db.execute(`
      SELECT f.*, 
             v.marca, v.placa,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             c.identificacion
      FROM facturas f
      JOIN ordenes_servicio o ON f.id_orden = o.id
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      ORDER BY f.fecha_emision DESC
    `);

    res.json({ success: true, data: facturas });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener detalle de una factura
router.get('/:id/detalle', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [detalle] = await db.execute(`
      SELECT df.*
      FROM detalle_facturas df
      WHERE df.id_factura = ?
      ORDER BY df.descripcion
    `, [id]);

    res.json({ success: true, data: detalle });
  } catch (error) {
    console.error('Error al obtener detalle de factura:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener KPIs de facturación
router.get('/kpis', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Verificar si la tabla facturas existe y crearla si no existe
    await db.execute(`
      CREATE TABLE IF NOT EXISTS facturas (
        id int(11) NOT NULL AUTO_INCREMENT,
        numero_factura varchar(25) NOT NULL,
        id_orden int(11) NOT NULL,
        tipo_cliente enum('particular','institucion') NOT NULL,
        tipo_factura enum('general','mano_obra','repuestos','lubricantes') DEFAULT 'general',
        fecha_emision datetime DEFAULT current_timestamp(),
        subtotal decimal(10,2) NOT NULL,
        iva decimal(10,2) NOT NULL,
        total decimal(10,2) NOT NULL,
        archivo_xml text DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY numero_factura (numero_factura),
        KEY id_orden (id_orden),
        CONSTRAINT facturas_ibfk_1 FOREIGN KEY (id_orden) REFERENCES ordenes_servicio (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Crear tabla detalle_facturas si no existe
    await db.execute(`
      CREATE TABLE IF NOT EXISTS detalle_facturas (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_factura int(11) NOT NULL,
        descripcion varchar(255) NOT NULL,
        cantidad int(11) NOT NULL,
        precio_unitario decimal(10,2) NOT NULL,
        PRIMARY KEY (id),
        KEY id_factura (id_factura),
        CONSTRAINT detalle_facturas_ibfk_1 FOREIGN KEY (id_factura) REFERENCES facturas (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Ventas de hoy
    const [hoy] = await db.execute(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM facturas 
      WHERE DATE(fecha_emision) = CURDATE()
    `);

    // Ventas del mes actual
    const [mes] = await db.execute(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM facturas 
      WHERE YEAR(fecha_emision) = YEAR(CURDATE()) 
      AND MONTH(fecha_emision) = MONTH(CURDATE())
    `);

    // Número total de facturas del mes
    const [num] = await db.execute(`
      SELECT COUNT(*) as count
      FROM facturas 
      WHERE YEAR(fecha_emision) = YEAR(CURDATE()) 
      AND MONTH(fecha_emision) = MONTH(CURDATE())
    `);

    res.json({ 
      success: true, 
      data: {
        hoy: parseFloat(hoy[0].total),
        mes: parseFloat(mes[0].total),
        num: parseInt(num[0].count)
      }
    });
  } catch (error) {
    console.error('Error al obtener KPIs:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener órdenes pendientes de facturación
router.get('/ordenes-pendientes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [ordenes] = await db.execute(`
      SELECT o.id, o.fecha_ingreso, 
             COALESCE(SUM(do.subtotal), 0) as subtotal,
             COALESCE(SUM(do.subtotal), 0) * 0.15 as iva,
             COALESCE(SUM(do.subtotal), 0) * 1.15 as total,
             v.marca, v.placa,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             c.identificacion,
             COUNT(do.id) as num_servicios
      FROM ordenes_servicio o
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN detalle_ordenes do ON o.id = do.id_orden
      WHERE o.estado = 'pendiente'
      GROUP BY o.id, o.fecha_ingreso, v.marca, v.placa, c.tipo, c.nombres, c.apellidos, c.razon_social, c.identificacion
      ORDER BY o.fecha_ingreso DESC
    `);

    res.json({ success: true, data: ordenes });
  } catch (error) {
    console.error('Error al obtener órdenes pendientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
