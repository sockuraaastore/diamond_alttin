import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Ticket, UserSession } from '../types';
import { LifeBuoy, Send, MessageCircle, Clock, Reply } from 'lucide-react';

interface SupportSectionProps {
  currentUser: UserSession;
}

export default function SupportSection({ currentUser }: SupportSectionProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch only this user's tickets in real-time
  useEffect(() => {
    if (!currentUser.isLoggedIn) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', currentUser.username),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Ticket));
      setMyTickets(tickets);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser.isLoggedIn) {
      alert('برای ارسال تیکت ابتدا باید وارد شوید.');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      alert('لطفاً موضوع و متن پیام را به طور کامل پر کنید!');
      return;
    }

    setSubmitting(true);

    try {
      try {
        await addDoc(collection(db, 'tickets'), {
          userId: currentUser.username,
          username: currentUser.username,
          subject: subject.trim(),
          message: message.trim(),
          status: 'pending',
          createdAt: Date.now()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'tickets');
        return;
      }

      alert('تیکت شما با موفقیت ثبت گردید. مدیران دایموند آلتین به زودی پاسخ خواهند داد. ✨');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="support-section-container" className="max-w-4xl mx-auto px-6 py-12 text-right dir-rtl">
      
      {/* Ornament Section */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        <LifeBuoy className="w-6 h-6 text-[#D4AF37] my-3 animate-pulse" />
        <h2 className="text-3xl font-extrabold text-white tracking-wide">مرکز پشتیبانی مشتریان</h2>
        <p className="text-xs text-[#D4AF37] mt-1 font-mono tracking-widest uppercase">Diamond Alttin Client Care</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="md:col-span-1 bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
          <h3 className="text-base font-bold text-white mb-4">ارسال تیکت جدید</h3>
          
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-300 mb-1">موضوع پیام:</label>
              <input
                type="text"
                placeholder="مثال: پیگیری سفارش یا کیفیت کالا"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">متن پیام یا سوال شما:</label>
              <textarea
                placeholder="پیام خود را به تفصیل بنویسید..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#bfa02e] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              {submitting ? 'در حال ارسال...' : (
                <>
                  <Send className="w-4 h-4" />
                  ارسال تیکت پشتیبانی
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tickets Feed List Column */}
        <div className="md:col-span-2 bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
          <h3 className="text-base font-bold text-white mb-4">مکاتبات قبلی شما</h3>

          {!currentUser.isLoggedIn ? (
            <p className="text-gray-500 text-xs italic text-center py-12">لطفاً جهت ثبت یا مشاهده تیکت ابتدا وارد حساب کاربری خود شوید.</p>
          ) : myTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <MessageCircle className="w-10 h-10 mb-2" />
              <p className="text-xs italic">تاکنون تیکت پشتیبانی ثبت نکرده‌اید.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {myTickets.map((tk) => (
                <div key={tk.id} className="bg-black/40 border border-white/5 p-4 rounded-xl text-right">
                  
                  {/* Subject and Date */}
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white">{tk.subject}</h4>
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                        {new Date(tk.createdAt).toLocaleString('fa-IR')}
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      tk.status === 'replied' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {tk.status === 'replied' ? 'پاسخ داده شده' : 'در انتظار بررسی'}
                    </span>
                  </div>

                  {/* Customer Question */}
                  <p className="text-xs text-gray-300 leading-relaxed text-justify bg-white/5 p-3 rounded-lg">{tk.message}</p>

                  {/* Admin Reply */}
                  {tk.reply && (
                    <div className="mt-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-3 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] mb-1.5">
                        <Reply className="w-3.5 h-3.5" />
                        <span>پاسخ رسمی پشتیبانی دایموند آلتین:</span>
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed text-justify">{tk.reply}</p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
