# Solución de CORS

## Diagnóstico

Antes, el proyecto tenía más riesgo de errores CORS porque:

- el frontend podía compilarse con URLs absolutas equivocadas
- el proxy de Vite estaba apuntando a una IP fija
- la documentación asumía varios escenarios a la vez

## Situación actual

La configuración corregida funciona así:

### Desarrollo

- frontend usa `/api`
- Vite reenvía `/api` al backend
- archivo clave: `frontend/vite.config.ts`

### Producción recomendada

- el backend sirve el frontend compilado
- el navegador usa el mismo origen para HTML y API
- el frontend sigue llamando a `/api`

Resultado:

- en el esquema recomendado de producción, CORS casi deja de ser problema porque todo sale del mismo origen

## Cuándo puede aparecer CORS

Todavía puede aparecer si:

- publicas frontend y backend en puertos distintos
- accedes al frontend por una IP y al backend por otra
- usas IIS o un proxy con host distinto sin ajustar `CORS_ORIGIN`

## Configuración sugerida

En `backend/.env.production`:

```env
CORS_ORIGIN=http://192.168.2.7:3000,http://localhost:3000
```

## Recomendación práctica

Para evitar problemas:

1. no compiles el frontend con una IP fija del backend
2. usa `VITE_API_URL=/api` en producción
3. sirve el frontend compilado desde el backend
4. publica todo con una sola URL visible para el usuario

## Prueba rápida

Si el sistema ya está levantado:

- abre `http://IP_SERVIDOR:3000`
- intenta iniciar sesión
- revisa en DevTools que las peticiones vayan a `/api/auth/login`

Si ves llamadas a `localhost` desde otra máquina, entonces el build del frontend es incorrecto y debe recompilarse.

