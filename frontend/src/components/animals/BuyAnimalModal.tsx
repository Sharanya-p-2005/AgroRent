import React, { useState } from 'react';
import { AnimalListing, AnimalOrder } from '../../types/animal.js';
import { animalApi } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import {
  X,
  ShoppingCart,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Truck,
  DollarSign
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

interface BuyAnimalModalProps {
  animal: AnimalListing | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: AnimalOrder) => void;
  onNavigateToOrders?: () => void;
}

export const BuyAnimalModal: React.FC<BuyAnimalModalProps> = ({
  animal,
  isOpen,
  onClose,
  onOrderSuccess,
  onNavigateToOrders,
}) => {
  const { user } = useAuth();
  const profile = user?.profile;

  const [quantity, setQuantity] = useState(1);
  const [deliveryName, setDeliveryName] = useState(user?.name || '');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState(profile?.village || profile?.district || '');
  const [deliveryState, setDeliveryState] = useState(profile?.state || 'Karnataka');
  const [deliveryPincode, setDeliveryPincode] = useState(profile?.pincode || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<AnimalOrder | null>(null);

  if (!isOpen || !animal) return null;

  const maxQty = Math.max(1, animal.quantity);
  const totalAmount = quantity * animal.price;

  const handleQtyChange = (val: number) => {
    const clamped = Math.max(1, Math.min(maxQty, val));
    setQuantity(clamped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (!deliveryName.trim()) {
      setErrorMsg('Please enter the delivery contact person name');
      return;
    }
    const cleanPhone = deliveryPhone.replace(/\D/g, '');
    if (!/^\d{10,12}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('Please enter your farm or village delivery street address');
      return;
    }
    if (!deliveryCity.trim()) {
      setErrorMsg('Please enter your village, city or taluk');
      return;
    }
    if (!deliveryState.trim()) {
      setErrorMsg('Please enter your state');
      return;
    }
    const cleanPin = deliveryPincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit postal pincode');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await animalApi.createOrder({
        listing_id: animal.id,
        quantity,
        delivery_name: deliveryName.trim(),
        delivery_phone: cleanPhone,
        delivery_address: deliveryAddress.trim(),
        delivery_city: deliveryCity.trim(),
        delivery_state: deliveryState.trim(),
        delivery_pincode: cleanPin,
      });

      if (res.data?.success && res.data.data) {
        setPlacedOrder(res.data.data);
        onOrderSuccess(res.data.data);
      } else {
        setErrorMsg(res.data?.message || 'Unable to place order. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error occurred while placing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPlacedOrder(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/80">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                {placedOrder ? 'Order Confirmed!' : 'Order Animal / Bird'}
              </h3>
              <p className="text-xs text-stone-500">
                {placedOrder ? 'Your purchase order has been placed' : animal.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-buy-modal"
            onClick={handleClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {placedOrder ? (
          /* Order Success View */
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-stone-900">Order Placed Successfully!</h4>
              <p className="mt-1 text-sm text-stone-600">
                The seller has been notified. You can track shipping or cancel before dispatch in your orders dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left space-y-2 text-sm text-stone-700">
              <div className="flex justify-between font-medium">
                <span className="text-stone-500">Order Reference:</span>
                <span className="font-mono text-xs font-bold text-stone-900">{placedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Item:</span>
                <span className="font-semibold text-stone-900">{animal.name} ({animal.category})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Quantity:</span>
                <span className="font-semibold">{placedOrder.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery Address:</span>
                <span className="font-semibold text-right truncate max-w-[200px]">
                  {placedOrder.delivery_city}, {placedOrder.delivery_state} ({placedOrder.delivery_pincode})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-base font-extrabold text-emerald-800">
                <span>Total Amount:</span>
                <span>₹{placedOrder.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-stone-500">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Payment: Cash on Delivery / Handover</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
              {onNavigateToOrders && (
                <button
                  type="button"
                  id="btn-go-to-my-orders"
                  onClick={() => {
                    handleClose();
                    onNavigateToOrders();
                  }}
                  className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
                >
                  View My Orders
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs sm:text-sm text-red-800 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Item Mini Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
              <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                <CategoryPlaceholderImage
                  src={animal.image_url}
                  alt={animal.name}
                  category={animal.category}
                  listingType={animal.listing_type}
                  aspectClassName="h-full w-full"
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-emerald-800 uppercase">{animal.category}</span>
                <h4 className="text-sm font-bold text-stone-900 truncate">{animal.name}</h4>
                <p className="text-xs text-stone-500">Location: {animal.location}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 block">Price/unit</span>
                <span className="text-base font-extrabold text-stone-900">
                  ₹{animal.price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="rounded-2xl border border-stone-200 p-4 bg-white">
              <label className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-2">
                Select Quantity (Available: {maxQty})
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-lg font-bold text-stone-800 disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  id="input-order-quantity"
                  min="1"
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => handleQtyChange(parseInt(e.target.value, 10) || 1)}
                  className="w-20 text-center rounded-xl border border-stone-300 py-2 text-base font-bold text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity + 1)}
                  disabled={quantity >= maxQty}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-lg font-bold text-stone-800 disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
                <div className="ml-auto text-right">
                  <span className="text-xs text-stone-500 block">Subtotal</span>
                  <span className="text-lg font-black text-emerald-800">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Details Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-bold text-stone-900">
                <Truck className="h-4 w-4 text-emerald-700" />
                <span>Delivery & Contact Address</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    id="input-delivery-name"
                    required
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    placeholder="Full recipient name"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    id="input-delivery-phone"
                    required
                    maxLength={10}
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Farm / Street Address *
                  </label>
                  <input
                    type="text"
                    id="input-delivery-address"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Plot / Survey No, Street or Village landmark"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Village / City / Taluk *
                  </label>
                  <input
                    type="text"
                    id="input-delivery-city"
                    required
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    placeholder="Village or Town"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">State *</label>
                    <input
                      type="text"
                      id="input-delivery-state"
                      required
                      value={deliveryState}
                      onChange={(e) => setDeliveryState(e.target.value)}
                      placeholder="State"
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Pincode *</label>
                    <input
                      type="text"
                      id="input-delivery-pincode"
                      required
                      maxLength={6}
                      value={deliveryPincode}
                      onChange={(e) => setDeliveryPincode(e.target.value)}
                      placeholder="560001"
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2 text-xs text-amber-900">
              <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Payment Mode: Cash on Handover / Inspection</span>
                <p className="mt-0.5 text-amber-800">
                  Inspect livestock upon arrival at your farm before releasing payment. Payment status is set to Pending for fulfillment.
                </p>
              </div>
            </div>

            {/* Total Summary and Submit */}
            <div className="border-t border-stone-200 pt-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-stone-500 block">Total Payable</span>
                <span className="text-2xl font-black text-stone-900">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-order"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      <span>Confirm & Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
