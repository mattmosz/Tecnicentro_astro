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

// Obtener técnicos disponibles
router.get('/tecnicos', verifyToken, async (req, res) => {
  try {
    const [tecnicos] = await db.execute(`
      SELECT id, nombre, apellido, usuario
      FROM usuarios 
      WHERE rol = 'tecnico' AND estado = 'activo'
      ORDER BY nombre, apellido
    `);
    
    res.json({ success: true, data: tecnicos });
  } catch (error) {
    console.error('Error al obtener técnicos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nueva orden de servicio
router.post('/', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id_vehiculo, id_tecnico, observaciones, servicios } = req.body;

    if (!id_vehiculo || !servicios || servicios.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehículo y servicios son requeridos' 
      });
    }

    // Generar número de orden
    const numero_orden = await generarNumeroOrden();

    // Para admin, usar el técnico asignado, para técnico usar su propio ID
    const tecnico_asignado = req.user.rol === 'admin' ? (id_tecnico || null) : req.user.id;

    // Crear la orden
    const [ordenResult] = await connection.execute(
      'INSERT INTO ordenes_servicio (numero_orden, id_vehiculo, id_tecnico, observaciones, estado) VALUES (?, ?, ?, ?, "pendiente")',
      [numero_orden, id_vehiculo, tecnico_asignado, observaciones || null]
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

    const { limit } = req.query;
    let query = `
      SELECT o.*, 
             v.marca, v.placa,
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
    `;

    if (limit && !isNaN(parseInt(limit))) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const [ordenes] = await db.execute(query);

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
             v.marca, v.placa,
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

// Obtener una orden específica por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ordenes] = await db.execute(`
      SELECT o.*, 
             v.marca, v.placa, v.id_cliente,
             CASE 
               WHEN c.tipo = 'particular' THEN CONCAT(c.nombres, ' ', c.apellidos)
               ELSE c.razon_social
             END as cliente_nombre,
             u.nombre as tecnico_nombre, u.apellido as tecnico_apellido
      FROM ordenes_servicio o
      JOIN vehiculos v ON o.id_vehiculo = v.id
      JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN usuarios u ON o.id_tecnico = u.id
      WHERE o.id = ?
    `, [id]);

    if (ordenes.length === 0) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    // Obtener también el detalle de servicios
    const [detalle] = await db.execute(`
      SELECT do.*, s.codigo, s.descripcion, s.tipo
      FROM detalle_ordenes do
      JOIN servicios s ON do.id_servicio = s.id
      WHERE do.id_orden = ?
    `, [id]);

    // Calcular totales basados en los servicios
    const subtotal = detalle.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    const iva = subtotal * 0.15; // 15% IVA
    const total = subtotal + iva;

    const orden = ordenes[0];
    orden.vehiculo_marca = orden.marca;
    orden.vehiculo_placa = orden.placa;
    orden.subtotal = subtotal;
    orden.iva = iva;
    orden.total = total;
    orden.servicios = detalle;

    res.json({ success: true, data: orden });
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar una orden
router.put('/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { id_vehiculo, id_tecnico, observaciones, estado, servicios } = req.body;

    // Verificar que la orden existe
    const [existingOrder] = await connection.execute('SELECT id FROM ordenes_servicio WHERE id = ?', [id]);
    if (existingOrder.length === 0) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    // Actualizar la orden principal
    const updateFields = [];
    const updateValues = [];

    if (id_vehiculo !== undefined) {
      updateFields.push('id_vehiculo = ?');
      updateValues.push(id_vehiculo);
    }
    if (id_tecnico !== undefined) {
      updateFields.push('id_tecnico = ?');
      updateValues.push(id_tecnico);
    }
    if (observaciones !== undefined) {
      updateFields.push('observaciones = ?');
      updateValues.push(observaciones);
    }
    if (estado !== undefined) {
      updateFields.push('estado = ?');
      updateValues.push(estado);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.execute(
        `UPDATE ordenes_servicio SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Si se proporcionan servicios, actualizar el detalle
    if (servicios && Array.isArray(servicios)) {
      // Eliminar detalles existentes
      await connection.execute('DELETE FROM detalle_ordenes WHERE id_orden = ?', [id]);
      
      // Agregar nuevos detalles
      for (const servicio of servicios) {
        await connection.execute(
          'INSERT INTO detalle_ordenes (id_orden, id_servicio, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [id, servicio.id_servicio, servicio.cantidad, servicio.precio_unitario]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Orden actualizada exitosamente' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// Eliminar una orden
router.delete('/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Verificar que la orden existe
    const [existingOrder] = await connection.execute('SELECT id FROM ordenes_servicio WHERE id = ?', [id]);
    if (existingOrder.length === 0) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    // Verificar que no esté facturada
    const [orderStatus] = await connection.execute('SELECT estado FROM ordenes_servicio WHERE id = ?', [id]);
    if (orderStatus[0].estado === 'facturada') {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar una orden que ya está facturada' 
      });
    }

    // Eliminar detalles de la orden (se hace automáticamente por CASCADE, pero por seguridad)
    await connection.execute('DELETE FROM detalle_ordenes WHERE id_orden = ?', [id]);
    
    // Eliminar la orden
    await connection.execute('DELETE FROM ordenes_servicio WHERE id = ?', [id]);

    await connection.commit();
    res.json({ success: true, message: 'Orden eliminada exitosamente' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

export default router;