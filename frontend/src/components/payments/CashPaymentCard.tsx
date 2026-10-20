import React, { useState } from 'react';
import { Banknote, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { PaymentRecord } from '../../types/payment';

interface CashPaymentCardProps {
  payment: PaymentRecord;
  onCashSelected: (updatedPayment: PaymentRecord) => void;
}

export const CashPaymentCard: React.FC<CashPaymentCardProps> = ({
  payment,
  onCashSelected,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyCash = payment.payment_status === 'CASH_PENDING';

  const handleSelectCash = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await paymentApi.selectCashPayment(payment.payment_reference);
      onCashSelected(res.data.payment);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record cash payment preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 text-neutral-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 text-base">Pay by Hand (Cash)</h3>
            <p className="text-xs text-neutral-600">Hand-to-hand settlement upon service completion or delivery</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200/70 mb-5 space-y-2 text-xs leading-relaxed text-neutral-700">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="font-medium text-neutral-500">Payable Amount:</span>
            <span className="font-bold text-neutral-900 text-sm">
              ₹{Number(payment.amount).toLocaleString('en-IN')}
            </span>
          </div>
          <p>
            When selecting cash, you agree to pay the provider or driver directly in hand upon arrival or
            job completion.
          </p>
          <div className="pt-2 flex items-start gap-2 text-amber-900 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200/50">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Cash payment selected. Payment will be confirmed by the service provider/admin.
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isAlreadyCash ? (
          <div className="py-3 px-4 bg-amber-100/70 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-amber-300">
            <CheckCircle2 className="w-4 h-4 text-amber-800" />
            <span>Cash option recorded (Status: Cash Pending)</span>
          </div>
        ) : (
          <button
            type="button"
            id="btn-select-cash-payment"
            onClick={handleSelectCash}
            disabled={loading || payment.payment_status === 'PAID'}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Banknote className="w-4 h-4" />
                <span>Confirm Pay by Hand (Cash)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
