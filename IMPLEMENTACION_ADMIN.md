# ✅ Checklist de Implementación - Acceso Admin

## Backend (Node.js + Express + TypeScript)

### ✅ Completado:

#### Base de Datos
- [x] Campo `mustChangePassword: Boolean` en modelo User
- [x] Campo `lastPasswordChange: DateTime?` en modelo User
- [x] Campo `securityQuestion: String` en modelo User
- [x] Campo `securityAnswer: String` en modelo User
- [x] Script seed que crea admin: `admin@sisplan.local / Password@2026`

#### Controllers
- [x] `passwordRecoveryController.ts` con funciones:
  - [x] `initiateRecovery()` - POST para solicitar recuperación
  - [x] `verifySecurityAnswer()` - POST para verificar pregunta
  - [x] `resetPassword()` - POST para cambiar con token
  - [x] `changePassword()` - POST para cambiar (autenticado)
  - [x] `setSecurityQuestion()` - POST para configurar pregunta

#### Utilidades
- [x] `generateRecoveryToken()` - JWT con expiry 30min
- [x] `verifyRecoveryToken()` - Verifica token de recuperación

#### Rutas
- [x] POST `/auth/change-password` (autenticado)
- [x] POST `/auth/recovery/initiate` (público)
- [x] POST `/auth/recovery/verify-answer` (público)
- [x] POST `/auth/recovery/reset` (público)
- [x] POST `/auth/security-question` (autenticado, admin)

---

## Frontend (React + Vite + TypeScript)

### ✅ Completado:
- [x] LoginPage actualizada con link "¿Olvidaste tu contraseña?"

### ⏳ Falta Implementar:

Este es un componente en 2 fases:

#### **Fase 1 - Primer Login (Obligatorio)**
- [ ] Componente `ChangePasswordPage.tsx`
  - [ ] Inputs: contraseña actual, nueva, confirmar
  - [ ] Validaciones locales
  - [ ] POST a `/auth/change-password`
  - [ ] Manejo de errores
  - [ ] Redirect a dashboard o setup de pregunta

- [ ] Componente `SetupSecurityPage.tsx`
  - [ ] Selector de pregunta predefinidas
  - [ ] Campo de respuesta (libre)
  - [ ] POST a `/auth/security-question`
  - [ ] Opción "Omitir por ahora"
  - [ ] Confirmación de guardado

#### **Fase 2 - Recuperación (Cuando olvida)**
- [ ] Componente `RecoveryPage.tsx`
  - [ ] Paso 1: Ingresa email
  - [ ] POST a `/auth/recovery/initiate`
  - [ ] Recibe pregunta de seguridad
  - [ ] Paso 2: Responde pregunta
  - [ ] POST a `/auth/recovery/verify-answer`
  - [ ] Recibe token temporal
  - [ ] Paso 3: Nueva contraseña
  - [ ] POST a `/auth/recovery/reset`
  - [ ] Confirmación y redirige a login

---

## Base de Datos

### Comandos para Ejecutar:

```bash
# 1. Aplicar esquema actualizado
cd d:\Sisplan_PEI\backend
npm run db:push

# 2. Crear usuario admin automáticamente
npm run db:seed

# Verificar en BD:
# SELECT * FROM users WHERE email = 'admin@sisplan.local';
```

---

## Testing Manual

### ✅ Primer Ingreso (Ready to Test)

```bash
# 1. Inicia backend
cd backend && npm run dev

# 2. Inicia frontend (otra terminal)  
cd frontend && npm run dev

# 3. Accede a http://localhost:5173
# 4. Login con:
#    - Email: admin@sisplan.local
#    - Pass: Password@2026

# 5. Sistema debe:
#    [ ] Detectar mustChangePassword = true
#    [ ] Redirigir a ChangePasswordPage
#    [ ] Forzar cambio de contraseña

# 6. Después de cambiar:
#    [ ] Oferecer SetupSecurityPage (recomendado)
```

### ⏳ Recuperación (Faltan componentes frontend)

