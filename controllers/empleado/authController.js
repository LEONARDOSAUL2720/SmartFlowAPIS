const User = require('../models/User_f');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Registro de usuario
const register = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { name_user, correo_user, password_user, rol_user } = req.body;

    // Verificar si el usuario ya existe usando Mongoose
    const existingUser = await User.findOne({
      correo_user: correo_user
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'El email ya está en uso'
      });
    }

    // Crear nuevo usuario usando el modelo de Mongoose
    const user = new User({
      name_user: name_user,
      correo_user: correo_user,
      password_user: password_user, // Se hasheará automáticamente por el pre-save hook
      rol_user: rol_user || 'Empleado',
      estado_user: true
      // fecha_creacion se creará automáticamente
    });

    // Guardar usuario usando Mongoose (evitando validación estricta)
    try {
      const savedUser = await user.save({ validateBeforeSave: false });
      
      // Generar token
      const token = generateToken(savedUser._id);

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: savedUser.toPublicJSON(),
        token
      });
      
    } catch (mongoError) {
      console.error('Error específico de MongoDB:', mongoError);
      
      // Si es un error de validación de MongoDB, dar más detalles
      if (mongoError.code === 121) {
        return res.status(400).json({
          error: 'Error de validación de base de datos',
          message: 'Los datos no cumplen con el esquema de validación de MongoDB',
          details: mongoError.errInfo || 'Revisa los tipos de datos y campos requeridos'
        });
      }
      
      throw mongoError; // Re-lanzar otros errores
    }

  } catch (error) {
  console.error('Error en registro:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    stack: error.stack
  });
}

};

// Login de usuario
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { correo_user, password_user } = req.body;

    // Buscar usuario usando Mongoose
    const user = await User.findOne({ correo_user });
    
    if (!user) {
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña usando el método del modelo
    const isMatch = await user.comparePassword(password_user);
    
    if (!isMatch) {
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar si la cuenta está activa
    if (!user.estado_user) {
      return res.status(400).json({
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada'
      });
    }

    // Generar token
    const token = generateToken(user._id);

    res.json({
      message: 'Login exitoso',
      user: user.toPublicJSON(),
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al iniciar sesión'
    });
  }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    res.json({
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener perfil'
    });
  }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const allowedUpdates = ['name_user', 'rol_user'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar perfil'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
