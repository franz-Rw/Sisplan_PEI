# 🔧 Guía de Configuración de IPs y Puertos

## 📋 Resumen
Documentación rápida para cambiar IPs y puertos en diferentes ambientes del sistema SISPLAN FR.

---

## 🎯 Archivos Clave para Configurar IPs/Puertos

### 1. Backend - Configuración CORS y Escucha
**Archivo**: `backend/src/index.ts`

```javascript
// Líneas 22-33: Configuración de CORS (allowedOrigins)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  // Servidor de producción municipal - CAMBIAR esta IP si es necesario
  'http://192.168.2.7:5173', // 👈 CAMBIAR ESTA IP
  'http://192.168.2.7',      // 👈 CAMBIAR ESTA IP
  'http://192.168.2.5:5173', // 👈 CAMBIAR ESTA IP (alternativa)
  'http://192.168.2.5',      // 👈 CAMBIAR ESTA IP (alternativa)
  // ... otras IPs
];

// Línea 97: Puerto del servidor
app.listen(Number(PORT), '0.0.0.0', () => {
  // PORT viene de .env (por defecto 3000)
});
```

### 2. Backend - Variables de Entorno Producción
**Archivo**: `backend/.env.production`

```env
# Línea 3: Puerto del backend
PORT=3000  # 👈 CAMBIAR ESTE PUERTO

# Línea 10: Orígenes CORS
CORS_ORIGIN=http://192.168.2.7:5173,http://192.168.2.7,http://localhost:5173,http://127.0.0.1:5173
#            👈 CAMBIAR ESTA IP
```

### 3. Frontend - Variables de Entorno Producción
**Archivo**: `frontend/env.production`

```env
# Línea 3: URL del backend
VITE_API_URL=http://192.168.2.7:3000/api
#                   👈 CAMBIAR ESTA IP Y PUERTO
```

### 4. Frontend - Variables de Entorno Desarrollo
**Archivo**: `frontend/.env.development`

```env
# Línea 3: URL del backend en desarrollo
VITE_API_URL=http://192.168.2.45:3000/api
#                   👈 CAMBIAR ESTA IP Y PUERTO
```

---

## 🔄 Escenarios Comunes de Cambio

### 🏢 Escenario 1: Cambiar IP del Servidor de Producción
**De**: `192.168.2.7` → **A**: `192.168.2.5`

**Archivos a modificar**:
1. `backend/src/index.ts` (líneas 23-26)
2. `backend/.env.production` (línea 10)
3. `frontend/env.production` (línea 3)

### 🖥️ Escenario 2: Cambiar IP de Desarrollo
**De**: `192.168.2.45` → **A**: `192.168.2.100`

**Archivos a modificar**:
1. `frontend/.env.development` (línea 3)

### 🔌 Escenario 3: Cambiar Puerto del Backend
**De**: `3000` → **A**: `8080`

**Archivos a modificar**:
1. `backend/.env.production` (línea 3)
2. `frontend/env.production` (línea 3)
3. `frontend/.env.development` (línea 3)

### 🌐 Escenario 4: Cambiar Puerto del Frontend
**De**: `5173` → **A**: `80`

**Archivos a modificar**:
1. `backend/src/index.ts` (todos los allowedOrigins)
2. `backend/.env.production` (línea 10)
3. Comando de inicio del frontend

---

## 📝 Scripts de Cambio Rápido

### 🔄 Cambiar IP de Producción
```bash
# Reemplazar 192.168.2.7 por nueva IP (ej: 192.168.2.5)
NUEVA_IP="192.168.2.5"

# Backend CORS
sed -i "s/192.168.2.7/$NUEVA_IP/g" backend/src/index.ts

# Backend .env.production
sed -i "s/192.168.2.7/$NUEVA_IP/g" backend/.env.production

# Frontend env.production
sed -i "s/192.168.2.7/$NUEVA_IP/g" frontend/env.production
```

