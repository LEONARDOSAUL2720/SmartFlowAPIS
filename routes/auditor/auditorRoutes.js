const express = require('express');
const { 
  getOrdenCompraCompleta,
  getEntradaCompleta,
  procesarValidacionEntrada
} = require('../../controllers/auditor/auditorController');

const { authMiddleware } = require('../../middleware/auth');
const { requireAuditor } = require('../../middleware/roleMiddleware');

// Importar modelos para ruta de debug
const OrdenCompra = require('../../models/OrdenCompra');

const router = express.Router();

// Todas las rutas requieren autenticación Y rol de Auditor
router.use(authMiddleware);
router.use(requireAuditor);

// Buscar orden de compra completa por número de orden (con perfume y proveedor)
router.get('/orden-compra/:id', getOrdenCompraCompleta);
// GET /api/auditor/entrada/:id
router.get('/entrada/:id', getEntradaCompleta);
// POST /api/auditor/validar-entrada/:id - Procesar validación de entrada
router.post('/validar-entrada/:id', procesarValidacionEntrada);


module.exports = router;
