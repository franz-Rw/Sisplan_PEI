# Configuración de IPs y puertos

## Resumen

Después de la corrección del proyecto, la configuración quedó simplificada.

## Desarrollo

### Frontend

- puerto: `5173`
- archivo: `frontend/.env.development`
- API usada por el navegador: `/api`
- proxy real de Vite: `frontend/vite.config.ts`

### Backend

- puerto por defecto: `3000`
- archivo: `backend/.env`

## Producción recomendada

### Sitio único

- aplicación completa: `http://IP_SERVIDOR:3000`
- API: `http://IP_SERVIDOR:3000/api`
- health: `http://IP_SERVIDOR:3000/health`

## Archivos relevantes

### Backend

- `backend/.env`
- `backend/.env.production`
- `backend/src/index.ts`

### Frontend

- `frontend/.env`
- `frontend/.env.development`
- `frontend/.env.production`
- `frontend/vite.config.ts`

## Regla importante

En producción, el frontend debe seguir usando:

```env
VITE_API_URL=/api
```

No se recomienda volver a compilar el frontend con una IP fija del backend si el backend servirá la aplicación completa.

## Cuándo cambiar IP o puerto

### Cambiar IP

Solo cambia:

- la URL de acceso que usarán los usuarios
- `CORS_ORIGIN` en `backend/.env.production` si publicas en otro host o puerto

### Cambiar puerto

Si decides usar otro puerto, por ejemplo `8080`:

- actualiza `PORT` en `backend/.env.production`
- abre ese puerto en el firewall
- usa la nueva URL en los navegadores cliente

## Ejemplo de producción

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://192.168.2.7:3000,http://localhost:3000
```

## Ejemplo de prueba local en producción

```powershell
cd D:\Sisplan_PEI\backend
$env:NODE_ENV="production"
$env:PORT="3100"
npm start
```

Luego:

- `http://localhost:3100`
- `http://localhost:3100/health`

