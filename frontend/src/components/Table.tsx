interface TableProps {
  columns: Array<{
    key: string
    label: string
    width?: string
  }>
  data: Array<Record<string, any>>
  onRowClick?: (row: Record<string, any>) => void
  loading?: boolean
  empty?: boolean
}

export default function Table({
  columns,
  data,
  onRowClick,
  loading = false,
  empty = false,
}: TableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-neutral-500">Cargando...</span>
      </div>
    )
  }

  if (empty || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-neutral-500">No hay datos disponibles</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-sm font-semibold text-neutral-700"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`border-b border-neutral-200 hover:bg-neutral-50 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-3 text-sm text-neutral-900">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
