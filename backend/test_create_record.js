const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateRecord() {
  try {
    console.log('=== PROBANDO CREACIÓN DE REGISTRO CON CENTRO DE COSTO ===');
    
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
    
    console.log('Usuario operador encontrado:');
    console.log(`- ID: ${operatorUser.id}`);
    console.log(`- Email: ${operatorUser.email}`);
    console.log(`- Role: ${operatorUser.role}`);
    console.log(`- costCenterId: ${operatorUser.costCenterId}`);
    console.log(`- costCenter: ${operatorUser.costCenter?.code || 'NULL'}`);
    console.log(`- assignedCostCenter: ${operatorUser.assignedCostCenter?.code || 'NULL'}`);
    
    // Buscar una variable existente para probar
    const variable = await prisma.indicatorVariable.findFirst({
      select: { id: true, code: true, name: true }
    });
    
    if (!variable) {
      console.log('No se encontraron variables para probar');
      return;
    }
    
    console.log(`\nUsando variable: ${variable.code} - ${variable.name}`);
    
    // Simular la creación de un registro como lo haría el backend
    const simulatedReq = {
      userId: operatorUser.id
    };
    
    // Usar la misma lógica del backend
    const resolvedCostCenter = {
      costCenterId: operatorUser.costCenter?.id || operatorUser.assignedCostCenter?.id || null,
      costCenterCode: operatorUser.costCenter?.code || operatorUser.assignedCostCenter?.code || 'N/A'
    };
    
    console.log('\nCentro de costo resuelto:');
    console.log(`- costCenterId: ${resolvedCostCenter.costCenterId}`);
    console.log(`- costCenterCode: ${resolvedCostCenter.costCenterCode}`);
    
    // Crear un registro de prueba
    const testRecord = await prisma.indicatorData.create({
      data: {
        variableId: variable.id,
        costCenterId: resolvedCostCenter.costCenterId,
        costCenterCode: resolvedCostCenter.costCenterCode,
        year: 2024,
        values: { test_field: 100 },
        createdBy: operatorUser.email,
        status: 'PENDING'
      },
      include: {
        costCenter: {
          select: { id: true, code: true, description: true }
        }
      }
    });
    
    console.log('\nRegistro de prueba creado:');
    console.log(`- ID: ${testRecord.id}`);
    console.log(`- variableId: ${testRecord.variableId}`);
    console.log(`- costCenterId: ${testRecord.costCenterId}`);
    console.log(`- costCenterCode: ${testRecord.costCenterCode}`);
    console.log(`- createdBy: ${testRecord.createdBy}`);
    console.log(`- costCenter: ${testRecord.costCenter?.code || 'NULL'} - ${testRecord.costCenter?.description || 'NULL'}`);
    
    // Limpiar el registro de prueba
    await prisma.indicatorData.delete({
      where: { id: testRecord.id }
    });
    
    console.log('\nRegistro de prueba eliminado');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateRecord();
