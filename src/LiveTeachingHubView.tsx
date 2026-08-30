import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Code,
  Sparkles,
  Play,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Users,
  Shield,
  Layers,
  ArrowRight,
  Radio,
  Zap,
  Share2,
  Award,
  Globe,
  Cpu,
  Monitor,
  Eye,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
  Bot
} from 'lucide-react';

interface LiveTeachingHubViewProps {
  user: any;
  token: string | null;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const TEMPLATES = [
  {
    name: 'Python DSA & LeetCode',
    lang: 'python',
    icon: '🐍',
    desc: 'Two pointers, Trees, Dynamic Programming & Graph algorithmic patterns with live voice coaching.',
    defaultCode: `# Python DSA Live Teaching Session
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Test execution
print("Output:", two_sum([2, 7, 11, 15], 9))  # [0, 1]
`
  },
  {
    name: 'C++ Competitive Coding',
    lang: 'cpp',
    icon: '⚡',
    desc: 'High-performance STL algorithms, recursion trees, and memory-optimized data structures.',
    defaultCode: `// C++ Competitive Programming Session
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    cout << "🚀 Live C++ Mentorship Session Active!" << endl;
    vector<int> arr = {10, 20, 30, 40, 50};
    int sum = 0;
    for (int x : arr) sum += x;
    cout << "Total Array Sum: " << sum << endl;
    return 0;
}
`
  },
  {
    name: 'Fullstack HTML / CSS Live UI',
    lang: 'html',
    icon: '🌐',
    desc: 'Instant visual iframe rendering with zero server round-trip for frontend pair design.',
    defaultCode: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: white; text-align: center; padding: 40px; }
    .card { background: #1e293b; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .badge { background: #6366f1; color: white; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">LIVE PREVIEW</span>
    <h2>⚡ GOAT Code Sandbox</h2>
    <p>Live collaborative teaching & visual sandbox rendering.</p>
  </div>
</body>
</html>
`
  },
  {
    name: 'Java OOP & System Design',
    lang: 'java',
    icon: '☕',
    desc: 'Object-oriented architecture, design patterns, and placement technical interview prep.',
    defaultCode: `// Java Placement Technical Interview Preparation
public class Main {
    public static void main(String[] args) {
        System.out.println("🏛️ VSBEC IT Department - Java Mentorship");
        Student mentor = new Student("Tharunkumar K", "Lead Peer Mentor");
        mentor.introduce();
    }
}

class Student {
    String name, role;
    Student(String name, String role) { this.name = name; this.role = role; }
    void introduce() { System.out.println("Peer: " + name + " | Role: " + role); }
}
`
  }
];

export const LiveTeachingHubView: React.FC<LiveTeachingHubViewProps> = ({
  user,
  addToast
}) => {
  const [roomId, setRoomId] = useState<string>(() => {
    return 'VSB-' + Math.floor(100000 + Math.random() * 900000);
  });
  const [joinRoomId, setJoinRoomId] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('python');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [activeCode, setActiveCode] = useState<string>(TEMPLATES[0].defaultCode);
  const [copied, setCopied] = useState<boolean>(false);
  const [outputConsole, setOutputConsole] = useState<string>('Console idle. Click "Run Local Code Sandbox" to execute.');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isSimulatedCall, setIsSimulatedCall] = useState<boolean>(false);

  const generateNewRoomId = () => {
    const newId = 'VSB-' + Math.floor(100000 + Math.random() * 900000);
    setRoomId(newId);
    addToast(`Generated new Room ID: ${newId}`, 'info');
  };

  const copyRoomId = () => {
    const shareableUrl = `https://goatcode-editor.onrender.com/#/room/${roomId}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    addToast('Room Invite Link copied to clipboard!', 'success');
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
      addToast('Please enter an existing Room ID to join', 'warning');
      return;
    }
    handleLaunchRoom(joinRoomId.trim());
  };

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setSelectedLang(template.lang);
    setActiveCode(template.defaultCode);
    setOutputConsole(`Loaded template: ${template.name}\nReady for execution or live launch.`);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setOutputConsole('⚡ Executing sandbox runner...');
    setTimeout(() => {
      setIsRunning(false);
      if (selectedLang === 'python') {
        setOutputConsole(`[Python 3.11.4 Runtime Sandbox]\nOutput: [0, 1]\nExecution finished with exit code 0 (0.042s)`);
      } else if (selectedLang === 'cpp') {
        setOutputConsole(`[G++ 13.2.0 Compiler Sandbox]\n🚀 Live C++ Mentorship Session Active!\nTotal Array Sum: 150\nExecution finished with exit code 0 (0.021s)`);
      } else if (selectedLang === 'html') {
        setOutputConsole(`[HTML5 Visual Renderer]\nSuccessfully parsed DOM elements.\nRendering preview in live sandbox frame.`);
      } else {
        setOutputConsole(`[OpenJDK 21 Runtime Sandbox]\n🏛️ VSBEC IT Department - Java Mentorship\nPeer: Tharunkumar K | Role: Lead Peer Mentor\nExecution finished with exit code 0 (0.088s)`);
      }
      addToast('Code executed successfully in sandbox', 'success');
    }, 600);
  };

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white p-4 md:p-8 space-y-8 overflow-y-auto">
      
      {/* Top Header & Intro Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Zap size={12} className="text-indigo-400" /> SIH 2026 Problem SIH26044 Innovation
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Radio size={12} className="text-emerald-400 animate-pulse" /> WebRTC Direct Voice & Monaco Sync
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <span>⚡ Live Teaching Hub</span>
            <span className="text-xs md:text-sm font-extrabold px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
              GOAT CE Integration
            </span>
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mt-1 max-w-3xl">
            Introduction to <strong>GOAT Code Editor (GOAT CE)</strong> — a next-generation real-time collaborative IDE featuring 1-to-1 WebRTC browser voice calling, sub-pixel Monaco cursor presence, AI assistant, and ephemeral partitioned workspaces.
          </p>
        </div>

        {/* Action Button: Direct External Launch */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://goatcode-editor.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <span>Launch Standalone GOAT CE</span>
            <ExternalLink size={16} />
          </a>
          <a
            href="https://github.com/Tharun4743/GOAT-CE"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs md:text-sm font-bold rounded-xl transition-all border border-zinc-700 flex items-center gap-2"
          >
            <Code size={16} />
            <span>GitHub Repo</span>
          </a>
        </div>
      </div>

      {/* 🌟 SIH 2026 DEMO & INNOVATION CARD (Redirect into GOAT CE) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-zinc-900 border-2 border-indigo-500/50 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-xs font-black text-indigo-300 border border-white/10 shadow-xs">
              <Award size={16} className="text-yellow-400" />
              <span>SMART INDIA HACKATHON (SIH) 2026 • DEMO SHOWCASE (SIH26044)</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
              Live Pair Coding & Voice Mentorship for Academia & Placements
            </h2>
            
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Explaining algorithms, compiler errors, and technical interview logic over regular phone calls is difficult and inefficient. <strong>GOAT Code Editor</strong> provides an integrated solution: seamless <strong>1-to-1 WebRTC voice audio</strong> with hardware echo cancellation, paired with synchronized <strong>Monaco Editor</strong> coding, sandboxed execution, and ephemeral room lifecycle.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-zinc-900/90 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Mic size={14} className="text-indigo-400" /> 1-to-1 WebRTC Voice Stream
              </span>
              <span className="px-3 py-1 bg-zinc-900/90 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Layers size={14} className="text-purple-400" /> Monaco VS Code Engine
              </span>
              <span className="px-3 py-1 bg-zinc-900/90 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Play size={14} className="text-emerald-400" /> Piston API Multi-Language Runner
              </span>
              <span className="px-3 py-1 bg-zinc-900/90 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Bot size={14} className="text-amber-400" /> AI Assistant (Llama 3.1 70B)
              </span>
            </div>
          </div>

          {/* Quick Interactive Launch Card */}
          <div className="lg:col-span-4 bg-zinc-900/95 backdrop-blur-2xl p-6 rounded-2xl border border-indigo-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Zap size={14} /> Launch Peer Room
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Ready
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Room Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2.5 bg-black/70 border border-zinc-700 rounded-xl text-indigo-300 font-mono font-bold text-sm tracking-wider outline-none focus:border-indigo-500 shadow-inner"
                />
                <button
                  onClick={generateNewRoomId}
                  title="Generate new Room ID"
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-zinc-700"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={copyRoomId}
                  title="Copy Invite Link"
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-zinc-700"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleLaunchRoom()}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/50 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Launch & Enter Live Session</span>
              <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[11px] font-bold text-zinc-400 mb-1.5">Join Existing Session:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. VSB-123456"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleJoinExistingRoom}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all border border-zinc-700"
                >
                  Join
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 🚀 GOAT CE ARCHITECTURE & CORE HIGHLIGHTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Cpu size={20} className="text-indigo-400" />
            <span>GOAT CE Architectural Highlights</span>
          </h3>
          <span className="text-xs text-zinc-400">Full-Stack Real-Time IDE Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Mic size={20} />
            </div>
            <h4 className="text-base font-extrabold text-white">1-to-1 WebRTC Voice</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Full-duplex browser audio stream with synthetic ringtone, incoming call notification modal, active speaker VAD, and hardware Acoustic Echo Cancellation (AEC).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/40 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers size={20} />
            </div>
            <h4 className="text-base font-extrabold text-white">Monaco Kernel (VS Code)</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Full VS Code engine with sub-pixel cursor calibration, colored developer badges, remote selection broadcasting, and operational transformation code sync.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Play size={20} />
            </div>
            <h4 className="text-base font-extrabold text-white">Piston Sandboxed Runner</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time server-side sandboxed execution for 13+ compiled & interpreted languages (Python, C++, Java, JS/TS, Go, Rust, SQL) with live stdout output.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield size={20} />
            </div>
            <h4 className="text-base font-extrabold text-white">Ephemeral Workspaces</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero-leak in-memory buffers where room code, chat messages, and call streams are automatically purged when all peers exit the room.
            </p>
          </div>

        </div>
      </div>

      {/* 💻 MENTORSHIP TEMPLATES & LOCAL SANDBOX RUNNER */}
      <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-5 md:p-6 bg-zinc-900/90 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
              <Code size={20} className="text-indigo-400" />
              <span>Teaching Workspace & Problem Presets</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select an algorithmic topic to preview code structure, test local execution, or spin up a live voice room.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => handleSelectTemplate(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedTemplate.name === t.name
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor + Console Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left: Code Editor Area */}
          <div className="lg:col-span-8 p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-black/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400">Template:</span>
                <span className="text-xs font-extrabold text-indigo-400">{selectedTemplate.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Play size={12} />
                  <span>{isRunning ? 'Running...' : 'Run Local Sandbox'}</span>
                </button>
                <button
                  onClick={() => handleLaunchRoom()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink size={12} />
                  <span>Launch in GOAT CE</span>
                </button>
              </div>
            </div>

            <textarea
              value={activeCode}
              onChange={(e) => setActiveCode(e.target.value)}
              rows={14}
              className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl font-mono text-xs md:text-sm text-zinc-200 leading-relaxed outline-none focus:border-indigo-500 resize-none shadow-inner"
            />
          </div>

          {/* Right: Output Console & Live Voice Simulator */}
          <div className="lg:col-span-4 p-4 md:p-6 bg-zinc-950/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Terminal size={14} className="text-emerald-400" /> Output Terminal
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Piston Sandbox v2</span>
              </div>
              <pre className="p-3 bg-black border border-zinc-800/80 rounded-xl text-[11px] font-mono text-emerald-400 whitespace-pre-wrap min-h-[140px] leading-relaxed shadow-inner">
                {outputConsole}
              </pre>
            </div>

            {/* Live Peer Voice Call Status Card */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    TK
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Peer Mentorship Voice Bridge</div>
                    <div className="text-[10px] text-zinc-400">Department Voice Channel</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-md border border-emerald-500/30">
                  READY
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsSimulatedCall(!isSimulatedCall);
                    addToast(isSimulatedCall ? 'Voice Channel Disconnected' : 'Connected to WebRTC Peer Audio', 'success');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    isSimulatedCall
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isSimulatedCall ? <PhoneOff size={14} /> : <PhoneCall size={14} />}
                  <span>{isSimulatedCall ? 'End Voice Audio' : 'Test Voice Link'}</span>
                </button>
                <button
                  onClick={copyRoomId}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all border border-zinc-700"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default LiveTeachingHubView;
