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

// Obtener un servicio por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [servicios] = await db.execute('SELECT * FROM servicios WHERE id = ?', [id]);
    
    if (servicios.length === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }
    
    res.json({ success: true, data: servicios[0] });
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nuevo servicio
router.post('/', verifyToken, async (req, res) => {
  try {
    const { codigo, descripcion, precio_unitario, tipo } = req.body;

    if (!codigo || !descripcion || !precio_unitario || !tipo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios' 
      });
    }

    // Verificar que el código no exista
    const [existingService] = await db.execute('SELECT id FROM servicios WHERE codigo = ?', [codigo]);
    if (existingService.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe un servicio con ese código' 
      });
    }

    const [result] = await db.execute(
      'INSERT INTO servicios (codigo, descripcion, precio_unitario, tipo) VALUES (?, ?, ?, ?)',
      [codigo, descripcion, precio_unitario, tipo]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Servicio creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar servicio
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, descripcion, precio_unitario, tipo } = req.body;

    if (!codigo || !descripcion || !precio_unitario || !tipo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios' 
      });
    }

    // Verificar que el servicio existe
    const [existingService] = await db.execute('SELECT id FROM servicios WHERE id = ?', [id]);
    if (existingService.length === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    // Verificar que el código no esté siendo usado por otro servicio
    const [duplicateCode] = await db.execute('SELECT id FROM servicios WHERE codigo = ? AND id != ?', [codigo, id]);
    if (duplicateCode.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe otro servicio con ese código' 
      });
    }

    const [result] = await db.execute(
      'UPDATE servicios SET codigo = ?, descripcion = ?, precio_unitario = ?, tipo = ? WHERE id = ?',
      [codigo, descripcion, precio_unitario, tipo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    res.json({ success: true, message: 'Servicio actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar servicio
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el servicio existe
    const [existingService] = await db.execute('SELECT id FROM servicios WHERE id = ?', [id]);
    if (existingService.length === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    const [result] = await db.execute('DELETE FROM servicios WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    res.json({ success: true, message: 'Servicio eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
