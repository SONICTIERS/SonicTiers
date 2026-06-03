import { RankInfo, RankTier, MinecraftPlayer, GameMode, ModeStat } from './types';

export const RANK_TIERS: Record<RankTier, RankInfo> = {
  LT5: {
    tier: 'LT5',
    name: 'Low Tier 5',
    minPoints: 0,
    maxPoints: 10,
    color: 'from-zinc-600 to-zinc-400',
    glowColor: 'rgba(113, 113, 122, 0.4)',
    description: 'Fresh recruit. Learning PvP mechanics, keyboard strafes, and basic weapon handling.',
    weapon: 'wood_sword',
  },
  HT5: {
    tier: 'HT5',
    name: 'High Tier 5',
    minPoints: 11,
    maxPoints: 20,
    color: 'from-amber-800 to-amber-600',
    glowColor: 'rgba(146, 64, 14, 0.4)',
    description: 'Capable of executing standard combat runs but struggles with consistent target tracking.',
    weapon: 'wood_sword',
  },
  LT4: {
    tier: 'LT4',
    name: 'Low Tier 4',
    minPoints: 21,
    maxPoints: 30,
    color: 'from-slate-500 to-slate-400',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    description: 'Familiar with stone tool combat. Understands CPS jitter patterns and minor timing setups.',
    weapon: 'stone_sword',
  },
  HT4: {
    tier: 'HT4',
    name: 'High Tier 4',
    minPoints: 31,
    maxPoints: 40,
    color: 'from-teal-600 to-teal-400',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    description: 'Solid mechanics in shield disabling and critical strike timings. Relearning standard sword combos.',
    weapon: 'stone_sword',
  },
  LT3: {
    tier: 'LT3',
    name: 'Low Tier 3',
    minPoints: 41,
    maxPoints: 50,
    color: 'from-blue-600 to-cyan-500',
    glowColor: 'rgba(37, 99, 235, 0.4)',
    description: 'Sustains 8+ CPS with decent aim tracking. Begins managing block-hitting and sprint-reset spacing.',
    weapon: 'iron_sword',
  },
  HT3: {
    tier: 'HT3',
    name: 'High Tier 3',
    minPoints: 51,
    maxPoints: 60,
    color: 'from-violet-600 to-cyan-400',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    description: 'Recognized PvP athlete. Consistently wins local arena matches. Excellent hotkey reactions.',
    weapon: 'iron_sword',
  },
  LT2: {
    tier: 'LT2',
    name: 'Low Tier 2',
    minPoints: 61,
    maxPoints: 70,
    color: 'from-purple-600 to-fuchsia-500',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    description: 'Exceptional shield combat and critical chain attacks. Mastery of pot splashing and strafe loops.',
    weapon: 'diamond_sword',
  },
  HT2: {
    tier: 'HT2',
    name: 'High Tier 2',
    minPoints: 71,
    maxPoints: 80,
    color: 'from-cyan-500 to-emerald-400',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    description: 'Premier competitive tier. Competes at regional rankings. Advanced crystal placing and blast dodging tactics.',
    weapon: 'diamond_axe',
  },
  LT1: {
    tier: 'LT1',
    name: 'Low Tier 1',
    minPoints: 81,
    maxPoints: 90,
    color: 'from-orange-600 to-red-500',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    description: 'Demigod of the arena. Elite reflexes, flawless click synchronization, and split-second game-mode adaptions.',
    weapon: 'netherite_sword',
  },
  HT1: {
    tier: 'HT1',
    name: 'High Tier 1',
    minPoints: 91,
    maxPoints: 100,
    color: 'from-emerald-500 via-lime-400 to-yellow-300',
    glowColor: 'rgba(34, 197, 94, 0.85)',
    description: 'Absolute PvP Master. Controls of space and time. Unbeatable movement, rapid macros, and stellar strategy execution.',
    weapon: 'netherite_axe',
  },
};

export const GAME_MODES: GameMode[] = [
  'Sword',
  'Axe',
  'NethPot',
  'Mace',
  'OP Mace',
  'Cart',
  'CPvP',
  'UHC',
];

// Helper to determine rank based on score
export const getRankByPoints = (points: number): RankTier => {
  if (points <= 10) return 'LT5';
  if (points <= 20) return 'HT5';
  if (points <= 30) return 'LT4';
  if (points <= 40) return 'HT4';
  if (points <= 50) return 'LT3';
  if (points <= 60) return 'HT3';
  if (points <= 70) return 'LT2';
  if (points <= 80) return 'HT2';
  if (points <= 90) return 'LT1';
  return 'HT1';
};

