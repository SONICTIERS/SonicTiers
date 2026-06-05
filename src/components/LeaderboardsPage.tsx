import { useState } from 'react';
import { GameMode, MinecraftPlayer, RankTier } from '../types';
import { getMinecraftAvatar, getMinecraftBodyRender, getCorrectBodyRender } from '../utils/minecraft';
import { RANK_TIERS, GAME_MODES } from '../mockData';
import { Search, SlidersHorizontal, Trophy, Award, Crown, User } from 'lucide-react';
import { motion } from 'motion/react';

export function GameModeIcon({ mode, isSelected }: { mode: GameMode | 'Overall'; isSelected?: boolean }) {
  switch (mode) {
    case 'Overall':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M6 4h12v4c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z" fill="#FFB000" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M6 6H3c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 6h3c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14v4" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 18h8" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 6l.5 1.5H14l-1.2.9.5 1.6-1.3-1-1.3 1 .5-1.6L8 7.5h1.5L12 6z" fill="#FFF"/>
        </svg>
      );
    case 'Sword':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M10 14L18.5 5.5c.8-.8 2-.8 2.8 0s.8 2 0 2.8L12.8 16.8" fill="#3FC7EB" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M8.5 13.5l-2-2 1.5-1.5 4 4-1.5 1.5z" fill="#FFB000" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M7 17l-3 3 1.5 1.5 3-3z" fill="#A855F7" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case 'Axe':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M5 19L17 7" stroke="#9A3412" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 4h4v4c0 1.5-1 3-3 3.5h-1V7c0-1.5-1-3-3-3h3z" fill="#3FC7EB" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 6c1 0 1.5 1 1.5 2h-3c0-1 .5-2 1.5-2z" fill="#22D3EE" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case 'NethPot':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M12 6l5 5.5v4.5c0 2.2-1.8 4-5 4s-5-1.8-5-4v-4.5z" fill="#EF4444" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 6h4v-3h-4z" fill="#E2E8F0" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M11 3h2v-1h-2z" fill="#B45309" stroke="#FFF" strokeWidth="1.2"/>
          <circle cx="10" cy="13" r="1.5" fill="#FFF" fillOpacity="0.7"/>
          <circle cx="14" cy="16" r="1" fill="#FFF" fillOpacity="0.7"/>
        </svg>
      );
    case 'Mace':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M6 18L13.5 10.5" stroke="#475569" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="12" y="4" width="7" height="7" rx="1.5" transform="rotate(45 12 4)" fill="#64748B" stroke="#FFF" strokeWidth="1.5"/>
          <circle cx="11.5" cy="7.5" r="1.5" fill="#475569"/>
          <circle cx="16.5" cy="12.5" r="1.5" fill="#475569"/>
          <path d="M7 17l1.5-1.5M9 15l1.5-1.5" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      );
    case 'OP Mace':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="12" cy="12" r="9" stroke="#FFF" strokeWidth="1" strokeDasharray="3 3"/>
          <path d="M12 4c3.5 0 6.5 2.5 7 10s-2 6.5-5.5 7a6.2 6.2 0 0 1-6.5-4c-.8-2 0-4.5 2-5.5s4.5 0 5.5 2c.5 1 0 2.5-1 3s-2 0-2.5-1c-.2-.5 0-1 .5-1.2" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="7" fill="#60A5FA" fillOpacity="0.25" stroke="#93C5FD" strokeWidth="1.2"/>
          <circle cx="12" cy="12" r="4" fill="#DBEAFE" fillOpacity="0.5"/>
          <circle cx="6" cy="8" r="1" fill="#FFF"/>
          <circle cx="18" cy="16" r="1" fill="#FFF"/>
          <circle cx="15" cy="6" r="1.2" fill="#93C5FD"/>
          <circle cx="9" cy="18" r="1.2" fill="#93C5FD"/>
        </svg>
      );
    case 'Cart':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* TNT TOPFACE */}
          <polygon points="12,2 17,4.5 12,7 7,4.5" fill="#B45309" stroke="#FFF" strokeWidth="1" strokeLinejoin="round"/>
          <polygon points="12,3 15,4.5 12,6 9,4.5" fill="#EF4444" />
          <path d="M12,4.5 L12,3" stroke="#FFF" strokeWidth="1" strokeLinecap="round"/>

          {/* TNT LEFTFACE */}
          <polygon points="7,4.5 12,7 12,12 7,9.5" fill="#EF4444" stroke="#FFF" strokeWidth="1" strokeLinejoin="round"/>
          {/* White label stripe left */}
          <polygon points="7,6.5 12,9 12,10 7,7.5" fill="#F8FAFC" />

          {/* TNT RIGHTFACE */}
          <polygon points="12,7 17,4.5 17,9.5 12,12" fill="#DC2626" stroke="#FFF" strokeWidth="1" strokeLinejoin="round"/>
          {/* White label stripe right */}
          <polygon points="12,9 17,6.5 17,7.5 12,10" fill="#E2E8F0" />

          {/* MINECART BODY FRONT & SIDE */}
          {/* Underlayer / Wheels */}
          <circle cx="9" cy="18" r="1.8" fill="#1E293B" stroke="#FFF" strokeWidth="0.8"/>
          <circle cx="15" cy="18" r="1.8" fill="#1E293B" stroke="#FFF" strokeWidth="0.8"/>

          {/* Left Panel */}
          <polygon points="5,10 12,13.5 12,17.5 6,15.5" fill="#94A3B8" stroke="#FFF" strokeWidth="1.2" strokeLinejoin="round"/>
          {/* Right Panel */}
          <polygon points="12,13.5 19,10 18,15.5 12,17.5" fill="#64748B" stroke="#FFF" strokeWidth="1.2" strokeLinejoin="round"/>
          
          {/* Cart Rim Accent */}
          <path d="M5,10 L12,13.5 L19,10" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'CPvP':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" stroke="#FFF" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
          <polygon points="12,5 18,9 18,15 12,19 6,15 6,9" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" fill="none"/>
          <rect x="7.5" y="7.5" width="9" height="9" transform="rotate(45 12 12)" fill="#C084FC" fillOpacity="0.85" stroke="#FFF" strokeWidth="1.2"/>
          <rect x="10" y="10" width="4" height="4" transform="rotate(45 12 12)" fill="#FFF"/>
        </svg>
      );
    case 'UHC':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#EF4444" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 18.5l-1-1C6.5 13.5 4 10.5 4 8c0-1.5 1-2.5 2.5-2.5 1.2 0 2.3.8 2.7 1.8h1.6c.4-1 1.5-1.8 2.7-1.8C15 5.5 16 6.5 16 8c0 2.5-2.5 5.5-7 9.5l-1 1z" fill="#F87171" fillOpacity="0.5"/>
          <circle cx="7" cy="6.5" r="1.2" fill="#FFF"/>
        </svg>
      );
    default:
      return null;
  }
}

