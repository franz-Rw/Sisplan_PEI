const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRealData() {
  console.log('=== VERIFICACIÓN DE DATOS REALES ===');
  
  try {
    const users = await prisma.user.count();
    console.log('Usuarios:', users);
    
    const costCenters = await prisma.costCenter.count();
    console.log('Centros de costos:', costCenters);
    
    const plans = await prisma.strategicPlan.count();
    console.log('Planes estratégicos:', plans);
    
    const objectives = await prisma.strategicObjective.count();
    console.log('Objetivos estratégicos:', objectives);
    
    const actions = await prisma.strategicAction.count();
    console.log('Acciones estratégicas:', actions);
    
    const variables = await prisma.variable.count();
    console.log('Variables:', variables);
    
    const indicators = await prisma.indicator.count();
    console.log('Indicadores:', indicators);
    
    const indicatorValues = await prisma.indicatorValue.count();
    console.log('Valores de indicadores:', indicatorValues);
    
    // Mostrar usuarios existentes
    const existingUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    console.log('Usuarios existentes:');
    existingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealData();
