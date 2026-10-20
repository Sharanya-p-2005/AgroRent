import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, ExternalLink, Send, AlertCircle, Loader2 } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { PaymentRecord, UpiQrResponse } from '../../types/payment';

interface DynamicUpiQrProps {
  payment: PaymentRecord;
  onUpiSubmitted: (updatedPayment: PaymentRecord) => void;
}

export const DynamicUpiQr: React.FC<DynamicUpiQrProps> = ({ payment, onUpiSubmitted }) => {
  const [qrData, setQrData] = useState<UpiQrResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchUpiQr();
  }, [payment.payment_reference]);

  const fetchUpiQr = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await paymentApi.getUpiQr(payment.payment_reference);
      setQrData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate dynamic UPI QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    if (!qrData?.upi_id) return;
    navigator.clipboard.writeText(qrData.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) return;

    try {
      setSubmittingUtr(true);
      setError(null);

      const res = await paymentApi.submitUpiPayment(
        payment.payment_reference,
        utrNumber.trim()
      );

      setSubmitSuccess(true);
      onUpiSubmitted(res.data.payment);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit UPI transaction reference');
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        <span className="text-sm font-medium">Generating dynamic UPI QR...</span>
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* QR Code Container */}
      <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm flex flex-col items-center max-w-xs w-full">
        <div className="flex items-center gap-2 mb-3">
          <QrCode className="w-5 h-5 text-emerald-700" />
          <span className="font-semibold text-neutral-900 text-sm">Scan with any UPI App</span>
        </div>

        {qrData?.qr_data_url ? (
          <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-inner">
            <img
              src={qrData.qr_data_url}
              alt="Dynamic UPI QR Code"
              className="w-56 h-56 object-contain"
            />
          </div>
        ) : (
          <div className="w-56 h-56 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400">
            QR unavailable
          </div>
        )}

        <div className="mt-4 text-center">
          <span className="text-xs text-neutral-500 block">Exact Transaction Amount</span>
          <span className="text-2xl font-bold text-neutral-900">
            ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Deep link for mobile users */}
        {qrData?.upi_url && (
          <a
            href={qrData.upi_url}
            className="mt-3 w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open in UPI App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* UPI ID Copy Bar */}
      <div className="mt-4 w-full max-w-sm bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center justify-between">
        <div className="overflow-hidden">
          <span className="text-[11px] text-neutral-500 block">Merchant UPI ID</span>
          <span className="font-mono text-xs font-medium text-neutral-800 truncate block">
            {qrData?.upi_id || 'agrorent@upi'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyUpi}
          className="py-1.5 px-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 ml-2"
        >
          {copiedUpi ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Manual UPI UTR Submission Form */}
      <div className="mt-5 w-full max-w-sm">
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wide mb-1">
            Already Paid via UPI?
          </h4>
          <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
            Enter your 12-digit UPI reference (UTR / Transaction ID) to register your payment. Status will remain{' '}
            <span className="font-semibold text-amber-700">Pending</span> until verified by accounts.
          </p>

          {submitSuccess ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">UPI reference registered!</p>
                <p className="text-neutral-600 mt-0.5">
                  Verification is under review by accounts. You can check status on your dashboard anytime.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitUtr} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 328491029481"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  maxLength={30}
                  className="flex-1 py-2 px-3 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                />
                <button
                  type="submit"
                  disabled={submittingUtr || !utrNumber.trim()}
                  className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {submittingUtr ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
