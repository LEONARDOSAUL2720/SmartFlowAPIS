package com.example.smartflow

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import org.json.JSONArray
import org.json.JSONObject

class EntradasAuditor : AppCompatActivity() {

    // Configuración de la API
    private val BASE_URL = "https://smartflow-mwmm.onrender.com/api"

    // NUEVA RUTA: Búsqueda inteligente que detecta automáticamente el tipo
    private val ENTRADA_BUSQUEDA_INTELIGENTE = "$BASE_URL/auditor/entrada-busqueda"

    // Rutas específicas (para fallback si es necesario)
    private val ENTRADA_ENDPOINT = "$BASE_URL/auditor/entrada"
    private val ENTRADA_TRASPASO_ENDPOINT = "$BASE_URL/auditor/entrada-traspaso"
    
    // NUEVA RUTA: Rechazar entrada
    private val RECHAZAR_ENTRADA_ENDPOINT = "$BASE_URL/auditor/rechazar-entrada"

    // UI Components principales
    private lateinit var etNumeroEntrada: EditText
    private lateinit var btnBuscarEntrada: Button

    // Container principal de detalles
    private lateinit var containerDetalles: LinearLayout

    // Card de validaciones
    private lateinit var cardValidaciones: LinearLayout

    // Entrada Fields
    private lateinit var tvNumeroEntrada: TextView
    private lateinit var tvCantidadEntrada: TextView
    private lateinit var tvProveedorEntrada: TextView
    private lateinit var tvFechaEntrada: TextView
    private lateinit var tvEstatusEntrada: TextView
    private lateinit var tvTipoEntrada: TextView

    // Campos flexibles que cambian según el tipo
    private lateinit var tvTituloSeccionDos: TextView // "Orden de Compra" o "Traspaso Original"
    private lateinit var tvNumeroOrdenOTraspaso: TextView
    private lateinit var tvCantidad: TextView
    private lateinit var tvPrecioUnitario: TextView
    private lateinit var tvPrecioTotal: TextView
    private lateinit var tvFechaOrden: TextView
    private lateinit var tvEstatus: TextView

    // Campos específicos para traspasos
    private lateinit var tvFechaSalida: TextView
    private lateinit var tvAlmacenSalida: TextView
    private lateinit var tvAlmacenEntrada: TextView
    private lateinit var tvReferenciaTraspaso: TextView

    // Perfume Fields
    private lateinit var tvNombrePerfume: TextView
    private lateinit var tvDescripcionPerfume: TextView
    private lateinit var tvCategoriaPerfume: TextView
    private lateinit var tvPrecioVentaPerfume: TextView
    private lateinit var tvStockPerfume: TextView
    private lateinit var tvStockMinimoPerfume: TextView
    private lateinit var tvUbicacionPerfume: TextView
    private lateinit var tvFechaExpiracionPerfume: TextView
    private lateinit var tvEstadoPerfume: TextView

    // Proveedor Fields
    private lateinit var tvNombreProveedor: TextView
    private lateinit var tvRfcProveedor: TextView
    private lateinit var tvContactoProveedor: TextView
    private lateinit var tvTelefonoProveedor: TextView
    private lateinit var tvEmailProveedor: TextView
    private lateinit var tvDireccionProveedor: TextView
    private lateinit var tvEstadoProveedor: TextView

    // Validación Fields
    private lateinit var tvEstadoValidacion: TextView
    private lateinit var tvMensajePrincipal: TextView
    private lateinit var tvAccionRecomendada: TextView
    private lateinit var tvSiguientePaso: TextView
    private lateinit var tvTiempoResolucion: TextView
    private lateinit var tvPorcentajeCumplimiento: TextView
    private lateinit var tvNivelRiesgo: TextView

    // Validaciones individuales (que cambiarán según el tipo)
    private lateinit var tvValidacion1: TextView // Proveedor o Perfume
    private lateinit var tvValidacion2: TextView // Cantidad
    private lateinit var tvValidacion3: TextView // Fecha
    private lateinit var tvValidacion4: TextView // Precio o Almacenes
    private lateinit var tvValidacion5: TextView // Estado Orden o Estado Traspaso

    // Contenedores de discrepancias
    private lateinit var layoutDiscrepancias: LinearLayout
    private lateinit var containerDiscrepanciasCriticas: LinearLayout
    private lateinit var containerDiscrepanciasImportantes: LinearLayout
    private lateinit var containerAdvertencias: LinearLayout
    private lateinit var containerRecomendaciones: LinearLayout

    // Botón validar
    private lateinit var btnValidarEntrada: Button
    
    // Botón rechazar (NUEVO)
    private lateinit var btnRechazarEntrada: Button

    private lateinit var requestQueue: RequestQueue

    // Variable para controlar el tipo de entrada actual
    private var tipoEntradaActual: String = "Compra" // "Compra" o "Traspaso"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.entradas_auditor)

        initializeViews()
        setupClickListeners()

        requestQueue = Volley.newRequestQueue(this)

