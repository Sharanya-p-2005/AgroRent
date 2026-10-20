-- AgroRent Phase 12: Production Readiness, Indexes & Constraints
-- Ensures all primary query patterns, relations, and filters are covered by optimized indexes

-- 1. Users Table Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 2. Equipment & Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_owner_id ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_approval_status ON equipment(approval_status);
CREATE INDEX IF NOT EXISTS idx_equipment_availability_status ON equipment(availability_status);

CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON equipment_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON equipment_bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_equipment_id ON equipment_bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON equipment_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON equipment_bookings(booking_status);

-- 3. Animal Listings & Orders Indexes
CREATE INDEX IF NOT EXISTS idx_animal_seller_id ON animal_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_animal_category ON animal_listings(category);
CREATE INDEX IF NOT EXISTS idx_animal_approval_status ON animal_listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_animal_availability_status ON animal_listings(availability_status);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON animal_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON animal_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON animal_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON animal_orders(order_status);

-- 4. Service Profiles & Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_service_user_id ON service_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_type ON service_profiles(service_type);
CREATE INDEX IF NOT EXISTS idx_service_approval_status ON service_profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_service_bookings_farmer ON service_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_provider ON service_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_type ON service_bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(booking_date);

-- 5. Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- 6. Notifications, Favorites & Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item ON favorites(item_type, item_id);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);

-- 7. Government Schemes Indexes
CREATE INDEX IF NOT EXISTS idx_schemes_status ON government_schemes(status);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON government_schemes(category);

-- 8. Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 9. Delivery Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(animal_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_driver_id ON delivery_tracking(driver_id);

-- 10. AI Messages & Usage Logs Indexes
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);
