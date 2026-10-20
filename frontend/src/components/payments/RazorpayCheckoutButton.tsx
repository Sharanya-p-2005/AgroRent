import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { PaymentRecord } from '../../types/payment';

interface RazorpayCheckoutButtonProps {
  payment: PaymentRecord;
  onSuccess: (updatedPayment: PaymentRecord) => void;
  onError?: (errorMessage: string) => void;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  payment,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleInitiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create order on backend (strictly backend calculated amount)
      const res = await paymentApi.createRazorpayOrder({
        payment_reference: payment.payment_reference,
      });

      const orderData = res.data.data;
      setPendingOrderData(orderData);

      // Check if real Razorpay SDK is available and key is configured (not purely sandbox mock)
      const hasRealRazorpay =
        typeof (window as any).Razorpay === 'function' &&
        orderData.key_id &&
        !orderData.key_id.includes('sandbox') &&
        !orderData.is_test_mode;

      if (hasRealRazorpay) {
        const options = {
          key: orderData.key_id,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || 'INR',
          name: 'AgroRent',
          description: `Payment for Reference ${payment.payment_reference}`,
          order_id: orderData.razorpay_order_id,
          handler: async (response: any) => {
            await handleVerification({
              payment_reference: payment.payment_reference,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          prefill: {
            name: payment.payer_name || '',
            email: payment.payer_email || '',
            contact: payment.payer_phone || '',
          },
          theme: {
            color: '#166534',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setLoading(false);
          const failMsg = response.error?.description || 'Payment was declined or failed';
          setError(failMsg);
          onError?.(failMsg);
        });
        rzp.open();
      } else {
        // Test / Sandbox mode modal
        setShowSimulatedModal(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Razorpay checkout';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (verifyPayload: {
    payment_reference: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Cryptographic verification on backend
      const verifyRes = await paymentApi.verifyRazorpayPayment(verifyPayload);

      setShowSimulatedModal(false);
      onSuccess(verifyRes.data.payment);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Payment signature verification failed on backend';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = () => {
    if (!pendingOrderData) return;
    const testPaymentId = `pay_test_${Date.now()}`;
    const testSignature = `sig_test_${Date.now()}_razorpay_sandbox_verified`;

    handleVerification({
      payment_reference: payment.payment_reference,
      razorpay_order_id: pendingOrderData.razorpay_order_id,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: testSignature,
    });
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        id="btn-razorpay-checkout"
        onClick={handleInitiatePayment}
        disabled={loading || payment.payment_status === 'PAID'}
        className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-medium rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting securely...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ₹{Number(payment.amount).toLocaleString('en-IN')} with Razorpay</span>
          </>
        )}
      </button>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-neutral-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>256-bit encrypted • UPI, Cards, NetBanking, Wallets supported</span>
      </div>

      {/* Simulated Sandbox Checkout Modal (when in Sandbox/Test Mode) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Razorpay Test Checkout</h3>
                  <p className="text-xs text-neutral-500">Secure Sandbox Environment</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                Test Mode
              </span>
            </div>

            <div className="my-5 space-y-3">
              <div className="p-3 bg-neutral-50 rounded-lg text-xs space-y-1.5 border border-neutral-200">
                <div className="flex justify-between text-neutral-600">
                  <span>Payment Ref:</span>
                  <span className="font-mono text-neutral-900">{payment.payment_reference}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Order ID:</span>
                  <span className="font-mono text-neutral-900 truncate max-w-[200px]">
                    {pendingOrderData?.razorpay_order_id}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-900 font-semibold text-sm pt-1 border-t border-neutral-200">
                  <span>Amount to Pay:</span>
                  <span className="text-emerald-700">₹{Number(payment.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                In this sandbox preview, you can test immediate payment confirmation. The backend will
                cryptographically process and verify the transaction atomically.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSimulatedModal(false)}
                disabled={loading}
                className="flex-1 py-2.5 px-3 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-simulate-razorpay-success"
                onClick={handleSimulateSuccess}
                disabled={loading}
                className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