        Log.d("EntradasAuditor", "Actividad de Entradas Auditor iniciada")
    }

    private fun initializeViews() {
        // Búsqueda
        etNumeroEntrada = findViewById(R.id.et_numero_entrada)
        btnBuscarEntrada = findViewById(R.id.btn_buscar_entrada)

        // Container principal de detalles
        containerDetalles = findViewById(R.id.container_detalles)
        cardValidaciones = findViewById(R.id.card_validaciones)

        // Entrada Fields
        tvNumeroEntrada = findViewById(R.id.tv_numero_entrada)
        tvCantidadEntrada = findViewById(R.id.tv_cantidad_entrada)
        tvProveedorEntrada = findViewById(R.id.tv_proveedor_entrada)
        tvFechaEntrada = findViewById(R.id.tv_fecha_entrada)
        tvEstatusEntrada = findViewById(R.id.tv_estatus_entrada)
        tvTipoEntrada = findViewById(R.id.tv_tipo_entrada)

        // Campos flexibles
        tvTituloSeccionDos = findViewById(R.id.tv_titulo_seccion_dos)
        tvNumeroOrdenOTraspaso = findViewById(R.id.tv_numero_orden)
        tvCantidad = findViewById(R.id.tv_cantidad)
        tvPrecioUnitario = findViewById(R.id.tv_precio_unitario)
        tvPrecioTotal = findViewById(R.id.tv_precio_total)
        tvFechaOrden = findViewById(R.id.tv_fecha_orden)
        tvEstatus = findViewById(R.id.tv_estatus)

        // Campos específicos para traspasos
        tvFechaSalida = findViewById(R.id.tv_fecha_salida)
        tvAlmacenSalida = findViewById(R.id.tv_almacen_salida)
        tvAlmacenEntrada = findViewById(R.id.tv_almacen_entrada)
        tvReferenciaTraspaso = findViewById(R.id.tv_referencia_traspaso)

        // Perfume
        tvNombrePerfume = findViewById(R.id.tv_nombre_perfume)
        tvDescripcionPerfume = findViewById(R.id.tv_descripcion_perfume)
        tvCategoriaPerfume = findViewById(R.id.tv_categoria_perfume)
        tvPrecioVentaPerfume = findViewById(R.id.tv_precio_venta_perfume)
        tvStockPerfume = findViewById(R.id.tv_stock_perfume)
        tvStockMinimoPerfume = findViewById(R.id.tv_stock_minimo_perfume)
        tvUbicacionPerfume = findViewById(R.id.tv_ubicacion_perfume)
        tvFechaExpiracionPerfume = findViewById(R.id.tv_fecha_expiracion_perfume)
        tvEstadoPerfume = findViewById(R.id.tv_estado_perfume)

        // Proveedor
        tvNombreProveedor = findViewById(R.id.tv_nombre_proveedor)
        tvRfcProveedor = findViewById(R.id.tv_rfc_proveedor)
        tvContactoProveedor = findViewById(R.id.tv_contacto_proveedor)
        tvTelefonoProveedor = findViewById(R.id.tv_telefono_proveedor)
        tvEmailProveedor = findViewById(R.id.tv_email_proveedor)
        tvDireccionProveedor = findViewById(R.id.tv_direccion_proveedor)
        tvEstadoProveedor = findViewById(R.id.tv_estado_proveedor)

        // Validaciones
        tvEstadoValidacion = findViewById(R.id.tv_estado_validacion)
        tvMensajePrincipal = findViewById(R.id.tv_mensaje_principal)
        tvAccionRecomendada = findViewById(R.id.tv_accion_recomendada)
        tvSiguientePaso = findViewById(R.id.tv_siguiente_paso)
        tvTiempoResolucion = findViewById(R.id.tv_tiempo_resolucion)
        tvPorcentajeCumplimiento = findViewById(R.id.tv_porcentaje_cumplimiento)
        tvNivelRiesgo = findViewById(R.id.tv_nivel_riesgo)

        // Validaciones individuales (nombres genéricos)
        tvValidacion1 = findViewById(R.id.tv_proveedor_validacion)
        tvValidacion2 = findViewById(R.id.tv_cantidad_validacion)
        tvValidacion3 = findViewById(R.id.tv_fecha_validacion)
        tvValidacion4 = findViewById(R.id.tv_precio_validacion)
        tvValidacion5 = findViewById(R.id.tv_estado_orden_validacion)

        // Contenedores de discrepancias
        layoutDiscrepancias = findViewById(R.id.layout_discrepancias)
        containerDiscrepanciasCriticas = findViewById(R.id.container_discrepancias_criticas)
        containerDiscrepanciasImportantes = findViewById(R.id.container_discrepancias_importantes)
        containerAdvertencias = findViewById(R.id.container_advertencias)
        containerRecomendaciones = findViewById(R.id.container_recomendaciones)

        // Botón validar
        btnValidarEntrada = findViewById(R.id.btn_validar_entrada)
        
        // Botón rechazar (NUEVO)
        btnRechazarEntrada = findViewById(R.id.btn_rechazar_entrada)
    }

    private fun setupClickListeners() {
        btnBuscarEntrada.setOnClickListener {
            val numeroEntrada = etNumeroEntrada.text.toString().trim()
            if (numeroEntrada.isNotEmpty()) {
                Log.d("EntradasAuditor", "🔍 Búsqueda iniciada con número: '$numeroEntrada'")
                buscarEntradaInteligente(numeroEntrada)
            } else {
                Toast.makeText(this, "Por favor ingresa un número de entrada", Toast.LENGTH_SHORT).show()
            }
        }

        btnValidarEntrada.setOnClickListener {
            val numeroEntrada = etNumeroEntrada.text.toString().trim()
            if (numeroEntrada.isNotEmpty()) {
                Log.d("EntradasAuditor", "✅ Procesando validación para entrada: '$numeroEntrada'")
                procesarValidacionEntrada(numeroEntrada)
            } else {
                Toast.makeText(this, "No hay entrada seleccionada para validar", Toast.LENGTH_SHORT).show()
            }
        }

        // NUEVO: Listener para botón de rechazo
        btnRechazarEntrada.setOnClickListener {
            val numeroEntrada = etNumeroEntrada.text.toString().trim()
            if (numeroEntrada.isNotEmpty()) {
                Log.d("EntradasAuditor", "❌ Procesando rechazo para entrada: '$numeroEntrada'")
                mostrarDialogoRechazo(numeroEntrada)
            } else {
                Toast.makeText(this, "No hay entrada seleccionada para rechazar", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // NUEVA FUNCIÓN: Búsqueda inteligente usando el endpoint unificado
    private fun buscarEntradaInteligente(numeroEntrada: String) {
        showLoading(true)

        val token = getAuthToken()
        if (token.isNullOrEmpty()) {
            showError("Token de autenticación no encontrado")
            return
        }

        val url = "$ENTRADA_BUSQUEDA_INTELIGENTE/$numeroEntrada"
        Log.d("EntradasAuditor", "🔍 Haciendo petición INTELIGENTE a: $url")

        val request = object : JsonObjectRequest(
            Request.Method.GET,
            url,
            null,
            { response ->
                Log.d("EntradasAuditor", "✅ Respuesta INTELIGENTE recibida: $response")
                showLoading(false)
                handleApiResponseInteligente(response)
            },
            { error ->
                Log.e("EntradasAuditor", "❌ Error en petición INTELIGENTE", error)
                showLoading(false)

                val errorMessage = when (error.networkResponse?.statusCode) {
                    400 -> "Número de entrada inválido"
                    401 -> "No autorizado. Inicia sesión nuevamente"
                    403 -> "No tienes permisos para acceder a esta información"
                    404 -> "No se encontró entrada con ese número (ni como Compra ni como Traspaso)"
                    500 -> "Error interno del servidor"
                    else -> "Error de conexión. Verifica tu internet"
                }

                showError(errorMessage)
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                val headers = HashMap<String, String>()
                headers["Authorization"] = "Bearer $token"
                headers["Content-Type"] = "application/json"
                return headers
            }
        }

        requestQueue.add(request)
    }

    // NUEVA FUNCIÓN: Maneja la respuesta de la búsqueda inteligente
    private fun handleApiResponseInteligente(response: JSONObject) {
        try {
            val data = response.getJSONObject("data")
            val entrada = data.getJSONObject("entrada")

            // Determinar el tipo basándose en la respuesta
            val tipo = entrada.optString("tipo", "")
            val referenciaTraspaso = entrada.optString("referencia_traspaso", "")

            // Detectar automáticamente el tipo
            tipoEntradaActual = when {
                tipo == "Traspaso" || referenciaTraspaso.isNotEmpty() -> "Traspaso"
                else -> "Compra"
            }

            Log.d("EntradasAuditor", "🎯 Tipo detectado automáticamente: $tipoEntradaActual")

            val perfume = data.optJSONObject("perfume")
            val proveedor = data.optJSONObject("proveedor_detalle")
            val validacion = data.getJSONObject("validacion")

            if (tipoEntradaActual == "Traspaso") {
                val traspasoOriginal = data.optJSONObject("traspaso_original")
                displayEntradaDataTraspaso(entrada, perfume, proveedor, traspasoOriginal)
                displayValidacionesDetalladasTraspaso(validacion)
            } else {
                val ordenCompra = data.optJSONObject("orden_compra_relacionada")
                displayEntradaDataCompra(entrada, perfume, proveedor, ordenCompra)
                displayValidacionesDetalladasCompra(validacion)
            }

            // Mostrar el container principal de detalles
            containerDetalles.visibility = View.VISIBLE
            cardValidaciones.visibility = View.VISIBLE

            // Configurar botón de validación según el estado actual y las validaciones
            configurarBotonValidacion(entrada, validacion)

        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error procesando respuesta INTELIGENTE", e)
            showError("Error procesando los datos recibidos: ${e.message}")
        }
    }

    private fun displayEntradaDataCompra(
        entrada: JSONObject,
        perfume: JSONObject?,
        proveedor: JSONObject?,
        ordenCompra: JSONObject?
    ) {
        // Configurar campos para tipo COMPRA
        configurarCamposParaCompra()

        // Mostrar datos de la ENTRADA
        tvNumeroEntrada.text = "N° Entrada: ${entrada.optString("numero_entrada", "No disponible")}"
        tvTipoEntrada.text = "Tipo: COMPRA"
        tvCantidadEntrada.text = "Cantidad: ${entrada.optInt("cantidad", 0)}"

        // Proveedor de la entrada
        val proveedorEntrada = entrada.optJSONObject("proveedor")
        tvProveedorEntrada.text = "Proveedor: ${proveedorEntrada?.optString("nombre_proveedor", "No disponible") ?: "No disponible"}"
        tvFechaEntrada.text = "Fecha entrada: ${formatDate(entrada.optString("fecha_entrada", ""))}"
        tvEstatusEntrada.text = "Estatus: ${entrada.optString("estatus_validacion", "No disponible").uppercase()}"

        // Mostrar datos de la orden de compra relacionada
        if (ordenCompra != null) {
            tvNumeroOrdenOTraspaso.text = "N° Orden: ${ordenCompra.optString("numero_orden", "No disponible")}"
            tvCantidad.text = "Cantidad: ${ordenCompra.optInt("cantidad", 0)}"
            tvPrecioUnitario.text = "Precio unitario: $${ordenCompra.optDouble("precio_unitario", 0.0)}"
            tvPrecioTotal.text = "Precio total: $${ordenCompra.optDouble("precio_total", 0.0)}"
            tvFechaOrden.text = "Fecha: ${formatDate(ordenCompra.optString("fecha_orden", ""))}"
            tvEstatus.text = "Estatus: ${ordenCompra.optString("estado", "No disponible").uppercase()}"
        } else {
            tvNumeroOrdenOTraspaso.text = "N° Orden: No encontrada"
            tvCantidad.text = "Cantidad: No disponible"
            tvPrecioUnitario.text = "Precio unitario: No disponible"
            tvPrecioTotal.text = "Precio total: No disponible"
            tvFechaOrden.text = "Fecha: No disponible"
            tvEstatus.text = "Estatus: No disponible"
        }

        // Mostrar datos del perfume y proveedor (igual para ambos tipos)
        displayPerfumeData(perfume)
        displayProveedorData(proveedor)
    }

    private fun displayEntradaDataTraspaso(
        entrada: JSONObject,
        perfume: JSONObject?,
        proveedor: JSONObject?,
        traspasoOriginal: JSONObject?
    ) {
        // Configurar campos para tipo TRASPASO
        configurarCamposParaTraspaso()

        // Mostrar datos de la ENTRADA
        tvNumeroEntrada.text = "N° Entrada: ${entrada.optString("numero_entrada", "No disponible")}"
        tvTipoEntrada.text = "Tipo: TRASPASO"
        tvCantidadEntrada.text = "Cantidad: ${entrada.optInt("cantidad", 0)}"

        // Proveedor de la entrada
        val proveedorEntrada = entrada.optJSONObject("proveedor")
        tvProveedorEntrada.text = "Proveedor: ${proveedorEntrada?.optString("nombre_proveedor", "No disponible") ?: "No disponible"}"
        tvFechaEntrada.text = "Fecha entrada: ${formatDate(entrada.optString("fecha_entrada", ""))}"
        tvEstatusEntrada.text = "Estatus: ${entrada.optString("estatus_validacion", "No disponible").uppercase()}"
        tvReferenciaTraspaso.text = "Referencia: ${entrada.optString("referencia_traspaso", "No disponible")}"

        // Mostrar datos del traspaso original
        if (traspasoOriginal != null) {
            tvNumeroOrdenOTraspaso.text = "N° Traspaso: ${traspasoOriginal.optString("numero_traspaso", "No disponible")}"
            tvCantidad.text = "Cantidad enviada: ${traspasoOriginal.optInt("cantidad", 0)}"
            tvFechaSalida.text = "Fecha salida: ${formatDate(traspasoOriginal.optString("fecha_salida", ""))}"
            tvEstatus.text = "Estatus: ${traspasoOriginal.optString("estatus_validacion", "No disponible").uppercase()}"

            // Información de almacenes - CAMBIO AQUÍ: Usar "codigo" en lugar de "nombre_almacen"
            val almacenSalidaInfo = traspasoOriginal.optJSONObject("almacen_salida")
            val almacenEntradaInfo = entrada.optJSONObject("almacen_destino")

            tvAlmacenSalida.text = "Almacén origen: ${almacenSalidaInfo?.optString("codigo", "No disponible") ?: "No disponible"}"
            tvAlmacenEntrada.text = "Almacén destino: ${almacenEntradaInfo?.optString("codigo", "No disponible") ?: "No disponible"}"
        } else {
            tvNumeroOrdenOTraspaso.text = "N° Traspaso: No encontrado"
            tvCantidad.text = "Cantidad enviada: No disponible"
            tvFechaSalida.text = "Fecha salida: No disponible"
            tvEstatus.text = "Estatus: No disponible"
            tvAlmacenSalida.text = "Almacén origen: No disponible"
            tvAlmacenEntrada.text = "Almacén destino: No disponible"
        }

        // Mostrar datos del perfume y proveedor (igual para ambos tipos)
        displayPerfumeData(perfume)
        displayProveedorData(proveedor)
    }

    private fun configurarCamposParaCompra() {
        // Configurar títulos y visibilidad para tipo COMPRA
        tvTituloSeccionDos.text = "Orden de Compra"

        // Mostrar campos específicos de orden de compra
        tvPrecioUnitario.visibility = View.VISIBLE
        tvPrecioTotal.visibility = View.VISIBLE
        tvFechaOrden.visibility = View.VISIBLE

        // Ocultar campos específicos de traspaso
        tvFechaSalida.visibility = View.GONE
        tvAlmacenSalida.visibility = View.GONE
        tvAlmacenEntrada.visibility = View.GONE
        tvReferenciaTraspaso.visibility = View.GONE
    }

    private fun configurarCamposParaTraspaso() {
        // Configurar títulos y visibilidad para tipo TRASPASO
        tvTituloSeccionDos.text = "Información del Traspaso"

        // Ocultar campos específicos de orden de compra
        tvPrecioUnitario.visibility = View.GONE
        tvPrecioTotal.visibility = View.GONE
        tvFechaOrden.visibility = View.GONE

        // Mostrar campos específicos de traspaso
        tvFechaSalida.visibility = View.VISIBLE
        tvAlmacenSalida.visibility = View.VISIBLE
        tvAlmacenEntrada.visibility = View.VISIBLE
        tvReferenciaTraspaso.visibility = View.VISIBLE
    }

    private fun displayPerfumeData(perfume: JSONObject?) {
        // Mostrar datos del perfume (igual para ambos tipos)
        if (perfume != null) {
            tvNombrePerfume.text = "Nombre: ${perfume.optString("name_per", "No disponible")}"
            tvDescripcionPerfume.text = "Descripción: ${perfume.optString("descripcion_per", "No disponible")}"
            tvCategoriaPerfume.text = "Categoría: ${perfume.optString("categoria_per", "No disponible")}"
            tvPrecioVentaPerfume.text = "Precio venta: $${perfume.optDouble("precio_venta_per", 0.0)}"
            tvStockPerfume.text = "Stock actual: ${perfume.optInt("stock_per", 0)}"
            tvStockMinimoPerfume.text = "Stock mínimo: ${perfume.optInt("stock_minimo_per", 0)}"
            tvUbicacionPerfume.text = "Ubicación: ${perfume.optString("ubicacion_per", "No disponible")}"
            tvFechaExpiracionPerfume.text = "Expira: ${formatDate(perfume.optString("fecha_expiracion", ""))}"
            tvEstadoPerfume.text = "Estado: ${perfume.optString("estado", "No disponible")}"
        } else {
            tvNombrePerfume.text = "Nombre: No disponible"
            tvDescripcionPerfume.text = "Descripción: No disponible"
            tvCategoriaPerfume.text = "Categoría: No disponible"
            tvPrecioVentaPerfume.text = "Precio venta: No disponible"
            tvStockPerfume.text = "Stock actual: No disponible"
            tvStockMinimoPerfume.text = "Stock mínimo: No disponible"
            tvUbicacionPerfume.text = "Ubicación: No disponible"
            tvFechaExpiracionPerfume.text = "Expira: No disponible"
            tvEstadoPerfume.text = "Estado: No disponible"
        }
    }

    private fun displayProveedorData(proveedor: JSONObject?) {
        // Mostrar datos del proveedor (igual para ambos tipos)
        if (proveedor != null) {
            tvNombreProveedor.text = "Nombre: ${proveedor.optString("nombre_proveedor", "No disponible")}"
            tvRfcProveedor.text = "RFC: ${proveedor.optString("rfc", "No disponible")}"
            tvContactoProveedor.text = "Contacto: ${proveedor.optString("contacto", "No disponible")}"
            tvTelefonoProveedor.text = "Teléfono: ${proveedor.optString("telefono", "No disponible")}"
            tvEmailProveedor.text = "Email: ${proveedor.optString("email", "No disponible")}"
            tvDireccionProveedor.text = "Dirección: ${proveedor.optString("direccion", "No disponible")}"
            tvEstadoProveedor.text = "Estado: ${proveedor.optString("estado", "No disponible")}"
        } else {
            tvNombreProveedor.text = "Nombre: No disponible"
            tvRfcProveedor.text = "RFC: No disponible"
            tvContactoProveedor.text = "Contacto: No disponible"
            tvTelefonoProveedor.text = "Teléfono: No disponible"
            tvEmailProveedor.text = "Email: No disponible"
            tvDireccionProveedor.text = "Dirección: No disponible"
            tvEstadoProveedor.text = "Estado: No disponible"
        }
    }

    private fun displayValidacionesDetalladasCompra(validacion: JSONObject) {
        try {
            // RESUMEN EJECUTIVO (igual para ambos tipos)
            displayResumenEjecutivo(validacion)

            // VALIDACIONES INDIVIDUALES para COMPRA
            val proveedorCoincide = validacion.getBoolean("proveedor_coincide")
            val cantidadValida = validacion.getBoolean("cantidad_valida")
            val fechaCoherente = validacion.getBoolean("fecha_coherente")
            val precioCoherente = validacion.getBoolean("precio_coherente")
            val estadoOrdenValido = validacion.getBoolean("estado_orden_valido")

            tvValidacion1.text = "Proveedor: ${if (proveedorCoincide) "✅ Coincide" else "❌ No coincide"}"
            tvValidacion1.setTextColor(ContextCompat.getColor(this,
                if (proveedorCoincide) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion2.text = "Cantidad: ${if (cantidadValida) "✅ Válida" else "❌ Inválida"}"
            tvValidacion2.setTextColor(ContextCompat.getColor(this,
                if (cantidadValida) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion3.text = "Fechas: ${if (fechaCoherente) "✅ Coherentes" else "❌ Incoherentes"}"
            tvValidacion3.setTextColor(ContextCompat.getColor(this,
                if (fechaCoherente) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion4.text = "Precio: ${if (precioCoherente) "✅ Coherente" else "❌ Incoherente"}"
            tvValidacion4.setTextColor(ContextCompat.getColor(this,
                if (precioCoherente) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion5.text = "Estado Orden: ${if (estadoOrdenValido) "✅ Válido" else "❌ Inválido"}"
            tvValidacion5.setTextColor(ContextCompat.getColor(this,
                if (estadoOrdenValido) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            // DISCREPANCIAS Y OBSERVACIONES
            mostrarDiscrepanciasDetalladas(validacion)

            Log.d("EntradasAuditor", "✅ Validaciones detalladas COMPRA mostradas")

        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error mostrando validaciones detalladas COMPRA", e)
        }
    }

    private fun displayValidacionesDetalladasTraspaso(validacion: JSONObject) {
        try {
            // RESUMEN EJECUTIVO (igual para ambos tipos)
            displayResumenEjecutivo(validacion)

            // VALIDACIONES INDIVIDUALES para TRASPASO
            val perfumeCoincide = validacion.getBoolean("perfume_coincide")
            val proveedorCoincide = validacion.getBoolean("proveedor_coincide")
            val cantidadCoincide = validacion.getBoolean("cantidad_coincide")
            val fechaCoherente = validacion.getBoolean("fecha_coherente")
            val almacenesDiferentes = validacion.getBoolean("almacenes_diferentes")
            val estadoTraspasoValido = validacion.getBoolean("estado_traspaso_valido")

            tvValidacion1.text = "Perfume: ${if (perfumeCoincide) "✅ Coincide" else "❌ No coincide"}"
            tvValidacion1.setTextColor(ContextCompat.getColor(this,
                if (perfumeCoincide) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion2.text = "Cantidad: ${if (cantidadCoincide) "✅ Exacta" else "❌ Diferente"}"
            tvValidacion2.setTextColor(ContextCompat.getColor(this,
                if (cantidadCoincide) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion3.text = "Fechas: ${if (fechaCoherente) "✅ Coherentes" else "❌ Incoherentes"}"
            tvValidacion3.setTextColor(ContextCompat.getColor(this,
                if (fechaCoherente) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion4.text = "Almacenes: ${if (almacenesDiferentes) "✅ Diferentes" else "❌ Iguales"}"
            tvValidacion4.setTextColor(ContextCompat.getColor(this,
                if (almacenesDiferentes) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            tvValidacion5.text = "Estado Traspaso: ${if (estadoTraspasoValido) "✅ Válido" else "❌ Inválido"}"
            tvValidacion5.setTextColor(ContextCompat.getColor(this,
                if (estadoTraspasoValido) android.R.color.holo_green_dark else android.R.color.holo_red_dark))

            // DISCREPANCIAS Y OBSERVACIONES
            mostrarDiscrepanciasDetalladas(validacion)

            Log.d("EntradasAuditor", "✅ Validaciones detalladas TRASPASO mostradas")

        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error mostrando validaciones detalladas TRASPASO", e)
        }
    }

    private fun displayResumenEjecutivo(validacion: JSONObject) {
        // RESUMEN EJECUTIVO (igual para ambos tipos)
        val resumenEjecutivo = validacion.getJSONObject("resumen_ejecutivo")
        val estado = resumenEjecutivo.getString("estado")
        val color = resumenEjecutivo.getString("color")
        val icono = resumenEjecutivo.getString("icono")
        val mensajePrincipal = resumenEjecutivo.getString("mensaje_principal")
        val accionRecomendada = resumenEjecutivo.getString("accion_recomendada")
        val siguientePaso = resumenEjecutivo.getString("siguiente_paso")
        val tiempoResolucion = resumenEjecutivo.getString("tiempo_estimado_resolucion")

        // Estado general con colores
        tvEstadoValidacion.text = "$icono $estado"
        val colorInt = when(estado) {
            "APROBADA" -> android.R.color.holo_green_dark
            "CONDICIONAL" -> android.R.color.holo_orange_light
            "REQUIERE_REVISION_GERENCIAL" -> android.R.color.holo_orange_dark
            "RECHAZADA" -> android.R.color.holo_red_dark
            else -> android.R.color.darker_gray
        }
        tvEstadoValidacion.setTextColor(ContextCompat.getColor(this, colorInt))

        // Información ejecutiva
        tvMensajePrincipal.text = mensajePrincipal
        tvAccionRecomendada.text = "Acción: $accionRecomendada"
        tvSiguientePaso.text = "Siguiente paso: $siguientePaso"
        tvTiempoResolucion.text = "Tiempo estimado: $tiempoResolucion"

        // Métricas
        val porcentajeCumplimiento = validacion.getInt("porcentaje_cumplimiento")
        val nivelRiesgo = validacion.getString("nivel_riesgo")

        tvPorcentajeCumplimiento.text = "Cumplimiento: ${porcentajeCumplimiento}%"
        tvNivelRiesgo.text = "Riesgo: $nivelRiesgo"

        val colorRiesgo = when(nivelRiesgo) {
            "BAJO" -> android.R.color.holo_green_dark
            "MEDIO-BAJO" -> android.R.color.holo_green_light
            "MEDIO" -> android.R.color.holo_orange_light
            "ALTO" -> android.R.color.holo_red_dark
            else -> android.R.color.darker_gray
        }
        tvNivelRiesgo.setTextColor(ContextCompat.getColor(this, colorRiesgo))
    }

    // El resto de las funciones permanecen iguales...
    private fun mostrarDiscrepanciasDetalladas(validacion: JSONObject) {
        try {
            // Limpiar contenedores
            containerDiscrepanciasCriticas.removeAllViews()
            containerDiscrepanciasImportantes.removeAllViews()
            containerAdvertencias.removeAllViews()
            containerRecomendaciones.removeAllViews()

            var hayDiscrepancias = false

            // DISCREPANCIAS CRÍTICAS
            val discrepanciasCriticas = validacion.getJSONArray("discrepancias_criticas")
            if (discrepanciasCriticas.length() > 0) {
                hayDiscrepancias = true
                mostrarCategoria("🚨 DISCREPANCIAS CRÍTICAS", discrepanciasCriticas, containerDiscrepanciasCriticas, android.R.color.holo_red_dark)
            }

            // DISCREPANCIAS IMPORTANTES
            val discrepanciasImportantes = validacion.getJSONArray("discrepancias_importantes")
            if (discrepanciasImportantes.length() > 0) {
                hayDiscrepancias = true
                mostrarCategoria("⚠️ DISCREPANCIAS IMPORTANTES", discrepanciasImportantes, containerDiscrepanciasImportantes, android.R.color.holo_orange_dark)
            }

            // ADVERTENCIAS
            val advertencias = validacion.getJSONArray("advertencias")
            if (advertencias.length() > 0) {
                hayDiscrepancias = true
                mostrarCategoria("📋 ADVERTENCIAS", advertencias, containerAdvertencias, android.R.color.holo_orange_light)
            }

            // RECOMENDACIONES
            val recomendaciones = validacion.getJSONArray("recomendaciones")
            if (recomendaciones.length() > 0) {
                mostrarCategoria("✅ RECOMENDACIONES", recomendaciones, containerRecomendaciones, android.R.color.holo_green_dark)
            }

            // Mostrar u ocultar el layout de discrepancias
            layoutDiscrepancias.visibility = if (hayDiscrepancias) View.VISIBLE else View.GONE

        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error mostrando discrepancias detalladas", e)
        }
    }

    private fun mostrarCategoria(titulo: String, items: JSONArray, container: LinearLayout, color: Int) {
        // Título de la categoría
        val tituloView = TextView(this)
        tituloView.text = titulo
        tituloView.setTextColor(ContextCompat.getColor(this, color))
        tituloView.textSize = 16f
        tituloView.setTypeface(null, android.graphics.Typeface.BOLD)
        tituloView.setPadding(0, 8, 0, 4)
        container.addView(tituloView)

        // Items de la categoría
        for (i in 0 until items.length()) {
            val item = items.getJSONObject(i)
            mostrarItemDiscrepancia(item, container, color)
        }
    }

    private fun mostrarItemDiscrepancia(item: JSONObject, container: LinearLayout, color: Int) {
        // Título del item
        val titulo = item.optString("titulo", item.optString("mensaje", "Sin título"))
        val tituloView = TextView(this)
        tituloView.text = titulo
        tituloView.setTextColor(ContextCompat.getColor(this, color))
        tituloView.textSize = 14f
        tituloView.setTypeface(null, android.graphics.Typeface.BOLD)
        tituloView.setPadding(16, 4, 8, 2)
        container.addView(tituloView)

        // Descripción si existe
        val descripcion = item.optString("descripcion", "")
        if (descripcion.isNotEmpty()) {
            val descripcionView = TextView(this)
            descripcionView.text = descripcion
            descripcionView.setTextColor(ContextCompat.getColor(this, android.R.color.darker_gray))
            descripcionView.textSize = 12f
            descripcionView.setPadding(32, 2, 8, 4)
            container.addView(descripcionView)
        }

        // Qué hacer
        val queHacer = item.optString("que_hacer", "")
        if (queHacer.isNotEmpty()) {
            val queHacerView = TextView(this)
            queHacerView.text = "💡 $queHacer"
            queHacerView.setTextColor(ContextCompat.getColor(this, android.R.color.holo_blue_dark))
            queHacerView.textSize = 12f
            queHacerView.setTypeface(null, android.graphics.Typeface.BOLD)
            queHacerView.setPadding(32, 2, 8, 4)
            container.addView(queHacerView)
        }

        // Acciones sugeridas
        val accionesSugeridas = item.optJSONArray("acciones_sugeridas")
        if (accionesSugeridas != null && accionesSugeridas.length() > 0) {
            for (j in 0 until accionesSugeridas.length()) {
                val accion = accionesSugeridas.getString(j)
                val accionView = TextView(this)
                accionView.text = "  • $accion"
                accionView.setTextColor(ContextCompat.getColor(this, android.R.color.darker_gray))
                accionView.textSize = 11f
                accionView.setPadding(40, 1, 8, 1)
                container.addView(accionView)
            }
        }

        // Espaciador
        val espaciador = View(this)
        espaciador.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            8
        )
        container.addView(espaciador)
    }

    private fun configurarBotonValidacion(entrada: JSONObject, validacion: JSONObject) {
        val estatusValidacion = entrada.optString("estatus_validacion", "registrado")
        val resumenEjecutivo = validacion.getJSONObject("resumen_ejecutivo")
        val puedeProceser = resumenEjecutivo.getBoolean("puede_procesar")
        val estado = resumenEjecutivo.getString("estado")

        when {
            estatusValidacion == "validado" -> {
                btnValidarEntrada.isEnabled = false
                btnValidarEntrada.text = "✅ Ya Validada"
                btnValidarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.holo_green_dark)
                
                // Ocultar botón de rechazo
                btnRechazarEntrada.visibility = View.GONE
            }
            estatusValidacion == "rechazado" -> {
                btnValidarEntrada.isEnabled = false
                btnValidarEntrada.text = "❌ Ya Rechazada"
                btnValidarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.holo_red_dark)
                
                // Ocultar botón de rechazo
                btnRechazarEntrada.visibility = View.GONE
            }
            estado == "RECHAZADA" || !puedeProceser -> {
                btnValidarEntrada.isEnabled = false
                btnValidarEntrada.text = "❌ No se puede validar"
                btnValidarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.holo_red_dark)
                
                // Mostrar botón de rechazo disponible
                btnRechazarEntrada.visibility = View.VISIBLE
                btnRechazarEntrada.isEnabled = true
            }
            estado == "REQUIERE_REVISION_GERENCIAL" -> {
                btnValidarEntrada.isEnabled = true
                btnValidarEntrada.text = "⚠️ Validar (Requiere Aprobación)"
                btnValidarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.holo_orange_dark)
                
                // Mostrar botón de rechazo disponible
                btnRechazarEntrada.visibility = View.VISIBLE
                btnRechazarEntrada.isEnabled = true
            }
            estado == "CONDICIONAL" -> {
                btnValidarEntrada.isEnabled = true
                btnValidarEntrada.text = "⚡ Validar con Observaciones"
                btnValidarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.holo_orange_light)
                
                // Mostrar botón de rechazo disponible
                btnRechazarEntrada.visibility = View.VISIBLE
                btnRechazarEntrada.isEnabled = true
            }
            else -> {
                btnValidarEntrada.isEnabled = true
                btnValidarEntrada.text = "✅ Validar Entrada"
                btnValidarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, R.color.lavanda_suave)
                
                // Mostrar botón de rechazo disponible
                btnRechazarEntrada.visibility = View.VISIBLE
                btnRechazarEntrada.isEnabled = true
            }
        }
    }

    private fun formatDate(dateString: String): String {
        return try {
            if (dateString.isEmpty()) return "No disponible"
            val date = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault()).parse(dateString)
            java.text.SimpleDateFormat("dd/MM/yyyy", java.util.Locale.getDefault()).format(date!!)
        } catch (e: Exception) {
            if (dateString.isEmpty()) "No disponible" else dateString
        }
    }

    private fun showLoading(show: Boolean) {
        btnBuscarEntrada.isEnabled = !show
        btnBuscarEntrada.text = if (show) "Buscando..." else "Buscar Entrada"
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()

        // Ocultar el container de detalles si hay error
        containerDetalles.visibility = View.GONE
        cardValidaciones.visibility = View.GONE
    }

    private fun procesarValidacionEntrada(numeroEntrada: String) {
        // Mostrar diálogo de confirmación
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
        builder.setTitle("Confirmar Validación")

        val mensaje = if (tipoEntradaActual == "Traspaso") {
            "¿Estás seguro de que deseas validar esta entrada de TRASPASO?\n\nEsto actualizará:\n• Estado del traspaso a 'Validado'\n• Stock del perfume con la cantidad de la entrada\n• Estado de validación de la entrada\n• Registros de almacenes"
        } else {
            "¿Estás seguro de que deseas validar esta entrada de COMPRA?\n\nEsto actualizará:\n• Estado de la orden de compra a 'Completada'\n• Stock del perfume con la cantidad de la entrada\n• Estado de validación de la entrada"
        }

        builder.setMessage(mensaje)

        builder.setPositiveButton("Validar") { _, _ ->
            ejecutarValidacionEntrada(numeroEntrada)
        }

        builder.setNegativeButton("Cancelar") { dialog, _ ->
            dialog.dismiss()
        }

        builder.show()
    }

    private fun ejecutarValidacionEntrada(numeroEntrada: String) {
        showLoading(true)
        btnValidarEntrada.isEnabled = false
        btnValidarEntrada.text = "Procesando..."

        val token = getAuthToken()
        if (token.isNullOrEmpty()) {
            showError("Token de autenticación no encontrado")
            return
        }

        val url = "$BASE_URL/auditor/validar-entrada/$numeroEntrada"
        Log.d("EntradasAuditor", "✅ Procesando validación en: $url")

        val request = object : JsonObjectRequest(
            Request.Method.POST,
            url,
            null,
            { response ->
                Log.d("EntradasAuditor", "✅ Validación procesada exitosamente: $response")
                showLoading(false)
                btnValidarEntrada.isEnabled = false
                btnValidarEntrada.text = "✅ Validada"
                btnValidarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.holo_green_dark)

                handleValidacionResponse(response)
            },
            { error ->
                Log.e("EntradasAuditor", "❌ Error en validación", error)
                Log.e("EntradasAuditor", "❌ Status code: ${error.networkResponse?.statusCode}")

                val responseData = error.networkResponse?.data?.toString(Charsets.UTF_8)
                Log.e("EntradasAuditor", "❌ Response body: $responseData")

                showLoading(false)
                btnValidarEntrada.isEnabled = true
                btnValidarEntrada.text = "Validar Entrada"

                val errorMessage = when (error.networkResponse?.statusCode) {
                    400 -> "La validación no pudo completarse. Verifica los datos"
                    401 -> "No autorizado. Inicia sesión nuevamente"
                    403 -> "No tienes permisos para validar entradas"
                    404 -> "Entrada u orden de compra no encontrada"
                    500 -> "Error interno del servidor"
                    else -> "Error de conexión. Verifica tu internet"
                }

                showError(errorMessage)
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                val headers = HashMap<String, String>()
                headers["Authorization"] = "Bearer $token"
                headers["Content-Type"] = "application/json"
                return headers
            }
        }

        requestQueue.add(request)
    }

    private fun handleValidacionResponse(response: JSONObject) {
        try {
            val success = response.getBoolean("success")
            val message = response.getString("message")
            val data = response.getJSONObject("data")

            if (success) {
                // Mostrar información de la validación
                val entrada = data.getJSONObject("entrada")
                val auditor = data.getJSONObject("auditor")

                val detalleValidacion = if (tipoEntradaActual == "Traspaso") {
                    val traspaso = data.optJSONObject("traspaso")
                    val perfume = data.getJSONObject("perfume")

                    """
                    ✅ VALIDACIÓN DE TRASPASO COMPLETADA
                    
                    📋 ENTRADA:
                    • Número: ${entrada.getString("numero_entrada")}
                    • Estado: ${entrada.getString("estatus_nuevo")}
                    • Cantidad procesada: ${entrada.getInt("cantidad")}
                    • Referencia: ${entrada.optString("referencia_traspaso", "No disponible")}
                    
                    🔄 TRASPASO:
                    • Número: ${traspaso?.optString("numero_traspaso", "No disponible") ?: "No disponible"}
                    • Estado anterior: ${traspaso?.optString("estado_anterior", "No disponible") ?: "No disponible"}
                    • Estado nuevo: ${traspaso?.optString("estado_nuevo", "Validado") ?: "Validado"}
                    • Almacén origen: ${traspaso?.optString("almacen_origen", "No disponible") ?: "No disponible"}
                    • Almacén destino: ${traspaso?.optString("almacen_destino", "No disponible") ?: "No disponible"}
                    
                    💎 PERFUME:
                    • ${perfume.getString("nombre")}
                    • Stock anterior: ${perfume.getInt("stock_anterior")}
                    • Stock nuevo: ${perfume.getInt("stock_nuevo")}
                    • Cantidad agregada: +${perfume.getInt("cantidad_agregada")}
                    
                    👤 AUDITOR RESPONSABLE:
                    • Nombre: ${auditor.optString("nombre", "No disponible")}${if (auditor.optString("apellido", "").isNotEmpty()) " ${auditor.getString("apellido")}" else ""}
                    • Fecha: ${auditor.optString("fecha_validacion_formateada", formatDate(auditor.optString("fecha_validacion", "")))}
                    """.trimIndent()
                } else {
                    val ordenCompra = data.getJSONObject("orden_compra")
                    val perfume = data.getJSONObject("perfume")

                    """
                    ✅ VALIDACIÓN DE COMPRA COMPLETADA
                    
                    📋 ENTRADA:
                    • Número: ${entrada.getString("numero_entrada")}
                    • Estado: ${entrada.getString("estatus_nuevo")}
                    • Cantidad procesada: ${entrada.getInt("cantidad")}
                    
                    🛒 ORDEN DE COMPRA:
                    • Número: ${ordenCompra.getString("numero_orden")}
                    • Estado anterior: ${ordenCompra.getString("estado_anterior")}
                    • Estado nuevo: ${ordenCompra.getString("estado_nuevo")}
                    
                    💎 PERFUME:
                    • ${perfume.getString("nombre")}
                    • Stock anterior: ${perfume.getInt("stock_anterior")}
                    • Stock nuevo: ${perfume.getInt("stock_nuevo")}
                    • Cantidad agregada: +${perfume.getInt("cantidad_agregada")}
                    
                    👤 AUDITOR RESPONSABLE:
                    • Nombre: ${auditor.optString("nombre", "No disponible")}${if (auditor.optString("apellido", "").isNotEmpty()) " ${auditor.getString("apellido")}" else ""}
                    • Fecha: ${auditor.optString("fecha_validacion_formateada", formatDate(auditor.optString("fecha_validacion", "")))}
                    """.trimIndent()
                }

                // Mostrar diálogo con detalles
                val builder = androidx.appcompat.app.AlertDialog.Builder(this)
                builder.setTitle("Validación Completada")
                builder.setMessage(detalleValidacion)
                builder.setPositiveButton("Entendido") { dialog, _ ->
                    dialog.dismiss()
                    // Actualizar la vista con los nuevos datos
                    buscarEntradaInteligente(entrada.getString("numero_entrada"))
                }
                builder.show()

                Toast.makeText(this, message, Toast.LENGTH_LONG).show()

            } else {
                showError("Error en la validación: $message")
            }

        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error procesando respuesta de validación", e)
            showError("Error procesando la respuesta de validación: ${e.message}")
        }
    }

    // ============================================================================
    // FUNCIONES DE RECHAZO DE ENTRADA (NUEVAS)
    // ============================================================================
    
    private fun mostrarDialogoRechazo(numeroEntrada: String) {
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
        builder.setTitle("Rechazar Entrada")
        
        // Crear input para motivo de rechazo
        val input = EditText(this)
        input.hint = "Motivo del rechazo (opcional)"
        input.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE
        input.maxLines = 3
        builder.setView(input)

        val mensaje = if (tipoEntradaActual == "Traspaso") {
            "¿Estás seguro de que deseas RECHAZAR esta entrada de TRASPASO?\n\nEsto actualizará:\n• Estado del traspaso a 'Rechazado'\n• Estado de validación de la entrada a 'rechazado'\n• NO SE MODIFICARÁ el stock del perfume\n• Se registrará el motivo del rechazo"
        } else {
            "¿Estás seguro de que deseas RECHAZAR esta entrada de COMPRA?\n\nEsto actualizará:\n• Estado de la orden de compra a 'Cancelada'\n• Estado de validación de la entrada a 'rechazado'\n• NO SE MODIFICARÁ el stock del perfume\n• Se registrará el motivo del rechazo"
        }

        builder.setMessage(mensaje)

        builder.setPositiveButton("Rechazar") { _, _ ->
            val motivoRechazo = input.text.toString().trim()
            ejecutarRechazoEntrada(numeroEntrada, motivoRechazo)
        }

        builder.setNegativeButton("Cancelar") { dialog, _ ->
            dialog.dismiss()
        }

        builder.show()
    }

    private fun ejecutarRechazoEntrada(numeroEntrada: String, motivoRechazo: String) {
        showLoading(true)
        btnRechazarEntrada.isEnabled = false
        btnRechazarEntrada.text = "Procesando..."

        val token = getAuthToken()
        if (token.isNullOrEmpty()) {
            showError("Token de autenticación no encontrado")
            return
        }

        val url = "$RECHAZAR_ENTRADA_ENDPOINT/$numeroEntrada"
        Log.d("EntradasAuditor", "❌ Procesando rechazo en: $url")

        // Crear el JSON con el motivo de rechazo
        val requestBody = JSONObject()
        if (motivoRechazo.isNotEmpty()) {
            requestBody.put("motivo_rechazo", motivoRechazo)
        }

        val request = object : JsonObjectRequest(
            Request.Method.POST,
            url,
            requestBody,
            { response ->
                Log.d("EntradasAuditor", "❌ Rechazo procesado exitosamente: $response")
                showLoading(false)
                btnRechazarEntrada.isEnabled = false
                btnRechazarEntrada.text = "❌ Rechazada"
                btnRechazarEntrada.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.holo_red_dark)

                handleRechazoResponse(response)
            },
            { error ->
                Log.e("EntradasAuditor", "❌ Error en rechazo", error)
                Log.e("EntradasAuditor", "❌ Status code: ${error.networkResponse?.statusCode}")

                val responseData = error.networkResponse?.data?.toString(Charsets.UTF_8)
                Log.e("EntradasAuditor", "❌ Response body: $responseData")

                showLoading(false)
                btnRechazarEntrada.isEnabled = true
                btnRechazarEntrada.text = "❌ Rechazar Entrada"

                val errorMessage = when (error.networkResponse?.statusCode) {
                    400 -> "El rechazo no pudo completarse. Verifica los datos"
                    401 -> "No autorizado. Inicia sesión nuevamente"
                    403 -> "No tienes permisos para rechazar entradas"
                    404 -> "Entrada no encontrada"
                    500 -> "Error interno del servidor"
                    else -> "Error de conexión. Verifica tu internet"
                }

                showError(errorMessage)
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                val headers = HashMap<String, String>()
                headers["Authorization"] = "Bearer $token"
                headers["Content-Type"] = "application/json"
                return headers
            }
        }

        requestQueue.add(request)
    }

    private fun handleRechazoResponse(response: JSONObject) {
        try {
            val success = response.getBoolean("success")
            val message = response.getString("message")
            val data = response.getJSONObject("data")

            if (success) {
                // Mostrar información del rechazo
                val entrada = data.getJSONObject("entrada")
                val auditor = data.getJSONObject("auditor")

                val detalleRechazo = if (tipoEntradaActual == "Traspaso") {
                    val traspaso = data.optJSONObject("traspaso")
                    val perfume = data.getJSONObject("perfume")

                    """
                    ❌ RECHAZO DE TRASPASO COMPLETADO
                    
                    📋 ENTRADA:
                    • Número: ${entrada.getString("numero_entrada")}
                    • Estado anterior: ${entrada.getString("estatus_anterior")}
                    • Estado nuevo: ${entrada.getString("estatus_nuevo")}
                    • Cantidad: ${entrada.getInt("cantidad")}
                    • Motivo: ${entrada.getString("motivo_rechazo")}
                    
                    🔄 TRASPASO:
                    • Número: ${traspaso?.optString("numero_traspaso", "No disponible") ?: "No disponible"}
                    • Estado anterior: ${traspaso?.optString("estado_anterior", "No disponible") ?: "No disponible"}
                    • Estado nuevo: ${traspaso?.optString("estado_nuevo", "Rechazado") ?: "Rechazado"}
                    • Almacén origen: ${traspaso?.optString("almacen_origen", "No disponible") ?: "No disponible"}
                    • Almacén destino: ${traspaso?.optString("almacen_destino", "No disponible") ?: "No disponible"}
                    
                    💎 PERFUME:
                    • ${perfume.getString("nombre")}
                    • Stock NO modificado
                    
                    👤 AUDITOR RESPONSABLE:
                    • Nombre: ${auditor.optString("nombre", "No disponible")}${if (auditor.optString("apellido", "").isNotEmpty()) " ${auditor.getString("apellido")}" else ""}
                    • Fecha: ${auditor.optString("fecha_rechazo_formateada", formatDate(auditor.optString("fecha_rechazo", "")))}
                    """.trimIndent()
                } else {
                    val ordenCompra = data.optJSONObject("orden_compra")
                    val perfume = data.getJSONObject("perfume")

                    """
                    ❌ RECHAZO DE COMPRA COMPLETADO
                    
                    📋 ENTRADA:
                    • Número: ${entrada.getString("numero_entrada")}
                    • Estado anterior: ${entrada.getString("estatus_anterior")}
                    • Estado nuevo: ${entrada.getString("estatus_nuevo")}
                    • Cantidad: ${entrada.getInt("cantidad")}
                    • Motivo: ${entrada.getString("motivo_rechazo")}
                    
                    🛒 ORDEN DE COMPRA:
                    • Número: ${ordenCompra?.optString("numero_orden", "No disponible") ?: "No disponible"}
                    • Estado anterior: ${ordenCompra?.optString("estado_anterior", "No disponible") ?: "No disponible"}
                    • Estado nuevo: ${ordenCompra?.optString("estado_nuevo", "Cancelada") ?: "Cancelada"}
                    • Observaciones: ${ordenCompra?.optString("observaciones", "No disponible") ?: "No disponible"}
                    
                    💎 PERFUME:
                    • ${perfume.getString("nombre")}
                    • Stock NO modificado
                    
                    👤 AUDITOR RESPONSABLE:
                    • Nombre: ${auditor.optString("nombre", "No disponible")}${if (auditor.optString("apellido", "").isNotEmpty()) " ${auditor.getString("apellido")}" else ""}
                    • Fecha: ${auditor.optString("fecha_rechazo_formateada", formatDate(auditor.optString("fecha_rechazo", "")))}
                    """.trimIndent()
                }

                // Mostrar diálogo con detalles
                val builder = androidx.appcompat.app.AlertDialog.Builder(this)
                builder.setTitle("Rechazo Completado")
                builder.setMessage(detalleRechazo)
                builder.setPositiveButton("Entendido") { dialog, _ ->
                    dialog.dismiss()
                    // Actualizar la vista con los nuevos datos
                    buscarEntradaInteligente(entrada.getString("numero_entrada"))
                }
                builder.show()

                Toast.makeText(this, message, Toast.LENGTH_LONG).show()

            } else {
                showError("Error en el rechazo: $message")
            }

        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error procesando respuesta de rechazo", e)
            showError("Error procesando la respuesta de rechazo: ${e.message}")
        }
    }

    private fun getAuthToken(): String? {
        val sharedPreferences = getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
        return sharedPreferences.getString("auth_token", null)
    }
}
