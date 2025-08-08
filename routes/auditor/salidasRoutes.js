const express = require('express');
const { 
  obtenerTodasLasSalidas,
  obtenerSalidaCompleta,
  marcarComoAuditada,
  reportarInconsistencia,
  obtenerOpcionesFiltros
} = require('../../controllers/auditor/salidasController');

const { authMiddleware } = require('../../middleware/auth');
const { requireAuditor } = require('../../middleware/roleMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación Y rol de Auditor
router.use(authMiddleware);
router.use(requireAuditor);

// ============================================================================
// RUTAS PARA GESTIÓN DE SALIDAS - AUDITOR
// ============================================================================

// Obtener todas las salidas con filtros y paginación
// GET /api/auditor/salidas?page=1&limit=10&tipo=Venta&estatus_auditoria=pendiente&busqueda=...
router.get('/', obtenerTodasLasSalidas);

// Obtener salida específica por ID o número
// GET /api/auditor/salidas/SAL-001 o /api/auditor/salidas/60f7b2c8d4b8c123456789ab
router.get('/:id', obtenerSalidaCompleta);

// Marcar salida como auditada
// PUT /api/auditor/salidas/:id/auditar
router.put('/:id/auditar', marcarComoAuditada);

// Reportar inconsistencia en salida
// PUT /api/auditor/salidas/:id/inconsistencia
router.put('/:id/inconsistencia', reportarInconsistencia);

// Obtener opciones de filtros (tipos, almacenes, etc.)
// GET /api/auditor/salidas/opciones/filtros
router.get('/opciones/filtros', obtenerOpcionesFiltros);

module.exports = router;
