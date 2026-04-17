-- Consulta para diagnosticar indicadores con doble vinculación
SELECT 
    i.id,
    i.code,
    i.statement,
    i.objectiveId,
    i.actionId,
    o.code as objective_code,
    a.code as action_code,
    CASE 
        WHEN i.objectiveId IS NOT NULL AND i.actionId IS NOT NULL THEN 'DOBLE VINCULACIÓN - ERROR'
        WHEN i.objectiveId IS NOT NULL AND i.actionId IS NULL THEN 'VINCULADO A OBJETIVO - CORRECTO'
        WHEN i.objectiveId IS NULL AND i.actionId IS NOT NULL THEN 'VINCULADO A ACCIÓN - CORRECTO'
        ELSE 'SIN VINCULACIÓN - ERROR'
    END as status
FROM indicators i
LEFT JOIN strategic_objectives o ON i.objectiveId = o.id
LEFT JOIN strategic_actions a ON i.actionId = a.id
ORDER BY 
    CASE 
        WHEN i.objectiveId IS NOT NULL AND i.actionId IS NOT NULL THEN 1
        ELSE 2
    END,
    i.code;

-- Consulta para contar indicadores por estado
SELECT 
    CASE 
        WHEN objectiveId IS NOT NULL AND actionId IS NOT NULL THEN 'DOBLE VINCULACIÓN'
        WHEN objectiveId IS NOT NULL AND actionId IS NULL THEN 'SOLO OBJETIVO'
        WHEN objectiveId IS NULL AND actionId IS NOT NULL THEN 'SOLO ACCIÓN'
        ELSE 'SIN VINCULACIÓN'
    END as vinculation_type,
    COUNT(*) as count
FROM indicators
GROUP BY 
    CASE 
        WHEN objectiveId IS NOT NULL AND actionId IS NOT NULL THEN 'DOBLE VINCULACIÓN'
        WHEN objectiveId IS NOT NULL AND actionId IS NULL THEN 'SOLO OBJETIVO'
        WHEN objectiveId IS NULL AND actionId IS NOT NULL THEN 'SOLO ACCIÓN'
        ELSE 'SIN VINCULACIÓN'
    END;

-- Script para corregir indicadores con doble vinculación
-- (Descomentar y ejecutar solo después de revisar los resultados anteriores)

/*
-- Corregir indicadores que tienen tanto objectiveId como actionId
-- Priorizar acción estratégica (eliminar objectiveId)
UPDATE indicators 
SET objectiveId = NULL 
WHERE objectiveId IS NOT NULL AND actionId IS NOT NULL;

-- O si prefieres priorizar objetivo estratégico (eliminar actionId)
-- UPDATE indicators 
-- SET actionId = NULL 
-- WHERE objectiveId IS NOT NULL AND actionId IS NOT NULL;
*/
