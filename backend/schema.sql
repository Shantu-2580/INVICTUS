-- PCB Inventory Automation & Consumption Analytics System
-- Database Schema

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. COMPONENTS TABLE
-- ============================================
CREATE TABLE components (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    monthly_required_quantity INTEGER NOT NULL DEFAULT 0 CHECK (monthly_required_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_components_part_number ON components(part_number);

-- ============================================
-- 3. PCBS TABLE
-- ============================================
CREATE TABLE pcbs (
    id SERIAL PRIMARY KEY,
    pcb_name VARCHAR(255) UNIQUE NOT NULL,
    revision VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. PCB_COMPONENTS (BOM Mapping)
-- ============================================
CREATE TABLE pcb_components (
    id SERIAL PRIMARY KEY,
    pcb_id INTEGER NOT NULL REFERENCES pcbs(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    quantity_per_pcb INTEGER NOT NULL CHECK (quantity_per_pcb > 0),
    UNIQUE(pcb_id, component_id)
);

-- Indexes for foreign keys
CREATE INDEX idx_pcb_components_pcb_id ON pcb_components(pcb_id);
CREATE INDEX idx_pcb_components_component_id ON pcb_components(component_id);

-- ============================================
-- 5. PRODUCTION_LOGS TABLE
-- ============================================
CREATE TABLE production_logs (
    id SERIAL PRIMARY KEY,
    pcb_id INTEGER NOT NULL REFERENCES pcbs(id) ON DELETE RESTRICT,
    quantity_produced INTEGER NOT NULL CHECK (quantity_produced > 0),
    produced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for production queries
CREATE INDEX idx_production_logs_pcb_id ON production_logs(pcb_id);
CREATE INDEX idx_production_logs_produced_at ON production_logs(produced_at);

-- ============================================
-- 6. CONSUMPTION_HISTORY TABLE
-- ============================================
CREATE TABLE consumption_history (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    production_log_id INTEGER NOT NULL REFERENCES production_logs(id) ON DELETE CASCADE,
    quantity_deducted INTEGER NOT NULL CHECK (quantity_deducted > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics queries
CREATE INDEX idx_consumption_history_component_id ON consumption_history(component_id);
CREATE INDEX idx_consumption_history_production_log_id ON consumption_history(production_log_id);
CREATE INDEX idx_consumption_history_created_at ON consumption_history(created_at);

-- ============================================
-- 7. PROCUREMENT_TRIGGERS TABLE
-- ============================================
CREATE TABLE procurement_triggers (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    trigger_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    UNIQUE(component_id, status)
);

-- Index for querying open triggers
CREATE INDEX idx_procurement_triggers_status ON procurement_triggers(status);
CREATE INDEX idx_procurement_triggers_component_id ON procurement_triggers(component_id);

-- ============================================
-- SAMPLE ADMIN USER (for testing)
-- Password: admin123 (will be hashed by application)
-- ============================================
-- INSERT INTO users (name, email, password, role) 
-- VALUES ('Admin User', 'admin@pcbinventory.com', '$2b$10$...', 'admin');
