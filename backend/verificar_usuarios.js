const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarUsuarios() {
  try {
    console.log('=== VERIFICANDO USUARIOS EXISTENTES ===');
    
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        costCenter: {
          select: {
            id: true,
            code: true,
            description: true
          }
        }
      },
      orderBy: { email: 'asc' }
    });
    
    console.log(`Total de usuarios: ${usuarios.length}`);
    console.log('\nUSUARIOS DISPONIBLES:');
    console.log('=====================================');
    
    usuarios.forEach(usuario => {
      console.log(`Email: ${usuario.email}`);
      console.log(`Nombre: ${usuario.name}`);
      console.log(`Rol: ${usuario.role}`);
      console.log(`Estado: ${usuario.status}`);
      console.log(`Centro de costo: ${usuario.costCenter ? `${usuario.costCenter.code} - ${usuario.costCenter.description}` : 'No asignado'}`);
      console.log('Contraseña: temp123');
      console.log('-------------------------------------');
    });
    
  } catch (error) {
    console.error('Error al verificar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarUsuarios();
