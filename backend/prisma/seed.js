import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de datos...');
    // Crear usuario admin por defecto
    const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@sisplan.local' },
    });
    if (existingAdmin) {
        console.log('✅ Admin ya existe, saltando seed');
        return;
    }
    const hashedPassword = await bcrypt.hash('Password@2026', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@sisplan.local',
            name: 'Administrador SISPLAN',
            password: hashedPassword,
            role: 'ADMIN',
            mustChangePassword: true, // NUEVO: obliga cambio de contraseña
            lastPasswordChange: null,
            securityQuestion: '', // Se configura en primer login
            securityAnswer: '',
        },
    });
    console.log('✅ Usuario admin creado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Contraseña temporal: Password@2026`);
    console.log(`   ⚠️  IMPORTANTE: Debe cambiar al primer login`);
}
main()
    .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
