const jwt = require('jsonwebtoken');
const User = require('../models/User_f');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'No se proporcionó token de autenticación'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password_user');
    
    if (!user) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Usuario no encontrado'
      });
    }

    if (!user.estado_user) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticación inválido'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.rol_user !== 'Admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren permisos de administrador'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
