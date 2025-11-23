
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col space-y-3 pointer-events-none items-end justify-end p-4">
      {notifications.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastNotification; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={18} className="text-success" />;
      case 'urgent': return <AlertCircle size={18} className="text-urgent" />;
      default: return <Info size={18} className="text-primary" />;
    }
  };

  const getBorderColor = () => {
     switch (toast.type) {
      case 'success': return 'border-l-success';
      case 'urgent': return 'border-l-urgent';
      default: return 'border-l-primary';
    }
  };

  return (
    <div className={`pointer-events-auto bg-white shadow-xl rounded-lg border-l-4 ${getBorderColor()} p-4 w-80 transform transition-all animate-in slide-in-from-right duration-300 flex items-start justify-between border border-slate-100`}>
      <div className="flex items-start space-x-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">{toast.message}</p>
        </div>
      </div>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors ml-2"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ToastContainer;
