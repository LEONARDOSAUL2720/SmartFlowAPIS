const express = require('express');
const { 
  getOrdenCompraCompleta,
  getEntradaCompleta,
  getEntradaTraspasoCompleta,
  getEntradaCompletaInteligente,
  procesarValidacionEntrada,
  rechazarEntrada,
  obtenerTodasLasEntradas
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

// GET /api/auditor/entradas - Obtener todas las entradas con paginación
router.get('/entradas', obtenerTodasLasEntradas);

// NUEVA RUTA: Búsqueda inteligente que detecta automáticamente el tipo
router.get('/entrada-busqueda/:id', getEntradaCompletaInteligente);

// Rutas específicas por tipo
router.get('/entrada/:id', getEntradaCompleta); // Solo compras
router.get('/entrada-traspaso/:id', getEntradaTraspasoCompleta); // Solo traspasos

// POST /api/auditor/validar-entrada/:id - Procesar validación de entrada
router.post('/validar-entrada/:id', procesarValidacionEntrada);

// POST /api/auditor/rechazar-entrada/:numeroEntrada - Rechazar entrada y orden/traspaso relacionado
router.post('/rechazar-entrada/:numeroEntrada', rechazarEntrada);

// Rutas de perfumes 
const perfumesRoutes = require('./perfumesRoutes');
router.use('/perfumes', perfumesRoutes);


module.exports = router;
