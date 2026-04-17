const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOperatorSave() {
  try {
    console.log('=== PROBANDO GUARDADO DE DATOS DE OPERADOR ===');
    
    // Simular el payload que envía el frontend
    const operatorPayload = {
      indicatorId: 'cmniph3pq0010b3sp9tq7k9h4', // IAEI 01.01.01 (acción)
      variableId: 'cmniqaa7i001mb3sp7mdtmbt6', // VIAE 01.01.01.1
      costCenterId: 'cmnip1pol000rb3spn28o18br', // Centro de costo del operador
      year: 2024,
      values: {
        test_field: 100,
        descripcion: 'Test de guardado'
      },
      status: 'DRAFT'
    };
    
    console.log('Payload a enviar:');
    console.log(JSON.stringify(operatorPayload, null, 2));
    
    // Verificar que la variable existe
    const variable = await prisma.indicatorVariable.findUnique({
      where: { id: operatorPayload.variableId },
      select: {
        id: true,
        code: true,
        name: true,
        indicator: {
          select: {
            id: true,
            code: true,
            actionId: true,
            objectiveId: true
          }
        }
      }
    });
    
    if (!variable) {
      console.log('ERROR: Variable no encontrada');
      return;
    }
    
    console.log('\nVariable encontrada:');
    console.log(`- ${variable.code}: ${variable.name}`);
    console.log(`- Indicator: ${variable.indicator.code}`);
    console.log(`- ActionId: ${variable.indicator.actionId}`);
    console.log(`- ObjectiveId: ${variable.indicator.objectiveId}`);
    
    // Verificar que el centro de costo existe
    const costCenter = await prisma.costCenter.findUnique({
      where: { id: operatorPayload.costCenterId },
      select: { id: true, code: true, description: true }
    });
    
    if (!costCenter) {
      console.log('ERROR: Centro de costo no encontrado');
      return;
    }
    
    console.log('\nCentro de costo encontrado:');
    console.log(`- ${costCenter.code}: ${costCenter.description}`);
    
    // Intentar crear el registro como lo haría el backend
    try {
      const newRecord = await prisma.indicatorData.create({
        data: {
          variableId: operatorPayload.variableId,
          costCenterId: operatorPayload.costCenterId,
          costCenterCode: costCenter.code,
          year: operatorPayload.year,
          values: operatorPayload.values,
          status: operatorPayload.status,
          createdBy: 'riesgos@sisplan.pe'
        },
        include: {
          costCenter: {
            select: { id: true, code: true, description: true }
          },
          variable: {
            select: {
              code: true,
              name: true,
              indicator: {
                select: { code: true, actionId: true, objectiveId: true }
              }
            }
          }
        }
      });
      
      console.log('\nRegistro creado exitosamente:');
      console.log(`- ID: ${newRecord.id}`);
      console.log(`- Variable: ${newRecord.variable.code}`);
      console.log(`- Centro de costo: ${newRecord.costCenter.code}`);
      console.log(`- Año: ${newRecord.year}`);
      console.log(`- Estado: ${newRecord.status}`);
      
      // Limpiar el registro de prueba
      await prisma.indicatorData.delete({
        where: { id: newRecord.id }
      });
      
      console.log('\nRegistro de prueba eliminado');
      
    } catch (error) {
      console.error('\nERROR AL CREAR REGISTRO:', error);
      
      // Verificar si es un error de unicidad
      if (error.code === 'P2002') {
        console.log('El registro ya existe (error de unicidad)');
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOperatorSave();
