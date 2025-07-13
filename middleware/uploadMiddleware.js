const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio uploads si no existe
const uploadsDir = path.join(__dirname, '..', 'uploads', 'users');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: userId_timestamp.extension
    const userId = req.body.user_id || Date.now();
    const extension = path.extname(file.originalname);
    const filename = `user_${userId}_${Date.now()}${extension}`;
    cb(null, filename);
  }
});

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

module.exports = {
  uploadUserImage: upload.single('imagen_user'),
  uploadsDir
};
