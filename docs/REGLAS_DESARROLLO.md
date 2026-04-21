# Reglas de Desarrollo y Calidad - SISPLAN FR

## **Importaciones - Usar Aliases**

### **Frontend**
```typescript
import { Button, Input } from '@components'
import { authStore } from '@context/auth'
import { api } from '@services/api'
import { User } from '@types'
```

### **Backend**
```typescript
import { authController } from '@controllers/authController'
import { prisma } from '@config/database'
import { hashPassword } from '@utils/auth'
```

## **Convenciones de Código**

### **Naming**
- **Componentes**: PascalCase (`UserCard.tsx`)
- **Funciones**: camelCase (`handleSubmit()`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)
- **Tipos**: PascalCase con sufijo (`UserDTO`, `AuthContext`)

### **Estructura**
- Agrupar por funcionalidad, no por tipo de archivo
- Crear carpetas solo cuando hay 3+ archivos relacionados
- Usar index.ts/tsx para exports

### **Calidad**
- ESLint obligatorio
- Prettier para formateo
- TypeScript strict mode
- Sin `any` (usar `unknown` + validación)
- Documentar funciones complejas

---

*Estas reglas están integradas en el README.md principal. Para referencia completa, ver la sección de convenciones en el README.md.*
