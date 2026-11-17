import React, { useState, useEffect, useCallback } from 'react';
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
  Bus,
  Copy,
  Check,
  Play,
  Users,
  Terminal,
  Zap,
  Share2,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { GOAT_CE_URL, API_URL } from '../../config';

interface LiveTeachingHubViewProps {
  user?: any;
  token?: string | null;
  addToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface PeerRoom {
  id?: string;
  room_code: string;
  topic: string;
  host_id?: string;
  host_name: string;
  class_name?: string;
  peer_count: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const LiveTeachingHubView: React.FC<LiveTeachingHubViewProps> = ({ user, token, addToast }) => {
  const [createdRoomCode, setCreatedRoomCode] = useState<string>(() => `VSB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [joinCode, setJoinCode] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Data Structures & Algorithms');
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [activeRooms, setActiveRooms] = useState<PeerRoom[]>([]);

  const topics = [
    'Data Structures & Algorithms',
    'Full-Stack Web Development',
    'Python & AI/ML',
    'Cloud & System Design',
    'LeetCode Interview Prep'
  ];

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    setLoadingRooms(true);
    try {
      const res = await fetch(`${API_URL}/api/teaching/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRooms(Array.isArray(data) ? data : []);
      }
    } catch {
      // Keep existing list on failure
    } finally {
      setLoadingRooms(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleLaunchCreatedRoom = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/teaching/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            room_code: createdRoomCode,
            topic: selectedTopic
          })
        });
        fetchRooms();
      }
    } catch (e) {
      console.error('Error creating room on backend:', e);
    }

    const url = `${GOAT_CE_URL}?room=${encodeURIComponent(createdRoomCode)}&topic=${encodeURIComponent(selectedTopic)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (addToast) addToast(`Room ${createdRoomCode} launched and published to cohort!`, 'success');
  };

  const handleJoinByCode = async (codeToJoin?: string) => {
    const code = (codeToJoin || joinCode).trim();
    if (!code) {
      if (addToast) addToast('Please enter a valid room code', 'error');
      return;
    }

    try {
      if (token) {
        await fetch(`${API_URL}/api/teaching/rooms/${encodeURIComponent(code)}/join`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchRooms();
      }
    } catch (e) {
      console.error('Error recording peer join:', e);
    }

    const url = `${GOAT_CE_URL}?room=${encodeURIComponent(code)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (addToast) addToast(`Connecting to room ${code}...`, 'info');
  };

  const handleEndRoom = async (code: string) => {
    try {
      if (token) {
        const res = await fetch(`${API_URL}/api/teaching/rooms/${encodeURIComponent(code)}/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          if (addToast) addToast(`Room ${code} closed successfully.`, 'info');
          fetchRooms();
        }
      }
    } catch {
      if (addToast) addToast('Failed to end room.', 'error');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    if (addToast) addToast(`Room code ${createdRoomCode} copied to clipboard!`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerateCode = () => {
    setCreatedRoomCode(`VSB-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <div className="w-full min-h-full overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#F5F5F4] dark:bg-[#0f0f12] text-zinc-900 dark:text-zinc-100 font-sans">
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
            </div>
            <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">
              Peer-to-peer real-time collaborative coding, live voice mentorship, and interactive learning.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Peer Voice & IDE Gateway Active</span>
            </span>
          </div>
        </div>

        {/* ── Hero Headline Banner & Interactive Room Console ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Card */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-2xl bg-white border border-zinc-200/80 p-6 md:p-8 shadow-xs flex flex-col justify-between space-y-4">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold rounded-full uppercase tracking-wider">
                <Sparkles size={12} className="text-indigo-600" /> Peer-to-Peer Learning Environment
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 leading-tight">
                Learn. Teach. Code Together.
              </h2>
              
              <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-normal">
                Connect with your peers, teach concepts through voice, and write code together in real time — with zero setup, live Monaco editor, and integrated voice channels.
              </p>
            </div>

            {/* Instant Room Creator Box */}
            <div className="relative z-10 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-indigo-600" /> Instant Peer Room
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                >
                  Generate New Code
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="w-full sm:w-auto flex-1 flex items-center bg-white border border-zinc-200 rounded-lg px-3 py-2">
                  <span className="font-mono font-bold text-sm text-zinc-900 tracking-wider flex-1">
                    {createdRoomCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 text-zinc-400 hover:text-zinc-900 transition cursor-pointer"
                    title="Copy room code"
                  >
                    {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>

                <select
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800"
                >
                  {topics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleLaunchCreatedRoom}
                  className="w-full sm:w-auto py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Play size={14} />
                  <span>Launch Room</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Join & Active Channels Panel */}
          <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                  <Radio size={16} className="text-emerald-500 animate-pulse" />
                  <span>Active Study Rooms</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchRooms}
                    disabled={loadingRooms}
                    className="p-1 text-zinc-400 hover:text-zinc-900 rounded transition cursor-pointer"
                    title="Refresh rooms"
                  >
                    <RefreshCw size={13} className={loadingRooms ? 'animate-spin text-indigo-600' : ''} />
                  </button>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeRooms.length} LIVE
                  </span>
                </div>
              </div>

              {/* Join Code Input */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter Room Code (e.g. VSB-8831)"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-black uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleJoinByCode()}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Join
                </button>
              </div>

              {/* Active Channels List */}
              <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activeRooms.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-zinc-600">No Active Peer Rooms Right Now</p>
                    <p className="text-[11px] text-zinc-400">Launch a new session above to invite your classmates to study!</p>
                  </div>
                ) : (
                  activeRooms.map((room) => {
                    const isMyRoom = room.host_id === user?.id;
                    return (
                      <div key={room.room_code || room.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-3 hover:border-indigo-300 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {room.room_code}
                            </span>
                            <span className="text-xs font-bold text-zinc-900 truncate">
                              {room.topic}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                            <span>Host: <strong className="text-zinc-700">{room.host_name}</strong> {room.class_name ? `(${room.class_name})` : ''}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <Users size={12} /> {room.peer_count} {room.peer_count === 1 ? 'peer' : 'peers'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMyRoom && (
                            <button
                              type="button"
                              onClick={() => handleEndRoom(room.room_code)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg border border-red-200 transition cursor-pointer"
                              title="End and close your live session"
                            >
                              End
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleJoinByCode(room.room_code)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-medium text-center">
              Protected by encrypted WebRTC audio & real-time operational transformation.
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
              onClick={handleLaunchCreatedRoom}
              className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs md:text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Collaborative Room</span>
              <ExternalLink size={15} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LiveTeachingHubView;
