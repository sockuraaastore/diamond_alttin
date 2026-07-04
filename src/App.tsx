import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserSession, Product, Category, Banner, Order } from './types';

// Custom Components
import Hero from './components/Hero';
import AuthPage from './components/AuthPage';
import WelcomeModal from './components/WelcomeModal';
import AboutUs from './components/AboutUs';
import AdminPanel from './components/AdminPanel';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartModal from './components/CartModal';
import SupportSection from './components/SupportSection';

// Lucide Icons
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  User, 
  BookOpen, 
  Clock, 
  PhoneCall, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  Heart
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState<UserSession>({
    username: '',
    role: 'user',
    isLoggedIn: false
  });

  // Navigation & UI States
  const [activeView, setActiveView] = useState<'home' | 'blogs' | 'about' | 'support' | 'orders' | 'purchases' | 'admin'>('home');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore Real-time States
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Filtering & Shopping States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Modals / Details State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Focus References
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Routing / Admin URL detection
  const [isAdminUrlMode, setIsAdminUrlMode] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminUrlError, setAdminUrlError] = useState('');

  // Check for admin URL (/admin or #admin)
  useEffect(() => {
    const checkRoute = () => {
      const isPathAdmin = window.location.pathname.toLowerCase().endsWith('/admin');
      const isHashAdmin = window.location.hash.toLowerCase() === '#admin' || window.location.hash.toLowerCase() === '#/admin';
      
      if (isPathAdmin || isHashAdmin) {
        setIsAdminUrlMode(true);
      } else {
        setIsAdminUrlMode(false);
      }
    };

    checkRoute();
    
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  const handleAdminPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode === '13911400') {
      const adminSession: UserSession = {
        username: 'admin',
        role: 'admin',
        isLoggedIn: true
      };
      localStorage.setItem('diamond_alttin_session', JSON.stringify(adminSession));
      setCurrentUser(adminSession);
      setIsAdminUrlMode(false);
      setActiveView('admin');
      setAdminPasscode('');
      setAdminUrlError('');
      
      // Clean up URL hash or pathname
      if (window.location.hash) {
        window.location.hash = '';
      }
      if (window.location.pathname.toLowerCase().endsWith('/admin')) {
        window.history.replaceState(null, '', '/');
      }
      alert('خوش آمدید مدیر گرامی! با موفقیت وارد پنل شدید. ✨');
    } else {
      setAdminUrlError('رمز عبور وارد شده نامعتبر است.');
    }
  };

  const handleExitAdminMode = () => {
    setIsAdminUrlMode(false);
    if (window.location.hash) {
      window.location.hash = '';
    }
    if (window.location.pathname.toLowerCase().endsWith('/admin')) {
      window.history.replaceState(null, '', '/');
    }
    setActiveView('home');
  };

  // Load Session from LocalStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('diamond_alttin_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
  }, []);

  // Fetch real-time collections from Firebase Firestore
  useEffect(() => {
    const unsubBanners = onSnapshot(query(collection(db, 'banners'), orderBy('createdAt', 'desc')), (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'banners');
    });

    const unsubCategories = onSnapshot(query(collection(db, 'categories'), orderBy('createdAt', 'desc')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => {
      unsubBanners();
      unsubCategories();
      unsubProducts();
    };
  }, []);

  // Fetch only current user's orders in real-time
  useEffect(() => {
    if (!currentUser.isLoggedIn) {
      setMyOrders([]);
      return;
    }

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Client-side filter to be absolutely safe and support offline/flexible routing
      const filtered = allOrders.filter(o => o.userId === currentUser.username);
      setMyOrders(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Auth Handler
  const handleAuthSuccess = (session: UserSession, isNewUser: boolean) => {
    setCurrentUser(session);
    if (isNewUser) {
      setIsWelcomeOpen(true);
    }
    setActiveView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('diamond_alttin_session');
    setCurrentUser({ username: '', role: 'user', isLoggedIn: false });
    setCartItems([]);
    setActiveView('home');
    window.location.reload();
  };

  // Cart Management
  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        // cap quantity at product stock limits
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        alert(`کالا با موفقیت به تعداد ${quantity} عدد دیگر به سبد خرید اضافه شد.`);
        return prevItems.map((item) => 
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      alert('کالا با موفقیت به سبد خرید اضافه گردید.');
      return [...prevItems, { product, quantity }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartItems((prevItems) => 
      prevItems.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.min(Math.max(item.quantity + delta, 1), item.product.stock);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Focus Search Action
  const handleSearchNavClick = () => {
    setActiveView('home');
    setMobileMenuOpen(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Default Luxury Banners if none uploaded by admin
  const defaultBanners = [
    {
      id: 'default-1',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200&h=675'
    },
    {
      id: 'default-2',
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200&h=675'
    }
  ];

  const activeBanners = banners.length > 0 ? banners : defaultBanners;

  // Handle Admin URL Mode first
  if (isAdminUrlMode) {
    return (
      <div className="min-h-screen bg-black text-gray-200 font-sans flex flex-col justify-center items-center px-4 relative text-right dir-rtl selection:bg-[#D4AF37] selection:text-black">
        {/* Decorative luxury glowing backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#080808]/90 border border-[#D4AF37]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(212,175,55,0.05)] backdrop-blur-md z-10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-[#D4AF37]/40 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">ورود به پنل مدیریت دایموند آلتین</h2>
            <p className="text-[10px] text-[#D4AF37] font-mono tracking-widest mt-1 uppercase">Secure Administrative Vault</p>
          </div>

          <form onSubmit={handleAdminPasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">کد عبور ادمین را وارد کنید:</label>
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-center font-mono text-sm tracking-widest text-[#D4AF37] focus:border-[#D4AF37]/60 focus:outline-none transition-all"
                required
                autoFocus
              />
            </div>

            {adminUrlError && (
              <p className="text-xs text-red-500 text-center font-medium bg-red-500/5 py-2 rounded-lg border border-red-500/10">
                {adminUrlError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-extrabold rounded-xl text-xs tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>باز کردن قفل پنل مدیریت</span>
            </button>

            <button
              type="button"
              onClick={handleExitAdminMode}
              className="w-full py-3 bg-transparent border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>بازگشت به فروشگاه</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Auth page if not logged in
  if (!currentUser.isLoggedIn) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans flex flex-col justify-between selection:bg-[#D4AF37] selection:text-black">
      
      {/* 1. SCROLL-DRIVEN HERO HEADER SECTION */}
      <Hero />

      {/* 2. NAVIGATION BAR */}
      <nav id="main-navigation-bar" className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Branding - Left: word 'diamond' aligned far left */}
            <div id="nav-branding-left" className="flex items-center select-none cursor-pointer" onClick={() => setActiveView('home')}>
              <span className="text-xl font-light tracking-[0.2em] text-white font-sans uppercase hover:text-[#D4AF37] transition-all">
                diamond
              </span>
            </div>

            {/* Middle Nav Items (Desktop Menu) */}
            <div id="nav-desktop-menu" className="hidden md:flex items-center gap-1.5 text-right dir-rtl">
              <button 
                id="nav-link-home"
                onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${activeView === 'home' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
              >
                خانه
              </button>
              <button 
                id="nav-link-search"
                onClick={handleSearchNavClick}
                className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-400 hover:text-white transition-colors"
              >
                جستجو
              </button>
              <button 
                id="nav-link-blogs"
                onClick={() => { setActiveView('blogs'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${activeView === 'blogs' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
              >
                وبلاگ‌ها
              </button>
              <button 
                id="nav-link-about"
                onClick={() => { setActiveView('about'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${activeView === 'about' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
              >
                درباره ما
              </button>
              <button 
                id="nav-link-support"
                onClick={() => { setActiveView('support'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${activeView === 'support' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
              >
                پشتیبانی
              </button>
              <button 
                id="nav-link-orders"
                onClick={() => { setActiveView('orders'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${activeView === 'orders' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
              >
                سفارشات من
              </button>
              <button 
                id="nav-link-purchases"
                onClick={() => { setActiveView('purchases'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${activeView === 'purchases' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
              >
                خریدهای من
              </button>
              <button 
                id="nav-link-logout"
                onClick={handleLogout}
                className="px-3 py-2 text-xs font-semibold tracking-wide text-red-500 hover:text-red-400 transition-colors"
              >
                خروج
              </button>


            </div>

            {/* Shopping Cart & Mobile Menu Buttons */}
            <div id="nav-actions-right" className="flex items-center gap-4">
              <button
                id="btn-nav-cart"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-all cursor-pointer"
                title="سبد خرید"
              >
                <ShoppingBag className="w-5.5 h-5.5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black font-mono">
                    {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Profile Badge info */}
              <div id="nav-profile-badge" className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-gray-300 font-medium truncate max-w-[80px]">{currentUser.username}</span>
              </div>

              {/* Mobile hamburger menu button */}
              <button
                id="btn-mobile-hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Branding - Right: word 'alttin' aligned far right */}
            <div id="nav-branding-right" className="flex items-center select-none cursor-pointer" onClick={() => setActiveView('home')}>
              <span className="text-xl font-light tracking-[0.2em] text-[#D4AF37] font-sans uppercase hover:text-white transition-all ml-1.5">
                alttin
              </span>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div id="mobile-nav-menu" className="md:hidden bg-[#0c0c0c] border-b border-white/10 px-4 pt-2 pb-4 space-y-2 text-right dir-rtl animate-fade-in">
            <div className="flex justify-between items-center mb-4 px-2 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-gray-300 font-bold">{currentUser.username}</span>
                <span className="text-[10px] text-gray-500 font-mono">({currentUser.role === 'admin' ? 'مدیر' : 'کاربر'})</span>
              </div>
            </div>

            <button 
              onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white"
            >
              صفحه اصلی فروشگاه
            </button>
            <button 
              onClick={handleSearchNavClick}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white"
            >
              جستجو کالا
            </button>
            <button 
              onClick={() => { setActiveView('blogs'); setMobileMenuOpen(false); }}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white"
            >
              وبلاگ‌ها و مقالات آموزشی
            </button>
            <button 
              onClick={() => { setActiveView('about'); setMobileMenuOpen(false); }}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white"
            >
              درباره ما
            </button>
            <button 
              onClick={() => { setActiveView('support'); setMobileMenuOpen(false); }}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white"
            >
              پشتیبانی و تیکت‌ها
            </button>
            <button 
              onClick={() => { setActiveView('orders'); setMobileMenuOpen(false); }}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white"
            >
              سفارشات من
            </button>
            <button 
              onClick={() => { setActiveView('purchases'); setMobileMenuOpen(false); }}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white"
            >
              خریدهای من
            </button>
            <button 
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="block w-full py-2.5 px-3 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/5 hover:text-red-400"
            >
              خروج از حساب
            </button>


          </div>
        )}
      </nav>

      {/* 3. MAIN WORKSPACE VIEWPORT */}
      <main className="flex-grow">
        
        {/* VIEW 1: HOME PAGE (STORE FRONT) */}
        {activeView === 'home' && (
          <div id="home-view-container" className="animate-fade-in pb-16">
            
            {/* 16:9 Banner Slider Section */}
            <div id="banner-slider" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#D4AF37]/20 shadow-[0_4px_30px_rgba(212,175,55,0.05)]">
                {activeBanners.length > 0 && (
                  <img 
                    src={activeBanners[0].imageUrl} 
                    alt="پیش‌نمایش بنر لوکس" 
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Visual Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 md:p-12 text-right dir-rtl select-none">
                  <div className="space-y-2">
                    <span className="text-[#D4AF37] text-[10px] tracking-[0.3em] font-mono uppercase block font-semibold">Luxury Collection</span>
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white">گالری طلا و جواهرات دایموند آلتین</h2>
                    <p className="text-xs md:text-sm text-gray-300 max-w-xl">مجموعه‌ای نفیس از مدرن‌ترین، مقاوم‌ترین و باشکوه‌ترین بدلیجات ضد حساسیت با ثبات رنگ تضمینی.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar Section */}
            <div id="store-controls-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-b border-white/5 bg-white/[0.01]">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                
                {/* Category Pills (Dynamic from Firestore categories) */}
                <div className="flex flex-wrap gap-2 text-right dir-rtl">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === 'all' 
                        ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.2)]' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    همه محصولات
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        selectedCategory === cat.id 
                          ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.2)]' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Minimalist Search Input */}
                <div className="relative w-full md:w-80">
                  <input
                    ref={searchInputRef}
                    id="store-search-input"
                    type="text"
                    placeholder="جستجوی بدلیجات لوکس..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl py-2 pl-4 pr-10 text-xs text-white placeholder-gray-500 focus:border-[#D4AF37] text-right dir-rtl"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>

              </div>
            </div>

            {/* Products Grid */}
            <div id="store-products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-24 text-gray-500">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm">هیچ محصولی مطابق با فیلتر شما یافت نشد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {filteredProducts.map((prod) => (
                    <ProductCard 
                      key={prod.id} 
                      product={prod} 
                      onViewDetails={(p) => { setSelectedProduct(p); setIsDetailsOpen(true); }} 
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: BLOGS PAGE */}
        {activeView === 'blogs' && (
          <div id="blogs-view-container" className="max-w-5xl mx-auto px-6 py-12 text-right dir-rtl animate-fade-in">
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="w-16 h-[1px] bg-[#D4AF37] mb-3" />
              <h2 className="text-3xl font-extrabold text-white">وبلاگ دایموند آلتین</h2>
              <p className="text-xs text-[#D4AF37] mt-1 font-mono tracking-widest uppercase">Jewelry Care & Style Guide</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Blog 1 */}
              <div className="bg-[#090909] border border-white/10 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all duration-300">
                <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400&h=250" alt="ثبات رنگ بدلیجات" className="w-full h-44 object-cover" />
                <div className="p-5 space-y-3">
                  <span className="text-[10px] text-[#D4AF37] font-bold font-mono">CARE GUIDE</span>
                  <h3 className="font-extrabold text-white text-base">راهنمای جامع ثبات رنگ؛ بدلیجات خود را تا همیشه درخشان نگه دارید</h3>
                  <p className="text-xs text-gray-400 leading-relaxed text-justify">
                    برخلاف زیورآلات ساده، بدلیجات دایموند آلتین با پیشرفته‌ترین متدهای آبکاری اتمی طلا مجهز شده‌اند. با این وجود، دور نگه داشتن آنها از مواد شیمیایی مستقیم مانند الکل، عطر، تافت و شوینده‌های شدید به حفظ جلای طلا کمک بسزایی خواهد کرد. همواره زیورآلات خود را پس از هر بار استفاده با پارچه میکروفایبر نرم پاک کرده و در جعبه مخصوص خود نگهداری فرمایید.
                  </p>
                </div>
              </div>

              {/* Blog 2 */}
              <div className="bg-[#090909] border border-white/10 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all duration-300">
                <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400&h=250" alt="ترندهای ۲۰۲۶" className="w-full h-44 object-cover" />
                <div className="p-5 space-y-3">
                  <span className="text-[10px] text-[#D4AF37] font-bold font-mono">TRENDS 2026</span>
                  <h3 className="font-extrabold text-white text-base">ترندهای برتر اکسسوری و بدلیجات لوکس در سال ۲۰۲۶</h3>
                  <p className="text-xs text-gray-400 leading-relaxed text-justify">
                    در سال ۲۰۲۶، گرایش اصلی طراحان مد به سمت تلفیق الگوهای کلاسیک اواسط قرن بیستم با متدهای برش اتمی نوین رفته است. حلقه‌های کارتیر زنجیری، آویزهای ظریف مروارید با زنجیرهای بافت ماری، و انگشترهای دو ردیفه با نگین‌های تراش‌خورده زمردی از درخشان‌ترین و پرطرفدارترین ترندهای اکسسوری امسال هستند که همگی در گالری ما عرضه می‌شوند.
                  </p>
                </div>
              </div>

              {/* Blog 3 */}
              <div className="bg-[#090909] border border-white/10 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all duration-300">
                <img src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400&h=250" alt="اصالت آلتین" className="w-full h-44 object-cover" />
                <div className="p-5 space-y-3">
                  <span className="text-[10px] text-[#D4AF37] font-bold font-mono">CULTURE</span>
                  <h3 className="font-extrabold text-white text-base">چرا نام آلتین؟ بررسی اصالت فلزات گرانبها در طراحی معاصر</h3>
                  <p className="text-xs text-gray-400 leading-relaxed text-justify">
                    کلمه «آلتین» در زبان‌های اصیل ریشه در طلا، ارزش پایدار و کمال دارد. دایموند آلتین با الهام از درخشش جاودانه الماس و اصالت طلا، تلاش می‌کند محصولاتی بسازد که تنها جنبه تزئینی ندارند، بلکه داستانی از سلیقه متمایز شما را در نگاه دیگران تداعی می‌کنند. ارزش واقعی یک کالا به اصالت طرح و احساس شکوهی است که به شما می‌بخشد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ABOUT US PAGE */}
        {activeView === 'about' && (
          <div className="animate-fade-in py-8">
            <AboutUs />
          </div>
        )}

        {/* VIEW 4: SUPPORT PAGE */}
        {activeView === 'support' && (
          <div className="animate-fade-in py-8">
            <SupportSection currentUser={currentUser} />
          </div>
        )}

        {/* VIEW 5: MY ORDERS PAGE */}
        {activeView === 'orders' && (
          <div id="orders-view-container" className="max-w-4xl mx-auto px-6 py-12 text-right dir-rtl animate-fade-in">
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="w-16 h-[1px] bg-[#D4AF37] mb-3" />
              <h2 className="text-3xl font-extrabold text-white">سفارشات من</h2>
              <p className="text-xs text-[#D4AF37] mt-1 font-mono tracking-widest uppercase">My Active Orders Status</p>
            </div>

            {myOrders.length === 0 ? (
              <div className="bg-[#0c0c0c] border border-white/10 p-12 rounded-2xl text-center text-gray-500">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-pulse" />
                <p className="text-sm">سفارشی از طرف شما در انتظار بررسی ثبت نشده است.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {myOrders.map((order) => (
                  <div key={order.id} className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl">
                    <div className="flex flex-wrap justify-between items-center border-b border-white/5 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] text-[#D4AF37] block font-mono">شناسه سفارش: {order.id}</span>
                        <span className="text-xs text-gray-400">ثبت شده در: {new Date(order.createdAt).toLocaleDateString('fa-IR')}</span>
                      </div>

                      {/* Order Status Badge */}
                      <div className="mt-2 sm:mt-0">
                        {order.status === 'pending' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-4 h-4" />
                            در انتظار تایید فیش بانکی
                          </span>
                        )}
                        {order.status === 'approved' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            تایید شده توسط مالی و در حال ارسال
                          </span>
                        )}
                        {order.status === 'rejected' && (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            رد شده
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-300">
                      <div>
                        <h4 className="font-bold text-[#D4AF37] mb-2 text-sm">مشخصات ارسال و تحویل:</h4>
                        <p className="mb-1"><strong>شماره تماس:</strong> <span className="font-mono">{order.phone}</span></p>
                        <p className="mb-1"><strong>آدرس گیرنده:</strong> {order.address}</p>
                        <p className="mb-1"><strong>کد پستی گیرنده:</strong> <span className="font-mono">{order.postalCode}</span></p>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#D4AF37] mb-2 text-sm">اقلام خریداری شده:</h4>
                        <div className="space-y-1.5">
                          {order.items.map((it, i) => (
                            <div key={i} className="bg-black p-2 rounded-lg flex justify-between">
                              <span>{it.title} <span className="text-gray-500">({it.quantity} عدد)</span></span>
                              <span className="font-mono text-[#D4AF37]">{it.price.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Delivery / Rejection Feedback Notice */}
                    {order.status === 'approved' && order.deliveryInfo && (
                      <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                        <strong>زمان‌بندی تحویل کالا:</strong> {order.deliveryInfo}
                      </div>
                    )}

                    {order.status === 'rejected' && order.rejectReason && (
                      <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-400">
                        <strong>علت رد فیش واریزی توسط مدیریت:</strong> {order.rejectReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: MY PURCHASES PAGE */}
        {activeView === 'purchases' && (
          <div id="purchases-view-container" className="max-w-4xl mx-auto px-6 py-12 text-right dir-rtl animate-fade-in">
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="w-16 h-[1px] bg-[#D4AF37] mb-3" />
              <h2 className="text-3xl font-extrabold text-white">خریدهای من</h2>
              <p className="text-xs text-[#D4AF37] mt-1 font-mono tracking-widest uppercase">My Delivered Purchases</p>
            </div>

            {/* List only fully approved purchases */}
            {myOrders.filter(o => o.status === 'approved').length === 0 ? (
              <div className="bg-[#0c0c0c] border border-white/10 p-12 rounded-2xl text-center text-gray-500">
                <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm">خریدی از جانب شما نهایی و ارسال نشده است.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.filter(o => o.status === 'approved').map((order) => (
                  <div key={order.id} className="bg-gradient-to-l from-white/[0.02] to-transparent border border-[#D4AF37]/30 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <span className="text-[10px] text-[#D4AF37] font-mono block">سفارش تایید شده شماره: {order.id}</span>
                      <h4 className="font-extrabold text-white text-sm mt-1">تعداد {order.items.reduce((acc, it) => acc + it.quantity, 0)} محصول اکسسوری لوکس</h4>
                      <p className="text-xs text-gray-400 mt-1">ارسال شده به آدرس: {order.address}</p>
                    </div>

                    <div className="mt-3 sm:mt-0 flex flex-col items-end">
                      <span className="text-xs text-gray-500">مبلغ پرداخت شده:</span>
                      <span className="text-base font-extrabold text-[#D4AF37] font-mono">
                        {order.items.reduce((acc, it) => acc + (it.price * it.quantity), 0).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: ADMIN PANEL VIEW (RESTRICTED ROLE === 'ADMIN') */}
        {activeView === 'admin' && currentUser.role === 'admin' && (
          <div className="animate-fade-in py-6">
            <AdminPanel />
          </div>
        )}

      </main>

      {/* 4. MAIN FOOTER */}
      <footer id="main-footer" className="bg-[#050505] border-t border-[#D4AF37]/10 py-12 text-right dir-rtl select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Widget 1 */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-lg font-light tracking-widest uppercase text-white font-sans">
                diamond <span className="text-[#D4AF37]">alttin</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed text-justify">
                گالری الماس آلتین مقصدی ایده‌آل برای کسانی است که به دنبال بدلیجات لوکس، مجلل، با دوام رنگ بی‌نظیر و ضد حساسیت هستند. ما تلاش می‌کنیم تا بهترین اکسسوری‌های روز دنیا را با آبکاری اصل، بسته‌بندی ویژه و قیمتی شایسته ارائه دهیم.
              </p>
            </div>

            {/* Widget 2 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">دسترسی سریع</h4>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li><button onClick={() => setActiveView('home')} className="hover:text-[#D4AF37] transition-colors">گالری محصولات</button></li>
                <li><button onClick={() => setActiveView('blogs')} className="hover:text-[#D4AF37] transition-colors">وبلاگ و آموزش‌ها</button></li>
                <li><button onClick={() => setActiveView('about')} className="hover:text-[#D4AF37] transition-colors">داستان برند دایموند آلتین</button></li>
                <li><button onClick={() => setActiveView('support')} className="hover:text-[#D4AF37] transition-colors">ارسال تیکت پشتیبانی</button></li>
              </ul>
            </div>

            {/* Widget 3 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">تماس با گالری</h4>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>پشتیبانی: ۰۹۱۲۳۴۵۶۷۸۹</span>
                </li>
                <li>آدرس: تهران، خیابان ولیعصر، برج تجاری لوکس، طبقه همکف، واحد ۸</li>
              </ul>
            </div>

          </div>

          <div className="border-t border-white/5 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} گالری لوکس دایموند آلتین. تمامی حقوق محفوظ است.</p>
            <p className="mt-2 md:mt-0 font-sans tracking-wide">DESIGNED FOR MAJESTIC ROYALTY</p>
          </div>
        </div>
      </footer>

      {/* --- ALL MODALS OVERLAYS --- */}

      {/* Welcome Modal for Newly Registered Users */}
      <WelcomeModal 
        isOpen={isWelcomeOpen} 
        onClose={() => setIsWelcomeOpen(false)} 
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailsOpen}
        onClose={() => { setSelectedProduct(null); setIsDetailsOpen(false); }}
        onAddToCart={handleAddToCart}
        currentUser={currentUser}
        onOpenAuth={() => {}} // Simple placeholder since they must be authenticated to use the app in general
      />

      {/* Cart Checkout Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
      />

    </div>
  );
}
