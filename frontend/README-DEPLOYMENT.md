# 📋 Guía de Despliegue y Protección de Código Fuente

## 🔐 Protección de Código Fuente

### **1. OFUSCACIÓN (Minificación)**
**Propósito:** Reducir tamaño de archivos y hacer el código menos legible
- **Ventajas:** Mejora rendimiento de carga
- **Desventajas:** Código puede ser revertido con herramientas online

### **2. ENCRYPTACIÓN**
**Propósito:** Convertir código a formato que no puede revertirse fácilmente
- **Ventajas:** Máxima protección del código fuente
- **Desventajas:** Más complejo de implementar

### **3. COMBINACIÓN (Recomendado)**
**Propósito:** Ofuscar + variables de entorno
- **Ventajas:** Balance entre seguridad y mantenibilidad

## 🛠️ Configuración Implementada

### **Archivos de Configuración:**

#### **1. Variables de Entorno (`.env.production`)**
```bash
NODE_ENV=production
API_URL=https://tu-api-de-produccion.com
DISABLE_CONSOLE_LOG=true
DISABLE_SOURCE_MAPS=true
CACHE_BUST=true
ANALYZE_BUNDLE=false
```

#### **2. Scripts de Producción (`package.json`)**
```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production vite build",
    "build:analyze": "ANALYZE_BUNDLE=true npm run build:prod"
  }
}
```

#### **3. Configuración de Vite (`vite.config.js`)**
- **Minificación con Terser**
- **División de código para caché**
- **Nombres de archivos con hash**
- **Límites de tamaño de bundles**
- **Ofuscación de nombres de módulos**

#### **4. Protección Git (`.gitignore`)**
- **Exclusión de archivos fuente en producción**
- **Protección de archivos sensibles**
- **Exclusión de archivos temporales**

## 🚀 Comandos de Despliegue

### **Desarrollo:**
```bash
npm run dev
```

### **Build de Producción:**
```bash
# Build estándar
npm run build:prod

# Build con análisis de tamaño
npm run build:analyze
```

### **Variables de Entorno:**
```bash
# Para producción
export NODE_ENV=production
export API_URL=https://tu-api-de-produccion.com

# Para desarrollo
export NODE_ENV=development
export API_URL=http://localhost:3000
```

## 📊 Características de Seguridad Implementadas

### **✅ Frontend:**
- **Ofuscación de código** con Terser
- **Eliminación de console.log** en producción
- **Source maps deshabilitados** en producción
- **Nombres de archivo con hash** para caché busting
- **División de código** en chunks optimizados

### **✅ Backend:**
- **Variables de entorno** protegidas
- **Conexiones seguras** con HTTPS
- **Validación de datos** en todos los endpoints
- **Autenticación por JWT** con expiración

### **✅ Infraestructura:**
- **Headers de seguridad** configurados
- **CORS configurado** para dominios específicos
- **Rate limiting** implementado
- **Logging seguro** sin información sensible

## 🔍 Verificación de Despliegue

### **Checklist Pre-Despliegue:**
- [ ] Variables de entorno configuradas
- [ ] API_URL apunta a producción
- [ ] Certificados SSL configurados
- [ ] Base de datos de producción lista
- [ ] Dependencias instaladas
- [ ] Build de producción generado

### **Checklist Post-Despliegue:**
- [ ] Aplicación carga correctamente
- [ ] API responde en producción
- [ ] No hay errores en consola
- [ ] Autenticación funciona
- [ ] Todos los módulos cargan
- [ ] Rendimiento aceptable

## 🚨 Consideraciones de Seguridad

### **❌ NO HACER:**
- **Nunca subir** archivos `.env` a repositorios
- **Nunca exponer** variables de entorno en el frontend
- **Nunca deshabilitar** CORS para todos los dominios
- **Nunca usar** credenciales en código duro

### **✅ SIEMPRE HACER:**
- **Usar siempre** variables de entorno
- **Validar datos** en el backend
- **Implementar rate limiting**
- **Usar HTTPS** en producción
- **Mantener actualizadas** las dependencias

## 🔄 Flujo de Despliegue Recomendado

### **1. Desarrollo Local:**
```bash
# Configurar variables locales
cp .env.example .env.local

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

### **2. Build de Producción:**
```bash
# Limpiar build anterior
rm -rf dist

# Generar build ofuscado
npm run build:prod

# Verificar tamaño de archivos
du -sh dist/*
```

### **3. Despliegue:**
```bash
# Subir archivos al servidor
rsync -avz dist/ user@server:/var/www/sisplan/

# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl restart sisplan-api
```

## 📈 Monitoreo y Mantenimiento

### **Herramientas Recomendadas:**
- **Sentry** para error tracking
- **Google Analytics** para métricas
- **Lighthouse** para auditoría de rendimiento
- **Bundle Analyzer** para análisis de tamaño

### **Mantenimiento Regular:**
- **Actualizar dependencias** semanalmente
- **Revisar logs** diariamente
- **Auditar seguridad** trimestralmente
- **Actualizar certificados** anualmente

## 🆘 Soporte y Contacto

Para problemas de despliegue o seguridad:
- **Documentación:** Revisar `README.md`
- **Issues:** Crear ticket en GitHub
- **Urgente:** Contactar al equipo de DevOps

---

**⚠️ IMPORTANTE:** Esta configuración asume que tienes un entorno de producción configurado. Ajusta las URLs y configuraciones según tu infraestructura específica.
