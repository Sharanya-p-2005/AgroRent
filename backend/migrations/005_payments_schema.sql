-- AgroRent Phase 6: Payments & Dynamic UPI QR Schema
-- Defines payments table with constraints, checks, and performance indexes

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('EQUIPMENT', 'ANIMAL_ORDER', 'DRIVER', 'FARM_WORKER')),
    equipment_booking_id VARCHAR(36) REFERENCES equipment_bookings(id) ON DELETE SET NULL,
    animal_order_id VARCHAR(36) REFERENCES animal_orders(id) ON DELETE SET NULL,
    service_booking_id VARCHAR(36) REFERENCES service_bookings(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('RAZORPAY', 'UPI', 'CASH')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CASH_PENDING')),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    upi_transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure payment is associated with exactly one business entity
    CONSTRAINT chk_payment_single_target CHECK (
        (CASE WHEN equipment_booking_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN animal_order_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN service_booking_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Performance & Query Optimization Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_payment ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_eq_booking ON payments(equipment_booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_animal_order ON payments(animal_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_service_booking ON payments(service_booking_id);
