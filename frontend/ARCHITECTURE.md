# Frontend Architecture Guide

## Componentes Base

### Layouts

- **AdminLayout:** Sidebar con navegación de admin
- **OperatorLayout:** Sidebar simplificado para operadores
- **AuthLayout:** Para páginas de login/register

### Pages

- **Admin:** Planes, Centros de Costos, Objetivos, Variables, Config, Seguimiento
- **Operator:** Seguimiento (Indicadores, Reportes)

## Estado Global

Se usa **Zustand** para estado simple:
- `authStore`: Usuario y token
- `planStore`: Planes actuales

Para Context API:
- AuthContext (si se necesita provider)

## Patrones

### Component Pattern
```tsx
interface Props {
  prop1: string
  prop2?: number
}

export default function MyComponent({ prop1, prop2 }: Props) {
  return <div>{prop1}</div>
}
```

### Hook Custom
```tsx
export const useMyHook = () => {
  const [state, setState] = useState()
  return { state, setState }
}
```

### API Service
```tsx
// ✅ Usar alias imports
import apiClient from '@services/api'

export const getPlans = async () => {
  const { data } = await apiClient.get('/plans')
  return data
}
```

## Estilos

- **Tailwind:** Utility-first para componentes
- **CSS Variables:** Para tema (dark/light futuro)
- **Flexbox/Grid:** Para layouts

## Accessibility

- ✅ ARIA labels en inputs
- ✅ Contraste WCAG AA
- ✅ Focus visible
- ✅ Semantic HTML
