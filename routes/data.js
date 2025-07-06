const express = require('express');
const { body } = require('express-validator');
const {
  getAllData,
  getDataById,
  createData,
  updateData,
  deleteData,
  searchData
} = require('../controllers/dataController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Validaciones para crear/actualizar datos
const dataValidation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede tener más de 1000 caracteres')
    .trim(),
  body('category')
    .optional()
    .isIn(['general', 'important', 'urgent', 'completed'])
    .withMessage('Categoría inválida'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Los tags deben ser un array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
];

// Rutas CRUD
router.get('/', getAllData);
router.get('/search', searchData);
router.get('/:id', getDataById);
router.post('/', dataValidation, createData);
router.put('/:id', dataValidation, updateData);
router.delete('/:id', deleteData);

module.exports = router;
