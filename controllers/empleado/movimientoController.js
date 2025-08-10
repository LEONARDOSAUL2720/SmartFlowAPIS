const mongoose = require('mongoose');
const Perfume = require('../../models/perfume');
const Almacen = require('../../models/almacen');
const Traspaso = require('../../models/traspaso');
const Counter = require('../../models/counter');

exports.crearTraspaso = async (req, res) => {
  try {
    const { nombre_perfume, cantidad, almacen_destino } = req.body;
    const usuarioLogeadoId = req.user?._id;

    if (!usuarioLogeadoId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Buscar perfume por nombre
    const perfume = await Perfume.findOne({ name_per: nombre_perfume });
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume no encontrado' });
    }

    // Validar que el perfume tenga 'ubicacion_per' para almacén de salida
    if (!perfume.ubicacion_per) {
      return res.status(400).json({ message: 'El perfume no tiene una ubicación asignada (ubicacion_per)' });
    }

    // Validar stock general
    if (cantidad > perfume.stock_actual) {
      return res.status(400).json({ message: 'Cantidad supera el stock disponible' });
    }

    const limite = Math.floor(perfume.stock_actual * 0.5);
    if (cantidad > limite) {
      return res.status(400).json({
        message: `No puedes traspasar más del 50% del stock actual. Máximo permitido: ${limite}`
      });
    }

    // Obtener almacén de salida usando ubicacion_per
    const almacenSalida = await Almacen.findOne({ codigo: perfume.ubicacion_per });
    if (!almacenSalida) {
      return res.status(404).json({ message: `Almacén de salida '${perfume.ubicacion_per}' no encontrado` });
    }

    // Obtener almacén de destino
    const almacenDestinoDoc = await Almacen.findOne({ codigo: almacen_destino });
    if (!almacenDestinoDoc) {
      return res.status(404).json({ message: `Almacén de destino '${almacen_destino}' no encontrado` });
    }

    // Validar que almacen_destino no sea igual a ubicacion_per
    if (almacenDestinoDoc.codigo === perfume.ubicacion_per) {
      return res.status(400).json({ message: 'El almacén de destino no puede ser igual al almacén de salida' });
    }

    // Proveedor fijo
    const proveedorFijoId = new mongoose.Types.ObjectId("6886c75e1cb924e47b7a96cd");

    // Generar número de traspaso
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'numero_traspaso' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const numeroTraspaso = `TRAS-${counter.seq.toString().padStart(3, '0')}`;

    // Crear traspaso
    const nuevoTraspaso = new Traspaso({
      numero_traspaso: numeroTraspaso,
      id_perfume: perfume._id,
      cantidad,
      proveedor: proveedorFijoId,
      fecha_salida: new Date(),
      usuario_registro: usuarioLogeadoId,
      almacen_salida: perfume.ubicacion_per,
      almacen_destino: almacen_destino,
      estatus_validacion: 'Pendiente',
    });

    await nuevoTraspaso.save();

    return res.status(201).json({
      message: 'Traspaso registrado exitosamente',
      traspaso: nuevoTraspaso
    });
  } catch (error) {
    console.error('❌ Error al crear traspaso:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// POST - Obtener ubicación, marca y stock_actual del perfume por nombre
exports.obtenerInfoPerfume = async (req, res) => {
  try {
    const { nombre_perfume } = req.body;

    if (!nombre_perfume) {
      return res.status(400).json({ message: 'El campo nombre_perfume es requerido' });
    }

    const perfume = await Perfume.findOne({
      name_per: { $regex: new RegExp(`^${nombre_perfume.trim()}$`, 'i') }
    });

    if (!perfume) {
      return res.status(404).json({ message: 'Perfume no encontrado' });
    }

    return res.status(200).json({
      ubicacion_per: perfume.ubicacion_per,
      marca: perfume.marca || 'Sin marca',
      stock_actual: perfume.stock_actual ?? 'Desconocido'
    });

  } catch (error) {
    console.error('❌ Error al obtener información del perfume:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
