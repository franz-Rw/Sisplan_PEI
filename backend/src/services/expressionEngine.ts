// Motor de Expresiones Dinámicas para Fórmulas de Indicadores

interface ExpressionNode {
  id: string
  type: 'VARIABLE' | 'FUNCTION' | 'OPERATOR' | 'CONSTANT' | 'CONDITION'
  position?: { x: number, y: number }
  data: {
    // Para VARIABLE
    variableId?: string
    fieldId?: string
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN'
    
    // Para FUNCTION
    functionType?: 'SUM' | 'AVG' | 'RATIO' | 'RATE' | 'INDEX' | 'PERCENTAGE'
    parameters?: ExpressionNode[]
    
    // Para OPERATOR
    operator?: '+' | '-' | '*' | '/' | '^'
    leftOperand?: ExpressionNode
    rightOperand?: ExpressionNode
    
    // Para CONSTANT
    value?: number
    
    // Para CONDITION
    condition?: 'EQUAL' | 'RANGE' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN'
    field?: string
    compareValue?: any
    range?: { min: any, max: any }
  }
  conditions?: ConditionNode[]
}

interface ConditionNode {
  id: string
  field: string
  operator: 'EQUAL' | 'RANGE' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN'
  value: any
  range?: { min: any, max: any }
  logic?: 'AND' | 'OR'
  children?: ConditionNode[]
}

interface CalculationContext {
  variables: Map<string, any[]>
  period: string
  indicatorId: string
}

interface CalculationResult {
  value: number
  metadata: {
    dataPoints: number
    calculationTime: number
    components: any[]
    errors?: string[]
  }
}

export class ExpressionEngine {
  
  /**
   * Procesa una fórmula dinámica completa
   */
  async processFormula(
    expressionTree: ExpressionNode,
    components: any,
    conditions: ConditionNode[],
    context: CalculationContext
  ): Promise<CalculationResult> {
    
    const startTime = Date.now()
    
    try {
      // 1. Aplicar condiciones/filtros a los datos
      const filteredContext = await this.applyConditions(conditions, context)
      
      // 2. Procesar componentes individuales
      const componentResults = await this.processComponents(components, filteredContext)
      
      // 3. Resolver el árbol de expresión principal
      const finalResult = await this.resolveExpression(expressionTree, componentResults, filteredContext)
      
      const calculationTime = Date.now() - startTime
      
      return {
        value: finalResult,
        metadata: {
          dataPoints: this.getTotalDataPoints(filteredContext),
          calculationTime,
          components: componentResults
        }
      }
      
    } catch (error) {
      const calculationTime = Date.now() - startTime
      
      return {
        value: 0,
        metadata: {
          dataPoints: 0,
          calculationTime,
          components: [],
          errors: [error instanceof Error ? error.message : 'Error desconocido']
        }
      }
    }
  }

  /**
   * Aplica condiciones/filtros a los datos del contexto
   */
  private async applyConditions(
    conditions: ConditionNode[],
    context: CalculationContext
  ): Promise<CalculationContext> {
    
    if (!conditions || conditions.length === 0) {
      return context
    }

    const filteredVariables = new Map<string, any[]>()
    
    for (const [variableId, data] of context.variables) {
      const filteredData = data.filter(item => 
        this.evaluateConditions(conditions, item)
      )
      filteredVariables.set(variableId, filteredData)
    }

    return {
      ...context,
      variables: filteredVariables
    }
  }

  /**
   * Evalúa si un item cumple con las condiciones
   */
  private evaluateConditions(conditions: ConditionNode[], item: any): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(item, condition.field)
      
