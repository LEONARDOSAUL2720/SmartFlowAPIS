const Salida = require('../../models/Salida');
const Perfume = require('../../models/perfume');

// Obtener ubicacion_per (almacen) de un perfume por name_per
exports.obtenerAlmacenPorNombrePerfume = async (req, res) => {
  try {
    const { nombre_perfume } = req.params;

    const perfume = await Perfume.findOne({
      name_per: { $regex: new RegExp(`^${nombre_perfume.trim()}$`, 'i') }
    });

    if (!perfume) {
      return res.status(404).json({ message: 'Perfume no encontrado' });
    }

    return res.status(200).json({ almacen_id: perfume.ubicacion_per });
  } catch (error) {
    console.error('Error al obtener almacen_id:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear salida con validación del 15% y uso de ubicacion_per en lugar de almacen_id
exports.crearSalida = async (req, res) => {
  try {
    const { nombre_perfume, cantidad, tipo } = req.body;
    const usuarioLogeadoId = req.user?._id;

    if (!usuarioLogeadoId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const perfume = await Perfume.findOne({
      name_per: { $regex: new RegExp(`^${nombre_perfume.trim()}$`, 'i') }
    });

    if (!perfume) {
      return res.status(404).json({ message: 'Perfume no encontrado' });
    }

    if (!perfume.ubicacion_per) {
      return res.status(400).json({ message: 'El perfume no tiene una ubicación asignada' });
    }

    const stockActual = perfume.stock_actual;
    const stockMinimoPermitido = Math.floor(stockActual * 0.15);

    if ((stockActual - cantidad) < stockMinimoPermitido) {
      return res.status(400).json({
        message: `No se puede registrar la salida. El stock no puede quedar por debajo del 15%. Stock actual: ${stockActual}, mínimo permitido tras salida: ${stockMinimoPermitido}`
      });
    }

    const fechaSalida = new Date();

    const nuevaSalida = new Salida({
      nombre_perfume,
      almacen_salida: perfume.ubicacion_per,
      cantidad,
      tipo,
      fecha_salida: fechaSalida,
      updated_at: fechaSalida,
      usuario_registro: usuarioLogeadoId
    });

    await nuevaSalida.save();

    return res.status(201).json({
      message: 'Salida registrada correctamente',
      salida: nuevaSalida
    });
  } catch (error) {
    console.error('Error al registrar salida:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST - Obtener ubicacion_per, marca y stock_actual desde el body con nombre_perfume
exports.obtenerUbicacionDesdeBody = async (req, res) => {
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
      stock_actual: perfume.stock_actual ?? 0
    });

  } catch (error) {
    console.error('Error al obtener datos del perfume:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
