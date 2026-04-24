# 🚀 Guía de Despliegue en Producción - Servidor Municipal

## 📋 Resumen
Esta guía explica cómo desplegar el sistema SISPLAN FR en el servidor municipal `192.168.2.7` para producción en la intranet.

## 🌐 Arquitectura de Red
- **Servidor de Producción**: `192.168.2.7` (o `192.168.2.5` si se necesita otra IP)
- **Frontend**: Puerto `5173`
- **Backend**: Puerto `3000`
- **Base de Datos**: PostgreSQL en el mismo servidor
- **Acceso**: Solo desde la red municipal (intranet)

---

## 🔧 Archivos de Configuración Clave

### 📁 Backend
```
d:\Sisplan_PEI\backend\
├── .env.production          # Variables de entorno producción
├── src/index.ts            # Configuración del servidor y CORS
└── package.json            # Scripts de ejecución
```

### 📁 Frontend
```
d:\Sisplan_PEI\frontend\
├── env.production          # Variables de entorno producción
├── vite.config.ts          # Configuración de Vite
└── package.json            # Scripts de build
```

---

## 🛠️ Paso 1: Configuración del Servidor

### 1.1 Instalar Node.js
```bash
# Descargar e instalar Node.js 18+ desde https://nodejs.org
# Verificar instalación:
node --version
npm --version
```

### 1.2 Instalar PostgreSQL
```bash
# Instalar PostgreSQL 14+
# Crear base de datos:
CREATE DATABASE sisplan_municipal;
CREATE USER sisplan_user WITH PASSWORD 'password_seguro';
GRANT ALL PRIVILEGES ON DATABASE sisplan_municipal TO sisplan_user;
```

### 1.3 Configurar Firewall
```bash
# Abrir puertos en Windows Firewall
# Puerto 3000 (Backend API)
# Puerto 5173 (Frontend)
# Puerto 5432 (PostgreSQL - solo si es necesario acceso remoto)
```

---

## 📦 Paso 2: Preparar el Proyecto

### 2.1 Copiar Archivos al Servidor
```bash
# Copiar todo el proyecto al servidor
# Ejemplo: C:\sisplan\Sisplan_PEI\
```

### 2.2 Instalar Dependencias
```bash
# Backend
cd C:\sisplan\Sisplan_PEI\backend
npm install --production

# Frontend
cd C:\sisplan\Sisplan_PEI\frontend
npm install
```

---

## ⚙️ Paso 3: Configurar Variables de Entorno

### 3.1 Backend (.env.production)
```env
# Variables de Entorno - Producción Municipal
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://sisplan_user:password_seguro@localhost:5432/sisplan_municipal
JWT_SECRET=clave_super_secreta_municipal_2024_CAMBIAR_ESTA_CLAVE
JWT_EXPIRE=7d

# CORS - Permitir acceso desde servidor de producción
# CAMBIAR ESTA IP si el servidor tiene otra dirección (ej: 192.168.2.5)
CORS_ORIGIN=http://192.168.2.7:5173,http://192.168.2.7,http://localhost:5173,http://127.0.0.1:5173

# Seguridad
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.2 Frontend (env.production)
```env
# Variables de Entorno - Producción Municipal
# CAMBIAR ESTA IP si el servidor tiene otra dirección (ej: 192.168.2.5)
VITE_API_URL=http://192.168.2.7:3000/api

# Configuración de producción
NODE_ENV=production
VITE_DEV_MODE=false
VITE_DEBUG=false
VITE_CACHE_BUST=true
```

---

## 🗄️ Paso 4: Configurar Base de Datos

### 4.1 Ejecutar Migraciones
```bash
cd C:\sisplan\Sisplan_PEI\backend
npx prisma migrate deploy
npx prisma generate
```

### 4.2 Crear Usuario Administrador
```bash
# Usar Prisma Studio o script para crear usuario:
# Email: admin@sisplan.local
# Contraseña: Password@2026
```

---

## 🏗️ Paso 5: Build del Frontend

### 5.1 Compilar para Producción
```bash
cd C:\sisplan\Sisplan_PEI\frontend

# Renombrar el archivo de entorno
copy env.production .env.production

# Build de producción
npm run build:prod
```

### 5.2 Verificar Build
```bash
# El resultado estará en la carpeta 'dist'
# Debe contener archivos HTML, CSS, JS
```

---

## 🚀 Paso 6: Iniciar Servicios

### 6.1 Iniciar Backend (Producción)
```bash
cd C:\sisplan\Sisplan_PEI\backend

# Usar variables de entorno de producción
set NODE_ENV=production
npm start

# O usando PM2 para gestión de procesos:
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

