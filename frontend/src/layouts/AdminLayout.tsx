import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { 
  FiHome, 
  FiTarget, 
  FiMapPin, 
  FiUsers, 
  FiSettings, 
  FiTrendingUp,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiFileText,
  FiBarChart2,
  FiAlertTriangle
} from 'react-icons/fi'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
}

export default function AdminLayout() {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />,
      path: '/admin'
    },
    {
      id: 'plans',
      label: 'Planes Estratégicos',
      icon: <FiTarget className="w-5 h-5" />,
      path: '/admin/planes'
    },
    {
      id: 'cost-centers',
      label: 'Centros de Costos',
      icon: <FiMapPin className="w-5 h-5" />,
      children: [
        {
          id: 'cost-centers-list',
          label: 'Centros de Costo',
          icon: <FiMapPin className="w-4 h-4" />,
          path: '/admin/centros-costo'
        },
        {
          id: 'users',
          label: 'Usuarios',
          icon: <FiUsers className="w-4 h-4" />,
          path: '/admin/usuarios'
        }
      ]
    },
    {
      id: 'objectives',
      label: 'Objetivos y Acciones Estratégicas',
      icon: <FiFileText className="w-5 h-5" />,
      path: '/admin/objetivos'
    },
    {
      id: 'tracking',
      label: 'Seguimiento',
      icon: <FiTrendingUp className="w-5 h-5" />,
      path: '/admin/seguimiento'
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <FiFileText className="w-5 h-5" />,
      children: [
        {
          id: 'reports-plans',
          label: 'Planes',
          icon: <FiTarget className="w-4 h-4" />,
          path: '/admin/reportes/planes'
        },
        {
          id: 'reports-variables',
          label: 'Variables',
          icon: <FiFileText className="w-4 h-4" />,
          path: '/admin/reportes/variables'
        },
        {
          id: 'reports-users',
          label: 'Usuarios',
          icon: <FiUsers className="w-4 h-4" />,
          path: '/admin/reportes/usuarios'
        },
        {
          id: 'reports-cost-centers',
          label: 'Centros de Costos',
          icon: <FiMapPin className="w-4 h-4" />,
          path: '/admin/reportes/centros-costo'
        }
      ]
    },
    {
      id: 'variables',
      label: 'Variables',
      icon: <FiBarChart2 className="w-5 h-5" />,
      path: '/admin/variables'
    },
    {
      id: 'exceptions',
      label: 'Control y Seguimiento de Excepciones',
      icon: <FiAlertTriangle className="w-5 h-5" />,
      path: '/admin/excepciones'
    },
    {
      id: 'formulas',
      label: 'Configuración de Fórmulas',
      icon: <FiSettings className="w-5 h-5" />,
      path: '/admin/formulas'
    },
    {
      id: 'config',
      label: 'Configuración',
      icon: <FiSettings className="w-5 h-5" />,
      children: [
        {
          id: 'deadlines',
          label: 'Habilitar Plazos',
          icon: <FiSettings className="w-4 h-4" />,
          path: '/admin/configuracion/plazos'
        }
      ]
    }
  ]

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path?: string) => {
    return path && location.pathname === path
  }

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.path))
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0
    const active = isActive(item.path)
    const parentActive = isParentActive(item.children)

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else if (item.path) {
              handleNavigation(item.path)
            }
          }}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200
            ${active || parentActive 
              ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' 
              : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
            }
          `}
          style={{ paddingLeft: `${level * 16 + 16}px` }}
        >
          <span className={`${active || parentActive ? 'text-primary-600' : 'text-neutral-500'}`}>
            {item.icon}
          </span>
          <span className="flex-1 font-medium text-sm">{item.label}</span>
          {hasChildren && (
            <span className="text-neutral-400">
              {isExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
            </span>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="bg-neutral-25">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-neutral-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900">SISPLAN FR</h1>
          <p className="text-xs text-neutral-500 mt-1">Panel Administrativo</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="flex-1 font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {menuItems.find(item => 
                  item.path === location.pathname || 
                  item.children?.some(child => child.path === location.pathname)
                )?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Gestión de Indicadores de Planes Estratégicos
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600">Administrador</span>
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
