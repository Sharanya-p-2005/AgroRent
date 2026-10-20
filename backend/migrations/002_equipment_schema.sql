-- AgroRent Phase 3: Equipment Rental Schema
-- Defines equipment and equipment_bookings tables with constraints and indexes

-- 1. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    model VARCHAR(100),
    image_url TEXT,
    price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour > 0),
    location VARCHAR(255) NOT NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE')),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Equipment Bookings Table
CREATE TABLE IF NOT EXISTS equipment_bookings (
    id VARCHAR(36) PRIMARY KEY,
    equipment_id VARCHAR(36) NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    farmer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    duration_hours NUMERIC(6, 2) NOT NULL CHECK (duration_hours > 0),
    price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour > 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    booking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'CASH_PENDING')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_equipment_owner_id ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_approval_status ON equipment(approval_status);
CREATE INDEX IF NOT EXISTS idx_equipment_availability_status ON equipment(availability_status);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location);
CREATE INDEX IF NOT EXISTS idx_equipment_price ON equipment(price_per_hour);

CREATE INDEX IF NOT EXISTS idx_bookings_equipment_id ON equipment_bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON equipment_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON equipment_bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON equipment_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON equipment_bookings(booking_status);
