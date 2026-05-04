# Despliegue local en laptop

## Objetivo

Levantar SISPLAN FR en tu laptop para desarrollo, pruebas funcionales y validación previa al servidor.

## Estado confirmado

Tu prueba local ya mostró:

- frontend listo en `http://localhost:5173`
- frontend visible por red en `http://192.168.2.45:5173`
- backend funcionando en desarrollo

Eso confirma que el entorno local está operativo para seguir probando flujos.

## Desarrollo local

### Backend

```powershell
cd D:\Sisplan_PEI\backend
Copy-Item .env.example .env -Force
```

Edita `backend/.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/sisplan_db
JWT_SECRET=CAMBIAR_ESTA_CLAVE_LOCAL
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Luego:

```powershell
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### Frontend

En otra terminal:

```powershell
cd D:\Sisplan_PEI\frontend
npm install
npm run dev
```

## URLs esperadas

- frontend local: `http://localhost:5173`
- frontend por red: `http://192.168.2.45:5173`
- backend: `http://localhost:3000`
- health: `http://localhost:3000/health`

## Credenciales iniciales

- correo: `admin@sisplan.local`
- contraseña: `Password@2026`

## Qué debes validar en laptop

### Pruebas mínimas

- login de administrador
- navegación por dashboard
- centros de costo
- usuarios
- planes
- indicadores
- reportes

### Pruebas recomendadas

- crear y editar registros
- cerrar sesión y volver a ingresar
- validar que no aparezcan errores CORS en consola
- probar desde otra PC de la red usando la IP de tu laptop

## Prueba local en modo producción

Esta prueba es la antesala del servidor.

### Compilar

```powershell
cd D:\Sisplan_PEI\backend
npx prisma generate
npm run build

cd ..\frontend
npm run build
```

### Ejecutar

```powershell
cd D:\Sisplan_PEI\backend
$env:NODE_ENV="production"
npm start
```

### Verificar

- `http://localhost:3000`
- `http://localhost:3000/health`
- `http://192.168.2.45:3000`

En este modo, el backend sirve el frontend compilado.

## Conclusión práctica

Si en tu laptop:

- funciona en desarrollo
- compila backend
- compila frontend
- y abre correctamente en `http://localhost:3000` en producción

entonces ya puedes copiarlo al servidor con mucho menos riesgo.

