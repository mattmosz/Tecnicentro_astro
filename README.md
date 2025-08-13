# TecniCentro Ibarra Express - Sistema de Gestión Automotriz

Sistema web completo para la gestión de un taller automotriz, desarrollado con **Astro** (frontend) y **Node.js/Express** (backend). Diseñado específicamente para TecniCentro Ibarra Express con su identidad visual corporativa.

## 🎨 Características de Diseño

- **Colores Corporativos**: Implementación del branding de TecniCentro Ibarra Express
  - Azul primario: `#1E4D8B` (color principal del logo)
  - Naranja/Rojo: `#FF4500` (color de acento del logo)
  - Gradientes y efectos que reflejan la identidad visual
- **Interfaz Moderna**: Diseño responsive con animaciones suaves y microinteracciones
- **Accesibilidad**: Contraste optimizado y navegación intuitiva
- **Componentes Reutilizables**: Sistema de design tokens y componentes modulares

## 🚀 Características del Sistema

### Autenticación y Roles
- **Sistema de login** con autenticación JWT
- **Roles diferenciados**: Administrador y Técnico
- **Protección de rutas** según permisos de usuario
- **Gestión de sesiones** con localStorage

### Panel Administrativo
- **Dashboard ejecutivo** con métricas en tiempo real
- **Gestión completa de clientes** (CRUD)
- **Administración de vehículos** con historial
- **Catálogo de servicios** y tarifas
- **Control de órdenes** de trabajo
- **Sistema de facturación** integrado
- **Reportes y análisis** de negocio

### Panel del Técnico
- **Dashboard personalizado** con órdenes asignadas
- **Gestión de tiempo** de trabajo
- **Control de estado** de órdenes
- **Acceso a catálogo** de servicios
- **Registro de trabajo** realizado

### Base de Datos
- **MySQL** con esquema completo del taller
- **Relaciones optimizadas** entre entidades
- **Datos de prueba** incluidos
- **Respaldo y migración** sencilla

## 📋 Requisitos del Sistema

- **Node.js** v16+ y npm
- **MySQL** v8+ (puerto 3306)
- **Navegador moderno** con soporte ES6+

## 🛠️ Instalación y Configuración

### 1. Clonar e Instalar Dependencias
```bash
# Instalar dependencias del proyecto completo
npm install

# Instalar dependencias del backend
cd server && npm install
```

### 2. Configurar Base de Datos
```bash
# Crear base de datos en MySQL
CREATE DATABASE taller;

# Importar el esquema desde dump.sql
mysql -u root -p taller < dump.sql
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la carpeta `server/`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=taller
JWT_SECRET=tu_secreto_jwt_super_seguro
```

### 4. Ejecutar en Desarrollo
```bash
# Ejecutar frontend y backend simultáneamente
npm run dev

# O ejecutar por separado:
npm run server    # Backend en puerto 3001
npm run client    # Frontend en puerto 4321
```

## � Usuarios de Prueba

### Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Acceso**: Panel completo de administración

### Técnico
- **Usuario**: `tec1`
- **Contraseña**: `tec123`
- **Acceso**: Panel de gestión de órdenes

## 🌐 Estructura del Proyecto

```
tecnicentro_astro/
├── src/                          # Frontend (Astro)
│   ├── layouts/
│   │   └── Layout.astro         # Layout principal con estilos corporativos
│   ├── pages/
│   │   ├── index.astro          # Página de login
│   │   ├── admin/
│   │   │   └── dashboard.astro  # Dashboard administrativo
│   │   └── tecnico/
│   │       └── dashboard.astro  # Dashboard del técnico
│   └── components/              # Componentes reutilizables
├── server/                      # Backend (Node.js/Express)
│   ├── index.js                # Servidor principal
│   ├── config/
│   │   └── database.js         # Configuración de MySQL
│   ├── routes/                 # Rutas de la API
│   │   ├── auth.js            # Autenticación
│   │   ├── clientes.js        # Gestión de clientes
│   │   ├── vehiculos.js       # Gestión de vehículos
│   │   ├── servicios.js       # Catálogo de servicios
│   │   ├── ordenes.js         # Órdenes de trabajo
│   │   └── facturas.js        # Sistema de facturación
│   └── middleware/            # Middleware personalizado
├── public/                    # Archivos estáticos
├── package.json              # Scripts del proyecto
└── README.md                # Este archivo
```

