const Entrada = require('../../models/Entrada');
const Perfume = require('../../models/Perfume');
const User = require('../../models/User');
const Proveedor = require('../../models/Proveedor');
const Almacen = require('../../models/Almacen');
const mongoose = require('mongoose');

// ============================================================================
// FUNCIÓN PARA GENERAR REPORTE EJECUTIVO DE ENTRADAS
// ============================================================================
const generarReporteEntradas = async (req, res) => {
  console.log('📊 Generando reporte ejecutivo de entradas...');
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
      formato = 'json',
      incluir_rechazadas = true 
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

    console.log(`📅 Rango de fechas: ${fechaDesde.toLocaleDateString()} - ${fechaHasta.toLocaleDateString()}`);

    // Construir filtro base
    const filtro = {
      fecha_entrada: {
        $gte: fechaDesde,
        $lte: fechaHasta
      }
    };

    // Filtro opcional para excluir rechazadas
    if (incluir_rechazadas === 'false') {
      filtro.estatus_validacion = { $ne: 'rechazado' };
    }

    console.log('🔍 Filtro aplicado:', filtro);

    // Obtener entradas con populate completo
    const entradas = await Entrada.find(filtro)
      .populate({
        path: 'id_perfume',
        select: 'name_per descripcion_per categoria_per precio_venta_per stock_per ubicacion_per estado marca',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'usuario_registro',
        select: 'name_user correo_user rol_user estado_user',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'validado_por',
        select: 'name_user correo_user rol_user',
        options: { strictPopulate: false }
      })
      .sort({ fecha_entrada: -1 })
      .lean();

    console.log(`📦 Entradas encontradas: ${entradas.length}`);

    // Procesar entradas para obtener información completa
    const entradasProcesadas = await Promise.all(entradas.map(async (entrada) => {
      try {
        // Procesar proveedor (puede ser ObjectId o String)
        let proveedorInfo = null;
        if (entrada.proveedor) {
          try {
            if (mongoose.Types.ObjectId.isValid(entrada.proveedor)) {
              proveedorInfo = await Proveedor.findById(entrada.proveedor)
                .select('nombre_proveedor rfc contacto telefono email estado')
                .lean();
            } else if (typeof entrada.proveedor === 'string') {
              proveedorInfo = await Proveedor.findOne({ nombre_proveedor: entrada.proveedor })
                .select('nombre_proveedor rfc contacto telefono email estado')
                .lean();
            }
          } catch (error) {
            console.log(`⚠️ Error procesando proveedor para entrada ${entrada.numero_entrada}:`, error.message);
          }
        }

        // Procesar almacén destino
        let almacenInfo = null;
        if (entrada.almacen_destino) {
          try {
            if (mongoose.Types.ObjectId.isValid(entrada.almacen_destino)) {
              almacenInfo = await Almacen.findById(entrada.almacen_destino)
                .select('nombre_almacen codigo ubicacion estado')
                .lean();
            } else if (typeof entrada.almacen_destino === 'string') {
              almacenInfo = await Almacen.findOne({ codigo: entrada.almacen_destino })
                .select('nombre_almacen codigo ubicacion estado')
                .lean();
            }
          } catch (error) {
            console.log(`⚠️ Error procesando almacén para entrada ${entrada.numero_entrada}:`, error.message);
          }
        }

        // Calcular métricas relevantes
        const valorTotal = entrada.cantidad * (entrada.id_perfume?.precio_venta_per || 0);
        const diasProcesamiento = entrada.fecha_validacion ? 
          Math.ceil((new Date(entrada.fecha_validacion) - new Date(entrada.fecha_entrada)) / (1000 * 60 * 60 * 24)) : null;

        return {
          // Información básica de la entrada
          id: entrada._id,
          numero_entrada: entrada.numero_entrada,
          tipo: entrada.tipo,
          cantidad: entrada.cantidad,
          fecha_entrada: entrada.fecha_entrada,
          estatus_validacion: entrada.estatus_validacion,
          observaciones_auditor: entrada.observaciones_auditor || '',
          referencia_traspaso: entrada.referencia_traspaso || null,

          // Información del perfume
          perfume: entrada.id_perfume ? {
            id: entrada.id_perfume._id,
            nombre: entrada.id_perfume.name_per,
            categoria: entrada.id_perfume.categoria_per,
            precio_venta: entrada.id_perfume.precio_venta_per,
            stock_actual: entrada.id_perfume.stock_per,
            ubicacion: entrada.id_perfume.ubicacion_per,
            estado: entrada.id_perfume.estado,
            marca: entrada.id_perfume.marca || 'SmartFlow'
          } : null,

          // Información del proveedor
          proveedor: proveedorInfo ? {
            id: proveedorInfo._id,
            nombre: proveedorInfo.nombre_proveedor,
            rfc: proveedorInfo.rfc,
            contacto: proveedorInfo.contacto,
            telefono: proveedorInfo.telefono,
            email: proveedorInfo.email,
            estado: proveedorInfo.estado
          } : {
            valor_original: entrada.proveedor,
            nota: "Proveedor no encontrado o formato no reconocido"
          },

          // Información del almacén
          almacen_destino: almacenInfo ? {
            id: almacenInfo._id,
            nombre: almacenInfo.nombre_almacen,
            codigo: almacenInfo.codigo,
            ubicacion: almacenInfo.ubicacion,
            estado: almacenInfo.estado
          } : {
            valor_original: entrada.almacen_destino,
            nota: "Almacén no encontrado"
          },

          // Información del usuario que registró
          usuario_registro: entrada.usuario_registro ? {
            id: entrada.usuario_registro._id,
            nombre: entrada.usuario_registro.name_user,
            email: entrada.usuario_registro.correo_user,
            rol: entrada.usuario_registro.rol_user,
            estado: entrada.usuario_registro.estado_user
          } : null,

          // Información del auditor validador
          validado_por: entrada.validado_por ? {
            id: entrada.validado_por._id,
            nombre: entrada.validado_por.name_user,
            email: entrada.validado_por.correo_user,
            rol: entrada.validado_por.rol_user
          } : null,

          // Métricas calculadas
          metricas: {
            valor_total_estimado: valorTotal,
            dias_procesamiento: diasProcesamiento,
            fecha_validacion: entrada.fecha_validacion,
            tiempo_desde_registro: Math.ceil((new Date() - new Date(entrada.fecha_entrada)) / (1000 * 60 * 60 * 24)),
            estado_color: {
              'validado': '#9DBF9E',
              'rechazado': '#B75D69',
              'registrado': '#D4AF37'
            }[entrada.estatus_validacion] || '#757575'
          },

          // Fechas importantes
          fechas: {
            creacion: entrada.createdAt,
            actualizacion: entrada.updatedAt,
            entrada: entrada.fecha_entrada,
            validacion: entrada.fecha_validacion
          }
        };
      } catch (error) {
        console.error(`❌ Error procesando entrada ${entrada.numero_entrada}:`, error);
        return null;
      }
    }));

    // Filtrar entradas nulas (errores de procesamiento)
    const entradasValidas = entradasProcesadas.filter(entrada => entrada !== null);

    // Generar estadísticas ejecutivas
    const estadisticas = {
      resumen_general: {
        total_entradas: entradasValidas.length,
        periodo: `${fechaDesde.toLocaleDateString('es-ES')} - ${fechaHasta.toLocaleDateString('es-ES')}`,
        fecha_generacion: new Date(),
        generado_por: {
          id: req.user._id,
          nombre: req.user.name_user,
          rol: req.user.rol_user
        }
      },

      por_tipo: {
        compras: entradasValidas.filter(e => e.tipo === 'Compra').length,
        traspasos: entradasValidas.filter(e => e.tipo === 'Traspaso').length
      },

      por_estatus: {
        validadas: entradasValidas.filter(e => e.estatus_validacion === 'validado').length,
        rechazadas: entradasValidas.filter(e => e.estatus_validacion === 'rechazado').length,
        pendientes: entradasValidas.filter(e => 
          !e.estatus_validacion || 
          e.estatus_validacion === 'registrado' || 
          e.estatus_validacion === 'pendiente'
        ).length
      },

      metricas_financieras: {
        valor_total_inventario: entradasValidas.reduce((sum, e) => sum + (e.metricas.valor_total_estimado || 0), 0),
        cantidad_total_productos: entradasValidas.reduce((sum, e) => sum + e.cantidad, 0),
        valor_promedio_entrada: entradasValidas.length > 0 ? 
          entradasValidas.reduce((sum, e) => sum + (e.metricas.valor_total_estimado || 0), 0) / entradasValidas.length : 0
      },

      tendencias: {
        dias_promedio_validacion: entradasValidas
          .filter(e => e.metricas.dias_procesamiento !== null)
          .reduce((sum, e, _, arr) => sum + e.metricas.dias_procesamiento / arr.length, 0),
        porcentaje_aprobacion: entradasValidas.length > 0 ? 
          (entradasValidas.filter(e => e.estatus_validacion === 'validado').length / entradasValidas.length * 100).toFixed(2) : 0
      },

      top_categorias: getTopCategorias(entradasValidas),
      top_proveedores: getTopProveedores(entradasValidas),
      distribución_almacenes: getDistribucionAlmacenes(entradasValidas)
    };

    // Generar alertas y recomendaciones
    const alertas = generarAlertas(entradasValidas, estadisticas);

    console.log('✅ Reporte generado exitosamente');
    console.log(`📊 Estadísticas: ${estadisticas.resumen_general.total_entradas} entradas, ${estadisticas.por_estatus.validadas} validadas`);

    // Respuesta completa
    const respuesta = {
      success: true,
      message: `Reporte de entradas generado exitosamente para el periodo ${fechaDesde.toLocaleDateString()} - ${fechaHasta.toLocaleDateString()}`,
      data: {
        estadisticas,
        entradas: entradasValidas,
        alertas,
        metadata: {
          total_procesadas: entradasValidas.length,
          total_encontradas: entradas.length,
          errores_procesamiento: entradas.length - entradasValidas.length,
          rango_fechas: {
            desde: fechaDesde,
            hasta: fechaHasta
          },
          filtros_aplicados: {
            incluir_rechazadas: incluir_rechazadas !== 'false',
            tipo_reporte
          }
        }
      }
    };

    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error generando reporte de entradas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al generar el reporte de entradas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// FUNCIONES AUXILIARES PARA ANÁLISIS DE DATOS
// ============================================================================

function getTopCategorias(entradas) {
  const categorias = {};
  entradas.forEach(entrada => {
    if (entrada.perfume?.categoria) {
      const cat = entrada.perfume.categoria;
      categorias[cat] = (categorias[cat] || 0) + entrada.cantidad;
    }
  });
  
  return Object.entries(categorias)
    .map(([categoria, cantidad]) => ({ categoria, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);
}

function getTopProveedores(entradas) {
  const proveedores = {};
  entradas.forEach(entrada => {
    if (entrada.proveedor?.nombre) {
      const prov = entrada.proveedor.nombre;
      proveedores[prov] = (proveedores[prov] || 0) + entrada.cantidad;
    }
  });
  
  return Object.entries(proveedores)
    .map(([proveedor, cantidad]) => ({ proveedor, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);
}

function getDistribucionAlmacenes(entradas) {
  const almacenes = {};
  entradas.forEach(entrada => {
    if (entrada.almacen_destino?.nombre) {
      const alm = entrada.almacen_destino.nombre;
      almacenes[alm] = (almacenes[alm] || 0) + entrada.cantidad;
    }
  });
  
  return Object.entries(almacenes)
    .map(([almacen, cantidad]) => ({ almacen, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

function generarAlertas(entradas, estadisticas) {
  const alertas = [];

  // Alerta por alto porcentaje de rechazos
  if (estadisticas.por_estatus.rechazadas > estadisticas.resumen_general.total_entradas * 0.1) {
    alertas.push({
      tipo: 'warning',
      titulo: 'Alto porcentaje de entradas rechazadas',
      mensaje: `Se detectaron ${estadisticas.por_estatus.rechazadas} entradas rechazadas (${(estadisticas.por_estatus.rechazadas / estadisticas.resumen_general.total_entradas * 100).toFixed(1)}%)`,
      severidad: 'MEDIA'
    });
  }

  // Alerta por entradas pendientes de validación
  if (estadisticas.por_estatus.pendientes > 0) {
    alertas.push({
      tipo: 'info',
      titulo: 'Entradas pendientes de validación',
      mensaje: `Hay ${estadisticas.por_estatus.pendientes} entradas pendientes de validación`,
      severidad: 'BAJA'
    });
  }

  // Alerta por tiempo de procesamiento largo
  if (estadisticas.tendencias.dias_promedio_validacion > 3) {
    alertas.push({
      tipo: 'warning',
      titulo: 'Tiempo de validación elevado',
      mensaje: `El tiempo promedio de validación es de ${estadisticas.tendencias.dias_promedio_validacion.toFixed(1)} días`,
      severidad: 'MEDIA'
    });
  }

  return alertas;
}

// ============================================================================
// FUNCIÓN PARA OBTENER OPCIONES DE FILTROS DEL REPORTE
// ============================================================================
const obtenerOpcionesFiltrosReporte = async (req, res) => {
  console.log('🔍 Obteniendo opciones de filtros para reporte...');

  try {
    // Obtener rangos de fechas disponibles
    const rangoFechas = await Entrada.aggregate([
      {
        $group: {
          _id: null,
          fecha_minima: { $min: '$fecha_entrada' },
          fecha_maxima: { $max: '$fecha_entrada' }
        }
      }
    ]);

    // Obtener tipos únicos
    const tipos = await Entrada.distinct('tipo');

    // Obtener estados únicos
    const estados = await Entrada.distinct('estatus_validacion');

    const respuesta = {
      success: true,
      message: 'Opciones de filtros obtenidas exitosamente',
      data: {
        tipos_reporte: [
          { value: 'completo', label: 'Reporte Completo', descripcion: 'Incluye todas las entradas y estadísticas detalladas' },
          { value: 'ejecutivo', label: 'Resumen Ejecutivo', descripcion: 'Solo estadísticas principales y tendencias' },
          { value: 'auditoria', label: 'Enfoque Auditoría', descripcion: 'Enfocado en validaciones y discrepancias' }
        ],
        tipos_entrada: tipos.map(tipo => ({
          value: tipo,
          label: tipo,
          descripcion: tipo === 'Compra' ? 'Entradas por compra directa' : 'Entradas por traspaso entre almacenes'
        })),
        estados_validacion: estados.map(estado => ({
          value: estado,
          label: estado.charAt(0).toUpperCase() + estado.slice(1),
          color: {
            'validado': '#9DBF9E',
            'rechazado': '#B75D69',
            'registrado': '#D4AF37'
          }[estado] || '#757575'
        })),
        rango_fechas: rangoFechas.length > 0 ? {
          fecha_minima: rangoFechas[0].fecha_minima,
          fecha_maxima: rangoFechas[0].fecha_maxima
        } : null,
        formatos_disponibles: [
          { value: 'json', label: 'Datos JSON', descripcion: 'Para visualización en la app' },
          { value: 'pdf', label: 'Reporte PDF', descripcion: 'Documento imprimible' },
          { value: 'excel', label: 'Hoja Excel', descripcion: 'Para análisis de datos' }
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
  generarReporteEntradas,
  obtenerOpcionesFiltrosReporte
};
