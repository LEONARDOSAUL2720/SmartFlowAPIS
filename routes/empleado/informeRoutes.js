const express = require('express');
const router = express.Router();
const { obtenerInformePorMes } = require('../../controllers/empleado/informeController');

// GET /api/informe/:mes
router.get('/:mes', obtenerInformePorMes);

module.exports = router;
