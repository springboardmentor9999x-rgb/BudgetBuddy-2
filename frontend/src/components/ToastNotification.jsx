import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const { type, message } = toast;

  const displayMessage = React.isValidElement(message) 
    ? message 
    : (typeof message === 'string' 
        ? message 
        : (Array.isArray(message) ? message.join('; ') : JSON.stringify(message)));

  const styleMap = {
    success: {
      bg: 'bg-slate-900/98 border-emerald-500 text-emerald-50 shadow-emerald-500/20 ring-1 ring-emerald-500/30',
      bar: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />,
      title: 'SUCCESS',
      titleColor: 'text-emerald-400',
    },
    error: {
      bg: 'bg-slate-900/98 border-red-500 text-red-50 shadow-red-500/30 ring-2 ring-red-500/50',
      bar: 'bg-red-500',
      icon: <AlertCircle className="w-6 h-6 text-red-400 shrink-0 animate-pulse" />,
      title: 'ERROR',
      titleColor: 'text-red-400',
    },
    warning: {
      bg: 'bg-slate-900/98 border-amber-500 text-amber-50 shadow-amber-500/20 ring-1 ring-amber-500/30',
      bar: 'bg-amber-500',
      icon: <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />,
      title: 'WARNING',
      titleColor: 'text-amber-400',
    },
    info: {
      bg: 'bg-slate-900/98 border-blue-500 text-blue-50 shadow-blue-500/20 ring-1 ring-blue-500/30',
      bar: 'bg-blue-500',
      icon: <Info className="w-6 h-6 text-blue-400 shrink-0" />,
      title: 'NOTIFICATION',
      titleColor: 'text-blue-400',
    },
  };

  const currentStyle = styleMap[type] || styleMap.info;

  return (
    <div className="fixed top-6 right-4 sm:right-6 z-[9999] max-w-md w-[90%] sm:w-full transition-all duration-300 animate-in fade-in slide-in-from-top-6">
      <div className={`relative overflow-hidden flex items-start justify-between p-4 sm:p-5 rounded-2xl border shadow-2xl backdrop-blur-2xl ${currentStyle.bg}`}>
        
        {/* Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${currentStyle.bar}`} />

        <div className="flex items-start space-x-3.5 pr-2 pt-0.5">
          {currentStyle.icon}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-widest ${currentStyle.titleColor} mb-1`}>
              {currentStyle.title}
            </h4>
            <p className="text-sm font-bold leading-relaxed text-white">
              {displayMessage}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0 ml-2"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
