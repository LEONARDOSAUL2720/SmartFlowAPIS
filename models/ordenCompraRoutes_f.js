const express = require('express');
const router = express.Router();
const OrdenCompra = require('../models/ordenCompra');
const { crearOrdenCompra, validarOrdenCompra } = require('../controllers/ordenCompraController');

// Obtener una orden de compra por ID
router.get('/ordenes_compra/:id', async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id)
      .populate('perfume')     
      .populate('usuario');   

    if (!orden) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    res.json(orden);
  } catch (error) {
    console.error('❌ Error al obtener orden de compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva orden de compra
router.post('/', crearOrdenCompra);

// Validar una orden de compra existente
router.put('/validar/:id', validarOrdenCompra);

//router.get('/', obtenerOrdenes);

module.exports = router;
