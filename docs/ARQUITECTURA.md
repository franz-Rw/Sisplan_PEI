# Arquitectura del Sistema - SISPLAN FR

## **Visión General**

**SISPLAN FR** es una aplicación web full stack para la gestión integral de indicadores de planes estratégicos municipales, diseñada con arquitectura moderna y escalable.

## **Características por Rol**

### **Administrador Municipal**
- Gestionar planes estratégicos
- Administrar centros de costos
- Gestionar usuarios por centro
- Definir objetivos y acciones estratégicas
- Configurar variables de seguimiento
- Configurar plazos para operadores
- Generar reportes consolidados (PDF/Excel/csv)

### **Operador**
- Ver planes asignados
- Registrar indicadores de objetivos
- Registrar indicadores de acciones
- Exportar reportes personalizados

## **Arquitectura Técnica**

```
SISPLAN FR PLATFORM
                 |
    Frontend      |      Backend
    React+TS      |  Node+Express
    Tailwind      |  PostgreSQL
    Vite          |  Prisma ORM
                 |
LOGIN (ADMIN vs OPERATOR)
      |
ROLE-BASED NAVIGATION
  |- Admin: Sidebar completo
  |- Operator: Sidebar limitado
```

## **Stack Tecnológico**

| Aspecto | Tecnología | Razón |
|--------|-----------|-------|
| Frontend JS | React 18 | Ecosistema maduro, comunidad grande |
| Frontend Bundler | Vite | Rápido, moderno, mejor DX |
| Frontend Estilos | Tailwind CSS | Escalable, mantenible, accesible |
| Backend Runtime | Node.js | JavaScript full-stack |
| Backend Framework | Express | Sencillo, flexible, bien mantenido |
| Lenguaje | TypeScript | Type-safety, mejor mantenibilidad |
| Base de Datos | PostgreSQL | Robusta, confiable, escalable |
| ORM | Prisma | Type-safe, migrations automáticas |
| Autenticación | JWT | Stateless, escalable |
| Contraseñas | Bcrypt | Estándar de facto |

---

*Esta arquitectura está documentada en el README.md principal. Para detalles completos, ver la sección de arquitectura en el README.md.*
