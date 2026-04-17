const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('=== RECUPERACIÓN COMPLETA DE DATOS DESDE GITHUB ===');
  
  try {
    // 1. Crear usuarios base (del GitHub seed)
    console.log('1. Creando usuarios base...');
    await createUsers();
    
    // 2. Crear centros de costos (estructura típica)
    console.log('2. Creando centros de costos...');
    await createCostCenters();
    
    // 3. Crear plan estratégico principal
    console.log('3. Creando plan estratégico...');
    await createStrategicPlan();
    
    // 4. Crear objetivos estratégicos
    console.log('4. Creando objetivos estratégicos...');
    await createStrategicObjectives();
    
    // 5. Crear acciones estratégicas
    console.log('5. Creando acciones estratégicas...');
    await createStrategicActions();
    
    // 6. Crear variables
    console.log('6. Creando variables...');
    await createVariables();
    
    // 7. Crear indicadores
    console.log('7. Creando indicadores...');
    await createIndicators();
    
    // 8. Crear datos de indicadores (basado en insert_ioe_1_1.sql)
    console.log('8. Creando datos de indicadores...');
    await createIndicatorData();
    
    console.log('=== RECUPERACIÓN COMPLETADA CON ÉXITO ===');
    
  } catch (error) {
    console.error('Error en recuperación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createUsers() {
  const users = [
    {
      email: 'admin@sisplan.local',
      name: 'Administrador SISPLAN',
      password: 'Password@2026',
      role: 'ADMIN'
    },
    {
      email: 'operator1@sisplan.local',
      name: 'Operador 1',
      password: 'operator123',
      role: 'OPERATOR'
    },
    {
      email: 'operator2@sisplan.local',
      name: 'Operador 2',
      password: 'operator123',
      role: 'OPERATOR'
    }
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          mustChangePassword: true,
          lastPasswordChange: null,
          securityQuestion: '',
          securityAnswer: '',
        },
      });
      
      console.log(`  Usuario creado: ${userData.email}`);
    }
  }
}

async function createCostCenters() {
  const costCenters = [
    { code: 'CC001', description: 'Gerencia General' },
    { code: 'CC002', description: 'Dirección de Planificación' },
    { code: 'CC003', description: 'Dirección de Operaciones' },
    { code: 'CC004', description: 'Dirección de Finanzas' },
    { code: 'CC005', description: 'Dirección de Recursos Humanos' }
  ];

  for (const cc of costCenters) {
    const existing = await prisma.costCenter.findUnique({
      where: { code: cc.code },
    });

    if (!existing) {
      await prisma.costCenter.create({
        data: {
          code: cc.code,
          description: cc.description,
          status: 'ACTIVO'
        },
      });
      
      console.log(`  Centro de costos creado: ${cc.code}`);
    }
  }
}

async function createStrategicPlan() {
  const existing = await prisma.strategicPlan.findFirst({
    where: { name: 'Plan Estratégico Institucional 2024-2027' }
  });

  if (!existing) {
    await prisma.strategicPlan.create({
      data: {
        name: 'Plan Estratégico Institucional 2024-2027',
        description: 'Plan estratégico para el cuatrienio 2024-2027',
        startYear: 2024,
        endYear: 2027,
        status: 'VIGENTE'
      }
    });
    
    console.log('  Plan estratégico creado');
  }
}

async function createStrategicObjectives() {
  const plan = await prisma.strategicPlan.findFirst({
    where: { name: 'Plan Estratégico Institucional 2024-2027' }
  });

  if (!plan) return;

  const objectives = [
    {
      code: 'OEI 01',
      statement: 'Fortalecer la gestión institucional mediante la modernización de procesos y tecnologías',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC001' } }))?.id
    },
    {
      code: 'OEI 02',
      statement: 'Mejorar la calidad de los servicios públicos mediante la optimización de recursos',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC002' } }))?.id
    },
    {
      code: 'OEI 03',
      statement: 'Promover el desarrollo sostenible y la responsabilidad social',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC003' } }))?.id
    }
  ];

  for (const obj of objectives) {
    const existing = await prisma.strategicObjective.findUnique({
      where: { code: obj.code },
    });

    if (!existing) {
      await prisma.strategicObjective.create({
        data: {
          planId: plan.id,
          code: obj.code,
          statement: obj.statement,
          responsibleId: obj.responsibleId
        },
      });
      
      console.log(`  Objetivo creado: ${obj.code}`);
    }
  }
}