      switch (condition.operator) {
        case 'EQUAL':
          return fieldValue === condition.value
        case 'RANGE':
          return condition.range && 
                 fieldValue >= condition.range.min && 
                 fieldValue <= condition.range.max
        case 'IN':
          return Array.isArray(condition.value) && 
                 condition.value.includes(fieldValue)
        case 'NOT_IN':
          return Array.isArray(condition.value) && 
                 !condition.value.includes(fieldValue)
        case 'GREATER_THAN':
          return fieldValue > condition.value
        case 'LESS_THAN':
          return fieldValue < condition.value
        default:
          return true
      }
    })
  }

  /**
   * Obtiene el valor de un campo anidado
   */
  private getFieldValue(item: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], item)
  }

  /**
   * Procesa los componentes de la fórmula
   */
  private async processComponents(
    components: any,
    context: CalculationContext
  ): Promise<any[]> {
    
    const results: any[] = []
    
    for (const component of components) {
      try {
        const result = await this.processComponent(component, context)
        results.push(result)
      } catch (error) {
        results.push({
          id: component.id,
          error: error instanceof Error ? error.message : 'Error en componente'
        })
      }
    }
    
    return results
  }

  /**
   * Procesa un componente individual
   */
  private async processComponent(
    component: any,
    context: CalculationContext
  ): Promise<any> {
    
    switch (component.type) {
      case 'VARIABLE':
        return this.processVariableComponent(component, context)
      case 'FUNCTION':
        return this.processFunctionComponent(component, context)
      case 'CONSTANT':
        return { value: component.value || 0 }
      default:
        throw new Error(`Tipo de componente no soportado: ${component.type}`)
    }
  }

  /**
   * Procesa un componente de tipo VARIABLE
   */
  private processVariableComponent(
    component: any,
    context: CalculationContext
  ): any {
    
    const variableData = context.variables.get(component.variableId)
    
    if (!variableData || variableData.length === 0) {
      return { value: 0, dataPoints: 0 }
    }

    let fieldValue = component.fieldId 
      ? variableData.map(item => this.getFieldValue(item, component.fieldId))
      : variableData

    // Aplicar agregación si está especificada
    if (component.aggregation) {
      fieldValue = this.applyAggregation(Array.isArray(fieldValue) ? fieldValue : [fieldValue], component.aggregation)
    }

    return {
      value: fieldValue,
      dataPoints: variableData.length
    }
  }

  /**
   * Procesa un componente de tipo FUNCTION
   */
  private async processFunctionComponent(
    component: any,
    context: CalculationContext
  ): Promise<any> {
    
    switch (component.functionType) {
      case 'SUM':
        return this.processSumFunction(component, context)
      case 'AVG':
        return this.processAvgFunction(component, context)
      case 'COUNT':
        return this.processCountFunction(component, context)
      case 'RATIO':
        return this.processRatioFunction(component, context)
      case 'RATE':
        return this.processRateFunction(component, context)
      case 'PERCENTAGE':
        return this.processPercentageFunction(component, context)
      default:
        throw new Error(`Función no soportada: ${component.functionType}`)
    }
  }

  /**
   * Resuelve el árbol de expresión principal
   */
  private async resolveExpression(
    node: ExpressionNode,
    componentResults: any[],
    context: CalculationContext
  ): Promise<number> {
    
    switch (node.type) {
      case 'CONSTANT':
        return node.data.value || 0
        
      case 'VARIABLE':
        const component = componentResults.find(c => c.id === node.id)
        return component?.value || 0
        
      case 'FUNCTION':
        return await this.resolveFunction(node, componentResults, context)
        
      case 'OPERATOR':
        return await this.resolveOperator(node, componentResults, context)
        
      default:
        throw new Error(`Tipo de nodo no soportado: ${node.type}`)
    }
  }

  /**
   * Resuelve una función en el árbol de expresión
   */
  private async resolveFunction(
    node: ExpressionNode,
    componentResults: any[],
    context: CalculationContext
  ): Promise<number> {
    
    const parameters = node.data.parameters || []
    const resolvedParams = await Promise.all(
      parameters.map(param => this.resolveExpression(param, componentResults, context))
    )

    switch (node.data.functionType) {
      case 'SUM':
        return resolvedParams.reduce((sum, val) => sum + val, 0)
      case 'AVG':
        return resolvedParams.length > 0 ? resolvedParams.reduce((sum, val) => sum + val, 0) / resolvedParams.length : 0
      case 'RATIO':
        return resolvedParams.length >= 2 && resolvedParams[1] !== 0 ? resolvedParams[0] / resolvedParams[1] : 0
      case 'RATE':
        return resolvedParams.length >= 2 && resolvedParams[1] !== 0 ? (resolvedParams[0] / resolvedParams[1]) * 100 : 0
      case 'PERCENTAGE':
        return resolvedParams.length >= 2 && resolvedParams[1] !== 0 ? (resolvedParams[0] / resolvedParams[1]) * 100 : 0
      default:
        return 0
    }
  }

  /**
   * Resuelve un operador en el árbol de expresión
   */
  private async resolveOperator(
    node: ExpressionNode,
    componentResults: any[],
    context: CalculationContext
  ): Promise<number> {
    
    const leftValue = node.data.leftOperand 
      ? await this.resolveExpression(node.data.leftOperand, componentResults, context)
      : 0
      
    const rightValue = node.data.rightOperand 
      ? await this.resolveExpression(node.data.rightOperand, componentResults, context)
      : 0

    switch (node.data.operator) {
      case '+':
        return leftValue + rightValue
      case '-':
        return leftValue - rightValue
      case '*':
        return leftValue * rightValue
      case '/':
        return rightValue !== 0 ? leftValue / rightValue : 0
      case '^':
        return Math.pow(leftValue, rightValue)
      default:
        return 0
    }
  }

  /**
   * Aplica una función de agregación
   */
  private applyAggregation(values: any[], aggregation: string): number {
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v))
    
    switch (aggregation) {
      case 'SUM':
        return numericValues.reduce((sum, val) => sum + val, 0)
      case 'COUNT':
        return numericValues.length
      case 'AVG':
        return numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0
      case 'MAX':
        return numericValues.length > 0 ? Math.max(...numericValues) : 0
      case 'MIN':
        return numericValues.length > 0 ? Math.min(...numericValues) : 0
      default:
        return 0
    }
  }

  /**
   * Funciones específicas para procesamiento
   */
  private async processSumFunction(component: any, context: CalculationContext): Promise<any> {
    // Implementación específica para SUM
    return { value: 0, dataPoints: 0 }
  }

  private async processAvgFunction(component: any, context: CalculationContext): Promise<any> {
    // Implementación específica para AVG
    return { value: 0, dataPoints: 0 }
  }

  private async processCountFunction(component: any, context: CalculationContext): Promise<any> {
    // Implementación específica para COUNT
    return { value: 0, dataPoints: 0 }
  }

  private async processRatioFunction(component: any, context: CalculationContext): Promise<any> {
    // Implementación específica para RATIO
    return { value: 0, dataPoints: 0 }
  }

  private async processRateFunction(component: any, context: CalculationContext): Promise<any> {
    // Implementación específica para RATE
    return { value: 0, dataPoints: 0 }
  }

  private async processPercentageFunction(component: any, context: CalculationContext): Promise<any> {
    // Implementación específica para PERCENTAGE
    return { value: 0, dataPoints: 0 }
  }

  /**
   * Obtiene el total de puntos de datos en el contexto
   */
  private getTotalDataPoints(context: CalculationContext): number {
    let total = 0
    for (const data of context.variables.values()) {
      total += data.length
    }
    return total
  }
}

export default ExpressionEngine
