export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CASH_PENDING';

export type PaymentMethod = 'RAZORPAY' | 'UPI' | 'CASH';

export type PaymentType = 'EQUIPMENT' | 'ANIMAL_ORDER' | 'DRIVER' | 'FARM_WORKER';

export interface PaymentRecord {
  id: string;
  payment_reference: string;
  user_id: string;
  payment_type: PaymentType;
  equipment_booking_id?: string | null;
  animal_order_id?: string | null;
  service_booking_id?: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  upi_transaction_id?: string | null;
  created_at: string;
  updated_at: string;

  // Joined metadata for UI display
  payer_name?: string;
  payer_email?: string;
  payer_phone?: string;
  target_title?: string;
  target_subtitle?: string;
  target_image?: string;
  target_location?: string;
  target_date?: string;
  recipient_name?: string;
  recipient_phone?: string;
}

export interface RazorpayOrderResponse {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  payment_reference: string;
  is_test_mode: boolean;
}

export interface UpiQrResponse {
  qr_data_url: string;
  upi_url: string;
  upi_id: string;
  merchant_name: string;
  amount: number;
  payment_reference: string;
}

export interface OwnerPaymentSummary {
  total_paid_revenue: number;
  pending_cash_revenue: number;
  total_transactions: number;
  by_type: {
    EQUIPMENT: number;
    ANIMAL_ORDER: number;
    DRIVER: number;
    FARM_WORKER: number;
  };
}

export interface AdminPaymentStats {
  total_platform_revenue: number;
  total_paid_count: number;
  total_pending_count: number;
  total_failed_count: number;
  total_cash_pending_count: number;
  total_transactions: number;
  volume_by_method: {
    RAZORPAY: number;
    UPI: number;
    CASH: number;
  };
  volume_by_type: {
    EQUIPMENT: number;
    ANIMAL_ORDER: number;
    DRIVER: number;
    FARM_WORKER: number;
  };
}
