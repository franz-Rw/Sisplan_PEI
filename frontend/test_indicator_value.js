import { indicatorValuesService } from '../services/strategicService'

async function testSaveIndicatorValue() {
  try {
    console.log('Probando guardar valor de indicador...')
    
    const testData = {
      indicatorId: 'test-indicator-id',
      year: 2024,
      value: 100.5,
      type: 'ABSOLUTE'
    }
    
    const result = await indicatorValuesService.createAbsolute(testData)
    console.log('Valor guardado exitosamente:', result)
    
  } catch (error) {
    console.error('Error al guardar valor:', error)
  }
}

testSaveIndicatorValue()
