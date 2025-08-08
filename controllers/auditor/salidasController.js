const Salida = require('../../models/Salida');
const Perfume = require('../../models/Perfume');
const Almacen = require('../../models/Almacen');
const User = require('../../models/User');
const mongoose = require('mongoose');

// ============================================================================
// FUNCIÓN HELPER PARA NORMALIZAR DATOS DE SALIDA
// ============================================================================
const normalizarSalida = (salida) => {
  const salidaNormalizada = salida.toObject ? salida.toObject() : salida;
  
  // Convertir _id a string si es un ObjectId ejemplooo
  const idString = salidaNormalizada._id ? salidaNormalizada._id.toString() : '';
  
  return {
    ...salidaNormalizada,
    // Generar numero_salida si no existe
    numero_salida: salidaNormalizada.numero_salida || `SAL-${idString.slice(-6).toUpperCase()}`,
    // Asegurar que existan campos de auditoría
    estatus_auditoria: salidaNormalizada.estatus_auditoria || 'pendiente',
    auditado_por: salidaNormalizada.auditado_por || null,
    fecha_auditoria: salidaNormalizada.fecha_auditoria || null,
    observaciones_auditor: salidaNormalizada.observaciones_auditor || '',
    // Asegurar campos opcionales para ventas
    precio_unitario: salidaNormalizada.precio_unitario || 0,
    precio_total: salidaNormalizada.precio_total || 0,
    cliente: salidaNormalizada.cliente || '',
    numero_factura: salidaNormalizada.numero_factura || '',
    // Asegurar campos para mermas
    motivo: salidaNormalizada.motivo || '',
    descripcion_merma: salidaNormalizada.descripcion_merma || '',
    observaciones: salidaNormalizada.observaciones || ''
  };
};