interface LeaderboardPageProps {
  players: MinecraftPlayer[];
  onSelectPlayer: (username: string) => void;
}

export default function LeaderboardsPage({ players, onSelectPlayer }: LeaderboardPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode | 'Overall'>('Overall');
  const [selectedRankFilter, setSelectedRankFilter] = useState<'All' | 'High' | 'Low'>('All');

  // Filter players list
  const filteredPlayers = [...players]
    .map((player) => {
      // Determine actual point rating to display based on the selected mode
      const displayPoints = selectedMode === 'Overall' ? player.overallPoints : player.stats[selectedMode].points;
      const displayRank = selectedMode === 'Overall' ? player.overallRank : player.stats[selectedMode].rank;
      const displayRate = selectedMode === 'Overall' ? player.winRate : player.stats[selectedMode].winRate;
      const displayCps = selectedMode === 'Overall' ? 9.5 : player.stats[selectedMode].cps; // overall proxy
      
      return {
        ...player,
        activePoints: displayPoints,
        activeRank: displayRank,
        activeWinRate: displayRate,
        activeCps: displayCps,
      };
    })
    .filter((player) => {
      // Search term filter
      const matchesSearch = player.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Tier Bracket filter
      let matchesRank = true;
      if (selectedRankFilter === 'High') {
        matchesRank = player.activeRank.startsWith('HT');
      } else if (selectedRankFilter === 'Low') {
        matchesRank = player.activeRank.startsWith('LT');
      }

      return matchesSearch && matchesRank;
    })
    // Sort descending by points
    .sort((a, b) => b.activePoints - a.activePoints);

  // Exact icon definitions for category badges matching the high tier aesthetic
  const modeDataList: { id: GameMode | 'Overall'; label: string; icon: string }[] = [
    { id: 'Overall', label: 'Overall', icon: '🏆' },
    { id: 'Sword', label: 'SWORD', icon: '⚔️' },
    { id: 'Axe', label: 'AXE', icon: '🪓' },
    { id: 'NethPot', label: 'NETHPOT', icon: '🧪' },
    { id: 'Mace', label: 'MACE', icon: '🔨' },
    { id: 'OP Mace', label: 'OP MACE', icon: '👑' },
    { id: 'Cart', label: 'CART', icon: '🛒' },
    { id: 'CPvP', label: 'CPVP', icon: '💎' },
    { id: 'UHC', label: 'UHC', icon: '🍎' },
  ];

  const modeIcons: Record<GameMode, string> = {
    Sword: '⚔️',
    Axe: '🪓',
    UHC: '🍎',
    NethPot: '🧪',
    CPvP: '💎',
    Mace: '🔨',
    'OP Mace': '👑',
    Cart: '🛒',
  };

  const rankStyles = (pos: number) => {
    if (pos === 1) {
      return {
        cardBg: 'bg-[#131623]/95 hover:bg-[#161a2c]/95 transition-all duration-200 border-l-[3px] border-l-amber-500',
        border: 'border border-[#222436]/85 shadow-lg shadow-amber-500/5',
        bannerBg: 'from-amber-600 via-[#f5a623] to-[#ffd050]',
        rankNumberColor: 'text-white font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
        pointTagBg: 'bg-amber-500/10 text-amber-400 border border-amber-400/20',
        usernameText: 'text-white'
      };
    } else if (pos === 2) {
      return {
        cardBg: 'bg-[#131623]/95 hover:bg-[#161a2c]/95 transition-all duration-200 border-l-[3px] border-l-slate-400',
        border: 'border border-[#222436]/85 shadow-md shadow-zinc-500/5',
        bannerBg: 'from-[#334155] via-[#64748b] to-[#94a3b8]',
        rankNumberColor: 'text-white font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
        pointTagBg: 'bg-slate-400/10 text-slate-300 border border-slate-300/25',
        usernameText: 'text-white'
      };
    } else if (pos === 3) {
      return {
        cardBg: 'bg-[#131623]/95 hover:bg-[#161a2c]/95 transition-all duration-200 border-l-[3px] border-l-amber-700',
        border: 'border border-[#222436]/85 shadow shadow-amber-900/5',
        bannerBg: 'from-[#7c2d12] via-[#ea580c] to-[#fdba74]',
        rankNumberColor: 'text-white font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]',
        pointTagBg: 'bg-orange-500/10 text-orange-400 border border-orange-400/25',
        usernameText: 'text-white'
      };
    } else {
      return {
        cardBg: 'bg-[#0f111a]/95 hover:bg-[#121522]/95 border-l-[3px] border-l-zinc-700 transition-all border border-[#1e2030]/80 shadow-sm',
        border: 'border border-[#1a1c29]/70',
        bannerBg: 'from-[#191b26] via-[#212433] to-[#2b2f42]',
        rankNumberColor: 'text-zinc-500 font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
        pointTagBg: 'bg-zinc-800/40 text-zinc-400 border border-zinc-700/20',
        usernameText: 'text-zinc-200'
      };
    }
  };

  const getRankBadgeStyle = (rankLabel: string) => {
    switch (rankLabel) {
      case 'HT1':
        return {
          border: 'border-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.35)]',
          pill: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold',
        };
      case 'LT1':
        return {
          border: 'border-emerald-700/80 shadow-[0_0_6px_rgba(4,120,87,0.25)]',
          pill: 'bg-emerald-700/10 border border-emerald-700/20 text-emerald-700 font-bold',
        };
      case 'HT2':
        return {
          border: 'border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.25)]',
          pill: 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold',
        };
      case 'LT2':
        return {
          border: 'border-sky-700/80 shadow-[0_0_6px_rgba(3,105,161,0.25)]',
          pill: 'bg-sky-700/10 border border-sky-700/20 text-sky-700 font-bold',
        };
      case 'HT3':
        return {
          border: 'border-purple-400/80 shadow-[0_0_6px_rgba(192,132,252,0.25)]',
          pill: 'bg-purple-500/10 border border-purple-500/25 text-purple-400 font-bold',
        };
      case 'LT3':
        return {
          border: 'border-purple-700/80 shadow-[0_0_6px_rgba(126,34,206,0.25)]',
          pill: 'bg-purple-700/10 border border-purple-700/20 text-purple-700 font-bold',
        };
      case 'HT4':
        return {
          border: 'border-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.25)]',
          pill: 'bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold',
        };
      case 'LT4':
        return {
          border: 'border-amber-700/80 shadow-[0_0_6px_rgba(180,83,9,0.25)]',
          pill: 'bg-amber-700/10 border border-amber-700/20 text-amber-700 font-bold',
        };
      case 'HT5':
        return {
          border: 'border-red-400/80 shadow-[0_0_6px_rgba(248,113,113,0.25)]',
          pill: 'bg-red-500/10 border border-red-500/25 text-red-400 font-bold',
        };
      case 'LT5':
      default:
        return {
          border: 'border-red-700/80 shadow-[0_0_6px_rgba(185,28,28,0.25)]',
          pill: 'bg-red-700/10 border border-red-700/20 text-red-700 font-bold',
        };
    }
  };

  return (
    <div id="leaderboard-container" className="space-y-6 text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900/60 pb-5">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-2.5 py-1 rounded">
            GLOBAL STANDINGS
          </span>
          <h2 className="text-2xl font-sans font-black tracking-tight text-white uppercase mt-2">
            sonictiers Elo Board
          </h2>
          <p className="text-sm font-sans text-zinc-500">
            Real-time rankings across eight competitive Minecraft PvP combat modes. Powered by verified evaluations.
          </p>
        </div>
        
        {/* Top elite tier summary */}
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs bg-zinc-950/40 border border-zinc-900 px-4 py-2.5 rounded-xl">
          <Trophy className="w-4 h-4 text-amber-400" />
          TOP ELITE ATHLETES RATED <b className="text-amber-400">HT1 CHAMPION</b>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-[#0b0c10]/45 border border-zinc-900 rounded-2xl p-4 backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="relative lg:col-span-4 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="player-search"
            type="text"
            placeholder="Search username (e.g. Swifter)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700 focus:bg-zinc-950 transition-all font-sans"
          />
        </div>

        {/* High/Low Bracket Filters */}
        <div className="lg:col-span-8 w-full flex items-center justify-end gap-2">
          <span className="text-zinc-500 text-xs font-mono flex items-center gap-1.5 uppercase tracking-wide shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Tier Bracket:
          </span>
          <select
            id="bracket-filter"
            value={selectedRankFilter}
            onChange={(e: any) => setSelectedRankFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs font-mono text-white outline-none cursor-pointer focus:border-zinc-700"
          >
            <option value="All">ALL COMPETITIVE TIERS</option>
            <option value="High">HT (HIGH TIERS 1-5)</option>
            <option value="Low">LT (LOW TIERS 1-5)</option>
          </select>
        </div>
      </div>

      {/* CATEGORY TABS CONTAINER MATCHING SCREENSHOT */}
      <div className="bg-[#10121d]/90 border border-[#1e2030]/80 rounded-[24px] p-2 Backdrop-blur-md overflow-x-auto select-none shadow-xl flex items-center justify-between gap-1 scrollbar-thin">
        {modeDataList.map((item) => {
          const isSelected = selectedMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedMode(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl min-w-[78px] transition-all duration-200 cursor-pointer text-center group border border-transparent flex-1 ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1b1e2c] to-[#0d0f17] border-t-2 border-amber-500 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-950/30 border-t-2 border-transparent'
              }`}
            >
              <div className={`w-8 h-8 mb-1.5 transition-transform duration-200 ${isSelected ? 'scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'group-hover:scale-105'}`}>
                <GameModeIcon mode={item.id} isSelected={isSelected} />
              </div>
              <span className="text-[10px] font-sans font-black tracking-wider uppercase block leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* RATED MODE SUMMARY */}
      <div className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase py-1 border-b border-zinc-900/60 flex justify-between items-center px-1">
        <span>{selectedMode.toUpperCase()} STANDINGS ACTIVE</span>
        <span>{filteredPlayers.length} ATHLETES FOUND</span>
      </div>

      {/* CARD HEADERS GUIDES */}
      <div className="hidden md:grid grid-cols-12 px-6 py-1 text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest leading-none select-none">
        <div className="col-span-1 text-left">Standing</div>
        <div className="col-span-5 text-left pl-28">Player Details</div>
        <div className="col-span-2 text-center">Region</div>
        <div className="col-span-4 text-right pr-6">Game Modes</div>
      </div>

      {/* COMPACT GLOWING COMPETITOR CARDS */}
      <div className="flex flex-col gap-3.5">
        {filteredPlayers.map((player, index) => {
          const pos = index + 1;
          const style = rankStyles(pos);
          const displayPoints = player.activePoints;
          
          // Generate a deterministic high-fidelity Region mapping like Red NA, Green EU, Blue AS
          const region = (pos === 2 || pos === 4 || player.username.toLowerCase().includes('cold')) ? 'EU' : 'NA';

          return (
            <div
              key={player.username}
              id={`leaderboard-row-${player.username}`}
              onClick={() => onSelectPlayer(player.username)}
              className={`relative rounded-2xl ${style.cardBg} ${style.border} h-20 md:h-[90px] flex items-center justify-between overflow-hidden cursor-pointer hover:scale-[1.01] transition-all group duration-200 shadow-md`}
            >
              {/* Left group: Slant rank + User details */}
              <div className="flex items-center gap-5 h-full shrink-0">
                {/* Slant Block containing rank label and 3D character */}
                <div className="relative h-full w-24 md:w-32 overflow-hidden select-none shrink-0 flex items-center justify-center">
                  {/* Slanted colored graphic */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${style.bannerBg} skew-x-[-15deg] origin-top-left -ml-4 w-[112%] h-[105%]`} />
                  
                  {/* Inner container to hold unskewed text and character */}
                  <div className="relative z-10 w-full h-full flex items-center justify-between px-3 md:px-4">
                    <span className={`text-2xl md:text-4xl ${style.rankNumberColor} select-none font-black italic`}>
                      {pos}.
                    </span>
                    
                    {/* Floating 3D Character render */}
                    <div className="w-16 md:w-20 h-full relative flex items-end justify-center overflow-visible">
                      <img
                        src={getCorrectBodyRender(player, 180)}
                        alt={player.username}
                        className="w-14 md:w-18 h-[105%] md:h-[118%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] transition-all duration-300 group-hover:scale-112 origin-bottom transform translate-y-1.5 md:translate-y-3"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                {/* Player username and dynamic sub-descriptions */}
                <div className="text-left flex flex-col justify-center py-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm md:text-lg font-sans font-black leading-none tracking-tight ${style.usernameText} group-hover:text-amber-400 transition-colors`}>
                      {player.username}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 leading-none">
                    <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded ${style.pointTagBg}`}>
                      {displayPoints} PTS
                    </span>
                  </div>
                </div>
              </div>

              {/* Center segment: NA/EU region block indicator */}
              <div className="hidden md:flex items-center justify-center w-24 shrink-0 font-mono select-none">
                <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-black tracking-widest border ${
                  region === 'NA'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {region}
                </span>
              </div>

              {/* Right segment: Specific weapon evaluation status tags */}
              <div className="flex flex-wrap gap-1.5 md:gap-2 justify-end items-center pr-4 md:pr-6 relative z-10 w-auto">
                {GAME_MODES.map((m) => {
                  const stat = player.stats[m];
                  const rankLabel = stat?.rank || 'LT5';
                  const icon = modeIcons[m];
                  const badge = getRankBadgeStyle(rankLabel);

                  const isCurrentFilterMode = selectedMode === m;

                  return (
                    <div
                      key={m}
                      title={`${m}: ${rankLabel} (${stat?.points} pts)`}
                      className="flex flex-col items-center justify-center gap-0.5 shrink-0 group/badge"
                    >
                      {/* Round metallic icon badge */}
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0d0f19] p-1 md:p-1.5 flex items-center justify-center border-2 transition-all duration-200 ${badge.border} ${
                        isCurrentFilterMode ? 'ring-2 ring-white scale-110 shadow-lg shadow-amber-500/10' : 'hover:scale-110'
                      }`}>
                        <GameModeIcon mode={m} isSelected={isCurrentFilterMode} />
                      </div>
                      {/* Compact tier pill label */}
                      <span className={`text-[8px] font-mono font-bold uppercase py-0.5 px-1.5 rounded-md leading-none select-none tracking-tighter ${badge.pill}`}>
                        {rankLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredPlayers.length === 0 && (
          <div className="py-20 text-center text-zinc-500 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/20">
            <span className="font-mono text-xs uppercase tracking-widest block">NO ATHLETES FOUND</span>
            <p className="text-[11px] text-zinc-600 font-sans mt-2">Adjust your bracket filters or select another category mode.</p>
          </div>
        )}
      </div>
    </div>
  );
}
