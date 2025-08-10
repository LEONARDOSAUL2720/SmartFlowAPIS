const express = require('express');
const router = express.Router();
const entradaController = require('../../controllers/empleado/entradaController');

// GET: Obtener orden de compra por número (para precargar datos)
router.get('/entrada/orden/:orden_compra', entradaController.getEntradaPorOrden);

// POST: Registrar nueva entrada basada en una orden de compra
router.post('/entrada', entradaController.registrarEntrada);

// GET: Obtener entradas por usuario
router.get('/entrada/usuario/:id', entradaController.getEntradasPorUsuario);

// POST: Crear entrada manual sin necesidad de orden de compra
router.post('/entrada/manual', entradaController.crearEntradaManual);

// GET /api/entrada/detalles/ENT-008
router.get('/detalles/:numero_entrada', entradaController.getEntradaConDetalles);

module.exports = router;
