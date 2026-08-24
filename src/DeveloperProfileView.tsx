import React from 'react';
import { 
  ExternalLink, 
  Github, 
  Linkedin, 
  Mail, 
  Phone, 
  Award, 
  GraduationCap, 
  Code2, 
  Sparkles, 
  FileText, 
  Cpu,
  Layers,
  MapPin
} from 'lucide-react';

export function DeveloperProfileView() {
  return (
    <div className="space-y-6 text-left">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950 p-6 md:p-8 text-white border border-zinc-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-500 to-blue-500 p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center font-black text-2xl md:text-3xl text-white">
                TK
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Tharunkumar K
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Lead Architect
                </span>
              </div>
              <p className="text-xs md:text-sm text-indigo-200 font-semibold mt-0.5">
                Full Stack Developer • Department Student Coordinator (IT, VSBEC)
              </p>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-amber-400" />
                Dharapuram, Tamil Nadu, India
              </p>
            </div>
          </div>

          {/* Direct CTA links */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href="https://tharunkumark4743.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>Explore Portfolio</span>
              <ExternalLink size={14} />
            </a>
            <a
              href="https://drive.google.com/drive/folders/1zdLQ8EoEC8X73fFAJjSJr-Ros_xckIyW"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText size={14} className="text-amber-400" />
              <span>Resume</span>
            </a>
          </div>
        </div>

        {/* Bio quote */}
        <p className="mt-5 text-xs md:text-sm text-zinc-300 leading-relaxed max-w-2xl border-t border-zinc-800/80 pt-4">
          "I build intelligent web applications, collaborative developer platforms, and safety IoT systems that solve real-world academic and enterprise challenges."
        </p>
      </div>

      {/* Social & Contact Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <a
          href="https://github.com/Tharun4743"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl flex items-center gap-2.5 text-xs font-bold text-zinc-800 transition-colors group"
        >
          <Github size={16} className="text-zinc-700 group-hover:text-black" />
          <span className="truncate">GitHub (23+ Repos)</span>
        </a>
        <a
          href="https://www.linkedin.com/in/tharunkumark4743/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl flex items-center gap-2.5 text-xs font-bold text-zinc-800 transition-colors group"
        >
          <Linkedin size={16} className="text-blue-600" />
          <span className="truncate">LinkedIn</span>
        </a>
        <a
          href="https://leetcode.com/u/Tharunkumar__K/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl flex items-center gap-2.5 text-xs font-bold text-zinc-800 transition-colors group"
        >
          <Code2 size={16} className="text-amber-600" />
          <span className="truncate">LeetCode Profile</span>
        </a>
        <a
          href="https://www.geeksforgeeks.org/profile/tharunkumark4743"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl flex items-center gap-2.5 text-xs font-bold text-zinc-800 transition-colors group"
        >
          <Sparkles size={16} className="text-emerald-600" />
          <span className="truncate">GeeksForGeeks</span>
        </a>
      </div>

      {/* Key Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Award size={16} className="text-amber-600" />
            <span>Code Thugs 2k26</span>
          </div>
          <div className="text-xs text-zinc-700 font-medium">
            <b>1st Place National Winner</b> for developing GOAT Code Editor IDE.
          </div>
        </div>

        <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
            <Cpu size={16} className="text-indigo-600" />
            <span>Smart India Hackathon 2025</span>
          </div>
          <div className="text-xs text-zinc-700 font-medium">
            <b>Top 50 / 300+ Teams</b> — Lead developer for IoT Rider Safety System.
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <GraduationCap size={16} className="text-emerald-600" />
            <span>VSB Engineering College</span>
          </div>
          <div className="text-xs text-zinc-700 font-medium">
            <b>B.Tech IT (2024–2028)</b> • CGPA: 8.5/10 • Dept Student Coordinator.
          </div>
        </div>
      </div>

      {/* Technical Arsenal */}
      <div className="border border-zinc-200/80 rounded-2xl p-5 bg-white space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase tracking-wider">
          <Layers size={14} className="text-indigo-600" />
          <span>Technical Arsenal</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold text-zinc-700 block mb-1">Languages & Core:</span>
            <div className="flex flex-wrap gap-1.5">
              {['TypeScript', 'JavaScript', 'Python', 'Java', 'C/C++', 'SQL'].map(s => (
                <span key={s} className="bg-zinc-100 text-zinc-800 font-medium px-2 py-0.5 rounded-md border border-zinc-200/60 text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="font-bold text-zinc-700 block mb-1">Web & Backend Frameworks:</span>
            <div className="flex flex-wrap gap-1.5">
              {['React', 'Next.js 15', 'Node.js', 'Express', 'Tailwind CSS', 'PostgreSQL', 'Supabase', 'Prisma'].map(s => (
                <span key={s} className="bg-indigo-50 text-indigo-800 font-medium px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Projects Built */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
          Featured Engineering Projects
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900">VSBEC IT Task Manager</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">Live Platform</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Enterprise academic task management, submission, and verification system for the Department of IT.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900">Campus Connect</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">TPO Placement</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Automated placement portal with real-time Socket.IO alerts, resume vault, and recruiter workflows.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900">GOAT Code Editor</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Hackathon Winner</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Real-time collaborative IDE with live pair programming, Monaco editor, and multi-language compilation.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900">Techy Tharun AI & Aura RAG</span>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">AI / GenAI</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              GPT-4o assistant and 100% offline multimodal RAG system with ChromaDB and Ollama.
            </p>
          </div>
        </div>
      </div>

      {/* Direct Contact Footer */}
      <div className="p-4 bg-zinc-100/80 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-zinc-700 font-semibold flex-wrap">
          <a href="mailto:tharunkumark42007@gmail.com" className="flex items-center gap-1.5 hover:text-indigo-600">
            <Mail size={14} className="text-indigo-600" />
            <span>tharunkumark42007@gmail.com</span>
          </a>
          <a href="tel:+918760964830" className="flex items-center gap-1.5 hover:text-indigo-600">
            <Phone size={14} className="text-emerald-600" />
            <span>+91 87609 64830</span>
          </a>
        </div>
        <a
          href="https://tharunkumark4743.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>tharunkumark4743.netlify.app</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

export default DeveloperProfileView;
