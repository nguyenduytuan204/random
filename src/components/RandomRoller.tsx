import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { Employee, ActionType, Rarity } from '../types';
import { RARITY_COLORS, ACTION_OPTIONS } from '../data/initialEmployees';
import { soundService } from '../services/soundService';
import { Dices, Sparkles, AlertCircle } from 'lucide-react';

export interface RandomRollerHandle {
  spin: () => void;
}

interface RandomRollerProps {
  employees: Employee[];
  selectedAction: ActionType;
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (winner: Employee) => void;
}

interface RollerItem {
  id: string;
  name: string;
  avatar: string;
  rarity: Rarity;
  originalId: string;
}

export const RandomRoller = forwardRef<RandomRollerHandle, RandomRollerProps>(({
  employees,
  selectedAction,
  isSpinning,
  onSpinStart,
  onSpinEnd,
}, ref) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [cards, setCards] = useState<RollerItem[]>([]);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraShaking, setIsCameraShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isWinningHighlighted, setIsWinningHighlighted] = useState(false);

  // Card dimensions (responsive)
  const [cardWidth, setCardWidth] = useState(160);
  const cardGap = 12;

  // Track responsive card width
  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        setCardWidth(130);
      } else {
        setCardWidth(160);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Filter only employees that are selected
  const activeEmployees = employees.filter(e => e.selected);

  // Initialize a preview strip
  useEffect(() => {
    if (activeEmployees.length === 0) {
      setCards([]);
      return;
    }

    // Generate initial preview cards
    const initialList: RollerItem[] = [];
    for (let i = 0; i < 40; i++) {
      const emp = activeEmployees[i % activeEmployees.length];
      initialList.push({
        id: `init-${i}`,
        name: emp.name,
        avatar: emp.avatar,
        rarity: emp.rarity,
        originalId: emp.id,
      });
    }
    setCards(initialList);
  }, [employees]);

  // Expose spin via imperative ref
  useImperativeHandle(ref, () => ({
    spin: startSpin,
  }));

  // Spin Engine
  const startSpin = () => {
    if (isSpinning) return;

    if (activeEmployees.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 nhân viên để quay!');
      soundService.playTick(0.6);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setErrorMessage(null);
    setIsWinningHighlighted(false);
    onSpinStart();

    // 1. Pick true winner using weighted random selection (Nguyễn Duy Tuấn has 1% probability)
    const getEmployeeWeight = (emp: Employee) => {
      if (emp.name.toLowerCase().includes('duy tuấn') || emp.id === 'emp-10' || emp.id === 'emp-4') {
        return 1;
      }
      return emp.weight !== undefined ? emp.weight : 8.25;
    };


    const totalWeight = activeEmployees.reduce((sum, emp) => sum + getEmployeeWeight(emp), 0);
    let randomVal = Math.random() * totalWeight;
    let winnerEmp = activeEmployees[0];
    for (const emp of activeEmployees) {
      const w = getEmployeeWeight(emp);
      if (randomVal < w) {
        winnerEmp = emp;
        break;
      }
      randomVal -= w;
    }


    // 2. Generate long roll tape (e.g. 70 cards total)
    const totalCards = 70;
    const targetIdx = 56; // Position where winner will sit
    const newCards: RollerItem[] = [];

    for (let i = 0; i < totalCards; i++) {
      if (i === targetIdx) {
        newCards.push({
          id: `spin-${i}-${winnerEmp.id}`,
          name: winnerEmp.name,
          avatar: winnerEmp.avatar,
          rarity: winnerEmp.rarity,
          originalId: winnerEmp.id,
        });
      } else {
        const randomEmp = activeEmployees[Math.floor(Math.random() * activeEmployees.length)];
        newCards.push({
          id: `spin-${i}-${randomEmp.id}`,
          name: randomEmp.name,
          avatar: randomEmp.avatar,
          rarity: randomEmp.rarity,
          originalId: randomEmp.id,
        });
      }
    }

    setCards(newCards);
    setWinningIndex(targetIdx);

    // 3. Calculate target position
    // Center needle is at container width / 2
    const containerWidth = containerRef.current?.offsetWidth || 800;
    const centerPoint = containerWidth / 2;

    // Organic jitter within winning card so it's not locked to the same dead center subpixel
    // range: -28% to +28% of card width
    const maxJitter = (cardWidth * 0.28);
    const jitter = (Math.random() * 2 - 1) * maxJitter;

    // Card position relative to track start:
    // Left offset of targetIdx card: targetIdx * (cardWidth + cardGap)
    // Center of this card: targetIdx * (cardWidth + cardGap) + cardWidth / 2
    // We want this card center + jitter to align with centerPoint:
    // translateX = -(targetCardCenter + jitter - centerPoint)
    const targetCardCenter = targetIdx * (cardWidth + cardGap) + cardWidth / 2;
    const finalScrollX = targetCardCenter + jitter - centerPoint;

    // Start Audio
    soundService.startRoll();

    // 4. Custom decel physics animation
    const duration = 5200; // 5.2 seconds CS2 duration
    const startTime = performance.now();
    let lastTickCardIndex = -1;
    let suspenseTriggered = false;

    // CS2 Quartic Easing Out: starts blistering fast, then drags out into tense crawl
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4.3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutQuart(progress);

      const currentX = finalScrollX * easedProgress;

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${currentX}px)`;

        // Motion blur effect in the first 2.5 seconds of high speed
        if (progress < 0.45) {
          const blurAmount = (1 - progress / 0.45) * 2.5;
          trackRef.current.style.filter = `blur(${blurAmount}px)`;
        } else {
          trackRef.current.style.filter = 'none';
        }
      }

      // Check which card is currently crossing the center needle
      const needlePositionOnTrack = currentX + centerPoint;
      const currentCardUnderNeedle = Math.floor(needlePositionOnTrack / (cardWidth + cardGap));

      if (currentCardUnderNeedle !== lastTickCardIndex && currentCardUnderNeedle >= 0 && currentCardUnderNeedle < totalCards) {
        lastTickCardIndex = currentCardUnderNeedle;
        // Pitch drops slightly as speed decreases
        const speedRatio = 1 - progress;
        soundService.playTick(0.8 + speedRatio * 0.6);
      }

      // Suspense cue near ending (progress ~ 72%)
      if (progress > 0.72 && !suspenseTriggered) {
        suspenseTriggered = true;
        soundService.playSuspense();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation finished!
        soundService.stopRoll();
        soundService.playWinner(winnerEmp.rarity);

        // Visual impacts: Camera shake + flash
        setIsCameraShaking(true);
        setIsFlashing(true);
        setIsWinningHighlighted(true);

        setTimeout(() => setIsCameraShaking(false), 500);
        setTimeout(() => setIsFlashing(false), 700);

        // Trigger winner callback
        setTimeout(() => {
          onSpinEnd(winnerEmp);
        }, 500);
      }
    };

    requestAnimationFrame(animate);
  };

  const currentAction = ACTION_OPTIONS.find(a => a.type === selectedAction) || ACTION_OPTIONS[0];

  return (
    <div className={`relative w-full my-4 md:my-6 ${isCameraShaking ? 'animate-screenshake' : ''}`}>
      {/* Error alert if no employee selected */}
      {errorMessage && (
        <div className="mb-3 p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-300 flex items-center gap-2 text-sm animate-bounce shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Roller Frame */}
      <div 
        ref={containerRef}
        className="relative w-full h-56 md:h-64 rounded-3xl bg-[#090d15] border-2 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex items-center"
      >
        {/* Flashbang / Victory Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 z-40 bg-white pointer-events-none animate-victory-flash" />
        )}

        {/* Outer Shadow Edge Gradients */}
        <div className="absolute top-0 bottom-0 left-0 w-16 md:w-28 z-20 bg-gradient-to-r from-[#090d15] via-[#090d15]/80 to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 md:w-28 z-20 bg-gradient-to-l from-[#090d15] via-[#090d15]/80 to-transparent pointer-events-none" />

        {/* Center Needle Laser (CS2 Precision Marker) */}
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center justify-between">
          {/* Top Arrow */}
          <div className="w-0 h-0 border-x-[9px] border-x-transparent border-t-[14px] border-t-amber-400 drop-shadow-[0_0_8px_#f59e0b] animate-bounce" />
          
          {/* Laser Line */}
          <div className="w-[2px] h-full bg-gradient-to-b from-amber-400 via-rose-500 to-amber-400 animate-laser" />
          
          {/* Bottom Arrow */}
          <div className="w-0 h-0 border-x-[9px] border-x-transparent border-b-[14px] border-b-amber-400 drop-shadow-[0_0_8px_#f59e0b] animate-bounce" />
        </div>

        {/* Roller Track Strip */}
        <div 
          ref={trackRef}
          className="flex items-center pl-4 will-change-transform"
          style={{ gap: `${cardGap}px` }}
        >
          {cards.map((card, idx) => {
            const rarity = RARITY_COLORS[card.rarity] || RARITY_COLORS.milspec;
            const isWinner = isWinningHighlighted && winningIndex === idx;

            return (
              <div
                key={card.id}
                className={`relative shrink-0 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-between border-2 transition-transform duration-300 ${
                  isWinner 
                    ? `scale-110 z-20 border-white shadow-[0_0_40px_rgba(255,255,255,0.8)] bg-slate-900` 
                    : `border-orange-500/80 bg-gradient-to-b from-orange-950/40 via-slate-950/80 to-slate-950/90 shadow-[0_0_15px_rgba(249,115,22,0.35)]`
                }`}
                style={{
                  width: `${cardWidth}px`,
                  height: window.innerWidth < 640 ? '180px' : '210px',
                  borderColor: isWinner ? '#ffffff' : '#f97316',
                  boxShadow: isWinner 
                    ? `0 0 30px #f97316, 0 0 60px rgba(255,255,255,0.6)` 
                    : `0 0 15px rgba(249, 115, 22, 0.35)`,
                }}
              >
                {/* Top spacer or status */}
                <div className="h-1 w-full" />

                {/* Avatar */}
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] transition-all ${
                    isWinner ? 'scale-105 ring-4 ring-white' : 'ring-2 ring-orange-500/60'
                  }`}
                  style={{ background: `linear-gradient(135deg, #f97316, #ea580c, #0f172a)` }}
                >

                  <img
                    src={card.avatar}
                    alt={card.name}
                    className="w-full h-full object-cover rounded-full bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.name)}&background=1e293b&color=38bdf8`;
                    }}
                  />
                </div>

                {/* Name */}
                <div className="w-full text-center">
                  <h4 className="text-xs md:text-sm font-bold text-slate-100 tracking-wide font-['Rajdhani',sans-serif] truncate">
                    {card.name}
                  </h4>
                </div>

                {/* Bottom Rarity Line */}
                <div 
                  className="w-full h-[3px] rounded-full"
                  style={{ backgroundColor: rarity.accent }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Spin Button Bar */}
      <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Info label */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Hành động áp dụng: </span>
          <strong 
            className="px-2.5 py-1 rounded-md border font-bold uppercase tracking-wider"
            style={{ 
              color: currentAction.glowColor,
              borderColor: currentAction.glowColor,
              backgroundColor: `${currentAction.glowColor}15`
            }}
          >
            {currentAction.label}
          </strong>
        </div>

        {/* Big CS2 Spin Button */}
        <button
          type="button"
          disabled={isSpinning || activeEmployees.length === 0}
          onClick={startSpin}
          className={`w-full sm:w-auto px-8 md:px-12 py-4 rounded-2xl font-black font-['Orbitron',sans-serif] tracking-widest text-lg md:text-xl uppercase transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer ${
            isSpinning
              ? 'bg-slate-800 text-slate-500 border-2 border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:shadow-[0_0_45px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 border-2 border-amber-300'
          }`}
        >
          <Dices className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'ĐANG QUAY...' : '🎲 QUAY NGAY'}</span>
        </button>
      </div>
    </div>
  );
});

RandomRoller.displayName = 'RandomRoller';
