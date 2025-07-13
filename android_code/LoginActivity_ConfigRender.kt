// Actualiza tu LoginActivity.kt con estas líneas:

class LoginActivity : AppCompatActivity() {

    // URL de tu API - CAMBIA ESTA URL por la de tu servidor
    // private val API_BASE_URL = "http://10.0.2.2:3000/api" // Para emulador Android
    // private val API_BASE_URL = "http://192.168.1.13:3000/api" // Para servidor local
    private val API_BASE_URL = "https://smartflow-mwmm.onrender.com/api" // Para producción en Render
    private val LOGIN_ENDPOINT = "$API_BASE_URL/auth/login"

    // ...resto del código igual
}
