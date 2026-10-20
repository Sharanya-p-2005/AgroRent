-- AgroRent Phase 11: Admin Analytics, Audit Logs & Platform Management Schema

-- 1. Add status column to users table if not already present
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Synchronize users.status with existing is_active values
UPDATE users SET status = 'INACTIVE' WHERE is_active = false AND status = 'ACTIVE';

-- 2. Audit Logs Table (Append-only administrative and security action tracker)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 3. Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default platform settings
INSERT INTO platform_settings (id, setting_key, setting_value, description)
VALUES 
    (gen_random_uuid()::text, 'platform_name', 'AgroRent', 'Official platform title'),
    (gen_random_uuid()::text, 'default_currency', 'INR', 'Default system currency (INR)'),
    (gen_random_uuid()::text, 'default_language', 'en', 'Default system interface language'),
    (gen_random_uuid()::text, 'ai_enabled', 'true', 'Enable or disable AI Assistant platform-wide'),
    (gen_random_uuid()::text, 'maintenance_mode', 'false', 'Enable maintenance mode for non-admin users'),
    (gen_random_uuid()::text, 'notification_email_enabled', 'true', 'Enable platform system notification broadcasts')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Query Performance Indexes for Analytics Aggregations
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_equipment_bookings_created ON equipment_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_pay_status ON equipment_bookings(payment_status);

CREATE INDEX IF NOT EXISTS idx_animal_orders_pay_status ON animal_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_service_bookings_created ON service_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_service_bookings_pay_status ON service_bookings(payment_status);

CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(payment_status, created_at);
