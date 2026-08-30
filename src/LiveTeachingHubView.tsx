import React, { useState } from 'react';
import {
  Mic,
  Code,
  Sparkles,
  Play,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Radio,
  Zap,
  Award,
  RefreshCw,
  Bot,
  Shield,
  Users
} from 'lucide-react';

interface LiveTeachingHubViewProps {
  user: any;
  token: string | null;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const LiveTeachingHubView: React.FC<LiveTeachingHubViewProps> = ({
  addToast
}) => {
  const [roomId, setRoomId] = useState<string>(() => {
    return 'VSB-' + Math.floor(100000 + Math.random() * 900000);
  });
  const [joinRoomId, setJoinRoomId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generateNewRoomId = () => {
    const newId = 'VSB-' + Math.floor(100000 + Math.random() * 900000);
    setRoomId(newId);
    addToast(`Generated new Room ID: ${newId}`, 'info');
  };

  const copyRoomLink = () => {
    const shareableUrl = `https://goatcode-editor.onrender.com/#/room/${roomId}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    addToast('Room invite link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLaunchRoom = (targetId?: string) => {
    const finalRoom = (targetId || roomId).trim();
    if (!finalRoom) {
      addToast('Please provide a valid Room ID', 'warning');
      return;
    }
    const targetUrl = `https://goatcode-editor.onrender.com/#/room/${encodeURIComponent(finalRoom)}`;
    addToast(`Redirecting to GOAT Code Editor Room ${finalRoom}...`, 'success');
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleJoinExistingRoom = () => {
    if (!joinRoomId.trim()) {
      addToast('Please enter a Room ID to join', 'warning');
      return;
    }
    handleLaunchRoom(joinRoomId.trim());
  };

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white p-4 md:p-8 space-y-6 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <Zap size={11} /> SIH 2026 Problem SIH26044
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <Radio size={11} className="animate-pulse" /> WebRTC Voice & Live Code
            </span>
          </div>
          <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>⚡ Live Teaching Hub</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white">
              GOAT CE
            </span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Real-time peer pair programming with 1-to-1 WebRTC voice calling, Monaco editor sync, and sandboxed code execution.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://goatcode-editor.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <span>Launch Standalone</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="https://github.com/Tharun4743/GOAT-CE"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all border border-zinc-700 flex items-center gap-1.5"
          >
            <Code size={14} />
            <span>GitHub</span>
          </a>
        </div>
      </div>

      {/* Main SIH 2026 Demo & Room Launcher Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/90 via-purple-950/70 to-zinc-900 border border-indigo-500/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-7 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold text-indigo-300 border border-white/10">
              <Award size={14} className="text-yellow-400" />
              <span>Smart India Hackathon (SIH 2026) • Live Demonstration</span>
            </div>
            
            <h2 className="text-xl md:text-3xl font-black text-white leading-tight">
              Peer Coding & Voice Mentorship Without Phone Call Confusion
            </h2>
            
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              Explaining algorithms and syntax errors over standard phone calls is difficult. <strong>GOAT Code Editor</strong> eliminates this barrier with <strong>1-to-1 browser voice calling</strong> (with Echo Cancellation), <strong>synchronized Monaco live coding</strong>, instant multi-language execution via Piston, and auto-purge workspaces.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 bg-black/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Mic size={12} className="text-indigo-400" /> WebRTC Voice
              </span>
              <span className="px-2.5 py-1 bg-black/40 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Layers size={12} className="text-purple-400" /> Monaco Sync
              </span>
              <span className="px-2.5 py-1 bg-black/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Play size={12} className="text-emerald-400" /> 13+ Lang Runner
              </span>
              <span className="px-2.5 py-1 bg-black/40 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Bot size={12} className="text-amber-400" /> AI Copilot
              </span>
            </div>
          </div>

          {/* Quick Interactive Room Launch Box */}
          <div className="lg:col-span-5 bg-zinc-900/95 backdrop-blur-xl p-5 md:p-6 rounded-2xl border border-indigo-500/50 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Zap size={14} /> Instant Room Launcher
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Ready
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Room Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-black/70 border border-zinc-700 rounded-xl text-indigo-300 font-mono font-bold text-sm tracking-wider outline-none focus:border-indigo-500"
                />
                <button
                  onClick={generateNewRoomId}
                  title="Generate new Room ID"
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-zinc-700"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={copyRoomLink}
                  title="Copy Invite Link"
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-zinc-700"
                >
                  {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleLaunchRoom()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Launch & Enter Room</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[10px] font-bold text-zinc-400 mb-1">Join Existing Session:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. VSB-123456"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-black/60 border border-zinc-700 rounded-xl text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleJoinExistingRoom}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all border border-zinc-700"
                >
                  Join
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4 Crisp Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Mic size={18} />
          </div>
          <h3 className="text-sm font-black text-white">1-to-1 WebRTC Direct Voice</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Full-duplex browser audio with synthetic ringtones, active speaker VAD, and hardware Acoustic Echo Cancellation (AEC).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-purple-500/40 transition-all space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers size={18} />
          </div>
          <h3 className="text-sm font-black text-white">Monaco Kernel (VS Code)</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Sub-pixel live cursor calibration, unique developer badges, and operational transformation code synchronization.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/40 transition-all space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Play size={18} />
          </div>
          <h3 className="text-sm font-black text-white">13+ Language Runner</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Server-side sandboxed execution via Piston API v2 for Python, C++, Java, JS/TS, Go, and Rust with live stdout.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-amber-500/40 transition-all space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Shield size={18} />
          </div>
          <h3 className="text-sm font-black text-white">Ephemeral Workspaces</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Auto-purges in-memory buffers, chat messages, and audio streams when all participants leave the room.
          </p>
        </div>

      </div>

    </div>
  );
};

export default LiveTeachingHubView;
