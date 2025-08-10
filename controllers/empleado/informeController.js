const Entrada = require('../../models/entrada');
const Salida = require('../../models/Salida');

const obtenerInformePorMes = async (req, res) => {
  try {
    const { mes } = req.params; // mes en formato "MM"

    if (!mes || mes.length !== 2) {
      return res.status(400).json({ message: 'Debes enviar el mes en formato MM' });
    }

    // Entradas filtradas por mes con populate para traer el nombre del perfume
    const entradas = await Entrada.find({
      $expr: { $eq: [{ $month: "$fecha_entrada" }, parseInt(mes)] }
    }, {
      id_perfume: 1,
      cantidad: 1,
      fecha_entrada: 1,
      almacen_destino: 1
    }).populate('id_perfume', 'name_per');

    // Formatear para reemplazar id_perfume por name_per
    const entradasFormateadas = entradas.map(ent => ({
      nombre_perfume: ent.id_perfume ? ent.id_perfume.name_per : null,
      cantidad: ent.cantidad,
      fecha_entrada: ent.fecha_entrada,
      almacen_destino: ent.almacen_destino
    }));

    // Salidas filtradas por mes
    const salidas = await Salida.find({
      $expr: { $eq: [{ $month: "$fecha_salida" }, parseInt(mes)] }
    }, {
      nombre_perfume: 1,
      cantidad: 1,
      fecha_salida: 1,
      almacen_salida: 1
    });

    res.json({
      mes_consultado: mes,
      entradas: entradasFormateadas,
      salidas
    });

  } catch (error) {
    console.error('Error al obtener el informe:', error);
    res.status(500).json({ message: 'Error al obtener el informe' });
  }
};

module.exports = {
  obtenerInformePorMes
};
