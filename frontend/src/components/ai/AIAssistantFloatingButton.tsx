import React, { useState } from 'react';
import { Sparkles, MessageSquare, X } from 'lucide-react';
import { AIChatWindow } from './AIChatWindow.js';

export const AIAssistantFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center space-x-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer border border-emerald-400/40"
            title="Open AgroRent Kisan Sathi AI"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
            </div>
            <span className="text-sm font-semibold tracking-wide">
              Kisan Sathi AI
            </span>
            <span className="hidden sm:inline-block text-[11px] bg-white/20 px-2 py-0.5 rounded-full text-emerald-100 font-medium">
              ಕಿಸಾನ್ ಮಿತ್ರ
            </span>
          </button>
        )}
      </div>

      {/* Expanded Chat Overlay */}
      {isOpen && (
        <AIChatWindow
          isEmbedded={false}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
