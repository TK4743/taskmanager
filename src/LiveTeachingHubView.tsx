import React from 'react';
import {
  Mic,
  Laptop,
  MessageSquare,
  Bot,
  ExternalLink,
  Radio,
  Sparkles,
  ArrowRight,
  Headphones,
  Eye,
  Code2,
  Users,
  Bus,
  CheckCircle2
} from 'lucide-react';
import { GOAT_CE_URL } from './config';

interface LiveTeachingHubViewProps {
  user?: any;
  token?: string | null;
  addToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const LiveTeachingHubView: React.FC<LiveTeachingHubViewProps> = () => {
  const handleOpenGoatCE = () => {
    window.open(GOAT_CE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#F5F5F4]">
      <div className="w-full space-y-6 pb-12">
        
        {/* ── Page Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                  <Radio size={22} className="animate-pulse" />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Live Teaching Hub
                </h1>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 text-amber-900 border border-amber-300 shadow-2xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                SIH DEMO PURPOSE ONLY
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">
              Peer-to-peer real-time collaborative coding, live voice mentorship, and interactive learning.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenGoatCE}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer group"
            >
              <span>🚀 Enter Live Teaching Hub</span>
              <ExternalLink size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* ── Hero Headline Banner ────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-zinc-200/80 p-5 md:p-7 shadow-xs space-y-4">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold rounded-full uppercase tracking-wider">
              <Sparkles size={12} className="text-indigo-600" /> Peer-to-Peer Learning Environment
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 leading-tight">
              Learn. Teach. Code Together.
            </h2>
            
            <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-normal">
              Connect with your peers, teach concepts through voice, and write code together in real time — from anywhere.
            </p>

            <div className="pt-1.5">
              <button
                onClick={handleOpenGoatCE}
                className="py-2.5 px-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>🚀 Enter Live Teaching Hub</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. Feature Cards (4 Attractive Cards) ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1 */}
          <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Mic size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">🎙️ Voice Teaching</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Teach or learn through real-time voice communication.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-purple-200 transition-all space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
              <Laptop size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">💻 Live Collaborative Coding</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Write and explain code together while both students see changes instantly.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">💬 Real-Time Chat</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Ask questions, discuss concepts and share files during the learning session.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-amber-200 transition-all space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">🤖 AI Coding Assistant</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Get instant coding explanations, debugging help and assistance when needed.
              </p>
            </div>
          </div>

        </div>

        {/* ── 4. Travel-Learning Focus Section ─────────────────────────────────── */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 p-6 md:p-8 text-white shadow-lg space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-indigo-300">
              <Bus size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white">
                Learn While You Travel 🚍
              </h3>
              <p className="text-xs md:text-sm text-indigo-200 font-medium mt-0.5">
                Turn your travel time into learning time.
              </p>
            </div>
          </div>

          <div className="text-xs md:text-sm text-zinc-300">
            Students can join a peer learning session while travelling and:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-colors">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Headphones size={18} />
              </div>
              <span className="text-xs md:text-sm font-semibold text-zinc-100">
                🎧 Listen to a peer teaching
              </span>
            </div>

            <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-colors">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Mic size={18} />
              </div>
              <span className="text-xs md:text-sm font-semibold text-zinc-100">
                🎙️ Discuss concepts through voice
              </span>
            </div>

            <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-colors">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Eye size={18} />
              </div>
              <span className="text-xs md:text-sm font-semibold text-zinc-100">
                👀 Follow code changes live
              </span>
            </div>

            <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-colors">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Code2 size={18} />
              </div>
              <span className="text-xs md:text-sm font-semibold text-zinc-100">
                💻 Practice collaboratively
              </span>
            </div>

            <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-colors sm:col-span-2 lg:col-span-1">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <MessageSquare size={18} />
              </div>
              <span className="text-xs md:text-sm font-semibold text-zinc-100">
                💬 Ask questions in real time
              </span>
            </div>
          </div>
        </div>

        {/* ── 7. How It Works Section (3-Step Explanation) ────────────────────── */}
        <div className="p-6 md:p-8 bg-white border border-zinc-200 rounded-3xl shadow-sm space-y-6">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Simple 3-Step Process
            </span>
            <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight mt-1">
              How It Works
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl relative space-y-2.5">
              <div className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                01
              </div>
              <h4 className="text-base font-extrabold text-zinc-900">
                Find a Peer
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Connect with another student who wants to learn or teach.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl relative space-y-2.5">
              <div className="text-xs font-black text-purple-600 uppercase tracking-wider">
                02
              </div>
              <h4 className="text-base font-extrabold text-zinc-900">
                Start a Session
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Join a live learning room with voice and collaborative coding.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl relative space-y-2.5">
              <div className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                03
              </div>
              <h4 className="text-base font-extrabold text-zinc-900">
                Learn Together
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Teach, discuss, code and solve problems in real time.
              </p>
            </div>

          </div>

          {/* Final CTA Banner */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-900">Ready to start collaborative peer learning?</h4>
              <p className="text-xs text-zinc-500">Launch into your collaborative IDE room with real-time voice and Monaco editor.</p>
            </div>
            <button
              onClick={handleOpenGoatCE}
              className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs md:text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🚀 Enter Live Teaching Hub</span>
              <ExternalLink size={15} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LiveTeachingHubView;
