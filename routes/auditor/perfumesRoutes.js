const express = require('express');
const router = express.Router();
const { obtenerPerfumes, obtenerOpcionesFiltros, obtenerEstadisticasPerfumes } = require('../../controllers/auditor/perfumesController');

// Middleware de autenticación (importar correctamente)
const { authMiddleware } = require('../../middleware/auth');

// ============================================================================
// RUTAS PARA GESTIÓN DE PERFUMES (AUDITOR)
// ============================================================================

// GET /api/auditor/perfumes - Obtener lista de perfumes con filtros
router.get('/', authMiddleware, obtenerPerfumes);

// GET /api/auditor/perfumes/filtros - Obtener opciones para filtros
router.get('/filtros', authMiddleware, obtenerOpcionesFiltros);

// GET /api/auditor/perfumes/estadisticas - Obtener estadísticas generales
router.get('/estadisticas', authMiddleware, obtenerEstadisticasPerfumes);

module.exports = router;
