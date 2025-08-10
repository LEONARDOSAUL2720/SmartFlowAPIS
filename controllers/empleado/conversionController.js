const Entrada = require('../models/entrada_f');
const Traspaso = require('../models/traspaso_f');
const OrdenCompra = require('../models/ordenCompra_f');
const Perfume = require('../models/perfume_f');
const Counter = require('../models/counter_f');

exports.convertirEntradaPorNumero = async (req, res) => {
  try {
    const { numero_entrada } = req.params;
    const usuarioLogeadoId = req.user?._id;

    if (!usuarioLogeadoId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const entrada = await Entrada.findOne({ numero_entrada });
    if (!entrada) {
      return res.status(404).json({ mensaje: 'Entrada no encontrada' });
    }

    const perfume = await Perfume.findById(entrada.id_perfume);
    if (!perfume) {
      return res.status(404).json({ mensaje: 'Perfume no encontrado' });
    }

    if (entrada.tipo === 'Compra') {
      const nOrdenCompra = numero_entrada.replace(/^ENT/i, 'ORD');
      const existeOrden = await OrdenCompra.findOne({ n_orden_compra: nOrdenCompra });
      if (existeOrden) {
        return res.status(409).json({ mensaje: 'Orden ya existe' });
      }

      const precioUnitario = perfume.precio_unitario ?? perfume.precio_venta_per ?? 0;
      const precioTotal = precioUnitario * entrada.cantidad;

      const nuevaOrden = new OrdenCompra({
        n_orden_compra: nOrdenCompra,
        id_perfume: entrada.id_perfume,
        cantidad: entrada.cantidad,
        proveedor: entrada.proveedor,
        usuario_solicitante: usuarioLogeadoId,
        fecha: entrada.fecha_entrada || new Date(),
        precio_unitario: precioUnitario,
        precio_total: precioTotal,
        almacen: entrada.almacen_destino
      });

      await nuevaOrden.save();
      return res.status(201).json({ mensaje: 'Orden de compra creada', orden: nuevaOrden });
    }

    if (entrada.tipo === 'Traspaso') {
      const traspasoCounter = await Counter.findByIdAndUpdate(
        { _id: 'numero_traspaso' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const numeroTraspaso = `TRAS-${traspasoCounter.seq.toString().padStart(3, '0')}`;

      const yaExiste = await Traspaso.findOne({ numero_traspaso: numeroTraspaso });
      if (yaExiste) {
        return res.status(409).json({ mensaje: 'Traspaso ya existe' });
      }

      const nuevoTraspaso = new Traspaso({
        numero_traspaso: numeroTraspaso,
        id_perfume: entrada.id_perfume,
        cantidad: entrada.cantidad,
        proveedor: entrada.proveedor,
        fecha_salida: entrada.fecha_entrada || new Date(),
        usuario_registro: usuarioLogeadoId,
        almacen_salida: entrada.almacen_destino,
        almacen_destino: entrada.almacen_destino
      });

      await nuevoTraspaso.save();

      entrada.referencia_traspaso = numeroTraspaso;
      await entrada.save();

      return res.status(201).json({ mensaje: 'Traspaso creado', traspaso: nuevoTraspaso });
    }

    return res.status(400).json({ mensaje: `Tipo de entrada no reconocido: ${entrada.tipo}` });

  } catch (error) {
    console.error('❌ Error en conversión individual:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};
