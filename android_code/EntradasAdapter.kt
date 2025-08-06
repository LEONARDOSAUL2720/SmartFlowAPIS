package com.example.smartflow

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class EntradasAdapter(
    private val onEntradaClick: (String) -> Unit
) : RecyclerView.Adapter<EntradasAdapter.EntradaViewHolder>() {

    private var entradas = mutableListOf<JSONObject>()

    inner class EntradaViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvNumeroEntrada: TextView = itemView.findViewById(R.id.tv_numero_entrada)
        val tvTipoEntrada: TextView = itemView.findViewById(R.id.tv_tipo_entrada)
        val tvFechaEntrada: TextView = itemView.findViewById(R.id.tv_fecha_entrada)
        val tvEstatusEntrada: TextView = itemView.findViewById(R.id.tv_estatus_entrada)
        val tvPerfumeNombre: TextView = itemView.findViewById(R.id.tv_perfume_nombre)
        val tvCantidad: TextView = itemView.findViewById(R.id.tv_cantidad)
        val tvProveedorNombre: TextView = itemView.findViewById(R.id.tv_proveedor_nombre)
        val tvInformacionAdicional: TextView = itemView.findViewById(R.id.tv_informacion_adicional)
        val tvObservaciones: TextView = itemView.findViewById(R.id.tv_observaciones)

        init {
            itemView.setOnClickListener {
                if (adapterPosition != RecyclerView.NO_POSITION) {
                    val entrada = entradas[adapterPosition]
                    val numeroEntrada = entrada.optString("numero_entrada", "")
                    if (numeroEntrada.isNotEmpty()) {
                        onEntradaClick(numeroEntrada)
                    }
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EntradaViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_entrada_auditor, parent, false)
        return EntradaViewHolder(view)
    }

    override fun onBindViewHolder(holder: EntradaViewHolder, position: Int) {
        val entrada = entradas[position]
        val context = holder.itemView.context

        // Datos básicos de la entrada
        holder.tvNumeroEntrada.text = entrada.optString("numero_entrada", "Sin número")
        
        val tipo = entrada.optString("tipo", "Compra")
        holder.tvTipoEntrada.text = tipo
        
        // Color del tipo
        val colorTipo = when (tipo) {
            "Traspaso" -> R.color.oro_palido
            "Compra" -> R.color.verde_salvia
            else -> R.color.gris_oscuro
        }
        holder.tvTipoEntrada.setTextColor(ContextCompat.getColor(context, colorTipo))

        // Fecha formateada
        val fechaEntrada = entrada.optString("fecha_entrada", "")
        holder.tvFechaEntrada.text = formatDate(fechaEntrada)

        // Estatus con colores
        val estatus = entrada.optString("estatus_validacion", "registrado").uppercase()
        holder.tvEstatusEntrada.text = estatus
        
        val colorEstatus = when (estatus) {
            "VALIDADO" -> R.color.verde_salvia
            "RECHAZADO" -> R.color.rojo_vino_tenue
            "REGISTRADO" -> R.color.oro_palido
            else -> R.color.gris_oscuro
        }
        holder.tvEstatusEntrada.setTextColor(ContextCompat.getColor(context, colorEstatus))

        // Información del perfume
        val perfume = entrada.optJSONObject("perfume")
        if (perfume != null) {
            holder.tvPerfumeNombre.text = perfume.optString("name_per", "Perfume no disponible")
        } else {
            holder.tvPerfumeNombre.text = "Perfume no disponible"
        }

        // Cantidad
        holder.tvCantidad.text = "Cantidad: ${entrada.optInt("cantidad", 0)}"

        // Información del proveedor
        val proveedor = entrada.optJSONObject("proveedor")
        if (proveedor != null) {
            holder.tvProveedorNombre.text = proveedor.optString("nombre_proveedor", "Proveedor no disponible")
        } else {
            holder.tvProveedorNombre.text = "Proveedor no disponible"
        }

        // Información adicional según el tipo
        val infoAdicional = entrada.optJSONObject("informacion_adicional")
        if (infoAdicional != null) {
            val infoText = if (tipo == "Traspaso") {
                val numeroRef = infoAdicional.optString("numero_referencia", "No disponible")
                val almacenOrigen = infoAdicional.optJSONObject("almacen_origen")?.optString("codigo", "No disponible") ?: "No disponible"
                val estatusTraspaso = infoAdicional.optString("estatus_traspaso", "No disponible")
                
                "Ref: $numeroRef • Origen: $almacenOrigen • Estado: $estatusTraspaso"
            } else {
                val numeroOrden = infoAdicional.optString("numero_orden", "No encontrada")
                val estatusOrden = infoAdicional.optString("estatus_orden", "No encontrada")
                val precioTotal = infoAdicional.optDouble("precio_total", 0.0)
                
                "Orden: $numeroOrden • Estado: $estatusOrden • Total: $${String.format("%.2f", precioTotal)}"
            }
            holder.tvInformacionAdicional.text = infoText
        } else {
            holder.tvInformacionAdicional.text = "Información adicional no disponible"
        }

        // Observaciones (si las hay)
        val observaciones = entrada.optString("observaciones_auditor", "")
        val motivoRechazo = entrada.optString("motivo_rechazo", "")
        
        when {
            motivoRechazo.isNotEmpty() -> {
                holder.tvObservaciones.text = "❌ Motivo rechazo: $motivoRechazo"
                holder.tvObservaciones.setTextColor(ContextCompat.getColor(context, R.color.rojo_vino_tenue))
                holder.tvObservaciones.visibility = View.VISIBLE
            }
            observaciones.isNotEmpty() -> {
                holder.tvObservaciones.text = "📝 Observaciones: $observaciones"
                holder.tvObservaciones.setTextColor(ContextCompat.getColor(context, R.color.gris_oscuro))
                holder.tvObservaciones.visibility = View.VISIBLE
            }
            else -> {
                holder.tvObservaciones.visibility = View.GONE
            }
        }
    }

    override fun getItemCount(): Int = entradas.size

    fun updateEntradas(nuevasEntradas: List<JSONObject>) {
        entradas.clear()
        entradas.addAll(nuevasEntradas)
        notifyDataSetChanged()
    }

    fun limpiarEntradas() {
        entradas.clear()
        notifyDataSetChanged()
    }

    private fun formatDate(dateString: String): String {
        return try {
            if (dateString.isEmpty()) return "Sin fecha"
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            val outputFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
            val date = inputFormat.parse(dateString)
            outputFormat.format(date!!)
        } catch (e: Exception) {
            if (dateString.isEmpty()) "Sin fecha" else dateString
        }
    }
}
