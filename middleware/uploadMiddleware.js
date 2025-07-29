const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento en memoria para convertir a base64
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG y GIF'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Middleware para convertir imagen a base64
const convertToBase64 = (req, res, next) => {
  if (req.file) {
    // Convertir buffer a base64
    const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Agregar la cadena base64 al req para que esté disponible en el controlador
    req.imageBase64 = base64String;
    
    console.log('📸 Imagen convertida a base64:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      base64Length: base64String.length
    });
  }
  next();
};

module.exports = {
  uploadUserImage: upload.single('imagen_user'),
  convertToBase64
};
