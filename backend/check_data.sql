-- Verificar datos en la base de datos
SELECT 
  'indicators' as table_name, 
  COUNT(*) as count 
FROM indicators 
UNION ALL
SELECT 
  'indicator_variables' as table_name, 
  COUNT(*) as count 
FROM indicator_variables 
UNION ALL
SELECT 
  'indicator_data' as table_name, 
  COUNT(*) as count 
FROM indicator_data;

-- Verificar datos pendientes en indicator_data
SELECT 
  status, 
  COUNT(*) as count 
FROM indicator_data 
GROUP BY status;

-- Verificar estructura de indicator_data
SELECT 
  id, 
  variableId, 
  costCenterId, 
  costCenterCode, 
  year, 
  status, 
  createdAt,
  createdBy
FROM indicator_data 
ORDER BY createdAt DESC 
LIMIT 5;
