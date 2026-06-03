import React, { useState, useEffect } from 'react';
import { GameMode, MinecraftPlayer, RankTier, AdminSettings, MatchHistoryItem } from './types';
import { MOCK_PLAYERS, RANK_TIERS, getRankByPoints, GAME_MODES } from './mockData';
import { getMinecraftAvatar, getCorrectAvatar } from './utils/minecraft';

// View components
import LandingPage from './components/LandingPage';
import LeaderboardsPage from './components/LeaderboardsPage';
import PvPTestSystem from './components/PvPTestSystem';
import PlayerProfile from './components/PlayerProfile';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';

// Custom icons
import { Swords, Trophy, Shield, ShieldAlert, Users, LogOut, Settings, Award, Menu, X, ArrowUpRight, Sparkles, Star, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Setup synthesized bells sound for ranks promotion
const playPromotionBell = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // Play an elegant Arpeggio
    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C E G C
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0.18, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.7);
    });
  } catch (err) {}
};

export default function App() {
  const [players, setPlayers] = useState<MinecraftPlayer[]>([]);
  const [currentUser, setCurrentUser] = useState<MinecraftPlayer | null>(null);
  const [isSessionAdmin, setIsSessionAdmin] = useState(false);
  
  // Global search input for sonictiers header
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Navigation
  const [activePage, setActivePage] = useState<'landing' | 'leaderboard' | 'test' | 'profile' | 'admin' | 'auth'>(() => {
    const savedPage = localStorage.getItem('sonictiers_active_page');
    if (savedPage) return savedPage as any;
    const localUser = localStorage.getItem('sonictiers_current_user');
    return localUser ? 'profile' : 'landing';
  });
  const [selectedPlayerForDossier, setSelectedPlayerForDossier] = useState<MinecraftPlayer | null>(null);
  
  // Active test configurations
  const [activeMode, setActiveMode] = useState<GameMode>('Sword');
  const [settings, setSettings] = useState<AdminSettings>({
    testLengthSeconds: 5,
    aimTargetCount: 15,
    banWords: ['cheat', 'toxic', 'hax'],
    autoPromotion: true
  });

  // Mobile nav state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Promotion animation states
  const [promotionCelebration, setPromotionCelebration] = useState<{
    prevRank: RankTier;
    nextRank: RankTier;
    points: number;
  } | null>(null);

  // Admin gate protection states
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminGateError, setAdminGateError] = useState('');

  // --- PERSISTENCE INITS ---
  useEffect(() => {
    // 1. Load players list from localStorage or load seed MOCK_PLAYERS
    const localPlayers = localStorage.getItem('sonictiers_players');
    let dbPlayers: MinecraftPlayer[] = [];
    
    if (localPlayers) {
      dbPlayers = JSON.parse(localPlayers);
    } else {
      dbPlayers = MOCK_PLAYERS;
      localStorage.setItem('sonictiers_players', JSON.stringify(MOCK_PLAYERS));
    }
    setPlayers(dbPlayers);

    // 2. Load active logged user
    const localUser = localStorage.getItem('sonictiers_current_user');
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      // reload live data of user from live DB to sync scores
      const matched = dbPlayers.find(p => p.username.toLowerCase() === parsedUser.username.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
      } else {
        setCurrentUser(parsedUser);
      }
    }

    // 3. Load active console session authorization status
    const sessionAdmin = localStorage.getItem('sonictiers_session_admin') === 'true';
    setIsSessionAdmin(sessionAdmin);
  }, []);

  // Sync state helpers to persistent Storage
  const updatePlayersDB = (nextPlayers: MinecraftPlayer[]) => {
    setPlayers(nextPlayers);
    localStorage.setItem('sonictiers_players', JSON.stringify(nextPlayers));
  };

  // --- ACTIONS ---

  // User Authenticated
  const handleLogin = (username: string, uuid: string, customAvatarUrl?: string, customBodyUrl?: string, isUnoriginal?: boolean) => {
    // Check if player name are quarantined under settings
    const isQuarantined = settings.banWords.some(word => username.toLowerCase().includes(word));
    if (isQuarantined) {
      alert("UNABLE TO REGISTER CODE: Your username contains characters flagged by filters.");
      return;
    }

    // Check if player already exists in the Database
    let matched = players.find(p => p.username.toLowerCase() === username.toLowerCase());
    
    if (!matched) {
      // Bootstrap clean competitor account
      const defaultStats: Record<GameMode, any> = {} as any;
      GAME_MODES.forEach(mode => {
        defaultStats[mode] = {
          mode,
          rank: 'LT5' as RankTier,
          points: 5,
          wins: 0,
          losses: 0,
          winRate: 0,
          kdRatio: 0,
          accuracy: 0,
          cps: 0
        };
      });

      matched = {
        username,
        uuid,
        id: uuid,
        xpLevel: 1,
        xpPoints: 100,
        overallRank: 'LT5',
        overallPoints: 0,
        winRate: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        achievements: [],
        matchHistory: [],
        stats: defaultStats,
        customAvatarUrl: customAvatarUrl || `https://mc-heads.net/avatar/${uuid}/64`,
        customBodyUrl: customBodyUrl || `https://mc-heads.net/body/${uuid}/200`,
        isUnoriginal: isUnoriginal || uuid.startsWith('offline-')
      };

      const updated = [matched, ...players];
      updatePlayersDB(updated);
    } else {
      // If player already exists, sync their profile skin URLs as well
      let changed = false;
      if (customAvatarUrl && matched.customAvatarUrl !== customAvatarUrl) {
        matched.customAvatarUrl = customAvatarUrl;
        changed = true;
      }
      if (customBodyUrl && matched.customBodyUrl !== customBodyUrl) {
        matched.customBodyUrl = customBodyUrl;
        changed = true;
      }
      if (changed) {
        matched.skinTimestamp = Date.now();
        const updated = players.map(p => p.username.toLowerCase() === username.toLowerCase() ? matched! : p);
        updatePlayersDB(updated);
      }
    }

    if (matched && matched.isBanned) {
      if (matched.banExpiresAt) {
        const expires = new Date(matched.banExpiresAt);
        const now = new Date();
        if (expires > now) {
          const diffMs = expires.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          alert(`ACCESS DENIED: Your account is suspended. Ban expires in ${diffDays} day(s).`);
          return;
        } else {
          // Ban has expired! Lift it automatically
          matched.isBanned = false;
          matched.banDurationDays = undefined;
          matched.banStartDate = undefined;
          matched.banExpiresAt = undefined;
          
          const updated = players.map(p => p.username.toLowerCase() === username.toLowerCase() ? matched! : p);
          updatePlayersDB(updated);
        }
      } else {
        alert("ACCESS DENIED: Your account is suspended permanently.");
        return;
      }
    }

    setCurrentUser(matched);
    localStorage.setItem('sonictiers_current_user', JSON.stringify(matched));
    setActivePage('profile');
    localStorage.setItem('sonictiers_active_page', 'profile');
    setSelectedPlayerForDossier(null);
  };

  // Sign out
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sonictiers_current_user');
    setIsSessionAdmin(false);
    localStorage.removeItem('sonictiers_session_admin');
    setActivePage('landing');
    localStorage.removeItem('sonictiers_active_page');
    setSelectedPlayerForDossier(null);
  };

  // Test finished
  const handleTestComplete = (mode: GameMode, score: number, testStats: { cps?: number; accuracy?: number; avgReactionMs?: number }) => {
    if (!currentUser) return;

    // Grab database records
    const userInDb = players.find(p => p.username === currentUser.username);
    if (!userInDb) return;

    // Under "just for fun" requirements, we do NOT modify the user's competitive points, levels, or rank ratings.
    const nextPoints = userInDb.stats[mode].points;
    const nextRank = userInDb.stats[mode].rank;

    const nextLvExp = userInDb.xpPoints;
    const nextLevel = userInDb.xpLevel;

    // Calculate aggregated mode division modifiers (only update personal bests for CPS/accuracy)
    const activeStat = userInDb.stats[mode];

    const finalModeStats = {
      ...activeStat,
      points: activeStat.points, // Points frozen
      rank: activeStat.rank,     // Ranks frozen
      accuracy: testStats.accuracy !== undefined ? Math.max(activeStat.accuracy || 0, testStats.accuracy) : activeStat.accuracy || 70,
      cps: testStats.cps !== undefined ? Math.max(activeStat.cps || 0, testStats.cps) : activeStat.cps || 8.5
    };

    // Update achievements unlocked based on progress (still allow click/CPS achievement for fun)
    const activeAchievements = [...userInDb.achievements];

    if (testStats.cps && testStats.cps >= 12 && !activeAchievements.some(a => a.id === 'ach_cps_god')) {
      activeAchievements.push({
        id: 'ach_cps_god',
        title: 'Click Jitter Overlord',
        description: 'Sustain 12+ CPS clicking speeds in active tests',
        iconName: 'zap',
        unlockedAt: new Date().toISOString().split('T')[0]
      });
    }

    // Assemble final user profile
    const finalStats = {
      ...userInDb.stats,
      [mode]: finalModeStats
    };

    const updatedUser: MinecraftPlayer = {
      ...userInDb,
      xpLevel: nextLevel,
      xpPoints: nextLvExp,
      stats: finalStats as Record<GameMode, any>,
      overallPoints: userInDb.overallPoints,
      overallRank: userInDb.overallRank,
      achievements: activeAchievements
    };

    // Overwrite database profile
    const nextPlayers = players.map(p => p.username === currentUser.username ? updatedUser : p);
    updatePlayersDB(nextPlayers);
    setCurrentUser(updatedUser);
    localStorage.setItem('sonictiers_current_user', JSON.stringify(updatedUser));
  };

  // Admin controls
  const handleAdminUpdateSettings = (nextConfig: AdminSettings) => {
    setSettings(nextConfig);
  };

  const handleAdminModifyBlockStatus = (username: string, nextBanned: boolean, durationDays?: number) => {
    let shouldLogoutUser = false;
    const updated = players.map(p => {
      if (p.username === username) {
        if (nextBanned) {
          shouldLogoutUser = true;
          const banStartDate = new Date().toISOString().split('T')[0];
          let banExpiresAt: string | undefined = undefined;
          if (durationDays && durationDays > 0) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + durationDays);
            banExpiresAt = expDate.toISOString();
          }
          return {
            ...p,
            isBanned: true,
            banDurationDays: durationDays,
            banStartDate,
            banExpiresAt
          };
        } else {
          return {
            ...p,
            isBanned: false,
            banDurationDays: undefined,
            banStartDate: undefined,
            banExpiresAt: undefined
          };
        }
      }
      return p;
    });
    updatePlayersDB(updated);

    if (shouldLogoutUser && currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
      handleLogout();
    }
  };

  const handleAdminTunePlayerELO = (username: string, nextPoints: number) => {
    const updated = players.map(p => {
      if (p.username === username) {
        const nextRank = getRankByPoints(nextPoints);
        
        // update stats points in and overall points
        const finalStats = { ...p.stats };
        GAME_MODES.forEach(m => {
          finalStats[m].points = nextPoints;
          finalStats[m].rank = nextRank;
        });

        return {
          ...p,
          overallPoints: nextPoints,
          overallRank: nextRank,
          stats: finalStats
        };
      }
      return p;
    });
    updatePlayersDB(updated);
  };

  const handleAdminToggleAdminStatus = (username: string, nextAdmin: boolean) => {
    const updated = players.map(p => {
      if (p.username === username) {
        return { ...p, isAdmin: nextAdmin };
      }
      return p;
    });
    updatePlayersDB(updated);

    if (currentUser && currentUser.username === username) {
      const nextUser = { ...currentUser, isAdmin: nextAdmin };
      setCurrentUser(nextUser);
      localStorage.setItem('sonictiers_current_user', JSON.stringify(nextUser));
    }
  };

  const handleAdminAddPlayer = (newPlayer: MinecraftPlayer) => {
    updatePlayersDB([...players, newPlayer]);
  };

  const handleAdminUpdatePlayer = (oldUsername: string, updatedPlayer: MinecraftPlayer) => {
    const updated = players.map(p => p.username === oldUsername ? updatedPlayer : p);
    updatePlayersDB(updated);

    if (currentUser && currentUser.username === oldUsername) {
      setCurrentUser(updatedPlayer);
      localStorage.setItem('sonictiers_current_user', JSON.stringify(updatedPlayer));
    }

    if (selectedPlayerForDossier && selectedPlayerForDossier.username === oldUsername) {
      setSelectedPlayerForDossier(updatedPlayer);
    }
  };

  const handleAdminDeletePlayer = (username: string) => {
    const updated = players.filter(p => p.username !== username);
    updatePlayersDB(updated);

    if (currentUser && currentUser.username === username) {
      handleLogout();
    }
  };

  const handleAdminGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = adminPasscode.trim().toLowerCase();

    if (cleanInput === 'sonicvault') {
      setIsSessionAdmin(true);
      localStorage.setItem('sonictiers_session_admin', 'true');
      setAdminPasscode('');
      setAdminGateError('');

      if (currentUser) {
        // Find user in DB to verify and set admin permissions
        const matched = players.find(p => p.username === currentUser.username);
        if (matched) {
          handleAdminToggleAdminStatus(currentUser.username, true);
        }
      }
      playPromotionBell();
    } else {
      setAdminGateError('TERMINAL ACCESS REFUSED: INVALID CREDENTIAL PASSPHRASE.');
    }
  };

  // Quick select other player profile dossier
  const handleSelectDossier = (username: string) => {
    const matched = players.find(p => p.username === username);
    if (matched) {
      setSelectedPlayerForDossier(matched);
      setIsMobileMenuOpen(false);
    }
  };

  // Nav routing switch helper
  const navigateTo = (page: typeof activePage) => {
    setActivePage(page);
    localStorage.setItem('sonictiers_active_page', page);
    setSelectedPlayerForDossier(null); // clear sub-profile viewing
    setIsMobileMenuOpen(false);
  };

  return (
    <div id="sonictiers-root-body" className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-[#39FF14] selection:text-black flex flex-col justify-between">
      
      {/* NAVBAR HEADER */}
      <header className="border-b border-zinc-900/80 bg-[#0c0e17] shadow-lg sticky top-0 z-45 select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-18 flex items-center justify-between gap-4">
          <div onClick={() => navigateTo('landing')} className="flex items-center gap-2 cursor-pointer group shrink-0 select-none">
            <div className="flex items-center font-sans tracking-tight select-none leading-none">
              <span className="text-[#39FF14] font-black text-2xl tracking-tighter select-none leading-none drop-shadow-[0_2px_4px_rgba(57,255,20,0.2)] font-sans lowercase">sonic</span>
              <span className="text-[#ffab00] font-black text-2xl tracking-tighter select-none leading-none drop-shadow-[0_2px_4px_rgba(255,171,0,0.2)] font-sans italic lowercase">tiers</span>
            </div>
          </div>

          {/* Desktop Top center navigation options exactly matching the screenshot */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider select-none">
            <button
              onClick={() => navigateTo('landing')}
              className={`flex items-center gap-1.5 cursor-pointer transition-all ${
                activePage === 'landing' ? 'text-white font-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="text-zinc-400 text-sm">🏠</span> Home
            </button>
            <button
              onClick={() => navigateTo('leaderboard')}
              className={`flex items-center gap-1.5 cursor-pointer transition-all ${
                activePage === 'leaderboard' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="text-amber-400 text-sm">🏆</span> Rankings
            </button>
            <button
              onClick={() => navigateTo('test')}
              className={`flex items-center gap-1.5 cursor-pointer transition-all ${
                activePage === 'test' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-250'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-[#39FF14]" /> Combat Challenges
            </button>
            <div className="flex items-center gap-1 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-all select-none group/dd relative">
              <span className="text-sm">💬</span> Discords <span className="text-[10px] text-zinc-600 group-hover/dd:translate-y-0.5 transition-transform">▼</span>
              {/* Droplist popover */}
              <div className="hidden group-hover/dd:block absolute top-5 left-0 w-44 bg-[#0c0d14] border border-[#1e2030] rounded-lg p-1 shadow-2xl z-50 text-left">
                <a href="https://discord.gg/SX4HST5yW" target="_blank" rel="noopener noreferrer" className="block text-[10px] font-bold uppercase font-mono p-2.5 hover:bg-zinc-900 rounded text-[#39FF14]">sonic tiers</a>
                <a href="https://discord.gg/SX4HST5yW" target="_blank" rel="noopener noreferrer" className="block text-[9px] uppercase font-mono p-2 hover:bg-[#5865F2]/10 rounded text-zinc-400">Join Community</a>
              </div>
            </div>
            <a
              href="#api-docs"
              onClick={(e) => {
                e.preventDefault();
                alert("API Access: sonictiers evaluations database access requires a bearer token.");
              }}
              className="bg-[#1f2135] text-white hover:bg-[#282a45] px-3.5 py-1.5 rounded-lg border border-[#3b4260] flex items-center gap-1.5 cursor-pointer text-[11px] font-black tracking-wider transition-all shadow-md shadow-indigo-550/10 leading-none select-none"
            >
              <span>📄</span> API Docs
            </a>
          </div>

          {/* Global Functional Search Bar */}
          <div className="relative max-w-xs w-64 hidden sm:block">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search player..."
              value={globalSearchQuery}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              className="w-full bg-[#121420]/80 border border-zinc-800 rounded-xl py-2 pl-9 pr-8 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:bg-[#161a30]/90 transition-all font-sans"
            />
            <span className="absolute right-2.5 top-2.5 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-[9px] font-mono font-bold text-zinc-500 leading-none">
              /
            </span>
            {/* Search Results Dropdown Popover */}
            {showSearchDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setShowSearchDropdown(false)} 
                />
                <div className="absolute top-11 left-0 right-0 bg-[#0c0e14] border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1 divide-y divide-zinc-900/60 font-sans">
                  {players
                    .filter(p => !globalSearchQuery || p.username.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                    .map(p => (
                      <div
                        key={p.username}
                        onClick={() => {
                          handleSelectDossier(p.username);
                          setGlobalSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="flex items-center gap-2.5 p-2 hover:bg-zinc-900/80 rounded-lg cursor-pointer transition-colors text-left"
                      >
                        <img 
                          src={getCorrectAvatar(p, 24)} 
                          className="w-5 h-5 rounded object-contain shrink-0 bg-zinc-900/40" 
                          alt={p.username} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left leading-none">
                          <p className="text-xs font-bold text-white leading-none">{p.username}</p>
                          <p className="text-[9px] text-amber-500 font-mono leading-none mt-1 uppercase">{p.overallRank} - {p.overallPoints} PTS</p>
                        </div>
                      </div>
                    ))}
                  {players.filter(p => p.username.toLowerCase().includes(globalSearchQuery.toLowerCase())).length === 0 && (
                     <p className="text-[10px] text-zinc-650 p-2 text-center font-mono uppercase">No record found</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick profile actions */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('profile')}
                  className="px-3 py-2 bg-zinc-900/90 hover:bg-[#141622] text-zinc-350 hover:text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all border border-[#1e2030] cursor-pointer shadow-sm shrink-0"
                >
                  <img src={getCorrectAvatar(currentUser, 20)} className="w-4 h-4 rounded shrink-0 object-contain bg-zinc-900/40" alt="" referrerPolicy="no-referrer" />
                  <span className="hidden sm:inline">My Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-red-400 rounded-xl border border-zinc-850 cursor-pointer transition shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigateTo('auth')}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black font-black uppercase tracking-wider rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🔑</span> Authenticate
              </button>
            )}

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 bg-zinc-905 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-zinc-900 bg-[#0c0e17] backdrop-blur-xl shrink-0 overflow-hidden font-sans"
            >
              <div className="py-4 px-5 space-y-4 text-left">
                <div className="space-y-1.5">
                  <span className="text-[9px] text-zinc-500 block font-mono uppercase tracking-widest px-2.5 mb-1">Navigation</span>
                  <button
                    id="mobile-nav-landing"
                    onClick={() => navigateTo('landing')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activePage === 'landing' ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    🏠 Home / Lobby
                  </button>
                  <button
                    id="mobile-nav-leaderboard"
                    onClick={() => navigateTo('leaderboard')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activePage === 'leaderboard' ? 'bg-amber-550/10 text-amber-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    🏆 Rankings
                  </button>
                  <button
                    id="mobile-nav-test"
                    onClick={() => navigateTo('test')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activePage === 'test' ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    ⚔️ Combat Challenges
                  </button>
                </div>

                <div className="border-t border-zinc-900/80 pt-3">
                  <span className="text-[9px] text-zinc-500 block font-mono uppercase tracking-widest px-2.5 mb-1.5">Discords</span>
                  <div className="grid grid-cols-2 gap-2 px-1">
                    <a
                      href="https://discord.gg/SX4HST5yW"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-[#39FF14] border border-indigo-500/20 rounded-lg text-[10px] uppercase font-mono font-bold transition-all text-center"
                    >
                      sonic tiers
                    </a>
                    <a
                      href="https://discord.gg/SX4HST5yW"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg text-[10px] uppercase font-mono font-bold transition-all text-center"
                    >
                      Community
                    </a>
                  </div>
                </div>

                <div className="border-t border-zinc-900/80 pt-3">
                  <button
                    onClick={() => {
                      alert("API Access: sonictiers evaluations database access requires a bearer token.");
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-1.5"
                  >
                    <span>📄</span> API Docs
                  </button>
                </div>
                
                <div className="border-t border-zinc-900/80 pt-3 flex items-center justify-between px-1">
                  {currentUser ? (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-zinc-900 rounded p-1 flex items-center justify-center border border-zinc-850 overflow-hidden">
                        <img
                          src={getCorrectAvatar(currentUser, 24)}
                          alt={currentUser.username}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded bg-zinc-900/40"
                        />
                      </div>
                      <span className="text-white text-xs font-bold">
                        {currentUser.username}
                      </span>
                      <button
                        id="mobile-logout"
                        onClick={handleLogout}
                        className="text-red-400 ml-4 hover:underline text-[10px] font-mono uppercase tracking-wider font-bold"
                      >
                        [Sign out]
                      </button>
                    </div>
                  ) : (
                    <button
                      id="mobile-auth-btn"
                      onClick={() => navigateTo('auth')}
                      className="w-full py-2.5 bg-[#ffab00] hover:bg-amber-500 text-black rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all"
                    >
                      🔑 SYNC MINECRAFT CORE
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN VIEW CONTROLLER PORT */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlayerForDossier ? `profile-${selectedPlayerForDossier.username}` : activePage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22 }}
          >
            {/* LOR WITH INTERFACING VIEWS */}
            {selectedPlayerForDossier ? (
              <PlayerProfile 
                player={selectedPlayerForDossier} 
                allPlayers={players}
                onClose={() => setSelectedPlayerForDossier(null)}
                onUpdatePlayer={handleAdminUpdatePlayer}
              />
            ) : (
              <>
                {activePage === 'landing' && (
                  <div className="space-y-16">
                    <LandingPage
                      topPlayers={players}
                      onNavigate={navigateTo}
                      onSelectPlayer={handleSelectDossier}
                    />

                    {/* MOUNTED CONSOLE ADMINISTRATIVE AREA */}
                    <div id="admin-console-sector" className="border-t border-zinc-900/60 pt-16 space-y-8">
                      <div className="text-center md:text-left space-y-1">
                        <span className="text-xs font-mono tracking-widest text-red-500 uppercase font-black">
                          SYSTEM ADMINISTRATION
                        </span>
                        <h2 className="text-3xl font-sans font-black tracking-tight text-white uppercase">
                          Administrative Console
                        </h2>
                        <p className="text-sm font-sans text-zinc-500 max-w-xl">
                          Manage competitor PvP records, adjust ELO ratings, quarantine players, and calibrate system test thresholds.
                        </p>
                      </div>

                      {(currentUser?.isAdmin || isSessionAdmin) ? (
                        <div className="bg-[#0b0c10]/40 border border-zinc-900 p-6 md:p-8 rounded-3xl backdrop-blur-md">
                          <AdminDashboard
                            players={players}
                            settings={settings}
                            onUpdateSettings={handleAdminUpdateSettings}
                            onModifyBlockStatus={handleAdminModifyBlockStatus}
                            onTunePlayerELO={handleAdminTunePlayerELO}
                            onToggleAdminStatus={handleAdminToggleAdminStatus}
                            onAddPlayer={handleAdminAddPlayer}
                            onUpdatePlayer={handleAdminUpdatePlayer}
                            onDeletePlayer={handleAdminDeletePlayer}
                          />
                        </div>
                      ) : (
                        <div className="max-w-md mx-auto py-10 px-8 bg-[#0b0c10]/40 border border-[#1e2030] rounded-3xl backdrop-blur-xl shadow-2xl text-left space-y-6">
                          <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-red-950/20 border border-red-500/30 rounded-full flex items-center justify-center text-[#EF3131] mx-auto shadow-inner shadow-red-500/5">
                              <ShieldAlert className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] font-mono font-bold tracking-widest text-[#EF3131] uppercase block">
                              RESTRICTED SECURITY SECTOR
                            </span>
                            <h3 className="text-2xl font-sans font-black text-white uppercase tracking-tight text-center">
                              Console Bypass Gate
                            </h3>
                            <p className="text-xs font-sans text-zinc-400 text-center leading-relaxed">
                              Administrative functions are restricted to certified staff. Enter passphrase key to authenticate.
                            </p>
                          </div>

                          <form onSubmit={handleAdminGateSubmit} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                              <label htmlFor="admin-passcode" className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                                Enter Terminal Bypass Key:
                              </label>
                              <input
                                id="admin-passcode"
                                type="password"
                                placeholder="••••••••"
                                value={adminPasscode}
                                onChange={(e) => {
                                  setAdminPasscode(e.target.value);
                                  setAdminGateError('');
                                }}
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-center font-mono text-sm tracking-widest text-white outline-none focus:border-red-500/50 transition-all font-bold"
                              />
                              {adminGateError && (
                                <span className="text-[10px] font-mono text-red-500 block mt-1 uppercase">
                                  ⚠️ {adminGateError}
                                </span>
                              )}
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 bg-[#EF3131] hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer focus:ring-1 focus:ring-red-500/55"
                            >
                              UNIFY SYSTEM ACCESS
                            </button>
                          </form>

                          <div className="border-t border-zinc-900 pt-4 text-left space-y-2">
                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                              ACTIVE SERVER ADMINISTRATORS:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {players.filter(p => p.isAdmin).length > 0 ? (
                                players.filter(p => p.isAdmin).map(p => (
                                  <div key={p.username} className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-900/60 py-1.5 px-2.5 rounded-lg text-xs font-bold text-white">
                                    <img src={getCorrectAvatar(p, 16)} className="w-4 h-4 rounded-sm object-contain bg-zinc-900" referrerPolicy="no-referrer" alt="" />
                                    <span>{p.username}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-[10px] font-mono text-zinc-700 uppercase">No active staff registered. Use bypass key to unlock first.</span>
                              )}
                            </div>
                          </div>


                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activePage === 'leaderboard' && (
                  <LeaderboardsPage players={players} onSelectPlayer={handleSelectDossier} />
                )}

                {activePage === 'test' && (
                  <div className="space-y-6">
                    {/* Interactive Game mode selector */}
                    <div className="bg-[#0b0c10]/45 p-4 border border-zinc-900 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="text-left leading-none">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block">ACTIVE MATRIX SELECTOR</span>
                        <h4 className="text-base font-sans font-extrabold text-white uppercase mt-1 leading-none">Current Combat Mode Division:</h4>
                      </div>
                      
                      <div className="flex gap-1.5 overflow-x-auto p-1 bg-zinc-950/80 rounded-xl border border-zinc-900">
                        {GAME_MODES.map(item => (
                          <button
                            key={item}
                            id={`mode-select-${item}`}
                            onClick={() => setActiveMode(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                              activeMode === item ? 'bg-[#39FF14] text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <PvPTestSystem
                      currentMode={activeMode}
                      onTestComplete={handleTestComplete}
                      userRank={currentUser ? currentUser.overallRank : 'LT5'}
                    />
                  </div>
                )}

                {activePage === 'profile' && currentUser && (
                  <PlayerProfile 
                    player={currentUser} 
                    allPlayers={players}
                    onClose={() => navigateTo('landing')}
                    onUpdatePlayer={handleAdminUpdatePlayer}
                  />
                )}

                {activePage === 'auth' && (
                  <AuthPage onLoginSuccess={handleLogin} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER METRIC BRAND */}
      <footer className="border-t border-zinc-950 bg-[#040507]/90 p-6 md:p-10 select-none text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-600 uppercase">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-white tracking-widest">
              sonic<b className="text-[#39FF14]">tiers</b>
            </span>
            <span className="text-[10px]">© 2026</span>
          </div>

          <div>
            CREATED IN COMPLIANCE WITH MOJANG DIRECTORY GUIDELINES
          </div>

          <div className="flex gap-4">
            <a href="#rules" className="hover:text-white transition-colors">RULEBOOK</a>
            <a href="#esports" className="hover:text-white transition-colors">COMPETE</a>
          </div>
        </div>
      </footer>

      {/* --- PROMOTION CELEBRATION DRAWER OVERLAY --- */}
      <AnimatePresence>
        {promotionCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -30, opacity: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 20 }}
              className="max-w-md w-full bg-[#08090c] border border-[#39FF14]/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl shadow-[#39FF14]/15"
            >
              {/* Spinning star burst */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#39FF14]/10 blur-3xl pointer-events-none animate-pulse" />

              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-950/20 border border-[#39FF14]/40 flex items-center justify-center text-[#39FF14] mx-auto">
                  <Award className="w-10 h-10 animate-bounce" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold tracking-widest text-[#39FF14] uppercase">
                    PROMOTION ANNOUNCEMENT
                  </span>
                  <h3 className="text-3xl font-sans font-black tracking-tight text-white leading-tight">
                    COMMUNITY TIER PROMOTED!
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-6 py-2.5">
                  <div className="bg-zinc-950/70 border border-zinc-900 px-4 py-3 rounded-xl font-mono text-xs">
                    <span className="text-zinc-500 block uppercase">OLD STATUS</span>
                    <span className="text-white font-extrabold text-sm block mt-1">
                      {promotionCelebration.prevRank}
                    </span>
                  </div>

                  <span className="text-[#39FF14] text-xl font-mono font-bold">→</span>

                  <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 px-5 py-3 rounded-xl font-mono text-xs">
                    <span className="text-[#39FF14]/60 block uppercase">NEW STANDING</span>
                    <span className="text-[#39FF14] font-extrabold text-sm block mt-1">
                      {promotionCelebration.nextRank}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-sans text-zinc-400 leading-relaxed max-w-sm mx-auto antialiased">
                  Congratulations! You have advanced your combat points ratings to <b>{promotionCelebration.points} ELO</b>, securing your promotional bracket advancement. Keep contesting evaluation maps to attain High Tier 1 Apex!
                </p>

                <button
                  id="celebration-dismiss"
                  onClick={() => setPromotionCelebration(null)}
                  className="w-full h-11 bg-[#39FF14] text-black font-mono font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-[#39FF14]/20"
                >
                  CLAIM NEW RECRUIT STANDINGS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
