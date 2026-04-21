# SISPLAN FR - Sistema de Gestión de Indicadores Estratégicos

![SISPLAN FR](https://img.shields.io/badge/SISPLAN%20FR-0073A9?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

Sistema web full-stack enterprise para la gestión integral de indicadores de planes estratégicos municipales, diseñado con arquitectura moderna, escalable y segura.

## 🎯 Visión General

**SISPLAN FR** es una plataforma completa que permite a las municipalidades gestionar, monitorear y reportar indicadores estratégicos de manera eficiente y centralizada. El sistema ofrece dos roles diferenciados con funcionalidades específicas para administradores y operadores.

### 🏢 Características Principales

#### **Para Administradores Municipales**
- 📊 **Gestión de Planes Estratégicos**: Creación, edición y seguimiento de planes a largo plazo
- 🏢 **Administración de Centros de Costo**: Gestión jerárquica de unidades municipales
- 👥 **Gestión de Usuarios**: Control de accesos y asignación por centro de costo
- 📋 **Definición de Objetivos y Acciones**: Estructuración de metas estratégicas
- 📈 **Configuración de Variables**: Definición de indicadores y métricas
- ⏰ **Configuración de Plazos**: Establecimiento de fechas límite para operadores
- 📑 **Reportes Consolidados**: Generación de informes en PDF y Excel

#### **Para Operadores**
- 🎯 **Visualización de Planes**: Acceso a planes asignados con filtros inteligentes
- 📊 **Registro de Indicadores**: Captura de datos de objetivos y acciones estratégicas
- 📈 **Seguimiento de Variables**: Registro sistemático de métricas de desempeño
- 📑 **Exportación Personalizada**: Reportes específicos por centro de costo
- � **Actualización en Tiempo Real**: Sincronización automática de datos

## 🏗️ Arquitectura y Stack Tecnológico

### **Frontend Moderno**
- **React 18** + **TypeScript**: Componentes reutilizables con tipado seguro
- **Vite**: Bundler ultrarrápido con Hot Module Replacement
- **Tailwind CSS**: Sistema de diseño utilitario y responsive
- **React Router v6**: Navegación declarativa y protegida
- **Axios**: Cliente HTTP con interceptores y manejo de errores
- **Recharts**: Visualización de datos interactiva y responsiva

### **Backend Robusto**
- **Node.js** + **Express**: API RESTful escalable y mantenible
- **PostgreSQL**: Base de datos relacional enterprise-grade
- **Prisma ORM**: Type-safe database access con migraciones automáticas
- **JWT**: Autenticación stateless con tokens firmados
- **Bcrypt**: Hashing seguro de contraseñas
- **CORS**: Configuración segura de orígenes permitidos

### **Infraestructura**
- **Docker Compose**: Orquestación de servicios con un comando
- **Environment Variables**: Configuración segura por entorno
- **Logging Centralizado**: Monitoreo y debugging estructurado

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

- **Node.js 18+** y **npm** (o yarn/pnpm)
- **PostgreSQL 14+** instalado y corriendo
- **Git** para control de versiones
- **Windows Server** (para producción municipal)

### 🔧 Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/municipalidad/sisplan-fr.git
cd Sisplan_PEI

# 2. Configurar Backend
cd backend
cp .env.example .env
# Editar .env con credenciales de base de datos
npm install
npx prisma db push
npm run dev

# 3. Configurar Frontend (en nueva terminal)
cd ../frontend
npm install
npm run dev
```

### 🌐 Acceso Local

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 🖥️ Instalación en Servidor Municipal (Windows)

### 📋 Preparación del Servidor

1. **Instalar Node.js 18+**
   ```powershell
   # Descargar desde https://nodejs.org
   # Verificar instalación
   node --version
   npm --version
   ```

2. **Instalar PostgreSQL 14+**
   ```powershell
   # Descargar e instalar PostgreSQL
   # Crear base de datos
   createdb sisplan_municipal
   # Crear usuario
   createuser sisplan_user
   ```

3. **Configurar Variables de Entorno**
   ```powershell
   # Variables del sistema (Panel de Control > Sistema > Variables de entorno)
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://sisplan_user:password@localhost:5432/sisplan_municipal
   JWT_SECRET=clave_super_secreta_municipal_2024
   CORS_ORIGIN=http://servidor-municipal:5173
   ```

### 🚀 Despliegue en Producción

```bash
# 1. Clonar repositorio en servidor
git clone https://github.com/franz-Rw/Sisplan_PEI.git
cd Sisplan_PEI

# 2. Configurar Backend para producción
cd backend
cp .env.example .env.production
# Editar .env.production con credenciales reales
npm install --production
npx prisma db push
npm run build

# 3. Configurar Frontend para producción
cd ../frontend
npm install --production
npm run build

# 4. Iniciar servicios
# Backend (en background)
npm start

# Frontend (servidor web como IIS/Apache o Node.js)
npm run preview
```

### 🔄 Proceso Automatizado (Batch File)

```batch
@echo off
title SISPLAN FR - Sistema Municipal
echo Iniciando SISPLAN FR...
echo.

cd /d "C:\SISPLAN_FR\backend"
start "Backend SISPLAN" cmd /k "npm start"

timeout /t 3

cd /d "C:\SISPLAN_FR\frontend"
start "Frontend SISPLAN" cmd /k "npm run preview"

echo.
echo Sistema SISPLAN FR iniciado correctamente
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
pause
```

## 📁 Estructura del Proyecto

```
Sisplan_PEI/
├── 📄 DOCUMENTACIÓN
│   ├── README.md                    # Guía principal
│   ├── GUIA_PROYECTO.md           # Arquitectura detallada
│   ├── CONSISTENCIA_Y_CALIDAD.md   # Reglas de calidad
│   └── IMPLEMENTACION_ADMIN.md      # Guía de implementación
│
├── 🖥️ FRONTEND/
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   │   ├── ui/              # Componentes base (Button, Input, etc.)
│   │   │   ├── forms/            # Formularios especializados
│   │   │   └── charts/           # Componentes de gráficos
│   │   ├── pages/                  # Páginas por rol
│   │   │   ├── admin/            # Dashboard y páginas admin
│   │   │   ├── operator/         # Dashboard y páginas operador
│   │   │   └── auth/             # Login y registro
│   │   ├── layouts/                # Layouts principales
│   │   │   ├── AdminLayout.tsx   # Layout con sidebar completo
│   │   │   └── OperatorLayout.tsx # Layout con sidebar limitado
│   │   ├── hooks/                  # Custom hooks React
│   │   ├── context/                # React Context (Auth, Theme)
│   │   ├── services/               # APIs y servicios externos
│   │   ├── utils/                  # Funciones utilitarias
│   │   ├── types/                  # Tipos TypeScript
│   │   ├── styles/                 # Estilos globales
│   │   └── assets/                 # Imágenes, iconos, etc.
│   ├── public/                     # Archivos estáticos
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── 🔧 BACKEND/
│   ├── src/
│   │   ├── routes/                 # Rutas API REST
│   │   ├── controllers/            # Lógica de negocio
│   │   ├── services/               # Servicios (BD, auth, etc.)
│   │   ├── middleware/             # Middlewares (auth, error, CORS)
│   │   ├── models/                 # Modelos de datos
│   │   ├── utils/                  # Funciones utilitarias
│   │   ├── config/                 # Configuración general
│   │   └── index.ts                # Entry point del servidor
│   ├── prisma/
│   │   ├── schema.prisma           # Definición de base de datos
│   │   └── migrations/             # Migraciones automáticas
│   ├── package.json
│   └── tsconfig.json
│
├── 🐳 INFRAESTRUCTURA/
│   ├── docker-compose.yml           # Orquestación de contenedores
│   ├── start-dev.bat              # Script desarrollo Windows
│   └── start-dev.sh               # Script desarrollo Linux/Mac
│
└── 📋 CONFIGURACIÓN/
    ├── .env.example               # Plantilla variables entorno
    ├── .gitignore                 # Archivos ignorados
    └── package.json               # Scripts del proyecto
```

## 🔐 Seguridad y Autenticación

### **Flujo de Autenticación**

1. **Login**: Usuario ingresa credenciales en frontend
2. **Validación**: Backend verifica credenciales contra base de datos
3. **JWT**: Se genera token firmado con información del usuario
4. **Almacenamiento**: Frontend guarda token en localStorage seguro
5. **Autorización**: Token se envía en header `Authorization: Bearer <token>`
6. **Middleware**: Cada request valida token y extrae información del usuario
7. **Refresh**: Token expira y redirige a login

### **Medidas de Seguridad**

- ✅ **JWT con firma robusta** y expiración configurable
- ✅ **Contraseñas hasheadas** con bcrypt (salt rounds: 12)
- ✅ **CORS configurado** para dominios específicos
- ✅ **Helmet.js** para headers de seguridad HTTP
- ✅ **Validación de entrada** en todos los endpoints
- ✅ **Rate limiting** para prevenir ataques de fuerza bruta
- ✅ **Logging de eventos** de seguridad
- ✅ **Variables de entorno** para datos sensibles

## 📊 API RESTful - Endpoints Principales

### **Autenticación**
```http
POST   /api/auth/register          # Registrar nuevo usuario
POST   /api/auth/login             # Iniciar sesión
GET    /api/auth/profile           # Obtener perfil del usuario
PUT    /api/auth/profile           # Actualizar perfil
POST   /api/auth/refresh          # Refrescar token
DELETE  /api/auth/logout           # Cerrar sesión
```

### **Planes Estratégicos**
```http
GET    /api/plans                 # Listar todos los planes
POST   /api/plans                 # Crear nuevo plan (Admin)
GET    /api/plans/:id             # Obtener plan específico
PUT    /api/plans/:id             # Actualizar plan (Admin)
DELETE  /api/plans/:id             # Eliminar plan (Admin)
GET    /api/plans/:id/objectives  # Obtener objetivos de un plan
```

### **Centros de Costo**
```http
GET    /api/cost-centers          # Listar centros de costo
POST   /api/cost-centers          # Crear centro (Admin)
GET    /api/cost-centers/:id       # Obtener centro específico
PUT    /api/cost-centers/:id       # Actualizar centro (Admin)
DELETE  /api/cost-centers/:id       # Eliminar centro (Admin)
GET    /api/cost-centers/:id/users # Usuarios asignados
```

### **Usuarios**
```http
GET    /api/users                 # Listar usuarios (Admin)
POST   /api/users                 # Crear usuario (Admin)
GET    /api/users/:id             # Obtener usuario específico
PUT    /api/users/:id             # Actualizar usuario (Admin)
DELETE  /api/users/:id             # Eliminar usuario (Admin)
GET    /api/users/cost-center/:id  # Usuarios por centro de costo
```

## 🎨 Diseño UI/UX y Experiencia de Usuario

### **Sistema de Diseño**

- **Paleta de Colores Municipal**
  - Primario: `#0073A9` (Azul institucional)
  - Secundario: `#00A86B` (Verde municipal)
  - Acento: `#FF6B35` (Naranja acción)
  - Neutros: `#F8FAFC`, `#E2E8F0`, `#64748B`

- **Tipografía**
  - Principal: **Inter** (moderna, legible)
  - Alternativa: **Segoe UI** (Windows)
  - Monospace: **Fira Code** (código, datos)

- **Componentes**
  - **Material Icons**: Iconografía consistente
  - **Responsive First**: Mobile-first approach
  - **Accesibilidad WCAG AA**: Contraste, navegación por teclado, screen readers

### **Principios de UX**

1. **Minimalismo**: Interfaz limpia sin elementos innecesarios
2. **Consistencia**: Patrones de diseño uniformes en toda la aplicación
3. **Feedback Visual**: Estados de carga, éxito, error claros
4. **Navegación Intuitiva**: Estructura lógica por rol y función
5. **Accesibilidad**: Cumplimiento de estándares WCAG 2.1 AA

## 🔧 Scripts y Comandos Útiles

### **Desarrollo**
```bash
# Frontend
npm run dev              # Servidor desarrollo con HMR
npm run build            # Build optimizado para producción
npm run preview          # Preview del build de producción
npm run lint             # Validar código con ESLint
npm run format           # Formatear código con Prettier

# Backend
npm run dev              # Servidor desarrollo con auto-restart
npm run build            # Compilar TypeScript a JavaScript
npm run start            # Servidor producción
npm run lint             # Validar código con ESLint
npm run db:push          # Sincronizar schema con BD
npm run db:migrate       # Crear nueva migración
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Poblar BD con datos iniciales
```

### **Producción**
```bash
# Verificar salud de servicios
npm run health:check     # Verificar backend y BD
npm run logs:follow       # Seguir logs en tiempo real
npm run backup:db        # Respaldo automático de BD
npm run deploy:staging    # Despliegue a staging
npm run deploy:prod       # Despliegue a producción
```

## 🐳 Docker y Contenerización

### **Docker Compose**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: sisplan_municipal
      POSTGRES_USER: sisplan_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://sisplan_user:${DB_PASSWORD}@postgres:5432/sisplan_municipal
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### **Comandos Docker**
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose build --no-cache

# Backup de base de datos
docker-compose exec postgres pg_dump -U sisplan_user sisplan_municipal > backup.sql
```

## 🗄️ Base de Datos - Diseño Relacional

### **Entidades Principales**

```sql
-- Usuarios del sistema
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'OPERATOR')),
    costCenterId UUID REFERENCES CostCenters(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Centros de costo municipales
CREATE TABLE CostCenters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    assignedUserId UUID REFERENCES Users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Planes estratégicos
CREATE TABLE StrategicPlans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    startYear INTEGER NOT NULL,
    endYear INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Objetivos estratégicos
CREATE TABLE StrategicObjectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planId UUID NOT NULL REFERENCES StrategicPlans(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    targetValue DECIMAL(15,2),
    unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acciones estratégicas
CREATE TABLE StrategicActions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objectiveId UUID NOT NULL REFERENCES StrategicObjectives(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    responsibleId UUID REFERENCES Users(id),
    deadline DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indicadores de desempeño
CREATE TABLE Indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objectiveId UUID REFERENCES StrategicObjectives(id),
    actionId UUID REFERENCES StrategicActions(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    formula TEXT,
    targetValue DECIMAL(15,2),
    unit VARCHAR(50),
    frequency VARCHAR(20),
    responsibleId UUID REFERENCES Users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Configuración PostgreSQL**

```sql
CREATE DATABASE sisplan_db;
CREATE USER sisplan_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sisplan_db TO sisplan_user;
```

### Migraciones
```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Ver estado
npx prisma migrate status

# Resetear BD (desarrollo solo)
npx prisma migrate reset
```

## 🐳 Docker (Opcional)

```bash
docker-compose up -d     # Levantar servicios
docker-compose down      # Detener servicios
docker-compose logs -f   # Ver logs
```

## 🚨 Variables de Entorno Clave

**Backend (.env)**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/sisplan_db
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:3000/api
```

## 📊 Estructura de Base de Datos

```
┌─────────────┐
│   Users     │
├─────────────┤
│ id (PK)     │
│ email       │
│ password    │
│ name        │
│ role        │ ──────┐
│ costCenterId│       │
└─────────────┘       │
                      │
┌─────────────────┐   │
│  CostCenter     │◄──┘
├─────────────────┤
│ id (PK)         │
│ name            │
│ code (UNIQUE)   │
└─────────────────┘

┌──────────────────┐
│ StrategicPlans   │
├──────────────────┤
│ id (PK)          │
│ name             │
│ startDate        │
│ endDate          │
└──────────────────┘
    │
    ├─────────────────┐
    │                 │
┌─────────────────┐  ┌─────────────────┐
│ Objectives      │  │ Actions         │
├─────────────────┤  ├─────────────────┤
│ id (PK)         │  │ id (PK)         │
│ planId (FK)     │  │ planId (FK)     │
│ name            │  │ name            │
└─────────────────┘  └─────────────────┘
    │                 │
    └──────┬──────────┘
           │
         ┌──────────────┐
         │ Indicators   │
         ├──────────────┤
         │ id (PK)      │
         │ objectiveId  │
         │ actionId     │
         │ value        │
         │ target       │
         └──────────────┘
```

## 🔄 Flujo de Autenticación

1. Usuario se registra/login en frontend
2. Backend valida credenciales
3. JWT se genera y se envía al frontend
4. Frontend guarda token en localStorage
5. Token se envía en header Authorization
6. Middleware valida token en cada request
7. Si token expira, usuario vuelve a login

## 📞 API Endpoints (Primeros)

```
POST   /api/auth/register       # Registrar usuario
POST   /api/auth/login          # Iniciar sesión
GET    /api/auth/profile        # Obtener perfil

GET    /api/plans               # Listar planes (Auth requerida)
POST   /api/plans               # Crear plan (Admin)
GET    /api/plans/:id           # Obtener plan
PUT    /api/plans/:id           # Actualizar plan (Admin)
DELETE /api/plans/:id           # Eliminar plan (Admin)
```

## 🧪 Testing (Próximos)

Se implementará con Jest para backend y Vitest para frontend.

## 🐛 Debugging

### Backend
```bash
# Con debugger de Node
node --inspect-brk dist/index.js

# Logs con morgan
npm run dev
```

### Frontend
- Devtools de React (extension Chrome)
- Red tab en DevTools del navegador

## 📚 Referencias

- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

## ⚠️ Checklist de Antes de Ir a Producción

- [ ] Variables de entorno configuradas (JWT_SECRET fuerte)
- [ ] BD respaldada
- [ ] HTTPS habilitado
- [ ] CORS configurado correctamente
- [ ] Contraseñas hasheadas
- [ ] Rate limiting implementado
- [ ] Validación de entrada en backend
- [ ] Logs centralizados
- [ ] Monitoreo de errores (Sentry, etc)
- [ ] Tests unitarios e integración
- [ ] Documentación API (Swagger/OpenAPI)

## 📝 Notas de Desarrollo

### Reglas de Consistencia
1. **Importaciones:** Usar aliases (@/) definidas en tsconfig
2. **Tipos:** Centralizar en `src/types/index.ts`
3. **Servicios:** Concentrar lógica de negocio, no en componentes
4. **Errores:** Siempre retornar respuestas estructuradas
5. **BD:** Solo Prisma para queries (no SQL directo)
6. **Tokens:** Nunca guardar en localStorage sensibles (revisión futura)

### Próximas Fases
1. ✅ Estructura base (actual)
2. ⏳ Diseño UI según especificaciones
3. ⏳ Componentes de Admin y Operador
4. ⏳ Lógica completa de indicadores
5. ⏳ Reportes (PDF/Excel)
6. ⏳ Testing
7. ⏳ Deployment

---

**Última actualización:** 31 de Marzo, 2026

## 📊 Reportes y Exportación

### **Tipos de Reportes**

1. **Reporte Consolidado Municipal**
   - Todos los centros de costo
   - Indicadores por plan estratégico
   - Gráficos de tendencia
   - Exportación PDF y Excel

2. **Reporte por Centro de Costo**
   - Indicadores específicos del centro
   - Comparación con objetivos
   - Histórico de desempeño
   - Formatos personalizables

3. **Reporte de Indicadores**
   - Detalle por variable
   - Evolución temporal
   - Análisis de cumplimiento
   - Visualizaciones interactivas

### **Tecnologías de Reportes**

- **PDF Generation**: `jsPDF` con diseño profesional
- **Excel Export**: `xlsx` con fórmulas y formatos
- **Charts**: `Recharts` para visualizaciones interactivas
- **Templates**: Diseños consistentes con imagen municipal

## 🚨 Checklist de Producción

### **🔐 Seguridad**
- [ ] JWT_SECRET generado aleatoriamente (mínimo 32 caracteres)
- [ ] Contraseñas base de datos con caracteres especiales
- [ ] HTTPS configurado con certificado válido
- [ ] CORS restringido a dominios municipales
- [ ] Rate limiting activado (100 req/minuto por IP)
- [ ] Headers de seguridad configurados (Helmet.js)

### **🗄️ Base de Datos**
- [ ] PostgreSQL en modo producción (logging desactivado)
- [ ] Backups automáticos configurados (diarios)
- [ ] Conexiones máximas configuradas
- [ ] Índices optimizados para consultas frecuentes
- [ ] Usuario de BD con permisos limitados

### **🖥️ Aplicación**
- [ ] Variables de entorno configuradas correctamente
- [ ] Logs estructurados y rotativos
- [ ] Monitoreo de errores implementado
- [ ] Health checks configurados
- [ ] Compresión GZIP activada

### **🌐 Infraestructura**
- [ ] Firewall configurado para puertos específicos
- [ ] Balanceador de carga (si aplica)
- [ ] CDN para assets estáticos
- [ ] Dominios SSL configurados
- [ ] DNS apuntando correctamente

### **📋 Operacional**
- [ ] Proceso de backup automatizado
- [ ] Plan de recuperación de desastres
- [ ] Documentación de emergencia
- [ ] Contactos de soporte actualizados
- [ ] Capacitación al personal municipal

## 🔄 Mantenimiento y Actualizaciones

### **Actualización del Sistema**

```bash
# 1. Backup actual
npm run backup:full

# 2. Actualizar código
git pull origin main

# 3. Actualizar dependencias
npm update

# 4. Aplicar migraciones
npm run db:migrate

# 5. Reiniciar servicios
npm run deploy:restart
```

### **Monitoreo**

- **Logs**: `/var/log/sisplan/` con rotación diaria
- **Métricas**: CPU, RAM, Disco, Red
- **Alertas**: Email/SMS para eventos críticos
- **Health Checks**: Endpoint `/api/health` cada 5 minutos

## 📞 Soporte y Contacto

### **Documentación Técnica**
- **Arquitectura**: [GUIA_PROYECTO.md](./GUIA_PROYECTO.md)
- **API Endpoints**: [backend/docs/api.md](./backend/docs/api.md)
- **Base de Datos**: [backend/docs/database.md](./backend/docs/database.md)
- **Frontend**: [frontend/docs/components.md](./frontend/docs/components.md)

### **Soporte Municipal**
- **Email**: rweepiof@gmail.com
- **Teléfono**: (+51) 989 500 332
- **Horario**: Lun-Vie 8:00-17:00
- **Emergencias**: 24/7 vía línea directa

### **Comunidad y Contribuciones**
- **Issues**: [GitHub Issues](https://github.com/franz-Rw/Sisplan_PEI)
- **Documentación**: [Wiki del Proyecto](https://github.com/franz-Rw/Sisplan_PEI/wiki)
- **Actualizaciones**: [Releases](https://github.com/franz-Rw/Sisplan_PEI/releases)

---

## 📄 Licencia y Derechos

**SISPLAN FR** Sisplan Fue desarrolado mediante inteeligencia artificial con los agentes Copilot de Vs Code y SWE-1.5 de winsurd en su mayoría por SWE-1.5 con las instrucciones de flujos, trabajo, interfáz, lógica y proceso de Franz Lenin Aleister Ramírez Weepio, servidor público de la Subgerencia de Planeamiento y Desarrollo Institucional culminado el 21-04-2026 Todos los derechos reservados.

Desarrollado con tecnología de código abierto para beneficio de la gestión pública municipal.

---

**Última Actualización**: 21 de Abril, 2026
**Versión**: 1.0.0
**Estado**: Producción - Implementación Municipal 
