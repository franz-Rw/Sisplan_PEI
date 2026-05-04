# Despliegue en producción en servidor Windows

## Recomendación principal

Para tu caso, la ruta más simple y estable es esta:

- compilar `frontend`
- compilar `backend`
- ejecutar solo el `backend` en producción
- dejar que el `backend` sirva también el `frontend` compilado

Así evitas:

- depender de Vite en el servidor
- builds apuntando a IPs fijas
- problemas innecesarios de CORS entre puertos distintos

## Arquitectura recomendada

### Opción recomendada

- aplicación pública en LAN: `http://IP_DEL_SERVIDOR:3000`
- frontend servido por Express
- API disponible en `/api`
- health check en `/health`
- PostgreSQL local en el mismo servidor

### Opción opcional posterior

Si luego quieres integrarlo con IIS o publicarlo en puerto 80:

- IIS puede actuar como proxy inverso hacia `http://localhost:3000`

Pero no es requisito para el primer despliegue.

## Paso a paso exacto

### 1. Preparar el servidor

Instala:

- Node.js 18 o superior
- PostgreSQL 14 o superior

Verifica:

```powershell
node --version
npm --version
```

### 2. Crear carpeta del sistema

Ejemplo:

```text
C:\sisplan\Sisplan_PEI
```

### 3. Copiar el proyecto

Copia toda la carpeta del repositorio desde tu laptop al servidor.

### 4. Configurar PostgreSQL

Base sugerida:

```sql
CREATE DATABASE sisplan_municipal;
CREATE USER sisplan_user WITH PASSWORD 'TU_PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON DATABASE sisplan_municipal TO sisplan_user;
```

### 5. Configurar backend

Edita `C:\sisplan\Sisplan_PEI\backend\.env.production`

Ejemplo:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://sisplan_user:TU_PASSWORD_SEGURA@localhost:5432/sisplan_municipal
JWT_SECRET=CAMBIAR_ESTA_CLAVE_EN_PRODUCCION
JWT_EXPIRE=7d
CORS_ORIGIN=http://192.168.2.7:3000,http://localhost:3000
```

### 6. Instalar dependencias y construir

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

Si la base está vacía:

```powershell
cd C:\sisplan\Sisplan_PEI\backend
npm run db:seed
```

### 7. Primera prueba manual en servidor

```powershell
cd C:\sisplan\Sisplan_PEI\backend
$env:NODE_ENV="production"
npm start
```

Prueba estas URLs desde el propio servidor:

- `http://localhost:3000`
- `http://localhost:3000/health`

Luego prueba desde otra PC de la red:

- `http://192.168.2.7:3000`

## Firewall

Abre el puerto de la aplicación:

```powershell
netsh advfirewall firewall add rule name="SISPLAN HTTP" dir=in action=allow protocol=TCP localport=3000
```

## Servicio de Windows

## Recomendación

Usa `NSSM` o `PM2`.

### Comando de arranque

```text
node dist/index.js
```

### Directorio de trabajo

```text
C:\sisplan\Sisplan_PEI\backend
```

### Variable obligatoria

```text
NODE_ENV=production
```

## Checklist final

- [ ] PostgreSQL operativo
- [ ] `.env.production` correcto
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma migrate deploy` ejecutado
- [ ] `npm run build` en backend
- [ ] `npm run build` en frontend
- [ ] backend abre `http://localhost:3000`
- [ ] health responde en `/health`
- [ ] puerto 3000 abierto en firewall
- [ ] acceso correcto desde otra PC de la red

