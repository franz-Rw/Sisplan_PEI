# Guía de Acceso Administrador - SISPLAN FR

## **Credenciales Iniciales**

```plaintext
Email:     admin@sisplan.local
Contraseña: Password@2026
```

## **Flujo de Primer Ingreso**

1. **Ejecutar seed** para crear usuario admin:
   ```bash
   cd backend
   npm run db:seed
   ```

2. **Ingresar** con credenciales iniciales

3. **Cambio obligatorio** de contraseña en primer login

4. **Configurar pregunta** de seguridad

## **Recuperación de Contraseña**

- **Pregunta de seguridad** configurada por admin
- **Token de recuperación** válido por 30 minutos
- **Flujo seguro** sin revelar contraseña actual

---

*Esta información está consolidada del README.md principal. Para detalles completos, ver la sección de autenticación en el README.md.*
