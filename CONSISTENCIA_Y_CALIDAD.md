# Reglas de Consistencia y Calidad - SISPLAN FR

## 📋 Objetivo
Garantizar que el proyecto mantenga calidad, escalabilidad y mantenibilidad a medida que crece. Toda modificación debe revisar integralmente archivos, importaciones y referencias cruzadas.

---

## 1️⃣ REGLAS DE IMPORTACIONES

### ✅ CORRECTO - Usar Aliases

```typescript
// Frontend
import { Button, Input } from '@components'
import { authStore } from '@context/auth'
import { api } from '@services/api'
import { User } from '@types'

// Backend
import { authController } from '@controllers/authController'
import { prisma } from '@config/database'
import { hashPassword } from '@utils/auth'
```

### ❌ INCORRECTO

```typescript
// No usar rutas relativas profundas
import Button from '../../../../components/Button'
import api from '../services/api'
```

### Alias Definidos

**Frontend (`tsconfig.json`):**
```json
{
  "@": "src/*",
  "@components": "src/components/*",
  "@pages": "src/pages/*",
  "@layouts": "src/layouts/*",
  "@hooks": "src/hooks/*",
  "@context": "src/context/*",
  "@services": "src/services/*",
  "@utils": "src/utils/*",
  "@types": "src/types/*",
  "@styles": "src/styles/*"
}
```

**Backend (`tsconfig.json`):**
```json
{
  "@": "src/*",
  "@routes": "src/routes/*",
  "@controllers": "src/controllers/*",
  "@services": "src/services/*",
  "@middleware": "src/middleware/*",
  "@models": "src/models/*",
  "@utils": "src/utils/*",
  "@config": "src/config/*"
}
```

---

## 2️⃣ CONVENCIONES DE NAMING

### Archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Componentes React | PascalCase | `Button.tsx`, `LoginForm.tsx` |
| Páginas | PascalCase | `LoginPage.tsx`, `DashboardPage.tsx` |
| Hooks | camelCase con prefijo `use` | `useAuth.ts`, `useFetch.ts` |
| Servicios | camelCase | `api.ts`, `authService.ts` |
| Utilidades | camelCase | `formatDate.ts`, `validators.ts` |
| Tipos/Interfaces | PascalCase | `User.ts`, `AuthContext.ts` |
| Constantes | UPPER_SNAKE_CASE | `API_URL.ts`, `STATUS_CODES.ts` |
| Carpetas | lowercase | `components`, `services` |

### Variables y Funciones

```typescript
// ✅ Componentes React
function UserCard() { }
const UserCard: React.FC = () => { }

// ✅ Funciones normales
function handleUserLogin() { }
const getUserById = (id: string) => { }

// ✅ Constantes
const API_BASE_URL = 'http://localhost:3000'
const MAX_RETRIES = 3

// ✅ Booleanos
const isAuthenticated = true
const hasPermission = false
const shouldValidate = true

// ✅ Arrays
const userList: User[] = []
const itemIds: string[] = []

// ❌ Evitar
var userData         // usar const/let
function get_user()  // usar camelCase
const User = {}      // const para objetos
```

---

## 3️⃣ ESTRUCTURA DE TIPOS

**Centralizar TODOS los tipos en `src/types/index.ts`**

```typescript
// src/types/index.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// Importar desde aquí
import { User, UserRole, AuthContext } from '@types'
```

---

## 4️⃣ SERVICIOS Y LÓGICA DE NEGOCIO

### ✅ CORRECTO - Servicios en carpeta `services`

```typescript
// src/services/authService.ts
import apiClient from './api'
import { User } from '@types'

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  },

  register: async (email: string, password: string, name: string) => {
    const response = await apiClient.post('/auth/register', { email, password, name })
    return response.data
  },
}

// Usar en componente
import { authService } from '@services/authService'

const handleLogin = async () => {
  const result = await authService.login(email, password)
}
```

### ❌ INCORRECTO - Lógica en componentes

```typescript
// ❌ NO HACER ESTO
function LoginComponent() {
  const handleLogin = async () => {
    const response = await axios.post('http://localhost:3000/auth/login', ...)
    localStorage.setItem('token', response.data.token)
    // Más lógica mezcla...
  }
}
```

---

## 5️⃣ ESTRUCTURA DE COMPONENTES

### Patrón Estándar

