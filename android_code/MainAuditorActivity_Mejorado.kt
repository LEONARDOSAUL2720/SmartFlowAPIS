package com.example.smartflow

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.ActionBarDrawerToggle
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy

class MainAuditorActivity : AppCompatActivity() {

    private lateinit var drawerLayout: DrawerLayout
    private lateinit var navView: NavigationView

    // URL base para las imágenes - debe coincidir con la URL de tu API
    // private val BASE_URL = "http://192.168.1.13:3000" // Para servidor local
    private val BASE_URL = "https://smartflow-mwmm.onrender.com" // Para producción en Render

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main_auditor)

        drawerLayout = findViewById(R.id.drawer_layout)
        navView = findViewById(R.id.nav_view)

        val toggle = ActionBarDrawerToggle(
            this, drawerLayout, R.string.navigation_drawer_open, R.string.navigation_drawer_close
        )
        drawerLayout.addDrawerListener(toggle)
        toggle.syncState()
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        // Obtener datos del usuario
        setupUserHeader()

        // Configurar navegación
        setupNavigation()
    }

    private fun setupUserHeader() {
        // Obtener datos del usuario desde Intent o SharedPreferences
        val sharedPrefs = getSharedPreferences("user_prefs", MODE_PRIVATE)
        val userName = intent.getStringExtra("USER_NAME")
            ?: sharedPrefs.getString("user_name", "Usuario") ?: "Usuario"
        val userEmail = sharedPrefs.getString("user_email", "")
        val userRole = sharedPrefs.getString("user_role", "")

        // Obtener la URL de la imagen del usuario
        val userImageUrl = sharedPrefs.getString("user_image_url", null)

        // Configurar header del Navigation Drawer
        val headerView: View = navView.getHeaderView(0)
        val tvUserName: TextView = headerView.findViewById(R.id.tv_user_name)
        val tvUserMessage: TextView = headerView.findViewById(R.id.tv_user_message)
        val imgUser: ImageView = headerView.findViewById(R.id.img_user)

        tvUserName.text = userName
        tvUserMessage.text = "¡Bienvenido, $userName!"

        // Cargar imagen del usuario
        if (!userImageUrl.isNullOrEmpty()) {
            // La API ya devuelve la URL completa, no necesitamos concatenar BASE_URL
            Log.d("MainAuditorActivity", "Cargando imagen desde: $userImageUrl")

            Glide.with(this)
                .load(userImageUrl) // Usar directamente la URL completa
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .placeholder(R.drawable.ic_person) // Imagen por defecto mientras carga
                .error(R.drawable.ic_person) // Imagen por defecto si hay error
                .circleCrop() // Para hacer la imagen circular
                .into(imgUser)
        } else {
            Log.d("MainAuditorActivity", "No hay URL de imagen para el usuario")
            // Usar imagen por defecto
            imgUser.setImageResource(R.drawable.ic_person)
        }

        // Si tienes un TextView para el email y rol en el header
        // val tvUserEmail: TextView = headerView.findViewById(R.id.tv_user_email)
        // val tvUserRole: TextView = headerView.findViewById(R.id.tv_user_role)
        // tvUserEmail.text = userEmail
        // tvUserRole.text = userRole
    }

    private fun setupNavigation() {
        navView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_opcion1 -> {
                    // Acción para Opción 1
                    true
                }
                R.id.nav_opcion2 -> {
                    // Acción para Opción 2
                    true
                }
                R.id.nav_opcion3 -> {
                    // Cerrar sesión
                    logout()
                    true
                }
                else -> false
            }
        }
    }

    // Función para obtener el token de autenticación
    private fun getAuthToken(): String? {
        val sharedPreferences = getSharedPreferences("user_prefs", MODE_PRIVATE)
        return sharedPreferences.getString("auth_token", null)
    }

    // Función para verificar si hay una sesión activa
    private fun isUserLoggedIn(): Boolean {
        val token = getAuthToken()
        val role = getUserRole()
        return !token.isNullOrEmpty() && !role.isNullOrEmpty()
    }

    // Función para obtener el rol del usuario guardado
    private fun getUserRole(): String? {
        val sharedPreferences = getSharedPreferences("user_prefs", MODE_PRIVATE)
        return sharedPreferences.getString("user_role", null)
    }

    // Cerrar sesión
    private fun logout() {
        // Limpiar SharedPreferences
        val sharedPrefs = getSharedPreferences("user_prefs", MODE_PRIVATE)
        sharedPrefs.edit().clear().apply()

        // Mostrar mensaje de confirmación
        Toast.makeText(this, "Sesión cerrada exitosamente", Toast.LENGTH_SHORT).show()

        // Redirigir al login
        redirectToLogin()
    }

    // Redirigir al login
    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == android.R.id.home) {
            drawerLayout.openDrawer(navView)
            return true
        }
        return super.onOptionsItemSelected(item)
    }
}
