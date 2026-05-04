# SISPLAN FR

Sistema web para la gestión de indicadores estratégicos municipales.

## Estado actual

El proyecto quedó preparado para trabajar en dos modos:

- `desarrollo`: `frontend` y `backend` separados con Vite y Node.js
- `producción`: `frontend` compilado y servido por el `backend`

Validaciones realizadas:

- `backend`: compila correctamente con `npm run build`
- `frontend`: compila correctamente con `npm run build`
- `Prisma`: genera cliente correctamente con `npx prisma generate`
- `producción local`: el backend compilado respondió `200` en `/` y `OK` en `/health`

## Arquitectura

- `frontend`: React 18 + TypeScript + Vite + Tailwind CSS
- `backend`: Node.js + Express + TypeScript
- `base de datos`: PostgreSQL
- `ORM`: Prisma
- `autenticación`: JWT

## Estructura del proyecto

```text
Sisplan_PEI/
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml
├── start-dev.bat
└── README.md
```

## Funcionalidad principal

### Administrador

- gestión de planes estratégicos
- gestión de centros de costo
- gestión de usuarios
- definición de objetivos, acciones e indicadores
- configuración de variables
- habilitación de plazos
- control de excepciones
- reportes
- asignación de indicadores a usuarios

### Operador

- acceso a planes asignados
- registro de indicadores
- seguimiento de variables
- exportación de reportes

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- PostgreSQL 14 o superior
- Windows 10/11 o Windows Server para despliegue en red local

## Desarrollo local

### 1. Backend

```powershell
cd D:\Sisplan_PEI\backend
Copy-Item .env.example .env -Force
```

Edita `backend/.env` con tu conexión real a PostgreSQL. Ejemplo:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/sisplan_db
JWT_SECRET=CAMBIAR_ESTA_CLAVE_LOCAL
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Instala dependencias y prepara Prisma:

```powershell
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### 2. Frontend

En otra terminal:

```powershell
cd D:\Sisplan_PEI\frontend
npm install
npm run dev
```

El frontend quedará disponible normalmente en:

- `http://localhost:5173`
- `http://IP_DE_TU_LAPTOP:5173`

En tu caso, por la prueba realizada:

- `http://192.168.2.45:5173`

### 3. Acceso inicial

Usuario semilla:

- correo: `admin@sisplan.local`
- contraseña: `Password@2026`

## Prueba local en modo producción

Esta es la prueba recomendada antes de copiar al servidor.

### 1. Compilar

```powershell
cd D:\Sisplan_PEI\backend
npx prisma generate
npm run build

cd D:\Sisplan_PEI\frontend
npm run build
```

### 2. Ejecutar producción local

```powershell
cd D:\Sisplan_PEI\backend
$env:NODE_ENV="production"
npm start
```

### 3. Probar

Abrir:

- `http://localhost:3000`
- `http://IP_DE_TU_LAPTOP:3000`
- `http://localhost:3000/health`

En producción, el backend sirve el frontend compilado, así que no hace falta ejecutar `vite` ni `npm run preview` en el servidor final.

## Despliegue recomendado en servidor Windows LAN

Ruta sugerida:

- `C:\sisplan\Sisplan_PEI`

### 1. Copiar el proyecto

Copia la carpeta completa del repositorio al servidor.

### 2. Configurar backend

Archivo recomendado: `backend/.env.production`

Ejemplo:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://sisplan_user:TU_PASSWORD@localhost:5432/sisplan_municipal
JWT_SECRET=CAMBIAR_ESTA_CLAVE_EN_PRODUCCION
JWT_EXPIRE=7d
CORS_ORIGIN=http://192.168.2.7:3000,http://localhost:3000
```

### 3. Instalar y construir

```powershell
cd C:\sisplan\Sisplan_PEI\backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

cd ..\frontend
npm install
npm run build
```

Si la base es nueva y quieres crear el administrador inicial:

```powershell
cd C:\sisplan\Sisplan_PEI\backend
npm run db:seed
```

### 4. Ejecutar en producción

```powershell
cd C:\sisplan\Sisplan_PEI\backend
$env:NODE_ENV="production"
npm start
```

URL final sugerida:

- `http://192.168.2.7:3000`

### 5. Abrir firewall

```powershell
netsh advfirewall firewall add rule name="SISPLAN HTTP" dir=in action=allow protocol=TCP localport=3000
```

## Despliegue como servicio en Windows

Recomendación práctica:

- usar `NSSM` o `PM2`

Comando de la aplicación:

```text
node dist/index.js
```

Directorio de trabajo:

```text
C:\sisplan\Sisplan_PEI\backend
```

Variable de entorno obligatoria:

```text
NODE_ENV=production
```

## Health check

Endpoints válidos:

- `GET /health`
- `GET /api/health`

Ejemplos:

- `http://localhost:3000/health`
- `http://192.168.2.7:3000/health`

## Variables de entorno relevantes

### Backend

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CORS_ORIGIN`

### Frontend

En producción el frontend usa:

```env
VITE_API_URL=/api
```

No necesitas poner una IP fija del backend dentro del build de producción si vas a servir el frontend desde el mismo backend.

## Scripts útiles

### Backend

```powershell
npm run dev
npm run build
npm start
npx prisma generate
npx prisma db push
npx prisma migrate deploy
npm run db:seed
```

### Frontend

```powershell
npm run dev
npm run build
npm run preview
npm run preview:lan
```

## Documentación adicional

Ver:

- [docs/README.md](D:/Sisplan_PEI/docs/README.md)
- [docs/DESPLIEGUE_LOCAL.md](D:/Sisplan_PEI/docs/DESPLIEGUE_LOCAL.md)
- [docs/DESPLEGUE_PRODUCCION_SERVIDOR.md](D:/Sisplan_PEI/docs/DESPLEGUE_PRODUCCION_SERVIDOR.md)
- [docs/PRODUCCION_INTRANET.md](D:/Sisplan_PEI/docs/PRODUCCION_INTRANET.md)
- [docs/CONFIGURACION_IPS_Y_PUERTOS.md](D:/Sisplan_PEI/docs/CONFIGURACION_IPS_Y_PUERTOS.md)

## Diagnóstico y opinión

Tu prueba en laptop es positiva y consistente con el estado actual del proyecto:

- el `frontend` levantó correctamente en red
- el `backend` en desarrollo permitió trabajar normalmente
- la compilación de producción ya quedó corregida
- la prueba local de producción del backend compilado respondió correctamente

Conclusión práctica:

- ya puedes seguir probando flujos en tu laptop con confianza
- después de validar tus flujos, el siguiente paso razonable es copiarlo al servidor y repetir el arranque en modo producción

