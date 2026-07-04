import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserSession } from '../types';
import { Sparkles, Shield, User, Lock, ArrowLeftRight } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (session: UserSession, isNewUser: boolean) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('لطفاً نام کاربری و رمز عبور خود را وارد کنید.');
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    const cleanUsername = username.trim().toLowerCase();

    // Regex check to ensure username contains only standard characters
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (isSignUp && !usernameRegex.test(cleanUsername)) {
      alert('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و خط زیر (_) باشد (بدون فاصله یا کاراکترهای خاص).');
      setLoading(false);
      return;
    }

    if (isSignUp && cleanUsername.length < 3) {
      alert('نام کاربری باید حداقل ۳ کاراکتر باشد.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // --- SIGN UP FLOW ---
        // Check registration limit per device (maximum 3 accounts)
        const deviceRegsStr = localStorage.getItem('diamond_alttin_device_regs');
        let deviceRegs: string[] = [];
        if (deviceRegsStr) {
          try {
            deviceRegs = JSON.parse(deviceRegsStr);
          } catch (e) {
            deviceRegs = [];
          }
        }
        deviceRegs = Array.from(new Set(deviceRegs)).map(u => u.trim().toLowerCase());

        if (!deviceRegs.includes(cleanUsername) && deviceRegs.length >= 3) {
          alert('شما بیش از حد مجاز با این دستگاه حساب کاربری ثبت کرده‌اید (حداکثر ۳ حساب کاربری برای هر دستگاه مجاز است).');
          setLoading(false);
          return;
        }

        // Check if username already exists
        const q = query(usersRef, where('username', '==', cleanUsername));
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'users');
          return;
        }

        if (!snapshot.empty) {
          alert('این نام کاربری قبلاً ثبت شده است. نام کاربری دیگری انتخاب کنید.');
          setLoading(false);
          return;
        }

        // Determine Role: if password matches secret key "13911400"
        const isAdmin = password.trim() === '13911400';
        const role = isAdmin ? 'admin' : 'user';

        // Add user document to Firestore
        try {
          await addDoc(usersRef, {
            username: cleanUsername,
            password: password.trim(), // Storing as plain text per local simplified requirements
            role: role,
            createdAt: Date.now()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'users');
          return;
        }

        // Save to device registration list
        if (!deviceRegs.includes(cleanUsername)) {
          deviceRegs.push(cleanUsername);
          localStorage.setItem('diamond_alttin_device_regs', JSON.stringify(deviceRegs));
        }

        const newSession: UserSession = {
          username: cleanUsername,
          role: role,
          isLoggedIn: true
        };

        // Save session locally
        localStorage.setItem('diamond_alttin_session', JSON.stringify(newSession));
        onAuthSuccess(newSession, true); // true indicates a new user, triggers welcome modal!
      } else {
        // --- LOGIN FLOW ---
        const q = query(
          usersRef, 
          where('username', '==', cleanUsername),
          where('password', '==', password.trim())
        );
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'users');
          return;
        }

        if (snapshot.empty) {
          // Fallback: Check if they want to login with secret key as admin directly
          if (password.trim() === '13911400') {
            const adminSession: UserSession = {
              username: username.trim().toLowerCase(),
              role: 'admin',
              isLoggedIn: true
            };
            localStorage.setItem('diamond_alttin_session', JSON.stringify(adminSession));
            onAuthSuccess(adminSession, false);
            return;
          }

          alert('نام کاربری یا رمز عبور اشتباه است.');
          setLoading(false);
          return;
        }

        // Fetch user data
        const userDoc = snapshot.docs[0].data();
        let role = userDoc.role;

        // Double check secret override for direct promotions
        if (password.trim() === '13911400') {
          role = 'admin';
        }

        const loggedInSession: UserSession = {
          username: userDoc.username,
          role: role,
          isLoggedIn: true
        };

        localStorage.setItem('diamond_alttin_session', JSON.stringify(loggedInSession));
        onAuthSuccess(loggedInSession, false);
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      alert('خطایی در برقراری ارتباط با پایگاه‌داده رخ داد. لطفاً مجدداً تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page-container" className="min-h-screen bg-black flex flex-col justify-center items-center px-4 py-12 relative text-right dir-rtl">
      {/* Decorative luxury glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Luxury Brand title */}
      <div className="text-center mb-8 select-none z-10">
        <h1 className="text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-white font-sans">
          diamond <span className="text-[#D4AF37]">alttin</span>
        </h1>
        <p className="text-xs text-gray-400 mt-2 tracking-[0.1em] font-sans">
          GALLERY OF ROYAL JEWELRY & ACCESSORIES
        </p>
      </div>

      {/* Auth Card */}
      <div id="auth-card" className="relative w-full max-w-md bg-[#090909] border border-[#D4AF37]/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.1)] z-10">
        
        {/* Aesthetic design details */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#D4AF37]/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-[#D4AF37]/20 rounded-bl-2xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-3 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30 mb-2">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isSignUp ? 'ثبت‌نام در گالری بدلیجات' : 'ورود به حساب کاربری'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">طراحی خیره‌کننده، دوام بی‌نظیر، اصالت تضمین‌شده</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-300 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>نام کاربری:</span>
            </label>
            <input
              type="text"
              placeholder="مثال: diamond_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-xs text-white focus:border-[#D4AF37] text-left ltr"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>رمز عبور:</span>
            </label>
            <input
              type="password"
              placeholder="کلمه عبور شما"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-xs text-white focus:border-[#D4AF37] text-left ltr"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#bfa02e] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300 mt-6"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? 'ایجاد حساب کاربری و ورود' : 'ورود به گالری'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <button
            id="toggle-auth-mode"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setUsername('');
              setPassword('');
            }}
            className="text-xs text-gray-400 hover:text-[#D4AF37] flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {isSignUp ? 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید' : 'حساب کاربری ندارید؟ ثبت‌نام کنید'}
          </button>
        </div>

        {/* Help Note for Admin activation */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-500 font-sans">
            وارد کردن رمز عبور <span className="text-[#D4AF37] font-mono">13911400</span> به منزله دسترسی مدیریت می‌باشد.
          </p>
        </div>

      </div>
    </div>
  );
}
