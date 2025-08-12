const mongoose = require('mongoose');

const salidaSchema = new mongoose.Schema({
  numero_salida: {
    type: String,
    required: false,
    unique: false,
    trim: true
  },
  nombre_perfume: {
    type: String,
    required: true
  },
  almacen_salida: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  tipo: {
    type: String,
    required: true,
    enum: ['Venta', 'Merma'],
    default: 'Venta'
  },
  fecha_salida: {
    type: Date,
    default: Date.now
  },
  usuario_registro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  motivo: {
    type: String,
    default: '',
    trim: true
  },
  observaciones: {
    type: String,
    default: '',
    trim: true
  },
  // Campos específicos para ventas
  precio_unitario: {
    type: Number,
    default: 0,
    min: 0
  },
  precio_total: {
    type: Number,
    default: 0,
    min: 0
  },
  cliente: {
    type: String,
    default: '',
    trim: true
  },
  numero_factura: {
    type: String,
    default: '',
    trim: true
  },
  // Campos específicos para merma
  descripcion_merma: {
    type: String,
    default: '',
    trim: true
  },
  // Campos de auditoría (NUEVOS para tu funcionalidad)
  estatus_auditoria: {
    type: String,
    enum: ['pendiente', 'auditado', 'inconsistencia'],
    default: 'pendiente'
  },
  auditado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fecha_auditoria: {
    type: Date,
    default: null
  },
  observaciones_auditor: {
    type: String,
    default: '',
    trim: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'salidas',
  versionKey: false,
  timestamps: true
});

// Índices para mejorar rendimiento
salidaSchema.index({ numero_salida: 1 });
salidaSchema.index({ fecha_salida: -1 });
salidaSchema.index({ tipo: 1 });
salidaSchema.index({ estatus_auditoria: 1 });
salidaSchema.index({ almacen_salida: 1 });
salidaSchema.index({ usuario_registro: 1 });

// Método para convertir a JSON público
salidaSchema.methods.toPublicJSON = function() {
  const salida = this.toObject();
  
  return {
    _id: salida._id,
    numero_salida: salida.numero_salida,
    nombre_perfume: salida.nombre_perfume,
    almacen_salida: salida.almacen_salida,
    cantidad: salida.cantidad,
    tipo: salida.tipo,
    fecha_salida: salida.fecha_salida,
    usuario_registro: salida.usuario_registro,
    motivo: salida.motivo,
    observaciones: salida.observaciones,
    precio_unitario: salida.precio_unitario,
    precio_total: salida.precio_total,
    cliente: salida.cliente,
    numero_factura: salida.numero_factura,
    descripcion_merma: salida.descripcion_merma,
    estatus_auditoria: salida.estatus_auditoria,
    auditado_por: salida.auditado_por,
    fecha_auditoria: salida.fecha_auditoria,
    observaciones_auditor: salida.observaciones_auditor,
    updated_at: salida.updated_at,
    createdAt: salida.createdAt,
    updatedAt: salida.updatedAt
  };
};

// Método estático para obtener estadísticas (COMPATIBLE con nuevo esquema)
salidaSchema.statics.getEstadisticas = async function() {
  const pipeline = [
    {
      $group: {
        _id: null,
        total_salidas: { $sum: 1 },
        total_ventas: { 
          $sum: { $cond: [{ $eq: ['$tipo', 'Venta'] }, 1, 0] }
        },
        total_mermas: { 
          $sum: { $cond: [{ $eq: ['$tipo', 'Merma'] }, 1, 0] }
        },
        total_traspasos: { $sum: 0 }, // Ya no hay traspasos, siempre 0
        pendientes_auditoria: {
          $sum: { 
            $cond: [
              { 
                $or: [
                  { $eq: ['$estatus_auditoria', 'pendiente'] },
                  { $eq: [{ $type: '$estatus_auditoria' }, 'missing'] },
                  { $eq: ['$estatus_auditoria', null] }
                ]
              }, 
              1, 
              0
            ]
          }
        },
        auditadas: {
          $sum: { $cond: [{ $eq: ['$estatus_auditoria', 'auditado'] }, 1, 0] }
        },
        con_inconsistencias: {
          $sum: { $cond: [{ $eq: ['$estatus_auditoria', 'inconsistencia'] }, 1, 0] }
        },
        valor_total_ventas: {
          $sum: { 
            $cond: [
              { $eq: ['$tipo', 'Venta'] }, 
              { $ifNull: ['$precio_total', 0] }, // Usar 0 si precio_total no existe
              0
            ]
          }
        }
      }
    }
  ];
  
  const resultado = await this.aggregate(pipeline);
  return resultado[0] || {
    total_salidas: 0,
    total_ventas: 0,
    total_mermas: 0,
    total_traspasos: 0,
    pendientes_auditoria: 0,
    auditadas: 0,
    con_inconsistencias: 0,
    valor_total_ventas: 0
  };
};

module.exports = mongoose.model('Salida', salidaSchema);