```typescript
import React from 'react'
import { Card, Button } from '@components'
import { useAuth } from '@hooks/useAuth'
import styles from './MyComponent.module.css'

interface Props {
  title: string
  onSubmit?: (data: FormData) => void
  disabled?: boolean
}

/**
 * MyComponent - Descripción breve del componente
 * 
 * @example
 * <MyComponent title="Ejemplo" onSubmit={handleSubmit} />
 */
export default function MyComponent({ title, onSubmit, disabled = false }: Props) {
  const { user } = useAuth()

  const handleClick = () => {
    onSubmit?.({ /* data */ })
  }

  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={handleClick} disabled={disabled}>
        Guardar
      </Button>
    </Card>
  )
}
```

### Reglas Importantes

1. **Props tipadas:** Siempre definir interfaz `Props`
2. **Destructuring:** Destructurar props en parámetros
3. **Valores por defecto:** Usar en parámetros, no en JSX
4. **Eventos:** Prefijo `handle` para manejadores (`handleSubmit`)
5. **Funciones internas:** Definir dentro del componente
6. **Comentarios JSDoc:** Para componentes complejos

---

## 6️⃣ BACKEND - ESTRUCTURA DE RUTAS

### Patrón Controllers → Services → Prisma

```typescript
// routes/strategicPlans.ts
import { Router } from 'express'
import { strategicPlanController } from '@controllers/strategicPlanController'
import { authenticate, authorize } from '@middleware/auth'

const router = Router()

router.use(authenticate) // SIEMPRE al inicio

router.post('/', authorize(['ADMIN']), strategicPlanController.create)
router.get('/', strategicPlanController.getAll)

export default router
```

```typescript
// controllers/strategicPlanController.ts
import { prisma } from '@config/database'

export const strategicPlanController = {
  create: async (req, res) => {
    try {
      // Validar entrada
      if (!req.body.name) {
        return res.status(400).json({ error: 'Name required' })
      }

      // Llamar servicio (o Prisma directamente si es simple)
      const plan = await prisma.strategicPlan.create({
        data: req.body,
      })

      // Responder
      res.status(201).json(plan)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  },
}
```

---

## 7️⃣ MANEJO DE ERRORES

### Frontend

```typescript
// ✅ CORRECTO con try-catch
import { Alert } from '@components'

const handleSubmit = async () => {
  try {
    const result = await authService.login(email, password)
    setAlert({ type: 'success', message: 'Login exitoso' })
  } catch (error) {
    setAlert({ 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}

// Mostrar, en JSX:
{alert && <Alert type={alert.type} message={alert.message} />}
```

### Backend

```typescript
// ✅ CORRECTO - Respuestas estructuradas
export const authController = {
  login: async (req: Request, res: Response) => {
    try { 
      if (!req.body.email) {
        return res.status(400).json({ 
          error: 'Email requerido',
          code: 'VALIDATION_ERROR'
        })
      }
      // ... resto del código
    } catch (error) {
      console.error('Error en login:', error)
      return res.status(500).json({ 
        error: 'Error en servidor',
        code: 'INTERNAL_ERROR'
      })
    }
  }
}
```

---

## 8️⃣ VALIDACIONES

### Frontend - Esquemas yup/zod (próxima fase)

```typescript
import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
})
```

### Backend - Validación entrada

```typescript
export const validateUser = (data: any) => {
  const errors: Record<string, string> = {}

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email inválido'
  }

  if (!data.password || data.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres'
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}
```

---

## 9️⃣ DEPENDENCIAS Y VERSIONADO

### package.json - Estrategia de versiones

```json
{
  "dependencies": {
    "react": "^18.2.0",           // Permite minor y patch
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "typescript": "^5.3.2",
    "@types/react": "^18.2.37"
  }
}
```

**Regla:** Usar `^` (caret) para librerías estables, `~` (tilde) solo si es necesario.

---

## 🔟 LINTING Y FORMATO

### ESLint - Ejecutar antes de commit

```bash
npm run lint    # Validar
npm run format  # Arreglar automáticamente
```

**Configuración compartida:** `.eslintrc.cjs` establecida en ambas carpetas.

---

## 1️⃣1️⃣ BASE DE DATOS - PRISMA

### ✅ CORRECTO

```typescript
// Usar Prisma Client
import { prisma } from '@config/database'

const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { costCenter: true },
})
```

