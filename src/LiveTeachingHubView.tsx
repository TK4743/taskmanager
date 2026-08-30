import React from 'react';
import {
  Mic,
  Code,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  Radio,
  Zap,
  Award,
  Play,
  Bot,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Users
} from 'lucide-react';

interface LiveTeachingHubViewProps {
  user?: any;
  token?: string | null;
  addToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const LiveTeachingHubView: React.FC<LiveTeachingHubViewProps> = () => {
  const GOAT_URL = 'https://goatcode-editor.onrender.com/';
  const GITHUB_URL = 'https://github.com/Tharun4743/GOAT-CE';

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white p-4 md:p-8 flex flex-col items-center justify-center overflow-y-auto">
      
      <div className="max-w-4xl w-full space-y-6">
        
        {/* Main Showcase Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950/80 to-zinc-950 border border-indigo-500/40 p-6 md:p-10 shadow-2xl space-y-6">
          
          {/* Background Ambient Glows */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Badges */}
          <div className="relative z-10 flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Award size={14} className="text-yellow-400" /> SIH 2026 • Problem SIH26044 Innovation
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Radio size={14} className="animate-pulse" /> 1-to-1 WebRTC Direct Voice Calling
            </span>
          </div>

          {/* Heading & Value Proposition */}
          <div className="relative z-10 space-y-3">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              ⚡ GOAT Code Editor (GOAT CE)
            </h1>
            <p className="text-base md:text-lg font-bold text-indigo-300">
              Live 1-to-1 Collaborative Code Mentorship & Voice Room
            </p>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Teaching and debugging code over normal phone calls is frustrating because you cannot see the remote cursor, line highlights, or live execution output. <strong>GOAT Code Editor</strong> bridges this by pairing <strong>crystal-clear WebRTC voice streaming</strong> (with Echo Cancellation) with <strong>multi-user Monaco code synchronization</strong>.
            </p>
          </div>

          {/* 4 Feature Highlights Pills */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-black/40 border border-zinc-800/90 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <Mic size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">1-to-1 Direct WebRTC Voice</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Full-duplex audio stream with hardware echo cancellation.</div>
              </div>
            </div>

            <div className="p-3.5 bg-black/40 border border-zinc-800/90 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Monaco Kernel (VS Code)</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Sub-pixel live cursor tracking & real-time OT code sync.</div>
              </div>
            </div>

            <div className="p-3.5 bg-black/40 border border-zinc-800/90 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Play size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">13+ Languages Runner</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Sandboxed Piston API execution with live stdout console.</div>
              </div>
            </div>

            <div className="p-3.5 bg-black/40 border border-zinc-800/90 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Bot size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">AI Assistant & Ephemeral Workspaces</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Llama 3.1 70B explanations & zero-leak auto-purged rooms.</div>
              </div>
            </div>
          </div>

          {/* Primary Launch Action Buttons */}
          <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={GOAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 py-4 px-8 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm md:text-base rounded-2xl shadow-xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span>Launch GOAT Code Editor Live</span>
              <ExternalLink size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-4 px-6 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Code size={18} />
              <span>GitHub Repository</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LiveTeachingHubView;
