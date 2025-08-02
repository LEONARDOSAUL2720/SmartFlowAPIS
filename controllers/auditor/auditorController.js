const User = require('../../models/User');
const OrdenCompra = require('../../models/OrdenCompra');
const Perfume = require('../../models/Perfume');
const Entrada = require('../../models/Entrada');  
const Proveedor = require('../../models/Proveedor');
const Traspaso = require('../../models/Traspaso');
const Almacen = require('../../models/Almacen');
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
          observaciones: ordenCompra.observaciones,
          almacen: ordenCompra.almacen
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

    // 3. Realizar validaciones cruzadas detalladas
    const validaciones = {
      perfume_coincide: true,
      proveedor_coincide: false,
      cantidad_valida: true,
      fecha_coherente: true,
      precio_coherente: true,
      estado_orden_valido: true,
      discrepancias: [],
      advertencias: [],
      recomendaciones: []
    };

    if (ordenCompraRelacionada) {
      console.log('🔍 Iniciando validaciones cruzadas detalladas...');
      
      // ========== VALIDACIÓN 1: PROVEEDOR ==========
      const proveedorOrden = ordenCompraRelacionada.proveedor;
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
          categoria: 'CRÍTICO',
          titulo: '❌ Proveedor no coincide',
          descripcion: `El proveedor de la entrada no coincide con el de la orden de compra`,
          detalles: {
            proveedor_orden: {
              id: proveedorOrdenId,
              nombre: proveedorOrdenNombre,
              rfc: proveedorOrden?.rfc || 'N/A'
            },
            proveedor_entrada: {
              id: proveedorEntradaId,
              nombre: proveedorEntradaNombre,
              rfc: proveedorData?.rfc || 'N/A'
            }
          },
          impacto: 'ALTO',
          razon: 'La mercancía recibida no corresponde al proveedor autorizado en la orden de compra',
          que_hacer: 'RECHAZAR ENTRADA',
          acciones_sugeridas: [
            '1. Verificar si la mercancía fue enviada por el proveedor correcto',
            '2. Contactar al proveedor autorizado para confirmar el envío',
            '3. Si es error del proveedor, solicitar corrección de documentos',
            '4. Si es mercancía de otro proveedor, crear nueva orden de compra'
          ],
          puede_continuar: false,
          gravedad: 'ALTA'
        });
      } else {
        validaciones.proveedor_coincide = true;
        validaciones.recomendaciones.push({
          tipo: 'PROVEEDOR_CORRECTO',
          mensaje: '✅ Proveedor coincide correctamente con la orden de compra'
        });
      }

      // ========== VALIDACIÓN 2: CANTIDAD ==========
      const cantidadOrden = ordenCompraRelacionada.cantidad;
      const cantidadEntrada = entrada.cantidad;
      const porcentajeRecibido = (cantidadEntrada / cantidadOrden) * 100;

      if (cantidadEntrada > cantidadOrden) {
        validaciones.cantidad_valida = false;
        const exceso = cantidadEntrada - cantidadOrden;
        validaciones.discrepancias.push({
          tipo: 'CANTIDAD_EXCESIVA',
          categoria: 'CRÍTICO',
          titulo: '❌ Cantidad excede lo ordenado',
          descripcion: `Se recibió más mercancía de la solicitada en la orden`,
          detalles: {
            cantidad_ordenada: cantidadOrden,
            cantidad_recibida: cantidadEntrada,
            exceso: exceso,
            porcentaje_exceso: ((exceso / cantidadOrden) * 100).toFixed(2) + '%'
          },
          impacto: 'ALTO',
          razon: 'El inventario y costos no coincidirán con lo presupuestado',
          que_hacer: 'REVISAR INMEDIATAMENTE',
          acciones_sugeridas: [
            '1. Verificar si el proveedor envió mercancía adicional por error',
            '2. Contactar al proveedor para aclarar el exceso',
            '3. Determinar si se acepta o rechaza la mercancía adicional',
            '4. Si se acepta, crear orden de compra adicional para el exceso',
            '5. Ajustar la facturación con el proveedor'
          ],
          puede_continuar: false,
          gravedad: 'ALTA'
        });
      } else if (cantidadEntrada < cantidadOrden) {
        const faltante = cantidadOrden - cantidadEntrada;
        const porcentajeFaltante = (faltante / cantidadOrden) * 100;
        
        if (porcentajeFaltante > 50) {
          validaciones.cantidad_valida = false;
          validaciones.discrepancias.push({
            tipo: 'CANTIDAD_FALTANTE_CRITICA',
            categoria: 'CRÍTICO',
            titulo: '⚠️ Cantidad faltante crítica',
            descripcion: `Se recibió menos del 50% de lo ordenado`,
            detalles: {
              cantidad_ordenada: cantidadOrden,
              cantidad_recibida: cantidadEntrada,
              faltante: faltante,
              porcentaje_recibido: porcentajeRecibido.toFixed(2) + '%',
              porcentaje_faltante: porcentajeFaltante.toFixed(2) + '%'
            },
            impacto: 'ALTO',
            razon: 'Puede indicar problemas serios con el proveedor o el envío',
            que_hacer: 'INVESTIGAR CAUSA',
            acciones_sugeridas: [
              '1. Contactar inmediatamente al proveedor',
              '2. Verificar si es un envío parcial programado',
              '3. Solicitar fecha de envío del faltante',
              '4. Evaluar impacto en operaciones',
              '5. Considerar proveedor alternativo si es necesario'
            ],
            puede_continuar: true,
            observacion_especial: 'Se puede procesar como entrada parcial',
            gravedad: 'ALTA'
          });
        } else {
          validaciones.advertencias.push({
            tipo: 'CANTIDAD_PARCIAL',
            categoria: 'MODERADO',
            titulo: '📦 Entrada parcial detectada',
            descripcion: `Se recibió ${porcentajeRecibido.toFixed(1)}% de lo ordenado`,
            detalles: {
              cantidad_ordenada: cantidadOrden,
              cantidad_recibida: cantidadEntrada,
              faltante: faltante,
              porcentaje_recibido: porcentajeRecibido.toFixed(2) + '%'
            },
            impacto: 'MEDIO',
            razon: 'Envío parcial normal del proveedor',
            que_hacer: 'PROCESAR NORMALMENTE',
            acciones_sugeridas: [
              '1. Registrar la entrada parcial',
              '2. Mantener orden abierta para recibir el faltante',
              '3. Hacer seguimiento con el proveedor',
              '4. Actualizar el estado de la orden a "Parcialmente Recibida"'
            ],
            puede_continuar: true,
            gravedad: 'MEDIA'
          });
        }
      } else {
        validaciones.recomendaciones.push({
          tipo: 'CANTIDAD_EXACTA',
          mensaje: '✅ Cantidad recibida coincide exactamente con lo ordenado'
        });
      }

      // ========== VALIDACIÓN 3: FECHAS ==========
      const fechaOrden = new Date(ordenCompraRelacionada.fecha);
      const fechaEntrada = new Date(entrada.fecha_entrada);
      const diasDiferencia = Math.ceil((fechaEntrada - fechaOrden) / (1000 * 60 * 60 * 24));
      
      if (fechaEntrada < fechaOrden) {
        validaciones.fecha_coherente = false;
        const diasAtras = Math.abs(diasDiferencia);
        validaciones.discrepancias.push({
          tipo: 'FECHA_ANTERIOR_ORDEN',
          categoria: 'CRÍTICO',
          titulo: '📅 Fecha de entrada inválida',
          descripcion: `La entrada está fechada antes que la orden de compra`,
          detalles: {
            fecha_orden: fechaOrden.toLocaleDateString('es-MX'),
            fecha_entrada: fechaEntrada.toLocaleDateString('es-MX'),
            dias_diferencia: diasAtras,
            orden_iso: fechaOrden.toISOString(),
            entrada_iso: fechaEntrada.toISOString()
          },
          impacto: 'ALTO',
          razon: 'Es imposible recibir mercancía antes de haberla ordenado',
          que_hacer: 'CORREGIR FECHA',
          acciones_sugeridas: [
            '1. Verificar la fecha real de recepción',
            '2. Corregir la fecha en el sistema',
            '3. Si es correcta, revisar la fecha de la orden',
            '4. Documentar la razón de la discrepancia temporal'
          ],
          puede_continuar: false,
          gravedad: 'ALTA'
        });
      } else if (diasDiferencia > 30) {
        validaciones.advertencias.push({
          tipo: 'FECHA_TARDÍA',
          categoria: 'MODERADO',
          titulo: '⏰ Entrada tardía detectada',
          descripcion: `La mercancía llegó ${diasDiferencia} días después de la orden`,
          detalles: {
            fecha_orden: fechaOrden.toLocaleDateString('es-MX'),
            fecha_entrada: fechaEntrada.toLocaleDateString('es-MX'),
            dias_retraso: diasDiferencia,
            es_tardio: diasDiferencia > 30
          },
          impacto: 'MEDIO',
          razon: 'Posible retraso en la entrega del proveedor',
          que_hacer: 'EVALUAR PROVEEDOR',
          acciones_sugeridas: [
            '1. Registrar el retraso en el historial del proveedor',
            '2. Evaluar el impacto en las operaciones',
            '3. Solicitar explicación al proveedor',
            '4. Considerar penalizaciones según contrato'
          ],
          puede_continuar: true,
          gravedad: 'MEDIA'
        });
      } else {
        validaciones.recomendaciones.push({
          tipo: 'FECHA_APROPIADA',
          mensaje: `✅ Tiempo de entrega apropiado (${diasDiferencia} días)`
        });
      }

      // ========== VALIDACIÓN 4: ESTADO DE LA ORDEN ==========
      const estadoOrden = ordenCompraRelacionada.estado;
      if (estadoOrden === 'Completada') {
        validaciones.estado_orden_valido = false;
        validaciones.discrepancias.push({
          tipo: 'ORDEN_YA_COMPLETADA',
          categoria: 'CRÍTICO',
          titulo: '🔒 Orden ya procesada',
          descripcion: `Esta orden de compra ya fue marcada como completada`,
          detalles: {
            numero_orden: ordenCompraRelacionada.n_orden_compra,
            estado_actual: estadoOrden,
            observaciones_orden: ordenCompraRelacionada.observaciones
          },
          impacto: 'ALTO',
          razon: 'No se puede procesar una entrada contra una orden ya cerrada',
          que_hacer: 'REVISAR DUPLICADO',
          acciones_sugeridas: [
            '1. Verificar si esta entrada ya fue procesada anteriormente',
            '2. Buscar en el historial de entradas del mismo número',
            '3. Si es mercancía adicional, crear nueva orden de compra',
            '4. Si es error, corregir el estado de la orden original'
          ],
          puede_continuar: false,
          gravedad: 'ALTA'
        });
      } else if (estadoOrden === 'Cancelada') {
        validaciones.estado_orden_valido = false;
        validaciones.discrepancias.push({
          tipo: 'ORDEN_CANCELADA',
          categoria: 'CRÍTICO',
          titulo: '❌ Orden cancelada',
          descripcion: `Esta orden de compra fue cancelada`,
          detalles: {
            numero_orden: ordenCompraRelacionada.n_orden_compra,
            estado_actual: estadoOrden,
            observaciones_orden: ordenCompraRelacionada.observaciones
          },
          impacto: 'ALTO',
          razon: 'No se puede recibir mercancía de una orden cancelada',
          que_hacer: 'RECHAZAR ENTRADA',
          acciones_sugeridas: [
            '1. Confirmar que la orden fue cancelada correctamente',
            '2. Contactar al proveedor sobre el envío no autorizado',
            '3. Si el envío es legítimo, reactivar o crear nueva orden',
            '4. Documentar la razón del envío no autorizado'
          ],
          puede_continuar: false,
          gravedad: 'ALTA'
        });
      }

      // ========== VALIDACIÓN 5: PRECIOS (si disponible) ==========
      if (entrada.precio_unitario && ordenCompraRelacionada.precio_unitario) {
        const precioOrden = ordenCompraRelacionada.precio_unitario;
        const precioEntrada = entrada.precio_unitario;
        const diferencia = Math.abs(precioEntrada - precioOrden);
        const diferenciaPorcentaje = (diferencia / precioOrden) * 100;
        
        if (diferenciaPorcentaje > 15) {
          validaciones.precio_coherente = false;
          validaciones.discrepancias.push({
            tipo: 'PRECIO_SIGNIFICATIVAMENTE_DIFERENTE',
            categoria: 'IMPORTANTE',
            titulo: '💰 Precio muy diferente al ordenado',
            descripcion: `El precio unitario difiere en ${diferenciaPorcentaje.toFixed(1)}% del ordenado`,
            detalles: {
              precio_ordenado: precioOrden,
              precio_recibido: precioEntrada,
              diferencia_absoluta: diferencia,
              diferencia_porcentual: diferenciaPorcentaje.toFixed(2) + '%',
              impacto_total: (diferencia * cantidadEntrada).toFixed(2)
            },
            impacto: 'ALTO',
            razon: 'Diferencia significativa puede indicar error en facturación',
            que_hacer: 'REVISAR FACTURACIÓN',
            acciones_sugeridas: [
              '1. Verificar la factura del proveedor',
              '2. Comparar con el precio acordado en la orden',
              '3. Contactar al área de compras',
              '4. Solicitar aclaración al proveedor',
              '5. Documentar cualquier cambio de precio autorizado'
            ],
            puede_continuar: true,
            observacion_especial: 'Revisar antes de aprobar el pago',
            gravedad: 'MEDIA'
          });
        } else if (diferenciaPorcentaje > 5) {
          validaciones.advertencias.push({
            tipo: 'PRECIO_LIGERAMENTE_DIFERENTE',
            categoria: 'MENOR',
            titulo: '💱 Precio ligeramente diferente',
            descripcion: `Pequeña diferencia de precio (${diferenciaPorcentaje.toFixed(1)}%)`,
            detalles: {
              precio_ordenado: precioOrden,
              precio_recibido: precioEntrada,
              diferencia_porcentual: diferenciaPorcentaje.toFixed(2) + '%'
            },
            puede_continuar: true,
            gravedad: 'BAJA'
          });
        }
      }
    } else {
      validaciones.discrepancias.push({
        tipo: 'SIN_ORDEN_RELACIONADA',
        categoria: 'CRÍTICO',
        titulo: '📋 Sin orden de compra relacionada',
        descripcion: 'No se encontró una orden de compra que corresponda a esta entrada',
        detalles: {
          perfume_entrada: entrada.id_perfume?.name_per,
          proveedor_entrada: proveedorData?.nombre_proveedor,
          busqueda_realizada: {
            por_perfume: true,
            por_proveedor: true,
            ordenes_encontradas_perfume: 'Se especificará en logs'
          }
        },
        impacto: 'ALTO',
        razon: 'No se puede validar la legitimidad de la entrada sin orden de respaldo',
        que_hacer: 'CREAR ORDEN RETROACTIVA O RECHAZAR',
        acciones_sugeridas: [
          '1. Verificar si existe una orden con diferente número',
          '2. Consultar con el área de compras',
          '3. Si es legítima, crear orden de compra retroactiva',
          '4. Si no es autorizada, rechazar la entrada',
          '5. Implementar controles para evitar entradas sin orden'
        ],
        puede_continuar: false,
        gravedad: 'ALTA'
      });
    }

    // 4. Determinar estado general de validación con criterios específicos
    const discrepanciasCriticas = validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO');
    const discrepanciasImportantes = validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE');
    const noSePuedeContinuar = validaciones.discrepancias.some(d => !d.puede_continuar);
    
    let estadoValidacion, colorEstado, iconoEstado, mensajeAuditor, accionRecomendada;
    
    if (discrepanciasCriticas.length > 0 || noSePuedeContinuar) {
      estadoValidacion = 'RECHAZADA';
      colorEstado = '#dc3545'; // Rojo
      iconoEstado = '❌';
      mensajeAuditor = `Entrada RECHAZADA: Se encontraron ${discrepanciasCriticas.length} discrepancias críticas que impiden el procesamiento.`;
      accionRecomendada = 'NO_PROCESAR';
    } else if (discrepanciasImportantes.length > 0) {
      estadoValidacion = 'REQUIERE_REVISION_GERENCIAL';
      colorEstado = '#fd7e14'; // Naranja
      iconoEstado = '⚠️';
      mensajeAuditor = `Entrada requiere APROBACIÓN GERENCIAL: Se encontraron discrepancias importantes que necesitan autorización superior.`;
      accionRecomendada = 'ESCALAR_GERENCIA';
    } else if (validaciones.discrepancias.length > 0 || validaciones.advertencias.some(a => a.gravedad === 'MEDIA')) {
      estadoValidacion = 'CONDICIONAL';
      colorEstado = '#ffc107'; // Amarillo
      iconoEstado = '⚡';
      mensajeAuditor = `Entrada CONDICIONAL: Se encontraron observaciones menores. Puede procesarse con seguimiento.`;
      accionRecomendada = 'PROCESAR_CON_OBSERVACIONES';
    } else {
      estadoValidacion = 'APROBADA';
      colorEstado = '#28a745'; // Verde
      iconoEstado = '✅';
      mensajeAuditor = `Entrada APROBADA: Todas las validaciones fueron exitosas. Procesar normalmente.`;
      accionRecomendada = 'PROCESAR_NORMAL';
    }

    // Generar resumen ejecutivo para el auditor
    const resumenEjecutivo = {
      estado: estadoValidacion,
      color: colorEstado,
      icono: iconoEstado,
      mensaje_principal: mensajeAuditor,
      accion_recomendada: accionRecomendada,
      total_discrepancias: validaciones.discrepancias.length,
      total_advertencias: validaciones.advertencias.length,
      puede_procesar: !noSePuedeContinuar,
      requiere_supervision: discrepanciasCriticas.length > 0 || discrepanciasImportantes.length > 0,
      puntos_criticos: discrepanciasCriticas.map(d => d.titulo),
      siguiente_paso: obtenerSiguientePaso(estadoValidacion, validaciones),
      tiempo_estimado_resolucion: estimarTiempoResolucion(validaciones)
    };

    // Función auxiliar para determinar siguiente paso
    function obtenerSiguientePaso(estado, validaciones) {
      switch(estado) {
        case 'RECHAZADA':
          return 'Contactar al proveedor y/o área de compras para resolver discrepancias críticas';
        case 'REQUIERE_REVISION_GERENCIAL':
          return 'Elevar a gerencia con documentación de discrepancias para aprobación';
        case 'CONDICIONAL':
          return 'Procesar entrada documentando las observaciones para seguimiento';
        case 'APROBADA':
          return 'Procesar entrada inmediatamente';
        default:
          return 'Revisar validaciones nuevamente';
      }
    }

    // Función auxiliar para estimar tiempo de resolución
    function estimarTiempoResolucion(validaciones) {
      const criticas = validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO').length;
      const importantes = validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE').length;
      
      if (criticas > 0) {
        return '2-5 días hábiles (requiere coordinación con proveedores)';
      } else if (importantes > 0) {
        return '1-2 días hábiles (requiere aprobación gerencial)';
      } else if (validaciones.advertencias.length > 0) {
        return 'Inmediato (solo documentación)';
      } else {
        return 'Inmediato (sin restricciones)';
      }
    }

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
          // Resumen ejecutivo para el auditor
          resumen_ejecutivo: resumenEjecutivo,
          
          // Estados individuales de validación
          estado_general: estadoValidacion,
          perfume_coincide: validaciones.perfume_coincide,
          proveedor_coincide: validaciones.proveedor_coincide,
          cantidad_valida: validaciones.cantidad_valida,
          fecha_coherente: validaciones.fecha_coherente,
          precio_coherente: validaciones.precio_coherente,
          estado_orden_valido: validaciones.estado_orden_valido,
          
          // Contadores
          total_discrepancias: validaciones.discrepancias.length,
          total_advertencias: validaciones.advertencias.length,
          total_recomendaciones: validaciones.recomendaciones.length,
          
          // Detalles de discrepancias (organizadas por gravedad)
          discrepancias_criticas: validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO'),
          discrepancias_importantes: validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE'),
          discrepancias_menores: validaciones.discrepancias.filter(d => d.categoria === 'MENOR'),
          
          // Advertencias y recomendaciones
          advertencias: validaciones.advertencias,
          recomendaciones: validaciones.recomendaciones,
          
          // Información para toma de decisiones
          puede_procesar_inmediatamente: !noSePuedeContinuar && discrepanciasCriticas.length === 0,
          requiere_aprobacion_gerencial: discrepanciasImportantes.length > 0,
          requiere_contacto_proveedor: validaciones.discrepancias.some(d => 
            d.tipo.includes('PROVEEDOR') || d.tipo.includes('CANTIDAD') || d.tipo.includes('PRECIO')
          ),
          
          // Métricas de calidad
          porcentaje_cumplimiento: calcularPorcentajeCumplimiento(validaciones),
          nivel_riesgo: determinarNivelRiesgo(validaciones),
          
          // Auditoría
          validado_en: new Date().toISOString(),
          validado_por_auditor: req.user.name_user,
          numero_validaciones_realizadas: Object.keys(validaciones).filter(k => 
            k.endsWith('_coincide') || k.endsWith('_valida') || k.endsWith('_coherente') || k.endsWith('_valido')
          ).length
        }
      }
    };

    // Función auxiliar para calcular porcentaje de cumplimiento
    function calcularPorcentajeCumplimiento(validaciones) {
      const validacionesRealizadas = [
        validaciones.perfume_coincide,
        validaciones.proveedor_coincide,
        validaciones.cantidad_valida,
        validaciones.fecha_coherente,
        validaciones.precio_coherente,
        validaciones.estado_orden_valido
      ];
      
      const exitosas = validacionesRealizadas.filter(v => v === true).length;
      const total = validacionesRealizadas.length;
      
      return Math.round((exitosas / total) * 100);
    }

    // Función auxiliar para determinar nivel de riesgo
    function determinarNivelRiesgo(validaciones) {
      const criticas = validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO').length;
      const importantes = validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE').length;
      
      if (criticas > 0) return 'ALTO';
      if (importantes > 0) return 'MEDIO';
      if (validaciones.advertencias.length > 2) return 'MEDIO-BAJO';
      return 'BAJO';
    }

    console.log('🎉 Respuesta con validación detallada construida exitosamente');
    console.log('📊 Estado de validación:', estadoValidacion);
    console.log('⚠️ Discrepancias críticas:', discrepanciasCriticas.length);
    console.log('🔍 Discrepancias importantes:', discrepanciasImportantes.length);
    console.log('📋 Total advertencias:', validaciones.advertencias.length);
    console.log('✅ Puede procesar:', !noSePuedeContinuar);
    console.log('🎯 Acción recomendada:', accionRecomendada);
    console.log('📈 Porcentaje cumplimiento:', calcularPorcentajeCumplimiento(validaciones) + '%');
    console.log('⚡ Nivel de riesgo:', determinarNivelRiesgo(validaciones));
    
    // Log detallado de discrepancias para debugging
    if (validaciones.discrepancias.length > 0) {
      console.log('🔍 DETALLE DE DISCREPANCIAS:');
      validaciones.discrepancias.forEach((disc, index) => {
        console.log(`  ${index + 1}. [${disc.categoria}] ${disc.titulo}`);
        console.log(`     - Puede continuar: ${disc.puede_continuar}`);
        console.log(`     - Acción: ${disc.que_hacer}`);
      });
    }
    
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error en búsqueda de entrada:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al buscar la entrada',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Buscar entrada tipo TRASPASO completa por número de referencia CON validación cruzada
const getEntradaTraspasoCompleta = async (req, res) => {
  console.log('🔄 Búsqueda de entrada tipo TRASPASO iniciada');
  console.log('📋 Número de referencia recibido:', req.params.id);
  
  try {
    const { id: numeroReferencia } = req.params;
    
    if (!numeroReferencia || numeroReferencia.trim() === '') {
      return res.status(400).json({
        error: 'Número de referencia inválido',
        message: 'El número de referencia no puede estar vacío'
      });
    }

    // 1. Buscar la entrada tipo TRASPASO por referencia_traspaso
    console.log('🔍 Buscando entrada tipo traspaso...');
    let entrada = await Entrada.findOne({ 
      referencia_traspaso: numeroReferencia,
      tipo: 'Traspaso'
    })
      .populate('id_perfume')
      .populate('usuario_registro', 'name_user correo_user rol_user')
      .populate('validado_por', 'name_user correo_user rol_user')
      .populate('almacen_destino', 'nombre_almacen codigo ubicacion'); // AGREGADO: incluir codigo

    // Si no se encuentra por referencia_traspaso, buscar por numero_entrada
    if (!entrada) {
      console.log('🔍 No encontrada por referencia_traspaso, buscando por numero_entrada...');
      entrada = await Entrada.findOne({ 
        numero_entrada: numeroReferencia,
        tipo: 'Traspaso'
      })
        .populate('id_perfume')
        .populate('usuario_registro', 'name_user correo_user rol_user')
        .populate('validado_por', 'name_user correo_user rol_user')
        .populate('almacen_destino', 'nombre_almacen codigo ubicacion'); // AGREGADO: incluir codigo
    }

    if (!entrada) {
      return res.status(404).json({
        error: 'Entrada de traspaso no encontrada',
        message: `No se encontró una entrada de traspaso con referencia/número: ${numeroReferencia}`
      });
    }

    console.log('✅ Entrada de traspaso encontrada:', entrada._id);
    console.log('🔍 DEBUG - Tipo de entrada:', entrada.tipo);
    console.log('🔍 DEBUG - Referencia traspaso:', entrada.referencia_traspaso);
    console.log('🔍 DEBUG - Número entrada:', entrada.numero_entrada);

    // 2. Buscar el traspaso original por numero_traspaso
    console.log('🔍 Buscando traspaso original...');
    // Usar referencia_traspaso si existe, sino usar numero_entrada
    const referenciaParaBuscar = entrada.referencia_traspaso || entrada.numero_entrada;
    console.log(`🔍 Buscando traspaso con: ${referenciaParaBuscar}`);
    
    const traspaso = await Traspaso.findOne({ numero_traspaso: referenciaParaBuscar })
      .populate('id_perfume')
      .populate('proveedor')
      .populate('usuario_registro', 'name_user correo_user rol_user')
      .populate('validado_por', 'name_user correo_user rol_user')
      .populate('almacen_salida', 'nombre_almacen codigo ubicacion'); // AGREGADO: incluir codigo

    if (!traspaso) {
      console.log('⚠️ Traspaso original no encontrado, continuando con entrada únicamente...');
      // Si no encontramos el traspaso, crear una respuesta simplificada
      const respuesta = {
        message: 'Entrada de traspaso encontrada (sin traspaso original)',
        data: {
          entrada: {
            _id: entrada._id,
            numero_entrada: entrada.numero_entrada,
            tipo: entrada.tipo,
            referencia_traspaso: entrada.referencia_traspaso,
            cantidad: entrada.cantidad,
            fecha_entrada: entrada.fecha_entrada,
            estatus_validacion: entrada.estatus_validacion,
            observaciones_auditor: entrada.observaciones_auditor,
            almacen_destino: entrada.almacen_destino
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
          advertencia: {
            tipo: 'TRASPASO_ORIGINAL_NO_ENCONTRADO',
            mensaje: 'La entrada existe pero no se encontró el traspaso original correspondiente',
            sugerencias: [
              'Verificar si el traspaso existe en el sistema',
              'Confirmar que la referencia_traspaso sea correcta',
              'Considerar crear el traspaso retroactivamente'
            ]
          }
        }
      };
      
      return res.json(respuesta);
    }

    console.log('✅ Traspaso original encontrado:', traspaso._id);

    // DEBUG: Verificar qué datos de almacenes tenemos
    console.log('🔍 DEBUG - Almacenes encontrados:');
    console.log(`  - entrada.almacen_destino:`, entrada.almacen_destino);
    console.log(`  - traspaso.almacen_salida:`, traspaso.almacen_salida);

    // 3. Obtener datos del proveedor de la entrada
    let proveedorEntradaData = null;
    if (entrada.proveedor) {
      try {
        if (typeof entrada.proveedor === 'object' && entrada.proveedor.toString().match(/^[0-9a-fA-F]{24}$/)) {
          proveedorEntradaData = await Proveedor.findById(entrada.proveedor);
        } else if (typeof entrada.proveedor === 'string' && entrada.proveedor.match(/^[0-9a-fA-F]{24}$/)) {
          proveedorEntradaData = await Proveedor.findById(entrada.proveedor);
        } else {
          proveedorEntradaData = await Proveedor.findOne({ nombre_proveedor: entrada.proveedor });
        }
      } catch (error) {
        console.log('⚠️ Error poblando proveedor de entrada:', error.message);
      }
    }

    // 4. Realizar validaciones cruzadas específicas para TRASPASOS
    const validaciones = {
      perfume_coincide: true,
      proveedor_coincide: true,
      cantidad_coincide: true,
      fecha_coherente: true,
      almacenes_diferentes: true,
      estado_traspaso_valido: true,
      referencia_valida: true,
      discrepancias: [],
      advertencias: [],
      recomendaciones: []
    };

    console.log('🔍 Iniciando validaciones cruzadas para traspaso...');

    // ========== VALIDACIÓN 1: PERFUME COINCIDE ==========
    const perfumeTraspaso = traspaso.id_perfume?._id?.toString();
    const perfumeEntrada = entrada.id_perfume?._id?.toString();
    
    console.log('🔍 Validando perfumes:');
    console.log(`  - Traspaso perfume ID: ${perfumeTraspaso}`);
    console.log(`  - Entrada perfume ID: ${perfumeEntrada}`);
    
    if (perfumeTraspaso !== perfumeEntrada) {
      validaciones.perfume_coincide = false;
      validaciones.discrepancias.push({
        tipo: 'PERFUME_DIFERENTE',
        categoria: 'CRÍTICO',
        titulo: '❌ Perfume no coincide',
        descripcion: `El perfume de la entrada no coincide con el del traspaso original`,
        detalles: {
          perfume_traspaso: {
            id: perfumeTraspaso,
            nombre: traspaso.id_perfume?.name_per || 'No disponible'
          },
          perfume_entrada: {
            id: perfumeEntrada,
            nombre: entrada.id_perfume?.name_per || 'No disponible'
          }
        },
        impacto: 'ALTO',
        razon: 'La entrada debe corresponder exactamente al perfume trasladado',
        que_hacer: 'CORREGIR PERFUME',
        acciones_sugeridas: [
          '1. Verificar el perfume recibido físicamente',
          '2. Corregir el registro de entrada si es necesario',
          '3. Si es correcto, verificar el traspaso original',
          '4. Contactar al almacén de origen para confirmación'
        ],
        puede_continuar: false,
        gravedad: 'ALTA'
      });
    } else {
      validaciones.recomendaciones.push({
        tipo: 'PERFUME_CORRECTO',
        mensaje: '✅ Perfume coincide correctamente con el traspaso'
      });
    }

    // ========== VALIDACIÓN 2: PROVEEDOR COINCIDE ==========
    const proveedorTraspaso = traspaso.proveedor?._id?.toString();
    const proveedorEntrada = proveedorEntradaData?._id?.toString();
    
    console.log('🔍 Validando proveedores:');
    console.log(`  - Traspaso proveedor ID: ${proveedorTraspaso}`);
    console.log(`  - Entrada proveedor ID: ${proveedorEntrada}`);
    
    if (proveedorTraspaso !== proveedorEntrada) {
      validaciones.proveedor_coincide = false;
      validaciones.discrepancias.push({
        tipo: 'PROVEEDOR_DIFERENTE_TRASPASO',
        categoria: 'CRÍTICO',
        titulo: '❌ Proveedor no coincide',
        descripcion: `El proveedor de la entrada no coincide con el del traspaso`,
        detalles: {
          proveedor_traspaso: {
            id: proveedorTraspaso,
            nombre: traspaso.proveedor?.nombre_proveedor || 'No disponible',
            rfc: traspaso.proveedor?.rfc || 'N/A'
          },
          proveedor_entrada: {
            id: proveedorEntrada,
            nombre: proveedorEntradaData?.nombre_proveedor || 'No disponible',
            rfc: proveedorEntradaData?.rfc || 'N/A'
          }
        },
        impacto: 'ALTO',
        razon: 'En traspasos el proveedor debe mantenerse consistente',
        que_hacer: 'CORREGIR PROVEEDOR',
        acciones_sugeridas: [
          '1. Verificar el proveedor correcto en documentos',
          '2. Corregir el registro según corresponda',
          '3. Validar la trazabilidad del producto',
          '4. Documentar cualquier cambio de proveedor autorizado'
        ],
        puede_continuar: false,
        gravedad: 'ALTA'
      });
    } else {
      validaciones.recomendaciones.push({
        tipo: 'PROVEEDOR_CORRECTO',
        mensaje: '✅ Proveedor coincide correctamente con el traspaso'
      });
    }

    // ========== VALIDACIÓN 3: CANTIDAD COINCIDE ==========
    const cantidadTraspaso = traspaso.cantidad;
    const cantidadEntrada = entrada.cantidad;
    
    console.log('🔍 Validando cantidades:');
    console.log(`  - Traspaso cantidad: ${cantidadTraspaso}`);
    console.log(`  - Entrada cantidad: ${cantidadEntrada}`);
    
    if (cantidadEntrada !== cantidadTraspaso) {
      validaciones.cantidad_coincide = false;
      const diferencia = Math.abs(cantidadEntrada - cantidadTraspaso);
      const porcentajeDiferencia = (diferencia / cantidadTraspaso) * 100;
      
      validaciones.discrepancias.push({
        tipo: 'CANTIDAD_DIFERENTE_TRASPASO',
        categoria: 'CRÍTICO',
        titulo: '❌ Cantidad no coincide',
        descripcion: `La cantidad recibida difiere de la enviada en el traspaso`,
        detalles: {
          cantidad_enviada: cantidadTraspaso,
          cantidad_recibida: cantidadEntrada,
          diferencia: diferencia,
          porcentaje_diferencia: porcentajeDiferencia.toFixed(2) + '%',
          tipo_diferencia: cantidadEntrada > cantidadTraspaso ? 'EXCESO' : 'FALTANTE'
        },
        impacto: 'ALTO',
        razon: 'En traspasos la cantidad debe ser exacta para mantener control de inventario',
        que_hacer: 'INVESTIGAR DIFERENCIA',
        acciones_sugeridas: [
          '1. Verificar físicamente la mercancía recibida',
          '2. Revisar documentos de envío del almacén origen',
          '3. Contactar al almacén de origen para aclaración',
          '4. Documentar cualquier pérdida o daño en tránsito',
          '5. Ajustar registros según hallazgos'
        ],
        puede_continuar: false,
        gravedad: 'ALTA'
      });
    } else {
      validaciones.recomendaciones.push({
        tipo: 'CANTIDAD_EXACTA',
        mensaje: '✅ Cantidad recibida coincide exactamente con la enviada'
      });
    }

    // ========== VALIDACIÓN 4: FECHAS COHERENTES ==========
    const fechaSalida = new Date(traspaso.fecha_salida);
    const fechaEntrada = new Date(entrada.fecha_entrada);
    const diasDiferencia = Math.ceil((fechaEntrada - fechaSalida) / (1000 * 60 * 60 * 24));
    
    console.log('🔍 Validando fechas:');
    console.log(`  - Fecha salida: ${fechaSalida.toISOString()}`);
    console.log(`  - Fecha entrada: ${fechaEntrada.toISOString()}`);
    console.log(`  - Días diferencia: ${diasDiferencia}`);
    
    if (fechaEntrada < fechaSalida) {
      validaciones.fecha_coherente = false;
      validaciones.discrepancias.push({
        tipo: 'FECHA_ENTRADA_ANTERIOR',
        categoria: 'CRÍTICO',
        titulo: '📅 Fecha de entrada inválida',
        descripcion: `La entrada está fechada antes que la salida del traspaso`,
        detalles: {
          fecha_salida: fechaSalida.toLocaleDateString('es-MX'),
          fecha_entrada: fechaEntrada.toLocaleDateString('es-MX'),
          dias_diferencia: Math.abs(diasDiferencia)
        },
        impacto: 'ALTO',
        razon: 'Es físicamente imposible recibir antes de enviar',
        que_hacer: 'CORREGIR FECHA',
        acciones_sugeridas: [
          '1. Verificar la fecha real de recepción',
          '2. Corregir la fecha en el sistema',
          '3. Si ambas fechas son correctas, investigar la discrepancia',
          '4. Documentar la explicación de la diferencia temporal'
        ],
        puede_continuar: false,
        gravedad: 'ALTA'
      });
    } else if (diasDiferencia > 7) {
      validaciones.advertencias.push({
        tipo: 'TRASPASO_TARDÍO',
        categoria: 'MODERADO',
        titulo: '⏰ Traspaso tardío detectado',
        descripcion: `El traspaso tardó ${diasDiferencia} días en completarse`,
        detalles: {
          fecha_salida: fechaSalida.toLocaleDateString('es-MX'),
          fecha_entrada: fechaEntrada.toLocaleDateString('es-MX'),
          dias_retraso: diasDiferencia,
          es_tardio: diasDiferencia > 7
        },
        impacto: 'MEDIO',
        razon: 'Posible demora en el proceso de traspaso',
        que_hacer: 'EVALUAR PROCESO',
        acciones_sugeridas: [
          '1. Documentar el retraso en el historial',
          '2. Evaluar si afectó la calidad del producto',
          '3. Revisar el proceso de traspaso para mejoras',
          '4. Considerar ajustes en tiempos estándar'
        ],
        puede_continuar: true,
        gravedad: 'MEDIA'
      });
    } else {
      validaciones.recomendaciones.push({
        tipo: 'FECHA_APROPIADA',
        mensaje: `✅ Tiempo de traspaso apropiado (${diasDiferencia} días)`
      });
    }

    // ========== VALIDACIÓN 5: ALMACENES DIFERENTES ==========
    const almacenSalida = traspaso.almacen_salida?._id?.toString();
    const almacenEntrada = entrada.almacen_destino?._id?.toString(); // CORREGIDO: usar _id del almacen_destino poblado
    
    console.log('🔍 Validando almacenes:');
    console.log(`  - Almacén salida: ${almacenSalida}`);
    console.log(`  - Almacén entrada: ${almacenEntrada}`);
    
    if (almacenSalida === almacenEntrada) {
      validaciones.almacenes_diferentes = false;
      validaciones.discrepancias.push({
        tipo: 'ALMACENES_IGUALES',
        categoria: 'CRÍTICO',
        titulo: '🏢 Almacenes no pueden ser iguales',
        descripcion: `El almacén de salida y entrada son el mismo`,
        detalles: {
          almacen_salida: {
            id: almacenSalida,
            nombre: traspaso.almacen_salida?.nombre_almacen || 'No disponible'
          },
          almacen_entrada: {
            id: almacenEntrada,
            nombre: entrada.almacen_destino?.nombre_almacen || 'No disponible' // CORREGIDO: usar almacen_destino poblado
          }
        },
        impacto: 'ALTO',
        razon: 'Un traspaso requiere almacenes origen y destino diferentes',
        que_hacer: 'CORREGIR ALMACÉN',
        acciones_sugeridas: [
          '1. Verificar el almacén destino correcto',
          '2. Corregir el registro de entrada o traspaso',
          '3. Validar que realmente hubo movimiento físico',
          '4. Si no hubo movimiento, cancelar el traspaso'
        ],
        puede_continuar: false,
        gravedad: 'ALTA'
      });
    } else {
      validaciones.recomendaciones.push({
        tipo: 'ALMACENES_CORRECTOS',
        mensaje: '✅ Almacenes origen y destino son diferentes correctamente'
      });
    }

    // ========== VALIDACIÓN 6: ESTADO DEL TRASPASO ==========
    const estadoTraspaso = traspaso.estatus_validacion;
    
    console.log('🔍 Validando estado del traspaso:');
    console.log(`  - Estado actual: ${estadoTraspaso}`);
    
    if (estadoTraspaso === 'Rechazado') {
      validaciones.estado_traspaso_valido = false;
      validaciones.discrepancias.push({
        tipo: 'TRASPASO_RECHAZADO',
        categoria: 'CRÍTICO',
        titulo: '❌ Traspaso rechazado',
        descripcion: `El traspaso original fue rechazado`,
        detalles: {
          numero_traspaso: traspaso.numero_traspaso,
          estado_actual: estadoTraspaso,
          observaciones: traspaso.observaciones_auditor || 'Sin observaciones'
        },
        impacto: 'ALTO',
        razon: 'No se puede procesar entrada de un traspaso rechazado',
        que_hacer: 'REVISAR TRASPASO',
        acciones_sugeridas: [
          '1. Revisar las razones del rechazo del traspaso',
          '2. Si es un error, reactivar el traspaso',
          '3. Si es válido el rechazo, devolver mercancía',
          '4. Documentar la resolución del conflicto'
        ],
        puede_continuar: false,
        gravedad: 'ALTA'
      });
    } else if (estadoTraspaso === 'Validado') {
      validaciones.advertencias.push({
        tipo: 'TRASPASO_YA_VALIDADO',
        categoria: 'MODERADO',
        titulo: '🔄 Traspaso ya validado',
        descripcion: `Este traspaso ya fue validado anteriormente`,
        detalles: {
          numero_traspaso: traspaso.numero_traspaso,
          fecha_validacion: traspaso.fecha_validacion,
          validado_por: traspaso.validado_por?.name_user || 'Usuario desconocido'
        },
        impacto: 'MEDIO',
        razon: 'Posible duplicación de procesamiento',
        que_hacer: 'VERIFICAR DUPLICADO',
        acciones_sugeridas: [
          '1. Verificar si esta entrada ya fue procesada',
          '2. Revisar el historial de validaciones',
          '3. Confirmar que no es un duplicado',
          '4. Documentar si es un procesamiento adicional válido'
        ],
        puede_continuar: true,
        gravedad: 'MEDIA'
      });
    }

    // 5. Determinar estado general de validación
    const discrepanciasCriticas = validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO');
    const discrepanciasImportantes = validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE');
    const noSePuedeContinuar = validaciones.discrepancias.some(d => !d.puede_continuar);
    
    let estadoValidacion, colorEstado, iconoEstado, mensajeAuditor, accionRecomendada;
    
    if (discrepanciasCriticas.length > 0 || noSePuedeContinuar) {
      estadoValidacion = 'RECHAZADA';
      colorEstado = '#dc3545';
      iconoEstado = '❌';
      mensajeAuditor = `Entrada de traspaso RECHAZADA: Se encontraron ${discrepanciasCriticas.length} discrepancias críticas.`;
      accionRecomendada = 'NO_PROCESAR';
    } else if (discrepanciasImportantes.length > 0) {
      estadoValidacion = 'REQUIERE_REVISION_GERENCIAL';
      colorEstado = '#fd7e14';
      iconoEstado = '⚠️';
      mensajeAuditor = `Entrada de traspaso requiere APROBACIÓN GERENCIAL.`;
      accionRecomendada = 'ESCALAR_GERENCIA';
    } else if (validaciones.discrepancias.length > 0 || validaciones.advertencias.some(a => a.gravedad === 'MEDIA')) {
      estadoValidacion = 'CONDICIONAL';
      colorEstado = '#ffc107';
      iconoEstado = '⚡';
      mensajeAuditor = `Entrada de traspaso CONDICIONAL: Puede procesarse con observaciones.`;
      accionRecomendada = 'PROCESAR_CON_OBSERVACIONES';
    } else {
      estadoValidacion = 'APROBADA';
      colorEstado = '#28a745';
      iconoEstado = '✅';
      mensajeAuditor = `Entrada de traspaso APROBADA: Todas las validaciones fueron exitosas.`;
      accionRecomendada = 'PROCESAR_NORMAL';
    }

    // Generar resumen ejecutivo
    const resumenEjecutivo = {
      estado: estadoValidacion,
      color: colorEstado,
      icono: iconoEstado,
      mensaje_principal: mensajeAuditor,
      accion_recomendada: accionRecomendada,
      total_discrepancias: validaciones.discrepancias.length,
      total_advertencias: validaciones.advertencias.length,
      puede_procesar: !noSePuedeContinuar,
      requiere_supervision: discrepanciasCriticas.length > 0 || discrepanciasImportantes.length > 0,
      puntos_criticos: discrepanciasCriticas.map(d => d.titulo),
      siguiente_paso: obtenerSiguientepasoTraspaso(estadoValidacion, validaciones),
      tiempo_estimado_resolucion: estimarTiempoResolucionTraspaso(validaciones),
      tipo_entrada: 'TRASPASO'
    };

    // Funciones auxiliares para traspasos
    function obtenerSiguientepasoTraspaso(estado, validaciones) {
      switch(estado) {
        case 'RECHAZADA':
          return 'Contactar almacén origen y resolver discrepancias del traspaso';
        case 'REQUIERE_REVISION_GERENCIAL':
          return 'Elevar a gerencia para aprobación de traspaso con observaciones';
        case 'CONDICIONAL':
          return 'Procesar traspaso documentando las observaciones';
        case 'APROBADA':
          return 'Procesar entrada de traspaso inmediatamente';
        default:
          return 'Revisar validaciones del traspaso nuevamente';
      }
    }

    function estimarTiempoResolucionTraspaso(validaciones) {
      const criticas = validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO').length;
      const importantes = validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE').length;
      
      if (criticas > 0) {
        return '1-3 días hábiles (requiere coordinación entre almacenes)';
      } else if (importantes > 0) {
        return '4-8 horas (requiere aprobación gerencial)';
      } else if (validaciones.advertencias.length > 0) {
        return 'Inmediato (solo documentación)';
      } else {
        return 'Inmediato (sin restricciones)';
      }
    }

    function calcularPorcentajeCumplimientoTraspaso(validaciones) {
      const validacionesRealizadas = [
        validaciones.perfume_coincide,
        validaciones.proveedor_coincide,
        validaciones.cantidad_coincide,
        validaciones.fecha_coherente,
        validaciones.almacenes_diferentes,
        validaciones.estado_traspaso_valido,
        validaciones.referencia_valida
      ];
      
      const exitosas = validacionesRealizadas.filter(v => v === true).length;
      const total = validacionesRealizadas.length;
      
      return Math.round((exitosas / total) * 100);
    }

    function determinarNivelRiesgoTraspaso(validaciones) {
      const criticas = validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO').length;
      const importantes = validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE').length;
      
      if (criticas > 0) return 'ALTO';
      if (importantes > 0) return 'MEDIO';
      if (validaciones.advertencias.length > 2) return 'MEDIO-BAJO';
      return 'BAJO';
    }

    // 6. Construir respuesta
    const respuesta = {
      message: 'Entrada de traspaso encontrada exitosamente',
      data: {
        entrada: {
          _id: entrada._id,
          numero_entrada: entrada.numero_entrada,
          tipo: entrada.tipo,
          referencia_traspaso: entrada.referencia_traspaso,
          cantidad: entrada.cantidad,
          proveedor: proveedorEntradaData ? {
            _id: proveedorEntradaData._id,
            nombre_proveedor: proveedorEntradaData.nombre_proveedor,
            rfc: proveedorEntradaData.rfc,
            contacto: proveedorEntradaData.contacto,
            telefono: proveedorEntradaData.telefono,
            email: proveedorEntradaData.email,
            direccion: proveedorEntradaData.direccion,
            estado: proveedorEntradaData.estado
          } : {
            valor_original: entrada.proveedor,
            tipo: typeof entrada.proveedor,
            mensaje: "Proveedor no encontrado o formato incorrecto"
          },
          fecha_entrada: entrada.fecha_entrada,
          estatus_validacion: entrada.estatus_validacion,
          observaciones_auditor: entrada.observaciones_auditor,
          almacen_destino: entrada.almacen_destino // CORREGIDO: usar almacen_destino
        },
        traspaso_original: traspaso ? {
          _id: traspaso._id,
          numero_traspaso: traspaso.numero_traspaso,
          cantidad: traspaso.cantidad,
          fecha_salida: traspaso.fecha_salida,
          estatus_validacion: traspaso.estatus_validacion,
          observaciones_auditor: traspaso.observaciones_auditor,
          almacen_salida: traspaso.almacen_salida
        } : null,
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
        proveedor_detalle: traspaso.proveedor ? {
          _id: traspaso.proveedor._id,
          nombre_proveedor: traspaso.proveedor.nombre_proveedor,
          rfc: traspaso.proveedor.rfc,
          contacto: traspaso.proveedor.contacto,
          telefono: traspaso.proveedor.telefono,
          email: traspaso.proveedor.email,
          direccion: traspaso.proveedor.direccion,
          estado: traspaso.proveedor.estado
        } : null,
        validacion: {
          // Resumen ejecutivo
          resumen_ejecutivo: resumenEjecutivo,
          
          // Estados individuales de validación
          estado_general: estadoValidacion,
          perfume_coincide: validaciones.perfume_coincide,
          proveedor_coincide: validaciones.proveedor_coincide,
          cantidad_coincide: validaciones.cantidad_coincide,
          fecha_coherente: validaciones.fecha_coherente,
          almacenes_diferentes: validaciones.almacenes_diferentes,
          estado_traspaso_valido: validaciones.estado_traspaso_valido,
          referencia_valida: validaciones.referencia_valida,
          
          // Contadores
          total_discrepancias: validaciones.discrepancias.length,
          total_advertencias: validaciones.advertencias.length,
          total_recomendaciones: validaciones.recomendaciones.length,
          
          // Detalles de discrepancias
          discrepancias_criticas: validaciones.discrepancias.filter(d => d.categoria === 'CRÍTICO'),
          discrepancias_importantes: validaciones.discrepancias.filter(d => d.categoria === 'IMPORTANTE'),
          discrepancias_menores: validaciones.discrepancias.filter(d => d.categoria === 'MENOR'),
          
          // Advertencias y recomendaciones
          advertencias: validaciones.advertencias,
          recomendaciones: validaciones.recomendaciones,
          
          // Información para toma de decisiones
          puede_procesar_inmediatamente: !noSePuedeContinuar && discrepanciasCriticas.length === 0,
          requiere_aprobacion_gerencial: discrepanciasImportantes.length > 0,
          requiere_coordinacion_almacenes: validaciones.discrepancias.some(d => 
            d.tipo.includes('ALMACEN') || d.tipo.includes('CANTIDAD') || d.tipo.includes('FECHA')
          ),
          
          // Métricas de calidad
          porcentaje_cumplimiento: calcularPorcentajeCumplimientoTraspaso(validaciones),
          nivel_riesgo: determinarNivelRiesgoTraspaso(validaciones),
          
          // Auditoría
          validado_en: new Date().toISOString(),
          validado_por_auditor: req.user.name_user,
          numero_validaciones_realizadas: Object.keys(validaciones).filter(k => 
            k.endsWith('_coincide') || k.endsWith('_coherente') || k.endsWith('_diferentes') || 
            k.endsWith('_valido') || k.endsWith('_valida')
          ).length
        }
      }
    };

    console.log('🎉 Respuesta de validación de traspaso construida exitosamente');
    console.log('📊 Estado de validación:', estadoValidacion);
    console.log('⚠️ Discrepancias críticas:', discrepanciasCriticas.length);
    console.log('🔍 Discrepancias importantes:', discrepanciasImportantes.length);
    console.log('📋 Total advertencias:', validaciones.advertencias.length);
    console.log('✅ Puede procesar:', !noSePuedeContinuar);
    console.log('🎯 Acción recomendada:', accionRecomendada);
    console.log('📈 Porcentaje cumplimiento:', calcularPorcentajeCumplimientoTraspaso(validaciones) + '%');
    console.log('⚡ Nivel de riesgo:', determinarNivelRiesgoTraspaso(validaciones));
    
    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error en búsqueda de entrada de traspaso:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al buscar la entrada de traspaso'
    });
  }
};

