package com.example.smartflow

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
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

    // NUEVA RUTA: Lista de todas las entradas
    private val ENTRADAS_LISTA_ENDPOINT = "$BASE_URL/auditor/entradas"

    // Rutas específicas (para fallback si es necesario)
    private val ENTRADA_ENDPOINT = "$BASE_URL/auditor/entrada"
    private val ENTRADA_TRASPASO_ENDPOINT = "$BASE_URL/auditor/entrada-traspaso"

    // NUEVA RUTA: Rechazar entrada
    private val RECHAZAR_ENTRADA_ENDPOINT = "$BASE_URL/auditor/rechazar-entrada"

    // UI Components principales para búsqueda específica
    private lateinit var etNumeroEntrada: EditText
    private lateinit var btnBuscarEntrada: Button

    // UI Components para lista de entradas
    private lateinit var spinnerFiltroTipo: Spinner
    private lateinit var spinnerFiltroEstatusLista: Spinner
    private lateinit var btnCargarEntradas: Button
    private lateinit var btnLimpiarFiltrosLista: Button
    private lateinit var tvInfoEntradas: TextView
    private lateinit var rvEntradas: RecyclerView
    private lateinit var progressBarLista: ProgressBar

    // Paginación
    private lateinit var layoutPaginacion: LinearLayout
    private lateinit var btnPaginaAnterior: Button
    private lateinit var btnPaginaSiguiente: Button
    private lateinit var tvPaginaActual: TextView

    // Container principal de detalles (búsqueda específica)
    private lateinit var containerDetalles: LinearLayout

    // Card de validaciones
    private lateinit var cardValidaciones: LinearLayout

    // Entrada Fields (búsqueda específica - mantener todos los existentes)
    private lateinit var tvNumeroEntrada: TextView
    private lateinit var tvCantidadEntrada: TextView
    private lateinit var tvProveedorEntrada: TextView
    private lateinit var tvFechaEntrada: TextView
    private lateinit var tvEstatusEntrada: TextView
    private lateinit var tvTipoEntrada: TextView

    // Campos flexibles que cambian según el tipo (mantener todos los existentes)
    private lateinit var tvTituloSeccionDos: TextView
    private lateinit var tvNumeroOrdenOTraspaso: TextView
    private lateinit var tvCantidad: TextView
    private lateinit var tvPrecioUnitario: TextView
    private lateinit var tvPrecioTotal: TextView
    private lateinit var tvFechaOrden: TextView
    private lateinit var tvEstatus: TextView

    // Campos específicos para traspasos (mantener todos los existentes)
    private lateinit var tvFechaSalida: TextView
    private lateinit var tvAlmacenSalida: TextView
    private lateinit var tvAlmacenEntrada: TextView
    private lateinit var tvReferenciaTraspaso: TextView

    // Botón validar y rechazar (mantener existentes)
    private lateinit var btnValidarEntrada: Button
    private lateinit var btnRechazarEntrada: Button

    // Adapter y datos para lista
    private lateinit var entradasAdapter: EntradasAdapter
    private lateinit var requestQueue: RequestQueue

    // Listas para los spinners de filtros
    private var listaTipos = mutableListOf<String>()
    private var listaEstatus = mutableListOf<String>()

    // Variables para filtros actuales de lista
    private var filtroActualTipo = ""
    private var filtroActualEstatusLista = ""

    // Variables de paginación
    private var paginaActual = 1
    private var totalPaginas = 1
    private var entradasPorPagina = 10

    // Variable para controlar el tipo de entrada actual (búsqueda específica)
    private var tipoEntradaActual: String = "Compra" // "Compra" o "Traspaso"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.entradas_auditor_with_list)

        initializeViews()
        setupRecyclerView()
        setupClickListeners()
        setupSpinners()

        requestQueue = Volley.newRequestQueue(this)

        // Cargar lista inicial de entradas
        cargarListaEntradas()

        Log.d("EntradasAuditor", "Actividad de Entradas Auditor iniciada con lista")
    }

    private fun initializeViews() {
        // Búsqueda específica (mantener todas las existentes)
        etNumeroEntrada = findViewById(R.id.et_numero_entrada)
        btnBuscarEntrada = findViewById(R.id.btn_buscar_entrada)

        // Container principal de detalles (búsqueda específica)
        containerDetalles = findViewById(R.id.container_detalles)
        cardValidaciones = findViewById(R.id.card_validaciones)

        // UI Components para lista de entradas
        spinnerFiltroTipo = findViewById(R.id.spinner_filtro_tipo)
        spinnerFiltroEstatusLista = findViewById(R.id.spinner_filtro_estatus_lista)
        btnCargarEntradas = findViewById(R.id.btn_cargar_entradas)
        btnLimpiarFiltrosLista = findViewById(R.id.btn_limpiar_filtros_lista)
        tvInfoEntradas = findViewById(R.id.tv_info_entradas)
        rvEntradas = findViewById(R.id.rv_entradas)
        progressBarLista = findViewById(R.id.progress_bar_lista)

        // Paginación
        layoutPaginacion = findViewById(R.id.layout_paginacion)
        btnPaginaAnterior = findViewById(R.id.btn_pagina_anterior)
        btnPaginaSiguiente = findViewById(R.id.btn_pagina_siguiente)
        tvPaginaActual = findViewById(R.id.tv_pagina_actual)

        // Entrada Fields (búsqueda específica - solo las básicas para el ejemplo)
        tvNumeroEntrada = findViewById(R.id.tv_numero_entrada)
        tvTipoEntrada = findViewById(R.id.tv_tipo_entrada)
        tvCantidadEntrada = findViewById(R.id.tv_cantidad_entrada)
        tvProveedorEntrada = findViewById(R.id.tv_proveedor_entrada)
        tvFechaEntrada = findViewById(R.id.tv_fecha_entrada)
        tvEstatusEntrada = findViewById(R.id.tv_estatus_entrada)
        tvReferenciaTraspaso = findViewById(R.id.tv_referencia_traspaso)

        // Botones validar y rechazar (búsqueda específica)
        btnValidarEntrada = findViewById(R.id.btn_validar_entrada)
        btnRechazarEntrada = findViewById(R.id.btn_rechazar_entrada)
    }

    private fun setupRecyclerView() {
        entradasAdapter = EntradasAdapter { numeroEntrada ->
            // Al hacer clic en una entrada de la lista, buscarla específicamente
            etNumeroEntrada.setText(numeroEntrada)
            buscarEntradaInteligente(numeroEntrada)
        }
        
        rvEntradas.apply {
            layoutManager = LinearLayoutManager(this@EntradasAuditor)
            adapter = entradasAdapter
            isNestedScrollingEnabled = false
        }
    }

    private fun setupClickListeners() {
        // Búsqueda específica (mantener funcionalidad existente)
        btnBuscarEntrada.setOnClickListener {
            val numeroEntrada = etNumeroEntrada.text.toString().trim()
            if (numeroEntrada.isNotEmpty()) {
                Log.d("EntradasAuditor", "🔍 Búsqueda específica iniciada con número: '$numeroEntrada'")
                buscarEntradaInteligente(numeroEntrada)
            } else {
                Toast.makeText(this, "Por favor ingresa un número de entrada", Toast.LENGTH_SHORT).show()
            }
        }

        // Lista de entradas
        btnCargarEntradas.setOnClickListener {
            paginaActual = 1 // Resetear a primera página
            cargarListaEntradas()
        }

        btnLimpiarFiltrosLista.setOnClickListener {
            limpiarFiltrosLista()
        }

        // Paginación
        btnPaginaAnterior.setOnClickListener {
            if (paginaActual > 1) {
                paginaActual--
                cargarListaEntradas()
            }
        }

        btnPaginaSiguiente.setOnClickListener {
            if (paginaActual < totalPaginas) {
                paginaActual++
                cargarListaEntradas()
            }
        }

        // Botones de validación y rechazo (mantener funcionalidad existente)
        btnValidarEntrada.setOnClickListener {
            val numeroEntrada = etNumeroEntrada.text.toString().trim()
            if (numeroEntrada.isNotEmpty()) {
                Log.d("EntradasAuditor", "✅ Procesando validación para entrada: '$numeroEntrada'")
                // Aquí iría la lógica de validación existente
                Toast.makeText(this, "Funcionalidad de validación pendiente", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "No hay entrada seleccionada para validar", Toast.LENGTH_SHORT).show()
            }
        }

        btnRechazarEntrada.setOnClickListener {
            val numeroEntrada = etNumeroEntrada.text.toString().trim()
            if (numeroEntrada.isNotEmpty()) {
                Log.d("EntradasAuditor", "❌ Procesando rechazo para entrada: '$numeroEntrada'")
                // Aquí iría la lógica de rechazo existente
                Toast.makeText(this, "Funcionalidad de rechazo pendiente", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "No hay entrada seleccionada para rechazar", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupSpinners() {
        // Configurar lista de tipos
        listaTipos.clear()
        listaTipos.addAll(listOf("Todos los tipos", "Compra", "Traspaso"))

        // Configurar lista de estatus
        listaEstatus.clear()
        listaEstatus.addAll(listOf("Todos los estatus", "registrado", "validado", "rechazado"))

        // Poblar spinners
        poblarSpinnersLista()

        // Configurar listeners para los spinners
        spinnerFiltroTipo.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val seleccion = parent?.getItemAtPosition(position).toString()
                filtroActualTipo = if (seleccion.contains("Todos") || position == 0) "" else seleccion.lowercase()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        spinnerFiltroEstatusLista.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val seleccion = parent?.getItemAtPosition(position).toString()
                filtroActualEstatusLista = if (seleccion.contains("Todos") || position == 0) "" else seleccion
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun poblarSpinnersLista() {
        // Poblar spinner de tipos
        val adapterTipos = ArrayAdapter(this, android.R.layout.simple_spinner_item, listaTipos)
        adapterTipos.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerFiltroTipo.adapter = adapterTipos

        // Poblar spinner de estatus
        val adapterEstatus = ArrayAdapter(this, android.R.layout.simple_spinner_item, listaEstatus)
        adapterEstatus.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerFiltroEstatusLista.adapter = adapterEstatus
    }

    private fun limpiarFiltrosLista() {
        spinnerFiltroTipo.setSelection(0)
        spinnerFiltroEstatusLista.setSelection(0)
        
        filtroActualTipo = ""
        filtroActualEstatusLista = ""
        
        paginaActual = 1
        cargarListaEntradas()
    }

    private fun cargarListaEntradas() {
        Log.d("EntradasAuditor", "📋 Cargando lista de entradas...")
        showLoadingLista(true)

        val token = getAuthToken()
        if (token.isNullOrEmpty()) {
            showErrorLista("Token de autenticación no encontrado")
            return
        }

        // Construir URL con parámetros
        var url = ENTRADAS_LISTA_ENDPOINT
        val parametros = mutableListOf<String>()
        
        parametros.add("page=$paginaActual")
        parametros.add("limit=$entradasPorPagina")
        
        if (filtroActualTipo.isNotEmpty()) {
            parametros.add("tipo=$filtroActualTipo")
        }
        if (filtroActualEstatusLista.isNotEmpty()) {
            parametros.add("estatus=$filtroActualEstatusLista")
        }
        
        if (parametros.isNotEmpty()) {
            url += "?" + parametros.joinToString("&")
        }

        Log.d("EntradasAuditor", "🔗 URL de consulta lista: $url")

        val request = object : JsonObjectRequest(
            Request.Method.GET,
            url,
            null,
            { response ->
                Log.d("EntradasAuditor", "✅ Lista de entradas recibida: $response")
                showLoadingLista(false)
                handleListaEntradasResponse(response)
            },
            { error ->
                Log.e("EntradasAuditor", "❌ Error cargando lista de entradas", error)
                showLoadingLista(false)
                
                val errorMessage = when (error.networkResponse?.statusCode) {
                    401 -> "No autorizado. Inicia sesión nuevamente"
                    403 -> "No tienes permisos para acceder a esta información"
                    500 -> "Error interno del servidor"
                    else -> "Error de conexión. Verifica tu internet"
                }
                
                showErrorLista(errorMessage)
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

    private fun handleListaEntradasResponse(response: JSONObject) {
        try {
            val data = response.getJSONObject("data")
            val entradasArray = data.getJSONArray("entradas")
            val metadatos = data.getJSONObject("metadatos")
            val estadisticas = data.getJSONObject("estadisticas")
            
            // Convertir JSONArray a List<JSONObject>
            val listaEntradas = mutableListOf<JSONObject>()
            for (i in 0 until entradasArray.length()) {
                listaEntradas.add(entradasArray.getJSONObject(i))
            }
            
            // Actualizar adapter
            entradasAdapter.updateEntradas(listaEntradas)
            
            // Actualizar información de paginación
            paginaActual = metadatos.getInt("pagina_actual")
            totalPaginas = metadatos.getInt("total_paginas")
            
            // Actualizar información de resultados
            val total = estadisticas.getInt("total_entradas")
            val totalCompras = estadisticas.getInt("total_compras")
            val totalTraspasos = estadisticas.getInt("total_traspasos")
            val validadas = estadisticas.getInt("validadas")
            val pendientes = estadisticas.getInt("pendientes")
            val rechazadas = estadisticas.getInt("rechazadas")

            val infoText = buildString {
                append("📊 Total: $total entradas")
                if (totalCompras > 0 || totalTraspasos > 0) {
                    append(" (${totalCompras} compras, ${totalTraspasos} traspasos)")
                }
                append("\n")
                append("✅ Validadas: $validadas | ⏳ Pendientes: $pendientes | ❌ Rechazadas: $rechazadas")
                
                val filtrosActivos = mutableListOf<String>()
                if (filtroActualTipo.isNotEmpty()) {
                    filtrosActivos.add("tipo: $filtroActualTipo")
                }
                if (filtroActualEstatusLista.isNotEmpty()) {
                    filtrosActivos.add("estatus: $filtroActualEstatusLista")
                }
                
                if (filtrosActivos.isNotEmpty()) {
                    append("\n🔍 Filtros: ${filtrosActivos.joinToString(", ")}")
                }
            }

            tvInfoEntradas.text = infoText
            tvInfoEntradas.setTextColor(getColor(R.color.verde_salvia))

            // Actualizar controles de paginación
            actualizarPaginacion()

            Log.d("EntradasAuditor", "✅ Se cargaron ${listaEntradas.size} entradas de $total totales")
            
        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error procesando lista de entradas", e)
            showErrorLista("Error procesando los datos: ${e.message}")
        }
    }

    private fun actualizarPaginacion() {
        // Mostrar u ocultar controles de paginación
        layoutPaginacion.visibility = if (totalPaginas > 1) View.VISIBLE else View.GONE
        
        // Actualizar texto de página actual
        tvPaginaActual.text = "Página $paginaActual de $totalPaginas"
        
        // Habilitar/deshabilitar botones
        btnPaginaAnterior.isEnabled = paginaActual > 1
        btnPaginaAnterior.backgroundTintList = ContextCompat.getColorStateList(
            this, 
            if (paginaActual > 1) R.color.lavanda_suave else R.color.gris_oscuro
        )
        
        btnPaginaSiguiente.isEnabled = paginaActual < totalPaginas
        btnPaginaSiguiente.backgroundTintList = ContextCompat.getColorStateList(
            this, 
            if (paginaActual < totalPaginas) R.color.lavanda_suave else R.color.gris_oscuro
        )
    }

    private fun showLoadingLista(show: Boolean) {
        progressBarLista.visibility = if (show) View.VISIBLE else View.GONE
        rvEntradas.visibility = if (show) View.GONE else View.VISIBLE

        if (show) {
            tvInfoEntradas.text = "🔄 Cargando lista de entradas..."
            tvInfoEntradas.setTextColor(getColor(R.color.lavanda_suave))
        }
    }

    private fun showErrorLista(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        
        tvInfoEntradas.text = "❌ Error: $message"
        tvInfoEntradas.setTextColor(getColor(R.color.rojo_vino_tenue))
        
        entradasAdapter.limpiarEntradas()
        layoutPaginacion.visibility = View.GONE
    }

    // FUNCIONES DE BÚSQUEDA ESPECÍFICA (simplificadas para el ejemplo)
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
                    404 -> "No se encontró entrada con ese número"
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

    private fun handleApiResponseInteligente(response: JSONObject) {
        try {
            val data = response.getJSONObject("data")
            val entrada = data.getJSONObject("entrada")

            // Detectar tipo automáticamente
            val tipo = entrada.optString("tipo", "")
            val referenciaTraspaso = entrada.optString("referencia_traspaso", "")

            tipoEntradaActual = when {
                tipo == "Traspaso" || referenciaTraspaso.isNotEmpty() -> "Traspaso"
                else -> "Compra"
            }

            Log.d("EntradasAuditor", "🎯 Tipo detectado automáticamente: $tipoEntradaActual")

            // Mostrar datos básicos (versión simplificada)
            displayEntradaDataBasica(entrada)

            // Mostrar el container principal de detalles
            containerDetalles.visibility = View.VISIBLE

            // Recargar lista para actualizar datos si es necesario
            cargarListaEntradas()
            
        } catch (e: Exception) {
            Log.e("EntradasAuditor", "❌ Error procesando respuesta INTELIGENTE", e)
            showError("Error procesando los datos recibidos: ${e.message}")
        }
    }

    private fun displayEntradaDataBasica(entrada: JSONObject) {
        // Mostrar datos básicos de la entrada (versión simplificada)
        tvNumeroEntrada.text = "N° Entrada: ${entrada.optString("numero_entrada", "No disponible")}"
        tvTipoEntrada.text = "Tipo: ${tipoEntradaActual.uppercase()}"
        tvCantidadEntrada.text = "Cantidad: ${entrada.optInt("cantidad", 0)}"

        val proveedorEntrada = entrada.optJSONObject("proveedor")
        tvProveedorEntrada.text = "Proveedor: ${proveedorEntrada?.optString("nombre_proveedor", "No disponible") ?: "No disponible"}"
        tvFechaEntrada.text = "Fecha entrada: ${formatDate(entrada.optString("fecha_entrada", ""))}"
        tvEstatusEntrada.text = "Estatus: ${entrada.optString("estatus_validacion", "No disponible").uppercase()}"

        if (tipoEntradaActual == "Traspaso") {
            tvReferenciaTraspaso.text = "Referencia: ${entrada.optString("referencia_traspaso", "No disponible")}"
            tvReferenciaTraspaso.visibility = View.VISIBLE
        } else {
            tvReferenciaTraspaso.visibility = View.GONE
        }
    }

    private fun showLoading(show: Boolean) {
        btnBuscarEntrada.isEnabled = !show
        btnBuscarEntrada.text = if (show) "Buscando..." else "Buscar Entrada"
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        containerDetalles.visibility = View.GONE
        cardValidaciones.visibility = View.GONE
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

    private fun getAuthToken(): String? {
        val sharedPreferences = getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
        return sharedPreferences.getString("auth_token", null)
    }
}