// Generate standard mode stats based on overall rank and seed points
export const generateModeStats = (overallRank: RankTier, overallPoints: number): Record<GameMode, ModeStat> => {
  const stats: Partial<Record<GameMode, ModeStat>> = {};
  
  GAME_MODES.forEach((mode, idx) => {
    // vary points slightly per mode
    const variationAmt = Math.floor(Math.sin(idx * 7) * 8);
    let points = overallPoints + variationAmt;
    if (points < 0) points = 3;
    if (points > 100) points = 99;
    
    const rank = getRankByPoints(points);
    const wins = Math.floor(points * 2.5 + Math.random() * 15);
    const losses = Math.floor((100 - points) * 1.5 + Math.random() * 10);
    const total = wins + losses || 1;
    
    // Stats typical of the score
    const accuracy = parseFloat((60 + (points * 0.35) + Math.random() * 5).toFixed(1));
    const cps = parseFloat((6 + (points * 0.08) + Math.random() * 2).toFixed(1));
    const kdRatio = parseFloat(((points / 35) + 0.3 + Math.random() * 0.2).toFixed(2));

    stats[mode] = {
      mode,
      rank,
      points,
      wins,
      losses,
      winRate: parseFloat(((wins / total) * 100).toFixed(1)),
      kdRatio,
      accuracy,
      cps,
    };
  });

  return stats as Record<GameMode, ModeStat>;
};