## 🎯 Funcionalidades Principales

### 🏢 Gestión Administrativa
- **Clientes**: Registro, edición, historial de servicios
- **Vehículos**: Asociación con clientes, mantenimiento de datos
- **Servicios**: Catálogo con precios y descripciones
- **Órdenes**: Workflow completo desde ingreso hasta entrega
- **Facturación**: Generación automática desde órdenes completadas
- **Reportes**: Análisis de rendimiento y financiero

### 🔧 Gestión Técnica
- **Órdenes Asignadas**: Vista personalizada por técnico
- **Control de Estado**: Progreso de trabajos en tiempo real
- **Registro de Tiempo**: Control de horas trabajadas
- **Servicios Realizados**: Detalle de trabajos completados

### 🛡️ Seguridad
- **Autenticación JWT**: Tokens seguros para sesiones
- **Validación de Datos**: Sanitización en frontend y backend
- **Control de Acceso**: Rutas protegidas por roles
- **Encriptación**: Contraseñas hasheadas con bcrypt

## 🚀 Tecnologías Utilizadas

### Frontend
- **Astro** - Framework web moderno
- **HTML5/CSS3** - Estructura y estilos
- **JavaScript ES6+** - Lógica del cliente
- **Responsive Design** - Compatible con móviles

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL2** - Driver de base de datos
- **JSON Web Tokens** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **CORS** - Política de recursos cruzados

### Base de Datos
- **MySQL** - Sistema de gestión de base de datos
- **Esquema relacional** - Optimizado para talleres automotrices

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verify` - Verificar token

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Vehículos
- `GET /api/vehiculos` - Listar vehículos
- `POST /api/vehiculos` - Registrar vehículo
- `GET /api/vehiculos/cliente/:id` - Vehículos por cliente

### Órdenes
- `GET /api/ordenes` - Listar órdenes
- `POST /api/ordenes` - Crear orden
- `PUT /api/ordenes/:id` - Actualizar orden
- `GET /api/ordenes/tecnico/:id` - Órdenes por técnico

### Servicios y Facturas
- `GET /api/servicios` - Catálogo de servicios
- `GET /api/facturas` - Listar facturas
- `POST /api/facturas` - Generar factura

## 🎨 Personalización Visual

El sistema utiliza variables CSS para mantener coherencia con el branding de TecniCentro Ibarra Express:

```css
:root {
  --primary-blue: #1E4D8B;    /* Azul principal del logo */
  --primary-orange: #FF4500;   /* Naranja de acento */
  --secondary-blue: #2A5BA8;   /* Azul secundario */
  --light-blue: #E3F2FD;      /* Azul claro para fondos */
  /* ... más variables de color */
}
```

## 🔄 Scripts Disponibles

```bash
npm run dev          # Desarrollo (frontend + backend)
npm run server       # Solo backend (puerto 3001)
npm run client       # Solo frontend (puerto 4321)
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
```

## 📈 Estado del Proyecto

- ✅ **Autenticación y autorización**
- ✅ **Diseño responsive con branding corporativo**
- ✅ **CRUD completo de entidades**
- ✅ **Dashboard administrativo**
- ✅ **Dashboard del técnico**
- ✅ **Sistema de órdenes de trabajo**
- ✅ **Integración con base de datos**
- ⚠️ **Sistema de facturación** (funcional, puede expandirse)
- ⚠️ **Reportes y análisis** (estructura creada, pendiente implementación)

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork del repositorio
2. Crear rama para nueva característica (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## � Licencia

Este proyecto está desarrollado específicamente para TecniCentro Ibarra Express como sistema interno de gestión.

## 🆘 Soporte

Para soporte técnico o consultas sobre el sistema:
- Revisar la documentación en este README
- Verificar logs del servidor en consola
- Comprobar conexión a base de datos
- Validar configuración de variables de entorno

---

**TecniCentro Ibarra Express** - Sistema de Gestión Automotriz v1.0
