const express = require('express');
const router = express.Router();
const { crearEntradaDesdeReferencia, getDocumentoPorReferencia } = require('../../controllers/empleado/ingresoDesdeReferenciaController');
const { authMiddleware } = require('../../middleware/auth');

router.post('/entrada/desde-referencia/:referencia', authMiddleware, crearEntradaDesdeReferencia);
router.get('/entrada/documento/:referencia', authMiddleware, getDocumentoPorReferencia);

module.exports = router;
