import { GameMode, MinecraftPlayer } from '../types';
import { getMinecraftBodyRender, getCorrectBodyRender } from '../utils/minecraft';
import { Swords, Trophy, Users, ShieldAlert, Sparkles, ChevronRight, Play } from 'lucide-react';
import { RANK_TIERS } from '../mockData';
import { motion } from 'motion/react';

interface LandingPageProps {
  topPlayers: MinecraftPlayer[];
  onNavigate: (page: 'auth' | 'leaderboard' | 'test' | 'profile') => void;
  onSelectPlayer: (username: string) => void;
}

export default function LandingPage({ topPlayers, onNavigate, onSelectPlayer }: LandingPageProps) {
  // Sort players by overallPoints descending and then take the top 3
  const sortedPlayers = [...topPlayers].sort((a, b) => b.overallPoints - a.overallPoints);
  const podiumPlayers = sortedPlayers.slice(0, 3);

  // Calculate actual registered players on this website's database
  const totalCompetitors = topPlayers.length;

  // Calculate actual tester accounts in this website's database
  const totalTesters = topPlayers.filter(p => p.isTester).length;

  // Calculate actual HT1 roster size in this website's database
  const eliteHT1Count = topPlayers.filter(p => p.overallRank === 'HT1').length;

  const statsHighlights = [
    { label: "Active Competitors", val: totalCompetitors.toLocaleString(), icon: Users, color: "text-green-400" },
    { label: "Testers", val: totalTesters.toLocaleString(), icon: Swords, color: "text-[#EF3131]" },
    { label: "Elite HT1 Rankings", val: eliteHT1Count.toLocaleString(), icon: Trophy, color: "text-yellow-400" },
  ];

  const featuredModes = [
    { name: "Sword Combat", meta: "Classic 1.9+ Jitter & Strafe", rate: "Fast paced combos", tier: "Netherite/Diamond" },
    { name: "Axe Shield Duels", meta: "Shield disable, critical vectors", rate: "Burst tactical", tier: "Netherite Axe" },
    { name: "Cart (TNT/Minecart)", meta: "High range explosive mechanics", rate: "Lethal velocity placement", tier: "Complex strategy" },
    { name: "CPvP (Crystal PvP)", meta: "Obsidian placement, blast dodging", rate: "Instant reaction rate", tier: "Elite HT1 standard" },
  ];

  return (
    <div id="landing-container" className="space-y-16 py-4">
      {/* HERO SECTION */}
      <section className="relative rounded-3xl border border-zinc-900 bg-[#07080c]/55 overflow-hidden p-8 md:p-14 backdrop-blur-md">
        {/* Glow ambient background assets */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#39FF14]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-full px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider text-[#39FF14] uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              PRESENTS COMPETITIVE MINECRAFT PVP LEAGUES
            </div>
            
            <h1 className="text-4xl md:text-6xl font-sans font-black tracking-tight text-white leading-none">
              Become the Absolute <br />
              <span className="bg-gradient-to-r from-emerald-400 via-lime-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-md">
                Best Minecraft PvPer
              </span>
            </h1>
            
            <p className="text-gray-400 font-sans text-sm md:text-base leading-relaxed max-w-xl">
              sonictiers is the premier, esport-oriented testing standard. Log in, sync your character skin, and complete interactive reaction & CPS evaluations to assign your global tier ranking from <b>LT5</b> up to the elite <b>HT1</b>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                id="hero-start-test"
                onClick={() => onNavigate('test')}
                className="px-8 py-4 bg-[#39FF14] hover:bg-emerald-400 text-black font-mono font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#39FF14]/20 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play className="w-4.5 h-4.5 fill-current" />
                START PVP COMBAT CHALLENGES
              </button>
              
              <button
                id="hero-view-rankings"
                onClick={() => onNavigate('leaderboard')}
                className="px-8 py-4 bg-zinc-950/65 hover:bg-zinc-900 border border-zinc-800 text-white font-mono font-bold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                VIEW STANDINGS
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative group">
              {/* Outer frame rotating glow */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#39FF14] to-emerald-600 opacity-20 blur group-hover:opacity-40 transition-opacity" />
              
              <div className="bg-[#0c0d12]/90 border border-zinc-800 p-6 rounded-2xl w-72 text-center shadow-2xl relative">
                <div className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-4">
                  PROFILING GLOBAL #1 APEX PLAYER
                </div>
                
                {podiumPlayers[0] && (
                  <div onClick={() => onSelectPlayer(podiumPlayers[0].username)} className="cursor-pointer">
                    <div className="relative mb-4 h-56 flex items-center justify-center bg-zinc-950/70 border border-zinc-900 rounded-xl overflow-hidden group-hover:bg-zinc-950/90 transition-colors">
                      <img
                        src={getCorrectBodyRender(podiumPlayers[0], 250)}
                        alt={podiumPlayers[0].username}
                        referrerPolicy="no-referrer"
                        className="h-48 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] select-none hover:scale-108 transition-transform duration-300 pointer-events-none"
                      />
                    </div>
                    
                    <h3 className="text-xl font-sans font-black text-white group-hover:text-[#39FF14] transition-colors">
                      {podiumPlayers[0].username}
                    </h3>
                    
                    <span className="font-mono text-xs font-bold tracking-widest text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-2.5 py-1 rounded inline-block mt-1.5 uppercase">
                      HT1 TIER RANK: {podiumPlayers[0].overallPoints}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATISTICS BAR */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsHighlights.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-2xl flex items-center gap-4 hover:border-zinc-800 transition-colors"
            >
              <div className={`p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-850 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  {stat.label}
                </div>
                <div className="text-2xl font-mono font-bold text-white mt-0.5">
                  {stat.val}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* TOP HT1 RUNNERS CHAMPIONSHIP PODIUM */}
      <section className="space-y-6">
        <div className="text-center md:text-left space-y-1">
          <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-bold">
            THE CURRENT HALL OF FAME
          </span>
          <h2 className="text-3xl font-sans font-black tracking-tight text-white uppercase">
            Top Server Legends Ranked
          </h2>
          <p className="text-sm font-sans text-zinc-500 max-w-xl">
            These players have scored 90+ ratings in dynamic Sword, CPvP, and Axe duels. Click cards to view achievements and match telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podiumPlayers.map((player, index) => {
            const rankLabel = RANK_TIERS[player.overallRank];
            return (
              <div
                key={player.username}
                id={`podium-${player.username}`}
                onClick={() => onSelectPlayer(player.username)}
                className="bg-[#101117]/40 border border-zinc-900 hover:border-[#39FF14]/30 p-6 rounded-2xl cursor-pointer group flex gap-5 hover:bg-[#101117]/80 transition-all scale-100 active:scale-98 relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 text-[#39FF14]/10 font-mono text-7xl font-extrabold select-none">
                  #{index + 1}
                </div>
                
                <div className="h-40 bg-zinc-950/70 border border-zinc-900/50 p-2.5 rounded-xl flex items-center justify-center shrink-0 w-24">
                  <img
                    src={getCorrectBodyRender(player, 160)}
                    alt={player.username}
                    referrerPolicy="no-referrer"
                    className="h-32 group-hover:scale-108 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                  />
                </div>

                <div className="flex flex-col justify-between py-1 relative z-10 text-left">
                  <div>
                    <h4 className="text-xl font-sans font-bold text-white group-hover:text-[#39FF14] transition-colors leading-tight">
                      {player.username}
                    </h4>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] font-mono text-zinc-500 tracking-wider block uppercase">
                      RANKING ELO:
                    </span>
                    <span className="text-base font-mono font-extrabold text-[#39FF14] block mt-0.5">
                      {player.overallPoints} PTS ({player.overallRank})
                    </span>
                    
                    {/* Tiny neon loader bar */}
                    <div className="w-28 bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden border border-zinc-950">
                      <div
                        className="bg-[#39FF14] h-full"
                        style={{ width: `${player.overallPoints}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED COMBAT MODES */}
      <section className="space-y-6">
        <div className="border-t border-zinc-900 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <span className="text-xs font-mono tracking-widest text-[#EF3131] uppercase font-bold">
                EVALUATION MATRICS
              </span>
              <h2 className="text-3xl font-sans font-black tracking-tight text-white uppercase">
                Active Game Mode Divisions
              </h2>
            </div>
            
            <button
              id="get-evaluated-btn"
              onClick={() => onNavigate('test')}
              className="px-6 py-3 bg-[#EF3131] hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow shadow-red-950/25 cursor-pointer self-start md:self-auto"
            >
              CHALLENGE MY DIVISIONS →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {featuredModes.map((mode, idx) => (
            <div
              key={idx}
              className="bg-zinc-950/30 border border-zinc-900/60 p-5 rounded-xl hover:border-zinc-800 transition-colors"
            >
              <h4 className="font-sans font-bold text-white text-base">
                {mode.name}
              </h4>
              <p className="text-xs font-mono text-zinc-500 uppercase mt-1 leading-snug">
                {mode.meta}
              </p>
              
              <div className="mt-5 pt-3.5 border-t border-zinc-900/40 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600 uppercase">Velocity</span>
                  <span className="text-zinc-400">{mode.rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 uppercase">Combat Tier</span>
                  <span className="text-zinc-400">{mode.tier}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DISCORD PROMOTION BANNER */}
      <section className="relative rounded-3xl border border-indigo-950/40 bg-indigo-950/10 overflow-hidden p-8 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-5 text-left">
            {/* Custom Discord icon / picture */}
            <div className="w-16 h-16 bg-[#5865F2]/20 border border-[#5865F2]/40 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#5865F2]/10 animate-pulse">
              <svg className="w-9 h-9 fill-[#5865F2]" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.48,6.83,77.19,77.19,0,0,0,49.18,0,105.15,105.15,0,0,0,18.74,8.07C-3.41,41.14-.38,73.5,1.21,74.78a107.09,107.09,0,0,0,33,16.65,82.47,82.47,0,0,0,6.9-11.23A68.32,68.32,0,0,1,28,73.34c1-.75,2-1.53,3-2.33a76.44,76.44,0,0,0,71.21,0c1,.8,2,1.58,3,2.33a68.17,68.17,0,0,1-13.1,6.86,81.42,81.42,0,0,0,6.9,11.23,106.87,106.87,0,0,0,33-16.65C127.52,73.5,130.55,41.14,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#5865F2] uppercase">
                  OFFICIAL COMMUNITY RECRUITMENT
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h3 className="text-2xl font-sans font-black text-white uppercase tracking-tight mt-0.5">
                ⏐ ＳＯＮＩＣ ＴＩＥＲＳ ⏐
              </h3>
              <p className="text-sm font-sans text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Unlock exclusive roles, match with active competitive players, register squad tournaments, and consult direct staff evaluations.
              </p>
            </div>
          </div>
          <a
            href="https://discord.gg/SX4HST5yW"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-3.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#5865F2]/20 flex items-center justify-center gap-2.5 shrink-0"
          >
            JOIN OUR DISCORD SERVER →
          </a>
        </div>
      </section>
    </div>
  );
}
