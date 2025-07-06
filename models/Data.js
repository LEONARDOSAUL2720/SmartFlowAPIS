const mongoose = require('mongoose');

// Modelo de ejemplo para datos genéricos
const dataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede tener más de 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede tener más de 1000 caracteres']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['general', 'important', 'urgent', 'completed'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  data: {
    type: mongoose.Schema.Types.Mixed, // Permite cualquier tipo de dato
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Índices para mejorar rendimiento
dataSchema.index({ userId: 1, category: 1 });
dataSchema.index({ createdAt: -1 });
dataSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Data', dataSchema);