// ============================================================================
// FUNCIÓN PARA OBTENER TODAS LAS SALIDAS CON FILTROS Y PAGINACIÓN
// ============================================================================
const obtenerTodasLasSalidas = async (req, res) => {
  console.log('📤 Obteniendo todas las salidas...');
  console.log('👤 Usuario autenticado:', {
    id: req.user?._id,
    name: req.user?.name_user,
    role: req.user?.rol_user
  });

  try {
    // Parámetros de paginación y filtros
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Parámetros de filtro opcionales
    const { tipo, estatus_auditoria, almacen_salida, busqueda, fecha_desde, fecha_hasta } = req.query;

    // Construir filtro de búsqueda
    let filtro = {};

    // Filtro por tipo (venta, merma, traspaso, etc.)
    if (tipo && tipo !== 'todos') {
      filtro.tipo = new RegExp(tipo, 'i');
    }

    // Filtro por estatus de auditoría
    if (estatus_auditoria && estatus_auditoria !== 'todos') {
      filtro.estatus_auditoria = new RegExp(estatus_auditoria, 'i');
    }

    // Filtro por almacén de salida
    if (almacen_salida && almacen_salida !== 'todos') {
      // Buscar almacén por código o nombre
      const almacenes = await Almacen.find({
        $or: [
          { codigo: new RegExp(almacen_salida, 'i') },
          { nombre_almacen: new RegExp(almacen_salida, 'i') }
        ]
      }).select('_id');
      
      if (almacenes.length > 0) {
        filtro.almacen_salida = { $in: almacenes.map(a => a._id) };
      }
    }

    // Filtro por búsqueda (número de salida, cliente, número de factura)
    if (busqueda) {
      filtro.$or = [
        { numero_salida: new RegExp(busqueda, 'i') },
        { cliente: new RegExp(busqueda, 'i') },
        { numero_factura: new RegExp(busqueda, 'i') },
        { motivo: new RegExp(busqueda, 'i') }
      ];
    }

    // Filtro por rango de fechas
    if (fecha_desde || fecha_hasta) {
      filtro.fecha_salida = {};
      if (fecha_desde) {
        filtro.fecha_salida.$gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        const fechaHasta = new Date(fecha_hasta);
        fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
        filtro.fecha_salida.$lte = fechaHasta;
      }
    }

    console.log('🔍 Filtro aplicado:', filtro);

    // Obtener salidas con populate
    let salidas = await Salida.find(filtro)
      .populate({
        path: 'id_perfume',
        select: 'name_per descripcion_per categoria_per precio_venta_per stock_per ubicacion_per fecha_expiracion estado',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'almacen_salida',
        select: 'codigo nombre_almacen ubicacion estado',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'almacen_destino', // Para traspasos
        select: 'codigo nombre_almacen ubicacion estado',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'usuario_registro',
        select: 'name_user apellido_user email_user rol_user',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'auditado_por',
        select: 'name_user apellido_user email_user rol_user',
        options: { strictPopulate: false }
      })
      .sort({ fecha_salida: -1 }) // Más recientes primero
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`🔍 Salidas encontradas en BD: ${salidas.length}`);

    // Procesar salidas para agregar información adicional
    const salidasProcesadas = await Promise.all(salidas.map(async (salida, index) => {
      try {
        // Normalizar la salida primero para asegurar que tenga todos los campos
        const salidaNormalizada = normalizarSalida(salida);
        
        console.log(`🔄 Procesando salida ${index + 1}/${salidas.length}: ${salidaNormalizada.numero_salida}`);

        // Información adicional según el tipo
        let informacionAdicional = {};

        if (salidaNormalizada.tipo === 'Venta') {
          informacionAdicional = {
            tipo_operacion: 'Venta',
            valor_unitario: salidaNormalizada.precio_unitario || 0,
            valor_total: salidaNormalizada.precio_total || 0,
            cliente: salidaNormalizada.cliente || 'Cliente general',
            numero_factura: salidaNormalizada.numero_factura || 'Sin factura',
            impacto_inventario: 'Reducción de stock'
          };
        } else if (salidaNormalizada.tipo === 'Merma') {
          informacionAdicional = {
            tipo_operacion: 'Merma',
            motivo_merma: salidaNormalizada.motivo || 'No especificado',
            tiene_evidencia_fotografica: !!salidaNormalizada.foto_evidencia,
            descripcion: salidaNormalizada.descripcion_merma || 'Sin descripción',
            impacto_inventario: 'Pérdida de stock',
            requiere_auditoria: true
          };
        } else if (salidaNormalizada.tipo === 'Traspaso') {
          informacionAdicional = {
            tipo_operacion: 'Traspaso de salida',
            almacen_destino: salidaNormalizada.almacen_destino || null,
            numero_traspaso: salidaNormalizada.numero_traspaso || 'Sin número',
            impacto_inventario: 'Transferencia de stock',
            requiere_confirmacion: true
          };
        }

        // Calcular tiempo desde la operación
        const tiempoTranscurrido = Math.floor((new Date() - new Date(salidaNormalizada.fecha_salida)) / (1000 * 60 * 60 * 24));
        
        const resultado = {
          _id: salidaNormalizada._id,
          numero_salida: salidaNormalizada.numero_salida,
          nombre_perfume: salidaNormalizada.nombre_perfume,
          almacen_salida: salidaNormalizada.almacen_salida,
          tipo: salidaNormalizada.tipo,
          cantidad: salidaNormalizada.cantidad,
          fecha_salida: salidaNormalizada.fecha_salida,
          usuario_registro: salidaNormalizada.usuario_registro,
          motivo: salidaNormalizada.motivo,
          observaciones: salidaNormalizada.observaciones,
          precio_unitario: salidaNormalizada.precio_unitario,
          precio_total: salidaNormalizada.precio_total,
          cliente: salidaNormalizada.cliente,
          numero_factura: salidaNormalizada.numero_factura,
          descripcion_merma: salidaNormalizada.descripcion_merma,
          estatus_auditoria: salidaNormalizada.estatus_auditoria,
          auditado_por: salidaNormalizada.auditado_por,
          fecha_auditoria: salidaNormalizada.fecha_auditoria,
          observaciones_auditor: salidaNormalizada.observaciones_auditor,
          estado: salidaNormalizada.estado || 'Activo',
          informacion_adicional: informacionAdicional,
          tiempo_transcurrido_dias: tiempoTranscurrido,
          created_at: salidaNormalizada.createdAt,
          updated_at: salidaNormalizada.updatedAt || salidaNormalizada.updated_at
        };

        console.log(`  ✅ Salida ${salidaNormalizada.numero_salida} procesada exitosamente`);
        return resultado;

      } catch (error) {
        // Normalizar la salida primero para el log de error
        const salidaNormalizadaError = normalizarSalida(salida);
        console.error(`❌ Error procesando salida ${salidaNormalizadaError.numero_salida || salida._id}:`, error);
        // Devolver salida normalizada básica aunque falle el procesamiento
        return {
          _id: salidaNormalizadaError._id,
          numero_salida: salidaNormalizadaError.numero_salida,
          nombre_perfume: salidaNormalizadaError.nombre_perfume,
          almacen_salida: salidaNormalizadaError.almacen_salida,
          tipo: salidaNormalizadaError.tipo,
          cantidad: salidaNormalizadaError.cantidad,
          fecha_salida: salidaNormalizadaError.fecha_salida,
          usuario_registro: salidaNormalizadaError.usuario_registro,
          estatus_auditoria: salidaNormalizadaError.estatus_auditoria,
          error_procesamiento: error.message
        };
      }
    }));

    // Obtener total para paginación
    const total = await Salida.countDocuments(filtro);

    // Metadatos de paginación
    const metadatos = {
      total,
      pagina_actual: page,
      total_paginas: Math.ceil(total / limit),
      salidas_por_pagina: limit,
      tiene_siguiente: page < Math.ceil(total / limit),
      tiene_anterior: page > 1
    };

    // Estadísticas rápidas
    const estadisticas = await Salida.getEstadisticas();

    // Estadísticas filtradas (compatibles con documentos sin campos de auditoría)
    const estadisticasFiltradas = {
      total_salidas: total,
      total_ventas: await Salida.countDocuments({ ...filtro, tipo: 'Venta' }),
      total_mermas: await Salida.countDocuments({ ...filtro, tipo: 'Merma' }),
      total_traspasos: 0, // Ya no hay traspasos en el nuevo modelo
      // Para documentos sin estatus_auditoria, se consideran pendientes
      pendientes_auditoria: await Salida.countDocuments({ 
        ...filtro, 
        $or: [
          { estatus_auditoria: 'pendiente' },
          { estatus_auditoria: { $exists: false } },
          { estatus_auditoria: null }
        ]
      }),
      auditadas: await Salida.countDocuments({ ...filtro, estatus_auditoria: 'auditado' }),
      con_inconsistencias: await Salida.countDocuments({ ...filtro, estatus_auditoria: 'inconsistencia' })
    };

    console.log(`✅ Se encontraron ${salidasProcesadas.length} salidas de ${total} totales`);

    // Respuesta completa
    res.json({
      success: true,
      message: `Se encontraron ${total} salidas`,
      data: {
        salidas: salidasProcesadas,
        metadatos,
        estadisticas: estadisticasFiltradas, // Usar estadísticas filtradas como principales
        estadisticas_generales: estadisticas, // Estadísticas generales como adicionales
        filtros_aplicados: {
          tipo: tipo || null,
          estatus_auditoria: estatus_auditoria || null,
          almacen_salida: almacen_salida || null,
          busqueda: busqueda || null,
          fecha_desde: fecha_desde || null,
          fecha_hasta: fecha_hasta || null,
          pagina: page,
          limite: limit
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo todas las salidas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las salidas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// FUNCIÓN PARA OBTENER UNA SALIDA ESPECÍFICA POR ID O NÚMERO
// ============================================================================
const obtenerSalidaCompleta = async (req, res) => {
  console.log('🔍 Búsqueda de salida específica iniciada');
  console.log('📋 ID/Número de salida recibido:', req.params.id);
  
  try {
    const { id: identificador } = req.params;
    
    if (!identificador || identificador.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Identificador de salida inválido',
        message: 'El ID o número de salida no puede estar vacío'
      });
    }

    // Buscar por ID o por número de salida
    let query = {};
    if (mongoose.Types.ObjectId.isValid(identificador)) {
      query._id = identificador;
    } else {
      query.numero_salida = identificador;
    }

    console.log('🔍 Query de búsqueda:', query);

    // Buscar la salida con todos los populate necesarios
    const salida = await Salida.findOne(query)
      .populate({
        path: 'id_perfume',
        select: 'name_per descripcion_per categoria_per precio_venta_per stock_per stock_minimo_per ubicacion_per fecha_expiracion estado marca',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'almacen_salida',
        select: 'codigo nombre_almacen ubicacion direccion telefono estado descripcion',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'almacen_destino',
        select: 'codigo nombre_almacen ubicacion direccion telefono estado descripcion',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'usuario_registro',
        select: 'name_user apellido_user email_user rol_user telefono_user estado',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'auditado_por',
        select: 'name_user apellido_user email_user rol_user',
        options: { strictPopulate: false }
      })
      .lean();

    if (!salida) {
      return res.status(404).json({
        success: false,
        error: 'Salida no encontrada',
        message: `No se encontró una salida con el identificador: ${identificador}`
      });
    }

    console.log('✅ Salida encontrada:', {
      id: salida._id,
      numero: salida.numero_salida,
      tipo: salida.tipo,
      estatus: salida.estatus_auditoria
    });

    // Generar análisis detallado según el tipo
    let analisisDetallado = {};
    
    if (salida.tipo === 'Venta') {
      analisisDetallado = {
        tipo_analisis: 'Análisis de Venta',
        validaciones: {
          precio_coherente: salida.precio_unitario > 0 && salida.precio_total > 0,
          calculo_correcto: (salida.precio_unitario * salida.cantidad) === salida.precio_total,
          cliente_identificado: !!salida.cliente && salida.cliente.trim() !== '',
          factura_emitida: !!salida.numero_factura && salida.numero_factura.trim() !== ''
        },
        metricas: {
          valor_unitario: salida.precio_unitario,
          valor_total: salida.precio_total,
          margen_esperado: salida.id_perfume?.precio_venta_per ? 
            ((salida.precio_unitario - (salida.id_perfume.precio_venta_per * 0.7)) / salida.precio_unitario * 100).toFixed(2) + '%' : 'N/A',
          unidades_vendidas: salida.cantidad
        },
        alertas: []
      };

      // Generar alertas para ventas
      if (!analisisDetallado.validaciones.precio_coherente) {
        analisisDetallado.alertas.push('Precios incoherentes o faltantes');
      }
      if (!analisisDetallado.validaciones.calculo_correcto) {
        analisisDetallado.alertas.push('Error en el cálculo del precio total');
      }
      if (!analisisDetallado.validaciones.cliente_identificado) {
        analisisDetallado.alertas.push('Cliente no identificado');
      }

    } else if (salida.tipo === 'Merma') {
      analisisDetallado = {
        tipo_analisis: 'Análisis de Merma',
        validaciones: {
          motivo_especificado: !!salida.motivo && salida.motivo.trim() !== '',
          evidencia_fotografica: !!salida.foto_evidencia,
          descripcion_detallada: !!salida.descripcion_merma && salida.descripcion_merma.trim() !== '',
          requiere_auditoria: true
        },
        impacto: {
          valor_perdido: salida.id_perfume?.precio_venta_per ? 
            (salida.id_perfume.precio_venta_per * salida.cantidad).toFixed(2) : 'N/A',
          porcentaje_stock: salida.id_perfume?.stock_per ? 
            ((salida.cantidad / salida.id_perfume.stock_per) * 100).toFixed(2) + '%' : 'N/A',
          criticidad: salida.cantidad > 10 ? 'Alta' : salida.cantidad > 5 ? 'Media' : 'Baja'
        },
        alertas: []
      };

      // Generar alertas para mermas
      if (!analisisDetallado.validaciones.motivo_especificado) {
        analisisDetallado.alertas.push('Motivo de merma no especificado');
      }
      if (!analisisDetallado.validaciones.evidencia_fotografica) {
        analisisDetallado.alertas.push('Falta evidencia fotográfica');
      }
      if (analisisDetallado.impacto.criticidad === 'Alta') {
        analisisDetallado.alertas.push('Merma de alto impacto - Requiere atención inmediata');
      }

    } else if (salida.tipo === 'Traspaso') {
      analisisDetallado = {
        tipo_analisis: 'Análisis de Traspaso',
        validaciones: {
          almacen_destino_definido: !!salida.almacen_destino,
          numero_traspaso_valido: !!salida.numero_traspaso && salida.numero_traspaso.trim() !== '',
          almacenes_diferentes: salida.almacen_salida?._id?.toString() !== salida.almacen_destino?._id?.toString()
        },
        logistica: {
          almacen_origen: salida.almacen_salida?.codigo || 'No identificado',
          almacen_destino: salida.almacen_destino?.codigo || 'No identificado',
          distancia_estimada: 'Pendiente cálculo',
          tiempo_transito: 'Pendiente confirmación'
        },
        alertas: []
      };

      // Generar alertas para traspasos
      if (!analisisDetallado.validaciones.almacen_destino_definido) {
        analisisDetallado.alertas.push('Almacén de destino no definido');
      }
      if (!analisisDetallado.validaciones.almacenes_diferentes) {
        analisisDetallado.alertas.push('Almacén de origen y destino son iguales');
      }
    }

    // Calcular información de tiempo
    const ahora = new Date();
    const fechaSalida = new Date(salida.fecha_salida);
    const diasTranscurridos = Math.floor((ahora - fechaSalida) / (1000 * 60 * 60 * 24));
    const horasTranscurridas = Math.floor((ahora - fechaSalida) / (1000 * 60 * 60));

    // Determinar estado de auditoría y acciones recomendadas
    let estadoAuditoria = {
      estado: salida.estatus_auditoria,
      dias_sin_auditar: salida.estatus_auditoria === 'pendiente' ? diasTranscurridos : 0,
      prioridad: 'Normal',
      acciones_recomendadas: []
    };

    if (salida.estatus_auditoria === 'pendiente') {
      if (diasTranscurridos > 7) {
        estadoAuditoria.prioridad = 'Alta';
        estadoAuditoria.acciones_recomendadas.push('Auditoría urgente requerida');
      } else if (diasTranscurridos > 3) {
        estadoAuditoria.prioridad = 'Media';
        estadoAuditoria.acciones_recomendadas.push('Programar auditoría próximamente');
      }

      if (salida.tipo === 'Merma' && !salida.foto_evidencia) {
        estadoAuditoria.acciones_recomendadas.push('Solicitar evidencia fotográfica');
      }
    }

    // Respuesta completa
    const respuesta = {
      success: true,
      message: 'Salida encontrada exitosamente',
      data: {
        salida: {
          _id: salida._id,
          numero_salida: salida.numero_salida,
          tipo: salida.tipo,
          cantidad: salida.cantidad,
          fecha_salida: salida.fecha_salida,
          motivo: salida.motivo,
          observaciones: salida.observaciones,
          precio_unitario: salida.precio_unitario,
          precio_total: salida.precio_total,
          cliente: salida.cliente,
          numero_factura: salida.numero_factura,
          foto_evidencia: salida.foto_evidencia,
          descripcion_merma: salida.descripcion_merma,
          numero_traspaso: salida.numero_traspaso,
          estatus_auditoria: salida.estatus_auditoria,
          observaciones_auditor: salida.observaciones_auditor,
          fecha_auditoria: salida.fecha_auditoria,
          estado: salida.estado,
          created_at: salida.createdAt,
          updated_at: salida.updatedAt
        },
        perfume: salida.id_perfume || null,
        almacen_salida: salida.almacen_salida || null,
        almacen_destino: salida.almacen_destino || null,
        usuario_registro: salida.usuario_registro || null,
        auditado_por: salida.auditado_por || null,
        analisis_detallado: analisisDetallado,
        informacion_temporal: {
          dias_transcurridos: diasTranscurridos,
          horas_transcurridas: horasTranscurridas,
          fecha_formateada: fechaSalida.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        estado_auditoria: estadoAuditoria
      }
    };

    console.log('🎉 Salida completa obtenida exitosamente');
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error obteniendo salida completa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener la salida completa',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// FUNCIÓN PARA MARCAR UNA SALIDA COMO AUDITADA
// ============================================================================
const marcarComoAuditada = async (req, res) => {
  console.log('✅ Procesamiento de auditoría de salida iniciado');
  console.log('📋 ID de salida recibido:', req.params.id);
  console.log('👤 Usuario auditor:', {
    id: req.user._id,
    name: req.user.name_user,
    role: req.user.rol_user
  });

  try {
    const { id: salidaId } = req.params;
    const { observaciones_auditor = '' } = req.body;

    if (!salidaId || salidaId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ID de salida inválido',
        message: 'El ID de la salida no puede estar vacío'
      });
    }

    // Buscar la salida
    const salida = await Salida.findById(salidaId)
      .populate('id_perfume', 'name_per precio_venta_per')
      .populate('almacen_salida', 'codigo nombre_almacen');

    if (!salida) {
      return res.status(404).json({
        success: false,
        error: 'Salida no encontrada',
        message: `No se encontró una salida con el ID: ${salidaId}`
      });
    }

    // Verificar que no esté ya auditada
    if (salida.estatus_auditoria === 'auditado') {
      return res.status(400).json({
        success: false,
        error: 'Salida ya auditada',
        message: 'Esta salida ya fue auditada anteriormente'
      });
    }

    // Actualizar estado de auditoría
    const estadoAnterior = salida.estatus_auditoria;
    salida.estatus_auditoria = 'auditado';
    salida.auditado_por = req.user._id;
    salida.fecha_auditoria = new Date();
    salida.observaciones_auditor = observaciones_auditor;

    await salida.save();

    // Obtener información completa del auditor
    const auditor = await User.findById(req.user._id);

    // Respuesta exitosa
    const respuesta = {
      success: true,
      message: 'Salida marcada como auditada exitosamente',
      data: {
        salida: {
          _id: salida._id,
          numero_salida: salida.numero_salida,
          tipo: salida.tipo,
          cantidad: salida.cantidad,
          estatus_anterior: estadoAnterior,
          estatus_nuevo: salida.estatus_auditoria,
          fecha_auditoria: salida.fecha_auditoria,
          observaciones_auditor: salida.observaciones_auditor
        },
        perfume: {
          nombre: salida.id_perfume?.name_per || 'No disponible',
          precio_venta: salida.id_perfume?.precio_venta_per || 0
        },
        almacen: {
          codigo: salida.almacen_salida?.codigo || 'No disponible',
          nombre: salida.almacen_salida?.nombre_almacen || 'No disponible'
        },
        auditor: {
          id: auditor._id,
          nombre: auditor.name_user,
          apellido: auditor.apellido_user || '',
          email: auditor.email_user,
          rol: auditor.rol_user,
          fecha_auditoria: new Date().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
    };

    console.log('🎉 Auditoría de salida procesada exitosamente');
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error en auditoría de salida:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al procesar la auditoría de salida',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// FUNCIÓN PARA REPORTAR INCONSISTENCIA EN UNA SALIDA
// ============================================================================
const reportarInconsistencia = async (req, res) => {
  console.log('⚠️ Reporte de inconsistencia en salida iniciado');
  console.log('📋 ID de salida recibido:', req.params.id);
  console.log('👤 Usuario auditor:', {
    id: req.user._id,
    name: req.user.name_user,
    role: req.user.rol_user
  });

  try {
    const { id: salidaId } = req.params;
    const { motivo_inconsistencia = '', observaciones_auditor = '' } = req.body;

    if (!salidaId || salidaId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ID de salida inválido',
        message: 'El ID de la salida no puede estar vacío'
      });
    }

    if (!motivo_inconsistencia || motivo_inconsistencia.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Motivo requerido',
        message: 'El motivo de la inconsistencia es obligatorio'
      });
    }

    // Buscar la salida
    const salida = await Salida.findById(salidaId)
      .populate('id_perfume', 'name_per precio_venta_per')
      .populate('almacen_salida', 'codigo nombre_almacen')
      .populate('usuario_registro', 'name_user email_user');

    if (!salida) {
      return res.status(404).json({
        success: false,
        error: 'Salida no encontrada',
        message: `No se encontró una salida con el ID: ${salidaId}`
      });
    }

    // Actualizar estado a inconsistencia
    const estadoAnterior = salida.estatus_auditoria;
    salida.estatus_auditoria = 'inconsistencia';
    salida.auditado_por = req.user._id;
    salida.fecha_auditoria = new Date();
    salida.observaciones_auditor = `INCONSISTENCIA REPORTADA: ${motivo_inconsistencia}. ${observaciones_auditor}`;

    await salida.save();

    // Obtener información completa del auditor
    const auditor = await User.findById(req.user._id);

    // Respuesta exitosa
    const respuesta = {
      success: true,
      message: 'Inconsistencia reportada exitosamente',
      data: {
        salida: {
          _id: salida._id,
          numero_salida: salida.numero_salida,
          tipo: salida.tipo,
          cantidad: salida.cantidad,
          estatus_anterior: estadoAnterior,
          estatus_nuevo: salida.estatus_auditoria,
          motivo_inconsistencia: motivo_inconsistencia,
          fecha_reporte: salida.fecha_auditoria,
          observaciones_auditor: salida.observaciones_auditor
        },
        perfume: {
          nombre: salida.id_perfume?.name_per || 'No disponible'
        },
        almacen: {
          codigo: salida.almacen_salida?.codigo || 'No disponible',
          nombre: salida.almacen_salida?.nombre_almacen || 'No disponible'
        },
        usuario_original: {
          nombre: salida.usuario_registro?.name_user || 'No disponible',
          email: salida.usuario_registro?.email_user || 'No disponible'
        },
        auditor: {
          id: auditor._id,
          nombre: auditor.name_user,
          email: auditor.email_user,
          rol: auditor.rol_user,
          fecha_reporte: new Date().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
    };

    console.log('🎉 Inconsistencia reportada exitosamente');
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error reportando inconsistencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al reportar la inconsistencia',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// FUNCIÓN PARA OBTENER OPCIONES DE FILTROS
// ============================================================================
const obtenerOpcionesFiltros = async (req, res) => {
  console.log('⚙️ Obteniendo opciones de filtros para salidas...');

  try {
    // Obtener tipos únicos
    const tipos = await Salida.distinct('tipo');

    // Obtener estados de auditoría únicos - solo los que existen y no son null
    const estadosAuditoria = await Salida.distinct('estatus_auditoria', {
      estatus_auditoria: { $exists: true, $ne: null, $ne: '' }
    });

    // Si no hay estados de auditoría en la BD (documentos antiguos), usar valores por defecto
    const estadosDisponibles = estadosAuditoria.length > 0 
      ? estadosAuditoria 
      : ['pendiente']; // Estado por defecto para documentos sin auditar

    // Obtener almacenes activos
    const almacenes = await Almacen.find({ estado: 'Activo' })
      .select('codigo nombre_almacen ubicacion')
      .sort({ codigo: 1 })
      .lean();

    // Obtener estadísticas generales
    const estadisticas = await Salida.getEstadisticas();

    const respuesta = {
      success: true,
      message: 'Opciones de filtros obtenidas exitosamente',
      data: {
        tipos: tipos.map(tipo => ({
          value: tipo,
          label: tipo,
          descripcion: {
            'Venta': 'Operaciones de venta al cliente',
            'Merma': 'Pérdidas por deterioro o daño',
            'Traspaso': 'Transferencias entre almacenes',
            'Devolucion': 'Devoluciones de clientes'
          }[tipo] || tipo
        })),
        estados_auditoria: estadosDisponibles.map(estado => ({
          value: estado,
          label: estado.charAt(0).toUpperCase() + estado.slice(1),
          descripcion: {
            'pendiente': 'Esperando revisión del auditor',
            'auditado': 'Ya revisado y aprobado',
            'inconsistencia': 'Presenta irregularidades'
          }[estado] || estado
        })),
        almacenes: almacenes.map(almacen => ({
          value: almacen.codigo,
          label: `${almacen.codigo} - ${almacen.nombre_almacen}`,
          ubicacion: almacen.ubicacion
        })),
        estadisticas_generales: estadisticas,
        opciones_ordenamiento: [
          { value: 'fecha_salida_desc', label: 'Fecha más reciente' },
          { value: 'fecha_salida_asc', label: 'Fecha más antigua' },
          { value: 'numero_salida_asc', label: 'Número de salida A-Z' },
          { value: 'tipo_asc', label: 'Tipo A-Z' },
          { value: 'cantidad_desc', label: 'Mayor cantidad' },
          { value: 'cantidad_asc', label: 'Menor cantidad' }
        ],
        rangos_fecha_sugeridos: [
          { value: 'hoy', label: 'Hoy', descripcion: 'Salidas de hoy' },
          { value: 'semana', label: 'Esta semana', descripcion: 'Últimos 7 días' },
          { value: 'mes', label: 'Este mes', descripcion: 'Últimos 30 días' },
          { value: 'trimestre', label: 'Este trimestre', descripcion: 'Últimos 90 días' }
        ]
      }
    };

    console.log('✅ Opciones de filtros obtenidas exitosamente');
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error obteniendo opciones de filtros:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener las opciones de filtros',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  obtenerTodasLasSalidas,
  obtenerSalidaCompleta,
  marcarComoAuditada,
  reportarInconsistencia,
  obtenerOpcionesFiltros
};
