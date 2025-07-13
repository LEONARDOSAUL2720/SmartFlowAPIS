const User = require('../../models/User');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Crear nuevo usuario (solo Admin)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { name_user, correo_user, password_user, rol_user } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ correo_user });
    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'El email ya está en uso'
      });
    }

    console.log('🔍 DEBUG - Datos recibidos:');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Files:', req.files);

    // Procesar imagen si se subió
    let imagen_user = null;
    if (req.file) {
      imagen_user = `/uploads/users/${req.file.filename}`;
      console.log('✅ Imagen encontrada:', imagen_user);
    } else {
      console.log('❌ No se encontró archivo en req.file');
    }

    // Crear nuevo usuario
    const user = new User({
      name_user,
      correo_user,
      password_user,
      rol_user: rol_user || 'Empleado',
      imagen_user,
      estado_user: true
    });

    const savedUser = await user.save({ validateBeforeSave: false });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: savedUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    
    // Si hay error, eliminar archivo subido
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'users', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al crear usuario'
    });
  }
};

// Obtener lista de usuarios (solo Admin)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, rol = 'all', estado = 'all' } = req.query;

    const filter = {};
    if (rol !== 'all') filter.rol_user = rol;
    if (estado !== 'all') filter.estado_user = estado === 'activo';

    const users = await User.find(filter)
      .select('-password_user')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ fecha_creacion: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      message: 'Usuarios obtenidos exitosamente',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener usuarios'
    });
  }
};

// Actualizar usuario (solo Admin)
const updateUser = async (req, res) => {
  try {
    console.log('🔍 DEBUG - Datos recibidos:');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Files:', req.files);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const allowedUpdates = ['name_user', 'correo_user', 'rol_user', 'estado_user'];
    const updates = {};

    // Procesar campos permitidos
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Procesar nueva imagen
    if (req.file) {
      // Obtener usuario actual para eliminar imagen anterior
      const currentUser = await User.findById(userId);
      if (currentUser && currentUser.imagen_user) {
        const oldImagePath = path.join(__dirname, '..', '..', currentUser.imagen_user);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updates.imagen_user = `/uploads/users/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario especificado no existe'
      });
    }

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    
    // Si hay error, eliminar nueva imagen subida
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'users', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar usuario'
    });
  }
};

// Eliminar usuario (solo Admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario especificado no existe'
      });
    }

    // Eliminar imagen del usuario si existe
    if (user.imagen_user) {
      const imagePath = path.join(__dirname, '..', '..', user.imagen_user);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al eliminar usuario'
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser
};