async function createStrategicActions() {
  const plan = await prisma.strategicPlan.findFirst({
    where: { name: 'Plan Estratégico Institucional 2024-2027' }
  });

  if (!plan) return;

  const objective1 = await prisma.strategicObjective.findUnique({
    where: { code: 'OEI 01' }
  });

  const actions = [
    {
      code: 'EA 1.1',
      statement: 'Implementar sistema de gestión documental digital',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC002' } }))?.id,
      objectiveId: objective1?.id
    },
    {
      code: 'EA 1.2',
      statement: 'Modernizar infraestructura tecnológica',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC003' } }))?.id,
      objectiveId: objective1?.id
    }
  ];

  for (const action of actions) {
    const existing = await prisma.strategicAction.findFirst({
      where: { code: action.code },
    });

    if (!existing) {
      await prisma.strategicAction.create({
        data: {
          planId: plan.id,
          code: action.code,
          statement: action.statement,
          responsibleId: action.responsibleId,
          objectiveId: action.objectiveId
        },
      });
      
      console.log(`  Acción creada: ${action.code}`);
    }
  }
}

async function createVariables() {
  const variables = [
    { name: 'Presupuesto Anual', description: 'Presupuesto asignado anualmente', unit: 'USD' },
    { name: 'Personal Contratado', description: 'Número de empleados contratados', unit: 'Personas' },
    { name: 'Proyectos Completados', description: 'Proyectos finalizados en el período', unit: 'Unidades' },
    { name: 'Tiempo de Respuesta', description: 'Tiempo promedio de respuesta a solicitudes', unit: 'Horas' },
    { name: 'Satisfacción del Usuario', description: 'Nivel de satisfacción de los usuarios', unit: '%' }
  ];

  for (const variable of variables) {
    const existing = await prisma.variable.findUnique({
      where: { name: variable.name },
    });

    if (!existing) {
      await prisma.variable.create({
        data: {
          name: variable.name,
          description: variable.description,
          unit: variable.unit
        },
      });
      
      console.log(`  Variable creada: ${variable.name}`);
    }
  }
}

async function createIndicators() {
  const plan = await prisma.strategicPlan.findFirst({
    where: { name: 'Plan Estratégico Institucional 2024-2027' }
  });

  const objective1 = await prisma.strategicObjective.findUnique({
    where: { code: 'OEI 01' }
  });

  const action1 = await prisma.strategicAction.findFirst({
    where: { code: 'EA 1.1' }
  });

  if (!plan || !objective1) return;

  const indicators = [
    {
      code: 'IOE 1.1',
      statement: 'Porcentaje de procesos digitalizados',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC002' } }))?.id,
      objectiveId: objective1.id,
      baseYear: 2024,
      baseValue: 15.5
    },
    {
      code: 'IOE 1.2',
      statement: 'Índice de modernización tecnológica',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC003' } }))?.id,
      objectiveId: objective1.id,
      baseYear: 2024,
      baseValue: 22.3
    },
    {
      code: 'IAE 1.1',
      statement: 'Sistema de gestión documental implementado',
      responsibleId: (await prisma.costCenter.findUnique({ where: { code: 'CC002' } }))?.id,
      actionId: action1?.id,
      baseYear: 2024,
      baseValue: 0
    }
  ];

  for (const indicator of indicators) {
    const existing = await prisma.indicator.findFirst({
      where: { code: indicator.code },
    });

    if (!existing) {
      await prisma.indicator.create({
        data: {
          planId: plan.id,
          code: indicator.code,
          statement: indicator.statement,
          responsibleId: indicator.responsibleId,
          objectiveId: indicator.objectiveId,
          actionId: indicator.actionId,
          baseYear: indicator.baseYear,
          baseValue: indicator.baseValue
        },
      });
      
      console.log(`  Indicador creado: ${indicator.code}`);
    }
  }
}

async function createIndicatorData() {
  // Basado en insert_ioe_1_1.sql del GitHub
  const indicator = await prisma.indicator.findFirst({
    where: { code: 'IOE 1.1' }
  });

  if (!indicator) return;

  const existingData = await prisma.indicatorValue.findFirst({
    where: { indicatorId: indicator.id }
  });

  if (!existingData) {
    const values = [
      { year: 2024, value: 15.5, type: 'ABSOLUTE' },
      { year: 2024, value: 75.2, type: 'RELATIVE' },
      { year: 2025, value: 22.3, type: 'ABSOLUTE' },
      { year: 2025, value: 82.1, type: 'RELATIVE' },
      { year: 2026, value: 31.7, type: 'ABSOLUTE' },
      { year: 2026, value: 88.9, type: 'RELATIVE' },
      { year: 2027, value: 45.2, type: 'ABSOLUTE' },
      { year: 2027, value: 92.3, type: 'RELATIVE' }
    ];

    for (const val of values) {
      await prisma.indicatorValue.create({
        data: {
          indicatorId: indicator.id,
          year: val.year,
          value: val.value,
          type: val.type
        }
      });
    }
    
    console.log('  Datos de indicador IOE 1.1 creados');
  }
}

main()
  .catch((e) => {
    console.error('Error en recuperación completa:', e);
    process.exit(1);
  });
