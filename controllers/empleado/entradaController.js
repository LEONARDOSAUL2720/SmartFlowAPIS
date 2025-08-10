const Entrada = require('../../models/entrada');
const OrdenCompra = require('../../models/ordenCompra');
const Counter = require('../../models/counter');
const Perfume = require('../../models/perfume');
const Usuario = require('../../models/User');
const Almacen = require('../../models/almacen');

const registrarEntrada = async (req, res) => {
  try {
    console.log('📦 Datos recibidos en req.body:', req.body);

    const { n_orden_compra, fecha_entrada } = req.body;

    if (!n_orden_compra || !fecha_entrada) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const orden = await OrdenCompra.findOne({ n_orden_compra })
      .populate('id_perfume')
      .populate('usuario_solicitante')
      .populate('proveedor');

    if (!orden) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }

    const yaExiste = await Entrada.findOne({ orden_compra: n_orden_compra });
    if (yaExiste) {
      return res.status(409).json({ message: 'Ya existe una entrada con esa orden de compra' });
    }

    const counter = await Counter.findByIdAndUpdate(
      { _id: 'numero_entrada' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const numeroEntrada = `ENT-${counter.seq.toString().padStart(3, '0')}`;

    const entradaData = {
      numero_entrada: numeroEntrada,
      orden_compra: n_orden_compra,
      cantidad: orden.cantidad,
      fecha_entrada: new Date(fecha_entrada),
      proveedor: orden.proveedor?._id || null,
      id_perfume: orden.id_perfume?._id || null,
      usuario_registro: orden.usuario_solicitante?._id || null,
      almacen_destino: orden.almacen || null,
      tipo: 'Compra',
      fecha: new Date()
    };

    const nuevaEntrada = new Entrada(entradaData);
    await nuevaEntrada.save();

    res.status(201).json({ message: 'Entrada registrada correctamente', entrada: nuevaEntrada });

  } catch (error) {
    console.error('❌ Error al registrar entrada:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const getEntradaPorOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findOne({ n_orden_compra: req.params.n_orden_compra })
      .populate('id_perfume')
      .populate('usuario_solicitante')
      .populate('proveedor');

    if (!orden) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    res.json(orden);
  } catch (error) {
    console.error('❌ Error al obtener orden:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const getEntradasPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const entradas = await Entrada.find({ usuario_registro: id })
      .populate('id_perfume')
      .populate('usuario_registro')
      .populate('proveedor')
      .populate('almacen_destino');

    res.json(entradas);
  } catch (error) {
    console.error('❌ Error al obtener entradas del usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const crearEntradaManual = async (req, res) => {
  try {
    const {
      id_perfume,
      cantidad,
      proveedor,
      fecha_entrada,
      usuario_registro,
      tipo,
      almacen_destino
    } = req.body;

    if (!id_perfume || !cantidad || !proveedor || !fecha_entrada || !usuario_registro || !tipo || !almacen_destino) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const counter = await Counter.findByIdAndUpdate(
      { _id: 'numero_entrada' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const numeroEntrada = `ENT-${counter.seq.toString().padStart(3, '0')}`;

    const entradaData = {
      numero_entrada: numeroEntrada,
      id_perfume,
      cantidad,
      proveedor,
      fecha_entrada: new Date(fecha_entrada),
      usuario_registro,
      tipo,
      fecha: new Date(fecha_entrada),
      almacen_destino
    };

    // Si es traspaso, generar referencia
    if (tipo === 'Traspaso') {
      const traspasoCounter = await Counter.findByIdAndUpdate(
        { _id: 'numero_traspaso' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      entradaData.referencia_traspaso = `TRAS-${traspasoCounter.seq.toString().padStart(3, '0')}`;
    }

    const nuevaEntrada = new Entrada(entradaData);
    await nuevaEntrada.save();

    res.status(201).json({ message: 'Entrada creada manualmente', entrada: nuevaEntrada });

  } catch (error) {
    console.error('Error al crear entrada manual:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const getEntradaConDetalles = async (req, res) => {
  try {
    const { numero_entrada } = req.params;

    const entrada = await Entrada.findOne({ numero_entrada });

    if (!entrada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    const perfume = await Perfume.findById(entrada.id_perfume);
    const usuario = await Usuario.findById(entrada.usuario_registro);
    const almacen = await Almacen.findById(entrada.almacen_destino);

    const datos = {
      numero_entrada: entrada.numero_entrada,
      perfume: {
        nombre: perfume?.name_per || '',
        descripcion: perfume?.descripcion_per || ''
      },
      ubicacion: almacen?.nombre || '',
      registrado_por: usuario?.rol_user || '',
      fecha_entrada: entrada.updatedAt
    };

    res.json(datos);
  } catch (error) {
    console.error('Error al obtener detalles de entrada:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  registrarEntrada,
  getEntradaPorOrden,
  getEntradasPorUsuario,
  getEntradaConDetalles,
  crearEntradaManual
};
