const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Obtener todos los usuarios (solo admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password_user')
      .sort({ fecha_creacion: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({});

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener usuarios'
    });
  }
});

// Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password_user');
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario solicitado no existe'
      });
    }

    // Los usuarios solo pueden ver su propio perfil o ser admin
    if (req.user._id.toString() !== user._id.toString() && req.user.rol_user !== 'Admin') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos para ver este usuario'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener usuario'
    });
  }
});

// Desactivar usuario (solo admin)
router.patch('/:id/deactivate', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { estado_user: false },
      { new: true }
    ).select('-password_user');

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario solicitado no existe'
      });
    }

    res.json({
      message: 'Usuario desactivado exitosamente',
      user
    });

  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al desactivar usuario'
    });
  }
});

// Activar usuario (solo admin)
router.patch('/:id/activate', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { estado_user: true },
      { new: true }
    ).select('-password_user');

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario solicitado no existe'
      });
    }

    res.json({
      message: 'Usuario activado exitosamente',
      user
    });

  } catch (error) {
    console.error('Error activando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al activar usuario'
    });
  }
});

module.exports = router;
