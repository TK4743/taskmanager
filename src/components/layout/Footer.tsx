import React, { createContext, useContext } from 'react';

export type FooterModalType = 'PRIVACY' | 'TERMS' | 'SUPPORT' | 'SOURCES';

export const FooterContext = createContext<((type: FooterModalType) => void) | null>(null);

export const useFooter = () => useContext(FooterContext);

export interface FooterProps {
  onShowModal: (type: FooterModalType) => void;
}

export const Footer = ({ onShowModal }: FooterProps) => (
  <footer className="mt-8 pt-4 pb-4 border-t border-zinc-200/80 shrink-0 w-full bg-white/60 backdrop-blur-md px-4 md:px-8">
    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-3 text-xs min-w-0">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div id="app-logo-slot" className="logo-container w-8 h-8 rounded-full bg-white p-0.5 overflow-hidden shrink-0 border border-zinc-200 shadow-2xs flex items-center justify-center" aria-label="Company Logo Slot"></div>
        <span className="font-extrabold text-zinc-900 text-xs tracking-tight whitespace-nowrap">VSBEC IT Vault</span>
      </div>

      {/* Center: Legal & Information Links */}
      <div className="flex items-center gap-3 text-xs font-medium text-zinc-600 flex-wrap justify-center">
        <button onClick={() => onShowModal('PRIVACY')} className="hover:text-indigo-600 transition-colors whitespace-nowrap cursor-pointer">
          Privacy Policy
        </button>
        <span className="text-zinc-300">•</span>
        <button onClick={() => onShowModal('TERMS')} className="hover:text-indigo-600 transition-colors whitespace-nowrap cursor-pointer">
          Terms of Service
        </button>
        <span className="text-zinc-300">•</span>
        <button onClick={() => onShowModal('SUPPORT')} className="hover:text-indigo-600 transition-colors whitespace-nowrap cursor-pointer">
          Help & Support
        </button>
      </div>

      {/* Right: Developed & Maintained By */}
      <div className="text-center lg:text-right text-zinc-600 text-xs font-medium leading-tight shrink-0">
        <span>Developed and maintained by </span>
        <a
          href="https://tharunkumark4743.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-zinc-900 hover:text-indigo-600 transition-colors underline decoration-zinc-300 underline-offset-2 cursor-pointer"
        >
          Tharunkumar K
        </a>
        <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
          Department of Information Technology, VSB Engineering College
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
