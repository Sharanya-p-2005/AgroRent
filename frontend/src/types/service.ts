export type ServiceType = 'DRIVER' | 'FARM_WORKER';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
export type ServiceBookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type ServicePaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CASH_PENDING';

export interface ServiceProfile {
  id: string;
  user_id: string;
  service_type: ServiceType;
  name: string;
  phone: string;
  profile_image_url?: string | null;
  description?: string | null;
  experience_years: number;
  skills: string;
  price_per_hour: number;
  price_per_day: number;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km?: number | null;
  distance_km?: number | null;
  availability_status: AvailabilityStatus;
  approval_status: ApprovalStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;

  // Provider info from join
  provider_name?: string;
  provider_phone?: string;
  provider_email?: string;
  provider_village?: string;
  provider_district?: string;
}

export interface CreateServiceProfileInput {
  service_type: ServiceType;
  name: string;
  phone: string;
  profile_image_url?: string;
  description?: string;
  experience_years: number;
  skills: string | string[];
  price_per_hour: number;
  price_per_day: number;
  location: string;
}

export interface UpdateServiceProfileInput {
  name?: string;
  phone?: string;
  profile_image_url?: string;
  description?: string;
  experience_years?: number;
  skills?: string | string[];
  price_per_hour?: number;
  price_per_day?: number;
  location?: string;
  availability_status?: AvailabilityStatus;
}

export interface ServiceBooking {
  id: string;
  service_profile_id: string;
  farmer_id: string;
  provider_id: string;
  service_type: ServiceType;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  price_per_hour: number;
  price_per_day: number;
  total_amount: number;
  booking_status: ServiceBookingStatus;
  payment_status: ServicePaymentStatus;
  work_location: string;
  work_description?: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  profile_name?: string;
  profile_phone?: string;
  profile_image_url?: string;
  profile_skills?: string;
  profile_experience?: number;
  provider_name?: string;
  provider_phone?: string;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_email?: string;
}

export interface CreateServiceBookingInput {
  service_profile_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours?: number;
  is_daily_booking?: boolean;
  number_of_days?: number;
  work_location: string;
  work_description?: string;
}

export interface ServiceEarningsSummary {
  total_earnings: number;
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  driver_bookings: number;
  worker_bookings: number;
  completed_bookings_list: ServiceBooking[];
}