// Buscar entrada completa (COMPRA o TRASPASO) por número - BÚSQUEDA INTELIGENTE
const getEntradaCompletaInteligente = async (req, res) => {
  console.log('🔍 Búsqueda inteligente de entrada iniciada');
  console.log('📋 Número/Referencia recibido:', req.params.id);
  
  try {
    const { id: numeroEntrada } = req.params;
    
    if (!numeroEntrada || numeroEntrada.trim() === '') {
      return res.status(400).json({
        error: 'Número de entrada inválido',
        message: 'El número de entrada no puede estar vacío'
      });
    }

    console.log('🔍 Paso 1: Intentando buscar como entrada tipo COMPRA...');
    console.log('🔍 DEBUG - Query Compra: { numero_entrada: "' + numeroEntrada + '" }');
    
    // 1. Primero intentar buscar como entrada normal (tipo Compra)
    let entrada = await Entrada.findOne({ numero_entrada: numeroEntrada })
      .populate('id_perfume')
      .populate('usuario_registro', 'name_user correo_user rol_user')
      .populate('validado_por', 'name_user correo_user rol_user')
      .populate('almacen_origen', 'nombre_almacen ubicacion')
      .populate('almacen_destino', 'nombre_almacen ubicacion');

    console.log('🔍 DEBUG - Resultado Compra:', entrada ? {
      _id: entrada._id,
      numero_entrada: entrada.numero_entrada,
      tipo: entrada.tipo,
      referencia_traspaso: entrada.referencia_traspaso
    } : 'null');

    if (entrada && (!entrada.tipo || entrada.tipo === 'Compra')) {
      console.log('✅ Encontrada como entrada tipo COMPRA - delegando...');
      // Delegar a la función original para compras
      req.params.id = numeroEntrada;
      return await getEntradaCompleta(req, res);
    }

    console.log('🔄 Paso 2: No encontrada como COMPRA, intentando como TRASPASO...');
    console.log('🔍 DEBUG - Query Traspaso: { referencia_traspaso: "' + numeroEntrada + '", tipo: "Traspaso" }');

    // 2. Si no se encuentra como compra, buscar como traspaso por referencia_traspaso
    entrada = await Entrada.findOne({ 
      referencia_traspaso: numeroEntrada,
      tipo: 'Traspaso'
    })
      .populate('id_perfume')
      .populate('usuario_registro', 'name_user correo_user rol_user')
      .populate('validado_por', 'name_user correo_user rol_user')
      .populate('almacen_destino', 'nombre_almacen ubicacion'); // CORREGIDO: usar almacen_destino

    console.log('🔍 DEBUG - Resultado Traspaso:', entrada ? {
      _id: entrada._id,
      numero_entrada: entrada.numero_entrada,
      tipo: entrada.tipo,
      referencia_traspaso: entrada.referencia_traspaso
    } : 'null');

    if (entrada && entrada.tipo === 'Traspaso') {
      console.log('✅ Encontrada como entrada tipo TRASPASO - delegando...');
      // Para traspasos, usar la referencia_traspaso, no el numero_entrada
      const referenciaTraspaso = entrada.referencia_traspaso;
      console.log(`🔄 Delegando a getEntradaTraspasoCompleta con referencia: ${referenciaTraspaso}`);
      req.params.id = referenciaTraspaso;
      return await getEntradaTraspasoCompleta(req, res);
    }

    // 3. Búsqueda adicional - verificar si existe con numero_entrada pero tipo Traspaso
    console.log('🔄 Paso 3: Buscando por numero_entrada con tipo Traspaso...');
    console.log('🔍 DEBUG - Query numero_entrada+Traspaso: { numero_entrada: "' + numeroEntrada + '", tipo: "Traspaso" }');
    
    entrada = await Entrada.findOne({ 
      numero_entrada: numeroEntrada,
      tipo: 'Traspaso'
    })
      .populate('id_perfume')
      .populate('usuario_registro', 'name_user correo_user rol_user')
      .populate('validado_por', 'name_user correo_user rol_user')
      .populate('almacen_destino', 'nombre_almacen ubicacion'); // CORREGIDO: usar almacen_destino

    console.log('🔍 DEBUG - Resultado numero_entrada+Traspaso:', entrada ? {
      _id: entrada._id,
      numero_entrada: entrada.numero_entrada,
      tipo: entrada.tipo,
      referencia_traspaso: entrada.referencia_traspaso
    } : 'null');

    if (entrada && entrada.tipo === 'Traspaso') {
      console.log('✅ Encontrada como Traspaso por numero_entrada');
      
      // Si no tiene referencia_traspaso, usar numero_entrada como fallback
      const referenciaTraspaso = entrada.referencia_traspaso || entrada.numero_entrada;
      console.log(`🔄 Delegando a getEntradaTraspasoCompleta con referencia: ${referenciaTraspaso}`);
      req.params.id = referenciaTraspaso;
      return await getEntradaTraspasoCompleta(req, res);
    }

    // 4. Búsqueda exhaustiva - mostrar todas las entradas para debugging
    console.log('🔍 DEBUG - Búsqueda exhaustiva de todas las entradas relacionadas...');
    const todasLasEntradas = await Entrada.find({
      $or: [
        { numero_entrada: numeroEntrada },
        { referencia_traspaso: numeroEntrada }
      ]
    });

    console.log('🔍 DEBUG - Todas las entradas encontradas:', todasLasEntradas.map(e => ({
      _id: e._id,
      numero_entrada: e.numero_entrada,
      tipo: e.tipo,
      referencia_traspaso: e.referencia_traspaso
    })));

    console.log('❌ No encontrada ni como COMPRA ni como TRASPASO');
    
    // 5. Si no se encuentra en ninguna categoría
    return res.status(404).json({
      error: 'Entrada no encontrada',
      message: `No se encontró una entrada con el número/referencia: ${numeroEntrada}`,
      detalles: {
        busqueda_realizada: {
          por_numero_entrada: true,
          por_referencia_traspaso: true,
          por_numero_entrada_traspaso: true,
          valor_buscado: numeroEntrada
        },
        entradas_encontradas: todasLasEntradas.map(e => ({
          numero_entrada: e.numero_entrada,
          tipo: e.tipo,
          referencia_traspaso: e.referencia_traspaso
        })),
        sugerencias: [
          'Verificar que el número/referencia sea correcto',
          'Confirmar que la entrada esté registrada en el sistema',
          'Verificar si es una entrada de compra o traspaso'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error en búsqueda inteligente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al buscar la entrada'
    });
  }
};

// Procesar validación de entrada y actualizar datos
const procesarValidacionEntrada = async (req, res) => {
  console.log('🔄 Procesamiento de validación de entrada iniciado');
  console.log('📋 Número de entrada recibido:', req.params.id);
  console.log('👤 Usuario auditor:', {
    id: req.user?._id,
    name: req.user?.name_user,
    role: req.user?.rol_user
  });
  
  try {
    const { id: numeroEntrada } = req.params;
    
    // Validar que el número de entrada no esté vacío
    if (!numeroEntrada || numeroEntrada.trim() === '') {
      return res.status(400).json({
        error: 'Número de entrada inválido',
        message: 'El número de entrada no puede estar vacío'
      });
    }

    // 1. Buscar la entrada
    console.log('🔍 Buscando entrada...');
    const entrada = await Entrada.findOne({ numero_entrada: numeroEntrada })
      .populate('id_perfume')
      .populate('proveedor')
      .populate('almacen_destino');

    if (!entrada) {
      return res.status(404).json({
        error: 'Entrada no encontrada',
        message: `La entrada ${numeroEntrada} no existe en el sistema`
      });
    }

    // 2. Determinar el tipo de entrada
    const tipoEntrada = entrada.tipo || (entrada.referencia_traspaso ? 'Traspaso' : 'Compra');
    console.log('🎯 Tipo de entrada detectado:', tipoEntrada);

    // 3. Procesar según el tipo de entrada
    if (tipoEntrada === 'Traspaso') {
      return await procesarValidacionTraspaso(entrada, req, res);
    } else {
      return await procesarValidacionCompra(entrada, req, res);
    }

  } catch (error) {
    console.error('❌ Error en procesamiento de validación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al procesar la validación de entrada'
    });
  }
};

// Función auxiliar para validar entradas de COMPRA
const procesarValidacionCompra = async (entrada, req, res) => {
  console.log('💰 Procesando validación de COMPRA...');

  // Buscar la orden de compra relacionada por el mismo perfume y proveedor
  console.log('🔍 Buscando orden de compra relacionada...');
  
  // Obtener datos del proveedor si es necesario
  let proveedorData = null;
  if (entrada.proveedor) {
    if (typeof entrada.proveedor === 'string') {
      proveedorData = await Proveedor.findOne({ nombre_proveedor: entrada.proveedor });
    } else {
      proveedorData = entrada.proveedor;
    }
  }

  if (!proveedorData) {
    return res.status(404).json({
      error: 'Proveedor no encontrado',
      message: 'No se pudo determinar el proveedor de esta entrada'
    });
  }

  // Buscar orden de compra que tenga el mismo perfume y proveedor
  const ordenesCompra = await OrdenCompra.find({ 
    id_perfume: entrada.id_perfume._id 
  }).populate('id_perfume').populate('proveedor');

  const ordenCompra = ordenesCompra.find(orden => {
    return orden.proveedor?._id?.toString() === proveedorData._id.toString();
  });

  if (!ordenCompra) {
    return res.status(404).json({
      error: 'Orden de compra no encontrada',
      message: `No se encontró una orden de compra relacionada para el perfume ${entrada.id_perfume.name_per} y proveedor ${proveedorData.nombre_proveedor}`
    });
  }

  // Verificar que la orden no esté ya completada
  if (ordenCompra.estado === 'Completada') {
    return res.status(400).json({
      error: 'Orden ya procesada',
      message: 'Esta orden de compra ya ha sido completada anteriormente'
    });
  }

  // Actualizar el estado de la orden de compra a "Completada"
  console.log('📝 Actualizando estado de orden de compra...');
  ordenCompra.estado = 'Completada';
  ordenCompra.observaciones = `Validada por auditor ${req.user.name_user} el ${new Date().toISOString()}`;
  await ordenCompra.save();

  // Actualizar el stock del perfume
  console.log('📦 Actualizando stock del perfume...');
  const perfume = entrada.id_perfume;
  
  if (!perfume) {
    return res.status(404).json({
      error: 'Perfume no encontrado',
      message: 'El perfume asociado a esta entrada no existe'
    });
  }

  // Agregar la cantidad de la entrada al stock actual
  const stockAnterior = perfume.stock_per;
  perfume.stock_per += entrada.cantidad;
  await perfume.save();

  // Actualizar el estatus de validación de la entrada
  console.log('✅ Actualizando estatus de validación...');
  entrada.estatus_validacion = 'validado';
  entrada.fecha_validacion = new Date();
  entrada.validado_por = req.user._id;
  entrada.observaciones_auditor = `Validada por auditor ${req.user.name_user || req.user.name || 'Usuario'} el ${new Date().toLocaleString()}`;
  await entrada.save();

  // Obtener información completa del auditor
  console.log('🔍 Obteniendo información completa del auditor...');
  const auditorCompleto = await User.findById(req.user._id);

  // Respuesta exitosa con detalles de las actualizaciones
  const respuesta = {
    success: true,
    message: 'Entrada de COMPRA validada y procesada exitosamente',
    data: {
      entrada: {
        numero_entrada: entrada.numero_entrada,
        cantidad: entrada.cantidad,
        estatus_anterior: 'registrado',
        estatus_nuevo: entrada.estatus_validacion,
        fecha_validacion: entrada.fecha_validacion,
        observaciones: entrada.observaciones_auditor
      },
      orden_compra: {
        numero_orden: ordenCompra.n_orden_compra,
        estado_anterior: 'Pendiente',
        estado_nuevo: ordenCompra.estado,
        observaciones: ordenCompra.observaciones
      },
      perfume: {
        id: perfume._id,
        nombre: perfume.name_per,
        stock_anterior: stockAnterior,
        stock_nuevo: perfume.stock_per,
        cantidad_agregada: entrada.cantidad
      },
      auditor: {
        id: auditorCompleto?._id || req.user._id,
        nombre: auditorCompleto?.name_user || req.user.name_user || req.user.name || 'Usuario',
        apellido: auditorCompleto?.apellido_user || 'No disponible',
        email: auditorCompleto?.email_user || 'No disponible',
        rol: auditorCompleto?.rol_user || req.user.rol_user || req.user.role || 'Auditor',
        fecha_validacion: new Date(),
        fecha_validacion_formateada: new Date().toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }
    }
  };

  console.log('🎉 Validación de COMPRA procesada exitosamente');
  console.log('📊 Stock actualizado:', `${stockAnterior} → ${perfume.stock_per}`);
  console.log('📋 Orden completada:', ordenCompra.n_orden_compra);
  
  res.json(respuesta);
};

// Función auxiliar para validar entradas de TRASPASO
const procesarValidacionTraspaso = async (entrada, req, res) => {
  console.log('� Procesando validación de TRASPASO...');

  // Buscar el traspaso original usando la referencia
  console.log('🔍 Buscando traspaso original...');
  const traspaso = await Traspaso.findOne({ 
    numero_traspaso: entrada.referencia_traspaso 
  })
    .populate('id_perfume')
    .populate('almacen_salida', 'codigo ubicacion nombre_almacen');

  if (!traspaso) {
    return res.status(404).json({
      error: 'Traspaso original no encontrado',
      message: `No se encontró el traspaso ${entrada.referencia_traspaso} referenciado en esta entrada`
    });
  }

  // Verificar que el traspaso no esté ya completado
  if (traspaso.estatus_validacion === 'Validado') {
    return res.status(400).json({
      error: 'Traspaso ya procesado',
      message: 'Este traspaso ya ha sido validado anteriormente'
    });
  }

  // Actualizar el estado del traspaso a "Validado"
  console.log('📝 Actualizando estado del traspaso...');
  const estadoAnteriorTraspaso = traspaso.estatus_validacion;
  traspaso.estatus_validacion = 'Validado';
  traspaso.fecha_validacion = new Date();
  traspaso.validado_por = req.user._id;
  traspaso.observaciones_auditor = `Traspaso validado por auditor ${req.user.name_user || req.user.name || 'Usuario'} el ${new Date().toLocaleString()}`;
  await traspaso.save();

  // Actualizar el stock del perfume en el almacén destino
  console.log('📦 Actualizando stock del perfume...');
  const perfume = entrada.id_perfume;
  
  if (!perfume) {
    return res.status(404).json({
      error: 'Perfume no encontrado',
      message: 'El perfume asociado a esta entrada no existe'
    });
  }

  // Agregar la cantidad de la entrada al stock actual
  const stockAnterior = perfume.stock_per;
  perfume.stock_per += entrada.cantidad;
  await perfume.save();

  // Actualizar el estatus de validación de la entrada
  console.log('✅ Actualizando estatus de validación de la entrada...');
  entrada.estatus_validacion = 'validado';
  entrada.fecha_validacion = new Date();
  entrada.validado_por = req.user._id;
  entrada.observaciones_auditor = `Entrada de traspaso validada por auditor ${req.user.name_user || req.user.name || 'Usuario'} el ${new Date().toLocaleString()}`;
  await entrada.save();

  // Obtener información completa del auditor
  console.log('🔍 Obteniendo información completa del auditor...');
  const auditorCompleto = await User.findById(req.user._id);

  // Respuesta exitosa con detalles de las actualizaciones
  const respuesta = {
    success: true,
    message: 'Entrada de TRASPASO validada y procesada exitosamente',
    data: {
      entrada: {
        numero_entrada: entrada.numero_entrada,
        cantidad: entrada.cantidad,
        estatus_anterior: 'registrado',
        estatus_nuevo: entrada.estatus_validacion,
        fecha_validacion: entrada.fecha_validacion,
        observaciones: entrada.observaciones_auditor,
        referencia_traspaso: entrada.referencia_traspaso
      },
      traspaso: {
        numero_traspaso: traspaso.numero_traspaso,
        estado_anterior: estadoAnteriorTraspaso,
        estado_nuevo: traspaso.estatus_validacion,
        fecha_salida: traspaso.fecha_salida,
        almacen_origen: traspaso.almacen_salida?.codigo || 'No disponible',
        almacen_destino: entrada.almacen_destino?.codigo || 'No disponible',
        observaciones: traspaso.observaciones_auditor
      },
      perfume: {
        id: perfume._id,
        nombre: perfume.name_per,
        stock_anterior: stockAnterior,
        stock_nuevo: perfume.stock_per,
        cantidad_agregada: entrada.cantidad
      },
      auditor: {
        id: auditorCompleto?._id || req.user._id,
        nombre: auditorCompleto?.name_user || req.user.name_user || req.user.name || 'Usuario',
        apellido: auditorCompleto?.apellido_user || 'No disponible',
        email: auditorCompleto?.email_user || 'No disponible',
        rol: auditorCompleto?.rol_user || req.user.rol_user || req.user.role || 'Auditor',
        fecha_validacion: new Date(),
        fecha_validacion_formateada: new Date().toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }
    }
  };

  console.log('🎉 Validación de TRASPASO procesada exitosamente');
  console.log('📊 Stock actualizado:', `${stockAnterior} → ${perfume.stock_per}`);
  console.log('🔄 Traspaso validado:', traspaso.numero_traspaso);
  console.log('📋 Almacenes:', `${traspaso.almacen_salida?.codigo || 'N/A'} → ${entrada.almacen_destino?.codigo || 'N/A'}`);
  
  res.json(respuesta);
};

module.exports = {
  getOrdenCompraCompleta,
  getEntradaCompleta,
  getEntradaTraspasoCompleta,
  getEntradaCompletaInteligente,
  procesarValidacionEntrada
};
