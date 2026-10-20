-- AgroRent Phase 5: Driver & Farm Worker Booking Schema
-- Defines service_profiles and service_bookings tables with constraints, checks, and performance indexes

-- 1. Service Profiles Table (Drivers and Farm Workers)
CREATE TABLE IF NOT EXISTS service_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('DRIVER', 'FARM_WORKER')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    profile_image_url TEXT,
    description TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    skills TEXT NOT NULL,
    price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour > 0),
    price_per_day NUMERIC(10, 2) NOT NULL CHECK (price_per_day > 0),
    location VARCHAR(255) NOT NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE')),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'DISABLED')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Service Bookings Table
CREATE TABLE IF NOT EXISTS service_bookings (
    id VARCHAR(36) PRIMARY KEY,
    service_profile_id VARCHAR(36) NOT NULL REFERENCES service_profiles(id) ON DELETE CASCADE,
    farmer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('DRIVER', 'FARM_WORKER')),
    booking_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    duration_hours NUMERIC(6, 2) NOT NULL CHECK (duration_hours > 0),
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_per_hour >= 0),
    price_per_day NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_per_day >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    booking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'CASH_PENDING')),
    work_location VARCHAR(255) NOT NULL,
    work_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_service_user_id ON service_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_type ON service_profiles(service_type);
CREATE INDEX IF NOT EXISTS idx_service_approval_status ON service_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_service_availability_status ON service_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_service_location ON service_profiles(location);
CREATE INDEX IF NOT EXISTS idx_service_price_hour ON service_profiles(price_per_hour);
CREATE INDEX IF NOT EXISTS idx_service_created_at ON service_profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_service_bookings_profile ON service_bookings(service_profile_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_farmer ON service_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_provider ON service_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_created ON service_bookings(created_at);
