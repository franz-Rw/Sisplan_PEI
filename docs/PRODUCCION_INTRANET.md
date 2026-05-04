# Producción en intranet municipal

## Objetivo

Publicar SISPLAN FR para que varias computadoras de la entidad ingresen por navegador usando una IP interna.

## URL recomendada

En el primer despliegue:

```text
http://IP_DEL_SERVIDOR:3000
```

Ejemplo:

```text
http://192.168.2.7:3000
```

## Modelo recomendado

### Laptop

- desarrollo con `npm run dev`
- validación de flujos
- build de producción

### Servidor

- PostgreSQL local
- backend en `production`
- frontend compilado dentro de `frontend/dist`
- backend sirviendo frontend y API

## Flujo recomendado

1. pruebas completas en laptop
2. build de frontend
3. build de backend
4. copia del proyecto al servidor
5. configuración de `.env.production`
6. migración o despliegue de base de datos
7. arranque del backend en producción
8. prueba desde otra PC de la red

## Qué cambia respecto al desarrollo

### En desarrollo

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`

### En producción recomendada

- sitio completo: `http://IP_SERVIDOR:3000`
- API: `http://IP_SERVIDOR:3000/api`

## Ventajas de este enfoque

- menos complejidad
- menos configuración manual
- sin necesidad de fijar IP del backend dentro del build del frontend
- menos probabilidad de errores de CORS
- despliegue más fácil de mantener en Windows

## Cuándo usar IIS

Usa IIS solo si necesitas:

- publicar en puerto 80
- integrarlo con otros sitios del servidor
- usar un nombre o ruta administrada por el área de sistemas

Si solo necesitas que el sistema funcione en la red local, no es obligatorio para la primera salida.

## Prueba mínima desde otra PC

Desde una computadora cliente de la intranet:

1. abre `http://IP_DEL_SERVIDOR:3000`
2. verifica que cargue el login
3. inicia sesión
4. navega por 2 o 3 módulos críticos
5. revisa que no fallen las peticiones a `/api`

