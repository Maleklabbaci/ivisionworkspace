
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  return (
    <div 
      className={`modal-overlay ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      onClick={onClose}
    >
      <div 
        className={`modal-container ${maxWidth} ${isOpen ? 'animate-modal-entry' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content-glass">
          {/* Mobile Handle */}
          <div className="md:hidden flex flex-col items-center pt-4 pb-2 flex-shrink-0">
            <div className="w-10 h-1 bg-white/10 rounded-full"></div>
          </div>

          <div className="flex flex-col h-full overflow-hidden">
            <header className="px-6 md:px-12 pt-4 md:pt-10 pb-6 flex items-start justify-between border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="pr-6">
                {title && (
                  <h3 className="text-xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[9px] md:text-[11px] font-black text-sky-400 uppercase mt-2 md:mt-4 tracking-widest opacity-70">
                    {subtitle}
                  </p>
                )}
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 md:w-14 md:h-14 bg-white/5 text-slate-400 hover:text-white rounded-2xl md:rounded-3xl flex items-center justify-center active-scale border border-white/5 transition-all hover:bg-white/10"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-12 py-8 md:py-12 relative">
              <div className="relative z-10">
                {children}
              </div>
              
              {/* Bottom Safe Area Padding for Mobile */}
              <div className="h-20 md:h-6 flex-shrink-0"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