### 🔌 Cambiar Puerto del Backend
```bash
# Reemplazar 3000 por nuevo puerto (ej: 8080)
NUEVO_PUERTO="8080"

# Backend .env.production
sed -i "s/PORT=3000/PORT=$NUEVO_PUERTO/g" backend/.env.production

# Frontend env.production
sed -i "s/:3000/:$NUEVO_PUERTO/g" frontend/env.production

# Frontend .env.development
sed -i "s/:3000/:$NUEVO_PUERTO/g" frontend/.env.development
```

---

## 🌐 Ambientes Configurados

### 🏭 Producción (Servidor Municipal)
```
Frontend: http://192.168.2.7:5173
Backend:  http://192.168.2.7:3000/api
Base de Datos: PostgreSQL local
```

### 💻 Desarrollo (Local)
```
Frontend: http://localhost:5173
Backend:  http://192.168.2.45:3000/api
Base de Datos: PostgreSQL local
```

### 🧪 Testing (Opcional)
```
Frontend: http://localhost:5174
Backend:  http://localhost:3001/api
Base de Datos: PostgreSQL de prueba
```

---

## ✅ Verificación de Cambios

### 1. Verificar Configuración Backend
```bash
# Verificar CORS configurado
curl -H "Origin: http://192.168.2.7:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://192.168.2.7:3000/api/auth/login

# Debe retornar headers CORS válidos
```

### 2. Verificar Configuración Frontend
```bash
# Verificar que el frontend apunta al backend correcto
# En navegador: abrir DevTools → Network → ver peticiones API
```

### 3. Verificar Conectividad
```bash
# Testear conexión al backend
curl http://192.168.2.7:3000/api/health

# Testear acceso al frontend
curl http://192.168.2.7:5173
```

---

## 🚨 Errores Comunes y Soluciones

### ❌ Error: CORS bloqueado
**Causa**: IP del cliente no está en allowedOrigins
**Solución**: Agregar la IP a `backend/src/index.ts`

### ❌ Error: Conexión rechazada
**Causa**: Backend no está escuchando en la IP/puerto correctos
**Solución**: Verificar `app.listen()` y variables de entorno

### ❌ Error: No se puede conectar al backend
**Causa**: Frontend apunta a IP/puerto incorrecto
**Solución**: Verificar `VITE_API_URL` en archivos .env

---

## 📋 Checklist de Cambios

### Para Cambiar IP del Servidor:
- [ ] Actualizar `backend/src/index.ts` (allowedOrigins)
- [ ] Actualizar `backend/.env.production` (CORS_ORIGIN)
- [ ] Actualizar `frontend/env.production` (VITE_API_URL)
- [ ] Reiniciar servicios
- [ ] Verificar conectividad
- [ ] Testear login

### Para Cambiar Puerto:
- [ ] Actualizar `backend/.env.production` (PORT)
- [ ] Actualizar `frontend/env.production` (VITE_API_URL)
- [ ] Actualizar `frontend/.env.development` (VITE_API_URL)
- [ ] Configurar firewall (nuevo puerto)
- [ ] Reiniciar servicios
- [ ] Verificar conectividad

---

## 🔗 Referencias Rápidas

### URLs Finales
```
Producción:  http://192.168.2.7:5173
API:         http://192.168.2.7:3000/api
Health:      http://192.168.2.7:3000/api/health
```

### Comandos Útiles
```bash
# Verificar procesos
pm2 status

# Reiniciar backend
pm2 restart sisplan-backend

# Ver logs
pm2 logs sisplan-backend

# Testear API
curl http://192.168.2.7:3000/api/health
```

---

## 📞 Soporte

Si tienes problemas después de cambiar IPs/puertos:
1. Verifica que los archivos fueron modificados correctamente
2. Reinicia ambos servicios (backend y frontend)
3. Limpia caché del navegador
4. Verifica configuración del firewall
5. Revisa los logs de error

**🎯 Recuerda**: Siempre haz cambios en ambos lados (backend y frontend) para mantener consistencia.
