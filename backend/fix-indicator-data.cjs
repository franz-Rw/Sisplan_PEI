const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixIndicatorData() {
  try {
    console.log('=== INICIANDO CORRECCIÓN DE DATOS ===');
    
    // 1. Buscar todos los registros que parecen ser indicadores pero están en strategic_objectives
    const suspiciousObjectives = await prisma.strategicObjective.findMany({
      where: {
        OR: [
          { code: { startsWith: 'IOE' } },
          { code: { startsWith: 'IND' } },
          { code: { contains: '.' } } // Códigos como "1.1"
        ]
      }
    });
    
    console.log(`Encontrados ${suspiciousObjectives.length} registros sospechosos en strategic_objectives:`);
    suspiciousObjectives.forEach(obj => {
      console.log(`- ID: ${obj.id}, Code: ${obj.code}, Plan: ${obj.planId}`);
    });
    
    // 2. Mover los indicadores a la tabla correcta
    for (const suspicious of suspiciousObjectives) {
      console.log(`Moviendo ${suspicious.code} a la tabla indicators...`);
      
      // Crear el indicador correctamente
      await prisma.indicator.create({
        data: {
          planId: suspicious.planId,
          objectiveId: suspicious.id, // Referencia al objetivo original (se corregirá después)
          code: suspicious.code,
          statement: suspicious.statement,
          responsibleId: suspicious.responsibleId,
          createdAt: suspicious.createdAt,
          updatedAt: suspicious.updatedAt
        }
      });
      
      // Eliminar de strategic_objectives
      await prisma.strategicObjective.delete({
        where: { id: suspicious.id }
      });
      
      console.log(`✅ ${suspicious.code} movido correctamente`);
    }
    
    console.log('=== CORRECCIÓN COMPLETADA ===');
    
  } catch (error) {
    console.error('Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixIndicatorData();
