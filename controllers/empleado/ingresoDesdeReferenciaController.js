const Entrada = require('../../models/entrada');
const Traspaso = require('../../models/traspaso');
const OrdenCompra = require('../../models/ordenCompra');
const Counter = require('../../models/counter');

exports.crearEntradaDesdeReferencia = async (req, res) => {
  try {
    const { referencia } = req.params;
    const usuarioLogeadoId = req.user?._id;

    if (!usuarioLogeadoId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    let documento = null;
    let tipo = '';

    // Determinar tipo de documento según prefijo
    if (referencia.startsWith('ORD-')) {
      tipo = 'Compra';
      documento = await OrdenCompra.findOne({ n_orden_compra: referencia });
    } else if (referencia.startsWith('TRAS-')) {
      tipo = 'Traspaso';
      documento = await Traspaso.findOne({ numero_traspaso: referencia });
    } else {
      return res.status(400).json({ message: 'Referencia inválida' });
    }

    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Verificar si ya existe una entrada para esa referencia
    let entradaExistente = null;

    if (tipo === 'Traspaso') {
      entradaExistente = await Entrada.findOne({ referencia_traspaso: referencia });
    } else if (tipo === 'Compra') {
      entradaExistente = await Entrada.findOne({ orden_compra: documento._id });
    }

    if (entradaExistente) {
      return res.status(409).json({ message: 'Ya existe una entrada con esa referencia' });
    }

    // Obtener número de entrada consecutivo
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'numero_entrada' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const numeroEntrada = `ENT-${counter.seq.toString().padStart(3, '0')}`;

    // Construir el objeto de entrada
    const entradaData = {
      numero_entrada: numeroEntrada,
      id_perfume: documento.id_perfume,
      cantidad: documento.cantidad,
      proveedor: documento.proveedor,
      fecha_entrada: documento.fecha || documento.fecha_salida || new Date(),
      usuario_registro: usuarioLogeadoId,
      almacen_destino: documento.almacen || documento.almacen_destino || null,
      tipo,
      fecha: documento.fecha || documento.fecha_salida || new Date(),
      referencia_traspaso: tipo === 'Traspaso' ? referencia : '',
      orden_compra: tipo === 'Compra' ? documento._id : null
    };

    const nuevaEntrada = new Entrada(entradaData);
    await nuevaEntrada.save();

    res.status(201).json({
      message: 'Entrada creada desde referencia correctamente',
      entrada: nuevaEntrada
    });
  } catch (error) {
    console.error('❌ Error al crear entrada desde referencia:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

exports.getDocumentoPorReferencia = async (req, res) => {
  try {
    const { referencia } = req.params;

    if (referencia.startsWith('ORD-')) {
      const orden = await OrdenCompra.findOne({ n_orden_compra: referencia })
        .populate('id_perfume proveedor usuario_solicitante');
      if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });
      return res.json({ tipo: 'Compra', documento: orden });
    }

    if (referencia.startsWith('TRAS-')) {
      const traspaso = await Traspaso.findOne({ numero_traspaso: referencia })
        .populate('id_perfume proveedor usuario_registro almacen_salida almacen_destino');
      if (!traspaso) return res.status(404).json({ message: 'Traspaso no encontrado' });
      return res.json({ tipo: 'Traspaso', documento: traspaso });
    }

    return res.status(400).json({ message: 'Referencia inválida' });
  } catch (error) {
    console.error('❌ Error al obtener documento por referencia:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};
