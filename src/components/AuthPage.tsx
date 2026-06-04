import React, { useState } from 'react';
import { fetchMinecraftProfile, processMinecraftSkin } from '../utils/minecraft';
import { MinecraftPlayer } from '../types';
import { Shield, Sparkles, User, ArrowRight, Loader2, CheckCircle2, RefreshCw, Upload } from 'lucide-react';
import { MOCK_PLAYERS } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';
import { verifyWithSupabase } from '../utils/supabase';

interface AuthPageProps {
  onLoginSuccess: (username: string, uuid: string, customAvatarUrl?: string, customBodyUrl?: string, isUnoriginal?: boolean) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [isUnoriginal, setIsUnoriginal] = useState(false);
  const [uploadedSkin, setUploadedSkin] = useState<{ avatarUrl: string; bodyUrl: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [skinFileName, setSkinFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedProfile, setResolvedProfile] = useState<{ username: string; uuid: string; avatarUrl: string; bodyUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const handleSkinFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please provide a valid PNG image file.');
      return;
    }
    setSkinFileName(file.name);
    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        try {
          const processed = await processMinecraftSkin(result);
          setUploadedSkin(processed);
        } catch (err) {
          console.error(err);
          setErrorMessage('Could not render the Minecraft skin cuboids.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setErrorMessage('Failed to read skin file.');
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      setErrorMessage('Failed reading file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSkinFile(e.dataTransfer.files[0]);
    }
  };

  const handleMojangLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setVerificationError(null);
    setResolvedProfile(null);

    const term = usernameInput.trim();
    if (!term) {
      setErrorMessage('Please feed a valid competitor moniker.');
      return;
    }

    if (!verificationCode.trim()) {
      setVerificationError('Verification code is required to connect.');
      return;
    }

    setIsLoading(true);

    // Verify input username and code with Supabase
    const dbCheck = await verifyWithSupabase(term, verificationCode);
    if (!dbCheck.success) {
      setVerificationError(dbCheck.message || 'Verification database check failed.');
      setIsLoading(false);
      return;
    }

    // Capture simulated state warning if present
    if (dbCheck.isSimulated) {
      setVerificationError(dbCheck.message);
    }

    if (isUnoriginal) {
      setTimeout(() => {
        const fallbackSteveAvatar = 'https://mc-heads.net/avatar/dec23297-5654-41d0-8ac1-4f812ecf4e1d/64';
        const fallbackSteveBody = 'https://mc-heads.net/body/dec23297-5654-41d0-8ac1-4f812ecf4e1d/200';

        setResolvedProfile({
          username: term,
          uuid: `offline-${Math.random().toString(36).substring(2, 9)}`,
          avatarUrl: uploadedSkin?.avatarUrl || fallbackSteveAvatar,
          bodyUrl: uploadedSkin?.bodyUrl || fallbackSteveBody
        });
        setIsLoading(false);
      }, 400);
      return;
    }

    try {
      const parsed = await fetchMinecraftProfile(term);
      setResolvedProfile({
        username: parsed.username,
        uuid: parsed.uuid,
        avatarUrl: parsed.avatarUrl,
        bodyUrl: parsed.bodyUrl
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Connecting to Mojang directory failed. Check username tags.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndLog = async () => {
    if (!resolvedProfile) return;
    
    setIsLoading(true);
    setVerificationError(null);
    
    // Since we successfully verified the username and code with Supabase on the previous screen 
    // to retrieve the identity, we can directly create/log in the profile safely after a brief visual process.
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(resolvedProfile.username, resolvedProfile.uuid, resolvedProfile.avatarUrl, resolvedProfile.bodyUrl, isUnoriginal);
    }, 400);
  };

  // Quick alternative bypass for fast testing using famous PvP streamers
  const handleQuickBypassedAuth = (streamer: string) => {
    const matched = MOCK_PLAYERS.find(p => p.username.toLowerCase() === streamer.toLowerCase());
    if (matched) {
      onLoginSuccess(
        matched.username, 
        matched.uuid, 
        matched.customAvatarUrl || `https://mc-heads.net/avatar/${matched.uuid}/64`, 
        matched.customBodyUrl || `https://mc-heads.net/body/${matched.uuid}/200`,
        matched.isUnoriginal
      );
    } else {
      onLoginSuccess(
        streamer, 
        '8667ba71-b85a-4004-af54-457a9734eed7', 
        'https://mc-heads.net/avatar/dec23297-5654-41d0-8ac1-4f812ecf4e1d/64', 
        'https://mc-heads.net/body/dec23297-5654-41d0-8ac1-4f812ecf4e1d/200',
        true
      );
    }
  };

  return (
    <div id="auth-main-wrapper" className="max-w-md mx-auto py-8">
      {/* Visual Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/20 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#39FF14] uppercase">
          <Shield className="w-3.5 h-3.5" />
          sonictiers SECURE DIRECTORY
        </div>
        <h2 className="text-3xl font-sans font-black tracking-tight text-white uppercase">
          Connect Player Account
        </h2>
        <p className="text-sm font-sans text-zinc-500 leading-relaxed">
          Provide your Minecraft username to automatically load your personal skin layout and bootstrap competitive test ratings.
        </p>
      </div>

      <div className="bg-[#0b0c10]/45 border border-zinc-900 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#39FF14]/5 blur-2xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {!resolvedProfile ? (
            <motion.div
              key="auth-lookup-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <form onSubmit={handleMojangLookup} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="username-control" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Minecraft Username :
                  </label>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-650">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="username-control"
                      type="text"
                      placeholder="e.g. Swifter, Dream, Preston"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Verification Code Gate within Connect Player Account form */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="auth-verification-control" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Verification Code :
                  </label>
                  <div className="relative">
                    <input
                      id="auth-verification-control"
                      type="text"
                      maxLength={24}
                      placeholder="e.g. DS9K2M"
                      value={verificationCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); // alphanumeric only
                        setVerificationCode(val);
                        if (val.length >= 4) {
                          setVerificationError(null);
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm font-mono tracking-[0.25em] text-[#39FF14] placeholder-zinc-800 outline-none focus:border-zinc-700 transition-all font-bold"
                    />
                    {verificationCode.length >= 4 && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#39FF14] font-bold uppercase">
                        ✓ OK
                      </span>
                    )}
                  </div>
                  
                  <div className="text-[9px] font-mono text-zinc-550 leading-tight">
                    Enter the code you got from Discord
                  </div>

                  {verificationError && (
                    <div className="text-[10px] text-red-400 font-mono mt-0.5">
                      ⚠️ {verificationError}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2.5 py-1 px-1">
                  <input
                    id="unoriginal-checkbox"
                    type="checkbox"
                    checked={isUnoriginal}
                    onChange={(e) => setIsUnoriginal(e.target.checked)}
                    className="w-4 h-4 accent-[#39FF14] cursor-pointer mt-0.5"
                  />
                  <div className="text-left">
                    <label htmlFor="unoriginal-checkbox" className="text-[11px] font-mono text-zinc-300 hover:text-white uppercase font-bold select-none cursor-pointer">
                      This is an unoriginal account (Non-Premium / Offline)
                    </label>
                    <span className="text-[9px] font-mono text-zinc-550 block mt-0.5 leading-tight">
                      Check this to bypass official Mojang directory lockups and upload or drop your skin below.
                    </span>
                  </div>
                </div>

                {isUnoriginal && (
                  <div className="space-y-2 border border-zinc-900 bg-zinc-950/20 p-3 rounded-xl overflow-hidden text-left">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">
                      Drop Minecraft Skin:
                    </span>
                    
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('skin-file-input')?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                        dragActive 
                          ? 'border-[#39FF14] bg-[#39FF14]/5' 
                          : uploadedSkin 
                            ? 'border-emerald-500/50 bg-emerald-500/5' 
                            : 'border-zinc-800 bg-zinc-950/55 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        id="skin-file-input"
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSkinFile(e.target.files[0]);
                          }
                        }}
                      />
                      
                      {uploadedSkin ? (
                        <div className="flex flex-col items-center space-y-2.5">
                          <img 
                            src={uploadedSkin.avatarUrl} 
                            className="w-12 h-12 rounded bg-zinc-900 border border-emerald-500/20 shadow-lg object-contain" 
                            alt="Custom Skin" 
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[11px] font-mono text-emerald-400 font-bold max-w-[240px] truncate">
                            ✓ {skinFileName || "custom_skin.png"}
                          </p>
                          <span className="text-[9px] font-mono text-zinc-550 uppercase">
                            Skin loaded & rendered. Click to swap.
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2 py-3">
                          <Upload className="w-6 h-6 text-zinc-500 hover:text-zinc-400" />
                          <p className="text-[11px] font-mono text-zinc-400">
                            DRAG & DROP SKIN PNG, OR <span className="text-[#39FF14] underline font-bold">BROWSE</span>
                          </p>
                          <span className="text-[9px] font-mono text-zinc-550 uppercase">
                            Supports standard 64x64/64x32 layout formats
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-red-950/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-sans text-left leading-relaxed">
                    {errorMessage}
                  </div>
                )}

                <button
                  id="mojang-lookup-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#39FF14] disabled:bg-[#39FF14]/50 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#39FF14]/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isUnoriginal ? 'LOADING OFFLINE PROFILE...' : 'FETCHING SKIN FROM MOJANG...'}
                    </>
                  ) : (
                    <>
                      {isUnoriginal ? 'ESTABLISH OFFLINE PROFILE' : 'RESOLVE PROFILE OVERLAYS'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="auth-resolved-confirm"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="space-y-6 text-center"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-950/20 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] mb-3">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[11px] font-mono text-[#39FF14] tracking-widest uppercase block font-bold">
                  IDENTITY RETRIEVED SUCCESSFULLY
                </span>
              </div>

              {/* Resolved Card previews */}
              <div className="bg-zinc-950/60 rounded-2xl border border-zinc-900 p-5 flex flex-col items-center max-w-xs mx-auto">
                <div className="w-32 h-32 bg-[#0c0d12] border border-zinc-900 rounded-xl flex items-center justify-center overflow-hidden mb-3 shadow">
                  <img
                    src={resolvedProfile.bodyUrl}
                    alt={resolvedProfile.username}
                    referrerPolicy="no-referrer"
                    className="h-28 drop-shadow select-none pointer-events-none"
                  />
                </div>
                
                <h4 className="text-xl font-sans font-black text-white">
                  {resolvedProfile.username}
                </h4>
                
                <span className="font-mono text-[9px] text-zinc-500 break-all select-all block mt-1 uppercase">
                  UUID: {resolvedProfile.uuid}
                </span>
              </div>

              {/* Verification Code Status */}
              <div className="space-y-2 text-center max-w-xs mx-auto bg-[#39FF14]/5 border border-[#39FF14]/15 p-4 rounded-2xl shadow">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#39FF14] block">
                  ✓ VERIFICATION SECURED
                </span>
                <p className="text-sm font-mono text-zinc-300 font-extrabold tracking-wider bg-zinc-950/80 py-1.5 px-3 rounded-lg border border-zinc-900 inline-block">
                  CODE: {verificationCode.toUpperCase()}
                </p>
                <div className="text-[9.5px] font-mono text-zinc-500 leading-normal">
                  Your identity is verified. Ready to synchronize status matrices and establish competitor file.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="reset-lookup-btn"
                  onClick={() => {
                    setResolvedProfile(null);
                    setVerificationCode('');
                    setVerificationError(null);
                  }}
                  className="px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  title="Reset and start over"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                
                <button
                  id="confirm-creation-btn"
                  onClick={handleCreateAndLog}
                  disabled={isLoading}
                  className="flex-grow h-11 bg-[#39FF14] disabled:bg-[#39FF14]/50 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#39FF14]/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ESTABLISHING PROFILE...
                    </>
                  ) : (
                    <>
                      ESTABLISH COMPETITOR PROFILE
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
