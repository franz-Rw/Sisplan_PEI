const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDoubleLinkedIndicators(prioritize = 'action') {
  try {
    console.log('=== CORRECCIÓN DE INDICADORES CON DOBLE VINCULACIÓN ===\n');
    
    // Encontrar indicadores con doble vinculación
    const doubleLinkedIndicators = await prisma.indicator.findMany({
      where: {
        AND: [
          { objectiveId: { not: null } },
          { actionId: { not: null } }
        ]
      },
      include: {
        objective: { select: { code: true } },
        action: { select: { code: true } }
      }
    });

    if (doubleLinkedIndicators.length === 0) {
      console.log('No hay indicadores con doble vinculación que necesiten corrección.');
      return { fixed: 0, indicators: [] };
    }

    console.log(`Se encontraron ${doubleLinkedIndicators.length} indicadores con doble vinculación:`);
    doubleLinkedIndicators.forEach(ind => {
      console.log(`  - ${ind.code}: Objetivo(${ind.objective?.code}) + Acción(${ind.action?.code})`);
    });

    const updateData = prioritize === 'action' 
      ? { objectiveId: null }
      : { actionId: null };

    console.log(`\nCorrigiendo... (priorizando: ${prioritize})`);

    // Corregir los indicadores
    const result = await prisma.indicator.updateMany({
      where: {
        AND: [
          { objectiveId: { not: null } },
          { actionId: { not: null } }
        ]
      },
      data: updateData
    });

    console.log(`\n=== RESULTADO ===`);
    console.log(`Se corrigieron ${result.count} indicadores.`);
    console.log(`Se mantuvo la vinculación con: ${prioritize === 'action' ? 'Acciones Estratégicas' : 'Objetivos Estratégicos'}`);

    // Mostrar detalles de lo corregido
    console.log('\n=== INDICADORES CORREGIDOS ===');
    doubleLinkedIndicators.forEach(ind => {
      const kept = prioritize === 'action' ? ind.action?.code : ind.objective?.code;
      const removed = prioritize === 'action' ? ind.objective?.code : ind.action?.code;
      console.log(`  ${ind.code}: Mantenido ${kept} - Eliminado ${removed}`);
    });

    return {
      fixed: result.count,
      prioritize,
      indicators: doubleLinkedIndicators.map(ind => ({
        id: ind.id,
        code: ind.code,
        objective: ind.objective?.code,
        action: ind.action?.code,
        kept: prioritize
      }))
    };
    
  } catch (error) {
    console.error('Error al corregir indicadores:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar corrección
if (require.main === module) {
  const prioritize = process.argv[2] || 'action'; // Por defecto priorizar acciones
  
  if (!['action', 'objective'].includes(prioritize)) {
    console.log('Uso: node fix-indicators.js [action|objective]');
    console.log('  action - Mantener vinculación con acciones estratégicas (recomendado)');
    console.log('  objective - Mantener vinculación con objetivos estratégicos');
    process.exit(1);
  }
  
  fixDoubleLinkedIndicators(prioritize);
}

module.exports = { fixDoubleLinkedIndicators };
