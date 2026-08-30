import React from 'react';
import {
  Mic,
  Code,
  ExternalLink,
  Layers,
  ArrowRight,
  Radio,
  Award,
  Play,
  Bot,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  ShieldCheck
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
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#F5F5F4]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                <Radio size={22} className="animate-pulse" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Live Teaching Hub
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/15 text-indigo-900 border border-indigo-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                SIH 2026 DEMO INNOVATION
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">
              Real-time 1-to-1 peer mentorship & code collaboration powered by GOAT Code Editor (GOAT CE)
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={GOAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <span>Open GOAT CE</span>
              <ExternalLink size={15} />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 text-xs md:text-sm font-bold rounded-xl transition-all border border-zinc-300 shadow-2xs flex items-center gap-2"
            >
              <Code size={15} />
              <span>GitHub Repo</span>
            </a>
          </div>
        </div>

        {/* ── Main Light Showcase Card ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-zinc-200/80 p-6 md:p-10 shadow-lg space-y-6">
          
          {/* Subtle Corner Ambient Decorators */}
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-purple-50 rounded-full blur-3xl pointer-events-none" />

          {/* Badges */}
          <div className="relative z-10 flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Award size={14} className="text-amber-600" /> SIH 2026 • Problem Statement SIH26044
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Radio size={14} className="text-emerald-600 animate-pulse" /> 1-to-1 WebRTC Direct Voice Calling
            </span>
          </div>

          {/* Value Proposition */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 leading-tight">
              Peer Coding & Mentorship Without Phone Call Confusion
            </h2>
            <p className="text-sm md:text-base font-bold text-indigo-600">
              Integrated 1-to-1 WebRTC Voice Stream + Real-Time Monaco Code Synchronization
            </p>
            <p className="text-xs md:text-sm text-zinc-600 leading-relaxed max-w-3xl">
              Explaining algorithms and debugging code over traditional phone calls is frustrating because peers cannot see live remote cursors, active text selections, or execution outputs. <strong>GOAT Code Editor</strong> bridges this gap by unifying <strong>full-duplex WebRTC browser voice calling</strong> (with Echo Cancellation) with <strong>multi-user Monaco code synchronization</strong> and instant sandboxed execution.
            </p>
          </div>

          {/* 4 Feature Highlights Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            
            <div className="p-4 bg-zinc-50 hover:bg-indigo-50/40 border border-zinc-200 rounded-2xl flex items-start gap-3.5 transition-colors">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 shrink-0 shadow-2xs">
                <Mic size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900">1-to-1 Direct WebRTC Voice</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Full-duplex browser audio stream with hardware Acoustic Echo Cancellation (AEC) and noise suppression.
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 hover:bg-purple-50/40 border border-zinc-200 rounded-2xl flex items-start gap-3.5 transition-colors">
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 shrink-0 shadow-2xs">
                <Layers size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900">Monaco Kernel (VS Code)</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Sub-pixel live cursor tracking, colored developer badges, and operational transformation code sync.
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 hover:bg-emerald-50/40 border border-zinc-200 rounded-2xl flex items-start gap-3.5 transition-colors">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 shrink-0 shadow-2xs">
                <Play size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900">13+ Language Sandboxed Runner</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Instant server-side execution via Piston API v2 for Python, C++, Java, JS/TS, Go, and Rust.
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 hover:bg-amber-50/40 border border-zinc-200 rounded-2xl flex items-start gap-3.5 transition-colors">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 shrink-0 shadow-2xs">
                <Bot size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900">AI Assistant & Ephemeral Rooms</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Llama 3.1 70B AI explanations with auto-purged memory buffers when participants exit.
                </div>
              </div>
            </div>

          </div>

          {/* Action Launch Bar */}
          <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={GOAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 py-4 px-8 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm md:text-base rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span>Launch GOAT Code Editor Live Demo</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-4 px-6 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-300 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-2xs"
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
