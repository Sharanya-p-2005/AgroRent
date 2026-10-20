-- AgroRent Phase 13: Advanced Features, Profiles, Notification Preferences & Reviews Schema

-- 1. Farmer Profile Enhancements
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS farm_size NUMERIC(8,2);
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS soil_type VARCHAR(100);
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(100);
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(20) DEFAULT 'en';
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS main_crops TEXT;

-- 2. Owner Profile Enhancements
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. User Avatar / Profile Image
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- 4. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    booking_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    order_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    payment_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    scheme_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    system_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notification_preferences ALTER COLUMN id TYPE VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- 5. Reviews Table Enhancements
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS report_reason TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP WITH TIME ZONE;

-- Seed default notification preferences for existing users
INSERT INTO notification_preferences (id, user_id, booking_notifications, order_notifications, payment_notifications, delivery_notifications, scheme_notifications, system_notifications, created_at, updated_at)
SELECT 
    CONCAT('pref-', u.id),
    u.id,
    true,
    true,
    true,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u
ON CONFLICT (user_id) DO NOTHING;
