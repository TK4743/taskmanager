import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Megaphone, Share2, Plus, Search, Pin, Trash2,
  Paperclip, Building2, GraduationCap, Globe
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { Notice, User } from '../../types';

export interface NoticeBoardViewProps {
  notices: Notice[];
  user: User | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  onOpenCreateNoticeModal: () => void;
  onDeleteNotice: (id: string) => void;
  onPinNotice: (id: string) => void;
  onShareNotice: (id: string, title?: string) => void;
  onShareBoard: () => void;
}

export function NoticeBoardView({
  notices,
  user,
  isAdmin,
  isHOD,
  isAdvisor,
  onOpenCreateNoticeModal,
  onDeleteNotice,
  onPinNotice,
  onShareNotice,
  onShareBoard,
}: NoticeBoardViewProps) {
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticePriorityFilter, setNoticePriorityFilter] = useState('');
  const [noticeScopeFilter, setNoticeScopeFilter] = useState('');

  const filteredNotices = notices.filter(n => {
    if (noticeSearch) {
      const q = noticeSearch.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchDesc = n.description?.toLowerCase().includes(q);
      const matchCreator = n.creator_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCreator) return false;
    }
    if (noticePriorityFilter && n.priority !== noticePriorityFilter) return false;
    if (noticeScopeFilter && n.scope !== noticeScopeFilter) return false;
    return true;
  });

  return (
    <motion.div
      key="notice-board"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col min-h-0"
    >
      <PageLayout>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <Megaphone className="text-indigo-600 dark:text-indigo-400" size={26} /> Digital Notice Board
            </h2>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Official Announcements & Communications
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onShareBoard}
              variant="outline"
              className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold px-4 rounded-xl flex items-center gap-1.5"
              title="Copy Notice Board link"
            >
              <Share2 size={16} /> Share Board
            </Button>
            {(isAdvisor || isHOD || isAdmin) && (
              <Button
                onClick={onOpenCreateNoticeModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 rounded-xl shadow-lg shadow-indigo-600/20"
              >
                <Plus size={18} /> Publish Notice
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search departmental circulars and notices..."
              value={noticeSearch}
              onChange={e => setNoticeSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={noticePriorityFilter}
            onChange={e => setNoticePriorityFilter(e.target.value)}
            className="w-40"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </Select>

          <Select
            value={noticeScopeFilter}
            onChange={e => setNoticeScopeFilter(e.target.value)}
            className="w-40"
          >
            <option value="">All Audiences</option>
            <option value="ALL">Global / College</option>
            <option value="DEPARTMENT">Department</option>
            <option value="CLASS">Class Section</option>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <Megaphone size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-sm">No notices published yet</p>
              <p className="text-xs text-zinc-400 mt-1">Check back later for official announcements</p>
            </Card>
          ) : (
            filteredNotices.map(notice => {
              const priorityColors: Record<string, string> = {
                URGENT: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
                HIGH: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                NORMAL: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
                LOW: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
              };

              return (
                <Card
                  key={notice.id}
                  className={`p-6 transition-all border ${
                    notice.is_pinned
                      ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {notice.is_pinned && (
                          <Badge className="bg-indigo-600 text-white border-indigo-600 flex items-center gap-1 font-bold text-[10px]">
                            <Pin size={10} className="fill-current" /> PINNED
                          </Badge>
                        )}
                        <Badge className={`${priorityColors[notice.priority || 'NORMAL']} font-bold text-[10px]`}>
                          {notice.priority || 'NORMAL'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-300">
                          {notice.scope === 'ALL' ? <Globe size={11} /> : notice.scope === 'DEPARTMENT' ? <Building2 size={11} /> : <GraduationCap size={11} />}
                          {notice.scope === 'ALL' ? 'All College' : notice.scope === 'DEPARTMENT' ? (notice.department_name || 'Department') : (notice.class_name || 'Class Section')}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                        {notice.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onShareNotice(notice.id, notice.title)}
                        className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Share Notice"
                      >
                        <Share2 size={16} />
                      </button>
                      {(isAdmin || isHOD) && (
                        <button
                          onClick={() => onPinNotice(notice.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            notice.is_pinned
                              ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100'
                              : 'text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title={notice.is_pinned ? "Unpin Notice" : "Pin Notice"}
                        >
                          <Pin size={16} />
                        </button>
                      )}
                      {(isAdmin || String(notice.created_by) === String(user?.id)) && (
                        <button
                          onClick={() => onDeleteNotice(notice.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-zinc-700 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed mb-4">
                    {notice.description}
                  </p>

                  {notice.attachment_url && (
                    <div className="mb-4">
                      <a
                        href={notice.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        <Paperclip size={14} /> Download Notice Attachment
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-medium text-zinc-400 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <span>
                      Posted by <strong className="text-zinc-700 dark:text-white">{notice.creator_name}</strong> ({notice.creator_role})
                    </span>
                    <span>{new Date(notice.created_at).toLocaleString()}</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </PageLayout>
    </motion.div>
  );
}

export default NoticeBoardView;
