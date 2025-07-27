const express = require('express');
const { 
  getOrdenCompraCompleta
} = require('../../controllers/auditor/auditorController');

const { authMiddleware } = require('../../middleware/auth');
const { requireAuditor } = require('../../middleware/roleMiddleware');

// Importar modelos para ruta de debug
const OrdenCompra = require('../../models/OrdenCompra');

const router = express.Router();

// Todas las rutas requieren autenticación Y rol de Auditor
router.use(authMiddleware);
router.use(requireAuditor);

// ====== RUTAS PARA ÓRDENES DE COMPRA ======

// Buscar orden de compra completa (con perfume y proveedor)
router.get('/orden-compra/:id', getOrdenCompraCompleta);

// RUTA DEBUG: Listar todas las órdenes de compra disponibles
router.get('/debug/ordenes', async (req, res) => {
  try {
    console.log('🔧 DEBUG: Listando todas las órdenes de compra');
    const ordenes = await OrdenCompra.find({}).limit(10);
    
    console.log('📋 Total de órdenes encontradas:', ordenes.length);
    
    res.json({
      message: 'Lista de órdenes para debug',
      total: ordenes.length,
      ordenes: ordenes.map(orden => ({
        _id: orden._id.toString(),
        estatus: orden.estatus,
        fecha_orden: orden.fecha_orden,
        precio_total: orden.precio_total
      }))
    });
  } catch (error) {
    console.error('❌ Error en debug de órdenes:', error);
    res.status(500).json({
      error: 'Error obteniendo órdenes para debug',
      message: error.message
    });
  }
});

module.exports = router;
