const express = require('express');
const Traspaso = require('../../models/traspaso');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const traspasos = await Traspaso.find().populate('id_perfume proveedor usuario_registro validado_por almacen_salida almacen_destino');
    res.json(traspasos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener traspasos', error: err.message });
  }
});

module.exports = router;