import React from 'react';
import { MinecraftPlayer, GameMode, RankTier } from '../types';
import { getMinecraftAvatar, getCorrectBodyRender, getCorrectAvatar, fetchMinecraftProfile } from '../utils/minecraft';
import { RANK_TIERS } from '../mockData';
import { X, ExternalLink, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { GameModeIcon } from './LeaderboardsPage';

interface PlayerProfileProps {
  player: MinecraftPlayer;
  allPlayers?: MinecraftPlayer[];
  onClose?: () => void;
  onUpdatePlayer?: (username: string, updatedPlayer: MinecraftPlayer) => void;
}

// Generates dynamic cosmetic regions beautifully based on user name seed
const getCosmeticRegion = (username: string): string => {
  const code = username.charCodeAt(0) + (username.charCodeAt(1) || 0);
  return code % 2 === 0 ? 'North America' : 'Europe';
};

// Generates dynamic titles aligning with points
const getCombatTitle = (points: number): string => {
  if (points >= 90) return 'Combat Master';
  if (points >= 71) return 'Combat Champion';
  if (points >= 51) return 'Combat Elite';
  if (points >= 31) return 'Arena Specialist';
  if (points >= 11) return 'PvP Challenger';
  return 'PvP Combatant';
};

// Color class mapper for ranks below weapon icons
const getTierColorClass = (tier: RankTier): string => {
  if (tier.startsWith('HT1')) return 'text-emerald-400';
  if (tier.startsWith('LT1')) return 'text-orange-400';
  if (tier.startsWith('HT2')) return 'text-cyan-400';
  if (tier.startsWith('LT2')) return 'text-purple-400';
  if (tier.startsWith('HT3')) return 'text-amber-400';
  if (tier.startsWith('LT3')) return 'text-blue-400';
  if (tier.startsWith('HT4')) return 'text-teal-400';
  if (tier.startsWith('LT4')) return 'text-slate-450';
  if (tier.startsWith('HT5')) return 'text-amber-700';
  return 'text-zinc-500';
};

export default function PlayerProfile({ player, allPlayers, onClose, onUpdatePlayer }: PlayerProfileProps) {
  // Sort and retrieve numeric overall position order
  const position = allPlayers
    ? [...allPlayers]
        .sort((a, b) => b.overallPoints - a.overallPoints)
        .findIndex((p) => p.username === player.username) + 1
    : 1;

  const cosmeticRegion = getCosmeticRegion(player.username);
  const combatTitle = getCombatTitle(player.overallPoints);

  const GAME_MODES: GameMode[] = [
    'Sword',
    'Axe',
    'NethPot',
    'Mace',
    'OP Mace',
    'Cart',
    'CPvP',
    'UHC',
  ];

  return (
    <div id="player-profile-dossier" className="flex items-center justify-center py-6 min-h-[75vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative bg-[#0d121c] border border-zinc-900/90 rounded-[28px] w-full max-w-[760px] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col md:flex-row gap-8 items-center md:items-stretch select-none text-zinc-200"
      >
        {/* Close action circle in absolute top corner if callback is present */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer shadow-sm z-50"
            title="Close Dossier"
          >
            <X className="w-4.5 h-4.5" strokeWidth={2.5} />
          </button>
        )}

        {/* Left Side: Standing 3D Character Skin Showcase */}
        <div className="w-full md:w-56 bg-[#090d16] border border-zinc-900/80 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[280px] md:min-h-auto overflow-hidden shrink-0 group/profile-skin">
          {/* Ambient spotlight overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
          
          {/* Standing Skin render */}
          <img
            src={getCorrectBodyRender(player, 250)}
            alt={player.username}
            referrerPolicy="no-referrer"
            className="h-52 md:h-76 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] hover:scale-108 transition-all duration-300 pointer-events-none z-10"
          />
          
          {/* Subtle pedestal / podium floor disc */}
          <div className="w-28 md:w-36 h-3 bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-inner mt-4 blur-[1px] opacity-80" />
        </div>

        {/* Right Side: Player Details */}
        <div className="flex-grow flex flex-col items-center w-full">
          {/* Centered Avatar Frame with dynamic Gold border */}
          <div className="relative mt-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-450 p-1 flex items-center justify-center shadow-[0_4px_16px_rgba(234,179,8,0.25)] select-none">
              <div className="w-full h-full rounded-full bg-[#111827] overflow-hidden flex items-center justify-center border border-zinc-950">
                <img
                  src={getCorrectAvatar(player, 80)}
                  alt={player.username}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-contain scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Username */}
          <h2 className="text-2xl font-sans font-black tracking-tight text-white mt-3 flex items-center justify-center gap-2">
            {player.username}
            {player.isTester && (
              <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-black text-red-500 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                Tester
              </span>
            )}
          </h2>

        {/* Elite combat title with gold/yellow elements */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-yellow-450 px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase font-sans">
          <Award className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
          {combatTitle}
        </div>

        {/* Cosmetic Region */}
        <span className="text-zinc-600 font-sans font-bold text-xs mt-2 tracking-wide uppercase">
          {cosmeticRegion}
        </span>

        {/* Button hub: NameMC link */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <a
            href={`https://namemc.com/profile/${player.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-[#121824] border border-zinc-800 hover:border-zinc-700/80 hover:bg-[#1a2333]/90 text-zinc-400 hover:text-white px-4 py-1.5 rounded-xl text-[10px] font-bold font-mono tracking-widest uppercase transition-all shadow-sm"
          >
            <span className="bg-[#121824] text-[10px] font-sans lowercase shrink-0">n</span>
            NameMC <ExternalLink className="w-3 h-3 text-zinc-550 shrink-0" />
          </a>
        </div>

        {/* POSITION MODULE REPRESENTAL */}
        <div className="w-full mt-7 text-left">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-black tracking-widest block mb-1.5">
            POSITION
          </span>
          <div className="flex items-center bg-[#111827]/85 border border-zinc-900 rounded-2xl overflow-hidden shadow-inner h-13 w-full">
            {/* Elegant slanted position label */}
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-zinc-950 font-sans font-black text-xl italic px-5 h-full flex items-center justify-center -skew-x-12 origin-left scale-y-110 shrink-0 min-w-[64px]">
              <span className="skew-x-12 select-none pr-1">
                {position}.
              </span>
            </div>
            {/* ELO points content */}
            <div className="flex-grow pl-5 pr-4 flex items-center justify-between font-sans text-xs font-black tracking-wide text-zinc-350">
              <span className="inline-flex items-center gap-1 text-white text-[13px] font-sans font-black uppercase">
                <span className="shrink-0" role="img" aria-label="trophy">🏆</span> OVERALL
              </span>
              <span className="text-zinc-400 font-sans font-bold text-[12px] uppercase">
                ({player.overallPoints} points)
              </span>
            </div>
          </div>
        </div>

        {/* TIERS CORE CONTAINER */}
        <div className="w-full mt-6 text-left">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-black tracking-widest block mb-1.5">
            TIERS
          </span>
          <div className="bg-[#111827]/85 border border-zinc-900 rounded-3xl p-4 shadow-sm w-full">
            <div className="grid grid-cols-4 gap-y-3.5 gap-x-2">
              {GAME_MODES.map((mode) => {
                const stat = player.stats[mode];
                const activeTier: RankTier = stat?.rank || 'LT5';

                return (
                  <div key={mode} className="flex flex-col items-center">
                    {/* Circle icon container */}
                    <div className="w-11 h-11 rounded-full bg-zinc-950/90 border border-zinc-850/60 p-2.5 flex items-center justify-center relative shadow-sm transition hover:scale-105 hover:border-zinc-800">
                      <GameModeIcon mode={mode} />
                    </div>
                    {/* Rank identifier underneath */}
                    <span className={`text-[10px] font-mono font-black tracking-wider uppercase mt-1 ${getTierColorClass(activeTier)}`}>
                      {activeTier}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
