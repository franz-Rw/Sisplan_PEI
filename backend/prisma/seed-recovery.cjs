const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Recuperando datos desde GitHub...');
  
  // Crear usuario admin por defecto (del GitHub)
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@sisplan.local' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Password@2026', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@sisplan.local',
        name: 'Administrador SISPLAN',
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: true,
        lastPasswordChange: null,
        securityQuestion: '',
        securityAnswer: '',
      },
    });

    console.log('Usuario admin recuperado:');
    console.log(`Email: ${admin.email}`);
    console.log(`Contraseña: Password@2026`);
    console.log(`Rol: ${admin.role}`);
  } else {
    console.log('El usuario admin ya existe');
  }

  // Crear algunos usuarios operadores básicos
  const operatorUsers = [
    {
      email: 'operator1@sisplan.local',
      name: 'Operador 1',
      role: 'OPERATOR'
    },
    {
      email: 'operator2@sisplan.local', 
      name: 'Operador 2',
      role: 'OPERATOR'
    }
  ];

  for (const operatorData of operatorUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: operatorData.email },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('operator123', 10);
      
      await prisma.user.create({
        data: {
          email: operatorData.email,
          name: operatorData.name,
          password: hashedPassword,
          role: operatorData.role,
          mustChangePassword: true,
          lastPasswordChange: null,
          securityQuestion: '',
          securityAnswer: '',
        },
      });
      
      console.log(`Usuario operador creado: ${operatorData.email}`);
    }
  }

  // Verificar usuarios creados
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total usuarios recuperados: ${users.length}`);
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role}) - ${user.status}`);
  });
}

main()
  .catch((e) => {
    console.error('Error en recuperación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
