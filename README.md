# SISPLAN FR - Gestión de Indicadores de Planes Estratégicos

Aplicación web full stack para la gestión integral de indicadores de planes estratégicos con roles de Administrador y Operador.

## 📋 Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- Tailwind CSS (styling)
- React Router v6 (routing)
- Axios (HTTP client)

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (base de datos)
- Prisma ORM (type-safe database)
- JWT (autenticación)
- Bcrypt (contraseñas)

## 🚀 Configuración Rápida

### Prerequisites
- Node.js 18+ y npm
- PostgreSQL 14+
- Git

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd Sisplan_PEI

# 2. Configurar Backend
cd backend
cp .env.example .env
# Editar .env con tus credenciales de BD
npm install
npx prisma db push
npm run dev

# 3. Configurar Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

### Acceso
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **API Health:** http://localhost:3000/health

## 📁 Estructura del Proyecto

```
Sisplan_PEI/
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas por rol
│   │   ├── layouts/         # Layouts (Admin, Operador)
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # React Context
│   │   ├── services/        # APIs y servicios
│   │   ├── utils/           # Funciones utilitarias
│   │   ├── types/           # TypeScript types
│   │   ├── styles/          # Estilos globales
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .eslintrc.cjs
│
├── backend/
│   ├── src/
│   │   ├── routes/          # Rutas API
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── services/        # Servicios(BD, etc)
│   │   ├── middleware/      # Middlewares (auth, error)
│   │   ├── models/          # Modelos de datos
│   │   ├── utils/           # Funciones utilitarias
│   │   ├── config/          # Configuración
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Definición de BD
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .eslintrc.cjs
│
├── docker-compose.yml       # Orquestación de contenedores
├── README.md
└── .gitignore
```

## 🔐 Roles y Permisos

### Administrador
- ✅ Gestionar planes estratégicos
- ✅ Gestionar centros de costos
- ✅ Gestionar usuarios
- ✅ Configurar plazos para operadores
- ✅ Ver todos los reportes

### Operador
- ✅ Ver planes asignados
- ✅ Registrar indicadores
- ✅ Exportar reportes (PDF/Excel)
- ❌ Crear planes (solo lectura)
- ❌ Gestionar usuarios

## 📋 Convenciones de Código

### Naming
- **Componentes:** PascalCase (`UserCard.tsx`)
- **Funciones:** camelCase (`handleSubmit()`)
- **Constantes:** UPPER_SNAKE_CASE (`API_URL`)
- **Tipos:** PascalCase con sufijo (`UserDTO`, `AuthContext`)

### Estructura de Carpetas
- Agrupar por funcionalidad, no por tipo de archivo
- Crear carpetas solo cuando hay 3+ archivos relacionados
- Usar index.ts/tsx para exports

### Calidad de Código
- ESLint obligatorio
- Prettier para formateo
- TypeScript strict mode
- Sin `any` (usar `unknown` + validación)
- Documentar funciones complejas

## 🔧 Scripts Útiles

### Frontend
```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Build para producción
npm run lint     # Validar código
npm run format   # Formatear código
```

### Backend
```bash
npm run dev              # Desarrollo
npm run build           # Compilar TypeScript
npm run lint            # Validar código
npm run db:push         # Sincronizar BD
npm run db:migrate      # Crear migración
npm run db:studio       # Ver BD en Prisma Studio
```

## 🗄️ Base de Datos

### Configuración PostgreSQL

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
