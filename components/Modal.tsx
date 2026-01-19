
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  customHeader?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl', customHeader }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.classList.remove('modal-open');
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="fixed inset-0 cursor-pointer" onClick={onClose}></div>
      <div className={`modal-container ${maxWidth}`}>
        <div className="modal-content-glass animate-fade-in relative z-10">
          {customHeader ? customHeader : (
            <div className="flex justify-between items-start mb-6 md:mb-12 flex-shrink-0">
              <div className="pr-6">
                {title && <h3 className="text-xl md:text-4xl font-extrabold text-white tracking-tighter uppercase leading-none">{title}</h3>}
                {subtitle && <p className="text-[8px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 md:mt-4">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="w-10 h-10 md:w-16 md:h-16 glass text-slate-500 hover:text-white rounded-xl md:rounded-2xl flex items-center justify-center transition-all flex-shrink-0 active-scale border border-white/5">
                <X size={20} className="md:w-8 md:h-8"/>
              </button>
            </div>
          )}
          <div className="modal-scroll-area flex-1 pr-1 overflow-y-auto no-scrollbar md:block">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
