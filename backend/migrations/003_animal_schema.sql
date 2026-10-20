-- AgroRent Phase 4: Animal & Bird Marketplace Schema
-- Defines animal_listings and animal_orders tables with constraints, checks, and performance indexes

-- 1. Animal & Bird Listings Table
CREATE TABLE IF NOT EXISTS animal_listings (
    id VARCHAR(36) PRIMARY KEY,
    seller_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('ANIMAL', 'BIRD')),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(100),
    age VARCHAR(50) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    location VARCHAR(255) NOT NULL,
    image_url TEXT,
    health_status VARCHAR(255),
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'SOLD', 'UNAVAILABLE')),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'DISABLED')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Animal & Bird Orders Table
CREATE TABLE IF NOT EXISTS animal_orders (
    id VARCHAR(36) PRIMARY KEY,
    buyer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id VARCHAR(36) NOT NULL REFERENCES animal_listings(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    order_status VARCHAR(20) NOT NULL DEFAULT 'PLACED' CHECK (order_status IN ('PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'CASH_ON_DELIVERY')),
    delivery_name VARCHAR(255) NOT NULL,
    delivery_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(100) NOT NULL,
    delivery_pincode VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_animal_seller_id ON animal_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_animal_listing_type ON animal_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_animal_category ON animal_listings(category);
CREATE INDEX IF NOT EXISTS idx_animal_approval_status ON animal_listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_animal_availability_status ON animal_listings(availability_status);
CREATE INDEX IF NOT EXISTS idx_animal_location ON animal_listings(location);
CREATE INDEX IF NOT EXISTS idx_animal_price ON animal_listings(price);
CREATE INDEX IF NOT EXISTS idx_animal_created_at ON animal_listings(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON animal_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON animal_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON animal_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON animal_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON animal_orders(created_at);
