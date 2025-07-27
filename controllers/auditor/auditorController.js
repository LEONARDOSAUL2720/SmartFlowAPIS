const User = require('../../models/User');
const OrdenCompra = require('../../models/OrdenCompra');
const Perfume = require('../../models/Perfume');
const Proveedor = require('../../models/Proveedor');
const { validationResult } = require('express-validator');

// Buscar orden de compra completa por ID
const getOrdenCompraCompleta = async (req, res) => {
  console.log('🔍 Búsqueda de orden de compra iniciada');
  console.log('📋 ID recibido:', req.params.id);
  console.log('🔑 Headers recibidos:', req.headers);
  console.log('👤 Usuario autenticado:', {
    id: req.user?._id,
    name: req.user?.name_user,
    role: req.user?.rol_user
  });
  
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un ObjectId válido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no tiene un formato válido'
      });
    }

    console.log('🔍 Buscando orden de compra...');
    console.log('🎯 ID procesado para búsqueda:', id);
    console.log('📏 Longitud del ID:', id.length);
    console.log('🔤 Caracteres del ID:', id.split('').map(c => c + ' (' + c.charCodeAt(0) + ')').join(', '));
    
    // DEBUG: Mostrar todas las órdenes disponibles
    const todasLasOrdenes = await OrdenCompra.find({}).limit(5);
    console.log('📋 Órdenes disponibles en BD (primeras 5):', 
      todasLasOrdenes.map(orden => ({
        _id: orden._id.toString(),
        estatus: orden.estatus
      }))
    );
    
    // Buscar la orden de compra y hacer populate de perfume y proveedor
    const ordenCompra = await OrdenCompra.findById(id)
      .populate('id_perfume')
      .populate('id_proveedor');

    console.log('📊 Resultado de búsqueda en BD:', ordenCompra ? 'ENCONTRADO' : 'NO ENCONTRADO');
    
    if (ordenCompra) {
      console.log('✅ Datos de la orden encontrada:', {
        _id: ordenCompra._id,
        estatus: ordenCompra.estatus,
        tiene_perfume: !!ordenCompra.id_perfume,
        tiene_proveedor: !!ordenCompra.id_proveedor
      });
    }

    if (!ordenCompra) {
      console.log('❌ Orden de compra no encontrada');
      return res.status(404).json({
        error: 'Orden no encontrada',
        message: 'No se encontró una orden de compra con el ID proporcionado'
      });
    }

    console.log('✅ Orden encontrada:', ordenCompra._id);
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
        id_buscado: id
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
