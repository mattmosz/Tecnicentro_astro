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

// Obtener todos los vehículos
router.get('/', verifyToken, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT v.*, 
             CASE 
               WHEN c.nombres IS NOT NULL THEN CONCAT(c.nombres, ' ', COALESCE(c.apellidos, ''))
               WHEN c.razon_social IS NOT NULL THEN c.razon_social
               ELSE 'Sin cliente'
             END as cliente_nombre
      FROM vehiculos v
      LEFT JOIN clientes c ON v.id_cliente = c.id
    `;
    let params = [];
    
    if (q && q.trim()) {
      query += ` WHERE (
        v.placa LIKE ? OR 
        v.marca LIKE ? OR 
        c.nombres LIKE ? OR 
        c.apellidos LIKE ? OR
        c.razon_social LIKE ?
      )`;
      const searchTerm = `%${q.trim()}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    query += ' ORDER BY v.placa LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [vehiculos] = await db.execute(query, params);
    
    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM vehiculos v LEFT JOIN clientes c ON v.id_cliente = c.id';
    let countParams = [];
    if (q && q.trim()) {
      countQuery += ` WHERE (
        v.placa LIKE ? OR 
        v.marca LIKE ? OR 
        c.nombres LIKE ? OR 
        c.apellidos LIKE ? OR
        c.razon_social LIKE ?
      )`;
      const searchTerm = `%${q.trim()}%`;
      countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({ 
      success: true,
      items: vehiculos,
      total: total
    });
    
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener vehículos por cliente
router.get('/cliente/:id_cliente', verifyToken, async (req, res) => {
  try {
    const { id_cliente } = req.params;
    
    const [vehiculos] = await db.execute(`
      SELECT v.*, 
             CASE 
               WHEN c.nombres IS NOT NULL THEN CONCAT(c.nombres, ' ', COALESCE(c.apellidos, ''))
               WHEN c.razon_social IS NOT NULL THEN c.razon_social
               ELSE 'Sin cliente'
             END as cliente_nombre
      FROM vehiculos v
      LEFT JOIN clientes c ON v.id_cliente = c.id
      WHERE v.id_cliente = ?
      ORDER BY v.placa
    `, [id_cliente]);
    
    res.json({ success: true, data: vehiculos });
  } catch (error) {
    console.error('Error al obtener vehículos por cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener un vehículo por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.execute('SELECT * FROM vehiculos WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }
    
    res.json({ success: true, data: results[0] });
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nuevo vehículo
router.post('/', verifyToken, async (req, res) => {
  try {
    const { placa, marca, id_cliente, kilometraje } = req.body;
    
    if (!placa || !marca || !id_cliente) {
      return res.status(400).json({ 
        success: false, 
        message: 'Placa, marca y cliente son requeridos' 
      });
    }
    
    // Verificar si ya existe
    const [existing] = await db.execute('SELECT id FROM vehiculos WHERE placa = ?', [placa]);
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe un vehículo con esa placa' 
      });
    }
    
    // Verificar que el cliente existe
    const [cliente] = await db.execute('SELECT id FROM clientes WHERE id = ?', [id_cliente]);
    if (cliente.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    const insertQuery = `
      INSERT INTO vehiculos (placa, marca, id_cliente, kilometraje) 
      VALUES (?, ?, ?, ?)
    `;
    const insertParams = [placa, marca, id_cliente, kilometraje || 0];
    
    const [result] = await db.execute(insertQuery, insertParams);
    
    res.status(201).json({ 
      success: true, 
      message: 'Vehículo creado exitosamente',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar vehículo
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { placa, marca, id_cliente, kilometraje } = req.body;
    
    // Verificar que el vehículo existe
    const [existing] = await db.execute('SELECT id FROM vehiculos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }
    
    // Verificar duplicados de placa
    const [duplicate] = await db.execute('SELECT id FROM vehiculos WHERE placa = ? AND id != ?', [placa, id]);
    if (duplicate.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe otro vehículo con esa placa' 
      });
    }
    
    // Verificar que el cliente existe
    const [cliente] = await db.execute('SELECT id FROM clientes WHERE id = ?', [id_cliente]);
    if (cliente.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    const updateQuery = `
      UPDATE vehiculos 
      SET placa = ?, marca = ?, id_cliente = ?, kilometraje = ?
      WHERE id = ?
    `;
    const updateParams = [placa, marca, id_cliente, kilometraje || 0, id];
    
    await db.execute(updateQuery, updateParams);
    
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
    
    // Verificar que el vehículo existe
    const [existing] = await db.execute('SELECT id FROM vehiculos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }
    
    // Eliminar permanentemente
    await db.execute('DELETE FROM vehiculos WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Vehículo eliminado exitosamente' });
    
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
