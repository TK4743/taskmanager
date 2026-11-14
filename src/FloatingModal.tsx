import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from './lib/utils';

export interface FloatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
}

const maxWidthMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
  full: 'sm:max-w-[95vw]'
};

export const FloatingModal: React.FC<FloatingModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'lg',
  className,
  contentClassName,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center">
          {/* Dimmed and slightly blurred backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
            aria-hidden="true"
          />

          {/* Modal Container: Mobile Bottom-Sheet, Desktop Centered Card */}
          <motion.div
            ref={modalRef}
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              // Layout & Base styles
              "relative w-full bg-white dark:bg-[#121217] text-zinc-900 dark:text-zinc-100 flex flex-col",
              // Mobile: bottom sheet
              "rounded-t-3xl sm:rounded-3xl max-h-[92dvh] sm:max-h-[88vh] shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800",
              // Desktop: centered floating card
              "sm:my-8 sm:mx-4",
              maxWidthMap[maxWidth],
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* iOS Bottom Sheet Drag Handle (Mobile only) */}
            <div className="sm:hidden pt-3 pb-1 shrink-0 flex justify-center">
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="px-5 sm:px-6 pt-3 sm:pt-6 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  {icon && (
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center shrink-0 border border-zinc-200/70 dark:border-zinc-700/60 mt-0.5">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight truncate">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content Area */}
            <div
              className={cn(
                "flex-1 overflow-y-auto px-5 sm:px-6 py-4 custom-scrollbar",
                contentClassName
              )}
            >
              {children}
            </div>

            {/* Fixed Bottom Action Footer (Safe-area supported) */}
            {footer && (
              <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#15151a] rounded-b-none sm:rounded-b-3xl shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))] flex items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FloatingModal;

