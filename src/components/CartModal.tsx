import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, OrderItem, UserSession } from '../types';
import { X, Trash2, ShoppingCart, CreditCard, Upload, Send } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (pId: string, delta: number) => void;
  onRemoveItem: (pId: string) => void;
  onClearCart: () => void;
  currentUser: UserSession;
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  currentUser
}: CartModalProps) {
  // Shipping details state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Convert uploaded receipt to Base64 string for Firestore
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async () => {
    if (!currentUser.isLoggedIn) {
      alert('لطفاً ابتدا وارد حساب کاربری خود شوید تا بتوانید سفارش خود را ثبت کنید.');
      return;
    }

    if (!phone.trim() || !address.trim() || !postalCode.trim()) {
      alert('لطفاً شماره تلفن، آدرس و کد پستی خود را دقیق وارد کنید!');
      return;
    }

    if (!receiptFile) {
      alert('جهت نهایی‌سازی خرید، تصویر فیش واریزی یا رسید پرداخت خود را آپلود کنید!');
      return;
    }

    setSubmitting(true);

    try {
      // Structure the order items list
      const items: OrderItem[] = cartItems.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        quantity: item.quantity,
        price: item.product.price
      }));

      // Create order document in Firestore
      try {
        await addDoc(collection(db, 'orders'), {
          userId: currentUser.username, // Using username as basic ID
          username: currentUser.username,
          phone: phone.trim(),
          address: address.trim(),
          postalCode: postalCode.trim(),
          receiptUrl: receiptFile,
          status: 'pending',
          items: items,
          createdAt: Date.now()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'orders');
        return;
      }

      alert('سفارش شما با موفقیت ثبت شد و در انتظار بررسی مدیریت دایموند آلتین است! ✨');
      onClearCart();
      onClose();

      // Clear shipping inputs
      setPhone('');
      setAddress('');
      setPostalCode('');
      setReceiptFile(null);
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('خطایی در ثبت سفارش پیش آمد. مجدداً تلاش فرمایید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="cart-modal-overlay" className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-right dir-rtl animate-fade-in overflow-y-auto">
      <div id="cart-modal-card" className="relative w-full max-w-4xl bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-[85vh]">
        
        {/* Close Button */}
        <button
          id="btn-close-cart"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full bg-black/60 border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Items List */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-b md:border-b-0 md:border-l border-white/10 overflow-y-auto max-h-[300px] md:max-h-full">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
            سبد خرید شما
          </h3>

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 mb-3 text-gray-600" />
              <p className="text-sm">سبد خرید شما در حال حاضر خالی است.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-xl">
                  <img src={item.product.imageUrl} alt={item.product.title} className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-xs truncate">{item.product.title}</h4>
                    <p className="text-xs text-[#D4AF37] font-mono mt-0.5">{(item.product.price).toLocaleString('fa-IR')} تومان</p>
                    
                    {/* Item Quantity Increments */}
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => onUpdateQty(item.product.id, 1)}
                        className="bg-white/5 hover:bg-white/10 text-white px-1.5 py-0.5 rounded text-xs"
                      >
                        +
                      </button>
                      <span className="text-xs font-bold text-white font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.product.id, -1)}
                        className="bg-white/5 hover:bg-white/10 text-white px-1.5 py-0.5 rounded text-xs"
                      >
                        -
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center bg-black p-3 rounded-xl">
              <span className="text-xs text-gray-400 font-bold">مجموع فاکتور:</span>
              <span className="text-lg font-extrabold text-[#D4AF37] font-mono">{totalAmount.toLocaleString('fa-IR')} تومان</span>
            </div>
          )}
        </div>

        {/* Column 2: Checkout Form & Receipt upload */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto max-h-[500px] md:max-h-full bg-black/40">
          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              اطلاعات تحویل و پرداخت آنلاین
            </h3>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-xs italic py-12 text-center">جهت نهایی‌سازی سفارش، ابتدا کالایی به سبد خرید اضافه کنید.</p>
            ) : (
              <div className="space-y-4">
                {/* Bank Account Info Card */}
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-4 rounded-xl text-xs space-y-2 text-justify">
                  <span className="font-extrabold text-[#D4AF37] block">💳 اطلاعات کارت بانکی جهت واریز وجه:</span>
                  <p className="text-gray-300">لطفاً مبلغ کل خرید را به شماره کارت زیر واریز کرده و فیش واریز را در کادر زیر آپلود نمایید:</p>
                  <div className="bg-black/50 p-2 rounded-lg font-mono text-[#D4AF37] text-center border border-[#D4AF37]/10 tracking-widest text-sm">
                    ۶۲۱۹ - ۸۶۱۰ - ۲۹۳۴ - ۹۲۸۴
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">به نام: گالری جواهرات لوکس دایموند آلتین</p>
                </div>

                {/* Form Inputs */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">شماره تماس (ترجیحاً موبایل فعال):</label>
                  <input
                    type="tel"
                    placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">آدرس دقیق تحویل سفارش:</label>
                  <textarea
                    placeholder="استان، شهر، خیابان اصلی، کوچه، پلاک، واحد..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">کد پستی ده رقمی:</label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                  />
                </div>

                {/* Proof of Payment upload with drag & drop UI */}
                <div>
                  <label className="block text-xs text-gray-300 mb-2">تصویر فیش واریزی (رسید پرداخت):</label>
                  <div className="relative border border-dashed border-white/20 rounded-xl p-3 text-center hover:bg-white/5 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                    <span className="text-[10px] text-gray-400 block">تصویر فیش بانکی را آپلود کنید</span>
                  </div>

                  {receiptFile && (
                    <div className="mt-2 relative aspect-video w-full max-h-32 rounded-xl overflow-hidden border border-[#D4AF37]/30">
                      <img src={receiptFile} alt="رسید بارگذاری شده" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setReceiptFile(null)}
                        className="absolute top-1 left-1 bg-black/85 text-white p-1 rounded-full text-[10px]"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#bfa02e] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300 mt-6"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  در حال ثبت سفارش...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ثبت سفارش و ثبت رسید واریز وجه
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
