-- Revisar estructura de la tabla indicators
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'indicators' 
ORDER BY ordinal_position;

-- Revisar estructura de la tabla indicator_values
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'indicator_values' 
ORDER BY ordinal_position;
