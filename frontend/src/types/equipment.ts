export type EquipmentCategory =
  | 'Tractor'
  | 'Harvester'
  | 'Rotavator'
  | 'Cultivator'
  | 'Water Pump'
  | 'JCB'
  | 'Power Tiller'
  | 'Seeder'
  | 'Sprayer'
  | 'Baler'
  | 'Thresher'
  | 'Plough'
  | 'Other';

export type AvailabilityStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
export type ApprovalStatus = 'PENDING_APPROVAL' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Equipment {
  id: string;
  owner_id: string;
  name: string;
  category: EquipmentCategory | string;
  description: string;
  brand: string;
  model: string;
  image_url: string;
  price_per_hour: number;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  availability_status: AvailabilityStatus;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_phone?: string;
  owner_village?: string;
  owner_district?: string;
}

export interface Booking {
  id: string;
  equipment_id: string;
  farmer_id: string;
  owner_id: string;
  start_time: string;
  end_time: string;
  booking_date?: string;
  total_hours: number;
  duration_hours?: number;
  price_per_hour: number;
  total_amount: number;
  status: BookingStatus;
  booking_status?: string;
  payment_status?: string;
  delivery_location?: string;
  destination_latitude?: number | null;
  destination_longitude?: number | null;
  distance_km?: number | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  equipment_name?: string;
  equipment_category?: string;
  equipment_image_url?: string;
  equipment_brand?: string;
  equipment_model?: string;
  equipment_location?: string;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_village?: string;
  farmer_district?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_village?: string;
  owner_district?: string;
}

export interface OwnerEarnings {
  total_earnings: number;
  totalEarnings?: number;
  completed_bookings_count: number;
  completedBookings?: number;
  active_bookings_count: number;
  confirmedBookings?: number;
  pending_bookings_count: number;
  pendingBookings?: number;
  equipment_breakdown: Array<{
    id: string;
    name: string;
    category: string;
    bookings_count: number;
    total_earned: number;
  }>;
}
