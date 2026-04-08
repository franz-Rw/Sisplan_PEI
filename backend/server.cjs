const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario en la base de datos real
    const user = await prisma.user.findUnique({
      where: { email },
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

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña (temporal para prueba)
    if (password === 'temp123' || password === user.password) {
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          costCenter: user.costCenter
        },
        token: 'temp-token-' + user.id
      });
    } else {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token || !token.startsWith('temp-token-')) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    const userId = token.replace('temp-token-', '');
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      costCenter: user.costCenter
    });
  } catch (error) {
    console.error('Error en perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Strategic objectives endpoint
app.get('/api/strategic-objectives', async (req, res) => {
  try {
    const objectives = await prisma.strategicObjective.findMany({
      include: {
        indicators: {
          where: {
            responsibleId: req.query.costCenterId || null
          }
        }
      }
    });
    res.json(objectives);
  } catch (error) {
    console.error('Error en objetivos:', error);
    res.status(500).json({ error: 'Error al obtener objetivos' });
  }
});

// Strategic actions endpoint
app.get('/api/strategic-actions', async (req, res) => {
  try {
    const actions = await prisma.strategicAction.findMany({
      include: {
        indicators: {
          where: {
            responsibleId: req.query.costCenterId || null
          }
        }
      }
    });
    res.json(actions);
  } catch (error) {
    console.error('Error en acciones:', error);
    res.status(500).json({ error: 'Error al obtener acciones' });
  }
});

// Indicators endpoint
app.get('/api/indicators/objective/:objectiveId', async (req, res) => {
  try {
    const { objectiveId } = req.params;
    const indicators = await prisma.indicator.findMany({
      where: { 
        objectiveId,
        responsibleId: req.query.costCenterId || null
      },
      include: {
        indicatorValues: true
      }
    });
    res.json(indicators);
  } catch (error) {
    console.error('Error en indicadores:', error);
    res.status(500).json({ error: 'Error al obtener indicadores' });
  }
});

app.get('/api/indicators/action/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const indicators = await prisma.indicator.findMany({
      where: { 
        actionId,
        responsibleId: req.query.costCenterId || null
      },
      include: {
        indicatorValues: true
      }
    });
    res.json(indicators);
  } catch (error) {
    console.error('Error en indicadores:', error);
    res.status(500).json({ error: 'Error al obtener indicadores' });
  }
});

// Test database connection
app.get('/api/test/db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const planCount = await prisma.strategicPlan.count();
    const objectiveCount = await prisma.strategicObjective.count();
    
    res.json({
      database: 'Connected',
      users: userCount,
      plans: planCount,
      objectives: objectiveCount,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      database: 'Error',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend minimalista corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`🗃️ Database test: http://localhost:${PORT}/api/test/db`);
  console.log('📝 NOTA: Backend sin TypeScript para evitar conflictos');
  console.log('🔑 Para login, usa cualquier email de usuario existente con contraseña: temp123');
});
