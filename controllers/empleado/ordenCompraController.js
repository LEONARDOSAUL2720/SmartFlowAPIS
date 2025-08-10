const OrdenCompra = require('../../models/ordenCompra');
const Entrada = require('../../models/entrada');
const Counter = require('../../models/counter');

// Crear nueva orden de compra
const crearOrdenCompra = async (req, res) => {
  try {
    const {
      n_orden_compra,
      id_perfume,
      cantidad,
      usuario_solicitante,
      proveedor,
      lote,
      fecha,
      precio_unitario,
      precio_total,
      almacen
    } = req.body;

    // Validar campos obligatorios
    if (!n_orden_compra || !id_perfume || !cantidad || !usuario_solicitante || !proveedor) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Crear nueva orden de compra
    const nuevaOrden = new OrdenCompra({
      n_orden_compra,
      id_perfume,
      cantidad,
      usuario_solicitante,
      proveedor,
      lote,
      fecha: fecha || new Date(),
      precio_unitario,
      precio_total,
      almacen,
      estado: 'pendiente'
    });

    const ordenGuardada = await nuevaOrden.save();
    res.status(201).json(ordenGuardada);
  } catch (error) {
    console.error('❌ Error al crear orden de compra:', error.message);
    res.status(500).json({ error: 'Error al crear la orden de compra' });
  }
};

// Validar una orden de compra y crear la entrada
const validarOrdenCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { validado_por, observaciones } = req.body;

    const orden = await OrdenCompra.findById(id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    if (orden.estado === 'Completada') {
      return res.status(400).json({ error: 'La orden ya está validada' });
    }

    // Actualizar estado de la orden
    orden.estado = 'Completada';
    orden.updatedAt = new Date();
    orden.observaciones = observaciones || `Validada el ${new Date().toLocaleString()}`;
    await orden.save();

    // Generar número de entrada
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'numero_entrada' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const numeroEntrada = `ENT-${counter.seq.toString().padStart(3, '0')}`;

    // Crear entrada basada en la orden
    const nuevaEntrada = new Entrada({
      numero_entrada: numeroEntrada,
      id_perfume: orden.id_perfume,
      cantidad: orden.cantidad,
      proveedor: orden.proveedor,
      fecha_entrada: new Date(),
      usuario_registro: orden.usuario_solicitante,
      estatus_validacion: 'validado',
      tipo: 'Compra',
      fecha: new Date(),
      almacen_destino: orden.almacen || null,
      fecha_validacion: new Date(),
      validado_por: validado_por || null,
      observaciones_auditor: orden.observaciones || '',
      orden_compra: orden.n_orden_compra
    });

    await nuevaEntrada.save();

    res.status(200).json({
      mensaje: 'Orden validada y entrada creada correctamente',
      orden,
      entrada: nuevaEntrada
    });
  } catch (error) {
    console.error('❌ Error al validar la orden de compra:', error.message);
    res.status(500).json({ error: 'Error al validar la orden de compra' });
  }
};

// Obtener todas las órdenes con relaciones
const obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find()
      .populate('id_perfume')
      .populate('usuario_solicitante')
      .populate('proveedor');

    res.status(200).json(ordenes);
  } catch (error) {
    console.error('❌ Error al obtener órdenes:', error.message);
    res.status(500).json({ error: 'Error al obtener órdenes de compra' });
  }
};

// Crear orden de compra a partir de una entrada existente
const crearOrdenDesdeEntrada = async (req, res) => {
  try {
    const { numero_entrada } = req.body;

    if (!numero_entrada) {
      return res.status(400).json({ error: 'El campo numero_entrada es obligatorio.' });
    }

    // Buscar la entrada correspondiente
    const entrada = await Entrada.findOne({ numero_entrada });
    if (!entrada) {
      return res.status(404).json({ error: 'Entrada no encontrada.' });
    }

    // Verificar si ya fue convertida 
    const ordenExistente = await OrdenCompra.findOne({ n_orden_compra: { $regex: `^ORD-\\d+$` }, cantidad: entrada.cantidad, id_perfume: entrada.id_perfume });
    if (ordenExistente) {
      return res.status(409).json({ error: 'Ya existe una orden basada en esta entrada.' });
    }

    // Obtener nuevo número de orden
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'orden_compra' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const n_orden_compra = `ORD-${counter.seq.toString().padStart(3, '0')}`;

    // Calcular precios (puedes adaptar esto)
    const precio_unitario = 350;
    const precio_total = entrada.cantidad * precio_unitario;

    // Crear la orden
    const nuevaOrden = new OrdenCompra({
      n_orden_compra,
      id_perfume: entrada.id_perfume,
      cantidad: entrada.cantidad,
      proveedor: entrada.proveedor,
      fecha: entrada.fecha_entrada || entrada.fecha,
      usuario_solicitante: entrada.usuario_registro,
      estado: 'Completada',
      precio_unitario,
      precio_total,
      updatedAt: new Date(),
      observaciones: entrada.observaciones_auditor || '',
      almacen: 'ALM001' 
    });

    await nuevaOrden.save();

    res.status(201).json({
      mensaje: 'Orden de compra creada desde entrada exitosamente.',
      orden: nuevaOrden
    });

  } catch (error) {
    console.error('❌ Error al crear orden desde entrada:', error.message);
    res.status(500).json({ error: 'Error al crear la orden desde la entrada' });
  }
};


module.exports = {
  crearOrdenCompra,
  validarOrdenCompra,
  obtenerOrdenes,
  crearOrdenDesdeEntrada
};
