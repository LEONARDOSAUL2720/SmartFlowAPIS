const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name_user: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [50, 'El nombre de usuario no puede tener más de 50 caracteres']
  },
  correo_user: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  imagen_user: {
    type: String,
    default: null,
    trim: true
  },
  imagen_base64: {
    type: String,
    default: null,
    trim: true
  },
  password_user: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [4, 'La contraseña debe tener al menos 4 caracteres']
  },
  rol_user: {
    type: String,
    enum: ['Admin', 'Empleado', 'Auditor'],
    default: 'Empleado'
  },
  estado_user: {
    type: Boolean,
    default: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'Usuarios',
  versionKey: false,
  strict: false
});

// Hash de la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_user')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_user = await bcrypt.hash(this.password_user, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_user);
};

// Método para obtener datos públicos del usuario
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password_user;
  
  // Si tiene imagen en Base64, usarla directamente
  if (user.imagen_base64) {
    user.imagen_url = user.imagen_base64; // Base64 completo
    console.log('🔍 DEBUG - Usando imagen Base64');
  }
  // Si tiene imagen como archivo, construir URL
  else if (user.imagen_user) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    console.log('🔍 DEBUG - BASE_URL utilizada:', baseUrl);
    user.imagen_url = `${baseUrl}${user.imagen_user}`;
    console.log('🔍 DEBUG - imagen_url generada:', user.imagen_url);
  } 
  // Sin imagen
  else {
    user.imagen_url = null;
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
