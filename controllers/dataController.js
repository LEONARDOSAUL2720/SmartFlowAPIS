const Data = require('../models/Data');
const { validationResult } = require('express-validator');

// Obtener todos los datos del usuario
const getAllData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.user._id };
    
    // Filtros opcionales
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const data = await Data.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username firstName lastName');

    const total = await Data.countDocuments(filter);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener datos'
    });
  }
};

// Obtener un dato específico
const getDataById = async (req, res) => {
  try {
    const data = await Data.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'username firstName lastName');

    if (!data) {
      return res.status(404).json({
        error: 'Dato no encontrado',
        message: 'El dato solicitado no existe'
      });
    }

    // Incrementar contador de vistas
    await Data.findByIdAndUpdate(req.params.id, {
      $inc: { 'metadata.views': 1 }
    });

    res.json({ data });

  } catch (error) {
    console.error('Error obteniendo dato:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener dato'
    });
  }
};

// Crear nuevo dato
const createData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const newData = new Data({
      ...req.body,
      userId: req.user._id
    });

    await newData.save();
    await newData.populate('userId', 'username firstName lastName');

    res.status(201).json({
      message: 'Dato creado exitosamente',
      data: newData
    });

  } catch (error) {
    console.error('Error creando dato:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al crear dato'
    });
  }
};

// Actualizar dato
const updateData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const data = await Data.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'username firstName lastName');

    if (!data) {
      return res.status(404).json({
        error: 'Dato no encontrado',
        message: 'El dato solicitado no existe'
      });
    }

    res.json({
      message: 'Dato actualizado exitosamente',
      data
    });

  } catch (error) {
    console.error('Error actualizando dato:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar dato'
    });
  }
};

// Eliminar dato
const deleteData = async (req, res) => {
  try {
    const data = await Data.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!data) {
      return res.status(404).json({
        error: 'Dato no encontrado',
        message: 'El dato solicitado no existe'
      });
    }

    res.json({
      message: 'Dato eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando dato:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al eliminar dato'
    });
  }
};

// Buscar datos
const searchData = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Parámetro de búsqueda requerido',
        message: 'Debe proporcionar un término de búsqueda'
      });
    }

    const data = await Data.find({
      userId: req.user._id,
      $text: { $search: q }
    }).populate('userId', 'username firstName lastName');

    res.json({
      data,
      count: data.length
    });

  } catch (error) {
    console.error('Error buscando datos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al buscar datos'
    });
  }
};

module.exports = {
  getAllData,
  getDataById,
  createData,
  updateData,
  deleteData,
  searchData
};
