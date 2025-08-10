const express = require('express');
const router = express.Router();
const { crearSalidaManual, obtenerSalidasPorMes } = require('../../controllers/empleado/reportesController');

// Ruta para crear salida manual
router.post('/salida-manual', crearSalidaManual);

// Ruta para obtener salidas por mes
router.get('/por-mes/:mes', obtenerSalidasPorMes);

module.exports = router;
