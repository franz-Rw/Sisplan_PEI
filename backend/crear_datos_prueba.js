const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearDatosPrueba() {
  try {
    console.log('=== CREANDO DATOS DE PRUEBA PARA ADMINISTRADOR ===');
    
    // 1. Verificar estado actual
    const datosPendientes = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      include: {
        variable: {
          include: {
            indicator: {
              select: {
                id: true,
                code: true,
                actionId: true,
                objectiveId: true,
                planId: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Datos pendientes actuales: ${datosPendientes.length}`);
    datosPendientes.forEach(record => {
      const tipo = record.variable.indicator.actionId ? 'ACCIÓN' : 'OBJETIVO';
      console.log(`- ${record.variable.code} (${tipo}): ${record.status}`);
    });
    
    // 2. Buscar una variable de objetivo para crear dato de prueba
    const variableObjetivo = await prisma.indicatorVariable.findFirst({
      where: {
        indicator: {
          actionId: null,  // Es de objetivo
          planId: 'cmnip8u98000sb3spdbt6wjyw'  // Plan activo
        }
      },
      include: {
        indicator: {
          select: {
            id: true,
            code: true,
            statement: true,
            actionId: true,
            objectiveId: true,
            planId: true
          }
        }
      }
    });
    
    if (variableObjetivo) {
      console.log(`\nVariable de objetivo encontrada: ${variableObjetivo.code}`);
      console.log(`Indicador: ${variableObjetivo.indicator.code}`);
      
      // 3. Verificar si ya existe un registro para esta variable y crear/update
      const existeRegistro = await prisma.indicatorData.findFirst({
        where: {
          variableId: variableObjetivo.id,
          costCenterId: 'cmnip1pol000rb3spn28o18br',
          year: 2025
        }
      });
      
      let nuevoDato;
      if (existeRegistro) {
        // Actualizar el registro existente a PENDING
        nuevoDato = await prisma.indicatorData.update({
          where: { id: existeRegistro.id },
          data: {
            status: 'PENDING',
            values: {},  // Valores vacíos para prueba
            updatedAt: new Date()
          },
          include: {
            variable: {
              include: {
                indicator: true
              }
            }
          }
        });
        console.log('\n📝 Registro existente actualizado a PENDING');
      } else {
        // Crear un nuevo registro con año diferente para evitar duplicidad
        nuevoDato = await prisma.indicatorData.create({
          data: {
            variableId: variableObjetivo.id,
            costCenterId: 'cmnip1pol000rb3spn28o18br',  // Centro de costo del operador
            costCenterCode: '02.3.7.6',  // Código del centro de costo
            year: 2024,  // Año diferente para evitar duplicidad
            values: {},  // Valores vacíos para prueba
            status: 'PENDING',
            createdBy: 'riesgos@sisplan.pe'
          },
        include: {
          variable: {
            include: {
              indicator: true
            }
          }
        }
      });
        console.log(`\n✅ Nuevo dato de prueba creado:`);
      }
      
      console.log(`- ID: ${nuevoDato.id}`);
      console.log(`- Variable: ${nuevoDato.variable.code}`);
      console.log(`- Indicador: ${nuevoDato.variable.indicator.code}`);
      console.log(`- Estado: ${nuevoDato.status}`);
      console.log(`- Centro: ${nuevoDato.costCenterId}`);
      
    } else {
      console.log('\n❌ No se encontraron variables de objetivos para crear datos de prueba');
    }
    
    // 4. Verificar resultado final
    const datosFinales = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      include: {
        variable: {
          include: {
            indicator: {
              select: {
                id: true,
                code: true,
                actionId: true,
                objectiveId: true,
                planId: true
              }
            }
          }
        }
      }
    });
    
    console.log(`\n=== RESULTADO FINAL ===`);
    console.log(`Total datos pendientes: ${datosFinales.length}`);
    
    const objetivos = datosFinales.filter(d => !d.variable.indicator.actionId);
    const acciones = datosFinales.filter(d => d.variable.indicator.actionId);
    
    console.log(`Datos de objetivos: ${objetivos.length}`);
    console.log(`Datos de acciones: ${acciones.length}`);
    
    if (objetivos.length > 0) {
      console.log('\n✅ El administrador ahora podrá ver datos en "Variables de Objetivos Estratégicos"');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearDatosPrueba();
