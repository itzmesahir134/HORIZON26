import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function TimerArc({ totalTime, onComplete, isPaused }) {
  const arcRef = useRef(null);
  const tweenRef = useRef(null);
  
  const radius = 24;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  useEffect(() => {
    if (!arcRef.current) return;

    // Ensure initial state
    gsap.set(arcRef.current, { 
      strokeDashoffset: 0,
      stroke: '#8eff71'
    });

    tweenRef.current = gsap.to(arcRef.current, {
      strokeDashoffset: circumference,
      duration: totalTime,
      ease: 'none',
      onUpdate: function() {
        if (!arcRef.current) return;
        const progress = this.progress();
        const pct = 1 - progress;
        
        // Color transition logic
        let color = '#8eff71'; // Green
        if (pct <= 0.25) {
          color = '#ff5555'; // Red
        } else if (pct <= 0.5) {
          color = '#D69E2E'; // Yellow
        }
        
        gsap.set(arcRef.current, { stroke: color });
      },
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [totalTime, circumference, onComplete]);

  useEffect(() => {
    if (tweenRef.current) {
      if (isPaused) {
        tweenRef.current.pause();
      } else {
        tweenRef.current.play();
      }
    }
  }, [isPaused]);

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          stroke="rgba(255,255,255,0.05)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Animated arc */}
        <circle
          ref={arcRef}
          stroke="#8eff71"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute font-display text-[9px] text-gray-500 tracking-widest mt-0.5">
        TIME
      </div>
    </div>
  );
}
