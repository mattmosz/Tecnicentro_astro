// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();

// Endpoint de prueba para verificar conexión a BD
router.get('/test-db', async (req, res) => {
  try {
    console.log('Probando conexión a la base de datos...');
    const [result] = await db.execute('SELECT 1 as test');
    console.log('Conexión exitosa:', result);
    res.json({ success: true, message: 'Conexión a BD exitosa', data: result });
  } catch (error) {
    console.error('Error de conexión:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint de prueba para verificar usuarios
router.get('/test-users', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, usuario, nombre, apellido, rol, estado FROM usuarios LIMIT 5');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const SECRET = process.env.JWT_SECRET || 'DEV_SECRET_CAMBIA_ESTO';


const fail = (res, http, code, message, extra = {}) =>
  res.status(http).json({ success: false, code, message, ...extra });


router.post('/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body || {};

    if (!usuario || !clave) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos',
      });
    }

    
    const [users] = await db.execute(
      'SELECT id, usuario, nombre, apellido, rol, estado, clave FROM usuarios WHERE usuario = ? AND estado = "activo" LIMIT 1',
      [usuario]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const user = users[0];

    
    let stored = String(user.clave || '');

    
    if (stored.startsWith('$2y$')) {
      stored = stored.replace(/^\$2y\$/i, '$2a$');
    }

    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(clave, stored);
    } catch (e) {
      console.error('Error comparando password:', e);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: e.message, 
      });
    }

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

   
    let token;
    try {
      token = jwt.sign(
        {
          id: user.id,
          usuario: user.usuario,
          rol: user.rol,
          nombre: user.nombre,
          apellido: user.apellido,
        },
        SECRET,
        { expiresIn: '8h' }
      );
    } catch (e) {
      console.error('Error firmando JWT:', e);
      return fail(res, 500, '#E8', 'Error generando token', { error: e.message });
    }

    return res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        usuario: user.usuario,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message, 
    });
  }
});


const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return fail(res, 401, '#T1', 'Token no proporcionado');

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    return next();
  } catch {
    return fail(res, 401, '#T2', 'Token inválido');
  }
};


router.get('/verify', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});


router.get('/_diag', async (req, res) => {
  try {
    const [ping] = await db.execute('SELECT 1 AS ok');
    const [cols] = await db.execute('SHOW COLUMNS FROM usuarios');
    const u = req.query.u || 'admin';
    const [rows] = await db.execute(
      'SELECT id, usuario, estado, clave FROM usuarios WHERE usuario=? LIMIT 1',
      [u]
    );
    res.json({
      success: true,
      info: {
        jwtSecretPresent: Boolean(process.env.JWT_SECRET),
        dbOk: ping?.[0]?.ok === 1,
        userTable: cols?.map((c) => c.Field),
        sampleUser: rows?.[0] || null,
      },
    });
  } catch (e) {
    console.error('DIAG error:', e);
    res.status(500).json({ success: false, code: '#D1', message: 'Diag falló', error: e.message });
  }
});

export default router;
