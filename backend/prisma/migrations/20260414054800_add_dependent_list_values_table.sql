-- Crear tabla para valores de listas dependientes múltiples
-- Esta tabla almacena la estructura de árbol n-ario para las listas dependientes

CREATE TABLE dependent_list_values (
    id VARCHAR(191) PRIMARY KEY NOT NULL DEFAULT (cuid()),
    variable_id VARCHAR(191) NOT NULL,
    node_id VARCHAR(191) NOT NULL,
    parent_id VARCHAR(191),
    level INTEGER NOT NULL,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL,

    -- Clave foránea para la relación con la variable
    FOREIGN KEY (variable_id) REFERENCES indicator_variables(id) ON DELETE CASCADE,
    
    -- Clave foránea para la relación padre-hijo
    FOREIGN KEY (parent_id) REFERENCES dependent_list_values(id) ON DELETE CASCADE,
    
    -- Índices para optimizar consultas
    INDEX idx_dependent_list_values_variable_id (variable_id),
    INDEX idx_dependent_list_values_parent_id (parent_id),
    INDEX idx_dependent_list_values_level (level),
    INDEX idx_dependent_list_values_node_id (node_id),
    
    -- Restricción para evitar ciclos en el árbol
    CHECK (parent_id IS NULL OR parent_id != id)
);

-- Comentario sobre la estructura
COMMENT ON TABLE dependent_list_values IS 'Almacena los valores de las listas dependientes múltiples en estructura de árbol n-ario';
