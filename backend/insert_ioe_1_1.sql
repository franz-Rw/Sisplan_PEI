-- Script para insertar valores de ejemplo para el indicador IOE 1.1
-- Primero encontrar el ID del indicador
DO $$
DECLARE indicator_id TEXT;
SELECT id INTO indicator_id FROM indicators WHERE code = 'IOE 1.1' LIMIT 1;

-- Insertar valores para el indicador IOE 1.1
INSERT INTO indicator_values (id, "indicatorId", year, value, type, "createdAt", "updatedAt") VALUES
  gen_random_uuid(), indicator_id, 2024, 15.5, 'ABSOLUTE', NOW(), NOW()),
  gen_random_uuid(), indicator_id, 2024, 75.2, 'RELATIVE', NOW(), NOW()),
  gen_random_uuid(), indicator_id, 2025, 22.3, 'ABSOLUTE', NOW(), NOW()),
  gen_random_uuid(), indicator_id, 2025, 82.1, 'RELATIVE', NOW(), NOW()),
  gen_random_uuid(), indicator_id, 2026, 31.7, 'ABSOLUTE', NOW(), NOW()),
  gen_random_uuid(), indicator_id, 2026, 88.9, 'RELATIVE', NOW(), NOW()),
  gen_random_uuid(), indicator_id, 2027, 45.2, 'ABSOLUTE', NOW(), NOW()),
  gen_random_uuid(), indicator_id, 2027, 92.3, 'RELATIVE', NOW(), NOW());

-- Verificar los valores insertados
SELECT 
  i.code as indicator_code,
  i.statement as indicator_statement,
  iv.year,
  iv.value,
  iv.type
FROM indicators i
JOIN indicator_values iv ON i.id = iv."indicatorId"
WHERE i.code = 'IOE 1.1'
ORDER BY iv.year;

$$;
