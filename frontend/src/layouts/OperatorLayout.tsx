import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  FiHome, 
  FiBarChart2, 
  FiFileText, 
  FiMenu, 
  FiX, 
  FiUser, 
  FiLogOut,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi'
import { useAuth } from '@context/AuthContext'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
}

export default function OperatorLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Principal',
      icon: <FiHome className="w-5 h-5" />,
      path: '/operator'
    },
    {
      id: 'tracking',
      label: 'Seguimiento',
      icon: <FiBarChart2 className="w-5 h-5" />,
      children: [
        {
          id: 'indicators',
          label: 'Indicadores',
          icon: <FiBarChart2 className="w-4 h-4" />,
          path: '/operator/seguimiento/indicadores'
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <FiFileText className="w-5 h-5" />,
      path: '/operator/reportes'
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
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    logout()
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
              ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' 
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }
            ${level > 0 ? 'pl-8' : ''}
          `}
        >
          {item.icon}
          <span className="flex-1 font-medium">{item.label}</span>
          {hasChildren && (
            <span className="transition-transform duration-200">
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="bg-neutral-50">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-neutral-100">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">SISPLAN FR</h1>
              <p className="text-sm text-neutral-600">Panel Operador</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map(item => renderMenuItem(item))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                <p className="text-xs text-neutral-500">Operador</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                <p className="text-xs text-neutral-500">Rol: Operador</p>
              </div>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <FiUser className="w-4 h-4 text-primary-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
