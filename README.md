# SmartFlow API

API REST desarrollada con Node.js, Express y MongoDB para conectar aplicaciones web y móviles.

## Preparar tu PC para aceptar solicitudes HTTP en CMD como administrador
- **REQUEST HTTP**: netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3000


## 🚀 Características

- **Autenticación JWT**: Sistema completo de registro y login
- **Seguridad**: Implementa CORS, Helmet, Rate Limiting
- **Base de datos**: MongoDB con Mongoose
- **Validaciones**: Validación de datos con express-validator
- **Arquitectura**: Estructura MVC clara y escalable
- **Documentación**: Endpoints bien documentados

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd APIS\ SMARTFLOW
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
# Copia el archivo .env.example y renómbralo a .env
# Configura las variables según tu entorno
```

4. Inicia el servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🔧 Configuración

### Variables de entorno (.env)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smartflow
JWT_SECRET=tu_clave_secreta_super_segura_aqui
NODE_ENV=development
```

### MongoDB

La API está configurada para conectarse a MongoDB. Puedes usar:

- **MongoDB local**: `mongodb://localhost:27017/smartflow`
- **MongoDB Atlas**: `mongodb+srv://usuario:contraseña@cluster.mongodb.net/smartflow`

## 📚 Endpoints

### Autenticación

#### POST /api/auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "name_user": "Juan Pérez",
  "correo_user": "juan@email.com",
  "password_user": "contraseña123",
  "rol_user": "Empleado"
}
```

#### POST /api/auth/login
Inicia sesión de usuario.

**Body:**
```json
{
  "correo_user": "juan@email.com",
  "password_user": "contraseña123"
}
```

#### GET /api/auth/profile
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT /api/auth/profile
Actualiza el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

### Datos

#### GET /api/data
Obtiene todos los datos del usuario autenticado.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `category`: Filtrar por categoría
- `isActive`: Filtrar por estado activo

#### GET /api/data/:id
Obtiene un dato específico por ID.

#### POST /api/data
Crea un nuevo dato.

**Body:**
```json
{
  "title": "Título del dato",
  "description": "Descripción opcional",
  "category": "general",
  "tags": ["tag1", "tag2"],
  "data": {
    "cualquier": "dato personalizado"
  }
}
```

#### PUT /api/data/:id
Actualiza un dato existente.

#### DELETE /api/data/:id
Elimina un dato.

#### GET /api/data/search?q=término
Busca datos por término.

### Usuarios (Solo administradores)

#### GET /api/users
Obtiene todos los usuarios.

#### GET /api/users/:id
Obtiene un usuario específico.

#### PATCH /api/users/:id/deactivate
Desactiva un usuario.

#### PATCH /api/users/:id/activate
Activa un usuario.

## 🛡️ Seguridad

La API incluye varias medidas de seguridad:

- **CORS**: Configurado para permitir solicitudes desde dominios específicos
- **Helmet**: Establece headers de seguridad HTTP
- **Rate Limiting**: Limita el número de solicitudes por IP
- **JWT**: Tokens seguros para autenticación
- **Validaciones**: Validación de datos de entrada
- **Hash de contraseñas**: Usando bcryptjs

## 📱 Uso en Aplicaciones

### Aplicación Web (JavaScript)
```javascript
// Configurar la URL base
const API_URL = 'https://tu-dominio.com/api';

// Ejemplo de login
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
};

// Ejemplo de obtener datos
const getData = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/data`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
```

### Aplicación Móvil (React Native)
```javascript
// Configurar la URL base
const API_URL = 'https://tu-dominio.com/api';

// Ejemplo de login
const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};
```

## 🚀 Despliegue

### Heroku
1. Crea una aplicación en Heroku
2. Configura las variables de entorno
3. Conecta tu repositorio
4. Despliega

### Railway
1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno
3. Despliega automáticamente

### DigitalOcean
1. Crea un droplet
2. Instala Node.js y MongoDB
3. Clona el repositorio
4. Configura un proceso manager (PM2)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC - ver el archivo LICENSE para más detalles.

## 🆘 Soporte

Si tienes alguna pregunta o necesitas ayuda, por favor abre un issue en el repositorio.
