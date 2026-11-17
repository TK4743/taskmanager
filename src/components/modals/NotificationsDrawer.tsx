import React from 'react';
import { Bell, CheckCheck, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import type { Notification } from '../../types';

export interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  notifications: Notification[];
  markNotificationsRead: () => void;
  markSingleNotificationRead: (id: string | number) => void;
  myInvitations: any[];
  handleRespondInvitation: (invitationId: string, response: 'ACCEPT' | 'DECLINE') => void;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  markNotificationsRead,
  markSingleNotificationRead,
  myInvitations,
  handleRespondInvitation,
}: NotificationsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white dark:bg-[#181820] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto md:max-h-none md:overflow-visible">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div id="app-logo-slot" className="logo-container w-5 h-5 object-contain rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 overflow-hidden" aria-label="Company Logo Slot">
            <img src="/logo.png" alt="IT Vault Logo" className="w-full h-full object-contain" width="20" height="20" loading="eager" decoding="async" />
          </div>
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Notifications</h3>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              {notifications.filter(n => !n.is_read).length} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.filter(n => !n.is_read).length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markNotificationsRead();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 active:scale-95 transition-all shadow-2xs cursor-pointer border border-indigo-100/60 dark:border-indigo-900/60"
              title="Mark all notifications as read"
            >
              <CheckCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Mark all read</span>
            </button>
          ) : (
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCheck size={12} className="text-emerald-500" /> All read
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const matchingInv = myInvitations.find(inv =>
              n.message.includes(inv.team_name) || n.message.includes(inv.task_title)
            ) || myInvitations[0];
            const isTeamInv = n.type === 'TEAM_INVITATION' || n.message.toLowerCase().includes('invited');
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markSingleNotificationRead(n.id);
                }}
                className={cn(
                  "p-3 rounded-xl text-xs flex items-start gap-3 transition-all cursor-pointer relative group/item",
                  n.is_read
                    ? "bg-zinc-50/70 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-800"
                    : "bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs"
                )}
              >
                <div className="w-8 h-8 rounded-full object-contain bg-white dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs mt-0.5 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                  IT
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div>
                      {n.title && (
                        <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight leading-none mb-0.5">{n.title}</p>
                      )}
                      <p className="text-zinc-900 dark:text-zinc-100 font-semibold leading-snug">{n.message}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" title="Unread" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-zinc-400 font-medium">{new Date(n.created_at).toLocaleString()}</p>
                    {!n.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markSingleNotificationRead(n.id);
                        }}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-0.5"
                        title="Mark as read"
                      >
                        <Check size={11} /> Mark read
                      </button>
                    )}
                  </div>
                  {isTeamInv && myInvitations.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50">
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleRespondInvitation((matchingInv || myInvitations[0]).id, 'ACCEPT'); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1 h-auto rounded-lg shadow-sm"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleRespondInvitation((matchingInv || myInvitations[0]).id, 'DECLINE'); }}
                        className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold px-3 py-1 h-auto rounded-lg"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationsDrawer;
