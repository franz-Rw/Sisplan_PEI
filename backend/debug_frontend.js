const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugFrontend() {
  try {
    console.log('=== DEPURANDO LÓGICA DEL FRONTEND ===');
    
    // Obtener datos como lo haría el frontend
    const data = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      include: {
        variable: {
          select: {
            id: true,
            code: true,
            name: true,
            fields: true,
            indicator: {
              select: {
                id: true,
                code: true,
                statement: true,
                planId: true,
                objectiveId: true,
                actionId: true,
                objective: {
                  select: {
                    id: true,
                    code: true,
                    statement: true,
                  },
                },
                action: {
                  select: {
                    id: true,
                    code: true,
                    statement: true,
                    objective: {
                      select: {
                        id: true,
                        code: true,
                        statement: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        costCenter: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { costCenterCode: 'asc' }]
    });
    
    // Simular diferentes escenarios del frontend
    const selectedPlan = 'cmnip8u98000sb3spdbt6wjyw'; // PEI 2025 - 2030
    const plans = [{ id: selectedPlan, name: 'PEI 2025 - 2030' }];
    
    console.log(`\n=== ESCENARIO 1: Pestaña OBJECTIVES ===`);
    const activeTab1 = 'objectives';
    const results1 = simulateBuildVariableIndicators(data, activeTab1, selectedPlan, plans);
    console.log(`Registros que pasarían el filtro: ${results1.length}`);
    results1.forEach((result, i) => {
      console.log(`${i+1}. ${result.variable.code} - ${result.indicator.code} (${result.action ? 'ACCIÓN' : 'OBJETIVO'})`);
    });
    
    console.log(`\n=== ESCENARIO 2: Pestaña ACTIONS ===`);
    const activeTab2 = 'actions';
    const results2 = simulateBuildVariableIndicators(data, activeTab2, selectedPlan, plans);
    console.log(`Registros que pasarían el filtro: ${results2.length}`);
    results2.forEach((result, i) => {
      console.log(`${i+1}. ${result.variable.code} - ${result.indicator.code} (${result.action ? 'ACCIÓN' : 'OBJETIVO'})`);
    });
    
    console.log(`\n=== ESCENARIO 3: Sin filtro de pestaña ===`);
    const results3 = simulateBuildVariableIndicators(data, 'all', selectedPlan, plans);
    console.log(`Registros totales: ${results3.length}`);
    results3.forEach((result, i) => {
      console.log(`${i+1}. ${result.variable.code} - ${result.indicator.code} - Centro: ${result.costCenter.code}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function simulateBuildVariableIndicators(records, activeTab, selectedPlan, plans) {
  const grouped = new Map();
  const results = [];

  records.forEach(record => {
    const variable = record.variable;
    const indicator = variable?.indicator;

    console.log(`\nProcesando registro: ${variable?.indicator?.code}`);
    console.log(`  - Plan ID: ${indicator?.planId}`);
    console.log(`  - Selected Plan: ${selectedPlan}`);
    console.log(`  - Plan coincide: ${indicator?.planId === selectedPlan}`);
    console.log(`  - Action ID: ${indicator?.actionId}`);
    console.log(`  - Active Tab: ${activeTab}`);
    
    if (!variable || !indicator || indicator.planId !== selectedPlan) {
      console.log(`  -> DESCARTADO: Plan no coincide`);
      return;
    }

    const isActionIndicator = Boolean(indicator.actionId);
    if (activeTab === 'objectives' && isActionIndicator) {
      console.log(`  -> DESCARTADO: Es acción pero pestaña es objectives`);
      return;
    }

    if (activeTab === 'actions' && !isActionIndicator) {
      console.log(`  -> DESCARTADO: Es objetivo pero pestaña es actions`);
      return;
    }

    const objective = indicator.objective || indicator.action?.objective;
    if (!objective) {
      console.log(`  -> DESCARTADO: Sin objetivo`);
      return;
    }

    console.log(`  -> APROBADO: Pasa todos los filtros`);
    
    const costCenter = record.costCenter
      ? {
          id: record.costCenter.id,
          code: record.costCenter.code,
          description: record.costCenter.description,
        }
      : {
          id: record.costCenterId || `fallback-${record.id}`,
          code: record.costCenter?.code || 'SIN ASIGNAR',
          description: record.costCenter?.description || 'Centro de costo no especificado'
        };

    const groupKey = `${variable.id}:${costCenter.id}`;
    const selectedPlanData = plans.find(plan => plan.id === indicator.planId);

    if (!selectedPlanData) {
      console.log(`  -> DESCARTADO: Plan no encontrado en lista`);
      return;
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        id: groupKey,
        costCenter,
        objective,
        action: indicator.action || undefined,
        indicator: {
          id: indicator.id,
          code: indicator.code,
          statement: indicator.statement,
        },
        variable,
        plan: selectedPlanData,
        pendingRecords: [],
      });
    }

    grouped.get(groupKey).pendingRecords.push(record);
  });

  return Array.from(grouped.values());
}

debugFrontend();
