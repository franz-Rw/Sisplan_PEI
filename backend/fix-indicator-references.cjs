const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixIndicatorReferences() {
  try {
    console.log('=== CORRIGIENDO REFERENCIAS DE INDICADORES ===');
    
    // Obtener el objetivo correcto (OEI 01)
    const correctObjective = await prisma.strategicObjective.findFirst({
      where: {
        code: 'OEI 01'
      }
    });
    
    if (!correctObjective) {
      console.log('❌ No se encontró el objetivo OEI 01');
      return;
    }
    
    console.log(`Objetivo encontrado: ${correctObjective.code} (ID: ${correctObjective.id})`);
    
    // Actualizar el indicador para que apunte al objetivo correcto
    const updatedIndicator = await prisma.indicator.updateMany({
      where: {
        code: 'IOE 1.1'
      },
      data: {
        objectiveId: correctObjective.id
      }
    });
    
    console.log(`✅ ${updatedIndicator.count} indicadores actualizados para apuntar al objetivo correcto`);
    
    console.log('=== CORRECCIÓN DE REFERENCIAS COMPLETADA ===');
    
  } catch (error) {
    console.error('Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixIndicatorReferences();
