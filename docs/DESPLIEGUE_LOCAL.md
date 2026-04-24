# Guía de Despliegue Local - Laptop de Desarrollo

## **🎯 Objetivo**
Desplegar SISPLAN FR en tu laptop local para desarrollo y pruebas.

## **✅ Requisitos Cumplidos**
- **CORS Configurado**: Soporta localhost, 127.0.0.1 y tu IP local
- **Variables de Entorno**: Listas para producción y desarrollo
- **Base de Datos**: PostgreSQL configurado
- **Sistema Completo**: Frontend + Backend funcionales

## **🚀 Pasos para Despliegue Local**

### **1. Preparar Base de Datos**
```bash
# Instalar PostgreSQL si no está instalado
# Windows: Descargar desde postgresql.org

# Crear base de datos
CREATE DATABASE sisplan_local;
CREATE USER sisplan_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE sisplan_local TO sisplan_user;
```

### **2. Configurar Backend**
```bash
# Navegar al directorio backend
cd d:\Sisplan_PEI\backend

# Usar variables de entorno locales
Copy-Item .env.example .env

# Editar .env con tus datos:
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://sisplan_user:tu_password@localhost:5432/sisplan_local
JWT_SECRET=clave_secreta_desarrollo_2024
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Instalar dependencias
npm install

# Aplicar migraciones
npx prisma migrate dev

# Crear datos iniciales
npx prisma db seed

# Iniciar backend
npm run dev
```

### **3. Configurar Frontend**
```bash
# Navegar al directorio frontend (nueva terminal)
cd d:\Sisplan_PEI\frontend

# Crear archivo .env.local
echo "VITE_API_URL=http://localhost:3000/api" > .env.local

# Instalar dependencias
npm install

# Iniciar frontend
npm run dev
```

### **4. Acceder al Sistema**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## **🔐 Credenciales Iniciales**
```
Email: admin@sisplan.local
Contraseña: Password@2026
```

## **🛠️ Comandos Útiles**

### **Backend**
```bash
npm run dev          # Servidor desarrollo
npm run build        # Compilar para producción
npm start            # Servidor producción
npm run db:studio    # Prisma Studio
npm run db:seed      # Crear datos iniciales
```

### **Frontend**
```bash
npm run dev          # Servidor desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Validar código
```

### **Base de Datos**
```bash
npx prisma migrate dev    # Nueva migración
npx prisma studio         # UI de base de datos
npx prisma db seed        # Poblar datos
npx prisma db push        # Sincronizar schema
```

## **🔍 Verificación Funcional**

### **1. Probar Backend**
```bash
curl http://localhost:3000/health
# Respuesta esperada: {"status":"OK","timestamp":"..."}
```

### **2. Probar Frontend**
1. Abrir navegador en http://localhost:5173
2. Intentar login con credenciales iniciales
3. Verificar que no haya errores CORS en consola

### **3. Probar Funcionalidades**
- [ ] Login funciona
- [ ] Dashboard carga datos
- [ ] Crear/Editar usuarios
- [ ] Crear/Editar centros de costo
- [ ] Crear planes estratégicos
- [ ] Generar reportes PDF

## **🚨 Solución de Problemas Comunes**

### **Error CORS**
```bash
# Verificar que backend esté configurado con tu origen
# Revisar archivo backend/src/index.ts
# Debe incluir http://localhost:5173 en allowedOrigins
```

### **Error Base de Datos**
```bash
# Verificar conexión PostgreSQL
psql -h localhost -U sisplan_user -d sisplan_local

# Reaplicar migraciones
npx prisma migrate reset
npx prisma migrate dev
```

### **Error de Dependencias**
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## **📊 Estado Actual del Sistema**

### **✅ Funcionalidades Disponibles**
- **Autenticación**: Login/logout con JWT
- **Gestión de Usuarios**: CRUD completo
- **Centros de Costo**: Asignación y gestión
- **Planes Estratégicos**: Creación y edición
- **Indicadores**: Configuración y seguimiento
- **Reportes**: PDF y Excel
- **Dashboard**: Métricas en tiempo real

### **🔄 Flujo de Trabajo Local**
1. **Desarrollo**: `npm run dev` en ambos directorios
2. **Pruebas**: Acceder via localhost
3. **Cambios**: Auto-reload con Vite y Nodemon
4. **Base de Datos**: Prisma Studio para visualización

---

**✅ Listo para desarrollo local en tu laptop!**

**Última actualización**: 23 de Abril, 2026  
**Estado**: Guía completa y funcional
