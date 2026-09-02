import { X, CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] sm:w-full sm:max-w-md bg-white rounded-lg shadow-2xl z-50 flex flex-col p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center gap-4 mt-2 mb-4">
          <CheckCircle size={48} className="text-green-500" />
          <h2 className="font-bold text-xl text-gray-900">Question Received!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Thank you for reaching out. We will post your question along with the answer as soon as it is ready.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#2D6DB5] hover:bg-[#245A94] text-white font-medium py-2.5 rounded transition-colors text-sm mt-2"
        >
          Got it, thanks!
        </button>
      </div>
    </>
  );
}
