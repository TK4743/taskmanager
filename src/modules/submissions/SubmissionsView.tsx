import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ImageIcon, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getCloudinaryThumbnail } from '../../components/common/helpers';
import type { Submission, User } from '../../types';

export interface SubmissionsViewProps {
  submissions: Submission[];
  user: User | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  isCoordinator: boolean;
  verifySubmission?: (id: string | number, status: string) => void;
}

export function SubmissionsView({
  submissions,
  user,
  isAdmin,
  isHOD,
  isAdvisor,
  isCoordinator,
  verifySubmission = () => {},
}: SubmissionsViewProps) {
  const userSubmissions = useMemo(() => {
    if (!user) return [];
    if (user.role === 'STUDENT') {
      return submissions.filter(s => String(s.user_id) === String(user.id));
    }
    if (isAdvisor && user.class_id) {
      return submissions.filter(s => String(s.class_id) === String(user.class_id));
    }
    return submissions;
  }, [submissions, user, isAdvisor]);

  return (
    <motion.div
      key="submissions"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col min-h-0"
    >
      <PageLayout>
        <div className="grid grid-cols-1 gap-4">
          {userSubmissions.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <ImageIcon size={48} className="mb-4 opacity-20" />
              <p>No submissions found</p>
            </Card>
          ) : (
            userSubmissions.map(sub => (
              <Card key={sub.id} className="flex flex-col md:flex-row gap-6 p-6">
                {sub.status === 'NOT_PARTICIPATING' ? (
                  <div className="w-full md:w-48 h-48 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900/50 p-4 flex flex-col items-center justify-center text-center shrink-0">
                    <AlertTriangle size={32} className="text-orange-500 mb-2" />
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase">Not Participating</p>
                    <p className="text-xs text-orange-800 dark:text-orange-400 mt-1 line-clamp-4 font-medium">
                      "{sub.not_participating_reason || 'No reason provided'}"
                    </p>
                  </div>
                ) : (
                  <div className="w-full md:w-48 h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {sub.screenshot_url && !sub.screenshot_url.startsWith('PURGED') ? (
                      <img
                        src={getCloudinaryThumbnail(sub.screenshot_url, 400)}
                        alt="Submission"
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(sub.screenshot_url, '_blank')}
                        referrerPolicy="no-referrer"
                      />
                    ) : sub.screenshot_url && sub.screenshot_url.startsWith('PURGED') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-xs gap-1.5 p-3 text-center">
                        <ImageIcon size={26} className="text-zinc-300 dark:text-zinc-600" />
                        <span className="font-semibold text-zinc-600 dark:text-zinc-300">Purged after 30 days</span>
                        <span className="text-[10px] text-zinc-400">Submission verified & preserved</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                        No image uploaded
                      </div>
                    )}
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{sub.task_title}</h4>
                        <p className="text-sm text-zinc-500">
                          {isAdvisor
                            ? `Student: ${sub.student_name}`
                            : `Submitted on ${new Date(sub.submitted_at).toLocaleString()}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          sub.status === 'VERIFIED'
                            ? 'success'
                            : sub.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        className={sub.status === 'NOT_PARTICIPATING' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                      >
                        {sub.status === 'NOT_PARTICIPATING' ? 'NOT INTERESTED' : sub.status}
                      </Badge>
                    </div>
                    {sub.status === 'VERIFIED' && sub.verified_at && (
                      <p className="text-xs text-zinc-400 mt-2 uppercase font-bold">
                        Verified on {new Date(sub.verified_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {(isHOD || isAdmin || isAdvisor || isCoordinator) && sub.status === 'SUBMITTED' && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="success"
                        className="flex-1 flex items-center justify-center gap-2 cursor-pointer"
                        onClick={() => verifySubmission(sub.id, 'VERIFIED')}
                      >
                        <CheckCircle2 size={18} /> Verify
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1 flex items-center justify-center gap-2 cursor-pointer"
                        onClick={() => verifySubmission(sub.id, 'REJECTED')}
                      >
                        <XCircle size={18} /> Reject
                      </Button>
                    </div>
                  )}

                  {sub.screenshot_url && !sub.screenshot_url.startsWith('PURGED') && (
                    <Button
                      variant="ghost"
                      className="mt-4 text-xs flex items-center gap-2 w-fit cursor-pointer"
                      onClick={() => window.open(sub.screenshot_url, '_blank')}
                    >
                      <ExternalLink size={14} /> View Full Screenshot
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </PageLayout>
    </motion.div>
  );
}

export default SubmissionsView;
