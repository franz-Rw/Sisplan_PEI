# Backend Architecture Guide

## Flujo de Requests

```
Request → Middleware (auth, cors) → Route → Controller → Service → Prisma → Response
```

## Estructura por Capas

### Routes (`src/routes/`)
- Define endpoints
- Aplica middlewares de validación
- NO contiene lógica de negocio

### Controllers (`src/controllers/`)
- Recibe request
- Valida entrada
- Llama servicios
- Formatea respuesta

### Services (`src/services/`)
- Lógica de negocio
- Interacciones con BD
- Cálculos complejos

### Middleware (`src/middleware/`)
- **auth.ts:** JWT validation
- **errorHandler.ts:** Error handling global
- **validation.ts:** Validación de entrada (próximo)

### Models (`src/models/`)
- Interfaces/Tipos de datos
- DTO (Data Transfer Objects)
- Validación de esquemas

## Autenticación

```
1. POST /auth/login → genera JWT
2. Client envía Authorization: Bearer <token>
3. Middleware descodifica y valida
4. req.userId y req.role disponibles en controller
5. Middleware authorize() valida roles
```

## Manejo de Errores

```ts
// ✅ Correcto
if (!user) {
  return res.status(404).json({ error: 'Usuario no encontrado' })
}

// ✅ Con errorHandler
throw new AppError('Mensaje', 400)

// ❌ Evitar
try {
  // ...
} catch (err) {
  res.send('error')  // Inconsistente
}
```

## Database

- **Prisma Client:** Único acceso a BD
- **Schema:** Única fuente de verdad (`schema.prisma`)
- **Migrations:** Controlar cambios de schema
- **Relaciones:** Definidas en schema, no en código

## Testing (Próximo)

```ts
// Estructura Jest
describe('AuthController', () => {
  it('debería loguear usuario válido', () => {
    // Arrange, Act, Assert
  })
})
```

## Deployment

```bash
# Build
npm run build

# Ejecutar
NODE_ENV=production npm start

# Con PM2
pm2 start dist/index.js --name "sisplan-api"
```
