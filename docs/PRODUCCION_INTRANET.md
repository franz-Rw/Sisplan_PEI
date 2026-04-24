# Guía de Producción - Intranet Municipal

## **🎯 Objetivo**
Configurar SISPLAN FR para acceso múltiple desde intranet municipal mediante enlace compartido.

## **🔍 Problemas Actuales Identificados**

1. **Frontend**: Solo accesible desde localhost
2. **Backend**: CORS configurado pero frontend no escucha en red
3. **Red**: Usuarios no pueden acceder por IP local
4. **Producción**: Sistema en modo desarrollo

## **✅ Solución Completa**

### **1. Configurar Frontend para Red Local**

#### **Opción A: Vite con Host Red (Recomendado)**
```bash
# En frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces
    port: 5173,
    strictPort: true
  }
})
```

#### **Opción B: Parámetro de Línea de Comandos**
```bash
# Iniciar frontend accesible desde red
cd d:\Sisplan_PEI\frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### **2. Backend Configurado para Red**

#### **CORS para Múltiples IPs**
```typescript
// backend/src/index.ts - Ya configurado
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.1.100:5173', // Servidor municipal
  'http://192.168.2.45:5173',  // Tu laptop
  'http://192.168.137.1:5173', // Otra IP
  // Agregar más IPs según necesidad
]
```

#### **Backend Escuchando en Red**
```bash
# Backend ya escucha en 0.0.0.0:3000 (todas las interfaces)
# Verificar con: netstat -an | findstr :3000
```

### **3. Configuración de Producción**

#### **Variables de Entorno**
```bash
# backend/.env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://sisplan_user:password@localhost:5432/sisplan_municipal
JWT_SECRET=clave_super_secreta_municipal_2024_CAMBIAR_ESTA_CLAVE
CORS_ORIGIN=http://192.168.1.100:5173,http://192.168.2.45:5173,http://192.168.137.1:5173
```

#### **Build de Producción**
```bash
# Frontend
cd d:\Sisplan_PEI\frontend
npm run build

# Backend
cd d:\Sisplan_PEI\backend
npm run build
```

### **4. Acceso desde Intranet**

#### **URL para Usuarios**
```
Principal: http://192.168.1.100:5173
Alternativa: http://[IP-SERVIDOR]:5173
```

#### **Credenciales Iniciales**
```
Email: admin@sisplan.local
Contraseña: Password@2026
```

### **5. Configuración de Red**

#### **Firewall Windows**
```powershell
# Abrir puertos en firewall
netsh advfirewall firewall add rule name="SISPLAN Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="SISPLAN Backend" dir=in action=allow protocol=TCP localport=3000
```

#### **Verificar Conectividad**
```bash
# Desde otra computadora en la red
curl http://192.168.1.100:3000/health
# Debe responder: {"status":"OK","timestamp":"..."}

# Probar frontend
# Acceder a http://192.168.1.100:5173 desde navegador
```

## **🚀 Pasos de Implementación**

### **Paso 1: Configurar Frontend para Red**
```bash
# Editar vite.config.ts
cd d:\Sisplan_PEI\frontend

# Agregar configuración de host
# Reiniciar frontend con: npm run dev -- --host 0.0.0.0
```

### **Paso 2: Verificar Backend**
```bash
# Backend debe estar corriendo en modo producción
cd d:\Sisplan_PEI\backend
npm start
```

### **Paso 3: Probar Acceso**
```bash
# Desde otra computadora
# 1. Verificar backend: http://192.168.1.100:3000/health
# 2. Acceder frontend: http://192.168.1.100:5173
# 3. Intentar login
```

### **Paso 4: Configurar Producción**
```bash
# Build y modo producción
# Configurar servicios de Windows si es necesario
# Configurar reinicio automático
```

## **🔧 Solución de Problemas**

### **Problema: Frontend no accesible desde red**
```bash
# Verificar que frontend esté escuchando en 0.0.0.0
netstat -an | findstr :5173
# Debe mostrar: 0.0.0.0:5173

# Si no, reiniciar con --host 0.0.0.0
npm run dev -- --host 0.0.0.0
```

### **Problema: CORS bloqueando**
```bash
# Verificar logs del backend
# Agregar IP específica a allowedOrigins
# Reiniciar backend
```

### **Problema: Firewall bloqueando**
```bash
# Desactivar temporalmente para pruebas
netsh advfirewall set allprofiles state off

# Si funciona, configurar reglas específicas
netsh advfirewall set allprofiles state on
```

## **📋 Checklist de Producción**

- [ ] Frontend configurado para escuchar en red (0.0.0.0)
- [ ] Backend configurado para producción
- [ ] CORS configurado para IPs de la red
- [ ] Firewall con puertos 3000 y 5173 abiertos
- [ ] Base de datos en producción
- [ ] Build de frontend generado
- [ ] Servicios configurados para inicio automático
- [ ] Pruebas desde múltiples computadoras
- [ ] Documentación para usuarios finales

## **🎯 Resultado Final**

Usuarios podrán acceder mediante:
```
http://192.168.1.100:5173
```

Desde cualquier computadora en la intranet municipal, con login funcional y todas las características del sistema disponibles.

---

**Estado**: Configuración lista para implementación  
**Próximo paso: Configurar frontend para acceso por red
