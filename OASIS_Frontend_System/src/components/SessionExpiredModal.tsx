import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, LogIn, AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose?: () => void;
  userName?: string;
  userRole?: string;
  message?: string;
}

export function SessionExpiredModal({
  isOpen,
  onConfirm,
  onClose,
  userName,
  userRole,
  message = "Phiên làm việc của bạn đã hết hạn để đảm bảo an toàn bảo mật hệ thống. Vui lòng đăng nhập lại để tiếp tục sử dụng."
}: SessionExpiredModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 25 }}
            className="bg-white rounded-[32px] p-7 max-w-md w-full shadow-2xl border border-slate-100/90 text-center relative overflow-hidden font-sans"
          >
            {/* Background Decorative Gradient Bubble */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-50/60 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-rose-50/60 rounded-full blur-2xl pointer-events-none" />

            {/* Header Icon */}
            <div className="mx-auto w-16 h-16 bg-rose-50 border border-rose-100/80 rounded-2xl flex items-center justify-center mb-5 text-rose-600 shadow-2xs relative">
              <ShieldAlert className="w-8 h-8 stroke-[2.2] animate-pulse" />
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-medium text-slate-800 tracking-tight mb-2 font-sans flex items-center justify-center">
              Phiên làm việc đã hết hạn
            </h3>

            {/* User & Role Badge (If available) */}
            {(userName || userRole) && (
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[11px] text-slate-600 mb-4 font-sans">
                {userName && <span className="font-medium text-blue-950">{userName}</span>}
                {userRole && <span className="text-slate-400 font-mono">({userRole})</span>}
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-slate-500 mb-7 leading-relaxed font-display px-2">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 text-slate-700 font-medium rounded-xl text-xs transition duration-150 border border-slate-200/60 font-sans cursor-pointer"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 bg-blue-950 hover:bg-blue-900 active:bg-blue-950 text-white font-medium rounded-xl text-xs transition duration-150 shadow-md shadow-blue-950/20 flex items-center justify-center font-sans cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5 shrink-0 stroke-[2.2]" />
                Đăng nhập lại
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SessionExpiredModal;
