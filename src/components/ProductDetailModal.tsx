import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Comment, UserSession } from '../types';
import { X, ShoppingBag, Send, MessageSquare, Star, Plus, Minus } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (p: Product, qty: number) => void;
  currentUser: UserSession;
  onOpenAuth: () => void;
}

export default function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  currentUser,
  onOpenAuth
}: ProductDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Fetch comments in real-time when the product changes
  useEffect(() => {
    if (!product || !isOpen) return;

    const q = query(
      collection(db, 'comments'),
      where('productId', '==', product.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(loadedComments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });

    return () => unsubscribe();
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleIncrement = () => {
    if (qty < product.stock) {
      setQty(qty + 1);
    }
  };

  const handleDecrement = () => {
    if (qty > 1) {
      setQty(qty - 1);
    }
  };

  const submitComment = async () => {
    if (!currentUser.isLoggedIn) {
      alert('برای ثبت نظر ابتدا باید وارد حساب کاربری خود شوید.');
      onOpenAuth();
      return;
    }

    if (!newCommentText.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        productId: product.id,
        username: currentUser.username,
        text: newCommentText.trim(),
        createdAt: Date.now()
      });
      setNewCommentText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  return (
    <div id="product-detail-overlay" className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-right dir-rtl animate-fade-in overflow-y-auto">
      <div id="product-detail-card" className="relative w-full max-w-4xl bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-[85vh]">
        
        {/* Close button */}
        <button
          id="btn-close-detail-modal"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full bg-black/60 border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Product Image */}
        <div className="w-full md:w-1/2 relative bg-black flex items-center justify-center border-b md:border-b-0 md:border-l border-white/10">
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full h-full object-cover max-h-[300px] md:max-h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute bottom-4 right-4 text-right">
            <span className="bg-[#D4AF37] text-black text-xs font-extrabold px-3 py-1 rounded-full">
              {product.categoryName}
            </span>
          </div>
        </div>

        {/* Column 2: Details & Comments */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto max-h-[500px] md:max-h-full">
          <div>
            {/* Title & Price */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{product.title}</h3>
            
            <div className="flex items-center gap-1 text-amber-500 text-xs mb-3">
              <Star className="w-4 h-4 fill-amber-500" />
              <Star className="w-4 h-4 fill-amber-500" />
              <Star className="w-4 h-4 fill-amber-500" />
              <Star className="w-4 h-4 fill-amber-500" />
              <Star className="w-4 h-4 fill-amber-500" />
              <span className="text-gray-400 mr-2">({comments.length} نظر ثبت شده)</span>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed mb-6 text-justify">
              {product.description}
            </p>

            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6 flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-400 block mb-1">قیمت واحد:</span>
                <span className="text-lg font-extrabold text-[#D4AF37] font-mono">
                  {product.price.toLocaleString('fa-IR')} <span className="text-xs text-gray-300 font-sans">تومان</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block mb-1">وضعیت انبار:</span>
                <span className="text-xs font-bold text-emerald-500">
                  {product.stock > 0 ? `${product.stock} عدد موجود` : 'اتمام موجودی'}
                </span>
              </div>
            </div>

            {/* Cart Selector / Buttons */}
            {product.stock > 0 ? (
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-300">تعداد خرید:</span>
                  <div className="flex items-center border border-white/20 rounded-lg overflow-hidden bg-black">
                    <button 
                      onClick={handleIncrement} 
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-bold text-white font-mono">{qty}</span>
                    <button 
                      onClick={handleDecrement} 
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product, qty);
                    onClose();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#bfa02e] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <ShoppingBag className="w-4 h-4" />
                  افزودن به سبد خرید ({(product.price * qty).toLocaleString('fa-IR')} تومان)
                </button>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-center text-xs font-bold mb-6">
                متاسفانه این محصول در حال حاضر به اتمام رسیده است.
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-white/10 pt-6 mt-4">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
              نظرات خریداران و مراجعین
            </h4>

            {/* Write Comment Box */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder={currentUser.isLoggedIn ? "نظر خود را درباره این محصول بنویسید..." : "برای ثبت نظر ابتدا وارد شوید..."}
                value={newCommentText}
                disabled={!currentUser.isLoggedIn}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                className="flex-1 bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37] disabled:bg-white/5 disabled:text-gray-500"
              />
              <button
                onClick={submitComment}
                className="bg-[#D4AF37] hover:bg-[#bfa02e] text-black p-2 rounded-lg transition-colors flex items-center justify-center"
                title="ارسال نظر"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List Feed */}
            <div className="space-y-3 max-h-[180px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-xs italic text-center py-4">اولین نفری باشید که برای این محصول نظر ثبت می‌کند!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white/5 border border-white/5 p-3 rounded-lg text-right">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white">{comment.username}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(comment.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed text-justify">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
