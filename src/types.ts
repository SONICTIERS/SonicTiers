/**
 * Competitive Minecraft Ranking Types & Interfaces
 */

export type GameMode =
  | 'Sword'
  | 'Axe'
  | 'NethPot'
  | 'Mace'
  | 'OP Mace'
  | 'Cart'
  | 'CPvP'
  | 'UHC';

export type RankTier =
  | 'LT5'
  | 'HT5'
  | 'LT4'
  | 'HT4'
  | 'LT3'
  | 'HT3'
  | 'LT2'
  | 'HT2'
  | 'LT1'
  | 'HT1';

export interface RankInfo {
  tier: RankTier;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  glowColor: string;
  description: string;
  weapon: 'wood_sword' | 'stone_sword' | 'iron_sword' | 'diamond_sword' | 'netherite_sword' | 'diamond_axe' | 'netherite_axe';
}

export interface MatchHistoryItem {
  id: string;
  opponent: string;
  opponentUuid?: string;
  result: 'WIN' | 'LOSS';
  mode: GameMode;
  pointsChange: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
  iconName: string;
}

export interface ModeStat {
  mode: GameMode;
  rank: RankTier;
  points: number;
  wins: number;
  losses: number;
  winRate: number;
  kdRatio: number;
  accuracy: number;
  cps: number;
}

export interface MinecraftPlayer {
  username: string;
  uuid: string;
  id: string; // fallback matching UUID
  xpLevel: number;
  xpPoints: number;
  overallRank: RankTier;
  overallPoints: number;
  winRate: number;
  matchHistory: MatchHistoryItem[];
  achievements: Achievement[];
  stats: Record<GameMode, ModeStat>;
  joinedDate: string;
  isBanned?: boolean;
  banDurationDays?: number;
  banStartDate?: string;
  banExpiresAt?: string;
  isAdmin?: boolean;
  isTester?: boolean;
  customAvatarUrl?: string;
  customBodyUrl?: string;
  isUnoriginal?: boolean;
  skinTimestamp?: number;
}

export interface AdminSettings {
  testLengthSeconds: number;
  aimTargetCount: number;
  banWords: string[];
  autoPromotion: boolean;
}
