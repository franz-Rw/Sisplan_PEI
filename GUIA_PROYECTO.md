# SISPLAN FR - Proyecto Full Stack

## Descripción General

**SISPLAN FR** es una aplicación web full stack para la gestión integral de indicadores de planes estratégicos. El sistema está diseñado con una arquitectura moderna y escalable, con separación clara entre roles de usuario (Administrador y Operador).

## 🎯 Características Clave

### Para Administrador
- 📊 Gestionar planes estratégicos
- 🏢 Administrar centros de costos
- 👥 Gestionar usuarios por centro
- 📋 Definir objetivos y acciones estratégicas
- 📈 Configurar variables de seguimiento
- ⚙️ Configurar plazos para operadores
- 📑 Generar reportes consolidados (PDF/Excel)

### Para Operador
- 🎯 Ver planes asignados
- 📊 Registrar indicadores de objetivos
- 📈 Registrar indicadores de acciones
- 📑 Exportar reportes personalizados

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         SISPLAN FR PLATFORM             │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────┐  ┌──────────────┐  │
│  │  FRONTEND      │  │   BACKEND    │  │
│  │  React+TS      │◄─┤ Node+Express │  │
│  │  Tailwind      │  │ PostgreSQL   │  │
│  │  Vite          │  │ Prisma ORM   │  │
│  └────────────────┘  └──────────────┘  │
│                                         │
│  LOGIN (ADMIN vs OPERATOR)              │
│  ↓                                      │
│  ROLE-BASED NAVIGATION                  │
│  ├─ Admin: Sidebar completo            │
│  └─ Operator: Sidebar limitado         │
│                                         │
└─────────────────────────────────────────┘
```

## 📊 Diseño de Base de Datos

El proyecto utiliza **PostgreSQL** con **Prisma ORM** para máxima seguridad de tipos.

**Entidades Principales:**
- `User`: Usuarios del sistema con roles
- `CostCenter`: Centros de costos
- `StrategicPlan`: Planes estratégicos
- `StrategicObjective`: Objetivos de planes
- `StrategicAction`: Acciones estratégicas
- `Variable`: Variables de seguimiento
- `Indicator`: Indicadores de desempeño

## 🎨 Diseño UI/UX

- **Paleta de Colores:** Primario #0073A9 + Neutros
- **Tipografía:** Inter / Segoe UI con jerarquía clara
- **Componentes:** Google Material Icons
- **Principios:** Minimalista, intuitivo, accesible (WCAG AA)
- **Sidebar:** Navegación principal por rol

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ Contraseñas hasheadas con bcrypt
- ✅ CORS configurado
- ✅ Helmet para headers de seguridad
- ✅ Validación de entrada
- ✅ Middleware de error manejo

## 📦 Stack Técnico Elegido

| Aspecto | Tecnología | Razón |
|--------|-----------|-------|
| Frontend JS | React 18 | Ecosistema maduro, comunidad grande |
| Frontend Bundler | Vite | Rápido, moderno, mejor DX |
| Frontend Estilos | Tailwind CSS | Escalable, mantenible, accesible |
| Backend Runtime | Node.js | JavaScript full-stack |
| Backend Framework | Express | Sencillo, flexible, bien mantenido |
| Lenguaje | TypeScript | Type-safety, mejor mantenibilidad |
| Base de Datos | PostgreSQL | Robusta, confiable, escalable |
| ORM | Prisma | Type-safe, migrations automáticas |
| Autenticación | JWT | Stateless, escalable |
| Contraseñas | Bcrypt | Estándar de facto |

## 🚀 Primeros Pasos

```bash
# 1. Clonar y navegar
git clone <repo>
cd Sisplan_PEI

# 2. Backend
cd backend
cp .env.example .env
# Editar .env con credenciales BD
npm install
npx prisma db push
npm run dev

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev

# 4. Acceder
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

## 📋 Fases de Desarrollo

### ✅ Fase 1: Estructura Base (COMPLETADA)
- ✅ Setup inicial frontend (Vite + React + TypeScript)
- ✅ Setup inicial backend (Express + TypeScript)
- ✅ Configuración Prisma + PostgreSQL
- ✅ Autenticación JWT base
- ✅ Arquitectura de carpetas
- ✅ Configuración de estilos (Tailwind)

### ⏳ Fase 2: Componentes UI (PRÓXIMA)
- Componentes reutilizables (Button, Card, Input, etc)
- Layout Admin (sidebar + main area)
- Layout Operador (sidebar + main area)
- Página de Login con validaciones

### ⏳ Fase 3: Lógica Backend
- API completa de Planes Estratégicos
- API de Centros de Costos
- API de Objetivos y Acciones
- API de Indicadores
- Controladores para configuración

### ⏳ Fase 4: Integraciones Frontend
- Conectar login a API
- Listar planes por rol
- Crear/editar planes (Admin)
- Registrar indicadores (Operador)

### ⏳ Fase 5: Reportes
- Generación de PDF
- Exportación Excel
- Gráficos (Chart.js o similar)

### ⏳ Fase 6: Testing & Deploy
- Tests unitarios (Jest)
- Tests E2E (Cypress/Playwright)
- Docker compose
- CI/CD pipeline

## 🧠 Principios de Consistencia

**Todo el código debe cumplir:**

1. **Importaciones:** Usar aliases definidos en `tsconfig.json` (`@/`)
2. **Tipos:** Centralizados en `src/types/index.ts`
3. **Naming:** 
   - Componentes: PascalCase
   - Funciones: camelCase
   - Constantes: UPPER_SNAKE_CASE
4. **Servicios:** Toda lógica de negocio, no en componentes
5. **BD:** Solo Prisma para queries, no SQL directo
6. **Errores:** Respuestas estructuradas siempre
7. **Linting:** ESLint obligatorio antes de commit

## 📚 Documentación

- [Frontend Architecture](./frontend/ARCHITECTURE.md)
- [Backend Architecture](./backend/ARCHITECTURE.md)
- [README Detallado](./README.md)

## 🔧 Comandos Recurrentes

```bash
# Dev
npm run dev              # Frontend o Backend (según carpeta)

# Calidad de Código
npm run lint            # Validar con ESLint
npm run format          # Formatear con Prettier

# Base de Datos (solo backend)
npx prisma db push      # Sync con BD
npx prisma migrate dev  # Nueva migración
npx prisma studio      # Visual BD explorer

# Build
npm run build           # TypeScript → JavaScript

# Producción
NODE_ENV=production npm start   # Backend
npm run preview                # Frontend
```

## ⚠️ Importantes

- **JWT_SECRET:** Cambiar en producción (variable `.env`)
- **CORS_ORIGIN:** Configurar según dominio en prod
- **Contraseñas:** Nunca commitear `.env` (usar `.env.example`)
- **node_modules:** Ignorado por `.gitignore`
- **Estilos:** Solo Tailwind + CSS custom (no otras librerías de CSS)

## 📞 Contacto / Soporte

Para dudas sobre arquitectura o configuración, revisar:
- README.md (general)
- ARCHITECTURE.md en cada carpeta (específico)
- Código comentado en rutas críticas

---

**Proyecto creado:** 31 de Marzo, 2026  
**Stack:** React + Node.js + PostgreSQL + TypeScript  
**Estado:** En desarrollo - Fase 1 completada ✅
