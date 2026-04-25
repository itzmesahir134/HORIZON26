import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function LandingScreen({ onStart }) {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const taglineRef = useRef(null);
  const descRef = useRef(null);
  const buttonRef = useRef(null);
  const hudRef = useRef(null);
  const overlayRef = useRef(null);

  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Initial entrance animation
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Ensure elements are initially invisible
    gsap.set([titleRef.current, taglineRef.current, descRef.current, buttonRef.current, hudRef.current], { 
      opacity: 0, 
      y: 30 
    });
    
    gsap.set(overlayRef.current, { opacity: 0 });

    tl.to(overlayRef.current, { opacity: 1, duration: 1 })
      .to(titleRef.current, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'back.out(1.5)' }, '-=0.5')
      .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.8 }, '-=0.8')
      .to(descRef.current, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
      .to(buttonRef.current, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .to(hudRef.current, { opacity: 1, duration: 1 }, '-=0.2');

    return () => {
      tl.kill();
    };
  }, []);

  const handleStart = () => {
    if (isExiting) return;
    setIsExiting(true);

    const tl = gsap.timeline({
      onComplete: () => {
        onStart();
      }
    });

    tl.to([buttonRef.current, descRef.current, taglineRef.current, titleRef.current, hudRef.current], {
      opacity: 0,
      y: -20,
      stagger: 0.1,
      duration: 0.5,
      ease: 'power2.in'
    })
    .to(containerRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut'
    }, '-=0.2');
  };

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center font-display">
      
      {/* Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover filter blur-[2px] opacity-70"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* Gradients / Overlays */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"
      />
      
      {/* HUD Lines / Scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        
        {/* Title */}
        <h1 
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.2em] text-white uppercase mb-4"
          style={{
            textShadow: '0 0 20px rgba(142,255,113,0.4), 0 0 40px rgba(142,255,113,0.2)',
            transform: 'scale(0.95)'
          }}
        >
          Project Cipher
        </h1>

        {/* Tagline */}
        <p 
          ref={taglineRef}
          className="text-xl md:text-2xl text-primary/90 tracking-widest uppercase font-medium mb-6"
          style={{ textShadow: '0 0 10px rgba(142,255,113,0.3)' }}
        >
          Decode the pattern. Outsmart the system.
        </p>

        {/* Description */}
        <p 
          ref={descRef}
          className="text-sm md:text-base text-gray-400 tracking-wide mb-12 max-w-xl font-hud uppercase"
        >
          Use deduction and logic to crack the hidden sequence before time runs out.
        </p>

        {/* Start Button */}
        <button
          ref={buttonRef}
          onClick={handleStart}
          className="group relative px-10 py-4 overflow-hidden rounded-sm transition-all duration-300"
        >
          <div className="absolute inset-0 bg-primary/10 border border-primary/50 group-hover:bg-primary/20 group-hover:border-primary transition-all duration-300" />
          
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: 'inset 0 0 20px rgba(142,255,113,0.5)' }} 
          />

          <span className="relative z-10 text-primary font-bold tracking-[0.25em] text-lg group-hover:text-white transition-colors duration-300"
            style={{ textShadow: '0 0 10px rgba(142,255,113,0.5)' }}
          >
            ENTER SYSTEM
          </span>

          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />
        </button>
      </div>

      {/* Decorative HUD Elements */}
      <div ref={hudRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-8 text-primary/50 text-xs font-hud tracking-widest">
          SYS.INIT // v2.0.4
        </div>
        <div className="absolute top-8 right-8 text-primary/50 text-xs font-hud tracking-widest">
          STATUS: CLASSIFIED
        </div>
        <div className="absolute bottom-8 left-8 text-primary/50 text-xs font-hud tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-primary/50 rounded-full animate-pulse" />
          AWAITING INPUT...
        </div>
        <div className="absolute bottom-8 right-8 text-primary/50 text-xs font-hud tracking-widest">
          LOC: SECTOR_7
        </div>
      </div>
    </div>
  );
}
