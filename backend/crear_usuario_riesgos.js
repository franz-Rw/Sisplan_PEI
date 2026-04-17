const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function crearUsuarioRiesgos() {
  try {
    console.log('=== CREANDO USUARIO RIESGOS ===');
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email: 'riesgos@sisplan.pe' }
    });
    
    if (usuarioExistente) {
      console.log('✅ El usuario riesgos@sisplan.pe ya existe');
      console.log('ID:', usuarioExistente.id);
      console.log('Nombre:', usuarioExistente.name);
      console.log('Rol:', usuarioExistente.role);
      console.log('Centro de costo:', usuarioExistente.costCenterId);
      return;
    }
    
    // Buscar centro de costo para "Subgerencia de Gestión de Riesgos de Desastres"
    const centroCosto = await prisma.costCenter.findFirst({
      where: {
        OR: [
          { description: { contains: 'riesgos', mode: 'insensitive' } },
          { description: { contains: 'desastres', mode: 'insensitive' } },
          { code: '02.3.7.6' }
        ]
      }
    });
    
    if (!centroCosto) {
      console.log('❌ No se encontró centro de costo para riesgos. Creando uno...');
      
      // Crear centro de costo si no existe
      const nuevoCentroCosto = await prisma.costCenter.create({
        data: {
          code: '02.3.7.6',
          description: 'Subgerencia de Gestión de Riesgos de Desastres',
          status: 'ACTIVO'
        }
      });
      
      console.log('✅ Centro de costo creado:', nuevoCentroCosto.id);
      var centroCostoId = nuevoCentroCosto.id;
    } else {
      console.log('✅ Centro de costo encontrado:', centroCosto.id, '-', centroCosto.description);
      var centroCostoId = centroCosto.id;
    }
    
    // Crear el usuario
    const hashedPassword = await bcrypt.hash('Muni2025', 10);
    
    const nuevoUsuario = await prisma.user.create({
      data: {
        name: 'Usuario de Riesgos',
        email: 'riesgos@sisplan.pe',
        password: hashedPassword,
        role: 'OPERATOR',
        costCenterId: centroCostoId,
        status: 'ACTIVO'
      },
      include: {
        costCenter: {
          select: {
            id: true,
            code: true,
            description: true
          }
        }
      }
    });
    
    console.log('✅ Usuario creado exitosamente:');
    console.log('ID:', nuevoUsuario.id);
    console.log('Email:', nuevoUsuario.email);
    console.log('Nombre:', nuevoUsuario.name);
    console.log('Rol:', nuevoUsuario.role);
    console.log('Centro de costo:', nuevoUsuario.costCenter.description);
    console.log('Contraseña: Muni2025');
    
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearUsuarioRiesgos();