```bash
# No es testeable hasta que exista RecoveryPage.tsx
# Pero endpoints backend están listos:

# Simulación con curl/Postman:

# 1. Iniciar recuperación
POST http://localhost:3000/auth/recovery/initiate
Body: { "email": "admin@sisplan.local" }

# 2. Responder pregunta (si ya está configurada)
POST http://localhost:3000/auth/recovery/verify-answer
Body: { 
  "email": "admin@sisplan.local",
  "securityAnswer": "mi_respuesta" 
}

# 3. Reset con token
POST http://localhost:3000/auth/recovery/reset
Body: {
  "resetToken": "jwt_token_aqui",
  "newPassword": "Nueva@Pass123",
  "confirmPassword": "Nueva@Pass123"
}
```

---

## 📋 Próximas Tareas - Por Orden

### Inmediato (Hoy)
1. [ ] `npm run db:push` para migrar tabla
2. [ ] `npm run db:seed` para crear admin
3. [ ] Testear login básico con Password@2026

### Corto Plazo (Esta semana)
4. [ ] Crear `ChangePasswordPage.tsx`
5. [ ] Integrar POST `/auth/change-password`
6. [ ] Testear cambio de contraseña obligatorio en primer login

### Mediano Plazo (Próxima semana)
7. [ ] Crear `SetupSecurityPage.tsx`
8. [ ] Integrar POST `/auth/security-question`
9. [ ] Testear configuración de pregunta

### Largo Plazo (Fase 2)
10. [ ] Crear `RecoveryPage.tsx` (multi-paso)
11. [ ] Integrar flujo completo de recuperación
12. [ ] Testing exhaustivo de recuperación

---

## 🐛 Conocidos Issues (A Resolver)

- [ ] Endpoint `/auth/recovery/reset` necesita validar token JWT (agregar lógica)
- [ ] Token de recuperación debe ser más seguro (considerar usar código OTP)
- [ ] Falta validaciones de contraseña fuerte (políticas)
- [ ] Falta notificaciones de email (solo esquema backend)
- [ ] Falta auditoría LOG de cambios de contraseña

---

## 📚 Archivos Modificados/Creados

| Archivo | Tipo | Cambios |
|---------|------|---------|
| `prisma/schema.prisma` | Modificado | +4 campos en modelo User |
| `prisma/seed.ts` | Creado | Script de seed para admin |
| `backend/src/controllers/passwordRecoveryController.ts` | Creado | 5 funciones de recuperación |
| `backend/src/utils/auth.ts` | Modificado | +2 funciones de token |
| `backend/src/routes/auth.ts` | Modificado | +6 rutas nuevas |
| `backend/package.json` | Modificado | +1 script `db:seed` |
| `frontend/src/pages/LoginPage.tsx` | Modificado | + link de recuperación UI |
| `GUIA_ADMIN_ACCESO.md` | Creado | Documentación para admin |
| `FLUJO_ACCESO_ADMIN.md` | Creado | Diagramas y flujos |
| `IMPLEMENTACION_ADMIN.md` | **Este archivo** | Checklist |

---

## 🚀 Cómo Ejecutar el Setup

```bash
# 1. Posicionarse en backend
cd d:\Sisplan_PEI\backend

# 2. Instalar dependencias (si no están)
npm install --legacy-peer-deps

# 3. Migrar BD
npm run db:push

# 4. Ejecutar seed
npm run db:seed

# 5. Verificar que se creó el usuario
# Conectarse a PostgreSQL y revisar tabla users

# 6. Iniciar backend
npm run dev

# 7. En otra terminal, iniciar frontend
cd d:\Sisplan_PEI\frontend
npm run dev

# 8. Acceder a http://localhost:5173
# Probar con admin@sisplan.local / Password@2026
```

---

## 💡 Notas Importantes

1. **Contraseña Temporal**: Cambiar en PRIMER LOGIN es obligatorio
2. **Pregunta de Seguridad**: Se guarda hasheada (NO recuperable, solo verificable)
3. **Token de Recuperación**: Válido solo 30 minutos
4. **Cada Cambio**: Actualiza `lastPasswordChange` para auditoría
5. **Base de Datos**: Los campos nuevos son requeridos (NOT NULL con defaults)

---

## 📞 Próximas Preguntas

- ¿Quieres implementar los componentes frontend ahora o según los necesites?
- ¿Requieres autenticación de 2 factores (OTP)?
- ¿Politica de expiración de contraseña (p.ej. cada 90 días)?
- ¿Bloqueo de cuenta tras N intentos fallidos?
