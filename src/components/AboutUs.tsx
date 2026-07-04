import React from 'react';
import { Sparkles, ShieldCheck, Heart, Truck } from 'lucide-react';

export default function AboutUs() {
  return (
    <div id="about-us-container" className="max-w-4xl mx-auto px-6 py-12 text-right dir-rtl">
      {/* Aesthetic Top Ornament */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        <Sparkles className="w-6 h-6 text-[#D4AF37] my-3 animate-pulse" />
        <h2 className="text-3xl font-extrabold text-white tracking-wide">داستان ما</h2>
        <p className="text-xs text-[#D4AF37] mt-1 font-mono tracking-widest uppercase">The Story of Diamond Alttin</p>
      </div>

      {/* Main Narrative Card */}
      <div id="about-narrative-card" className="bg-[#0c0c0c] border border-[#D4AF37]/20 p-8 rounded-2xl shadow-[0_4px_30px_rgba(212,175,55,0.05)] text-gray-300 leading-relaxed space-y-6">
        <h3 className="text-xl font-bold text-[#D4AF37] border-b border-[#D4AF37]/10 pb-3">
          تلاقی درخشش الماس و اصالت آلتین
        </h3>

        <p className="text-base text-gray-200">
          برند دایموند آلتین با یک هدف ساده اما بزرگ شکل گرفت: <span className="text-white font-semibold">«دسترسی به زیباترین و باکیفیت‌ترین لوازم جانبی برای همه»</span>. کلمه آلتین در نام ما نمادی از ارزش و زیبایی است و ما تلاش می‌کنیم این ارزش را در قالب بدلیجات با طرح‌های مدرن، دوام بالا و ضد حساسیت به شما ارائه دهیم.
        </p>

        {/* Highlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div id="about-usp-color" className="bg-black/50 border border-[#D4AF37]/10 p-5 rounded-xl text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors duration-300">
            <ShieldCheck className="w-8 h-8 text-[#D4AF37] mb-3" />
            <h4 className="font-bold text-white mb-2">۱. تضمین کیفیت و ثبات رنگ</h4>
            <p className="text-xs text-gray-400">تمام محصولات ما با بهترین آبکاری‌ها و دوام بسیار بالا انتخاب می‌شوند تا همراه همیشگی شما باشند.</p>
          </div>

          <div id="about-usp-design" className="bg-black/50 border border-[#D4AF37]/10 p-5 rounded-xl text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors duration-300">
            <Heart className="w-8 h-8 text-[#D4AF37] mb-3" />
            <h4 className="font-bold text-white mb-2">۲. طرح‌های خاص و مد روز</h4>
            <p className="text-xs text-gray-400">جدیدترین و ترندترین اکسسوری‌های جهانی را با قیمت بسیار منصفانه در اختیار شما قرار می‌دهیم.</p>
          </div>

          <div id="about-usp-shipping" className="bg-black/50 border border-[#D4AF37]/10 p-5 rounded-xl text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors duration-300">
            <Truck className="w-8 h-8 text-[#D4AF37] mb-3" />
            <h4 className="font-bold text-white mb-2">۳. پشتیبانی و ارسال سریع</h4>
            <p className="text-xs text-gray-400">سفارشات شما با بسته‌بندی نفیس و شایسته در سریع‌ترین زمان ممکن به دستتان خواهد رسید.</p>
          </div>
        </div>

        {/* Conclusion block */}
        <div className="pt-6 text-center border-t border-[#D4AF37]/10">
          <p className="text-sm italic text-[#D4AF37]">
            در دایموند آلتین، ما فقط بدلیجات نمی‌فروشیم، ما به شما کمک می‌کنیم جزئیات استایل خود را به اوج زیبایی برسانید.
          </p>
        </div>
      </div>
    </div>
  );
}
