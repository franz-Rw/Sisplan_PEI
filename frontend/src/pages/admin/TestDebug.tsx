import { useState, useEffect } from 'react'
import apiClient from '@services/api'

export default function TestDebug() {
  const [logs, setLogs] = useState<string[]>([])
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  useEffect(() => {
    const testAuth = async () => {
      addLog('🔍 Iniciando pruebas de autenticación y datos...')
      
      // 1. Verificar token
      const token = localStorage.getItem('authToken')
      addLog(`Token en localStorage: ${token ? 'EXISTS' : 'NULL'}`)
      addLog(`Token length: ${token?.length || 0}`)
      
      // 2. Probar perfil de usuario
      try {
        addLog('🔍 Probando endpoint /api/auth/profile...')
        const profileResponse = await apiClient.get('/auth/profile')
        addLog(`✅ Profile response: ${JSON.stringify(profileResponse.data)}`)
      } catch (error: any) {
        addLog(`❌ Profile error: ${error.response?.status} - ${error.response?.data?.error || error.message}`)
      }
      
      // 3. Probar planes
      try {
        addLog('🔍 Probando endpoint /api/plans...')
        const plansResponse = await apiClient.get('/plans')
        addLog(`✅ Plans response type: ${typeof plansResponse.data}`)
        addLog(`✅ Plans is array: ${Array.isArray(plansResponse.data)}`)
        addLog(`✅ Plans length: ${plansResponse.data?.length || 0}`)
        addLog(`✅ First plan: ${JSON.stringify(plansResponse.data?.[0] || 'NO DATA')}`)
      } catch (error: any) {
        addLog(`❌ Plans error: ${error.response?.status} - ${error.response?.data?.error || error.message}`)
      }
      
      // 4. Probar objetivos (si hay planes)
      try {
        addLog('🔍 Probando endpoint /api/strategic-objectives...')
        const objectivesResponse = await apiClient.get('/strategic-objectives')
        addLog(`✅ Objectives response type: ${typeof objectivesResponse.data}`)
        addLog(`✅ Objectives is array: ${Array.isArray(objectivesResponse.data)}`)
        addLog(`✅ Objectives length: ${objectivesResponse.data?.length || 0}`)
      } catch (error: any) {
        addLog(`❌ Objectives error: ${error.response?.status} - ${error.response?.data?.error || error.message}`)
      }
      
      // 5. Probar acciones
      try {
        addLog('🔍 Probando endpoint /api/strategic-actions...')
        const actionsResponse = await apiClient.get('/strategic-actions')
        addLog(`✅ Actions response type: ${typeof actionsResponse.data}`)
        addLog(`✅ Actions is array: ${Array.isArray(actionsResponse.data)}`)
        addLog(`✅ Actions length: ${actionsResponse.data?.length || 0}`)
      } catch (error: any) {
        addLog(`❌ Actions error: ${error.response?.status} - ${error.response?.data?.error || error.message}`)
      }
      
      addLog('🔍 Pruebas completadas')
    }
    
    testAuth()
  }, [])
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Panel - Seguimiento de Indicadores</h1>
      
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="mb-1">{log}</div>
        ))}
      </div>
      
      <div className="mt-4 space-y-2">
        <button
          onClick={() => window.location.href = '/admin/seguimiento-indicadores'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ir a Seguimiento de Indicadores
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-2"
        >
          Recargar Página
        </button>
      </div>
    </div>
  )
}
