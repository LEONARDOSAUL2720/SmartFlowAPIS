const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validaciones para registro
const registerValidation = [
  body('name_user')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .trim(),
  body('correo_user')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password_user')
    .isLength({ min: 4 })
    .withMessage('La contraseña debe tener al menos 4 caracteres'),
  body('rol_user')
    .optional()
    .isIn(['Admin', 'Empleado', 'Auditor'])
    .withMessage('Rol inválido')
];

// Validaciones para login
const loginValidation = [
  body('correo_user')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password_user')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validaciones para actualizar perfil
const updateProfileValidation = [
  body('name_user')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre debe tener entre 3 y 50 caracteres')
    .trim(),
  body('rol_user')
    .optional()
    .isIn(['Admin', 'Empleado', 'Auditor'])
    .withMessage('Rol inválido')
];

// Rutas públicas
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Rutas protegidas
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfileValidation, updateProfile);

module.exports = router;
