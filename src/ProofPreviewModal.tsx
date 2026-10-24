/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  ExternalLink,
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  Eye,
  FileCheck
} from 'lucide-react';

export interface ProofPreviewData {
  url: string;
  title: string;
  filename?: string;
  size?: string;
  isDraft?: boolean;
  onChangeFile?: () => void;
  onDeleteFile?: () => void;
}

export interface ProofPreviewModalProps {
  data: ProofPreviewData | null;
  onClose: () => void;
}

export const ProofPreviewModal: React.FC<ProofPreviewModalProps> = ({ data, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom, rotation and position whenever the modal opens or data changes
  useEffect(() => {
    if (data) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [data?.url]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!data) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom(prev => Math.min(prev + 0.25, 3.5));
      } else if (e.key === '-') {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation(prev => (prev + 90) % 360);
      } else if (e.key === '0') {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, onClose]);

  if (!data) return null;

  const isPdf = Boolean(
    (data.filename && data.filename.toLowerCase().endsWith('.pdf')) ||
    (data.url && data.url.toLowerCase().includes('.pdf'))
  );

  // Mouse pan handling when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      {/* Top HUD Navigation Bar */}
      <div
        className="w-full bg-zinc-950/95 border-b border-zinc-800/80 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* File & Context Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-emerald-400">
            {isPdf ? <FileText size={20} /> : <Eye size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-zinc-100 truncate max-w-[220px] sm:max-w-md">
                {data.title || 'Screenshot Proof Preview'}
              </h4>
              {data.isDraft ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Draft (Unsaved)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Submitted Proof
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
              <span className="truncate max-w-[180px] sm:max-w-xs">{data.filename || 'proof_evidence'}</span>
              {data.size && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{data.size}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isPdf && (
            <>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3.5))}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setPosition({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors text-xs font-mono font-bold"
                title="Reset Zoom & Rotation (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                title="Rotate 90° Clockwise (R)"
              >
                <RotateCw size={16} />
              </button>
            </>
          )}

          <a
            href={data.url}
            download={data.filename || 'submission_proof'}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
            title="Download Original Proof"
            onClick={e => e.stopPropagation()}
          >
            <Download size={16} />
          </a>

          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
            title="Open in New Tab"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={16} />
          </a>

          {data.onChangeFile && (
            <button
              type="button"
              onClick={() => {
                data.onChangeFile?.();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              title="Select different screenshot"
            >
              <Upload size={13} /> Change
            </button>
          )}

          {data.onDeleteFile && (
            <button
              type="button"
              onClick={() => {
                data.onDeleteFile?.();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Delete screenshot"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}

          <div className="h-5 w-px bg-zinc-800 mx-1" />

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white border border-zinc-800 hover:border-red-500 transition-colors"
            title="Close Preview (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <div
        className="flex-1 w-full overflow-hidden flex items-center justify-center p-4 relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {isPdf ? (
          <div
            className="w-full max-w-5xl h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={data.url}
              title="PDF Proof Viewer"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div
            className="relative transition-transform duration-75 flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={data.url}
              alt={data.title}
              className="max-w-[85vw] max-h-[80vh] object-contain rounded-xl shadow-2xl border border-zinc-800/80 bg-zinc-950 pointer-events-auto"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Bottom Hint Footer */}
      <div
        className="w-full bg-zinc-950/80 border-t border-zinc-900 py-2 px-6 flex items-center justify-between text-zinc-400 text-[11px]"
        onClick={e => e.stopPropagation()}
      >
        <span className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px]">Esc</kbd> Close
          {!isPdf && (
            <>
              <span className="text-zinc-700">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px]">+</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px]">-</kbd> Zoom
              <span className="text-zinc-700">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px]">R</kbd> Rotate
              <span className="text-zinc-700">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px]">0</kbd> Reset
            </>
          )}
        </span>
        <span className="text-zinc-500 font-medium">
          {data.isDraft ? 'Verify screenshot details and readability before submitting' : 'Verified Academic Submission Proof'}
        </span>
      </div>
    </div>
  );
};

export default ProofPreviewModal;
