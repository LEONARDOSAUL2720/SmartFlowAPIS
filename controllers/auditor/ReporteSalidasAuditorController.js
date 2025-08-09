const mongoose = require('mongoose');

// ============================================================================
// MODELOS NECESARIOS
// ============================================================================
// Nota: Asumiendo que tienes un modelo Salida similar a Entrada
// Si no existe, necesitarás crearlo o adaptar la consulta directa a la colección

// ============================================================================
// FUNCIÓN PARA GENERAR REPORTE EJECUTIVO DE SALIDAS
// ============================================================================
const generarReporteSalidas = async (req, res) => {
  console.log('📦 Generando reporte ejecutivo de salidas...');
  console.log('👤 Usuario auditor:', {
    id: req.user?._id,
    name: req.user?.name_user,
    role: req.user?.rol_user
  });

  try {
    const { 
      fecha_desde, 
      fecha_hasta, 
      tipo_reporte = 'completo',
      tipo_salida = 'todas', // 'venta', 'merma', 'todas'
      formato = 'json'
    } = req.query;

    // Validar fechas
    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        success: false,
        error: 'Fechas requeridas',
        message: 'Debe proporcionar fecha_desde y fecha_hasta para generar el reporte'
      });
    }

    const fechaDesde = new Date(fecha_desde);
    const fechaHasta = new Date(fecha_hasta);
    
    // Ajustar fecha hasta para incluir todo el día
    fechaHasta.setHours(23, 59, 59, 999);

    // Validar que la fecha desde no sea mayor que fecha hasta
    if (fechaDesde > fechaHasta) {
      return res.status(400).json({
        success: false,
        error: 'Fechas inválidas',
        message: 'La fecha desde no puede ser mayor que la fecha hasta'
      });
    }

    console.log(`📅 Rango de fechas: ${fechaDesde.toISOString()} - ${fechaHasta.toISOString()}`);
    console.log(`🏷️ Tipo de salida: ${tipo_salida}`);
    console.log(`📊 Tipo de reporte: ${tipo_reporte}`);

    // ============================================================================
    // CONSTRUCCIÓN DEL FILTRO DE CONSULTA
    // ============================================================================
    
    let filtro = {
      fecha_salida: {
        $gte: fechaDesde,
        $lte: fechaHasta
      }
    };

    // Filtrar por tipo de salida si no es 'todas'
    if (tipo_salida && tipo_salida !== 'todas') {
      filtro.tipo = { $regex: new RegExp(tipo_salida, 'i') };
    }

    console.log('🔍 Filtro de consulta:', JSON.stringify(filtro, null, 2));

    // ============================================================================
    // CONSULTA PRINCIPAL DE SALIDAS
    // ============================================================================
    
    // Consulta directa a la colección salidas usando mongoose
    const db = mongoose.connection.db;
    const salidasCollection = db.collection('salidas');
    
    const salidasRaw = await salidasCollection.find(filtro).toArray();
    
    console.log(`📦 Salidas encontradas en BD: ${salidasRaw.length}`);

    if (salidasRaw.length === 0) {
      return res.json({
        success: true,
        message: 'No se encontraron salidas en el rango de fechas especificado',
        data: {
          estadisticas: generarEstadisticasVacias(fechaDesde, fechaHasta),
          salidas: [],
          alertas: [],
          metadata: {
            fecha_generacion: new Date().toISOString(),
            tipo_reporte,
            tipo_salida,
            usuario_auditor: req.user?.name_user || 'Sistema',
            total_registros: 0
          }
        }
      });
    }

    // ============================================================================
    // PROCESAMIENTO Y ENRIQUECIMIENTO DE DATOS
    // ============================================================================
    
    // Obtener información de usuarios únicos
    const usuariosIds = [...new Set(salidasRaw.map(s => s.usuario_registro).filter(id => id))];
    const usuariosCollection = db.collection('users');
    const usuariosInfo = {};
    
    if (usuariosIds.length > 0) {
      const usuariosRaw = await usuariosCollection.find({
        _id: { $in: usuariosIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).toArray();
      
      usuariosRaw.forEach(user => {
        usuariosInfo[user._id.toString()] = {
          name: user.name_user || 'Usuario desconocido',
          role: user.rol_user || 'Sin rol'
        };
      });
    }
    
    const salidasProcesadas = salidasRaw.map(salida => {
      try {
        const usuarioInfo = usuariosInfo[salida.usuario_registro?.toString()] || {
          name: 'Usuario desconocido',
          role: 'Sin rol'
        };
        
        return {
          _id: salida._id,
          nombre_perfume: salida.nombre_perfume || 'Sin especificar',
          almacen_salida: salida.almacen_salida || 'N/A',
          cantidad: salida.cantidad || 0,
          tipo: salida.tipo || 'Venta',
          fecha_salida: salida.fecha_salida,
          usuario_registro: salida.usuario_registro,
          updated_at: salida.updated_at,
          
          // Información enriquecida del usuario
          usuario_info: usuarioInfo,
          
          // Información del almacén
          almacen_info: {
            codigo: salida.almacen_salida || 'N/A',
            nombre: obtenerNombreAlmacen(salida.almacen_salida)
          },
          
          // Métricas calculadas
          metricas: {
            valor_estimado_unitario: calcularValorEstimado(salida.nombre_perfume, salida.tipo),
            valor_total_estimado: (salida.cantidad || 0) * calcularValorEstimado(salida.nombre_perfume, salida.tipo),
            tipo_operacion: salida.tipo === 'Venta' ? 'Ingreso' : 'Pérdida',
            impacto_inventario: salida.tipo === 'Venta' ? 'Positivo' : 'Negativo',
            categoria_perfume: categorizarPerfume(salida.nombre_perfume)
          }
        };
      } catch (error) {
        console.error(`❌ Error procesando salida ${salida._id}:`, error);
        return null;
      }
    }).filter(salida => salida !== null);

    console.log(`✅ Salidas procesadas exitosamente: ${salidasProcesadas.length}`);

    // ============================================================================
    // GENERACIÓN DE ESTADÍSTICAS
    // ============================================================================
    
    const estadisticas = generarEstadisticasSalidas(salidasProcesadas, fechaDesde, fechaHasta);
    
    // ============================================================================
    // GENERACIÓN DE ALERTAS
    // ============================================================================
    
    const alertas = generarAlertasSalidas(estadisticas, salidasProcesadas);

    // ============================================================================
    // RESPUESTA FINAL
    // ============================================================================
    
    const respuesta = {
      success: true,
      message: `Reporte de salidas generado exitosamente. ${estadisticas.resumen_general.total_salidas} salidas encontradas.`,
      data: {
        estadisticas,
        salidas: salidasProcesadas,
        alertas,
        metadata: {
          fecha_generacion: new Date().toISOString(),
          tipo_reporte,
          tipo_salida,
          usuario_auditor: req.user?.name_user || 'Sistema',
          total_registros: salidasProcesadas.length,
          rango_fechas: {
            desde: fechaDesde.toISOString(),
            hasta: fechaHasta.toISOString()
          }
        }
      }
    };

    console.log(`📊 Estadísticas: ${estadisticas.resumen_general.total_salidas} salidas, ${estadisticas.por_tipo.ventas} ventas`);
    
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error generando reporte de salidas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al generar el reporte de salidas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// FUNCIÓN PARA OBTENER NOMBRE DEL ALMACÉN
// ============================================================================
function obtenerNombreAlmacen(codigo) {
  const almacenes = {
    'ALM001': 'Almacén Principal',
    'ALM002': 'Almacén Secundario',
    'ALM003': 'Almacén de Distribución',
    'default': 'Almacén Desconocido'
  };
  
  return almacenes[codigo] || almacenes.default;
}

// ============================================================================
// FUNCIÓN PARA CATEGORIZAR PERFUMES
// ============================================================================
function categorizarPerfume(nombrePerfume) {
  const perfumeLower = (nombrePerfume || '').toLowerCase();
  
  if (perfumeLower.includes('nautica')) return 'Deportivo';
  if (perfumeLower.includes('invictus')) return 'Masculino Premium';
  if (perfumeLower.includes('carolina herrera')) return 'Femenino Premium';
  if (perfumeLower.includes('212')) return 'Urbano Moderno';
  
  return 'Clásico';
}

// ============================================================================
// FUNCIÓN PARA CALCULAR VALOR ESTIMADO (MEJORADA)
// ============================================================================
function calcularValorEstimado(nombrePerfume, tipo) {
  // Valores estimados más detallados por perfume
  const valoresEstimados = {
    'nautica voyage': 850,
    'invictus victory': 1200,
    'carolina herrera 212': 950,
    'invictus': 1100,
    '212': 900,
    'default': 900
  };

  const perfumeLower = (nombrePerfume || '').toLowerCase();
  let valorBase = valoresEstimados.default;

  for (const [key, value] of Object.entries(valoresEstimados)) {
    if (perfumeLower.includes(key)) {
      valorBase = value;
      break;
    }
  }

  // Ajustar valor por tipo (las mermas pueden tener menor valor de recuperación)
  if (tipo === 'Merma') {
    valorBase *= 0.3; // Las mermas valen menos
  }

  return valorBase;
}

// ============================================================================
// FUNCIÓN PARA GENERAR ESTADÍSTICAS DE SALIDAS
// ============================================================================
function generarEstadisticasSalidas(salidas, fechaDesde, fechaHasta) {
  const totalSalidas = salidas.length;
  
  return {
    resumen_general: {
      total_salidas: totalSalidas,
      periodo: `${fechaDesde.toLocaleDateString('es-ES')} - ${fechaHasta.toLocaleDateString('es-ES')}`,
      fecha_generacion: new Date().toLocaleDateString('es-ES')
    },

    por_tipo: {
      ventas: salidas.filter(s => s.tipo === 'Venta').length,
      mermas: salidas.filter(s => s.tipo === 'Merma').length,
      otros: salidas.filter(s => s.tipo !== 'Venta' && s.tipo !== 'Merma').length
    },

    por_almacen: {
      alm001: salidas.filter(s => s.almacen_salida === 'ALM001').length,
      alm002: salidas.filter(s => s.almacen_salida === 'ALM002').length,
      alm003: salidas.filter(s => s.almacen_salida === 'ALM003').length,
      otros: salidas.filter(s => !['ALM001', 'ALM002', 'ALM003'].includes(s.almacen_salida)).length
    },

    metricas_financieras: {
      valor_total_ventas: salidas
        .filter(s => s.tipo === 'Venta')
        .reduce((sum, s) => sum + (s.metricas.valor_total_estimado || 0), 0),
      valor_total_mermas: salidas
        .filter(s => s.tipo === 'Merma')
        .reduce((sum, s) => sum + (s.metricas.valor_total_estimado || 0), 0),
      cantidad_total_productos: salidas.reduce((sum, s) => sum + s.cantidad, 0),
      valor_promedio_salida: totalSalidas > 0 ? 
        salidas.reduce((sum, s) => sum + (s.metricas.valor_total_estimado || 0), 0) / totalSalidas : 0
    },

    tendencias: {
      porcentaje_ventas: totalSalidas > 0 ? 
        ((salidas.filter(s => s.tipo === 'Venta').length / totalSalidas) * 100).toFixed(2) : 0,
      porcentaje_mermas: totalSalidas > 0 ? 
        ((salidas.filter(s => s.tipo === 'Merma').length / totalSalidas) * 100).toFixed(2) : 0,
      promedio_cantidad_por_salida: totalSalidas > 0 ?
        (salidas.reduce((sum, s) => sum + s.cantidad, 0) / totalSalidas).toFixed(2) : 0
    }
  };
}

// ============================================================================
// FUNCIÓN PARA GENERAR ESTADÍSTICAS VACÍAS
// ============================================================================
function generarEstadisticasVacias(fechaDesde, fechaHasta) {
  return {
    resumen_general: {
      total_salidas: 0,
      periodo: `${fechaDesde.toLocaleDateString('es-ES')} - ${fechaHasta.toLocaleDateString('es-ES')}`,
      fecha_generacion: new Date().toLocaleDateString('es-ES')
    },
    por_tipo: { ventas: 0, mermas: 0, otros: 0 },
    por_almacen: { alm001: 0, alm002: 0, alm003: 0, otros: 0 },
    metricas_financieras: {
      valor_total_ventas: 0,
      valor_total_mermas: 0,
      cantidad_total_productos: 0,
      valor_promedio_salida: 0
    },
    tendencias: {
      porcentaje_ventas: 0,
      porcentaje_mermas: 0,
      promedio_cantidad_por_salida: 0
    }
  };
}

// ============================================================================
// FUNCIÓN PARA GENERAR ALERTAS
// ============================================================================
function generarAlertasSalidas(estadisticas, salidas) {
  const alertas = [];

  // Alerta por alto porcentaje de mermas
  if (estadisticas.tendencias.porcentaje_mermas > 25) {
    alertas.push({
      tipo: 'warning',
      titulo: 'Alto nivel de mermas detectado',
      mensaje: `Se detectaron ${estadisticas.por_tipo.mermas} mermas (${estadisticas.tendencias.porcentaje_mermas}% del total)`,
      impacto: 'alto'
    });
  }

  // Alerta por baja actividad de ventas
  if (estadisticas.por_tipo.ventas === 0 && estadisticas.resumen_general.total_salidas > 0) {
    alertas.push({
      tipo: 'warning',
      titulo: 'Sin ventas registradas',
      mensaje: 'No se registraron ventas en el período seleccionado',
      impacto: 'medio'
    });
  }

  // Alerta por concentración en un solo almacén
  const almacenPrincipal = Math.max(
    estadisticas.por_almacen.alm001,
    estadisticas.por_almacen.alm002,
    estadisticas.por_almacen.alm003
  );
  
  if (almacenPrincipal > estadisticas.resumen_general.total_salidas * 0.8) {
    alertas.push({
      tipo: 'info',
      titulo: 'Concentración de salidas en un almacén',
      mensaje: `Más del 80% de las salidas provienen de un solo almacén`,
      impacto: 'bajo'
    });
  }

  // Alerta por valor alto de mermas
  if (estadisticas.metricas_financieras.valor_total_mermas > 50000) {
    alertas.push({
      tipo: 'error',
      titulo: 'Valor elevado en mermas',
      mensaje: `Las mermas representan $${estadisticas.metricas_financieras.valor_total_mermas.toFixed(2)} en pérdidas`,
      impacto: 'alto'
    });
  }

  return alertas;
}

// ============================================================================
// FUNCIÓN PARA OBTENER OPCIONES DE FILTROS
// ============================================================================
const obtenerOpcionesFiltrosSalidas = async (req, res) => {
  console.log('🔍 Obteniendo opciones de filtros para reportes de salidas...');

  try {
    const respuesta = {
      success: true,
      message: 'Opciones de filtros obtenidas exitosamente',
      data: {
        tipos_salida: [
          { value: 'todas', label: 'Todas las Salidas', descripcion: 'Incluir ventas y mermas' },
          { value: 'venta', label: 'Solo Ventas', descripcion: 'Únicamente salidas por venta' },
          { value: 'merma', label: 'Solo Mermas', descripcion: 'Únicamente salidas por merma' }
        ],
        tipos_reporte: [
          { value: 'completo', label: 'Reporte Completo', descripcion: 'Análisis detallado' },
          { value: 'ejecutivo', label: 'Resumen Ejecutivo', descripcion: 'Vista general de métricas' },
          { value: 'auditoria', label: 'Enfoque Auditoría', descripcion: 'Centrado en inconsistencias' }
        ],
        formatos: [
          { value: 'json', label: 'Datos JSON', descripcion: 'Para aplicaciones' },
          { value: 'pdf', label: 'Reporte PDF', descripcion: 'Documento imprimible' },
          { value: 'excel', label: 'Hoja Excel', descripcion: 'Para análisis de datos' }
        ]
      }
    };

    console.log('✅ Opciones de filtros de salidas obtenidas exitosamente');
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error obteniendo opciones de filtros de salidas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener las opciones de filtros',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  generarReporteSalidas,
  obtenerOpcionesFiltrosSalidas
};
