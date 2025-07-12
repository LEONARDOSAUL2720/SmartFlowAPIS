package com.example.smartflow

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import org.json.JSONObject

class LoginActivity : AppCompatActivity() {
    
    // URL de tu API - CAMBIA ESTA URL por la de tu servidor
    // private val API_BASE_URL = "http://10.0.2.2:3000/api" // Para emulador Android
    // private val API_BASE_URL = "http://192.168.1.8:3000/api" // Para dispositivo físico
    private val API_BASE_URL = "https://smartflow-mwmm.onrender.com/api" // Para producción en Render
    private val LOGIN_ENDPOINT = "$API_BASE_URL/auth/login"
    
    private lateinit var requestQueue: RequestQueue
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val etUsername = findViewById<EditText>(R.id.etUsername)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val tvLoginError = findViewById<TextView>(R.id.tvLoginError)

        // Inicializar RequestQueue
        requestQueue = Volley.newRequestQueue(this)

        btnLogin.setOnClickListener {
            val email = etUsername.text.toString().trim()
            val password = etPassword.text.toString().trim()
            
            if (email.isEmpty() || password.isEmpty()) {
                tvLoginError.text = "Por favor completa todos los campos"
                tvLoginError.visibility = TextView.VISIBLE
                return@setOnClickListener
            }
            
            // Llamar a la función de login
            loginUser(email, password, tvLoginError)
        }
    }
    
    private fun loginUser(email: String, password: String, tvLoginError: TextView) {
        // Crear JSON con los datos del login
        val loginData = JSONObject().apply {
            put("correo_user", email)
            put("password_user", password)
        }
        
        // Crear petición HTTP
        val jsonRequest = JsonObjectRequest(
            Request.Method.POST,
            LOGIN_ENDPOINT,
            loginData,
            { response ->
                // Login exitoso
                try {
                    val message = response.getString("message")
                    val token = response.getString("token")
                    val user = response.getJSONObject("user")
                    val userRole = user.getString("rol_user")
                    
                    // Guardar token y datos del usuario
                    saveUserData(token, user)
                    
                    // Mostrar mensaje de éxito
                    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
                    
                    // Ocultar mensaje de error
                    tvLoginError.visibility = TextView.GONE
                    
                    // Redirigir según el rol del usuario
                    redirectUserByRole(userRole)
                    
                } catch (e: Exception) {
                    Log.e("LoginActivity", "Error parsing response", e)
                    tvLoginError.text = "Error procesando respuesta del servidor"
                    tvLoginError.visibility = TextView.VISIBLE
                }
            },
            { error ->
                // Error en el login
                Log.e("LoginActivity", "Login error", error)
                
                val errorMessage = when (error.networkResponse?.statusCode) {
                    400 -> "Credenciales inválidas"
                    401 -> "Email o contraseña incorrectos"
                    500 -> "Error interno del servidor"
                    else -> "Error de conexión. Verifica tu internet"
                }
                
                tvLoginError.text = errorMessage
                tvLoginError.visibility = TextView.VISIBLE
            }
        )
        
        // Agregar petición a la cola
        requestQueue.add(jsonRequest)
    }
    
    private fun saveUserData(token: String, user: JSONObject) {
        val sharedPreferences = getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        
        editor.putString("auth_token", token)
        editor.putString("user_id", user.getString("_id"))
        editor.putString("user_name", user.getString("name_user"))
        editor.putString("user_email", user.getString("correo_user"))
        editor.putString("user_role", user.getString("rol_user"))
        editor.putBoolean("user_active", user.getBoolean("estado_user"))
        
        editor.apply()
    }
    
    // Función para obtener el token guardado (usar en otras actividades)
    fun getAuthToken(): String? {
        val sharedPreferences = getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
        return sharedPreferences.getString("auth_token", null)
    }
    
    // Función para obtener el rol del usuario guardado
    fun getUserRole(): String? {
        val sharedPreferences = getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
        return sharedPreferences.getString("user_role", null)
    }
    
    // Función para verificar si hay una sesión activa
    fun isUserLoggedIn(): Boolean {
        val token = getAuthToken()
        val role = getUserRole()
        return !token.isNullOrEmpty() && !role.isNullOrEmpty()
    }
    
    // Función para redirigir según el rol del usuario
    private fun redirectUserByRole(userRole: String) {
        when (userRole) {
            "Admin" -> {
                // Administradores van a la web (abrir navegador)
                Toast.makeText(this, "Bienvenido Administrador - Redirigiendo a web...", Toast.LENGTH_LONG).show()
                
                // Opción 1: Abrir navegador web
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://tu-web-admin.com/MainAdmin.php"))
                startActivity(intent)
                
                // Opción 2: Si tienes una WebView activity
                // val intent = Intent(this, WebAdminActivity::class.java)
                // intent.putExtra("url", "https://tu-web-admin.com/MainAdmin.php")
                // startActivity(intent)
                
                finish()
            }
            "Empleado" -> {
                // Empleados van a la app móvil - MainEmpleado
                Toast.makeText(this, "Bienvenido Empleado", Toast.LENGTH_SHORT).show()
                
                val intent = Intent(this, MainEmpleadoActivity::class.java)
                startActivity(intent)
                finish()
            }
            "Auditor" -> {
                // Auditores van a la app móvil - MainAuditor
                Toast.makeText(this, "Bienvenido Auditor", Toast.LENGTH_SHORT).show()
                
                val intent = Intent(this, MainAuditorActivity::class.java)
                startActivity(intent)
                finish()
            }
            else -> {
                // Rol no reconocido - ir a actividad por defecto
                Toast.makeText(this, "Rol de usuario no reconocido", Toast.LENGTH_SHORT).show()
                
                val intent = Intent(this, MainActivity::class.java)
                startActivity(intent)
                finish()
            }
        }
    }
}
