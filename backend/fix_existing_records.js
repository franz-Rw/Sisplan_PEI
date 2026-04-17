const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExistingRecords() {
  try {
    console.log('=== CORRIGIENDO REGISTROS EXISTENTES ===');
    
    // Buscar usuario operador
    const operatorUser = await prisma.user.findUnique({
      where: { email: 'riesgos@sisplan.pe' },
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
    
    if (!operatorUser) {
      console.log('Usuario operador no encontrado');
      return;
    }
    
    console.log('Usuario operador:');
    console.log(`- Email: ${operatorUser.email}`);
    console.log(`- Centro de costo: ${operatorUser.costCenter?.code || operatorUser.assignedCostCenter?.code}`);
    
    // Obtener registros pendientes creados por SYSTEM
    const systemRecords = await prisma.indicatorData.findMany({
      where: { 
        createdBy: 'SYSTEM',
        status: 'PENDING'
      },
      select: {
        id: true,
        costCenterId: true,
        costCenterCode: true,
        createdBy: true
      }
    });
    
    console.log(`\nRegistros a actualizar: ${systemRecords.length}`);
    
    // Actualizar cada registro
    for (const record of systemRecords) {
      console.log(`\nActualizando registro ${record.id}:`);
      console.log(`  - Antes: costCenterId=${record.costCenterId}, costCenterCode=${record.costCenterCode}`);
      
      await prisma.indicatorData.update({
        where: { id: record.id },
        data: {
          costCenterId: operatorUser.costCenter?.id || operatorUser.assignedCostCenter?.id,
          costCenterCode: operatorUser.costCenter?.code || operatorUser.assignedCostCenter?.code,
          createdBy: operatorUser.email
        }
      });
      
      console.log(`  - Después: costCenterId=${operatorUser.costCenter?.id || operatorUser.assignedCostCenter?.id}, costCenterCode=${operatorUser.costCenter?.code || operatorUser.assignedCostCenter?.code}`);
    }
    
    console.log('\n=== VERIFICANDO REGISTROS ACTUALIZADOS ===');
    
    // Verificar los registros actualizados
    const updatedRecords = await prisma.indicatorData.findMany({
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
    
    console.log('Registros pendientes después de la actualización:');
    updatedRecords.forEach(record => {
      console.log(`Registro ${record.id}:`);
      console.log(`  - costCenterId: ${record.costCenterId}`);
      console.log(`  - costCenterCode: ${record.costCenterCode}`);
      console.log(`  - createdBy: ${record.createdBy}`);
      console.log(`  - costCenter: ${record.costCenter?.code || 'NULL'} - ${record.costCenter?.description || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingRecords();
