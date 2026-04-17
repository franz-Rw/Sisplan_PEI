const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseIndicators() {
  try {
    console.log('=== DIAGNÓSTICO DE INDICADORES ===\n');
    
    // Obtener todos los indicadores con sus relaciones
    const indicators = await prisma.indicator.findMany({
      include: {
        objective: {
          select: { id: true, code: true, statement: true }
        },
        action: {
          select: { id: true, code: true, statement: true }
        }
      },
      orderBy: { code: 'asc' }
    });

    console.log(`Total de indicadores: ${indicators.length}\n`);

    // Analizar cada indicador
    const diagnosis = indicators.map(indicator => {
      const hasObjective = indicator.objectiveId !== null;
      const hasAction = indicator.actionId !== null;
      
      let status = 'CORRECT';
      let issue = null;
      
      if (hasObjective && hasAction) {
        status = 'ERROR';
        issue = 'DOBLE VINCULACIÓN: Tiene tanto objectiveId como actionId';
      } else if (!hasObjective && !hasAction) {
        status = 'ERROR';
        issue = 'SIN VINCULACIÓN: No tiene ni objectiveId ni actionId';
      }

      return {
        id: indicator.id,
        code: indicator.code,
        statement: indicator.statement,
        objectiveId: indicator.objectiveId,
        actionId: indicator.actionId,
        objective: indicator.objective,
        action: indicator.action,
        status,
        issue
      };
    });

    // Mostrar resumen
    const summary = {
      total: indicators.length,
      correct: diagnosis.filter(d => d.status === 'CORRECT').length,
      errors: diagnosis.filter(d => d.status === 'ERROR').length,
      doubleLinked: diagnosis.filter(d => d.issue?.includes('DOBLE VINCULACIÓN')).length,
      unlinked: diagnosis.filter(d => d.issue?.includes('SIN VINCULACIÓN')).length
    };

    console.log('=== RESUMEN ===');
    console.log(`Total: ${summary.total}`);
    console.log(`Correctos: ${summary.correct}`);
    console.log(`Con errores: ${summary.errors}`);
    console.log(`Doble vinculación: ${summary.doubleLinked}`);
    console.log(`Sin vinculación: ${summary.unlinked}\n`);

    // Mostrar indicadores con problemas
    const problematicIndicators = diagnosis.filter(d => d.status === 'ERROR');
    
    if (problematicIndicators.length > 0) {
      console.log('=== INDICADORES CON PROBLEMAS ===');
      problematicIndicators.forEach(indicator => {
        console.log(`\n[${indicator.status}] ${indicator.code}`);
        console.log(`  Enunciado: ${indicator.statement}`);
        console.log(`  ObjectiveId: ${indicator.objectiveId}`);
        console.log(`  ActionId: ${indicator.actionId}`);
        console.log(`  Problema: ${indicator.issue}`);
        if (indicator.objective) {
          console.log(`  Objetivo: ${indicator.objective.code}`);
        }
        if (indicator.action) {
          console.log(`  Acción: ${indicator.action.code}`);
        }
      });
    }

    // Si hay doble vinculación, preguntar si corregir
    if (summary.doubleLinked > 0) {
      console.log('\n=== CORRECCIÓN AUTOMÁTICA ===');
      console.log('Se encontraron indicadores con doble vinculación.');
      console.log('Para corregir automáticamente, ejecute: node fix-indicators.js');
    }

    return { summary, indicators: diagnosis };
    
  } catch (error) {
    console.error('Error al diagnosticar indicadores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  diagnoseIndicators();
}

module.exports = { diagnoseIndicators };
