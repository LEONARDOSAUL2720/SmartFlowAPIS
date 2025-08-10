const express = require('express');
const router = express.Router();
const {convertirEntradaPorNumero } = require('../../controllers/empleado/conversionController');
const { authMiddleware } = require('../../middleware/auth');

//router.post('/convertir-entradas', convertirEntradasAOrdenes);
router.post('/convertir-entrada/:numero_entrada', authMiddleware, convertirEntradaPorNumero);

module.exports = router;
