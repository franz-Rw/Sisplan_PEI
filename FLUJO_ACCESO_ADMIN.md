# 🔐 Flujo de Acceso - Definición de Requisitos

## Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                    SISPLAN FR - ADMIN                        │
│                                                               │
│  ┌─────────────────┐     ┌─────────────────┐                │
│  │ Primer Ingreso  │     │   Ingreso Diario │                │
│  └────────┬────────┘     └────────┬─────────┘                │
│           │                       │                          │
│           ├─ Email:               ├─ Email:                  │
│           │  admin@sisplan.local │  admin@sisplan.local      │
│           ├─ Password:            ├─ Password:               │
│           │  Password@2026       │  Tu_Contraseña_Segura    │
│           │                       │                          │
│           └────────┬──────────────┴─────────┬────────┘       │
│                    └──────────┬──────────────┘               │
│                               │                              │
│                     ┌─────────▼────────┐                    │
│                     │  mustChangePass? │                    │
│                     └────┬────────┬────┘                    │
│              SI           │        │              NO         │
│          ┌───────────────┘         └───────────────┐        │
│          │                                         │        │
│    ┌─────▼──────┐                            ┌────▼──┐     │
│    │   REDIRECT │                            │ DASHBOARD    │
│    │ Change Pwd │                            └────────┘    │
│    │  Page      │                                          │
│    │            │ (obligatorio)                            │
│    └─────┬──────┘                                          │
│          │                                                  │
│    ┌─────▼──────────────────┐                              │
│    │ Setup Security Question│                              │
│    │ (opcionalmente)        │                              │
│    └─────┬──────────────────┘                              │
│          │                                                  │
│    ┌─────▼──────────────────┐                              │
│    │   READY FOR USE        │                              │
│    └────────────────────────┘                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Caso 1: Olvidé mi contraseña

```
┌──────────────────────────────────────────────────────────────┐
│           FLUJO DE RECUPERACIÓN DE CONTRASEÑA                 │
│                                                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ LoginPage → "¿Olvidaste tu contraseña?" link         │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                       │
│           ┌───────────▼──────────────┐                       │
│           │ POST /auth/recovery/initiate     │                       │
│           │ Body: { email }                  │                       │
│           └───────────┬──────────────┘                       │
│                       │                                       │
│           ┌───────────▼──────────────────────────────────┐   │
│           │ Response: securityQuestion                   │   │
│           │ "¿Cuál es tu animal favorito?"              │   │
│           └───────────┬──────────────────────────────────┘   │
│                       │                                       │
│           ┌───────────▼──────────────────────────────────┐   │
│           │ Usuario responde:                            │   │
│           │ POST /auth/recovery/verify-answer            │   │
│           │ Body: {                                      │   │
│           │   email: "admin@sisplan.local",              │   │
│           │   securityAnswer: "gato"                     │   │
│           │ }                                            │   │
│           └───────────┬──────────────────────────────────┘   │
│                       │                                       │
│             ┌─────────▼────────┐                             │
│             │ ¿Correcta?       │                             │
│             └────┬──────────┬──┘                             │
│            SI    │          │     NO                         │
│          ┌───────▼┐    ┌────▼──────┐                        │
│          │ Genera │    │ Error: try │                        │
│          │ token  │    │  again     │                        │
│          │ 30min  │    └────────────┘                        │
│          └───────┬┘                                          │
│                  │                                           │
│          ┌───────▼────────────────────────────────┐         │
│          │ POST /auth/recovery/reset              │         │
│          │ Body: {                                │         │
│          │   resetToken: "...",                   │         │
│          │   newPassword: "Nueva_Pass_456",       │         │
│          │   confirmPassword: "Nueva_Pass_456"    │         │
│          │ }                                      │         │
│          └───────┬────────────────────────────────┘         │
│                  │                                           │
│          ┌───────▼────────────────────────────────┐         │
│          │ ✅ Contraseña actualizada              │         │
│          │ → Redirige a LoginPage                 │         │
│          │ → Puede ingresar con nueva contraseña  │         │
│          └────────────────────────────────────────┘         │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Caso 2: Cambiar contraseña (autenticado)

```
┌──────────────────────────────────────────────────────────────┐
│        CAMBIAR CONTRASEÑA (Autenticado / Primer Login)       │
│                                                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Dashboard → Menu Admin → Cambiar Contraseña           │   │
│  │            (o Redirige obligatoriamente si es 1er vez) │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                       │
│           ┌───────────▼──────────────┐                       │
│           │ Formulario:              │                       │
│           │ - Contraseña actual:   ● │                       │
│           │ - Nueva contraseña:    ● │                       │
│           │ - Confirmar:           ● │                       │
│           └───────────┬──────────────┘                       │
│                       │                                       │
│           ┌───────────▼──────────────┐                       │
│           │ POST /auth/change-password      │                       │
│           │ Headers: Authorization JWT │                       │
│           │ Body: {                  │                       │
│           │   currentPassword,       │                       │
│           │   newPassword,           │                       │
│           │   confirmPassword        │                       │
│           │ }                        │                       │
│           └───────────┬──────────────┘                       │
│                       │                                       │
│         ┌─────────────┴──────────────┐                       │
│         │ Validaciones:              │                       │
│         │ ✓ Actual correcta          │                       │
│         │ ✓ Nueva == Confirmar       │                       │
│         │ ✓ Min 8 caracteres         │                       │
│         │ ✓ Diferente a actual       │                       │
│         └─────────────┬──────────────┘                       │
│                       │                                       │
│         ┌─────────────▼──────────────┐                       │
│         │ Update DB:                 │                       │
│         │ - password (hash nuevo)    │                       │
│         │ - mustChangePassword=false │                       │
│         │ - lastPasswordChange=NOW   │                       │
│         └─────────────┬──────────────┘                       │
│                       │                                       │
│         ┌─────────────▼──────────────┐                       │
│         │ ✅ Exitoso                │                       │
│         │ → Continuar o redirige     │                       │
│         │ → Si era obligatorio:      │                       │
│         │   Ofrecer setup de         │                       │
│         │   pregunta de seguridad    │                       │
│         └────────────────────────────┘                       │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Caso 3: Configurar Pregunta de Seguridad

