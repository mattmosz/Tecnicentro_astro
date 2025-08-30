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
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM clientes WHERE estado = "activo"';
    let params = [];
    
    if (q && q.trim()) {
      query += ` AND (
        identificacion LIKE ? OR 
        nombres LIKE ? OR 
        apellidos LIKE ? OR
        razon_social LIKE ? OR
        telefono LIKE ? OR
        correo LIKE ?
      )`;
      const searchTerm = `%${q.trim()}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    query += ' ORDER BY nombres, apellidos LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Ejecutar consulta
    const [clientes] = await db.execute(query, params);
    
    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM clientes WHERE estado = "activo"';
    let countParams = [];
    if (q && q.trim()) {
      countQuery += ` AND (
        identificacion LIKE ? OR 
        nombres LIKE ? OR 
        apellidos LIKE ? OR
        razon_social LIKE ? OR
        telefono LIKE ? OR
        correo LIKE ?
      )`;
      const searchTerm = `%${q.trim()}%`;
      countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({ 
      items: clientes,
      total: total
    });
    
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener un cliente por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.execute('SELECT * FROM clientes WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    res.json({ success: true, data: results[0] });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nuevo cliente
router.post('/', verifyToken, async (req, res) => {
  try {
    const { tipo, identificacion, nombre, telefono, email, direccion } = req.body;
    
    if (!tipo || !identificacion || !nombre) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo, identificación y nombre son requeridos' 
      });
    }

    let insertQuery, insertParams;
    
    if (tipo === 'institucion') {
      // Para instituciones, usar razón social
      insertQuery = `
        INSERT INTO clientes (tipo, identificacion, razon_social, telefono, correo, direccion, estado) 
        VALUES (?, ?, ?, ?, ?, ?, 'activo')
      `;
      insertParams = [tipo, identificacion, nombre, telefono || '', email || '', direccion || ''];
    } else {
      // Para particulares, dividir nombre en nombres y apellidos
      const nombreParts = nombre.trim().split(' ');
      const nombres = nombreParts.slice(0, Math.ceil(nombreParts.length / 2)).join(' ');
      const apellidos = nombreParts.slice(Math.ceil(nombreParts.length / 2)).join(' ');
      
      insertQuery = `
        INSERT INTO clientes (tipo, identificacion, nombres, apellidos, telefono, correo, direccion, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')
      `;
      insertParams = [tipo, identificacion, nombres, apellidos, telefono || '', email || '', direccion || ''];
    }
    
    // Verificar si ya existe
    const [existing] = await db.execute('SELECT id FROM clientes WHERE identificacion = ?', [identificacion]);
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe un cliente con esa identificación' 
      });
    }
    
    const [result] = await db.execute(insertQuery, insertParams);
    
    res.status(201).json({ 
      success: true, 
      message: 'Cliente creado exitosamente',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar cliente
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, identificacion, nombre, telefono, email, direccion } = req.body;
    
    // Verificar que el cliente existe
    const [existing] = await db.execute('SELECT id FROM clientes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    // Verificar duplicados de identificación
    const [duplicate] = await db.execute('SELECT id FROM clientes WHERE identificacion = ? AND id != ?', [identificacion, id]);
    if (duplicate.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe otro cliente con esa identificación' 
      });
    }
    
    let updateQuery, updateParams;
    
    if (tipo === 'institucion') {
      // Para instituciones, usar razón social y limpiar nombres/apellidos
      updateQuery = `
        UPDATE clientes 
        SET tipo = ?, identificacion = ?, razon_social = ?, nombres = NULL, apellidos = NULL, telefono = ?, correo = ?, direccion = ?
        WHERE id = ?
      `;
      updateParams = [tipo, identificacion, nombre, telefono || '', email || '', direccion || '', id];
    } else {
      // Para particulares, dividir nombre en nombres y apellidos y limpiar razón social
      const nombreParts = nombre.trim().split(' ');
      const nombres = nombreParts.slice(0, Math.ceil(nombreParts.length / 2)).join(' ');
      const apellidos = nombreParts.slice(Math.ceil(nombreParts.length / 2)).join(' ');
      
      updateQuery = `
        UPDATE clientes 
        SET tipo = ?, identificacion = ?, nombres = ?, apellidos = ?, razon_social = NULL, telefono = ?, correo = ?, direccion = ?
        WHERE id = ?
      `;
      updateParams = [tipo, identificacion, nombres, apellidos, telefono || '', email || '', direccion || '', id];
    }
    
    await db.execute(updateQuery, updateParams);
    
    res.json({ success: true, message: 'Cliente actualizado exitosamente' });
    
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar cliente
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el cliente existe
    const [existing] = await db.execute('SELECT id FROM clientes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    // Eliminar lógicamente
    await db.execute('UPDATE clientes SET estado = "inactivo" WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Cliente eliminado exitosamente' });
    
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
