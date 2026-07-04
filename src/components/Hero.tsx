import React, { useEffect, useRef, useState } from 'react';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force load the video
    video.load();

    const handleLoadedMetadata = () => {
      setIsVideoReady(true);
      video.currentTime = 0;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollRange = 400; // The scroll distance over which the ring rotates
      const ratio = Math.min(Math.max(scrollY / scrollRange, 0), 1);
      setScrollRatio(ratio);

      if (!video || !video.duration || useFallback) return;

      // Map scroll ratio to video duration
      video.currentTime = ratio * (video.duration - 0.1); // slightly offset to prevent end-of-video glitches
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Fallback timer: if video doesn't load within 2 seconds, use the gorgeous SVG fallback
    const fallbackTimer = setTimeout(() => {
      if (video.readyState < 3) { // less than HAVE_FUTURE_DATA
        setUseFallback(true);
        setIsVideoReady(true);
      }
    }, 2000);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(fallbackTimer);
    };
  }, [useFallback]);

  return (
    <div id="hero-section" className="relative w-full h-[320px] md:h-[450px] bg-black overflow-hidden flex flex-col justify-center items-center border-b border-[#D4AF37]/30">
      {/* Background radial gradient for premium luxury look */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,rgba(0,0,0,1)_70%)] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-12 h-full flex items-center justify-between z-10">
        
        {/* Left Branding: "diamond" */}
        <div id="branding-diamond" className="flex-1 flex justify-start select-none">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-[0.2em] uppercase text-white hover:text-[#D4AF37] transition-all duration-700 font-sans">
            diamond
          </h1>
        </div>

        {/* Center Video Container with Gold Ring Ring Frame */}
        <div id="video-center-container" className="relative w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 flex items-center justify-center mx-4">
          {/* Subtle Outer Glowing Ring */}
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/40 animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.2)]" />
          <div className="absolute inset-2 rounded-full border border-dashed border-[#D4AF37]/20" />

          {/* Interactive Scroll Video or Luxurious SVG Fallback */}
          {useFallback ? (
            <div 
              id="luxury-svg-fallback-ring" 
              className="w-full h-full flex items-center justify-center scale-110 pointer-events-none select-none transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${scrollRatio * 360}deg)` }}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFE07D" />
                    <stop offset="30%" stopColor="#D4AF37" />
                    <stop offset="70%" stopColor="#AA7C11" />
                    <stop offset="100%" stopColor="#FFE07D" />
                  </linearGradient>
                  <radialGradient id="sparkle-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#FFECA1" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer Glow of the Gold Band */}
                <circle cx="100" cy="110" r="65" stroke="#D4AF37" strokeWidth="12" opacity="0.15" />
                
                {/* Main Golden Ring Band */}
                <circle cx="100" cy="110" r="65" stroke="url(#gold-grad)" strokeWidth="8" strokeLinecap="round" />
                
                {/* Ring highlight accents */}
                <circle cx="100" cy="110" r="61" stroke="#AA7C11" strokeWidth="1.5" opacity="0.6" />
                <circle cx="100" cy="110" r="69" stroke="#FFE07D" strokeWidth="1" opacity="0.8" />

                {/* Sparkling Diamond Crown Setting */}
                <g transform="translate(100, 45)">
                  {/* Golden prong base */}
                  <path d="M-12 0 C-6 -8 6 -8 12 0 L6 8 L-6 8 Z" fill="url(#gold-grad)" />
                  
                  {/* Diamond Gemstone facets */}
                  <polygon points="0,-16 -12,-5 -7,4 7,4 12,-5" fill="#E2F1FF" opacity="0.9" stroke="#A5D8FF" strokeWidth="1" />
                  <polygon points="0,-16 -6,-5 -7,4" fill="#FFFFFF" opacity="0.9" />
                  <polygon points="0,-16 6,-5 7,4" fill="#C5E3FF" opacity="0.9" />
                  <polygon points="-6,-5 6,-5 0,-16" fill="#FFFFFF" />
                  
                  {/* Diamond Shine effect */}
                  <circle cx="0" cy="-6" r="15" fill="url(#sparkle-grad)" className="animate-pulse" />
                </g>
              </svg>
            </div>
          ) : (
            <video
              ref={videoRef}
              id="scroll-driven-ring-video"
              src="https://assets.mixkit.co/videos/preview/mixkit-spinning-gold-wedding-ring-on-black-background-44161-large.mp4"
              className="w-full h-full object-cover rounded-full mix-blend-screen scale-110 pointer-events-none"
              muted
              playsInline
              preload="auto"
              onError={() => {
                setUseFallback(true);
                setIsVideoReady(true);
              }}
            />
          )}

          {!isVideoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black rounded-full">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Right Branding: "alttin" */}
        <div id="branding-alttin" className="flex-1 flex justify-end select-none">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-[0.2em] uppercase text-[#D4AF37] hover:text-white transition-all duration-700 font-sans">
            alttin
          </h1>
        </div>
      </div>

      {/* Subtitle / Scroll Prompt */}
      <div className="absolute bottom-4 left-0 right-0 text-center select-none z-10">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-400 font-mono">
          Scroll to Spin the Ring
        </p>
        <p className="text-[10px] text-[#D4AF37]/70 mt-1 font-sans">
          برای چرخش حلقه به پایین اسکرول کنید
        </p>
      </div>
    </div>
  );
}
