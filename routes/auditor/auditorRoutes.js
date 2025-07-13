const express = require('express');
const { body, query } = require('express-validator');
const { 
  getAuditorDashboard,
  getAuditReports,
  generateAuditReport,
  getDataAnalysis,
  exportAuditData
} = require('../../controllers/auditor/auditorController');

const { authMiddleware } = require('../../middleware/auth');
const { requireAuditor } = require('../../middleware/roleMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación Y rol de Auditor
router.use(authMiddleware);
router.use(requireAuditor);

// Validaciones para generar reporte
const generateReportValidation = [
  body('tipo_reporte')
    .isIn(['usuarios', 'actividad', 'seguridad', 'rendimiento'])
    .withMessage('Tipo de reporte inválido'),
  body('fecha_inicio')
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('fecha_fin')
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga')
];

// Validaciones para análisis de datos
const dataAnalysisValidation = [
  query('tipo_analisis')
    .optional()
    .isIn(['usuarios', 'actividad', 'seguridad'])
    .withMessage('Tipo de análisis inválido'),
  query('periodo')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Período debe ser entre 1 y 365 días')
];

// Validaciones para exportación
const exportValidation = [
  query('formato')
    .optional()
    .isIn(['json', 'csv', 'excel'])
    .withMessage('Formato de exportación inválido'),
  query('tipo_datos')
    .optional()
    .isIn(['reportes', 'usuarios', 'actividad'])
    .withMessage('Tipo de datos inválido')
];

// ====== RUTAS DEL AUDITOR ======

// Dashboard principal del auditor
router.get('/dashboard', getAuditorDashboard);

// Gestión de reportes de auditoría
router.get('/reports', getAuditReports);
router.post('/reports/generate', generateReportValidation, generateAuditReport);

// Análisis de datos
router.get('/analytics', dataAnalysisValidation, getDataAnalysis);

// Exportación de datos
router.get('/export', exportValidation, exportAuditData);

module.exports = router;
