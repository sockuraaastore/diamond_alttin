import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div id="welcome-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-right dir-rtl">
      <div id="welcome-modal-card" className="relative w-full max-w-lg bg-[#0a0a0a] border-2 border-[#D4AF37] p-8 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.25)] overflow-hidden">
        {/* Decorative corner patterns */}
        <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-[#D4AF37]/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b border-l border-[#D4AF37]/20 rounded-bl-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="welcome-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5"
          aria-label="Close welcome modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30">
            <Sparkles className="w-8 h-8 text-[#D4AF37] animate-bounce" />
          </div>
        </div>

        {/* Persian Message */}
        <h3 className="text-2xl font-bold text-[#D4AF37] text-center mb-4">
          خوش آمدید ✨
        </h3>

        <div id="welcome-modal-body-text" className="text-gray-200 text-sm leading-relaxed space-y-4 mb-8 text-justify">
          <p>
            به دنیای درخشش و اصالت خوش آمدید! ✨ در دایموند آلتین، ما معتقدیم که هر اکسسوری داستانی از سلیقه و درخشش شما را روایت میکند. به فروشگاه خودتان خوش آمدید! ما با دقت مجموعهای از زیباترین، باکیفیتترین و خاصترین بدلیجات را برای شما انتخاب کردهایم تا در هر لحظه و هر مناسبتی مانند الماس بدرخشید. تنها با چند کلیک به استایل خود جلوهای منحصر به فرد ببخشید. صمیمانه از حمایت شما سپاسگزاریم.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            id="welcome-modal-action-btn"
            onClick={onClose}
            className="w-full sm:w-2/3 py-3 bg-gradient-to-r from-[#D4AF37] to-[#bfa02e] text-black font-extrabold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300"
          >
            ورود به گالری دایموند آلتین
          </button>
        </div>
      </div>
    </div>
  );
}
