const Perfume = require('../../models/Perfume');

// ============================================================================
// OBTENER TODOS LOS PERFUMES CON FILTROS Y BÚSQUEDA
// ============================================================================
const obtenerPerfumes = async (req, res) => {
  try {
    console.log('🔍 Obteniendo listado de perfumes...');
    
    // Obtener parámetros de consulta
    const { 
      busqueda = '', 
      almacen = '', 
      categoria = '', 
      estado = '', 
      limite = 50, 
      pagina = 1 
    } = req.query;

    // Construir filtros de búsqueda
    let filtros = {};

    // Filtro de búsqueda por nombre, marca, código o SKU
    if (busqueda && busqueda.trim() !== '') {
      filtros.$or = [
        { name_per: { $regex: busqueda, $options: 'i' } },
        { marca: { $regex: busqueda, $options: 'i' } },
        { codigo_producto: { $regex: busqueda, $options: 'i' } },
        { sku: { $regex: busqueda, $options: 'i' } },
        { descripcion_per: { $regex: busqueda, $options: 'i' } },
        { descripcion: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Filtro por almacén (principalmente almacen_id)
    if (almacen && almacen.trim() !== '' && almacen !== 'todos') {
      filtros.$or = [
        { almacen_id: { $regex: almacen, $options: 'i' } },
        { ubicacion_per: { $regex: almacen, $options: 'i' } } // Como fallback
      ];
    }

    // Filtro por categoría (principalmente categoria)
    if (categoria && categoria.trim() !== '' && categoria !== 'todas') {
      filtros.$or = [
        { categoria: { $regex: categoria, $options: 'i' } },
        { categoria_per: { $regex: categoria, $options: 'i' } } // Como fallback
      ];
    }

    // Filtro por estado (principalmente estado_producto)
    if (estado && estado.trim() !== '' && estado !== 'todos') {
      filtros.$or = [
        { estado_producto: { $regex: estado, $options: 'i' } },
        { estado: { $regex: estado, $options: 'i' } } // Como fallback
      ];
    }

    console.log('🔍 Filtros aplicados:', filtros);

    // Calcular skip para paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Ejecutar consulta con filtros
    const perfumes = await Perfume.find(filtros)
      .sort({ updated_at: -1, updatedAt: -1 }) // Ordenar por fecha de actualización
      .limit(parseInt(limite))
      .skip(skip)
      .lean(); // Usar lean() para mejor rendimiento

    // Contar total de documentos que coinciden con los filtros
    const total = await Perfume.countDocuments(filtros);

    // Normalizar datos para respuesta consistente
    const perfumesNormalizados = perfumes.map(perfume => ({
      id: perfume._id,
      nombre: perfume.name_per || perfume.nombre || 'Sin nombre',
      marca: perfume.marca || 'Sin marca',
      categoria: perfume.categoria_per || perfume.categoria || 'Sin categoría',
      descripcion: perfume.descripcion_per || perfume.descripcion || 'Sin descripción',
      codigo_producto: perfume.codigo_producto || 'Sin código',
      sku: perfume.sku || 'Sin SKU',
      precio_venta: perfume.precio_venta_per || perfume.precio_venta || perfume.precio_base || 0,
      precio_unitario: perfume.precio_unitario || perfume.precio_base || 0,
      stock_actual: perfume.stock_per || perfume.stock_actual || 0,
      stock_minimo: perfume.stock_minimo_per || perfume.stock_minimo || 0,
      ubicacion: perfume.ubicacion_per || perfume.ubicacion_fisica || 'Sin ubicación',
      almacen_id: perfume.almacen_id || 'Sin almacén',
      estado: perfume.estado || perfume.estado_producto || 'Desconocido',
      unidad_medida: perfume.unidad_medida || 'ml',
      fecha_expiracion: perfume.fecha_expiracion || null,
      fecha_actualizacion: perfume.updated_at || perfume.updatedAt || perfume.actualizado || null
    }));

    // Preparar metadatos de paginación
    const metadatos = {
      total: total,
      pagina_actual: parseInt(pagina),
      total_paginas: Math.ceil(total / parseInt(limite)),
      elementos_por_pagina: parseInt(limite),
      tiene_siguiente: (parseInt(pagina) * parseInt(limite)) < total,
      tiene_anterior: parseInt(pagina) > 1
    };

    console.log(`✅ Se encontraron ${perfumesNormalizados.length} perfumes de ${total} totales`);

    res.json({
      success: true,
      message: 'Perfumes obtenidos exitosamente',
      data: {
        perfumes: perfumesNormalizados,
        metadatos: metadatos,
        filtros_aplicados: {
          busqueda: busqueda || null,
          almacen: almacen || null,
          categoria: categoria || null,
          estado: estado || null
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfumes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener la lista de perfumes',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// OBTENER OPCIONES PARA FILTROS (ALMACENES, CATEGORÍAS, ETC.)
// ============================================================================
const obtenerOpcionesFiltros = async (req, res) => {
  try {
    console.log('🔍 Obteniendo opciones para filtros...');

    // Obtener valores únicos para cada filtro según los campos especificados
    // ALMACENES: Principalmente de almacen_id, con fallbacks
    const almacenesId = await Perfume.distinct('almacen_id');
    const almacenesUbicacion = await Perfume.distinct('ubicacion_per'); // Como fallback
    
    // CATEGORÍAS: Principalmente de categoria, con fallback a categoria_per
    const categorias = await Perfume.distinct('categoria');
    const categoriasAlt = await Perfume.distinct('categoria_per'); // Como fallback
    
    // ESTADOS: Principalmente de estado_producto, con fallback a estado
    const estadosProducto = await Perfume.distinct('estado_producto');
    const estados = await Perfume.distinct('estado'); // Como fallback
    
    // MARCAS: Para filtro adicional
    const marcas = await Perfume.distinct('marca');

    // Combinar y limpiar arrays, priorizando los campos especificados
    const almacenesUnicos = [...new Set([
      ...almacenesId.filter(item => item && item.trim() !== ''),
      ...almacenesUbicacion.filter(item => item && item.trim() !== '')
    ])].sort();
    
    const categoriasUnicas = [...new Set([
      ...categorias.filter(item => item && item.trim() !== ''),
      ...categoriasAlt.filter(item => item && item.trim() !== '')
    ])].sort();
    
    const estadosUnicos = [...new Set([
      ...estadosProducto.filter(item => item && item.trim() !== ''),
      ...estados.filter(item => item && item.trim() !== '')
    ])].sort();
    
    const marcasUnicas = marcas.filter(item => item && item.trim() !== '').sort();

    console.log('✅ Opciones de filtros obtenidas exitosamente');
    console.log(`📊 Almacenes encontrados: ${almacenesUnicos.length}`);
    console.log(`📊 Categorías encontradas: ${categoriasUnicas.length}`);
    console.log(`📊 Estados encontrados: ${estadosUnicos.length}`);
    console.log(`📊 Marcas encontradas: ${marcasUnicas.length}`);

    res.json({
      success: true,
      message: 'Opciones de filtros obtenidas exitosamente',
      data: {
        almacenes: almacenesUnicos,
        categorias: categoriasUnicas,
        estados: estadosUnicos,
        marcas: marcasUnicas,
        // Información adicional para debugging
        conteos: {
          total_almacenes: almacenesUnicos.length,
          total_categorias: categoriasUnicas.length,
          total_estados: estadosUnicos.length,
          total_marcas: marcasUnicas.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo opciones de filtros:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener opciones de filtros',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// OBTENER ESTADÍSTICAS GENERALES DE PERFUMES
// ============================================================================
const obtenerEstadisticasPerfumes = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de perfumes...');

    const estadisticas = await Perfume.aggregate([
      {
        $group: {
          _id: null,
          total_perfumes: { $sum: 1 },
          stock_total: { $sum: { $ifNull: ['$stock_per', '$stock_actual'] } },
          valor_inventario: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$stock_per', '$stock_actual'] },
                { $ifNull: ['$precio_venta_per', '$precio_venta', '$precio_base'] }
              ]
            }
          },
          perfumes_bajo_stock: {
            $sum: {
              $cond: {
                if: { 
                  $lt: [
                    { $ifNull: ['$stock_per', '$stock_actual'] },
                    { $ifNull: ['$stock_minimo_per', '$stock_minimo'] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      }
    ]);

    const stats = estadisticas[0] || {
      total_perfumes: 0,
      stock_total: 0,
      valor_inventario: 0,
      perfumes_bajo_stock: 0
    };

    console.log('✅ Estadísticas obtenidas exitosamente');

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        total_perfumes: stats.total_perfumes,
        stock_total: stats.stock_total,
        valor_inventario: Math.round(stats.valor_inventario * 100) / 100,
        perfumes_bajo_stock: stats.perfumes_bajo_stock,
        porcentaje_bajo_stock: stats.total_perfumes > 0 
          ? Math.round((stats.perfumes_bajo_stock / stats.total_perfumes) * 100) 
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener estadísticas de perfumes',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  obtenerPerfumes,
  obtenerOpcionesFiltros,
  obtenerEstadisticasPerfumes
};
