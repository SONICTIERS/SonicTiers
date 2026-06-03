import React, { useState, useEffect } from 'react';
import { MinecraftPlayer, AdminSettings, RankTier } from '../types';
import { getMinecraftAvatar, fetchMinecraftProfile, processMinecraftSkin, getCorrectAvatar } from '../utils/minecraft';
import { RANK_TIERS, getRankByPoints, generateModeStats, GAME_MODES } from '../mockData';
import { ShieldAlert, Users, Trash, ToggleLeft, ToggleRight, Check, Sliders, AlertTriangle, Play, RefreshCw, BarChart, Plus, Edit, X, Upload, Image, Search } from 'lucide-react';
import { motion } from 'motion/react';

const SKIN_TEMPLATES = [
  {
    name: 'Dream (PvP Hood)',
    avatar: 'https://crafatar.com/avatars/069a79f4-44e9-4726-a5be-fca90e38aaf5?size=64&overlay',
    body: 'https://crafatar.com/renders/body/069a79f4-44e9-4726-a5be-fca90e38aaf5?scale=10&overlay'
  },
  {
    name: 'Technoblade',
    avatar: 'https://crafatar.com/avatars/b90e660b-8d80-4591-a1e6-c17435f1345f?size=64&overlay',
    body: 'https://crafatar.com/renders/body/b90e660b-8d80-4591-a1e6-c17435f1345f?scale=10&overlay'
  },
  {
    name: 'Nether Overlord',
    avatar: 'https://crafatar.com/avatars/61699b2e-de6f-4ae0-b42e-be94aa8ddc5d?size=64&overlay',
    body: 'https://crafatar.com/renders/body/61699b2e-de6f-4ae0-b42e-be94aa8ddc5d?scale=10&overlay'
  },
  {
    name: 'Classic Steve',
    avatar: 'https://crafatar.com/avatars/dec23297-5654-41d0-8ac1-4f812ecf4e1d?size=64&overlay',
    body: 'https://crafatar.com/renders/body/dec23297-5654-41d0-8ac1-4f812ecf4e1d?scale=10&overlay'
  },
  {
    name: 'Classic Alex',
    avatar: 'https://crafatar.com/avatars/8667ba71-b85a-4004-af4b-457a814add1e?size=64&overlay',
    body: 'https://crafatar.com/renders/body/8667ba71-b85a-4004-af4b-457a814add1e?scale=10&overlay'
  },
  {
    name: 'Futuristic Hunter',
    avatar: 'https://crafatar.com/avatars/45f5cd3e-97bb-4fa0-82d2-8a9d02c61141?size=64&overlay',
    body: 'https://crafatar.com/renders/body/45f5cd3e-97bb-4fa0-82d2-8a9d02c61141?scale=10&overlay'
  }
];

interface AdminDashboardProps {
  players: MinecraftPlayer[];
  settings: AdminSettings;
  onUpdateSettings: (next: AdminSettings) => void;
  onModifyBlockStatus: (username: string, nextBanned: boolean, days?: number) => void;
  onTunePlayerELO: (username: string, nextPoints: number) => void;
  onToggleAdminStatus?: (username: string, nextAdmin: boolean) => void;
  onAddPlayer?: (newPlayer: MinecraftPlayer) => void;
  onUpdatePlayer?: (oldUsername: string, updatedPlayer: MinecraftPlayer) => void;
  onDeletePlayer?: (username: string) => void;
}

