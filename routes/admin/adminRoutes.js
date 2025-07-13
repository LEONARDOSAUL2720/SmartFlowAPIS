const express = require('express');
const { body, param } = require('express-validator');
const { 
  createUser,
  getUsers,
  updateUser,
  deleteUser
} = require('../../controllers/admin/adminController');

const { authMiddleware } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleMiddleware');
const { uploadUserImage } = require('../../middleware/uploadMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación Y rol de Admin
router.use(authMiddleware);
router.use(requireAdmin);

// Validaciones para crear usuario
const createUserValidation = [
  body('name_user')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre debe tener entre 3 y 50 caracteres')
    .trim(),
  body('correo_user')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password_user')
    .isLength({ min: 4 })
    .withMessage('La contraseña debe tener al menos 4 caracteres'),
  body('rol_user')
    .isIn(['Admin', 'Empleado', 'Auditor'])
    .withMessage('Rol inválido')
];

// Validaciones para actualizar usuario
const updateUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('ID de usuario inválido'),
  body('name_user')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre debe tener entre 3 y 50 caracteres')
    .trim(),
  body('correo_user')
    .optional()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('rol_user')
    .optional()
    .isIn(['Admin', 'Empleado', 'Auditor'])
    .withMessage('Rol inválido'),
  body('estado_user')
    .optional()
    .isBoolean()
    .withMessage('Estado debe ser verdadero o falso')
];

// ====== RUTAS DE GESTIÓN DE USUARIOS (ADMIN) ======

// Crear nuevo usuario (con imagen opcional)
router.post('/users', uploadUserImage, createUserValidation, createUser);

// Obtener lista de usuarios
router.get('/users', getUsers);

// Actualizar usuario (con imagen opcional)
router.put('/users/:userId', uploadUserImage, updateUserValidation, updateUser);

// Eliminar usuario
router.delete('/users/:userId', 
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  deleteUser
);

module.exports = router;
