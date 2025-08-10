const mongoose = require('mongoose');
const Salida = require('../../models/Salida');


const USUARIO_REGISTRO_FIJO = "6887d89d3393bae7f2eb8678"; // ID en string

// Crear salida manual
const crearSalidaManual = async (req, res) => {
    try {
        const { nombre_perfume, almacen_salida, cantidad, tipo, fecha_salida } = req.body;

        if (!nombre_perfume || !almacen_salida || !cantidad || !tipo || !fecha_salida) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Crear documento
        const nuevaSalida = new Salida({
            nombre_perfume,
            almacen_salida,
            cantidad,
            tipo,
            fecha_salida: new Date(fecha_salida),
            usuario_registro: new mongoose.Types.ObjectId(USUARIO_REGISTRO_FIJO),
            updated_at: new Date()
        });

        await nuevaSalida.save();

        res.status(201).json({
            message: 'Salida creada manualmente con éxito',
            salida: nuevaSalida
        });
    } catch (error) {
        console.error('Error al crear salida manual:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Obtener salidas por mes
const obtenerSalidasPorMes = async (req, res) => {
    try {
        const mes = parseInt(req.params.mes, 10); // Ej: "08"
        if (isNaN(mes) || mes < 1 || mes > 12) {
            return res.status(400).json({ message: 'Mes inválido' });
        }

        const añoActual = new Date().getFullYear();
        const fechaInicio = new Date(añoActual, mes - 1, 1);
        const fechaFin = new Date(añoActual, mes, 1);

        const salidas = await Salida.find({
            fecha_salida: { $gte: fechaInicio, $lt: fechaFin }
        }).select('nombre_perfume tipo cantidad fecha_salida -_id'); // solo estos campos, sin _id

        res.json({
            mes: mes.toString().padStart(2, '0'),
            año: añoActual,
            total_registros: salidas.length,
            datos: salidas
        });
    } catch (error) {
        console.error('Error al obtener salidas por mes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    crearSalidaManual,
    obtenerSalidasPorMes
};
