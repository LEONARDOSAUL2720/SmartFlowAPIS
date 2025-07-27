const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const OrdenCompra = require('../models/OrdenCompra');
const Perfume = require('../models/Perfume');
const Proveedor = require('../models/Proveedor');

async function crearDatosPrueba() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado a MongoDB');

    // Crear proveedor de prueba
    const proveedor = new Proveedor({
      nombre_proveedor: 'Perfumerías Exclusivas S.A.',
      rfc: 'PEX230715ABC',
      contacto: 'María García',
      telefono: '555-0123',
      email: 'ventas@perfumeriasexclusivas.com',
      direccion: 'Av. Reforma 123, Ciudad de México',
      fecha_registro: new Date(),
      estado: 'Activo'
    });

    const proveedorGuardado = await proveedor.save();
    console.log('✅ Proveedor creado:', proveedorGuardado._id);

    // Crear perfume de prueba
    const perfume = new Perfume({
      name_per: 'Chanel No. 5',
      descripcion_per: 'Perfume clásico y elegante con notas florales',
      categoria_per: 'Dama',
      precio_venta_per: 2500.00,
      stock_per: 50,
      stock_minimo_per: 10,
      ubicacion_per: 'Estante A-12',
      fecha_expiracion: new Date('2026-12-31'),
      estado: 'Activo'
    });

    const perfumeGuardado = await perfume.save();
    console.log('✅ Perfume creado:', perfumeGuardado._id);

    // Crear orden de compra de prueba
    const ordenCompra = new OrdenCompra({
      n_orden_compra: '1',
      id_perfume: perfumeGuardado._id,
      id_proveedor: proveedorGuardado._id,
      cantidad: 100,
      precio_unitario: 120.00,
      precio_total: 12000.00,
      fecha_orden: new Date('2025-07-14T12:00:00Z'),
      estatus: 'pendiente'
    });

    const ordenGuardada = await ordenCompra.save();
    console.log('✅ Orden de compra creada:', {
      _id: ordenGuardada._id,
      n_orden_compra: ordenGuardada.n_orden_compra
    });

    // Crear más órdenes de prueba
    for (let i = 2; i <= 5; i++) {
      const nuevaOrden = new OrdenCompra({
        n_orden_compra: i.toString(),
        id_perfume: perfumeGuardado._id,
        id_proveedor: proveedorGuardado._id,
        cantidad: 50 + (i * 10),
        precio_unitario: 100 + (i * 5),
        precio_total: (50 + (i * 10)) * (100 + (i * 5)),
        fecha_orden: new Date(),
        estatus: i % 2 === 0 ? 'completada' : 'pendiente'
      });

      await nuevaOrden.save();
      console.log(`✅ Orden ${i} creada`);
    }

    console.log('🎉 Datos de prueba creados exitosamente');
    console.log('📝 Puedes usar los números: 1, 2, 3, 4, 5 para probar');
    
  } catch (error) {
    console.error('❌ Error creando datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

crearDatosPrueba();
