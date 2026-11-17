import React from 'react';
import {
  SubmissionInspectorModal,
  RejectionModal,
  TaskDefaulterEmailModal,
  TeamModal,
  TeamReviewModal,
  ExportModal,
  ExtendDeadlineModal,
  CreateNoticeModal,
  TelegramLinkModal,
  StaffStudentProfileModal
} from './index';
import { ProofPreviewModal } from './ProofPreviewModal';
import {
  exportToExcel,
  downloadScreenshotsZip,
  downloadScreenshotsPdf,
  computeAvailableScreenshotCount,
  type ReportFilterOptions
} from '../../utils/exportUtils';

export function GlobalModals({ app }: { app: any }) {
  const [reportFilters, setReportFilters] = React.useState<ReportFilterOptions>({
    classIds: [],
    taskId: '',
    year: '',
    status: 'ALL',
    gender: 'ALL'
  });
  const [isExporting, setIsExporting] = React.useState<boolean>(false);
  const [isDownloadingProofs, setIsDownloadingProofs] = React.useState<boolean>(false);
  const [proofDownloadFormat, setProofDownloadFormat] = React.useState<'ZIP' | 'PDF'>('ZIP');
  const [screenshotDownloadProgress, setScreenshotDownloadProgress] = React.useState<any>(null);
  const abortScreenshotDownloadRef = React.useRef<boolean>(false);
  const [teamRejectionReason, setTeamRejectionReason] = React.useState<string>('');

  const availableScreenshotCount = React.useMemo(() => {
    if (!app.showExportModal) return 0;
    return computeAvailableScreenshotCount(
      {
        user: app.user,
        users: app.users || [],
        submissions: app.submissions || [],
        classes: app.classes || [],
        myClass: app.myClass
      },
      reportFilters
    );
  }, [app.showExportModal, reportFilters, app.user, app.users, app.submissions, app.classes, app.myClass]);

  const exportCtx = React.useMemo(() => ({
    user: app.user,
    departments: app.departments || [],
    classes: app.classes || [],
    tasks: app.tasks || [],
    users: app.users || [],
    submissions: app.submissions || [],
    token: app.token,
    myClass: app.myClass,
    reportFilters,
    addToast: app.addToast,
    setIsExporting,
    setIsDownloadingProofs,
    setScreenshotDownloadProgress,
    abortScreenshotDownloadRef
  }), [app, reportFilters]);

  return (
    <>
      {app.inspectingSubmission && (
        <SubmissionInspectorModal
          inspectingSubmission={app.inspectingSubmission}
          onClose={() => app.setInspectingSubmission(null)}
          filteredList={app.submissions || []}
          onSelectSubmission={(sub) => app.setInspectingSubmission(sub)}
          verifySubmission={(id, status, note, reason) => app.verifySubmission(id, status, note, reason)}
          onOpenProofPreview={(data) => app.setProofPreviewData(data)}
        />
      )}

      {app.showRejectionModal && (
        <RejectionModal
          isOpen={Boolean(app.showRejectionModal)}
          submission={app.showRejectionModal}
          rejectionReason={app.rejectionReason}
          setRejectionReason={app.setRejectionReason}
          onClose={() => app.setShowRejectionModal(null)}
          onConfirm={() => {
            if (app.showRejectionModal) {
              app.verifySubmission(app.showRejectionModal.id, 'REJECTED', undefined, app.rejectionReason);
            }
          }}
        />
      )}

      {app.teamReviewModal && (
        <TeamReviewModal
          teamReviewModal={app.teamReviewModal}
          onClose={() => {
            app.setTeamReviewModal(null);
            setTeamRejectionReason('');
          }}
          teamRejectionReason={teamRejectionReason}
          setTeamRejectionReason={setTeamRejectionReason}
          onConfirm={async (subId, status) => {
            await app.handleReviewTeamSubmission(subId, status, teamRejectionReason);
            setTeamRejectionReason('');
          }}
        />
      )}

      {app.teamModalTask && (
        <TeamModal
          teamModalTask={app.teamModalTask}
          currentTaskTeam={app.currentTaskTeam}
          user={app.user}
          newTeamName={app.newTeamName}
          setNewTeamName={app.setNewTeamName}
          classmateSearchTerm={app.classmateSearchTerm}
          setClassmateSearchTerm={app.setClassmateSearchTerm}
          selectedClassmateIds={app.selectedClassmateIds}
          setSelectedClassmateIds={app.setSelectedClassmateIds}
          classmatesList={app.eligibleClassmates || []}
          teamProofFile={app.teamProofFile}
          setTeamProofFile={app.setTeamProofFile}
          teamRemarks={app.teamRemarks}
          setTeamRemarks={app.setTeamRemarks}
          isCreatingTeam={Boolean(app.isCreatingTeam)}
          isSubmittingProof={Boolean(app.isSubmittingTeam)}
          onClose={() => app.setTeamModalTask(null)}
          handleCreateTeam={app.handleCreateTeam}
          handleCreateSoloTeam={app.handleCreateSoloTeam}
          handleInviteMoreClassmates={app.handleInviteMoreClassmates}
          handleRespondInvitation={app.handleRespondInvitation}
          handleRemoveTeamMember={app.handleRemoveTeamMember}
          handleDeleteTeam={app.handleDeleteTeam}
          handleSubmitTeamProof={app.handleSubmitTeamProof}
          setCurrentTaskTeam={app.setCurrentTaskTeam}
          onOpenProofPreview={(data) => app.setProofPreviewData(data)}
        />
      )}

      {app.showExportModal && (
        <ExportModal
          isOpen={app.showExportModal}
          onClose={() => app.setShowExportModal(false)}
          user={app.user}
          isAdmin={app.isAdmin}
          isHOD={app.isHOD}
          isAdvisor={app.isAdvisor}
          departments={app.departments}
          classes={app.classes}
          tasks={app.tasks}
          users={app.users}
          reportFilters={reportFilters}
          setReportFilters={setReportFilters as any}
          isExporting={isExporting}
          isDownloadingProofs={isDownloadingProofs}
          downloadProgress={screenshotDownloadProgress?.percent || 0}
          totalDownloads={availableScreenshotCount}
          availableScreenshotCount={availableScreenshotCount}
          proofDownloadFormat={proofDownloadFormat}
          setProofDownloadFormat={setProofDownloadFormat}
          exportToExcel={async (filters) => {
            await exportToExcel(exportCtx, filters || reportFilters, () => app.setShowExportModal(false));
          }}
          downloadScreenshotsZip={async (filters) => {
            await downloadScreenshotsZip(exportCtx, filters || reportFilters);
          }}
          downloadScreenshotsPdf={async (filters) => {
            await downloadScreenshotsPdf(exportCtx, filters || reportFilters);
          }}
          screenshotDownloadProgress={screenshotDownloadProgress}
          abortScreenshotDownloadRef={abortScreenshotDownloadRef}
        />
      )}

      {app.extendingTask && (
        <ExtendDeadlineModal
          task={app.extendingTask}
          extendedDeadline={app.extendedDeadline}
          setExtendedDeadline={app.setExtendedDeadline}
          onClose={() => app.setExtendingTask(null)}
          onExtend={(taskId, newDeadline) => app.handleExtendDeadlineAndReopen(taskId, newDeadline)}
        />
      )}

      {app.showCreateNoticeModal && (
        <CreateNoticeModal
          isOpen={app.showCreateNoticeModal}
          onClose={() => app.setShowCreateNoticeModal(false)}
          noticeForm={{
            title: app.noticeForm.title,
            description: app.noticeForm.content,
            priority: app.noticeForm.priority,
            scope: app.noticeForm.scope,
            class_id: app.noticeForm.target_class_id,
            department_id: app.noticeForm.target_dept_id
          }}
          setNoticeForm={(val: any) => {
            if (typeof val === 'function') {
              app.setNoticeForm((prev: any) => {
                const updated = val({
                  title: prev.title,
                  description: prev.content,
                  priority: prev.priority,
                  scope: prev.scope,
                  class_id: prev.target_class_id,
                  department_id: prev.target_dept_id
                });
                return {
                  ...prev,
                  title: updated.title,
                  content: updated.description,
                  priority: updated.priority,
                  scope: updated.scope,
                  target_class_id: updated.class_id,
                  target_dept_id: updated.department_id
                };
              });
            }
          }}
          noticeFile={app.noticeAttachment}
          setNoticeFile={app.setNoticeAttachment}
          isPublishingNotice={app.isCreatingNotice}
          onSubmit={app.handleCreateNotice}
          user={app.user}
          classes={app.classes}
          isAdmin={app.isAdmin}
          isHOD={app.isHOD}
          isAdvisor={app.isAdvisor}
        />
      )}

      {app.showTelegramLinkModal && (
        <TelegramLinkModal
          isOpen={app.showTelegramLinkModal}
          onClose={() => app.setShowTelegramLinkModal(false)}
          user={app.user}
          telegramStats={app.user?.telegram_chat_id ? { currentUserLinked: true, currentUserTelegram: app.user.telegram_chat_id } : null}
          sendingTest={Boolean(app.sendingTelegramTest)}
          handleSendTestMessage={app.handleSendTestMessage}
          handleUnlinkTelegram={app.handleUnlinkTelegram}
        />
      )}

      {app.emailAlertTask && (
        <TaskDefaulterEmailModal
          emailAlertTask={app.emailAlertTask}
          onClose={() => app.setEmailAlertTask(null)}
          emailAlertPendingData={app.emailAlertPendingData}
          emailAlertSuccessStats={app.emailAlertSuccessStats}
          emailAlertSending={app.emailAlertSending}
          emailAlertLoading={app.emailAlertLoading}
          emailNodesStatus={app.emailNodesStatus}
          fetchingEmailStatus={app.fetchingEmailStatus}
          fetchEmailNodesStatus={app.fetchEmailNodesStatus}
          emailAlertCustomMsg={app.emailAlertCustomMsg}
          setEmailAlertCustomMsg={app.setEmailAlertCustomMsg}
          handleDispatchTaskPendingEmails={app.handleDispatchTaskPendingEmails}
          user={app.user}
          isAdmin={app.isAdmin}
          isHOD={app.isHOD}
          isAdvisor={app.isAdvisor}
        />
      )}

      {app.viewingStaffStudentProfile && (
        <StaffStudentProfileModal
          studentId={String(app.viewingStaffStudentProfile.id || app.viewingStaffStudentProfile)}
          token={app.token || ''}
          onClose={() => app.setViewingStaffStudentProfile(null)}
        />
      )}

      {app.proofPreviewData && (
        <ProofPreviewModal
          data={app.proofPreviewData}
          onClose={() => app.setProofPreviewData(null)}
        />
      )}
    </>
  );
}
