import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info', // 'success', 'error', 'confirm', 'info'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
  });

  const showAlert = ({ title = 'Notification', message, type = 'info' }) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'OK',
      cancelText: null,
      onConfirm: null,
    });
  };

  const showConfirm = ({ title = 'Confirm Action', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) => {
    setModalState({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
      {children}

      {modalState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                modalState.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                modalState.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                modalState.type === 'confirm' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                'bg-teal-50 border-teal-200 text-teal-600'
              }`}>
                {modalState.type === 'success' && <CheckCircle2 size={24} />}
                {modalState.type === 'error' && <XCircle size={24} />}
                {modalState.type === 'confirm' && <AlertTriangle size={24} />}
                {modalState.type === 'info' && <Info size={24} />}
              </div>

              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-slate-900">{modalState.title}</h3>
                <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">{modalState.message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              {modalState.cancelText && (
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                onClick={modalState.onConfirm ? handleConfirm : closeModal}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  modalState.type === 'error' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                  modalState.type === 'confirm' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                  'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                }`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