export default function AdminDashboard({
  players,
  settings,
  onUpdateSettings,
  onModifyBlockStatus,
  onTunePlayerELO,
  onToggleAdminStatus,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer
}: AdminDashboardProps) {
   const [activeTab, setActiveTab] = useState<'users' | 'analytics'>('users');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [testLengthInput, setTestLengthInput] = useState(settings.testLengthSeconds);
  const [targetCountInput, setTargetCountInput] = useState(settings.aimTargetCount);
  const [bannedWordString, setBannedWordString] = useState(settings.banWords.join(', '));
  const [isSuccessSave, setIsSuccessSave] = useState(false);

  // ELO tune states
  const [editingPlayerUsername, setEditingPlayerUsername] = useState<string | null>(null);
  const [eloValueInput, setEloValueInput] = useState(50);

  // Ban duration prompt states
  const [banningPlayerUsername, setBanningPlayerUsername] = useState<string | null>(null);
  const [banDurationDays, setBanDurationDays] = useState<number>(30); // default to 30 days

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccessSave(false);
    
    // Parse words
    const list = bannedWordString.split(',')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);

    onUpdateSettings({
      testLengthSeconds: Number(testLengthInput),
      aimTargetCount: Number(targetCountInput),
      banWords: list,
      autoPromotion: settings.autoPromotion,
    });
    
    setIsSuccessSave(true);
    setTimeout(() => setIsSuccessSave(false), 2000);
  };

  const startTuningElo = (username: string, current: number) => {
    setEditingPlayerUsername(username);
    setEloValueInput(current);
  };

  const commitTuning = (username: string) => {
    // clamp points 0-100
    const clamped = Math.max(0, Math.min(100, Math.floor(Number(eloValueInput))));
    onTunePlayerELO(username, clamped);
    setEditingPlayerUsername(null);
  };

  // Competitor Creation state
  const TIER_POINTS_MAPPING: Record<RankTier, number> = {
    HT1: 95,
    LT1: 85,
    HT2: 75,
    LT2: 65,
    HT3: 55,
    LT3: 45,
    HT4: 35,
    LT4: 25,
    HT5: 15,
    LT5: 5,
  };

  const calculateOverallPoints = (tiersRecord: Record<string, RankTier>): number => {
    const modes = Object.keys(tiersRecord);
    if (modes.length === 0) return 50;
    const sum = modes.reduce((acc, currentMode) => {
      const tier = tiersRecord[currentMode];
      return acc + (TIER_POINTS_MAPPING[tier] ?? 50);
    }, 0);
    return Math.round(sum / modes.length);
  };

  const generateCustomModeStats = (tiersRecord: Record<string, RankTier>): Record<string, any> => {
    const stats: Record<string, any> = {};
    Object.entries(tiersRecord).forEach(([mode, tier]) => {
      const points = TIER_POINTS_MAPPING[tier];
      const wins = Math.floor(points * 2.5 + Math.random() * 15);
      const losses = Math.floor((100 - points) * 1.5 + Math.random() * 10);
      const total = wins + losses || 1;
      
      const accuracy = parseFloat((60 + (points * 0.35) + Math.random() * 5).toFixed(1));
      const cps = parseFloat((6 + (points * 0.08) + Math.random() * 2).toFixed(1));
      const kdRatio = parseFloat(((points / 35) + 0.3 + Math.random() * 0.2).toFixed(2));

      stats[mode] = {
        mode,
        rank: tier,
        points,
        wins,
        losses,
        winRate: parseFloat(((wins / total) * 100).toFixed(1)),
        kdRatio,
        accuracy,
        cps,
      };
    });
    return stats;
  };

  const getTierColorClass = (tier: RankTier) => {
    switch (tier) {
      case 'HT1': return 'text-emerald-400 font-bold';
      case 'LT1': return 'text-emerald-700 font-bold';
      case 'HT2': return 'text-cyan-400 font-bold';
      case 'LT2': return 'text-sky-700 font-bold';
      case 'HT3': return 'text-purple-400 font-bold';
      case 'LT3': return 'text-purple-700 font-bold';
      case 'HT4': return 'text-amber-400 font-bold';
      case 'LT4': return 'text-amber-700 font-bold';
      case 'HT5': return 'text-red-400 font-bold';
      case 'LT5': return 'text-red-700 font-bold';
      default: return 'text-zinc-200';
    }
  };

  const getTierHexColor = (tier: RankTier) => {
    switch (tier) {
      case 'HT1': return '#34d399'; // Emerald-400 (Lighter Green)
      case 'LT1': return '#047857'; // Emerald-700 (Darker Green)
      case 'HT2': return '#22d3ee'; // Cyan-400 (Lighter Cyan/Blue)
      case 'LT2': return '#0369a1'; // Sky-700 (Darker Cyan/Blue)
      case 'HT3': return '#c084fc'; // Purple-400 (Lighter Purple)
      case 'LT3': return '#7e22ce'; // Purple-700 (Darker Purple)
      case 'HT4': return '#fbbf24'; // Amber-400 (Lighter Amber/Yellow)
      case 'LT4': return '#b45309'; // Amber-700 (Darker Amber/Yellow)
      case 'HT5': return '#f87171'; // Red-400 (Lighter Red)
      case 'LT5': return '#b91c1c'; // Red-700 (Darker Red)
      default: return '#e4e4e7';
    }
  };

  const [newModeTiers, setNewModeTiers] = useState<Record<string, RankTier>>({
    Sword: 'LT5',
    Axe: 'LT5',
    NethPot: 'LT5',
    Mace: 'LT5',
    'OP Mace': 'LT5',
    Cart: 'LT5',
    CPvP: 'LT5',
    UHC: 'LT5',
  });

  const [editModeTiers, setEditModeTiers] = useState<Record<string, RankTier>>({
    Sword: 'LT5',
    Axe: 'LT5',
    NethPot: 'LT5',
    Mace: 'LT5',
    'OP Mace': 'LT5',
    Cart: 'LT5',
    CPvP: 'LT5',
    UHC: 'LT5',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPoints, setNewPoints] = useState(50);

  useEffect(() => {
    const calculated = calculateOverallPoints(newModeTiers);
    setNewPoints(calculated);
  }, [newModeTiers]);

  useEffect(() => {
    const calculated = calculateOverallPoints(editModeTiers);
    setEditPoints(calculated);
  }, [editModeTiers]);
  const [newUuid, setNewUuid] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newIsUnoriginal, setNewIsUnoriginal] = useState(false);
  const [newIsTester, setNewIsTester] = useState(false);
  const [newCustomAvatarUrl, setNewCustomAvatarUrl] = useState('');
  const [newCustomBodyUrl, setNewCustomBodyUrl] = useState('');
  const [addFormError, setAddFormError] = useState('');

  // Competitor Editing profile state
  const [editingPlayer, setEditingPlayer] = useState<MinecraftPlayer | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPoints, setEditPoints] = useState(50);
  const [editUuid, setEditUuid] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editIsUnoriginal, setEditIsUnoriginal] = useState(false);
  const [editIsTester, setEditIsTester] = useState(false);
  const [editCustomAvatarUrl, setEditCustomAvatarUrl] = useState('');
  const [editCustomBodyUrl, setEditCustomBodyUrl] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [deletingPlayerUsername, setDeletingPlayerUsername] = useState<string | null>(null);

  // Automatic skin fetching state and handlers
  const [newSkinFetchStatus, setNewSkinFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [editSkinFetchStatus, setEditSkinFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const autoFetchNewPlayerSkin = async (username: string) => {
    if (newIsUnoriginal) {
      setNewSkinFetchStatus('idle');
      return;
    }
    const clean = username.trim();
    if (!clean || clean.length < 3 || !/^[a-zA-Z0-9_]{3,16}$/.test(clean)) {
      setNewSkinFetchStatus('idle');
      return;
    }
    setNewSkinFetchStatus('loading');
    try {
      const profile = await fetchMinecraftProfile(clean);
      if (profile && profile.uuid) {
        setNewUuid(profile.uuid);
        setNewCustomAvatarUrl(profile.avatarUrl);
        setNewCustomBodyUrl(profile.bodyUrl);
        setNewSkinFetchStatus('success');
      } else {
        setNewSkinFetchStatus('error');
      }
    } catch (err) {
      setNewSkinFetchStatus('error');
    }
  };

  const autoFetchEditPlayerSkin = async (username: string) => {
    if (editIsUnoriginal) {
      setEditSkinFetchStatus('idle');
      return;
    }
    const clean = username.trim();
    if (!clean || clean.length < 3 || !/^[a-zA-Z0-9_]{3,16}$/.test(clean)) {
      setEditSkinFetchStatus('idle');
      return;
    }
    setEditSkinFetchStatus('loading');
    try {
      const profile = await fetchMinecraftProfile(clean);
      if (profile && profile.uuid) {
        setEditUuid(profile.uuid);
        setEditCustomAvatarUrl(profile.avatarUrl);
        setEditCustomBodyUrl(profile.bodyUrl);
        setEditSkinFetchStatus('success');
      } else {
        setEditSkinFetchStatus('error');
      }
    } catch (err) {
      setEditSkinFetchStatus('error');
    }
  };

  // Debounced auto-fetch skin on username change for New Player
  useEffect(() => {
    if (newIsUnoriginal) {
      setNewSkinFetchStatus('idle');
      return;
    }
    const clean = newUsername.trim();
    if (clean.length < 3 || !/^[a-zA-Z0-9_]{3,16}$/.test(clean)) {
      setNewSkinFetchStatus('idle');
      return;
    }
    const timer = setTimeout(() => {
      autoFetchNewPlayerSkin(clean);
    }, 700);
    return () => clearTimeout(timer);
  }, [newUsername, newIsUnoriginal]);

  // Debounced auto-fetch skin on username change for Edit Player
  useEffect(() => {
    if (editIsUnoriginal) {
      setEditSkinFetchStatus('idle');
      return;
    }
    const clean = editUsername.trim();
    if (clean.length < 3 || !/^[a-zA-Z0-9_]{3,16}$/.test(clean)) {
      setEditSkinFetchStatus('idle');
      return;
    }
    const timer = setTimeout(() => {
      autoFetchEditPlayerSkin(clean);
    }, 730);
    return () => clearTimeout(timer);
  }, [editUsername, editIsUnoriginal]);

  const handleOpenAddForm = () => {
    setShowAddForm(true);
    setNewUsername('');
    setNewModeTiers({
      Sword: 'LT5',
      Axe: 'LT5',
      NethPot: 'LT5',
      Mace: 'LT5',
      'OP Mace': 'LT5',
      Cart: 'LT5',
      CPvP: 'LT5',
      UHC: 'LT5',
    });
    setNewPoints(5);
    setNewUuid('');
    setNewIsAdmin(false);
    setNewIsUnoriginal(false);
    setNewIsTester(false);
    setNewCustomAvatarUrl('');
    setNewCustomBodyUrl('');
    setAddFormError('');
    setNewSkinFetchStatus('idle');
    setEditingPlayer(null); // close editing if open
  };

  const handleOpenEditForm = (player: MinecraftPlayer) => {
    setEditingPlayer(player);
    setEditUsername(player.username);
    const initialEditTiers = {} as Record<string, RankTier>;
    ['Sword', 'Axe', 'NethPot', 'Mace', 'OP Mace', 'Cart', 'CPvP', 'UHC'].forEach(mode => {
      initialEditTiers[mode] = player.stats?.[mode]?.rank || 'LT5';
    });
    setEditModeTiers(initialEditTiers);
    setEditPoints(player.overallPoints);
    setEditUuid(player.uuid);
    setEditIsAdmin(!!player.isAdmin);
    setEditIsUnoriginal(!!player.isUnoriginal);
    setEditIsTester(!!player.isTester);
    setEditCustomAvatarUrl(player.customAvatarUrl || '');
    setEditCustomBodyUrl(player.customBodyUrl || '');
    setEditFormError('');
    setEditSkinFetchStatus('idle');
    setShowAddForm(false); // close adding if open
  };

  const handleFileChange = (file: File | null, type: 'avatar' | 'body' | 'raw_skin', isEdit: boolean) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        if (type === 'avatar') setEditCustomAvatarUrl(dataUrl);
        else if (type === 'body') setEditCustomBodyUrl(dataUrl);
        else {
          processMinecraftSkin(dataUrl).then(({ avatarUrl, bodyUrl }) => {
            setEditCustomAvatarUrl(avatarUrl);
            setEditCustomBodyUrl(bodyUrl);
          });
        }
      } else {
        if (type === 'avatar') setNewCustomAvatarUrl(dataUrl);
        else if (type === 'body') setNewCustomBodyUrl(dataUrl);
        else {
          processMinecraftSkin(dataUrl).then(({ avatarUrl, bodyUrl }) => {
            setNewCustomAvatarUrl(avatarUrl);
            setNewCustomBodyUrl(bodyUrl);
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError('');
    const cleanUsername = newUsername.trim();
    
    if (!cleanUsername) {
      setAddFormError('Username cannot be empty.');
      return;
    }

    if (players.some(p => p.username.toLowerCase() === cleanUsername.toLowerCase())) {
      setAddFormError('A player with this username already exists.');
      return;
    }

    if (settings.banWords.some(w => cleanUsername.toLowerCase().includes(w.toLowerCase()))) {
      setAddFormError('Username contains prohibited blacklisted phrases.');
      return;
    }

    if (newIsUnoriginal) {
      if (!newCustomAvatarUrl.trim() || !newCustomBodyUrl.trim()) {
        setAddFormError('Offline / Unoriginal players must have custom skin assets selected. Please select a template preset or upload custom images below.');
        return;
      }
    }

    const generatedUuid = newUuid.trim() || `sim-${Math.random().toString(36).substr(2, 9)}`;
    const rank = getRankByPoints(newPoints);
    const modeStats = generateCustomModeStats(newModeTiers) as any;
    
    const newRecord: MinecraftPlayer = {
      username: cleanUsername,
      uuid: generatedUuid,
      id: generatedUuid,
      xpLevel: 1,
      xpPoints: 400 + Math.floor(Math.random() * 200),
      overallRank: rank,
      overallPoints: newPoints,
      winRate: 50,
      matchHistory: [],
      achievements: [],
      stats: modeStats,
      joinedDate: new Date().toISOString().split('T')[0],
      isBanned: false,
      isAdmin: newIsAdmin,
      isUnoriginal: newIsUnoriginal,
      isTester: newIsTester,
      customAvatarUrl: newCustomAvatarUrl.trim() || undefined,
      customBodyUrl: newCustomBodyUrl.trim() || undefined,
      skinTimestamp: Date.now()
    };

    if (onAddPlayer) {
      onAddPlayer(newRecord);
      setShowAddForm(false);
    }
  };

  const handleSaveEditedPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError('');
    const cleanUsername = editUsername.trim();

    if (!cleanUsername) {
      setEditFormError('Username cannot be empty.');
      return;
    }

    if (!editingPlayer) return;

    if (players.some(p => p.username.toLowerCase() === cleanUsername.toLowerCase() && p.username !== editingPlayer.username)) {
      setEditFormError('A player with this username already exists.');
      return;
    }

    if (settings.banWords.some(w => cleanUsername.toLowerCase().includes(w.toLowerCase()))) {
      setEditFormError('Username contains prohibited blacklisted phrases.');
      return;
    }

    if (editIsUnoriginal) {
      if (!editCustomAvatarUrl.trim() || !editCustomBodyUrl.trim()) {
        setEditFormError('Offline / Unoriginal players must have custom skin assets selected. Please select a template preset or upload custom images below.');
        return;
      }
    }

    const rank = getRankByPoints(editPoints);
    const modeStats = generateCustomModeStats(editModeTiers) as any;

    const updatedRecord: MinecraftPlayer = {
      ...editingPlayer,
      username: cleanUsername,
      overallRank: rank,
      overallPoints: editPoints,
      uuid: editUuid.trim() || editingPlayer.uuid,
      isAdmin: editIsAdmin,
      isUnoriginal: editIsUnoriginal,
      isTester: editIsTester,
      stats: modeStats,
      customAvatarUrl: editCustomAvatarUrl.trim() || undefined,
      customBodyUrl: editCustomBodyUrl.trim() || undefined,
      skinTimestamp: (editCustomAvatarUrl.trim() !== (editingPlayer.customAvatarUrl || '') || editCustomBodyUrl.trim() !== (editingPlayer.customBodyUrl || ''))
        ? Date.now()
        : editingPlayer.skinTimestamp
    };

    if (onUpdatePlayer) {
      onUpdatePlayer(editingPlayer.username, updatedRecord);
      setEditingPlayer(null);
    }
  };

  // Calculations for analytics tab
  const totalUsers = players.length;
  const bannedCount = players.filter(p => p.isBanned).length;
  const averageElo = parseFloat((players.reduce((sum, p) => sum + p.overallPoints, 0) / totalUsers).toFixed(1));
  const ht1Count = players.filter(p => p.overallRank === 'HT1').length;

  const sortedPlayersForRanking = [...players].sort((a, b) => b.overallPoints - a.overallPoints);

  const filteredPlayers = players.filter((p) => {
    const query = adminSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      p.username.toLowerCase().includes(query) ||
      p.overallRank.toLowerCase().includes(query)
    );
  });

  return (
    <div id="admin-module" className="bg-[#0b0c10]/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 mb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#EF3131] bg-red-950/20 border border-red-500/20 px-2.5 py-1 rounded">
            ADMINISTRATOR ACCESS
          </span>
          <h2 id="admin-title" className="text-2xl font-sans font-bold tracking-tight text-white mt-2 uppercase">
            sonictiers Systems Control
          </h2>
        </div>
        
        {/* Navigation Tabs */}
        <div className="mt-4 md:mt-0 flex gap-1.5 bg-zinc-950/80 border border-zinc-900 p-1 rounded-xl">
          <button
            id="tab-users"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Competitors list
          </button>
          
          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'bg-zinc-805 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                  Registered competitor database :
                </span>
              </div>
              
              <div className="relative flex-1 max-w-sm w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-550">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  placeholder="Search by user or tier (e.g. HT1)..."
                  className="w-full bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700 focus:border-[#39FF14]/40 text-xs font-mono text-white pl-9 pr-8 py-2 rounded-xl outline-none transition"
                />
                {adminSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAdminSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2.5 bg-[#39FF14] hover:bg-emerald-400 text-black font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#39FF14]/10 self-end sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Register New Competitor
            </button>
          </div>

          {/* ADD COMPETITOR FORM BLOCK */}
          {showAddForm && (
            <div className="p-6 bg-zinc-950/80 border border-[#39FF14]/25 rounded-2xl space-y-4 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#39FF14]/5 blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-sans font-black text-white uppercase flex items-center gap-2">
                  <span className="text-[#39FF14]">✚</span> Register New PvP Athlete
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-mono font-bold uppercase transition cursor-pointer"
                >
                  Close X
                </button>
              </div>

              <form onSubmit={handleSaveNewPlayer} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4 space-y-1.5 flex flex-col justify-start">
                  <label htmlFor="new-player-uname" className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Username (Minecraft Name)*</label>
                  <input
                    id="new-player-uname"
                    type="text"
                    required
                    placeholder="e.g. Swifter"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-[#39FF14]/40 outline-none transition"
                  />
                  {newSkinFetchStatus === 'loading' && (
                    <span className="text-[8px] font-mono text-zinc-400 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#39FF14]" />
                      SYNCING SKIN VIA Mojang/NameMC...
                    </span>
                  )}
                  {newSkinFetchStatus === 'success' && (
                    <span className="text-[8px] font-mono text-[#39FF14] flex items-center gap-1">
                      ✓ Premium skin files synced!
                    </span>
                  )}
                  {newSkinFetchStatus === 'error' && (
                    <span className="text-[8px] font-mono text-amber-500 flex items-center gap-1">
                      ⚠ Premium account not found on Mojang/NameMC.
                    </span>
                  )}
                </div>

                <div className="col-span-12 md:col-span-4 space-y-1.5">
                  <label htmlFor="new-player-elo" className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Auto-Calculated Total Points (0-100)</label>
                  <input
                    id="new-player-elo"
                    type="number"
                    disabled
                    value={newPoints}
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-[#39FF14] font-mono opacity-85 outline-none cursor-not-allowed"
                  />
                  <span className="text-[8.5px] font-mono text-zinc-500 block uppercase">
                    Average of chosen game mode tiers
                  </span>
                </div>

                {/* Game Mode Tiers Grid Selector */}
                <div className="col-span-12 p-4 bg-zinc-900/30 border border-zinc-850 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <span className="text-[9.5px] font-mono text-[#39FF14] uppercase tracking-widest font-bold">
                      ⚔️ Evaluate Tiers in Game Modes
                    </span>
                    <span className="text-[8.5px] font-mono text-zinc-400">Specify rank for each mode to auto-calculate points</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Sword', 'Axe', 'NethPot', 'Mace', 'OP Mace', 'Cart', 'CPvP', 'UHC'].map(mode => (
                      <div key={mode} className="flex flex-col space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                          ⚔️ {mode}
                        </label>
                        <select
                          value={newModeTiers[mode] || 'LT5'}
                          onChange={e => {
                            setNewModeTiers(prev => ({
                              ...prev,
                              [mode]: e.target.value as RankTier
                            }));
                          }}
                          className={`w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:border-[#39FF14]/40 outline-none transition cursor-pointer ${getTierColorClass(newModeTiers[mode] || 'LT5')}`}
                          style={{ color: getTierHexColor(newModeTiers[mode] || 'LT5') }}
                        >
                          <option value="HT1" style={{ color: getTierHexColor('HT1') }} className="bg-zinc-950 font-bold">HT1 (High Tier 1)</option>
                          <option value="LT1" style={{ color: getTierHexColor('LT1') }} className="bg-zinc-950 font-bold">LT1 (Low Tier 1)</option>
                          <option value="HT2" style={{ color: getTierHexColor('HT2') }} className="bg-zinc-950 font-bold">HT2 (High Tier 2)</option>
                          <option value="LT2" style={{ color: getTierHexColor('LT2') }} className="bg-zinc-950 font-bold">LT2 (Low Tier 2)</option>
                          <option value="HT3" style={{ color: getTierHexColor('HT3') }} className="bg-zinc-950">HT3 (High Tier 3)</option>
                          <option value="LT3" style={{ color: getTierHexColor('LT3') }} className="bg-zinc-950">LT3 (Low Tier 3)</option>
                          <option value="HT4" style={{ color: getTierHexColor('HT4') }} className="bg-zinc-950">HT4 (High Tier 4)</option>
                          <option value="LT4" style={{ color: getTierHexColor('LT4') }} className="bg-zinc-950">LT4 (Low Tier 4)</option>
                          <option value="HT5" style={{ color: getTierHexColor('HT5') }} className="bg-zinc-950">HT5 (High Tier 5)</option>
                          <option value="LT5" style={{ color: getTierHexColor('LT5') }} className="bg-zinc-950">LT5 (Low Tier 5)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
                  {/* Admin Staff Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-855 rounded-xl">
                    <div className="text-left">
                      <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-bold leading-none">
                        Admin / Staff Privileges
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block mt-1.5 leading-tight">
                        Grant administrative dashboard access
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewIsAdmin(!newIsAdmin)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        newIsAdmin ? 'bg-[#39FF14]' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                          newIsAdmin ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Unoriginal Account Toggle Lever */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-855 rounded-xl">
                    <div className="text-left">
                      <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-bold leading-none">
                        Unoriginal Account (Offline)
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block mt-1.5 leading-tight">
                        By-pass Mojang directory validation
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewIsUnoriginal(!newIsUnoriginal)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        newIsUnoriginal ? 'bg-[#39FF14]' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                          newIsUnoriginal ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Unoriginal Accounts Skin Fields */}
                <div className="col-span-12 p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-850 pb-2">
                    <span className="text-[10px] font-mono text-[#39FF14] uppercase tracking-widest font-black flex items-center gap-1.5">
                      👤 UNORIGINAL MINECRAFT USER SKINS {newIsUnoriginal ? '(REQUIRED)' : '(OPTIONAL)'}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">Drag & drop or select your custom skin image</span>
                  </div>

                  {/* SINGLE UNIFIED DRAG-AND-DROP WORKFLOW */}
                  <div className="space-y-2 text-left">
                    <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider block font-bold">
                      Drop or Choose Minecraft Skin Asset (Image or Render)
                    </span>
                    
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileChange(e.dataTransfer.files[0], 'raw_skin', false);
                        }
                      }}
                      className="border-2 border-dashed border-zinc-850 rounded-xl p-6 bg-zinc-950/90 text-center relative flex flex-col items-center justify-center hover:border-[#39FF14]/30 transition group min-h-[120px]"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0], 'raw_skin', false);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {newCustomAvatarUrl || newCustomBodyUrl ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-20 p-2">
                          <img 
                            src={newCustomAvatarUrl || newCustomBodyUrl} 
                            className="w-14 h-14 rounded-xl object-contain bg-zinc-900 border border-zinc-800 p-1" 
                            alt="Skin Avatar" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="text-center sm:text-left font-mono">
                            <span className="text-[10px] text-[#39FF14] block font-bold uppercase tracking-wider">Custom Skin Loaded!</span>
                            <span className="text-[8px] text-zinc-500 block mt-0.5 max-w-[200px] truncate">Used for both leaderboards and profile displays</span>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setNewCustomAvatarUrl('');
                                setNewCustomBodyUrl('');
                              }}
                              className="text-[9px] text-red-400 hover:text-red-300 underline font-bold mt-2 inline-block cursor-pointer"
                            >
                              Reset / Upload New Skin
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-center text-zinc-650 group-hover:text-zinc-400 transition-colors">
                            <Upload className="w-6 h-6 animate-pulse" />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-350">
                            <span className="text-[#39FF14] font-bold">Drop Minecraft Skin file (.png)</span> or browse files
                          </p>
                          <span className="text-[8px] font-mono text-zinc-600 block">Supports direct skin files, renders, or face templates</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {addFormError && (
                  <div className="col-span-12 text-xs font-mono text-red-400 uppercase">
                    ⚠️ {addFormError}
                  </div>
                )}

                <div className="col-span-12 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#39FF14] hover:bg-[#34e012] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    ADD TO LIVE RECORDS
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT COMPETITOR PROFILE FORM BLOCK */}
          {editingPlayer && (
            <div className="p-6 bg-zinc-950/80 border border-amber-500/30 rounded-2xl space-y-4 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-sans font-black text-white uppercase flex items-center gap-2">
                  <span className="text-amber-500">⚙</span> Edit Competitor Dossier: {editingPlayer.username}
                </h3>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-mono font-bold uppercase transition cursor-pointer"
                >
                  Cancel X
                </button>
              </div>

              <form onSubmit={handleSaveEditedPlayer} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4 space-y-1.5 flex flex-col justify-start">
                  <label htmlFor="edit-player-uname" className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Username (Minecraft Name)*</label>
                  <input
                    id="edit-player-uname"
                    type="text"
                    required
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500/40 outline-none transition"
                  />
                  {editSkinFetchStatus === 'loading' && (
                    <span className="text-[8px] font-mono text-zinc-400 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-500" />
                      SYNCING SKIN VIA Mojang/NameMC...
                    </span>
                  )}
                  {editSkinFetchStatus === 'success' && (
                    <span className="text-[8px] font-mono text-amber-500 flex items-center gap-1">
                      ✓ Premium skin files synced!
                    </span>
                  )}
                  {editSkinFetchStatus === 'error' && (
                    <span className="text-[8px] font-mono text-amber-500 flex items-center gap-1">
                      ⚠ Premium account not found on Mojang/NameMC.
                    </span>
                  )}
                </div>

                <div className="col-span-12 md:col-span-3 space-y-1.5">
                  <label htmlFor="edit-player-elo" className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Auto-Calculated Total Points (0-100)</label>
                  <input
                    id="edit-player-elo"
                    type="number"
                    disabled
                    value={editPoints}
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-[#39FF14] font-mono opacity-85 outline-none cursor-not-allowed"
                  />
                  <span className="text-[8.5px] font-mono text-zinc-500 block uppercase">
                    Average of chosen game mode tiers
                  </span>
                </div>

                {/* Edit Game Mode Tiers Grid Selector */}
                <div className="col-span-12 p-4 bg-zinc-900/30 border border-zinc-850 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <span className="text-[9.5px] font-mono text-amber-500 uppercase tracking-widest font-bold">
                      ⚔️ Evaluate Tiers in Game Modes
                    </span>
                    <span className="text-[8.5px] font-mono text-zinc-400">Specify rank for each mode to auto-calculate points</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Sword', 'Axe', 'NethPot', 'Mace', 'OP Mace', 'Cart', 'CPvP', 'UHC'].map(mode => (
                      <div key={mode} className="flex flex-col space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                          ⚔️ {mode}
                        </label>
                        <select
                          value={editModeTiers[mode] || 'LT5'}
                          onChange={e => {
                            setEditModeTiers(prev => ({
                              ...prev,
                              [mode]: e.target.value as RankTier
                            }));
                          }}
                          className={`w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:border-amber-550/40 outline-none transition cursor-pointer ${getTierColorClass(editModeTiers[mode] || 'LT5')}`}
                          style={{ color: getTierHexColor(editModeTiers[mode] || 'LT5') }}
                        >
                          <option value="HT1" style={{ color: getTierHexColor('HT1') }} className="bg-zinc-950 font-bold">HT1 (High Tier 1)</option>
                          <option value="LT1" style={{ color: getTierHexColor('LT1') }} className="bg-zinc-950 font-bold">LT1 (Low Tier 1)</option>
                          <option value="HT2" style={{ color: getTierHexColor('HT2') }} className="bg-zinc-950 font-bold">HT2 (High Tier 2)</option>
                          <option value="LT2" style={{ color: getTierHexColor('LT2') }} className="bg-zinc-950 font-bold">LT2 (Low Tier 2)</option>
                          <option value="HT3" style={{ color: getTierHexColor('HT3') }} className="bg-zinc-950">HT3 (High Tier 3)</option>
                          <option value="LT3" style={{ color: getTierHexColor('LT3') }} className="bg-zinc-950">LT3 (Low Tier 3)</option>
                          <option value="HT4" style={{ color: getTierHexColor('HT4') }} className="bg-zinc-950">HT4 (High Tier 4)</option>
                          <option value="LT4" style={{ color: getTierHexColor('LT4') }} className="bg-zinc-950">LT4 (Low Tier 4)</option>
                          <option value="HT5" style={{ color: getTierHexColor('HT5') }} className="bg-zinc-950">HT5 (High Tier 5)</option>
                          <option value="LT5" style={{ color: getTierHexColor('LT5') }} className="bg-zinc-950">LT5 (Low Tier 5)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 py-1">
                  {/* Admin Staff Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/20 border border-zinc-900 rounded-xl">
                    <div className="text-left">
                      <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-bold leading-none">
                        Admin / Staff Privileges
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block mt-1.5 leading-tight">
                        Grant administrative dashboard access
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsAdmin(!editIsAdmin)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        editIsAdmin ? 'bg-amber-500 shadow-sm shadow-amber-500/20' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editIsAdmin ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Unoriginal Account Toggle Lever */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/20 border border-zinc-900 rounded-xl">
                    <div className="text-left">
                      <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-bold leading-none">
                        Unoriginal Account (Offline)
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block mt-1.5 leading-tight">
                        By-pass Mojang directory validation
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsUnoriginal(!editIsUnoriginal)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        editIsUnoriginal ? 'bg-amber-500 shadow-sm shadow-amber-500/20' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editIsUnoriginal ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Tester status Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/20 border border-zinc-900 rounded-xl">
                    <div className="text-left">
                      <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-bold leading-none">
                        Certified Tester / Evaluator
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block mt-1.5 leading-tight">
                        Flag as a registered tester on the system
                      </span>
                    </div>
                    <button
                      type="button"
                      id="edit-tester-btn"
                      onClick={() => setEditIsTester(!editIsTester)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        editIsTester ? 'bg-amber-500 shadow-sm shadow-amber-500/20' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editIsTester ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Unoriginal Accounts Skin Fields */}
                <div className="col-span-12 p-4 bg-zinc-900/40 border border-zinc-855 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-850 pb-2">
                    <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                      👤 UNORIGINAL MINECRAFT USER SKINS {editIsUnoriginal ? '(REQUIRED)' : '(OPTIONAL)'}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">Drag & drop or select your custom skin image</span>
                  </div>

                  {/* SINGLE UNIFIED DRAG-AND-DROP WORKFLOW */}
                  <div className="space-y-2 text-left">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">
                      Drop or Choose Minecraft Skin Asset (Image or Render)
                    </span>
                    
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileChange(e.dataTransfer.files[0], 'raw_skin', true);
                        }
                      }}
                      className="border-2 border-dashed border-zinc-850 rounded-xl p-6 bg-zinc-950/90 text-center relative flex flex-col items-center justify-center hover:border-amber-500/30 transition group min-h-[120px]"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0], 'raw_skin', true);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {editCustomAvatarUrl || editCustomBodyUrl ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-20 p-2">
                          <img 
                            src={editCustomAvatarUrl || editCustomBodyUrl} 
                            className="w-14 h-14 rounded-xl object-contain bg-zinc-900 border border-zinc-800 p-1" 
                            alt="Skin Avatar" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="text-center sm:text-left font-mono">
                            <span className="text-[10px] text-amber-500 block font-bold uppercase tracking-wider">Custom Skin Loaded!</span>
                            <span className="text-[8px] text-zinc-500 block mt-0.5 max-w-[200px] truncate">Used for both leaderboards and profile displays</span>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setEditCustomAvatarUrl('');
                                setEditCustomBodyUrl('');
                              }}
                              className="text-[9px] text-red-400 hover:text-red-300 underline font-bold mt-2 inline-block cursor-pointer"
                            >
                              Reset / Upload New Skin
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-center text-zinc-650 group-hover:text-zinc-350 transition-colors">
                            <Upload className="w-6 h-6 animate-pulse" />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-350">
                            <span className="text-amber-500 font-bold">Drop Minecraft Skin file (.png)</span> or browse files
                          </p>
                          <span className="text-[8px] font-mono text-zinc-600 block">Supports direct skin files, renders, or face templates</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {editFormError && (
                  <div className="col-span-12 text-xs font-mono text-red-500 uppercase">
                    ⚠️ {editFormError}
                  </div>
                )}

                <div className="col-span-12 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    SAVE PROFILE DOSSIER
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-zinc-900/60 bg-[#0e1017] text-zinc-500 font-mono font-bold uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Competitor info</th>
                    <th className="py-3 px-4">Current Elo Rating</th>
                    <th className="py-3 px-4">Rank Number</th>
                    <th className="py-3 px-4 text-center">Security Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono text-xs uppercase">
                        No competitors matched "{adminSearchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((p) => {
                    const isEditing = editingPlayerUsername === p.username;
                    const rankNumber = sortedPlayersForRanking.findIndex(x => x.username === p.username) + 1;
                    return (
                      <tr key={p.username} className="hover:bg-zinc-900/10">
                        {/* 1 */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getCorrectAvatar(p, 32)}
                              alt={p.username}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded shrink-0 object-contain bg-zinc-900 pointer-events-none select-none"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 leading-none">
                                <span className="font-bold text-white text-sm leading-none">{p.username}</span>
                                {p.isUnoriginal && (
                                  <span className="text-[7.5px] font-mono font-black text-zinc-400 bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded leading-none uppercase tracking-wider">
                                    OFFLINE
                                  </span>
                                )}
                                {p.isAdmin && (
                                  <span className="text-[8px] font-mono font-black text-[#ffab00] bg-amber-950/50 border border-[#ffab00]/30 px-1.5 py-0.5 rounded leading-none uppercase tracking-wider">
                                    ADMIN
                                  </span>
                                )}
                                {p.isTester && (
                                  <span className="text-[8px] font-mono font-black text-red-500 bg-red-950/50 border border-red-500/30 px-1.5 py-0.5 rounded leading-none uppercase tracking-wider">
                                    TESTER
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2 */}
                        <td className="py-3 px-4 font-mono text-sm font-semibold">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`elo-input-${p.username}`}
                                type="number"
                                value={eloValueInput}
                                onChange={(e) => setEloValueInput(Number(e.target.value))}
                                className="w-14 bg-zinc-950 border border-zinc-800 rounded p-1 text-white text-xs outline-none"
                                min={0}
                                max={100}
                              />
                              <button
                                id={`confirm-elo-${p.username}`}
                                onClick={() => commitTuning(p.username)}
                                className="bg-green-600 text-white p-1 rounded hover:bg-green-500 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-white">{p.overallPoints} PTS</span>
                              <button
                                id={`edit-elo-${p.username}`}
                                onClick={() => startTuningElo(p.username, p.overallPoints)}
                                className="text-[10px] font-mono text-[#39FF14] hover:underline cursor-pointer"
                              >
                                [TUNE]
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 3 */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold select-none text-xs px-2.5 py-1 rounded-lg border bg-zinc-950/60"
                                style={{
                                  borderColor: `${getTierHexColor(p.overallRank)}40`,
                                  color: getTierHexColor(p.overallRank)
                                }}>
                            #{rankNumber}
                          </span>
                        </td>

                        {/* 4 */}
                        <td className="py-3 px-4 text-center font-mono">
                          {p.isBanned ? (
                            <span className="inline-block px-2 py-1 rounded text-[10px] font-bold text-red-400 bg-red-950/25 border border-red-500/25 uppercase text-left min-w-[90px]">
                              <div className="flex items-center gap-1 justify-center">
                                <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
                                <span>BANNED</span>
                              </div>
                              {p.banExpiresAt ? (
                                <span className="block text-[8px] font-medium font-mono text-zinc-400 mt-1 text-center whitespace-nowrap">
                                  {(() => {
                                    const diffMs = new Date(p.banExpiresAt).getTime() - Date.now();
                                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                    return diffDays > 0 ? `${diffDays}d left` : 'Expired';
                                  })()}
                                </span>
                              ) : (
                                <span className="block text-[8px] font-medium font-mono text-zinc-500 mt-1 text-center">Permanent</span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-green-400 bg-green-950/25 border border-green-500/25 uppercase">
                              ACTIVE Verified
                            </span>
                          )}
                        </td>

                        {/* 5 */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditForm(p)}
                              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 text-amber-500 hover:text-amber-400 hover:bg-amber-500/5 hover:border-amber-500/20 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                            >
                              EDIT PROFILE
                            </button>
                            
                            {onToggleAdminStatus && (
                              <button
                                id={`admin-toggle-${p.username}`}
                                onClick={() => onToggleAdminStatus(p.username, !p.isAdmin)}
                                className={`px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                                  p.isAdmin
                                    ? 'bg-amber-950/40 text-[#ffab00] border border-[#ffab00]/25 hover:bg-[#ffab00]/25'
                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white'
                                }`}
                              >
                                {p.isAdmin ? 'REVOKE STAFF' : 'GRANT STAFF'}
                              </button>
                            )}
                            {banningPlayerUsername === p.username ? (
                              <div className="flex items-center gap-1 bg-red-950/20 border border-red-500/30 p-1 rounded-lg">
                                <select
                                  value={banDurationDays}
                                  onChange={(e) => setBanDurationDays(Number(e.target.value))}
                                  className="bg-black text-[10px] text-red-400 border border-red-950/40 px-1 py-1 rounded font-mono font-bold outline-none uppercase"
                                >
                                  <option value={1} className="bg-zinc-950">1 Day</option>
                                  <option value={7} className="bg-zinc-950">7 Days</option>
                                  <option value={30} className="bg-zinc-950">30 Days</option>
                                  <option value={90} className="bg-zinc-950">90 Days</option>
                                  <option value={365} className="bg-zinc-950">1 Year</option>
                                  <option value={0} className="bg-zinc-950">Permanent</option>
                                </select>
                                <button
                                  onClick={() => {
                                    onModifyBlockStatus(p.username, true, banDurationDays);
                                    setBanningPlayerUsername(null);
                                  }}
                                  className="px-2 py-1 bg-red-500 hover:bg-red-400 text-black font-mono text-[9px] font-bold uppercase rounded cursor-pointer transition-colors"
                                >
                                  BAN
                                </button>
                                <button
                                  onClick={() => setBanningPlayerUsername(null)}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono text-[9px] font-bold uppercase rounded cursor-pointer transition-colors"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                id={`ban-toggle-${p.username}`}
                                onClick={() => {
                                  if (p.isBanned) {
                                    onModifyBlockStatus(p.username, false);
                                  } else {
                                    setBanningPlayerUsername(p.username);
                                    setBanDurationDays(30);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                                  p.isBanned
                                    ? 'bg-green-950/30 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                                    : 'bg-red-950/30 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                                }`}
                              >
                                {p.isBanned ? 'Quash ban' : 'QUARANTINE'}
                              </button>
                            )}
                            {onDeletePlayer && (
                              <>
                                {deletingPlayerUsername === p.username ? (
                                  <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/40 p-1 rounded-lg">
                                    <span className="text-[9px] font-mono text-red-400 font-bold uppercase tracking-tight">DEL?</span>
                                    <button
                                      onClick={() => {
                                        onDeletePlayer(p.username);
                                        setDeletingPlayerUsername(null);
                                      }}
                                      className="px-2 py-1 bg-red-500 hover:bg-red-400 text-black font-mono text-[9px] font-bold uppercase rounded cursor-pointer transition-colors"
                                    >
                                      YES
                                    </button>
                                    <button
                                      onClick={() => setDeletingPlayerUsername(null)}
                                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 font-mono text-[9px] font-bold uppercase rounded cursor-pointer transition-colors"
                                    >
                                      NO
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingPlayerUsername(p.username)}
                                    className="p-1.5 rounded-lg bg-red-950/20 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                                    title="DELETE PLAYER PERMANENTLY"
                                  >
                                    <Trash className="w-3.5 h-3.5" strokeWidth={2.5} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Quick numbers widget */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-950/50 p-4 border border-zinc-900 rounded-xl font-mono text-left">
              <span className="text-zinc-500 text-xs block uppercase">TOTAL ACCOUNTS</span>
              <span className="text-2xl font-bold text-white mt-1.5 block">{totalUsers}</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider block mt-1">active registry items</span>
            </div>
            
            <div className="bg-zinc-950/50 p-4 border border-zinc-900 rounded-xl font-mono text-left">
              <span className="text-zinc-500 text-xs block uppercase">Avg performance rating</span>
              <span className="text-2xl font-bold text-[#39FF14] mt-1.5 block">{averageElo} PTS</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider block mt-1">mid-tier HT4 bracket</span>
            </div>

            <div className="bg-zinc-950/50 p-4 border border-zinc-900 rounded-xl font-mono text-left">
              <span className="text-zinc-500 text-xs block uppercase">Elite HT1 Legends</span>
              <span className="text-2xl font-bold text-yellow-400 mt-1.5 block">{ht1Count}</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider block mt-1">Top 90+ ELO marksmen</span>
            </div>

            <div className="bg-zinc-950/50 p-4 border border-zinc-900 rounded-xl font-mono text-left">
              <span className="text-zinc-500 text-xs block uppercase">Active quarantines</span>
              <span className="text-2xl font-bold text-red-400 mt-1.5 block">{bannedCount}</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider block mt-1">Banned security matches</span>
            </div>
          </div>

          {/* Simple ASCII bar representation showcasing bracket weights */}
          <div className="bg-[#0e1017] rounded-xl border border-zinc-900 p-5 space-y-4">
            <h4 className="text-sm font-sans font-bold text-white uppercase flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-zinc-500" />
              Competitor Tier Weight Ratios
            </h4>

            <div className="space-y-3 font-mono text-[11px]">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1 leading-none uppercase">
                  <span>Elite Tiers (HT1 / LT1 / HT2)</span>
                  <span className="text-[#39FF14] font-bold">
                    {players.filter(p => p.overallRank === 'HT1' || p.overallRank === 'LT1' || p.overallRank === 'HT2').length} players
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-2.5 rounded-full border border-zinc-900 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(players.filter(p => p.overallRank === 'HT1' || p.overallRank === 'LT1' || p.overallRank === 'HT2').length / (totalUsers || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1 leading-none uppercase">
                  <span>Mid Level Combatants (LT2 / HT3 / LT3 / HT4)</span>
                  <span className="text-zinc-200 font-bold">
                    {players.filter(p => p.overallRank === 'LT2' || p.overallRank === 'HT3' || p.overallRank === 'LT3' || p.overallRank === 'HT4').length} players
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-2.5 rounded-full border border-zinc-900 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${(players.filter(p => p.overallRank === 'LT2' || p.overallRank === 'HT3' || p.overallRank === 'LT3' || p.overallRank === 'HT4').length / (totalUsers || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1 leading-none uppercase">
                  <span>Starter Recruits (LT4 / HT5 / LT5)</span>
                  <span className="text-zinc-500 font-bold">
                    {players.filter(p => p.overallRank === 'LT4' || p.overallRank === 'HT5' || p.overallRank === 'LT5').length} players
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-2.5 rounded-full border border-zinc-900 overflow-hidden">
                  <div className="bg-zinc-650 h-full" style={{ width: `${(players.filter(p => p.overallRank === 'LT4' || p.overallRank === 'HT5' || p.overallRank === 'LT5').length / (totalUsers || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
