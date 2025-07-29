const User = require('../../models/User');
const OrdenCompra = require('../../models/OrdenCompra');
const Perfume = require('../../models/Perfume');
const Entrada = require('../../models/Entrada');  
const Proveedor = require('../../models/Proveedor');
const { validationResult } = require('express-validator');

// Buscar orden de compra completa por número de orden
const getOrdenCompraCompleta = async (req, res) => {
  console.log('🔍 Búsqueda de orden de compra iniciada');
  console.log('📋 Número de orden recibido:', req.params.id);
  console.log('🔑 Headers recibidos:', req.headers);
  console.log('👤 Usuario autenticado:', {
    id: req.user?._id,
    name: req.user?.name_user,
    role: req.user?.rol_user
  });
  
  try {
    const { id: numeroOrden } = req.params;
    
    // Validar que el número de orden no esté vacío
    if (!numeroOrden || numeroOrden.trim() === '') {
      return res.status(400).json({
        error: 'Número de orden inválido',
        message: 'El número de orden no puede estar vacío'
      });
    }

    console.log('🔍 Buscando orden de compra...');
    console.log('🎯 Número de orden procesado para búsqueda:', numeroOrden);
    console.log('📏 Longitud del número:', numeroOrden.length);
    
    // DEBUG: Mostrar todas las órdenes disponibles
    const todasLasOrdenes = await OrdenCompra.find({}).limit(5);
    console.log('📋 Órdenes disponibles en BD (primeras 5):', 
      todasLasOrdenes.map(orden => {
        return {
          _id: orden._id.toString(),
          numero_orden: orden.n_orden_compra || 'SIN NÚMERO',
          estado: orden.estado,
          // DEBUG: Mostrar todos los campos para ver qué hay
          todos_los_campos: Object.keys(orden.toObject())
        };
      })
    );
    
    // Buscar la orden de compra por número de orden y hacer populate
    let ordenCompra = await OrdenCompra.findOne({ n_orden_compra: numeroOrden })
      .populate('id_perfume')
      .populate('proveedor')
      .populate('usuario_solicitante', 'name_user correo_user rol_user');
    
    // Si no encuentra, intentar con otras variaciones por compatibilidad
    if (!ordenCompra) {
      console.log('⚠️ No encontrado con "n_orden_compra", probando otras variaciones...');
      
      // Intentar con punto (por si acaso)
      ordenCompra = await OrdenCompra.findOne({ 'n.orden_compra': numeroOrden })
        .populate('id_perfume')
        .populate('proveedor')
        .populate('usuario_solicitante', 'name_user correo_user rol_user');
        
      if (!ordenCompra) {
        // Intentar con 'numero_orden'
        ordenCompra = await OrdenCompra.findOne({ 'numero_orden': numeroOrden })
          .populate('id_perfume')
          .populate('proveedor')
          .populate('usuario_solicitante', 'name_user correo_user rol_user');
      }
    }

    console.log('📊 Resultado de búsqueda en BD:', ordenCompra ? 'ENCONTRADO' : 'NO ENCONTRADO');
    
    if (ordenCompra) {
      const ordenObj = ordenCompra.toObject();
      console.log('✅ Datos de la orden encontrada:', {
        _id: ordenCompra._id,
        numero_orden: ordenCompra.n_orden_compra || 'NO DEFINIDO',
        estado: ordenCompra.estado,
        tiene_perfume: !!ordenCompra.id_perfume,
        tiene_proveedor: !!ordenCompra.proveedor,
        tiene_usuario_solicitante: !!ordenCompra.usuario_solicitante,
        // DEBUG: Mostrar todos los campos
        todos_los_campos: Object.keys(ordenObj)
      });
    }

    if (!ordenCompra) {
      console.log('❌ Orden de compra no encontrada');
      return res.status(404).json({
        error: 'Orden no encontrada',
        message: `No se encontró una orden de compra con el número: ${numeroOrden}`
      });
    }

    console.log('✅ Orden encontrada:', ordenCompra._id);
    console.log('🔢 Número de orden:', ordenCompra.n_orden_compra || 'NO DEFINIDO');
    console.log('🌸 Perfume:', ordenCompra.id_perfume?.name_per || 'No encontrado');
    console.log('🏢 Proveedor:', ordenCompra.proveedor?.nombre_proveedor || 'No encontrado');
    console.log('👤 Usuario solicitante:', ordenCompra.usuario_solicitante?.name_user || 'No encontrado');

    // Verificar que existan las referencias
    if (!ordenCompra.id_perfume) {
      console.log('⚠️ Perfume no encontrado para esta orden');
    }
    
    if (!ordenCompra.proveedor) {
      console.log('⚠️ Proveedor no encontrado para esta orden');
    }

    if (!ordenCompra.usuario_solicitante) {
      console.log('⚠️ Usuario solicitante no encontrado para esta orden');
    }

    // Construir respuesta con toda la información actualizada para tu nueva estructura
    const respuesta = {
      message: 'Orden de compra encontrada exitosamente',
      data: {
        orden_compra: {
          _id: ordenCompra._id,
          n_orden_compra: ordenCompra.n_orden_compra || numeroOrden,
          cantidad: ordenCompra.cantidad,
          precio_unitario: ordenCompra.precio_unitario,
          precio_total: ordenCompra.precio_total,
          fecha: ordenCompra.fecha,
          estado: ordenCompra.estado,
          observaciones: ordenCompra.observaciones
        },
        perfume: ordenCompra.id_perfume ? {
          _id: ordenCompra.id_perfume._id,
          name_per: ordenCompra.id_perfume.name_per,
          descripcion_per: ordenCompra.id_perfume.descripcion_per,
          categoria_per: ordenCompra.id_perfume.categoria_per,
          precio_venta_per: ordenCompra.id_perfume.precio_venta_per,
          stock_per: ordenCompra.id_perfume.stock_per,
          stock_minimo_per: ordenCompra.id_perfume.stock_minimo_per,
          ubicacion_per: ordenCompra.id_perfume.ubicacion_per,
          fecha_expiracion: ordenCompra.id_perfume.fecha_expiracion,
          estado: ordenCompra.id_perfume.estado
        } : null,
        proveedor: ordenCompra.proveedor ? {
          _id: ordenCompra.proveedor._id,
          nombre_proveedor: ordenCompra.proveedor.nombre_proveedor,
          rfc: ordenCompra.proveedor.rfc,
          contacto: ordenCompra.proveedor.contacto,
          telefono: ordenCompra.proveedor.telefono,
          email: ordenCompra.proveedor.email,
          direccion: ordenCompra.proveedor.direccion,
          estado: ordenCompra.proveedor.estado
        } : null,
        usuario_solicitante: ordenCompra.usuario_solicitante ? {
          _id: ordenCompra.usuario_solicitante._id,
          name_user: ordenCompra.usuario_solicitante.name_user,
          correo_user: ordenCompra.usuario_solicitante.correo_user,
          rol_user: ordenCompra.usuario_solicitante.rol_user
        } : null
      },
      debug: {
        timestamp: new Date().toISOString(),
        auditor: req.user.name_user,
        numero_orden_buscado: numeroOrden
      }
    };

    console.log('🎉 Respuesta construida exitosamente');
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error en búsqueda de orden:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al buscar la orden de compra',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Buscar entrada completa por número de entrada CON validación cruzada
const getEntradaCompleta = async (req, res) => {
  console.log('🔍 Búsqueda de entrada iniciada');
  console.log('📋 Número de entrada recibido:', req.params.id);
  
  try {
    const { id: numeroEntrada } = req.params;
    
    if (!numeroEntrada || numeroEntrada.trim() === '') {
      return res.status(400).json({
        error: 'Número de entrada inválido',
        message: 'El número de entrada no puede estar vacío'
      });
    }

    // 1. Buscar la entrada PRIMERO sin populate del proveedor para ver qué tipo de dato es
    let entrada = await Entrada.findOne({ numero_entrada: numeroEntrada })
      .populate('id_perfume')
      .populate('usuario_registro', 'name_user correo_user rol_user')
      .populate('validado_por', 'name_user correo_user rol_user')
      .populate('almacen_origen', 'nombre_almacen ubicacion')
      .populate('almacen_destino', 'nombre_almacen ubicacion');

    if (!entrada) {
      return res.status(404).json({
        error: 'Entrada no encontrada',
        message: `No se encontró una entrada con el número: ${numeroEntrada}`
      });
    }

    console.log('✅ Entrada encontrada:', entrada._id);
    console.log('🔍 DEBUG - Tipo de proveedor:', typeof entrada.proveedor);
    console.log('🔍 DEBUG - Valor proveedor:', entrada.proveedor);

    // Intentar poblar el proveedor si es un ObjectId
    let proveedorData = null;
    if (entrada.proveedor) {
      try {
        // Si es un ObjectId, intentar populate manual
        if (typeof entrada.proveedor === 'object' && entrada.proveedor.toString().match(/^[0-9a-fA-F]{24}$/)) {
          console.log('🔍 Proveedor es ObjectId, poblando...');
          proveedorData = await Proveedor.findById(entrada.proveedor);
        } else if (typeof entrada.proveedor === 'string' && entrada.proveedor.match(/^[0-9a-fA-F]{24}$/)) {
          console.log('🔍 Proveedor es String ObjectId, poblando...');
          proveedorData = await Proveedor.findById(entrada.proveedor);
        } else {
          console.log('🔍 Proveedor es String nombre, buscando por nombre...');
          proveedorData = await Proveedor.findOne({ nombre_proveedor: entrada.proveedor });
        }
      } catch (error) {
        console.log('⚠️ Error poblando proveedor:', error.message);
      }
    }

    console.log('🔍 DEBUG - Datos de entrada:');
    console.log('  - ID Perfume:', entrada.id_perfume?._id);
    console.log('  - Proveedor encontrado:', proveedorData ? proveedorData.nombre_proveedor : 'No encontrado');

    // 2. Buscar la orden de compra relacionada por el mismo perfume y proveedor
    let ordenCompraRelacionada = null;
    if (entrada.id_perfume && proveedorData) {
      console.log('🔍 Buscando órdenes de compra con perfume:', entrada.id_perfume._id);
      
      // Buscar orden de compra que tenga el mismo perfume
      const ordenesCompra = await OrdenCompra.find({ 
        id_perfume: entrada.id_perfume._id 
      }).populate('id_perfume').populate('proveedor');  // CORREGIDO: 'proveedor' en lugar de 'id_proveedor'

      console.log(`📋 Órdenes encontradas para perfume ${entrada.id_perfume.name_per}:`, ordenesCompra.length);
      
      // DEBUG: Mostrar todas las órdenes encontradas
      ordenesCompra.forEach((orden, index) => {
        const ordenObj = orden.toObject();
        console.log(`  Orden ${index + 1}:`);
        console.log(`    - ID: ${orden._id}`);
        console.log(`    - Número: ${orden.n_orden_compra}`); // CORREGIDO: sin punto
        console.log(`    - Todos los campos:`, Object.keys(ordenObj));
        console.log(`    - proveedor: ${orden.proveedor}`);
        console.log(`    - proveedor poblado: ${orden.proveedor?.nombre_proveedor || 'NO'}`);
        
        // Verificar qué proveedor usar para la comparación
        const proveedorOrden = orden.proveedor;  // CORREGIDO: solo usar 'proveedor'
        console.log(`    - Proveedor para comparar:`, proveedorOrden?._id);
        console.log(`    - Coincide ID? ${proveedorOrden?._id?.toString() === proveedorData._id.toString()}`);
      });

      // Buscar una orden cuyo proveedor coincida con el proveedor de la entrada (por ObjectId)
      ordenCompraRelacionada = ordenesCompra.find(orden => {
        return orden.proveedor?._id?.toString() === proveedorData._id.toString();  // CORREGIDO: solo 'proveedor'
      });

      console.log('✅ Orden relacionada:', ordenCompraRelacionada ? 'ENCONTRADA' : 'NO ENCONTRADA');
      if (ordenCompraRelacionada) {
        console.log('📋 Datos de orden encontrada:');
        console.log(`  - ID: ${ordenCompraRelacionada._id}`);
        console.log(`  - Número: ${ordenCompraRelacionada.n_orden_compra}`); // CORREGIDO: sin punto
        console.log(`  - Proveedor: ${ordenCompraRelacionada.id_proveedor?.nombre_proveedor}`);
      }
    }

    // 3. Realizar validaciones cruzadas
    const validaciones = {
      perfume_coincide: true,
      proveedor_coincide: false,
      cantidad_valida: true,
      fecha_coherente: true,
      precio_coherente: true,
      discrepancias: [],
      advertencias: []
    };

    if (ordenCompraRelacionada) {
      // Validar proveedor
      const proveedorOrden = ordenCompraRelacionada.proveedor;  // CORREGIDO: solo 'proveedor'
      const proveedorOrdenId = proveedorOrden?._id?.toString();
      const proveedorEntradaId = proveedorData?._id?.toString();
      const proveedorOrdenNombre = proveedorOrden?.nombre_proveedor || '';
      const proveedorEntradaNombre = proveedorData?.nombre_proveedor || '';
      
      console.log('🔍 Validando proveedores:');
      console.log(`  - Orden ID: ${proveedorOrdenId}`);
      console.log(`  - Entrada ID: ${proveedorEntradaId}`);
      console.log(`  - Orden Nombre: ${proveedorOrdenNombre}`);
      console.log(`  - Entrada Nombre: ${proveedorEntradaNombre}`);
      
      if (proveedorOrdenId !== proveedorEntradaId) {
        validaciones.proveedor_coincide = false;
        validaciones.discrepancias.push({
          tipo: 'PROVEEDOR_DIFERENTE',
          mensaje: `Proveedor en orden: "${proveedorOrdenNombre}" vs Proveedor en entrada: "${proveedorEntradaNombre}"`,
          gravedad: 'ALTA'
        });
      } else {
        validaciones.proveedor_coincide = true;
      }

      // Validar cantidad (la entrada no debería exceder la orden)
      if (entrada.cantidad > ordenCompraRelacionada.cantidad) {
        validaciones.cantidad_valida = false;
        validaciones.discrepancias.push({
          tipo: 'CANTIDAD_EXCESIVA',
          mensaje: `Cantidad en entrada (${entrada.cantidad}) excede cantidad en orden (${ordenCompraRelacionada.cantidad})`,
          gravedad: 'ALTA'
        });
      } else if (entrada.cantidad < ordenCompraRelacionada.cantidad) {
        validaciones.advertencias.push({
          tipo: 'CANTIDAD_PARCIAL',
          mensaje: `Entrada parcial: ${entrada.cantidad} de ${ordenCompraRelacionada.cantidad} unidades`,
          gravedad: 'MEDIA'
        });
      }

      // Validar coherencia de fechas
      const fechaOrden = new Date(ordenCompraRelacionada.fecha_orden);
      const fechaEntrada = new Date(entrada.fecha_entrada);
      
      if (fechaEntrada < fechaOrden) {
        validaciones.fecha_coherente = false;
        validaciones.discrepancias.push({
          tipo: 'FECHA_INCOHERENTE',
          mensaje: `Fecha de entrada (${fechaEntrada.toLocaleDateString()}) anterior a fecha de orden (${fechaOrden.toLocaleDateString()})`,
          gravedad: 'MEDIA'
        });
      }

      // Validar coherencia de precios (si la entrada tiene precio)
      if (entrada.precio_unitario && ordenCompraRelacionada.precio_unitario) {
        const diferenciaPorcentaje = Math.abs(entrada.precio_unitario - ordenCompraRelacionada.precio_unitario) / ordenCompraRelacionada.precio_unitario * 100;
        
        if (diferenciaPorcentaje > 10) { // Más del 10% de diferencia
          validaciones.precio_coherente = false;
          validaciones.discrepancias.push({
            tipo: 'PRECIO_DIFERENTE',
            mensaje: `Precio unitario en entrada ($${entrada.precio_unitario}) difiere significativamente del precio en orden ($${ordenCompraRelacionada.precio_unitario})`,
            gravedad: 'MEDIA'
          });
        }
      }
    } else {
      validaciones.advertencias.push({
        tipo: 'SIN_ORDEN_RELACIONADA',
        mensaje: 'No se encontró una orden de compra relacionada para validar',
        gravedad: 'MEDIA'
      });
    }

    // 4. Determinar estado general de validación
    const tieneDiscrepanciasAltas = validaciones.discrepancias.some(d => d.gravedad === 'ALTA');
    const estadoValidacion = tieneDiscrepanciasAltas ? 'REQUIERE_REVISION' : 
                           validaciones.discrepancias.length > 0 ? 'CON_OBSERVACIONES' : 'VALIDA';

    // 5. Construir respuesta
    const respuesta = {
      message: 'Entrada encontrada exitosamente',
      data: {
        entrada: {
          _id: entrada._id,
          numero_entrada: entrada.numero_entrada,
          cantidad: entrada.cantidad,
          proveedor: proveedorData ? {
            _id: proveedorData._id,
            nombre_proveedor: proveedorData.nombre_proveedor,
            rfc: proveedorData.rfc,
            contacto: proveedorData.contacto,
            telefono: proveedorData.telefono,
            email: proveedorData.email,
            direccion: proveedorData.direccion,
            estado: proveedorData.estado
          } : {
            valor_original: entrada.proveedor,
            tipo: typeof entrada.proveedor,
            mensaje: "Proveedor no encontrado o formato incorrecto"
          },
          fecha_entrada: entrada.fecha_entrada,
          estatus_validacion: entrada.estatus_validacion,
          observaciones_auditor: entrada.observaciones_auditor,
          tipo: entrada.tipo,
          fecha: entrada.fecha,
          fecha_validacion: entrada.fecha_validacion
        },
        perfume: entrada.id_perfume ? {
          _id: entrada.id_perfume._id,
          name_per: entrada.id_perfume.name_per,
          descripcion_per: entrada.id_perfume.descripcion_per,
          categoria_per: entrada.id_perfume.categoria_per,
          precio_venta_per: entrada.id_perfume.precio_venta_per,
          stock_per: entrada.id_perfume.stock_per,
          stock_minimo_per: entrada.id_perfume.stock_minimo_per,
          ubicacion_per: entrada.id_perfume.ubicacion_per,
          fecha_expiracion: entrada.id_perfume.fecha_expiracion,
          estado: entrada.id_perfume.estado
        } : null,
        orden_compra_relacionada: ordenCompraRelacionada ? {
          _id: ordenCompraRelacionada._id,
          numero_orden: ordenCompraRelacionada.n_orden_compra, // CORREGIDO: sin punto y nombre más claro
          cantidad: ordenCompraRelacionada.cantidad,
          precio_unitario: ordenCompraRelacionada.precio_unitario,
          precio_total: ordenCompraRelacionada.precio_total,
          fecha_orden: ordenCompraRelacionada.fecha,
          estado: ordenCompraRelacionada.estado,
          observaciones: ordenCompraRelacionada.observaciones
        } : null,
        proveedor_detalle: ordenCompraRelacionada?.proveedor ? {  // CORREGIDO: solo 'proveedor'
          _id: ordenCompraRelacionada.proveedor._id,
          nombre_proveedor: ordenCompraRelacionada.proveedor.nombre_proveedor,
          rfc: ordenCompraRelacionada.proveedor.rfc,
          contacto: ordenCompraRelacionada.proveedor.contacto,
          telefono: ordenCompraRelacionada.proveedor.telefono,
          email: ordenCompraRelacionada.proveedor.email,
          direccion: ordenCompraRelacionada.proveedor.direccion,
          estado: ordenCompraRelacionada.proveedor.estado
        } : proveedorData ? {
          _id: proveedorData._id,
          nombre_proveedor: proveedorData.nombre_proveedor,
          rfc: proveedorData.rfc,
          contacto: proveedorData.contacto,
          telefono: proveedorData.telefono,
          email: proveedorData.email,
          direccion: proveedorData.direccion,
          estado: proveedorData.estado
        } : null,
        validacion: {
          estado_general: estadoValidacion,
          perfume_coincide: validaciones.perfume_coincide,
          proveedor_coincide: validaciones.proveedor_coincide,
          cantidad_valida: validaciones.cantidad_valida,
          fecha_coherente: validaciones.fecha_coherente,
          precio_coherente: validaciones.precio_coherente,
          total_discrepancias: validaciones.discrepancias.length,
          total_advertencias: validaciones.advertencias.length,
          discrepancias: validaciones.discrepancias,
          advertencias: validaciones.advertencias
        }
      }
    };

    console.log('🎉 Respuesta con validación construida exitosamente');
    console.log('📊 Estado de validación:', estadoValidacion);
    console.log('⚠️ Discrepancias encontradas:', validaciones.discrepancias.length);
    
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error en búsqueda de entrada:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al buscar la entrada'
    });
  }
};

module.exports = {
  getOrdenCompraCompleta,
  getEntradaCompleta
};
