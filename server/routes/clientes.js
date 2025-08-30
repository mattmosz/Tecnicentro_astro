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

// Obtener todos los clientes con paginación y búsqueda
router.get('/', verifyToken, async (req, res) => {
  try {
    const { buscar, limite = 50, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;
    
    let query = 'SELECT * FROM clientes WHERE estado = "activo"';
    let params = [];
    
    if (buscar) {
      query += ` AND (
        identificacion LIKE ? OR 
        nombres LIKE ? OR 
        apellidos LIKE ? OR 
        razon_social LIKE ? OR
        CONCAT(nombres, ' ', apellidos) LIKE ?
      )`;
      const searchTerm = `%${buscar}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    query += ' ORDER BY nombres, apellidos, razon_social LIMIT ? OFFSET ?';
    params.push(parseInt(limite), parseInt(offset));
    
    const [clientes] = await db.execute(query, params);
    
    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM clientes WHERE estado = "activo"';
    let countParams = [];
    if (buscar) {
      countQuery += ` AND (
        identificacion LIKE ? OR 
        nombres LIKE ? OR 
        apellidos LIKE ? OR 
        razon_social LIKE ? OR
        CONCAT(nombres, ' ', apellidos) LIKE ?
      )`;
      const searchTerm = `%${buscar}%`;
      countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    const [count] = await db.execute(countQuery, countParams);
    
    res.json({ 
      success: true, 
      data: clientes,
      pagination: {
        total: count[0].total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(count[0].total / limite)
      }
    });
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

// Obtener un cliente por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [clientes] = await db.execute('SELECT * FROM clientes WHERE id = ? AND estado = "activo"', [id]);
    
    if (clientes.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    res.json({ success: true, data: clientes[0] });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar cliente
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, identificacion, nombres, apellidos, razon_social, telefono, correo, direccion } = req.body;

    if (!tipo || !identificacion) {
      return res.status(400).json({ success: false, message: 'Tipo e identificación son requeridos' });
    }

    // Verificar si el cliente existe
    const [existing] = await db.execute('SELECT id FROM clientes WHERE id = ? AND estado = "activo"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    // Verificar si la identificación ya existe en otro cliente
    const [duplicate] = await db.execute('SELECT id FROM clientes WHERE identificacion = ? AND id != ?', [identificacion, id]);
    if (duplicate.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya existe otro cliente con esa identificación' });
    }

    await db.execute(
      'UPDATE clientes SET tipo = ?, identificacion = ?, nombres = ?, apellidos = ?, razon_social = ?, telefono = ?, correo = ?, direccion = ? WHERE id = ?',
      [tipo, identificacion, nombres || null, apellidos || null, razon_social || null, telefono || null, correo || null, direccion || null, id]
    );

    res.json({ success: true, message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar cliente (cambiar estado a inactivo)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el cliente existe
    const [existing] = await db.execute('SELECT id FROM clientes WHERE id = ? AND estado = "activo"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    // Verificar si el cliente tiene vehículos asociados
    const [vehiculos] = await db.execute('SELECT COUNT(*) as total FROM vehiculos WHERE id_cliente = ?', [id]);
    if (vehiculos[0].total > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el cliente porque tiene vehículos asociados' 
      });
    }

    await db.execute('UPDATE clientes SET estado = "inactivo" WHERE id = ?', [id]);

    res.json({ success: true, message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Buscar clientes por término
router.get('/buscar/:termino', verifyToken, async (req, res) => {
  try {
    const { termino } = req.params;
    const searchTerm = `%${termino}%`;
    
    const [clientes] = await db.execute(`
      SELECT * FROM clientes 
      WHERE estado = "activo" AND (
        identificacion LIKE ? OR 
        nombres LIKE ? OR 
        apellidos LIKE ? OR 
        razon_social LIKE ? OR
        CONCAT(nombres, ' ', apellidos) LIKE ?
      )
      ORDER BY nombres, apellidos, razon_social
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
    
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
