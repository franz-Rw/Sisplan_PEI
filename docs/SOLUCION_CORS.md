# Solución de Problema CORS - Servidor Municipal Windows

## **🚨 Problema Identificado**

Error de CORS (Cross-Origin Resource Sharing) cuando el frontend intenta comunicarse con el backend en el servidor municipal:

```
Access to XMLHttpRequest at 'http://localhost:3000/api/auth/login' 
from origin 'http://192.168.1.100:5173' 
has been blocked by CORS policy
```

## **🔍 Causa Raíz**

- **Frontend**: Accede desde `http://192.168.1.100:5173` (IP del servidor)
- **Backend**: Configurado solo para `http://localhost:5173`
- **Resultado**: Bloqueo por política de seguridad CORS

## **✅ Solución Implementada**

### **1. Archivo .env.production**
```bash
# Variables de Entorno - Producción Municipal
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://sisplan_user:password@localhost:5432/sisplan_municipal
JWT_SECRET=clave_super_secreta_municipal_2024_CAMBIAR_ESTA_CLAVE
JWT_EXPIRE=7d

# CORS - Permitir acceso desde cualquier origen en la red local
CORS_ORIGIN=http://192.168.1.100:5173,http://localhost:5173,http://127.0.0.1:5173
```

### **2. Actualización de backend/index.ts**
```typescript
// CORS - Permitir múltiples orígenes para desarrollo y producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://192.168.1.100:5173', // IP local de la municipalidad
  'http://192.168.1.100', // Por si accede sin puerto
]

// Agregar origen desde variables de entorno si existe
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','))
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)
```

## **🔄 Pasos para Aplicar en Servidor Municipal**

### **1. Actualizar Backend**
```powershell
# Detener servidor backend actual
# Navegar al directorio del backend
cd C:\Sisplan_FR\backend

# Usar archivo de entorno de producción
Copy-Item .env.production .env -Force

# Reiniciar backend
npm run build
npm start
```

### **2. Verificar Conexión**
```powershell
# Probar health check
curl http://localhost:3000/health

# Debería responder:
# {"status":"OK","timestamp":"2024-04-23T..."}
```

### **3. Probar Frontend**
1. Abrir navegador en: `http://192.168.1.100:5173`
2. Intentar iniciar sesión
3. Verificar que no aparezcan errores CORS en consola

## **🔧 Configuración Adicional (Si persiste el problema)**

### **Firewall de Windows**
```powershell
# Abrir puertos necesarios
netsh advfirewall firewall add rule name="SISPLAN Backend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="SISPLAN Frontend" dir=in action=allow protocol=TCP localport=5173
```

### **Variables de Entorno del Sistema**
```powershell
# Configurar variables de entorno del sistema
[Environment]::SetEnvironmentVariable("NODE_ENV", "production", "User")
[Environment]::SetEnvironmentVariable("CORS_ORIGIN", "http://192.168.1.100:5173", "User")
```

## **✅ Verificación Final**

Después de aplicar los cambios:

1. **Backend**: Responde en `http://localhost:3000`
2. **Frontend**: Accesible en `http://192.168.1.100:5173`
3. **CORS**: Permitido entre los dos orígenes
4. **Login**: Funciona sin errores de consola
5. **API**: Todas las rutas funcionan correctamente

---

**Última actualización**: 23 de Abril, 2026  
**Estado**: Solución implementada y lista para despliegue
