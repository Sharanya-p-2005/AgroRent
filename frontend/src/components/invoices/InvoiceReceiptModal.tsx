import React, { useState, useEffect } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';

export const InvoiceReceiptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  entityType: 'booking' | 'order' | 'service';
  entityId: string;
}> = ({ isOpen, onClose, entityType, entityId }) => {
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !entityId) return;

    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/invoices/${entityType}/${entityId}`);
        if (res.data?.success) {
          setInvoice(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load invoice receipt:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [isOpen, entityType, entityId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in duration-200 print:shadow-none print:border-none print:max-w-none print:max-h-none">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/80 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2 text-emerald-800">
            <FileText className="w-5 h-5" />
            <span className="font-bold text-sm">Official Tax Invoice & Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-8" id="printable-invoice">
          {loading ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs">Generating tax receipt and invoice statement...</p>
            </div>
          ) : invoice ? (
            <>
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b border-gray-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-2xl tracking-tight">
                    <span>AgroRent</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Smart Agricultural Marketplace & Rental Platform</p>
                  <p className="text-[11px] text-gray-400">Govt Reg: AGRO/KA/2026/0892 • GSTIN: 29AAACA0000A1Z5</p>
                  <p className="text-[11px] text-gray-400">APMC Mandi Road, Mandya, Karnataka - 571401</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-md uppercase tracking-wider">
                    {invoice.payment_status === 'PAID' || invoice.status === 'COMPLETED' ? 'TAX INVOICE (PAID)' : 'TAX INVOICE'}
                  </span>
                  <div className="text-sm font-bold text-gray-900 mt-2">
                    Invoice #{invoice.invoice_number}
                  </div>
                  <div className="text-xs text-gray-500">Date: {new Date(invoice.invoice_date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Bill To / Provider Info */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Billed To (Customer):</span>
                  <div className="font-bold text-gray-900 text-sm">{invoice.customer_name}</div>
                  <div className="text-gray-600 mt-0.5">{invoice.customer_phone}</div>
                  <div className="text-gray-500 text-[11px]">{invoice.customer_email || 'Verified Farmer Account'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Provider / Owner:</span>
                  <div className="font-bold text-gray-900 text-sm">{invoice.provider_name}</div>
                  <div className="text-gray-600 mt-0.5">{invoice.provider_phone}</div>
                  <div className="text-gray-500 text-[11px]">{invoice.provider_role || 'Registered Equipment Owner'}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-semibold text-gray-700">Item Description</th>
                      <th className="p-3 font-semibold text-gray-700 text-center">Period / Unit</th>
                      <th className="p-3 font-semibold text-gray-700 text-right">Unit Rate</th>
                      <th className="p-3 font-semibold text-gray-700 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-gray-900">
                          {item.description}
                          {item.category && <span className="block text-[11px] text-gray-500">{item.category}</span>}
                        </td>
                        <td className="p-3 text-center text-gray-600">
                          {item.quantity} {item.unit || 'unit'}
                        </td>
                        <td className="p-3 text-right text-gray-600">₹{item.unit_rate}</td>
                        <td className="p-3 text-right font-semibold text-gray-900">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{invoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Commission & Handling:</span>
                    <span>₹{invoice.platform_fee || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Applicable GST (Exempted under agri norms):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-base text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Paid:</span>
                    <span className="text-emerald-700">₹{invoice.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Payment details & verification stamp */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">Payment Verification</div>
                  <div className="text-gray-500 text-[11px] mt-0.5">
                    Method: <strong>{invoice.payment_method || 'UPI / Direct Settlement'}</strong>
                    {invoice.transaction_id && ` • Txn Ref: ${invoice.transaction_id}`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Digitally Certified</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                This is a computer generated invoice valid without physical signature under the Information Technology Act.
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              Unable to locate record details for invoice generation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
