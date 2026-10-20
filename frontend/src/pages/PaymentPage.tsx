import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Calendar,
  MapPin,
  User,
  Loader2,
} from 'lucide-react';
import { paymentApi } from '../services/api';
import { PaymentRecord, PaymentMethod } from '../types/payment';
import { PaymentStatusBadge } from '../components/payments/PaymentStatusBadge';
import { RazorpayCheckoutButton } from '../components/payments/RazorpayCheckoutButton';
import { DynamicUpiQr } from '../components/payments/DynamicUpiQr';
import { CashPaymentCard } from '../components/payments/CashPaymentCard';

export const PaymentPage: React.FC = () => {
  const { paymentReference } = useParams<{ paymentReference: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'RAZORPAY' | 'UPI' | 'CASH'>('RAZORPAY');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (paymentReference) {
      loadPayment();
    }
  }, [paymentReference]);

  const loadPayment = async () => {
    if (!paymentReference) return;
    try {
      setLoading(true);
      setError(null);
      const res = await paymentApi.getDetails(paymentReference);
      setPayment(res.data.payment);
    } catch (err: any) {
      console.error('[PaymentPage Error]', err);
      setError(err.response?.data?.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (updatedPayment: PaymentRecord) => {
    setPayment(updatedPayment);
  };

  const handleRetry = async () => {
    if (!paymentReference) return;
    try {
      setRetrying(true);
      setError(null);
      const res = await paymentApi.retryPayment(paymentReference);
      setPayment(res.data.payment);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retry payment');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-800" />
          <p className="text-sm text-neutral-600 font-medium">Securing payment gateway...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Unable to Load Payment</h2>
          <p className="text-sm text-neutral-600 mb-6">{error || 'Payment reference not found.'}</p>
          <button
            type="button"
            onClick={() => navigate('/farmer/dashboard')}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Return to Farmer Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPaid = payment.payment_status === 'PAID';
  const isFailed = payment.payment_status === 'FAILED';
  const isCashPending = payment.payment_status === 'CASH_PENDING';

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Encrypted Checkout</span>
          </div>
        </div>

        {/* Status Alert for FAILED or CASH_PENDING */}
        {isFailed && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-semibold text-rose-900 text-sm">Payment Attempt Failed</p>
                <p className="text-xs text-rose-700">
                  Your transaction was not completed. You can safely retry with any payment method.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Receipt View (When status is PAID) */}
        {isPaid ? (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
            <div className="bg-emerald-800 text-white p-6 sm:p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-white text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Payment Confirmed!</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Your transaction was verified and recorded on the database.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/60 rounded-full text-xs font-mono text-emerald-100">
                <span>Ref: {payment.payment_reference}</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Receipt Details Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-neutral-200 text-sm">
                <div>
                  <span className="text-xs text-neutral-500 block">Service / Item</span>
                  <span className="font-semibold text-neutral-900">{payment.target_title || 'AgroRent Service'}</span>
                  {payment.target_subtitle && (
                    <span className="text-xs text-neutral-600 block">{payment.target_subtitle}</span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-neutral-500 block">Transaction Type</span>
                  <span className="font-semibold text-neutral-900 capitalize">
                    {payment.payment_type.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 block">Payment Method</span>
                  <span className="font-semibold text-neutral-900 capitalize">
                    {payment.payment_method}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 block">Payment Date</span>
                  <span className="font-semibold text-neutral-900">
                    {new Date(payment.updated_at || payment.created_at).toLocaleString('en-IN')}
                  </span>
                </div>

                {payment.razorpay_payment_id && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-neutral-500 block">Razorpay Payment ID</span>
                    <span className="font-mono text-xs text-neutral-800 bg-neutral-100 px-2 py-1 rounded inline-block mt-0.5">
                      {payment.razorpay_payment_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Paid Amount */}
              <div className="flex justify-between items-center py-2">
                <span className="text-base font-semibold text-neutral-900">Total Paid Amount:</span>
                <span className="text-2xl font-extrabold text-emerald-800">
                  ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Actions: Print & Return */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-4 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/farmer/dashboard')}
                  className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Go to My Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Payment Flow */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Summary Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-medium text-neutral-500">
                    Ref: {payment.payment_reference}
                  </span>
                  <PaymentStatusBadge status={payment.payment_status} size="sm" />
                </div>

                {/* Target Visual & Info */}
                {payment.target_image && (
                  <div className="w-full h-36 rounded-xl overflow-hidden mb-4 bg-neutral-100">
                    <img
                      src={payment.target_image}
                      alt={payment.target_title || 'Item'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h3 className="font-bold text-neutral-900 text-base leading-tight mb-1">
                  {payment.target_title || 'AgroRent Service'}
                </h3>
                {payment.target_subtitle && (
                  <p className="text-xs text-neutral-600 mb-4">{payment.target_subtitle}</p>
                )}

                <div className="space-y-2.5 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
                  {payment.target_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{payment.target_date}</span>
                    </div>
                  )}
                  {payment.target_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{payment.target_location}</span>
                    </div>
                  )}
                  {payment.recipient_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Recipient: {payment.recipient_name}</span>
                    </div>
                  )}
                </div>

                {/* Total Due Banner */}
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-800 block font-medium">Total Amount Due</span>
                    <span className="text-xs text-emerald-600">Calculated from verified booking</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-900">
                    ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Payment Options Column */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-neutral-900 mb-1">Select Payment Method</h2>
                <p className="text-xs text-neutral-500 mb-5">
                  Choose your preferred option below to complete this transaction securely.
                </p>

                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('RAZORPAY')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'RAZORPAY'
                        ? 'bg-white text-emerald-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Razorpay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('UPI')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'UPI'
                        ? 'bg-white text-emerald-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('CASH')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'CASH'
                        ? 'bg-white text-emerald-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </button>
                </div>

                {/* Active Tab Content */}
                {activeTab === 'RAZORPAY' && (
                  <div className="space-y-4">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Pay instantly with Debit Card, Credit Card, NetBanking, Google Pay, PhonePe, or
                      Paytm through Razorpay’s secure infrastructure.
                    </p>
                    <RazorpayCheckoutButton
                      payment={payment}
                      onSuccess={handlePaymentSuccess}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
                )}

                {activeTab === 'UPI' && (
                  <DynamicUpiQr
                    payment={payment}
                    onUpiSubmitted={(updated) => setPayment(updated)}
                  />
                )}

                {activeTab === 'CASH' && (
                  <CashPaymentCard
                    payment={payment}
                    onCashSelected={(updated) => setPayment(updated)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