```
┌──────────────────────────────────────────────────────────────┐
│          CONFIGURAR PREGUNTA DE SEGURIDAD                     │
│                                                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Dashboard → Settings → Seguridad                      │   │
│  │          O mostrada después del cambio de contraseña  │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                       │
│           ┌───────────▼──────────────┐                       │
│           │ Mostrar preguntas:       │                       │
│           │ • ¿Ciudad natal?         │                       │
│           │ • ¿Mascota favorita?     │                       │
│           │ • ¿Año de nacimiento?    │                       │
│           │ • Personalizada          │                       │
│           └───────────┬──────────────┘                       │
│                       │                                       │
│           ┌───────────▼──────────────┐                       │
│           │ Usuario selecciona y     │                       │
│           │ escribe su respuesta     │                       │
│           └───────────┬──────────────┘                       │
│                       │                                       │
│           ┌───────────▼──────────────┐                       │
│           │ POST /auth/security-question      │                       │
│           │ Headers: Authorization JWT │                       │
│           │ Body: {                  │                       │
│           │   securityQuestion,      │                       │
│           │   securityAnswer         │                       │
│           │ }                        │                       │
│           └───────────┬──────────────┘                       │
│                       │                                       │
│           ┌───────────▼──────────────────────────────────┐   │
│           │ Backend:                                     │   │
│           │ 1. Hash securityAnswer con bcrypt           │   │
│           │ 2. Guardar hasheado en BD (NO recuperable) │   │
│           │ 3. Retorna confirmación                     │   │
│           └───────────┬──────────────────────────────────┘   │
│                       │                                       │
│           ┌───────────▼──────────────┐                       │
│           │ ✅ Guardado exitosamente│                       │
│           │ Pregunta lista para      │                       │
│           │ recuperación             │                       │
│           └────────────────────────────┘                      │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Tabla de Estado de Usuario

| Estado | mustChangePassword | securityQuestion | Acciones Disponibles |
|--------|-------------------|-----------------|----------------------|
| Nuevo (seed) | ✅ TRUE | ❌ vacío | Cambiar contraseña (obligatorio) |
| Cambió contraseña | ❌ FALSE | ❌ vacío | Configurar pregunta (recomendado) |
| Completado | ❌ FALSE | ✅ "¿...?" | Usar normalmente, recuperar con pregunta |
| Olvidó (recuperación) | ❌ FALSE | ✅ verificada | Cambiar con token recovery |

---

## 🔐 Mejoras Futuras

- [ ] Autenticación de 2 factores (OTP por email)
- [ ] Historial de cambios de contraseña
- [ ] Política de expiración de contraseña (cada 90 días)
- [ ] Bloqueo tras intentos fallidos
- [ ] Notificación por email en cambios
- [ ] Logout automático en otra sesión
- [ ] IP whitelist para admin

---

## 📝 Notas de Implementación

1. **Token de Recuperación**: JWT con payload `{ userId, type: 'recovery' }`, válido 30 minutos
2. **Hash de Respuesta**: Bcrypt 10 rounds, igual que contraseña (no reversible)
3. **Auditoría**: Registrar `lastPasswordChange` cada vez que cambia
4. **Seguridad**: Las respuestas de seguridad son case-insensitive
5. **Frontend**: Validar en cliente antes de enviar (UX), validar en servidor también (seguridad)
