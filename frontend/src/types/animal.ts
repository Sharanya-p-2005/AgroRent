export type ListingType = 'ANIMAL' | 'BIRD';
export type AnimalGender = 'MALE' | 'FEMALE' | 'OTHER';
export type AnimalAvailabilityStatus = 'AVAILABLE' | 'SOLD' | 'UNAVAILABLE';
export type AnimalApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export type AnimalOrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
export type AnimalPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CASH_ON_DELIVERY';

export interface AnimalListing {
  id: string;
  seller_id: string;
  listing_type: ListingType;
  category: string;
  name: string;
  breed: string | null;
  age: string;
  gender: AnimalGender;
  description: string | null;
  price: number;
  quantity: number;
  location: string;
  image_url: string | null;
  health_status: string | null;
  availability_status: AnimalAvailabilityStatus;
  approval_status: AnimalApprovalStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;

  // Joined seller details
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  seller_village?: string;
  seller_district?: string;
}

export interface AnimalOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_status: AnimalOrderStatus;
  payment_status: AnimalPaymentStatus;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  created_at: string;
  updated_at: string;

  // Joined details
  listing_name?: string;
  listing_category?: string;
  listing_type?: string;
  listing_breed?: string;
  listing_image_url?: string;
  listing_health_status?: string;
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
}

export interface AnimalFilterState {
  search: string;
  listing_type: 'ALL' | 'ANIMAL' | 'BIRD';
  category: string;
  gender: 'ALL' | 'MALE' | 'FEMALE' | 'OTHER';
  location: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}
