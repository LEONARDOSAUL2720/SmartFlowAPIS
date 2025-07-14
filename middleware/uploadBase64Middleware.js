const multer = require('multer');

// Configuración para recibir archivos en memoria (Base64)
const storage = multer.memoryStorage();

const uploadBase64 = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Validar que sea imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// Middleware para convertir imagen a Base64
const processImageToBase64 = (req, res, next) => {
  if (req.file) {
    try {
      // Convertir buffer a Base64
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      
      // Crear data URL completo
      req.imageBase64 = `data:${mimeType};base64,${base64}`;
      
      console.log('✅ Imagen convertida a Base64');
      console.log('📏 Tamaño Base64:', req.imageBase64.length, 'caracteres');
      
    } catch (error) {
      console.error('❌ Error convirtiendo imagen a Base64:', error);
      return res.status(400).json({
        error: 'Error procesando imagen',
        message: 'No se pudo convertir la imagen'
      });
    }
  }
  next();
};

module.exports = {
  uploadUserImageBase64: uploadBase64.single('imagen_user'),
  processImageToBase64
};
