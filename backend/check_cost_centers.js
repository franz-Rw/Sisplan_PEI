const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCostCenters() {
  try {
    console.log('=== VERIFICANDO CENTROS DE COSTO ===');
    
    // Verificar centros de costo disponibles
    const costCenters = await prisma.costCenter.findMany({
      select: { id: true, code: true, description: true }
    });
    
    console.log('Centros de costo disponibles:');
    costCenters.forEach(cc => {
      console.log(`- ${cc.id}: ${cc.code} - ${cc.description}`);
    });
    
    // Verificar usuarios y sus centros de costo
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        role: true,
        costCenterId: true,
        costCenter: {
          select: { id: true, code: true, description: true }
        },
        assignedCostCenter: {
          select: { id: true, code: true, description: true }
        }
      }
    });
    
    console.log('\nUsuarios y sus centros de costo:');
    users.forEach(user => {
      console.log(`${user.email} (${user.role}):`);
      console.log(`  - costCenterId: ${user.costCenterId || 'NULL'}`);
      console.log(`  - costCenter: ${user.costCenter?.code || 'NULL'}`);
      console.log(`  - assignedCostCenter: ${user.assignedCostCenter?.code || 'NULL'}`);
    });
    
    // Verificar registros pendientes y sus centros de costo
    const pendingRecords = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        costCenterId: true,
        costCenterCode: true,
        createdBy: true,
        costCenter: {
          select: { id: true, code: true, description: true }
        }
      }
    });
    
    console.log('\nRegistros pendientes y sus centros de costo:');
    pendingRecords.forEach(record => {
      console.log(`Registro ${record.id}:`);
      console.log(`  - costCenterId: ${record.costCenterId || 'NULL'}`);
      console.log(`  - costCenterCode: ${record.costCenterCode}`);
      console.log(`  - createdBy: ${record.createdBy}`);
      console.log(`  - costCenter: ${record.costCenter?.code || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCostCenters();
