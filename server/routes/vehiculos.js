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

// Obtener todos los vehículos con paginación y búsqueda
router.get('/', verifyToken, async (req, res) => {
  try {
    const { buscar, limite = 50, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;
    
    let query = `
      SELECT v.*, 
        c.nombres, c.apellidos, c.razon_social, c.tipo as cliente_tipo,
        m.nombre_modelo
      FROM vehiculos v 
      JOIN clientes c ON v.id_cliente = c.id 
      LEFT JOIN modelos_vehiculo m ON v.id_modelo = m.id
      WHERE 1=1
    `;
    let params = [];
    
    if (buscar) {
      query += ` AND (
        v.placa LIKE ? OR 
        v.marca LIKE ? OR 
        c.nombres LIKE ? OR 
        c.apellidos LIKE ? OR 
        c.razon_social LIKE ? OR
        m.nombre_modelo LIKE ?
      )`;
      const searchTerm = `%${buscar}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    query += ' ORDER BY v.placa LIMIT ? OFFSET ?';
    params.push(parseInt(limite), parseInt(offset));
    
    const [vehiculos] = await db.execute(query, params);
    
    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM vehiculos v 
      JOIN clientes c ON v.id_cliente = c.id 
      LEFT JOIN modelos_vehiculo m ON v.id_modelo = m.id
      WHERE 1=1
    `;
    let countParams = [];
    if (buscar) {
      countQuery += ` AND (
        v.placa LIKE ? OR 
        v.marca LIKE ? OR 
        c.nombres LIKE ? OR 
        c.apellidos LIKE ? OR 
        c.razon_social LIKE ? OR
        m.nombre_modelo LIKE ?
      )`;
      const searchTerm = `%${buscar}%`;
      countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    const [count] = await db.execute(countQuery, countParams);
    
    res.json({ 
      success: true, 
      data: vehiculos,
      pagination: {
        total: count[0].total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(count[0].total / limite)
      }
    });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener un vehículo por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [vehiculos] = await db.execute(`
      SELECT v.*, 
        c.nombres, c.apellidos, c.razon_social, c.tipo as cliente_tipo,
        m.nombre_modelo
      FROM vehiculos v 
      JOIN clientes c ON v.id_cliente = c.id 
      LEFT JOIN modelos_vehiculo m ON v.id_modelo = m.id
      WHERE v.id = ?
    `, [id]);
    
    if (vehiculos.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }
    
    res.json({ success: true, data: vehiculos[0] });
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nuevo vehículo
router.post('/', verifyToken, async (req, res) => {
  try {
    const { id_cliente, marca, placa, kilometraje, id_modelo } = req.body;

    if (!id_cliente || !marca || !placa) {
      return res.status(400).json({ success: false, message: 'Cliente, marca y placa son requeridos' });
    }

    // Verificar si ya existe un vehículo con esa placa
    const [existing] = await db.execute('SELECT id FROM vehiculos WHERE placa = ?', [placa]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya existe un vehículo con esa placa' });
    }

    // Verificar que el cliente existe
    const [cliente] = await db.execute('SELECT id FROM clientes WHERE id = ? AND estado = "activo"', [id_cliente]);
    if (cliente.length === 0) {
      return res.status(400).json({ success: false, message: 'Cliente no encontrado o inactivo' });
    }

    const [result] = await db.execute(
      'INSERT INTO vehiculos (id_cliente, marca, placa, kilometraje, id_modelo) VALUES (?, ?, ?, ?, ?)',
      [id_cliente, marca, placa, kilometraje || '0', id_modelo || null]
    );

    res.json({ success: true, message: 'Vehículo creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar vehículo
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_cliente, marca, placa, kilometraje, id_modelo } = req.body;

    if (!id_cliente || !marca || !placa) {
      return res.status(400).json({ success: false, message: 'Cliente, marca y placa son requeridos' });
    }

    // Verificar si el vehículo existe
    const [existing] = await db.execute('SELECT id FROM vehiculos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }

    // Verificar si la placa ya existe en otro vehículo
    const [duplicate] = await db.execute('SELECT id FROM vehiculos WHERE placa = ? AND id != ?', [placa, id]);
    if (duplicate.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya existe otro vehículo con esa placa' });
    }

    // Verificar que el cliente existe
    const [cliente] = await db.execute('SELECT id FROM clientes WHERE id = ? AND estado = "activo"', [id_cliente]);
    if (cliente.length === 0) {
      return res.status(400).json({ success: false, message: 'Cliente no encontrado o inactivo' });
    }

    await db.execute(
      'UPDATE vehiculos SET id_cliente = ?, marca = ?, placa = ?, kilometraje = ?, id_modelo = ? WHERE id = ?',
      [id_cliente, marca, placa, kilometraje || '0', id_modelo || null, id]
    );

    res.json({ success: true, message: 'Vehículo actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar vehículo
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el vehículo existe
    const [existing] = await db.execute('SELECT id FROM vehiculos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }

    // Verificar si el vehículo tiene órdenes de servicio asociadas
    const [ordenes] = await db.execute('SELECT COUNT(*) as total FROM ordenes_servicio WHERE id_vehiculo = ?', [id]);
    if (ordenes[0].total > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el vehículo porque tiene órdenes de servicio asociadas' 
      });
    }

    await db.execute('DELETE FROM vehiculos WHERE id = ?', [id]);

    res.json({ success: true, message: 'Vehículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Buscar vehículos por término
router.get('/buscar/:termino', verifyToken, async (req, res) => {
  try {
    const { termino } = req.params;
    const searchTerm = `%${termino}%`;
    
    const [vehiculos] = await db.execute(`
      SELECT v.*, 
        c.nombres, c.apellidos, c.razon_social, c.tipo as cliente_tipo,
        m.nombre_modelo
      FROM vehiculos v 
      JOIN clientes c ON v.id_cliente = c.id 
      LEFT JOIN modelos_vehiculo m ON v.id_modelo = m.id
      WHERE v.placa LIKE ? OR 
        v.marca LIKE ? OR 
        c.nombres LIKE ? OR 
        c.apellidos LIKE ? OR 
        c.razon_social LIKE ? OR
        m.nombre_modelo LIKE ?
      ORDER BY v.placa
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
    
    res.json({ success: true, data: vehiculos });
  } catch (error) {
    console.error('Error al buscar vehículos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener clientes para el select
router.get('/data/clientes', verifyToken, async (req, res) => {
  try {
    const [clientes] = await db.execute(`
      SELECT id, tipo, nombres, apellidos, razon_social 
      FROM clientes 
      WHERE estado = 'activo' 
      ORDER BY nombres, apellidos, razon_social
    `);
    
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener modelos para el select
router.get('/data/modelos', verifyToken, async (req, res) => {
  try {
    const [modelos] = await db.execute(`
      SELECT id, nombre_modelo 
      FROM modelos_vehiculo 
      ORDER BY nombre_modelo
    `);
    
    res.json({ success: true, data: modelos });
  } catch (error) {
    console.error('Error al obtener modelos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
