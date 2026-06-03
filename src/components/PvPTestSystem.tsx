import React, { useState, useEffect, useRef } from 'react';
import { GameMode, RankTier } from '../types';
import { RANK_TIERS, getRankByPoints } from '../mockData';
import { Zap, Target, Flame, ArrowUp, RotateCcw, Brain, Activity, ShieldAlert, CheckCircle, Crosshair, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PvPTestSystemProps {
  currentMode: GameMode;
  onTestComplete: (mode: GameMode, score: number, stats: { cps?: number; accuracy?: number; avgReactionMs?: number }) => void;
  userRank: RankTier;
}

// Synthesize satisfying retro combat sound effects using standard Web Audio API
const playSound = (type: 'slash' | 'crit' | 'shield' | 'ping' | 'success') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'slash') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } else if (type === 'crit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } else if (type === 'shield') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.25);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.26);
    } else if (type === 'ping') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, audioCtx.currentTime);
      osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.08);
      osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.16);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.36);
    }
  } catch (error) {
    // Web Audio disabled or blocked by browser gesture
  }
};

export default function PvPTestSystem({ currentMode, onTestComplete, userRank }: PvPTestSystemProps) {
  const [activeTest, setActiveTest] = useState<'cps' | 'aim' | 'reaction' | 'tracking' | 'strategy' | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'playing' | 'completed'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [testResult, setTestResult] = useState<{ score: number; text: string; details: any } | null>(null);
  
  // CPS State
  const [cpsClicks, setCpsClicks] = useState(0);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const cpsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Aim State
  const [aimTargets, setAimTargets] = useState<{ id: number; x: number; y: number; createdAt: number }[]>([]);
  const [aimHits, setAimHits] = useState(0);
  const [aimMisses, setAimMisses] = useState(0);
  const [aimTotalClicks, setAimTotalClicks] = useState(0);
  const targetIdCounter = useRef(0);
  const aimTimerRef = useRef<number | null>(null);
  const aimSpawnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reaction State
  const [reactionColor, setReactionColor] = useState<'red' | 'green'>('red');
  const [reactionMessage, setReactionMessage] = useState('HOLD SHIELD! Wait for barrier break...');
  const [reactionStartTime, setReactionStartTime] = useState<number | null>(null);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tracking State
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [isHoveredTarget, setIsHoveredTarget] = useState(false);
  const [trackingScore, setTrackingScore] = useState(0); // time ticks on target
  const [totalTrackingTicks, setTotalTrackingTicks] = useState(0);
  const trackingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trackingTickRef = useRef<NodeJS.Timeout | null>(null);
  const trackingAngleRef = useRef(0);

  // Strategy State
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [strategyScores, setStrategyScores] = useState<boolean[]>([]);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null);

  const testModes = [
    { id: 'cps', title: 'CPS Clicker Master', desc: 'Eval pure mechanical mouse clicking, trigger combat sweeps and hit speeds.', icon: Zap, color: 'text-green-400 border-green-500/20 shadow-green-950/20' },
    { id: 'aim', title: 'Critical Aim Precision', desc: 'Spawn active targets in combat zone to assess your targeting mechanics.', icon: Crosshair, color: 'text-red-400 border-red-500/20 shadow-red-950/20' },
    { id: 'reaction', title: 'Reaction Reflex Block', desc: 'Simulate critical bow deflecting or instant splash potions.', icon: Flame, color: 'text-amber-400 border-amber-500/20 shadow-amber-950/20' },
    { id: 'tracking', title: 'Smooth Aim Tracking', desc: 'Evaluate your ability to trace fluid PvP opponents and circular strafes.', icon: Target, color: 'text-cyan-400 border-cyan-500/20 shadow-cyan-950/20' },
    { id: 'strategy', title: 'PvP Tactical S-Tap Mind', desc: 'Multi-scenario mock battlefield cases inspecting high-level combo rules.', icon: Brain, color: 'text-purple-400 border-purple-500/20 shadow-purple-950/20' },
  ];

  const SCENARIOS = [
    {
      question: "An opponent is at 1.5 hearts but has speed III effects active. They are shield-blocking and S-Tapping you. You are at 4 hearts, no potions. What is the META choice?",
      options: [
        { text: "Hammer spacebar to crit-trade directly into their shield", correct: false, rating: "Fails! S-Tapping holds distance. Trading directly results in counter-combos." },
        { text: "Launch a custom S-Tap fishing rod/bow shot to disable movement, then block-hit", correct: true, rating: "HT1 Master tactical! Ranged disruption breaks S-Tap momentum immediately." },
        { text: "Backpedal in a straight line and build a defensive block shield", correct: false, rating: "Sub-optimal. Straight line fleeing allows them to leap and reach with high fov." },
        { text: "Splash a dynamic healing potion downwards and reset the fight completely", correct: false, rating: "Risk of splash overflow! Splashing down while moving speeds up their dive." }
      ]
    },
    {
      question: "In standard 1.21 OP Mace combat, what determines the ultimate combat critical strike multipliers?",
      options: [
        { text: "The total amount of health remaining on your target", correct: false, rating: "Incorrect database. Mace crit depends solely on height vector velocity." },
        { text: "Height distance of block fall velocity before impact", correct: true, rating: "Correct Master. Mace scaling boosts in exact alignment with height fall vectors." },
        { text: "Spamming the jump button under speed II pot modifiers", correct: false, rating: "Fails. Jump-spamming creates basic criticals, not high vector fall crits." },
        { text: "Synchronized blocking and sword swinging on the ground", correct: false, rating: "Fails. Ground shield combat blocks mace multipliers completely." }
      ]
    },
    {
      question: "Your Nethepotion shield combat is collapsing inside a tight obsidian corner. You have 1 splash potion of healing II left. Opponent has active Strength II. What is your response?",
      options: [
        { text: "Equip shield, look up, splash potion, and hope for recoil bounce", correct: false, rating: "Fails. High splash creates delay, letting Strength II shred you." },
        { text: "Look straight down into your feet, block-shield jump, splash instantly", correct: true, rating: "Correct. Instasplash at feet during jumping guarantees recovery frames." },
        { text: "Leap forward with an axe swing to disable their active axe", correct: false, rating: "High risk. Trading into Strength II without health secures demotion." },
        { text: "Flee into the corner without weapon active to preserve armor hunger", correct: false, rating: "Zero defence! Unarmed corner locking results in instant shield pierce." }
      ]
    }
  ];

  // Global Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'countdown') {
      if (countdown > 0) {
        playSound('ping');
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        setCountdown(3);
        setGameState('playing');
        startTestBehavior();
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  const triggerTestInit = (testId: typeof activeTest) => {
    setActiveTest(testId);
    setGameState('countdown');
    setCountdown(3);
    setTestResult(null);
    clearPlayStates();
  };

  const clearPlayStates = () => {
    setCpsClicks(0);
    setClickTimestamps([]);
    setAimTargets([]);
    setAimHits(0);
    setAimMisses(0);
    setAimTotalClicks(0);
    setReactionColor('red');
    setReactionMessage('HOLD SHIELD! Wait for barrier break...');
    setReactionStartTime(null);
    setTargetPos({ x: 50, y: 50 });
    setIsHoveredTarget(false);
    setTrackingScore(0);
    setTotalTrackingTicks(0);
    setStrategyIndex(0);
    setStrategyScores([]);
    setSelectedScenarioIndex(null);
  };

  const startTestBehavior = () => {
    if (activeTest === 'cps') {
      const duration = 5000;
      cpsTimerRef.current = setTimeout(() => {
        setGameState('completed');
        evaluateCpsTest();
      }, duration);
    } 
    else if (activeTest === 'aim') {
      targetIdCounter.current = 0;
      setAimTargets([]);
      setAimHits(0);
      setAimMisses(0);
      setAimTotalClicks(0);
      
      // Spawn target immediately
      spawnAimTarget();

      // Interval to spawn targets every 600ms
      aimSpawnIntervalRef.current = setInterval(() => {
        spawnAimTarget();
      }, 550);

      // Duration is 7 seconds
      setTimeout(() => {
        if (aimSpawnIntervalRef.current) clearInterval(aimSpawnIntervalRef.current);
        setGameState('completed');
        evaluateAimTest();
      }, 7000);
    }
    else if (activeTest === 'reaction') {
      setReactionColor('red');
      setReactionMessage('HOLD DEFENSE... WAIT FOR OPPONENT OPENING');
      
      // Randomized opening delay between 2 and 5 seconds
      const delay = 2000 + Math.random() * 3000;
      reactionTimerRef.current = setTimeout(() => {
        setReactionColor('green');
        setReactionMessage('OPPONENT SHIELD DISABLED! PIERCE CRITICAL STRIKE (CLICK NOW!)');
        setReactionStartTime(performance.now());
        playSound('success');
      }, delay);
    }
    else if (activeTest === 'tracking') {
      setTrackingScore(0);
      setTotalTrackingTicks(0);
      trackingAngleRef.current = 0;

      // Coordinate tracking dot motion
      trackingTickRef.current = setInterval(() => {
        trackingAngleRef.current += 0.08;
        // Float path
        const scaleX = 40;
        const scaleY = 35;
        const x = 50 + Math.sin(trackingAngleRef.current) * scaleX;
        const y = 50 + Math.cos(trackingAngleRef.current * 1.6) * scaleY;
        setTargetPos({ x, y });
      }, 30);

      // Score evaluation clock
      trackingTimerRef.current = setInterval(() => {
        setTotalTrackingTicks(prev => {
          const next = prev + 1;
          if (isHoveredTarget) {
            setTrackingScore(s => s + 1);
            playSound('ping');
          }
          if (next >= 100) {
            clearInterval(trackingTimerRef.current!);
            clearInterval(trackingTickRef.current!);
            setGameState('completed');
            evaluateTrackingTest();
          }
          return next;
        });
      }, 50);
    }
    else if (activeTest === 'strategy') {
      setStrategyIndex(0);
      setStrategyScores([]);
      setSelectedScenarioIndex(null);
    }
  };

  const cancelTest = () => {
    if (cpsTimerRef.current) clearTimeout(cpsTimerRef.current);
    if (aimSpawnIntervalRef.current) clearInterval(aimSpawnIntervalRef.current);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
    if (trackingTickRef.current) clearInterval(trackingTickRef.current);
    
    setGameState('idle');
    setActiveTest(null);
    setTestResult(null);
  };

  // --- ACTIONS PER TEST ---

  // CPS Click Register
  const handleCpsClick = () => {
    if (gameState !== 'playing' || activeTest !== 'cps') return;
    playSound('slash');
    setCpsClicks(prev => prev + 1);
    setClickTimestamps(prev => [...prev, performance.now()]);
  };

  // Evaluate CPS
  const evaluateCpsTest = () => {
    const totalClicks = cpsClicks;
    const finalCps = parseFloat((totalClicks / 5).toFixed(1));
    
    // Convert CPS into rating (Max realistic is 16 CPS)
    // 0-4 CPS = Low rank points (10-30), 12+ CPS = HT1 level points (95+)
    let calculatedPercent = Math.min(100, Math.floor((finalCps / 14) * 100));
    if (calculatedPercent < 15) calculatedPercent = 15;

    // determine descriptive texts
    let ratingDescription = "";
    if (finalCps < 6) ratingDescription = "Slow single-clicks. Practice jitter clicking or palm grip.";
    else if (finalCps < 9) ratingDescription = "Decent casual standard clicks. Standard shield combat ready.";
    else if (finalCps < 12) ratingDescription = "Stellar combat jitter clicks! Capable of sustaining high-level sweeps.";
    else ratingDescription = "Elite tier click frequencies. Flawless sword combos and rapid block resetting!";

    const res = {
      score: calculatedPercent,
      text: ratingDescription,
      details: {
        cps: finalCps,
        totalClicks: totalClicks
      }
    };
    setTestResult(res);
  };

  // Spawn Aim target
  const spawnAimTarget = () => {
    // avoid target crowding
    setAimTargets(prev => {
      // clip targets to 5 maximum
      const capped = prev.length > 4 ? prev.slice(1) : prev;
      return [
        ...capped,
        {
          id: targetIdCounter.current++,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 80,
          createdAt: Date.now()
        }
      ];
    });
  };

  // Target Hit Register
  const handleAimTargetClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent registering as miss in box
    if (gameState !== 'playing') return;
    playSound('crit');
    setAimHits(prev => prev + 1);
    setAimTotalClicks(prev => prev + 1);
    setAimTargets(prev => prev.filter(t => t.id !== id));
  };

  const handleAimMiss = () => {
    if (gameState !== 'playing') return;
    playSound('shield');
    setAimMisses(prev => prev + 1);
    setAimTotalClicks(prev => prev + 1);
  };

  // Evaluate Aim Test
  const evaluateAimTest = () => {
    if (aimSpawnIntervalRef.current) clearInterval(aimSpawnIntervalRef.current);
    const totalHits = aimHits;
    const accuracy = aimTotalClicks > 0 ? parseFloat(((totalHits / aimTotalClicks) * 100).toFixed(1)) : 0;
    
    // Score based on speed and hits (Max target spawns in 7s is ~12-13)
    let score = Math.min(100, Math.floor((totalHits / 10) * 50 + (accuracy * 0.5)));
    if (score < 10) score = 10;

    let ratingDescription = "";
    if (accuracy < 50) ratingDescription = "Poor tracking accuracy. Slow down your DPI to lock critical hits.";
    else if (accuracy < 80) ratingDescription = "Steady aim. Decent tracking but missed some targets during stress.";
    else if (score > 85) ratingDescription = "Ultimate marksman coordinates! True bow boost and combo ready!";
    else ratingDescription = "Surgical aim accuracy. Fantastic reflex adjustment under high combat pace.";

    setTestResult({
      score,
      text: ratingDescription,
      details: {
        hits: totalHits,
        accuracy: accuracy
      }
    });
  };

  // Reaction Click
  const handleReactionClick = () => {
    if (gameState !== 'playing') return;

    if (reactionColor === 'red') {
      // Pre-fire penalty
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      playSound('shield');
      setTestResult({
        score: 5,
        text: "OPPONENT ACCIDENTALLY CRIT YOU! Defending early results in sudden shield breakdown.",
        details: { reactionMs: 'PENALTY (Clicked early)' }
      });
      setGameState('completed');
    } else {
      const clickTime = performance.now();
      const differenceMs = Math.round(clickTime - (reactionStartTime || 0));
      playSound('crit');

      // Rank mapping
      // 150ms = 100 points, 350ms = 40 points, 500ms+ = 10 points
      let calculatedScore = Math.max(10, Math.floor(100 - (differenceMs - 140) * 0.3));
      if (calculatedScore > 100) calculatedScore = 100;

      let desc = "";
      if (differenceMs < 190) desc = "Flawless reflexes! Instant diamond swap shield breakthrough.";
      else if (differenceMs < 270) desc = "Above average speed index. Solid arena duelling timing.";
      else desc = "Slower reflex index. Opponent recovered and reset defensive states.";

      setTestResult({
        score: calculatedScore,
        text: desc,
        details: { reactionMs: `${differenceMs}ms` }
      });
      setGameState('completed');
    }
  };

  // Evaluate Tracking
  const evaluateTrackingTest = () => {
    const accuracy = parseFloat(((trackingScore / totalTrackingTicks) * 100).toFixed(1));
    const score = Math.max(10, Math.floor(accuracy));

    let desc = "";
    if (accuracy < 40) desc = "Cursor slipped frequently. Smooth out strafe curves using drag friction.";
    else if (accuracy < 75) desc = "Capable locks. Smooth target tracing, ready for mid-tier battle combat.";
    else desc = "Elite PvP lock. Glued to the opponent during high velocity circular S-strafe sweeps!";

    setTestResult({
      score,
      text: desc,
      details: { trackingAccuracy: `${accuracy}%` }
    });
  };

  // Strategy click Option
  const handleStrategyChoice = (optionIdx: number) => {
    setSelectedScenarioIndex(optionIdx);
    const correct = SCENARIOS[strategyIndex].options[optionIdx].correct;
    
    if (correct) {
      playSound('success');
    } else {
      playSound('shield');
    }

    setStrategyScores(prev => [...prev, correct]);
  };

  const handleNextScenario = () => {
    setSelectedScenarioIndex(null);
    if (strategyIndex < SCENARIOS.length - 1) {
      setStrategyIndex(idx => idx + 1);
    } else {
      // Evaluate Strategy test
      const corrects = strategyScores.filter(s => s).length;
      const score = Math.floor((corrects / SCENARIOS.length) * 100);

      let desc = "";
      if (corrects === SCENARIOS.length) desc = "Mastermind! Faultless understanding of combat spacing, S-Taps, and recovery frames.";
      else if (corrects > 1) desc = "Advanced strategy metrics. You know the basics of pots usage but missed some details.";
      else desc = "Fledgling tactical layout. Opponents will combo you easily until you master timing ranges.";

      setTestResult({
        score: Math.max(10, score),
        text: desc,
        details: { correctAnswers: `${corrects}/${SCENARIOS.length}` }
      });
      setGameState('completed');
    }
  };

  // Complete and save back to profiles
  const handleSaveResult = () => {
    if (!testResult) return;
    
    // Add custom stat aggregates to forward
    const resultStats: any = {};
    if (activeTest === 'cps') resultStats.cps = testResult.details.cps;
    if (activeTest === 'aim') resultStats.accuracy = testResult.details.accuracy;
    if (activeTest === 'reaction') resultStats.avgReactionMs = parseInt(testResult.details.reactionMs) || 250;
    
    playSound('success');
    onTestComplete(currentMode, testResult.score, resultStats);
    
    // reset
    setGameState('idle');
    setActiveTest(null);
    setTestResult(null);
  };

  return (
    <div id="pvp-test-module" className="bg-[#0b0c10]/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-2.5 py-1 rounded">
              PVP EVALUATION
            </span>
            <span className="text-xs font-mono text-zinc-500 uppercase">
              ACTIVE MODE: <b className="text-white">{currentMode}</b>
            </span>
          </div>
          <h2 id="module-title" className="text-2xl font-sans font-bold tracking-tight text-white mt-1.5">
            PvP Combative Testing Arena
          </h2>
        </div>
        
        {activeTest && (
          <button
            id="abort-button"
            onClick={cancelTest}
            className="mt-3 md:mt-0 text-xs font-mono font-semibold tracking-wider text-red-400 bg-red-950/20 border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
          >
            ABORT TEST RESETS
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE VIEW */}
        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {testModes.map((test) => {
              const Icon = test.icon;
              return (
                <div
                  key={test.id}
                  id={`test-card-${test.id}`}
                  className={`bg-[#12141c]/50 p-5 rounded-xl border flex flex-col justify-between hover:border-zinc-700 hover:bg-[#12141c]/80 transition-all group scale-100 active:scale-98 relative overflow-hidden`}
                >
                  <div className="absolute right-0 bottom-0 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="w-40 h-40" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className={`p-2.5 rounded-lg bg-[#0d0f12]/90 border border-zinc-800 ${test.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-sans font-bold text-white group-hover:text-[#39FF14] transition-colors">
                        {test.title}
                      </h4>
                    </div>
                    <p className="text-sm text-zinc-400 font-sans leading-relaxed mb-4">
                      {test.desc}
                    </p>
                  </div>
                  
                  <button
                    id={`start-btn-${test.id}`}
                    onClick={() => triggerTestInit(test.id as any)}
                    className="w-full text-xs font-mono font-bold uppercase tracking-widest text-[#39FF14] hover:text-black bg-[#39FF14]/5 hover:bg-[#39FF14] border border-[#39FF14]/20 hover:border-[#39FF14] py-2.5 rounded-lg transition-all duration-300 shadow shadow-[#39FF14]/0 hover:shadow-[#39FF14]/20 cursor-pointer"
                  >
                    LAUNCH CHALLENGE →
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* COUNTDOWN VIEW */}
        {gameState === 'countdown' && (
          <motion.div
            key="countdown-box"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="text-sm font-mono tracking-widest text-zinc-500 uppercase mb-4">
              PREPARING combat SIMULATION
            </div>
            <div className="w-24 h-24 rounded-full border border-zinc-800 bg-zinc-950/80 flex items-center justify-center text-5xl font-mono font-bold text-[#39FF14] shadow-2xl shadow-[#39FF14]/20">
              {countdown}
            </div>
            <div className="text-[#39FF14]/60 font-mono text-xs mt-6 uppercase animate-pulse">
              SYNCING WITH SKINS DB & TARGET COLLIDERS...
            </div>
          </motion.div>
        )}

        {/* PLAYING STATUS */}
        {gameState === 'playing' && (
          <motion.div
            key="playing-arena"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#0c0d13]/70 border border-zinc-900 rounded-xl p-5"
          >
            {/* CPS Test Interface */}
            {activeTest === 'cps' && (
              <div className="flex flex-col items-center py-8">
                <div className="flex justify-between w-full max-w-sm mb-4 text-xs font-mono text-zinc-500">
                  <span>TEST MODULE: CPS CLICKER</span>
                  <span className="text-[#39FF14]">DURATION: 5 SECONDS</span>
                </div>
                
                <button
                  id="cps-target"
                  onClick={handleCpsClick}
                  className="w-56 h-56 rounded-2xl bg-gradient-to-tr from-zinc-900 to-[#121420] border-2 border-zinc-800 hover:border-[#39FF14] active:scale-95 transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-lg hover:shadow-[#39FF14]/10 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#39FF14]/5 opacity-0 group-active:opacity-100 transition-opacity" />
                  <Flame className="w-10 h-10 text-zinc-600 group-hover:text-[#39FF14] group-active:scale-125 transition-transform mb-3" />
                  <span className="text-xs font-mono font-semibold tracking-wider text-zinc-500 uppercase">
                    CLICK HIGHLIGHT
                  </span>
                  <span className="text-3xl font-mono font-bold text-white mt-1">
                    {cpsClicks}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600 tracking-wider uppercase mt-1">
                    SWINGS CALCULATED
                  </span>
                </button>
                
                <div className="mt-6 flex flex-col items-center">
                  <span className="text-xs font-mono text-zinc-500">
                    REAL-TIME VELOCITY: <b className="text-white">{(cpsClicks / 5).toFixed(1)} CPS</b>
                  </span>
                  <div className="w-48 bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden border border-zinc-800">
                    <div
                      className="bg-[#39FF14] h-full transition-all duration-300 shadow-glow"
                      style={{ width: `${Math.min(100, (cpsClicks / 60) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AIM TEST INTERFACE */}
            {activeTest === 'aim' && (
              <div className="flex flex-col">
                <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
                  <span>TARGET HIT MATRIX</span>
                  <span>
                    HITS: <b className="text-green-400">{aimHits}</b> / MISSES:{' '}
                    <b className="text-red-400">{aimMisses}</b>
                  </span>
                </div>
                
                <div
                  id="aim-combat-zone"
                  onClick={handleAimMiss}
                  className="w-full h-80 bg-zinc-950/65 rounded-xl border border-zinc-900 relative overflow-hidden cursor-crosshair"
                >
                  <AnimatePresence>
                    {aimTargets.map((target) => (
                      <motion.button
                        key={target.id}
                        id={`aim-target-${target.id}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => handleAimTargetClick(target.id, e)}
                        className="absolute w-8 h-8 rounded-full bg-red-600 border border-red-400 cursor-pointer flex items-center justify-center text-white active:scale-90 shadow-2xl shadow-red-650/40"
                        style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <Crosshair className="w-4.5 h-4.5 animate-pulse" />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  
                  {aimTargets.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-zinc-700 uppercase select-none">
                      AWAITING RED VECTOR TARGET FLUIDITY...
                    </div>
                  )}
                </div>
                
                <span className="text-[10px] font-mono text-zinc-600 mt-2 text-center uppercase block">
                  MISSED CLICKS RECOIL SHIELD DEGRADATION
                </span>
              </div>
            )}

            {/* REACTION TEST INTERFACE */}
            {activeTest === 'reaction' && (
              <div className="flex flex-col items-center py-6">
                <div
                  id="reaction-pad"
                  onClick={handleReactionClick}
                  className={`w-full max-w-lg h-60 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 p-6 ${
                    reactionColor === 'red'
                      ? 'bg-red-950/10 border-red-900/30 text-red-400 shadow-inner'
                      : 'bg-emerald-950/20 border-emerald-500/40 text-[#39FF14] shadow-2xl shadow-emerald-500/10'
                  }`}
                >
                  {reactionColor === 'red' ? (
                    <ShieldAlert className="w-14 h-14 animate-bounce mb-3 text-red-500/80" />
                  ) : (
                    <Sparkles className="w-14 h-14 animate-spin mb-3 text-emerald-400" />
                  )}
                  
                  <div className="text-center">
                    <span className="text-xl font-sans font-bold tracking-tight">
                      {reactionMessage}
                    </span>
                    <span className="block text-xs font-mono uppercase tracking-widest text-zinc-500 mt-3 animate-pulse">
                      {reactionColor === 'red' ? 'HOLD CRITICAL PRE-FIRE BLOCK (DO NOT CLICK)' : 'CLICK INSTANTLY! SWAP STRIKE!'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TRACKING TEST INTERFACE */}
            {activeTest === 'tracking' && (
              <div className="flex flex-col">
                <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
                  <span>VELOCITY STRAFE SIMULATION</span>
                  <span>
                    TARGET ON TRACK: <b className={isHoveredTarget ? 'text-[#39FF14]' : 'text-zinc-500'}>{Math.floor((trackingScore / Math.max(1, totalTrackingTicks)) * 100)}%</b>
                  </span>
                </div>
                
                <div className="w-full h-80 bg-zinc-950/65 rounded-xl border border-zinc-900 relative overflow-hidden">
                  <div
                    id="tracking-dot"
                    onMouseEnter={() => setIsHoveredTarget(true)}
                    onMouseLeave={() => setIsHoveredTarget(false)}
                    className={`absolute w-7 h-7 rounded-full border flex items-center justify-center transition-shadow cursor-default ${
                      isHoveredTarget
                        ? 'bg-[#39FF14] border-emerald-300 shadow-lg shadow-[#39FF14]/40 scale-110'
                        : 'bg-zinc-850 border-zinc-700 shadow shadow-black'
                    }`}
                    style={{
                      left: `${targetPos.x}%`,
                      top: `${targetPos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'left 30ms linear, top 30ms linear',
                    }}
                  >
                    <Activity className={`w-3.5 h-3.5 ${isHoveredTarget ? 'text-black' : 'text-zinc-400'}`} />
                  </div>
                  
                  <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none">
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950/60 px-3 py-1.5 rounded-md border border-zinc-900 uppercase">
                      TRACE DOT WITH CURSOR DURING MOVEMENT
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-zinc-900 h-1 mt-4 overflow-hidden rounded-full border border-zinc-900">
                  <div className="bg-[#39FF14] h-full" style={{ width: `${totalTrackingTicks}%` }} />
                </div>
              </div>
            )}

            {/* STRATEGY TEST INTERFACE */}
            {activeTest === 'strategy' && (
              <div className="flex flex-col p-2">
                <div className="flex justify-between text-xs font-mono text-zinc-500 mb-4 pb-2 border-b border-zinc-900">
                  <span>BATTLETACTIC PROFILE {strategyIndex + 1} OF {SCENARIOS.length}</span>
                  <span className="text-[#39FF14]">PRACTICE RUN</span>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-base font-sans font-bold text-white leading-relaxed mb-1">
                    {SCENARIOS[strategyIndex].question}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {SCENARIOS[strategyIndex].options.map((option, idx) => {
                    const isSelected = selectedScenarioIndex === idx;
                    const isCorrect = option.correct;
                    
                    let cardStyle = 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700';
                    if (selectedScenarioIndex !== null) {
                      if (isSelected) {
                        cardStyle = isCorrect
                          ? 'bg-emerald-950/20 border-emerald-500 text-green-400'
                          : 'bg-red-950/20 border-red-500 text-red-400';
                      } else if (isCorrect) {
                        cardStyle = 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400';
                      } else {
                        cardStyle = 'bg-zinc-950/20 border-transparent text-zinc-600';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        id={`option-${idx}`}
                        disabled={selectedScenarioIndex !== null}
                        onClick={() => handleStrategyChoice(idx)}
                        className={`p-4 rounded-xl border text-left font-sans text-sm font-semibold leading-relaxed transition-all active:scale-99 ${cardStyle} ${selectedScenarioIndex === null ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs text-zinc-500 bg-zinc-950/40 px-2 py-0.5 rounded border border-zinc-900 uppercase">
                            Option {String.fromCharCode(65 + idx)}
                          </span>
                          <div>
                            <p>{option.text}</p>
                            {selectedScenarioIndex !== null && isSelected && (
                              <span className="block text-xs font-mono tracking-wide uppercase font-bold mt-2.5">
                                {option.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {selectedScenarioIndex !== null && (
                  <div className="flex justify-end">
                    <button
                      id="next-scenario-btn"
                      onClick={handleNextScenario}
                      className="px-6 py-2.5 bg-[#39FF14] text-black font-mono font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
                    >
                      {strategyIndex === SCENARIOS.length - 1 ? 'CONCLUDE EVALUATION' : 'NEXT BATTLECASE →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* COMPLETED REPORT */}
        {gameState === 'completed' && testResult && (
          <motion.div
            key="test-completed-view"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0e1017]/80 rounded-2xl border border-[#39FF14]/20 p-8 max-w-xl mx-auto shadow-2xl shadow-[#39FF14]/5 relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#39FF14]/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-emerald-950/20 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] mb-4">
                <CheckCircle className="w-8 h-8 animate-pulse" />
              </div>
              
              <span className="text-xs font-mono font-bold tracking-widest text-[#39FF14] uppercase">
                TEST COMPLETED SUCCESSFULLY
              </span>
              <h3 className="text-2xl font-sans font-extrabold text-white mt-1.5 leading-tight">
                Practice Score
              </h3>

              <div className="my-6">
                <span className="text-5xl font-mono font-extrabold bg-gradient-to-r from-emerald-400 to-[#39FF14] bg-clip-text text-transparent drop-shadow-lg">
                  {testResult.score}%
                </span>
                <span className="block text-[10px] font-mono uppercase text-zinc-500 tracking-wider mt-1.5">
                  ESTIMATING {getRankByPoints(testResult.score)} PERFORMANCE BRACKET • PRACTICE RUN
                </span>
              </div>

              <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-900 w-full mb-6">
                <p className="text-sm font-semibold font-sans text-emerald-300 antialiased leading-relaxed">
                  "{testResult.text}"
                </p>
                
                <div className="mt-4 pt-3 border-t border-zinc-900/60 grid grid-cols-2 gap-2 text-left">
                  {Object.entries(testResult.details).map(([key, val]: any) => (
                    <div key={key} className="bg-[#0b0c10]/40 px-3 py-2 rounded border border-zinc-900 font-mono text-xs">
                      <span className="text-zinc-500 capitalize block shrink-0">{key}:</span>
                      <span className="text-white font-bold block mt-0.5">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  id="submit-score-btn"
                  onClick={handleSaveResult}
                  className="flex-1 bg-[#39FF14] text-black font-mono font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-[#39FF14]/20"
                >
                  CONCLUDE PRACTICE CHALLENGE
                </button>
                <button
                  id="retry-test-btn"
                  onClick={() => triggerTestInit(activeTest)}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-white rounded-lg transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