export const MOCK_PLAYERS: MinecraftPlayer[] = [
  {
    username: 'Swifter',
    uuid: '34293f06-b333-47a3-82a1-cf8d2b963bfd',
    id: '34293f06-b333-47a3-82a1-cf8d2b963bfd',
    xpLevel: 87,
    xpPoints: 34500,
    overallRank: 'HT1',
    overallPoints: 95,
    winRate: 82.3,
    joinedDate: '2025-01-15',
    isTester: true,
    achievements: [
      { id: '1', title: 'Perfect Aim', description: 'Reach 95% accuracy in sword evaluation tests', iconName: 'target', unlockedAt: '2025-02-01' },
      { id: '2', title: 'Click God', description: 'Surpass 16 CPS in click frequency tests', iconName: 'zap', unlockedAt: '2025-02-15' },
      { id: '3', title: 'HT1 Unlocked', description: 'Ascend to High Tier 1 global standings', iconName: 'crown', unlockedAt: '2025-03-10' },
    ],
    matchHistory: [
      { id: 'm1', opponent: 'Stimpay', opponentUuid: 'bca9e66c-59bf-4bad-98d1-d250fcf422b4', result: 'WIN', mode: 'Sword', pointsChange: 2, date: '2026-05-28' },
      { id: 'm2', opponent: 'Technoblade', opponentUuid: 'b87669bb-ad41-4765-a140-5427c3feefced', result: 'WIN', mode: 'Axe', pointsChange: 1, date: '2026-05-25' },
      { id: 'm3', opponent: 'Stimpay', opponentUuid: 'bca9e66c-59bf-4bad-98d1-d250fcf422b4', result: 'WIN', mode: 'NethPot', pointsChange: 1, date: '2026-05-20' },
      { id: 'm4', opponent: 'Dante', opponentUuid: 'bf3000b2-3837-47ab-b631-f9f257a41c2c', result: 'LOSS', mode: 'CPvP', pointsChange: -2, date: '2026-05-18' },
    ],
    stats: generateModeStats('HT1', 95),
  },
  {
    username: 'Dante',
    uuid: 'bf3000b2-3837-47ab-b631-f9f257a41c2c',
    id: 'bf3000b2-3837-47ab-b631-f9f257a41c2c',
    xpLevel: 94,
    xpPoints: 41200,
    overallRank: 'HT1',
    overallPoints: 97,
    winRate: 85.1,
    joinedDate: '2024-11-20',
    isAdmin: true,
    achievements: [
      { id: '1', title: 'Flawless Strategy', description: 'Correctly solve all PvP situational challenges', iconName: 'brain', unlockedAt: '2024-12-05' },
      { id: '3', title: 'Global Apex', description: 'Hold first place on the Sword global leaderboard', iconName: 'shield', unlockedAt: '2025-01-12' },
      { id: '4', title: 'Iron Wall', description: 'Mitigate 90% incoming damage using dynamic shield blocks', iconName: 'swords', unlockedAt: '2025-02-28' },
    ],
    matchHistory: [
      { id: 'm5', opponent: 'Swifter', opponentUuid: '34293f06-b333-47a3-82a1-cf8d2b963bfd', result: 'WIN', mode: 'CPvP', pointsChange: 1, date: '2026-05-18' },
      { id: 'm6', opponent: 'Wisp', opponentUuid: '7f9b33be-db41-4775-9e67-d8dc630bc39a', result: 'WIN', mode: 'UHC', pointsChange: 1, date: '2026-05-12' },
      { id: 'm7', opponent: 'Fruitberries', opponentUuid: '8dfb4c73-45ab-4357-9d7a-cfb3aef6e881', result: 'WIN', mode: 'OP Mace', pointsChange: 3, date: '2026-05-05' },
    ],
    stats: generateModeStats('HT1', 97),
  },
  {
    username: 'Technoblade',
    uuid: 'b87669bb-ad41-4765-a140-5427c3feefced',
    id: 'b87669bb-ad41-4765-a140-5427c3feefced',
    xpLevel: 100,
    xpPoints: 99999,
    overallRank: 'HT1',
    overallPoints: 94,
    winRate: 81.6,
    joinedDate: '2024-06-01',
    isTester: true,
    achievements: [
      { id: '1', title: 'Infinite Streaks', description: 'Maintain a 50+ win streak in UHC PvP', iconName: 'flame', unlockedAt: '2024-07-01' },
      { id: '2', title: 'The Blade Only Dies Once', description: 'Defeat 15 players in diamond combat with 1 heart left', iconName: 'skull', unlockedAt: '2024-08-10' },
      { id: '3', title: 'Potatoes and PvP', description: 'Mine 500 blocks of potato and claim potato king of battles', iconName: 'trophy', unlockedAt: '2024-09-01' },
    ],
    matchHistory: [
      { id: 'm8', opponent: 'Dream', opponentUuid: 'ec70bc58-dbca-487b-8573-31177ba1c170', result: 'WIN', mode: 'Sword', pointsChange: 2, date: '2026-05-24' },
      { id: 'm9', opponent: 'Swifter', opponentUuid: '34293f06-b333-47a3-82a1-cf8d2b963bfd', result: 'LOSS', mode: 'Axe', pointsChange: -1, date: '2026-05-25' },
    ],
    stats: generateModeStats('HT1', 94),
  },
  {
    username: 'Stimpay',
    uuid: 'bca9e66c-59bf-4bad-98d1-d250fcf422b4',
    id: 'bca9e66c-59bf-4bad-98d1-d250fcf422b4',
    xpLevel: 82,
    xpPoints: 31200,
    overallRank: 'LT1',
    overallPoints: 88,
    winRate: 77.4,
    joinedDate: '2025-02-12',
    achievements: [
      { id: '1', title: 'Sword King', description: 'Win 100 sword duels in classic ranking matches', iconName: 'swords', unlockedAt: '2025-03-01' },
      { id: '2', title: 'Dodge Expert', description: 'Evade 99% of splash poisons in potion combat', iconName: 'zap', unlockedAt: '2025-03-24' },
    ],
    matchHistory: [
      { id: 'm10', opponent: 'Swifter', opponentUuid: '34293f06-b333-47a3-82a1-cf8d2b963bfd', result: 'LOSS', mode: 'Sword', pointsChange: -1, date: '2026-05-28' },
      { id: 'm11', opponent: 'Swifter', opponentUuid: '34293f06-b333-47a3-82a1-cf8d2b963bfd', result: 'LOSS', mode: 'NethPot', pointsChange: -2, date: '2026-05-20' },
      { id: 'm12', opponent: 'Fruitberries', opponentUuid: '8dfb4c73-45ab-4357-9d7a-cfb3aef6e881', result: 'WIN', mode: 'Sword', pointsChange: 2, date: '2026-05-15' },
    ],
    stats: generateModeStats('LT1', 88),
  },
  {
    username: 'Fruitberries',
    uuid: '8dfb4c73-45ab-4357-9d7a-cfb3aef6e881',
    id: '8dfb4c73-45ab-4357-9d7a-cfb3aef6e881',
    xpLevel: 79,
    xpPoints: 28900,
    overallRank: 'LT1',
    overallPoints: 84,
    winRate: 76.1,
    joinedDate: '2025-03-03',
    achievements: [
      { id: '1', title: 'Water Bucket Master', description: 'Successfully perform MLG mace fall mitigations 10 times consecutively', iconName: 'target', unlockedAt: '2025-03-29' },
      { id: '2', title: 'UHC Champion', description: 'Reach top rating in Ultra Hardcore custom combat duels', iconName: 'crown', unlockedAt: '2025-04-12' },
    ],
    matchHistory: [
      { id: 'm13', opponent: 'Stimpay', opponentUuid: 'bca9e66c-59bf-4bad-98d1-d250fcf422b4', result: 'LOSS', mode: 'Sword', pointsChange: -1, date: '2026-05-15' },
      { id: 'm14', opponent: 'Dante', opponentUuid: 'bf3000b2-3837-47ab-b631-f9f257a41c2c', result: 'LOSS', mode: 'OP Mace', pointsChange: -2, date: '2026-05-05' },
      { id: 'm15', opponent: 'Wisp', opponentUuid: '7f9b33be-db41-4775-9e67-d8dc630bc39a', result: 'WIN', mode: 'UHC', pointsChange: 2, date: '2026-05-01' },
    ],
    stats: generateModeStats('LT1', 84),
  },
  {
    username: 'Wisp',
    uuid: '7f9b33be-db41-4775-9e67-d8dc630bc39a',
    id: '7f9b33be-db41-4775-9e67-d8dc630bc39a',
    xpLevel: 68,
    xpPoints: 21400,
    overallRank: 'HT2',
    overallPoints: 76,
    winRate: 69.8,
    joinedDate: '2025-04-01',
    achievements: [
      { id: '1', title: 'Aggressive Finisher', description: 'Conclude 20 matches in under 30 seconds', iconName: 'zap', unlockedAt: '2025-04-20' },
    ],
    matchHistory: [
      { id: 'm16', opponent: 'Dante', opponentUuid: 'bf3000b2-3837-47ab-b631-f9f257a41c2c', result: 'LOSS', mode: 'UHC', pointsChange: -1, date: '2026-05-12' },
      { id: 'm17', opponent: 'Fruitberries', opponentUuid: '8dfb4c73-45ab-4357-9d7a-cfb3aef6e881', result: 'LOSS', mode: 'UHC', pointsChange: -1, date: '2026-05-01' },
      { id: 'm18', opponent: 'Dream', opponentUuid: 'ec70bc58-dbca-487b-8573-31177ba1c170', result: 'WIN', mode: 'Axe', pointsChange: 2, date: '2026-04-29' },
    ],
    stats: generateModeStats('HT2', 76),
  },
  {
    username: 'Dream',
    uuid: 'ec70bc58-dbca-487b-8573-31177ba1c170',
    id: 'ec70bc58-dbca-487b-8573-31177ba1c170',
    xpLevel: 71,
    xpPoints: 23100,
    overallRank: 'HT2',
    overallPoints: 73,
    winRate: 68.2,
    joinedDate: '2025-01-10',
    achievements: [
      { id: '1', title: 'Speedrunner', description: 'Pass CPS test with zero speed fluctuations', iconName: 'brain', unlockedAt: '2025-02-05' },
    ],
    matchHistory: [
      { id: 'm19', opponent: 'Technoblade', opponentUuid: 'b87669bb-ad41-4765-a140-5427c3feefced', result: 'LOSS', mode: 'Sword', pointsChange: -1, date: '2026-05-24' },
      { id: 'm20', opponent: 'Wisp', opponentUuid: '7f9b33be-db41-4775-9e67-d8dc630bc39a', result: 'LOSS', mode: 'Axe', pointsChange: -1, date: '2026-04-29' },
      { id: 'm21', opponent: 'PrestonPlayz', opponentUuid: 'bf9efca2-6323-45bc-8a71-6a2c3a5160fa', result: 'WIN', mode: 'Cart', pointsChange: 3, date: '2026-04-18' },
    ],
    stats: generateModeStats('HT2', 73),
  },
  {
    username: 'PrestonPlayz',
    uuid: 'bf9efca2-6323-45bc-8a71-6a2c3a5160fa',
    id: 'bf9efca2-6323-45bc-8a71-6a2c3a5160fa',
    xpLevel: 51,
    xpPoints: 12400,
    overallRank: 'HT3',
    overallPoints: 55,
    winRate: 59.4,
    joinedDate: '2025-05-01',
    achievements: [
      { id: '1', title: 'TNT Enthusiast', description: 'Successfully trigger tnt minecart combos 5 times', iconName: 'flame', unlockedAt: '2025-05-15' },
    ],
    matchHistory: [
      { id: 'm22', opponent: 'Dream', opponentUuid: 'ec70bc58-dbca-487b-8573-31177ba1c170', result: 'LOSS', mode: 'Cart', pointsChange: -1, date: '2026-04-18' },
    ],
    stats: generateModeStats('HT3', 55),
  },
  {
    username: 'Steve',
    uuid: '8667ba71-b85a-4004-af54-457a9734eed7',
    id: '8667ba71-b85a-4004-af54-457a9734eed7',
    xpLevel: 32,
    xpPoints: 6100,
    overallRank: 'HT4',
    overallPoints: 35,
    winRate: 48.3,
    joinedDate: '2025-05-10',
    achievements: [],
    matchHistory: [],
    stats: generateModeStats('HT4', 35),
  },
  {
    username: 'Alex',
    uuid: '09c6253c-f4b6-4b21-9d8e-171b3e6afbc0',
    id: '09c6253c-f4b6-4b21-9d8e-171b3e6afbc0',
    xpLevel: 18,
    xpPoints: 2400,
    overallRank: 'HT5',
    overallPoints: 15,
    winRate: 38.5,
    joinedDate: '2025-05-18',
    achievements: [],
    matchHistory: [],
    stats: generateModeStats('HT5', 15),
  },
];
