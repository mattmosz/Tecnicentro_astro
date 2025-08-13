import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario y contraseña son requeridos' 
      });
    }

    // Buscar usuario en la base de datos
    const [users] = await db.execute(
      'SELECT * FROM usuarios WHERE usuario = ? AND estado = "activo"',
      [usuario]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(clave, user.clave);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        usuario: user.usuario, 
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        usuario: user.usuario,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Verificar token (ruta protegida)
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
