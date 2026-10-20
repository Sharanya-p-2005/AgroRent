-- AgroRent Phase 9: Delivery Tracking, GPS & Location Services Schema
-- Defines user_locations, delivery_tracking tables and location enhancements for equipment, services, animal orders, and bookings

-- 1. User Saved Locations (Farms, Homes, Offices, etc.)
CREATE TABLE IF NOT EXISTS user_locations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL CHECK (label IN ('HOME', 'FARM', 'OFFICE', 'OTHER')),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_location_label UNIQUE (user_id, label)
);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_is_default ON user_locations(is_default);

-- 2. Enhance Animal Orders with Delivery Status & Dispatch Tracking
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION;
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION;
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS delivery_address_id VARCHAR(36) REFERENCES user_locations(id) ON DELETE SET NULL;
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30) DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'));
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS assigned_driver_id VARCHAR(36) REFERENCES service_profiles(id) ON DELETE SET NULL;
ALTER TABLE animal_orders ADD COLUMN IF NOT EXISTS delivery_managed_by VARCHAR(20) DEFAULT 'ADMIN' CHECK (delivery_managed_by IN ('ADMIN', 'OWNER'));

CREATE INDEX IF NOT EXISTS idx_animal_orders_delivery_status ON animal_orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_animal_orders_assigned_driver ON animal_orders(assigned_driver_id);

-- 3. Delivery Tracking History & Live GPS breadcrumbs
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id VARCHAR(36) PRIMARY KEY,
    animal_order_id VARCHAR(36) NOT NULL REFERENCES animal_orders(id) ON DELETE CASCADE,
    driver_id VARCHAR(36) REFERENCES service_profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    note TEXT,
    updated_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(animal_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_driver_id ON delivery_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_created_at ON delivery_tracking(created_at);

-- 4. Equipment Geolocation Coordinates
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 5. Service Profiles Geolocation & Service Radius
ALTER TABLE service_profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE service_profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE service_profiles ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC(6, 2) DEFAULT 25.00 CHECK (service_radius_km > 0);

-- 6. Equipment Bookings Destination/Farm Location
ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS farm_location VARCHAR(255);
ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS farm_address TEXT;
ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS farm_latitude DOUBLE PRECISION;
ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS farm_longitude DOUBLE PRECISION;
ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS farm_location_id VARCHAR(36) REFERENCES user_locations(id) ON DELETE SET NULL;
ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8, 2);

-- 7. Service Bookings Destination & Work Location
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS work_latitude DOUBLE PRECISION;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS work_longitude DOUBLE PRECISION;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS work_address_id VARCHAR(36) REFERENCES user_locations(id) ON DELETE SET NULL;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8, 2);
