# 🔐 Guía de Usuario y Contraseña - Administrador SISPLAN

## 📌 Resumen

El sistema SISPLAN tiene un flujo seguro para el administrador con:
1. **Primer ingreso**: Contraseña temporal predefinida
2. **Configuración obligatoria**: Cambio de contraseña después del primer login
3. **Recuperación segura**: Mediante preguntas de seguridad

---

## 🚀 Primer Ingreso

### Credenciales Iniciales (después de ejecutar seed)

```plaintext
Email:     admin@sisplan.local
Contraseña: Password@2026
```

### Pasos:

1. **Ejecutar seed** para crear el usuario admin:
   ```bash
   cd d:\Sisplan_PEI\backend
   npm run db:seed
   ```

2. **Ingresa a la aplicación** con las credenciales anteriores

3. **Sistema detecta** `mustChangePassword = true`

4. **Redirige a** **Cambiar Contraseña**:
   ```
   POST /auth/change-password
   Body: {
     "currentPassword": "Password@2026",
     "newPassword": "Tu_Contraseña_Segura_123",
     "confirmPassword": "Tu_Contraseña_Segura_123"
   }
   ```

---

## 🔑 Configurar Pregunta de Seguridad

**Importante**: Se realiza después del cambio de contraseña obligatorio.

### Endpoint:
```
POST /auth/security-question
Body: {
  "securityQuestion": "¿Cuál es tu animal favorito?",
  "securityAnswer": "gato"
}
```

### Ejemplos de preguntas sugeridas:
- ¿Cuál es tu ciudad natal?
- ¿Nombre de tu mascota favorita?
- ¿Qué empresa te ha marcado más en tu carrera?
- ¿Cuál es el año de tu nacimiento?

**⚠️ NOTA**: La respuesta se guarda hasheada por seguridad. NO es reversible, solo se puede verificar.

---

## 🆘 Olvide Mi Contraseña

### Flujo de Recuperación

1. **En LoginPage**, click en "¿Olvidaste tu contraseña?"

2. **Ingresa tu email**:
   ```
   POST /auth/recovery/initiate
   Body: { "email": "admin@sisplan.local" }
   ```
   → Retorna la pregunta de seguridad

3. **Responde la pregunta**:
   ```
   POST /auth/recovery/verify-answer
   Body: { 
     "email": "admin@sisplan.local",
     "securityAnswer": "gato"
   }
   ```
   → Retorna un token temporal (válido 30 minutos)

4. **Cambia tu contraseña** con el token recibido (endpoint a implementar):
   ```
   POST /auth/recovery/reset
   Body: {
     "resetToken": "<token>",
     "newPassword": "Nueva_Contraseña_456",
     "confirmPassword": "Nueva_Contraseña_456"
   }
   ```

---

## 📋 Base de Datos - Campos Nuevos

En la tabla `users` se agregaron estos campos para el administrador:

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `mustChangePassword` | Boolean | Obliga cambio de contraseña en primer login |
| `lastPasswordChange` | DateTime | Auditoría: última vez que cambió contraseña |
| `securityQuestion` | String | Pregunta de seguridad para recuperación |
| `securityAnswer` | String | Respuesta hasheada (no es texto plano) |

---

## 🛡️ Requisitos de Contraseña

- ✅ Mínimo 8 caracteres
- ✅ Se recomienda: mayúsculas, minúsculas, números, símbolos
- ✅ Almacenada con hash bcrypt (10 rounds)

---

## 📝 Migración de Base de Datos

Ejecutar después de actualizar `schema.prisma`:

```bash
cd d:\Sisplan_PEI\backend

# Opción 1: Directa (ADVERTENCIA: borra datos)
npm run db:push

# Opción 2: Con migración (recomendado en producción)
npm run db:migrate
```

---

## 🔄 Endpoints Disponibles

| Método | Ruta | Autenticado | Propósito |
|--------|------|-------------|-----------|
| POST | `/auth/register` | ❌ | Registrar nuevo usuario |
| POST | `/auth/login` | ❌ | Login (genera JWT) |
| GET | `/auth/profile` | ✅ | Obtener datos del usuario |
| POST | `/auth/change-password` | ✅ | Cambiar contraseña (con actual) |
| POST | `/auth/recovery/initiate` | ❌ | Iniciar recuperación |
| POST | `/auth/recovery/verify-answer` | ❌ | Verificar pregunta de seguridad |
| POST | `/auth/recovery/reset` | ❌ | Reset de contraseña con token |
| POST | `/auth/security-question` | ✅ | Configurar pregunta (admin) |

---

## ⚙️ Variables de Entorno (.env)

Asegúrate que estén configuradas:

```plaintext
DATABASE_URL=postgresql://user:pass@localhost:5432/sisplan_db
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRE=7d
NODE_ENV=development
```

---

## 📌 Checklist de Setup

- [ ] Base de datos PostgreSQL creada
- [ ] Variable de entorno DATABASE_URL configurada
- [ ] `npm run db:push` o `npm run db:migrate` ejecutado
- [ ] `npm run db:seed` ejecutado (crea admin)
- [ ] Backend iniciado: `npm run dev`
- [ ] Admin ingresa con Password@2026
- [ ] Cambia contraseña obligatoriamente
- [ ] Configura pregunta de seguridad
- [ ] Guarda credenciales en lugar seguro (gestor de contraseñas)

---

## 🚨 Recuperación de Emergencia

Si el administrador pierde acceso y no recuerda la pregunta de seguridad:

**Opción 1**: El DBA reinstancia la BD y ejecuta `npm run db:seed`

**Opción 2**: Resetear manualmente el usuario en la BD:
```sql
UPDATE users 
SET password = '<hash_bcrypt>', 
    mustChangePassword = true,
    securityQuestion = '',
    securityAnswer = ''
WHERE email = 'admin@sisplan.local';
```

**Opción 3** (Recomendado): Implementar endpoint de admin reset con autenticación especial

---

## 📞 Soporte

Para dudas o problemas en la recuperación de contraseña, contactar al equipo de desarrollo.
