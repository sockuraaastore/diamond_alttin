import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Category, Product, Order, Ticket, Banner } from '../types';
import { 
  Image, 
  FolderPlus, 
  PackagePlus, 
  FileText, 
  LifeBuoy, 
  Trash2, 
  Check, 
  X, 
  Reply, 
  Plus, 
  Upload 
} from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'banners' | 'categories' | 'products' | 'orders' | 'support'>('orders');

  // Firebase Real-time Data States
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Form Input States
  const [newCategory, setNewCategory] = useState('');
  const [bannerFile, setBannerFile] = useState<string | null>(null);
  
  // Product Input States
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState<string | null>(null);

  // Interaction Dialog States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');

  // Read collections in real-time
  useEffect(() => {
    const unsubBanners = onSnapshot(query(collection(db, 'banners'), orderBy('createdAt', 'desc')), (snapshot) => {
      setBanners(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'banners');
    });

    const unsubCategories = onSnapshot(query(collection(db, 'categories'), orderBy('createdAt', 'desc')), (snapshot) => {
      const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(cats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const unsubTickets = onSnapshot(query(collection(db, 'tickets'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ticket)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    });

    return () => {
      unsubBanners();
      unsubCategories();
      unsubProducts();
      unsubOrders();
      unsubTickets();
    };
  }, []);

  // Helper to convert files to Base64
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const b64 = await toBase64(file);
        setBannerFile(b64);
      } catch (err) {
        console.error('Error loading image', err);
      }
    }
  };

  const handleProductUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const b64 = await toBase64(file);
        setProdImage(b64);
      } catch (err) {
        console.error('Error loading image', err);
      }
    }
  };

  // Add Banner
  const addBanner = async () => {
    if (!bannerFile) return;
    try {
      await addDoc(collection(db, 'banners'), {
        imageUrl: bannerFile,
        createdAt: Date.now()
      });
      setBannerFile(null);
      alert('بنر با موفقیت آپلود شد!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'banners');
    }
  };

  const deleteBanner = async (id: string) => {
    if (confirm('آیا از حذف این بنر مطمئن هستید؟')) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `banners/${id}`);
      }
    }
  };

  // Add Category
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory.trim(),
        createdAt: Date.now()
      });
      setNewCategory('');
      alert('دسته‌بندی جدید ثبت شد!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'categories');
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm('آیا از حذف این دسته‌بندی مطمئن هستید؟ با حذف این دسته‌بندی، محصولات آن حذف نخواهند شد اما فاقد دسته‌بندی معتبر خواهند شد.')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
      }
    }
  };

  // Add Product
  const addProduct = async () => {
    if (!prodTitle || !prodDesc || !prodCat || !prodPrice || !prodStock || !prodImage) {
      alert('لطفاً تمام فیلدهای محصول را پر کنید!');
      return;
    }

    const selectedCat = categories.find(c => c.id === prodCat);
    if (!selectedCat) return;

    try {
      await addDoc(collection(db, 'products'), {
        title: prodTitle,
        description: prodDesc,
        categoryId: prodCat,
        categoryName: selectedCat.name,
        price: Number(prodPrice),
        stock: Number(prodStock),
        imageUrl: prodImage,
        createdAt: Date.now()
      });

      // Reset form
      setProdTitle('');
      setProdDesc('');
      setProdCat('');
      setProdPrice('');
      setProdStock('');
      setProdImage(null);
      alert('محصول جدید با موفقیت اضافه شد!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('آیا از حذف این محصول مطمئن هستید؟')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  // Approve Order with Quantity Deduction
  const approveOrder = async (order: Order) => {
    if (!deliveryInfo.trim()) {
      alert('لطفاً زمان تحویل را وارد کنید!');
      return;
    }

    try {
      // 1. Update Order Status
      const orderRef = doc(db, 'orders', order.id);
      try {
        await updateDoc(orderRef, {
          status: 'approved',
          deliveryInfo: deliveryInfo.trim()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
        return;
      }

      // 2. Deduct Purchased Quantity from Product Stock
      for (const item of order.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const newStock = Math.max(prod.stock - item.quantity, 0);
          try {
            await updateDoc(doc(db, 'products', prod.id), {
              stock: newStock
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `products/${prod.id}`);
            return;
          }
        }
      }

      setSelectedOrderId(null);
      setDeliveryInfo('');
      alert('سفارش تایید شد و از موجودی کالاها کسر گردید!');
    } catch (err) {
      console.error(err);
    }
  };

  // Reject Order
  const rejectOrder = async (orderId: string) => {
    if (!rejectReason.trim()) {
      alert('لطفاً دلیل رد سفارش را وارد کنید!');
      return;
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      try {
        await updateDoc(orderRef, {
          status: 'rejected',
          rejectReason: rejectReason.trim()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        return;
      }

      setSelectedOrderId(null);
      setRejectReason('');
      alert('سفارش رد شد و وضعیت به‌روزرسانی گردید.');
    } catch (err) {
      console.error(err);
    }
  };

  // Answer Support Ticket
  const replyToTicket = async (ticketId: string) => {
    if (!supportReply.trim()) {
      alert('لطفاً پاسخ خود را بنویسید!');
      return;
    }

    try {
      try {
        await updateDoc(doc(db, 'tickets', ticketId), {
          reply: supportReply.trim(),
          status: 'replied'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticketId}`);
        return;
      }
      setSelectedTicketId(null);
      setSupportReply('');
      alert('پاسخ تیکت ارسال شد!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="admin-panel-container" className="max-w-6xl mx-auto px-4 py-8 text-right dir-rtl">
      {/* Admin Title */}
      <div className="border-b border-[#D4AF37]/30 pb-4 mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">پنل مدیریت Diamond Alttin</h2>
          <p className="text-xs text-[#D4AF37] mt-1">مدیریت محصولات، سفارشات، دسته‌بندی‌ها و ارتباط با مشتریان</p>
        </div>
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37] text-[#D4AF37] px-3 py-1 rounded-full text-xs font-mono">
          Admin Authorized
        </div>
      </div>

      {/* Tabs Menu */}
      <div id="admin-tabs" className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        <button
          id="btn-tab-orders"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'orders' 
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          مدیریت سفارشات ({orders.length})
        </button>

        <button
          id="btn-tab-products"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'products' 
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          مدیریت محصولات ({products.length})
        </button>

        <button
          id="btn-tab-categories"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'categories' 
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          دسته‌بندی‌ها ({categories.length})
        </button>

        <button
          id="btn-tab-banners"
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'banners' 
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Image className="w-4 h-4" />
          بنرهای تبلیغاتی ({banners.length})
        </button>

        <button
          id="btn-tab-support"
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'support' 
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          تیکت‌های مشتریان ({tickets.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div id="admin-tab-content">

        {/* 1. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div id="tab-orders-content" className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">لیست سفارشات خرید مشتریان</h3>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-sm">هیچ سفارشی ثبت نشده است.</p>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#0c0c0c]">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-gray-300 font-bold">
                      <th className="p-4">خریدار / تلفن</th>
                      <th className="p-4">آدرس و کد پستی</th>
                      <th className="p-4">اقلام سفارش</th>
                      <th className="p-4">رسید واریز</th>
                      <th className="p-4">وضعیت فعلی</th>
                      <th className="p-4">عملیات مدیریت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-white">{order.username}</div>
                          <div className="text-xs text-[#D4AF37] font-mono mt-1">{order.phone}</div>
                        </td>
                        <td className="p-4 max-w-xs text-gray-300">
                          <div>{order.address}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">کد پستی: {order.postalCode}</div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                                {it.title} <span className="text-[#D4AF37] font-bold">({it.quantity} عدد)</span> - {(it.price * it.quantity).toLocaleString('fa-IR')} تومان
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          {order.receiptUrl ? (
                            <a 
                              href={order.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-block p-1 bg-white/5 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 rounded transition-colors"
                            >
                              <img 
                                src={order.receiptUrl} 
                                alt="رسید پرداخت" 
                                className="w-16 h-10 object-cover rounded"
                              />
                            </a>
                          ) : (
                            <span className="text-red-500 text-xs">بدون تصویر</span>
                          )}
                        </td>
                        <td className="p-4">
                          {order.status === 'pending' && (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs">در انتظار بررسی</span>
                          )}
                          {order.status === 'approved' && (
                            <div className="space-y-1">
                              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs">تایید شده</span>
                              <div className="text-[11px] text-gray-400 mt-1">{order.deliveryInfo}</div>
                            </div>
                          )}
                          {order.status === 'rejected' && (
                            <div className="space-y-1">
                              <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-xs">رد شده</span>
                              <div className="text-[11px] text-gray-400 mt-1">علت: {order.rejectReason}</div>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {order.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedOrderId(order.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                بررسی و اقدام
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">بررسی شده</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Order Action Modal Overlay */}
            {selectedOrderId && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#0c0c0c] border border-[#D4AF37] p-6 rounded-2xl w-full max-w-md text-right">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                    <h4 className="text-lg font-bold text-white">اقدام برای سفارش</h4>
                    <button onClick={() => setSelectedOrderId(null)} className="text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form fields for Delivery or Rejection */}
                  <div className="space-y-4">
                    <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl">
                      <h5 className="text-xs text-[#D4AF37] font-bold mb-1">گزینه اول: تایید و ارسال</h5>
                      <p className="text-[11px] text-gray-400 mb-2">با تایید سفارش، موجودی اقلام از انبار کسر خواهد شد.</p>
                      <label className="block text-xs text-gray-300 mb-1">زمان تقریبی تحویل (مثلاً ۳ روز دیگر):</label>
                      <input
                        type="text"
                        placeholder="مثال: ۳ روز دیگر می‌رسد"
                        value={deliveryInfo}
                        onChange={(e) => setDeliveryInfo(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white"
                      />
                      <button
                        onClick={() => {
                          const order = orders.find(o => o.id === selectedOrderId);
                          if (order) approveOrder(order);
                        }}
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg transition-colors font-bold"
                      >
                        تایید و ثبت زمان تحویل
                      </button>
                    </div>

                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <h5 className="text-xs text-red-400 font-bold mb-1">گزینه دوم: رد سفارش</h5>
                      <p className="text-[11px] text-gray-400 mb-2">در صورت نامعتبر بودن رسید یا مغایرت، سفارش را رد کنید.</p>
                      <label className="block text-xs text-gray-300 mb-1">علت رد سفارش:</label>
                      <input
                        type="text"
                        placeholder="علت رد تراکنش یا فیش"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white"
                      />
                      <button
                        onClick={() => rejectOrder(selectedOrderId)}
                        className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg transition-colors font-bold"
                      >
                        رد سفارش و ثبت علت
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div id="tab-products-content" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Add Product Form */}
            <div className="lg:col-span-1 bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D4AF37]" />
                افزودن محصول جدید
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">عنوان محصول:</label>
                  <input
                    type="text"
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    placeholder="مثال: انگشتر کارتیه نگین‌دار"
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">توضیحات محصول:</label>
                  <textarea
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="توضیحات کامل درباره جنس، رنگ و ثبات رنگ..."
                    rows={3}
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">دسته‌بندی (پویا از پایگاه‌داده):</label>
                  <select
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                  >
                    <option value="">انتخاب کنید...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">قیمت (تومان):</label>
                    <input
                      type="number"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="مثال: ۴۵۰۰۰۰"
                      className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">موجودی انبار:</label>
                    <input
                      type="number"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      placeholder="مثال: ۱۵"
                      className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* File Upload with Drag & Drop UI */}
                <div>
                  <label className="block text-xs text-gray-300 mb-2">تصویر محصول:</label>
                  <div className="relative border border-dashed border-white/20 rounded-xl p-4 text-center hover:bg-white/5 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
                    <span className="text-[11px] text-gray-400 block">تصویر را بکشید یا کلیک کنید</span>
                  </div>

                  {prodImage && (
                    <div className="mt-3 relative aspect-video w-full rounded-xl overflow-hidden border border-[#D4AF37]/30">
                      <img src={prodImage} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setProdImage(null)}
                        className="absolute top-2 left-2 bg-black/70 hover:bg-black text-white p-1 rounded-full text-xs"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={addProduct}
                  className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#bfa02e] text-black font-extrabold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] text-xs mt-4"
                >
                  افزودن محصول به گالری
                </button>
              </div>
            </div>

            {/* Right Column: Products List Table */}
            <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
              <h3 className="text-lg font-bold text-white mb-4">لیست کل محصولات</h3>
              {products.length === 0 ? (
                <p className="text-gray-400 text-sm">هیچ محصولی در پایگاه‌داده وجود ندارد.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 bg-black/40 border border-white/5 p-3 rounded-xl hover:border-[#D4AF37]/30 transition-all">
                      <img src={p.imageUrl} alt={p.title} className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{p.title}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                          <span>دسته‌بندی: <span className="text-gray-200">{p.categoryName}</span></span>
                          <span>قیمت: <span className="text-[#D4AF37] font-semibold">{p.price.toLocaleString('fa-IR')} تومان</span></span>
                          <span>موجودی: <span className={p.stock === 0 ? 'text-red-500 font-bold' : 'text-emerald-500 font-semibold'}>{p.stock} عدد</span></span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="حذف محصول"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div id="tab-categories-content" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Category Form */}
            <div className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
              <h3 className="text-lg font-bold text-white mb-4">ایجاد دسته‌بندی جدید</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">نام دسته‌بندی (طلا، نقره، بدلیجات و...):</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="مثال: نقره عیار ۹۲۵"
                    className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-xs text-white focus:border-[#D4AF37]"
                  />
                </div>
                <button
                  onClick={addCategory}
                  className="w-full py-2 bg-[#D4AF37] hover:bg-[#bfa02e] text-black font-extrabold rounded-xl text-xs transition-all"
                >
                  ثبت دسته‌بندی جدید
                </button>
              </div>
            </div>

            {/* List and Delete Categories */}
            <div className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
              <h3 className="text-lg font-bold text-white mb-4">لیست کل دسته‌بندی‌ها</h3>
              {categories.length === 0 ? (
                <p className="text-gray-400 text-sm">هیچ دسته‌بندی ثبت نشده است.</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl hover:border-[#D4AF37]/20 transition-all">
                      <span className="text-sm text-gray-200 font-bold">{cat.name}</span>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. BANNERS TAB */}
        {activeTab === 'banners' && (
          <div id="tab-banners-content" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Upload Banner Column */}
            <div className="md:col-span-1 bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
              <h3 className="text-lg font-bold text-white mb-2">مدیریت بنر صفحه اصلی</h3>
              <p className="text-xs text-gray-400 mb-4">بنرهای تبلیغاتی مجلل با نسبت تصویر دقیق ۱۶:۹ بدون عنوان یا متن</p>
              
              <div className="space-y-4">
                <div className="relative border border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-10 h-10 text-[#D4AF37] mx-auto mb-2 animate-pulse" />
                  <span className="text-xs text-gray-300 block">آپلود فایل بنر (نسبت ۱۶:۹)</span>
                </div>

                {bannerFile && (
                  <div className="space-y-2">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#D4AF37]/30">
                      <img src={bannerFile} alt="پیش‌نمایش بنر" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={addBanner}
                      className="w-full py-2 bg-gradient-to-r from-[#D4AF37] to-[#bfa02e] text-black font-extrabold rounded-xl text-xs transition-all"
                    >
                      تایید و انتشار بنر
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Banners Grid */}
            <div className="md:col-span-2 bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl h-fit">
              <h3 className="text-lg font-bold text-white mb-4">بنرهای فعال</h3>
              {banners.length === 0 ? (
                <p className="text-gray-400 text-sm">هیچ بنری ثبت نشده است.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {banners.map((ban) => (
                    <div key={ban.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video">
                      <img src={ban.imageUrl} alt="بنر" className="w-full h-full object-cover" />
                      
                      {/* Delete Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                        <button
                          onClick={() => deleteBanner(ban.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف این بنر
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. SUPPORT TAB */}
        {activeTab === 'support' && (
          <div id="tab-support-content" className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">تیکت‌های ارسالی مشتریان</h3>
            {tickets.length === 0 ? (
              <p className="text-gray-400 text-sm">هیچ تیکت پشتیبانی دریافت نشده است.</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((tk) => (
                  <div key={tk.id} className="bg-[#0c0c0c] border border-white/10 p-5 rounded-2xl hover:border-[#D4AF37]/30 transition-all">
                    <div className="flex justify-between items-start border-b border-white/5 pb-2.5 mb-3">
                      <div>
                        <span className="bg-white/5 text-gray-300 text-xs px-2.5 py-1 rounded-md font-mono mb-1 inline-block">تیکت از: {tk.username}</span>
                        <h4 className="text-white font-bold text-sm mt-1">{tk.subject}</h4>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tk.status === 'replied' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'}`}>
                        {tk.status === 'replied' ? 'پاسخ داده شده' : 'در انتظار پاسخ'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-lg mb-3 text-justify">{tk.message}</p>

                    {/* Admin Reply Section */}
                    {tk.reply ? (
                      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-3 rounded-lg text-xs text-[#D4AF37] leading-relaxed text-justify">
                        <strong>پاسخ شما:</strong> {tk.reply}
                      </div>
                    ) : (
                      <div>
                        {selectedTicketId === tk.id ? (
                          <div className="space-y-2 mt-3">
                            <textarea
                              rows={3}
                              value={supportReply}
                              onChange={(e) => setSupportReply(e.target.value)}
                              placeholder="متن پاسخ خود به مشتری را بنویسید..."
                              className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-xs text-white focus:border-[#D4AF37]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => replyToTicket(tk.id)}
                                className="bg-[#D4AF37] hover:bg-[#bfa02e] text-black px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                              >
                                ارسال پاسخ رسمی
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTicketId(null);
                                  setSupportReply('');
                                }}
                                className="bg-white/5 text-gray-300 px-3 py-1.5 rounded-lg text-xs hover:bg-white/10"
                              >
                                لغو
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedTicketId(tk.id)}
                            className="bg-white/5 text-white hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all mt-2"
                          >
                            <Reply className="w-3.5 h-3.5 text-[#D4AF37]" />
                            پاسخ به تیکت
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
