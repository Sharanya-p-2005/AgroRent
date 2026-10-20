import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

export const ReceiptButton: React.FC<{
  entityType: 'booking' | 'order' | 'service';
  entityId: string;
  className?: string;
  label?: string;
}> = ({ entityType, entityId, className = '', label = 'Receipt' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition ${className}`}
        title="View & print official tax invoice / receipt"
      >
        <FileText className="w-3.5 h-3.5 text-emerald-600" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <InvoiceReceiptModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          entityType={entityType}
          entityId={entityId}
        />
      )}
    </>
  );
};
