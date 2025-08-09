const express = require('express');
const { 
  getOrdenCompraCompleta,
  getEntradaCompleta,
  getEntradaTraspasoCompleta,
  getEntradaCompletaInteligente,
  procesarValidacionEntrada,
  rechazarEntrada,
  obtenerTodasLasEntradas,
  obtenerTodosLosPerfumes,
  obtenerOpcionesFiltros
} = require('../../controllers/auditor/auditorController');

// Importar rutas de salidas
const salidasRoutes = require('./salidasRoutes');

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

// GET /api/auditor/perfumes - Obtener todos los perfumes con filtros (para Android)
router.get('/perfumes', obtenerTodosLosPerfumes);

// GET /api/auditor/perfumes/filtros - Obtener opciones de filtros (para Android)
router.get('/perfumes/filtros', obtenerOpcionesFiltros);

// NUEVA RUTA: Búsqueda inteligente que detecta automáticamente el tipo
router.get('/entrada-busqueda/:id', getEntradaCompletaInteligente);

// Rutas específicas por tipo
router.get('/entrada/:id', getEntradaCompleta); // Solo compras
router.get('/entrada-traspaso/:id', getEntradaTraspasoCompleta); // Solo traspasos

// POST /api/auditor/validar-entrada/:id - Procesar validación de entrada
router.post('/validar-entrada/:id', procesarValidacionEntrada);

// POST /api/auditor/rechazar-entrada/:numeroEntrada - Rechazar entrada y orden/traspaso relacionado
router.post('/rechazar-entrada/:numeroEntrada', rechazarEntrada);

// Rutas de perfumes específicas (si las necesitas)
const perfumesRoutes = require('./perfumesRoutes');
router.use('/perfumes-detalle', perfumesRoutes);

// Rutas de salidas para auditoría
router.use('/salidas', salidasRoutes);

// Rutas de reportes para auditoría
const reportesRoutes = require('./reportesRoutes');
router.use('/reportes', reportesRoutes);

module.exports = router;