### 6.2 Iniciar Frontend (Producción)
```bash
cd C:\sisplan\Sisplan_PEI\frontend

# Servir archivos build con servidor web
# Opción 1: Usar serve
npm install -g serve
serve -s dist -l 5173

# Opción 2: Usar IIS/Apache/Nginx
# Configurar para servir la carpeta 'dist'
```

---

## 🔄 Paso 7: Automatización con PM2

### 7.1 Configurar PM2 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [
    {
      name: 'sisplan-backend',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
```

### 7.2 Iniciar con PM2
```bash
# Iniciar en producción
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

---

## 🌐 Paso 8: Configurar Servidor Web (IIS)

### 8.1 Configurar IIS para Frontend
```xml
<!-- web.config para IIS -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Handle History Mode and custom 404/500" stopProcessing="true">
          <match url="(.*)" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

---

## 🔍 Paso 9: Verificación y Testing

### 9.1 URLs de Acceso
```
Frontend: http://192.168.2.7:5173
Backend API: http://192.168.2.7:3000/api
Health Check: http://192.168.2.7:3000/api/health
```

### 9.2 Credenciales Iniciales
```
Email: admin@sisplan.local
Contraseña: Password@2026
```

### 9.3 Verificar Conectividad
```bash
# Testear conexión al backend
curl http://192.168.2.7:3000/api/health

# Testear CORS
curl -H "Origin: http://192.168.2.7:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://192.168.2.7:3000/api/auth/login
```

---

## 📝 Archivos para Modificar IP/Puertos

### 🎯 Si necesitas cambiar la IP del servidor:

1. **Backend - CORS** (`backend/src/index.ts`):
   ```javascript
   // Líneas 23-26: Cambiar IPs
   'http://192.168.2.7:5173', // Cambiar esta IP
   'http://192.168.2.7',      // Cambiar esta IP
   ```

2. **Backend - Variables** (`backend/.env.production`):
   ```env
   # Línea 10: Cambiar IP
   CORS_ORIGIN=http://NUEVA_IP:5173,http://NUEVA_IP,http://localhost:5173,http://127.0.0.1:5173
   ```

3. **Frontend - Variables** (`frontend/env.production`):
   ```env
   # Línea 3: Cambiar IP
   VITE_API_URL=http://NUEVA_IP:3000/api
   ```

### 🎯 Si necesitas cambiar puertos:

1. **Backend** (`backend/.env.production`):
   ```env
   PORT=3000  # Cambiar este puerto
   ```

2. **Frontend** (al iniciar):
   ```bash
   serve -s dist -l NUEVO_PUERTO
   ```

---

## 🚨 Troubleshooting

### Problema: No puedo acceder desde otras computadoras
**Solución**: Verificar firewall y configuración CORS
```bash
# Abrir puertos en firewall
netsh advfirewall firewall add rule name="SISPLAN Backend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="SISPLAN Frontend" dir=in action=allow protocol=TCP localport=5173
```

### Problema: Error de conexión a base de datos
**Solución**: Verificar que PostgreSQL esté corriendo y credenciales correctas

### Problema: Error CORS
**Solución**: Verificar que la IP del cliente esté en la lista de allowedOrigins

---

## 🔄 Mantenimiento

### Actualizar el Sistema
```bash
# 1. Hacer backup de la base de datos
pg_dump sisplan_municipal > backup_$(date +%Y%m%d).sql

# 2. Actualizar código
git pull origin main

# 3. Instalar nuevas dependencias
npm install

# 4. Rebuild frontend
npm run build:prod

# 5. Reiniciar servicios
pm2 restart sisplan-backend
```

### Logs y Monitoreo
```bash
# Ver logs de PM2
pm2 logs sisplan-backend

# Ver estado de los procesos
pm2 status

# Reiniciar si hay problemas
pm2 restart sisplan-backend
```

---

## 📞 Soporte

### URLs Útiles
- **Frontend**: `http://192.168.2.7:5173`
- **Backend API**: `http://192.168.2.7:3000/api`
- **Health Check**: `http://192.168.2.7:3000/api/health`

### Comandos Rápidos
```bash
# Iniciar todo el sistema
cd C:\sisplan\Sisplan_PEI\backend && pm2 start ecosystem.config.js --env production
cd C:\sisplan\Sisplan_PEI\frontend && serve -s dist -l 5173

# Verificar estado
pm2 status
curl http://192.168.2.7:3000/api/health
```

---

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] PostgreSQL configurado
- [ ] Firewall configurado (puertos 3000, 5173)
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Frontend compilado
- [ ] Servicios iniciados
- [ ] Acceso desde intranet funcionando
- [ ] Login con credenciales iniciales
- [ ] PM2 configurado para producción
- [ ] Logs configurados
- [ ] Backup programado

**🎉 Sistema listo para producción en la intranet municipal!**
