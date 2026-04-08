interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  closeable?: boolean
}

export default function Alert({
  type,
  title,
  message,
  onClose,
  closeable = true,
}: AlertProps) {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-900',
      message: 'text-green-800',
      icon: '✓',
      color: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-900',
      message: 'text-red-800',
      icon: '✕',
      color: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'text-yellow-900',
      message: 'text-yellow-800',
      icon: '⚠',
      color: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-900',
      message: 'text-blue-800',
      icon: 'ℹ',
      color: 'text-blue-600',
    },
  }

  const style = styles[type]

  return (
    <div className={`${style.bg} border-l-4 ${style.border} p-4 rounded`}>
      <div className="flex items-start">
        <span className={`${style.color} mr-3 font-bold text-xl`}>{style.icon}</span>
        <div className="flex-1">
          {title && <h4 className={`font-semibold ${style.title}`}>{title}</h4>}
          <p className={style.message}>{message}</p>
        </div>
        {closeable && (
          <button
            onClick={onClose}
            className={`${style.color} hover:opacity-70 ml-3`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
