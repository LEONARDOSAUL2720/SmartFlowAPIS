const User = require('../../models/User');
const OrdenCompra = require('../../models/OrdenCompra');
const Perfume = require('../../models/Perfume');
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
        const ordenObj = orden.toObject();
        return {
          _id: ordenObj._id.toString(),
          'n.orden_compra': ordenObj['n.orden_compra'] || 'SIN NÚMERO',
          estatus: ordenObj.estatus,
          // DEBUG: Mostrar todos los campos para ver qué hay
          todos_los_campos: Object.keys(ordenObj)
        };
      })
    );
    
    // Buscar la orden de compra por número de orden y hacer populate
    // Intentar múltiples variaciones del nombre del campo
    let ordenCompra = await OrdenCompra.findOne({ 'n.orden_compra': numeroOrden })
      .populate('id_perfume')
      .populate('id_proveedor');
    
    // Si no encuentra con 'n.orden_compra', intentar con otras variaciones
    if (!ordenCompra) {
      console.log('⚠️ No encontrado con "n.orden_compra", probando otras variaciones...');
      
      // Intentar con 'n_orden_compra'
      ordenCompra = await OrdenCompra.findOne({ 'n_orden_compra': numeroOrden })
        .populate('id_perfume')
        .populate('id_proveedor');
        
      if (!ordenCompra) {
        // Intentar con 'numero_orden'
        ordenCompra = await OrdenCompra.findOne({ 'numero_orden': numeroOrden })
          .populate('id_perfume')
          .populate('id_proveedor');
      }
      
      if (!ordenCompra) {
        // Búsqueda más general - buscar en todos los documentos y filtrar en JavaScript
        const todasOrdenes = await OrdenCompra.find({})
          .populate('id_perfume')
          .populate('id_proveedor');
          
        ordenCompra = todasOrdenes.find(orden => {
          const ordenObj = orden.toObject();
          // Buscar en todos los campos que puedan contener el número
          for (const [key, value] of Object.entries(ordenObj)) {
            if (value && value.toString() === numeroOrden) {
              console.log(`✅ Encontrado en campo: ${key} = ${value}`);
              return true;
            }
          }
          return false;
        });
      }
    }

    console.log('📊 Resultado de búsqueda en BD:', ordenCompra ? 'ENCONTRADO' : 'NO ENCONTRADO');
    
    if (ordenCompra) {
      const ordenObj = ordenCompra.toObject();
      console.log('✅ Datos de la orden encontrada:', {
        _id: ordenCompra._id,
        'n.orden_compra': ordenObj['n.orden_compra'] || 'NO DEFINIDO',
        estatus: ordenCompra.estatus,
        tiene_perfume: !!ordenCompra.id_perfume,
        tiene_proveedor: !!ordenCompra.id_proveedor,
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
    const ordenObj = ordenCompra.toObject();
    console.log('🔢 Número de orden:', ordenObj['n.orden_compra'] || 'NO DEFINIDO');
    console.log('🌸 Perfume:', ordenCompra.id_perfume?.name_per || 'No encontrado');
    console.log('🏢 Proveedor:', ordenCompra.id_proveedor?.nombre_proveedor || 'No encontrado');

    // Verificar que existan las referencias
    if (!ordenCompra.id_perfume) {
      console.log('⚠️ Perfume no encontrado para esta orden');
    }
    
    if (!ordenCompra.id_proveedor) {
      console.log('⚠️ Proveedor no encontrado para esta orden');
    }

    // Construir respuesta con toda la información
    const respuesta = {
      message: 'Orden de compra encontrada exitosamente',
      data: {
        orden_compra: {
          _id: ordenCompra._id,
          'n.orden_compra': ordenObj['n.orden_compra'] || numeroOrden,
          cantidad: ordenCompra.cantidad,
          precio_unitario: ordenCompra.precio_unitario,
          precio_total: ordenCompra.precio_total,
          fecha_orden: ordenCompra.fecha_orden,
          estatus: ordenCompra.estatus
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
          estado: ordenCompra.id_perfume.estado,
          // imagen_url: ordenCompra.id_perfume.imagen_url // Removido para evitar errores en Android
        } : null,
        proveedor: ordenCompra.id_proveedor ? {
          _id: ordenCompra.id_proveedor._id,
          nombre_proveedor: ordenCompra.id_proveedor.nombre_proveedor,
          rfc: ordenCompra.id_proveedor.rfc,
          contacto: ordenCompra.id_proveedor.contacto,
          telefono: ordenCompra.id_proveedor.telefono,
          email: ordenCompra.id_proveedor.email,
          direccion: ordenCompra.id_proveedor.direccion,
          fecha_registro: ordenCompra.id_proveedor.fecha_registro,
          estado: ordenCompra.id_proveedor.estado
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

module.exports = {
  getOrdenCompraCompleta
};
