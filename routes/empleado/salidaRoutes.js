const express = require('express');
const router = express.Router();
const salidaController = require('../../controllers/empleado/salidaController');
const { authMiddleware } = require('../../middleware/auth');

// Obtener almacen_id por nombre de perfume
router.get('/almacen/:nombre_perfume', salidaController.obtenerAlmacenPorNombrePerfume);

// Crear registro de salida
router.post('/crear', authMiddleware, salidaController.crearSalida);

// Ruta POST para obtener la ubicacion_per desde body
router.post('/obtener-ubicacion', salidaController.obtenerUbicacionDesdeBody);

module.exports = router;