### ❌ INCORRECTO

```typescript
// NO hacer queries SQL directas
const user = await client.query(`SELECT * FROM users WHERE id = '${userId}'`)

// NO olvidar las relaciones necesarias
const user = await prisma.user.findUnique({ where: { id: userId } })
// Si luego usas user.costCenter, el flujo falla
```

### Reglas Prisma

1. **Schema único:** `prisma/schema.prisma` es fuente de verdad
2. **Tipos auto-generados:** `@prisma/client` tipifica automáticamente
3. **Migrations:** Crear con `prisma migrate dev --name <descripcion>`
4. **Include/Select:** Especificar relaciones necesarias
5. **Timestamps:** Usar `@default(now())` y `@updatedAt`

---

## 1️⃣2️⃣ CHECKLIST PRE-COMMIT

Antes de hacer commit, verificar:

- [ ] **Imports:** Todos usan aliases `@/`
- [ ] **Tipos:** Centralizados en `types/index.ts`
- [ ] **Naming:** Sigue convenciones (PascalCase, camelCase)
- [ ] **Linting:** `npm run lint` pasa sin errores
- [ ] **Formato:** `npm run format` ejecutado
- [ ] **No console.log:** Excepto en desarrollo (comentado más tarde)
- [ ] **No any:** Usar tipos específicos o `unknown`
- [ ] **BD:** Si cambia schema, migración fue creada
- [ ] **Componentes:** Tienen Props tipadas
- [ ] **Servicios:** Lógica no está en componentes
- [ ] **Referencias cruzadas:** Buscadas y validadas (grep por nombres)

---

## 1️⃣3️⃣ AUDITORÍA INTEGRAL

**Comandos para validar todo el proyecto:**

```bash
# Frontend
cd frontend
npm run lint
npm install --save-dev depcheck
npx depcheck  # Encontrar deps no usadas

# Backend
cd backend
npm run lint
npm run build  # TypeScript debe compilar sin errores
npx prisma validate  # Validar schema

# Ambas carpetas
grep -r "import.*from '\.\..*'" src  # Evitar imports relat

ivos
grep -r "console\.log" src            # Encontrar logs
grep -r "any" src                     # Encontrar "any" types
```

---

## 1️⃣4️⃣ CHECKLIST DE PROYECTO COMPLETO

```
SISPLAN_PEI/
├── ✅ Estructura de carpetas (frontend/backend)
├── ✅ Archivos de configuración:
│   ├── ✅ tsconfig.json (ambos)
│   ├── ✅ .eslintrc.cjs (ambos)
│   ├── ✅ .prettierrc.json (ambos)
│   ├── ✅ vite.config.ts (frontend)
│   ├── ✅ tailwind.config.js (frontend)
│   ├── ✅ .env.example (backend)
│   └── ✅ prisma/schema.prisma (backend)
├── ✅ Componentes base (Button, Input, Card, etc)
├── ✅ Servicios API configurados
├── ✅ Tipado completo (TypeScript strict)
├── ✅ Middleware de autenticación
├── ✅ Ruta de login (frontend y backend)
├── ✅ Documentación (README, ARCHITECTURE)
├── ✅ Docker support (docker-compose, Dockerfile)
└── ✅ Git configurado (.gitignore)
```

---

## 1️⃣5️⃣ PROBLEMAS COMUNES Y SOLUCIONES

| Problema | Solución |
|----------|----------|
| Import error con alias | Verificar `tsconfig.json` path exactamente como está |
| Componente no renderiza | Revisar Props, verificar tipos, console en dev |
| BD connection falla | Verificar `DATABASE_URL` en `.env`, PostgreSQL corriendo |
| CORS error | Revisar `CORS_ORIGIN` en backend y frontend proxy |
| Token inválido | Apagar/encender (localStorage nuevo), verificar JWT_SECRET |
| TypeScript error | `npm run build` para ver errores reales |
| ESLint error | `npm run format` antes de lint |

---

## 📞 REFERENCIAS

- **Frontend Setup:** `frontend/ARCHITECTURE.md`
- **Backend Setup:** `backend/ARCHITECTURE.md`
- **Full Guide:** `README.md`
- **Project Overview:** `GUIA_PROYECTO.md`

---

**Última actualización:** 31 de Marzo, 2026  
**Versión:** 1.0  
**Aplicable a todos los cambios del proyecto**
