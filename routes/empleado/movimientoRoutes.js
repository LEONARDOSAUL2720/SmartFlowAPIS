const express = require('express');
const router = express.Router();

const { crearTraspaso, obtenerInfoPerfume } = require('../../controllers/empleado/movimientoController');
const { authMiddleware } = require('../../middleware/auth');

// Ruta para crear un traspaso
router.post('/crear', authMiddleware, crearTraspaso);

// Ruta para obtener info del perfume (ubicación, marca, stock_actual)
router.post('/info-perfume', authMiddleware, obtenerInfoPerfume);

module.exports = router;
