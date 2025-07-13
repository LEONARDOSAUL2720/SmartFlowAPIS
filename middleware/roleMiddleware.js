// Middleware para validar roles específicos

// Middleware para verificar que el usuario tiene un rol específico
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado (debe llamarse después de authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
          message: 'Debes estar logueado para acceder a este recurso'
        });
      }

      const userRole = req.user.rol_user;

      // Verificar que el rol del usuario esté en la lista de roles permitidos
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: `Tu rol '${userRole}' no tiene permisos para acceder a este recurso`
        });
      }

      next();
    } catch (error) {
      console.error('Error en middleware de rol:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error verificando permisos'
      });
    }
  };
};

// Middlewares específicos para cada rol
const requireAdmin = requireRole(['Admin']);
const requireEmpleado = requireRole(['Empleado']);
const requireAuditor = requireRole(['Auditor']);

// Middleware para recursos que pueden acceder múltiples roles
const requireAdminOrAuditor = requireRole(['Admin', 'Auditor']);
const requireEmpleadoOrAuditor = requireRole(['Empleado', 'Auditor']);

module.exports = {
  requireRole,
  requireAdmin,
  requireEmpleado,
  requireAuditor,
  requireAdminOrAuditor,
  requireEmpleadoOrAuditor
};
