const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { requireAuditor } = require('../../middleware/roleMiddleware');
const { 
  generarReporteEntradas, 
  obtenerOpcionesFiltrosReporte 
} = require('../../controllers/auditor/ReporteEntradasAuditorController');
const { 
  generarReporteSalidas, 
  obtenerOpcionesFiltrosSalidas 
} = require('../../controllers/auditor/ReporteSalidasAuditorController');

// ============================================================================
// RUTAS PARA REPORTES DE ENTRADAS (AUDITOR) jejeje
// ============================================================================

/**
 * @route   GET /api/auditor/reportes/entradas
 * @desc    Generar reporte ejecutivo de entradas con filtros de fecha
 * @access  Auditor
 * @params  fecha_desde, fecha_hasta, tipo_reporte, formato, incluir_rechazadas
 */
router.get('/entradas', 
  authMiddleware, 
  requireAuditor, 
  generarReporteEntradas
);

/**
 * @route   GET /api/auditor/reportes/entradas/filtros
 * @desc    Obtener opciones disponibles para filtros del reporte
 * @access  Auditor
 */
router.get('/entradas/filtros', 
  authMiddleware, 
  requireAuditor, 
  obtenerOpcionesFiltrosReporte
);

// ============================================================================
// RUTAS PARA REPORTES DE SALIDAS (AUDITOR)
// ============================================================================

/**
 * @route   GET /api/auditor/reportes/salidas
 * @desc    Generar reporte ejecutivo de salidas con filtros de fecha y tipo
 * @access  Auditor
 * @params  fecha_desde, fecha_hasta, tipo_reporte, tipo_salida, formato
 */
router.get('/salidas', 
  authMiddleware, 
  requireAuditor, 
  generarReporteSalidas
);

/**
 * @route   GET /api/auditor/reportes/salidas/filtros
 * @desc    Obtener opciones disponibles para filtros del reporte de salidas
 * @access  Auditor
 */
router.get('/salidas/filtros', 
  authMiddleware, 
  requireAuditor, 
  obtenerOpcionesFiltrosSalidas
);

module.exports = router;
