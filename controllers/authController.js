const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  console.log('[generateToken] Generando token para usuario:', userId);
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Registro de usuario
const register = async (req, res) => {
  console.log('🔵 [register] Solicitud de registro recibida:', req.body);
  console.log('🔵 [register] req.body:', req.body);
  console.log('🔵 [register] req.file:', req.file);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('⚠️ [register] Datos inválidos:', errors.array());
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { name_user, correo_user, password_user, rol_user } = req.body;

    // Asignar ruta de imagen si existe archivo subido
    let imagen_user = null;
    if (req.file) {
      imagen_user = `/uploads/users/${req.file.filename}`;
      console.log('🟡 [register] Imagen cargada con ruta:', imagen_user);
    }

    console.log('🟢 [register] Datos recibidos:', { name_user, correo_user, rol_user });

    const existingUser = await User.findOne({ correo_user });
    if (existingUser) {
      console.warn('⚠️ [register] El usuario ya existe:', correo_user);
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'El email ya está en uso'
      });
    }

    const user = new User({
      name_user,
      correo_user,
      password_user,
      rol_user: rol_user || 'Empleado',
      estado_user: true,
      imagen_user
    });

    try {
      const savedUser = await user.save({ validateBeforeSave: false });
      console.log('✅ [register] Usuario registrado:', savedUser);

      const token = generateToken(savedUser._id);

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: savedUser.toPublicJSON(),
        token
      });

    } catch (mongoError) {
      console.error('❌ [register] Error al guardar usuario en MongoDB:', mongoError);

      if (mongoError.code === 121) {
        return res.status(400).json({
          error: 'Error de validación de base de datos',
          message: 'Los datos no cumplen con el esquema de validación de MongoDB',
          details: mongoError.errInfo || 'Revisa los tipos de datos y campos requeridos'
        });
      }

      throw mongoError;
    }

  } catch (error) {
    console.error('❌ [register] Error general en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al registrar usuario'
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  console.log('🔵 [login] Solicitud de login recibida:', req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('⚠️ [login] Datos inválidos:', errors.array());
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { correo_user, password_user } = req.body;
    console.log('🟢 [login] Credenciales recibidas:', { correo_user });

    const user = await User.findOne({ correo_user });
    if (!user) {
      console.warn('⚠️ [login] Usuario no encontrado:', correo_user);
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    const isMatch = await user.comparePassword(password_user);
    if (!isMatch) {
      console.warn('⚠️ [login] Contraseña incorrecta para:', correo_user);
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    if (!user.estado_user) {
      console.warn('⚠️ [login] Cuenta desactivada:', correo_user);
      return res.status(400).json({
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada'
      });
    }

    const token = generateToken(user._id);
    console.log('✅ [login] Login exitoso para:', correo_user);

    res.json({
      message: 'Login exitoso',
      user: user.toPublicJSON(),
      token
    });

  } catch (error) {
    console.error('❌ [login] Error general en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al iniciar sesión'
    });
  }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    console.log('📄 [getProfile] Usuario autenticado:', req.user._id);
    res.json({
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('❌ [getProfile] Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener perfil'
    });
  }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
  console.log('📝 [updateProfile] Solicitud de actualización:', req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('⚠️ [updateProfile] Datos inválidos:', errors.array());
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

    console.log('🔄 [updateProfile] Campos permitidos a actualizar:', updates);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    console.log('✅ [updateProfile] Perfil actualizado:', user);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('❌ [updateProfile] Error actualizando perfil:', error);
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
