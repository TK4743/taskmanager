import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, Zap, ShieldCheck, Clock, CheckCircle2,
  AlertTriangle, RotateCw, Activity, Terminal, Shield, Loader2,
  Send, Archive, Download, Trash2
} from 'lucide-react';
import { API_URL } from '../../config';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { ToastType } from '../../types';

export function SystemAutomationControlsCard({
  token,
  addToast,
}: {
  token: string | null;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) {
  const [controls, setControls] = useState<{
    telegram_automation_enabled: boolean;
    backup_service_enabled: boolean;
  }>({
    telegram_automation_enabled: false,
    backup_service_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [exportingManualSnapshot, setExportingManualSnapshot] = useState(false);
  const [purgingScreenshots, setPurgingScreenshots] = useState(false);

  const fetchControls = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/system-controls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.controls) {
          setControls(data.controls);
        }
      }
    } catch (err) {
      console.error('Error fetching system controls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, [token]);

  const handleToggle = async (key: 'telegram_automation_enabled' | 'backup_service_enabled') => {
    if (!token || toggling) return;
    const currentVal = controls[key];
    const nextVal = !currentVal;
    setToggling(key);

    // 1. Instant optimistic UI toggle
    setControls(prev => ({ ...prev, [key]: nextVal }));

    const featureName = key === 'telegram_automation_enabled' ? 'Telegram automation' : 'Backup service';
    const statusText = nextVal ? 'turned ON' : 'turned OFF';

    try {
      const res = await fetch(`${API_URL}/api/admin/system-controls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: nextVal })
      });
      const data = await res.json();
      if (res.ok && data.controls) {
        setControls(data.controls);
        addToast(`${featureName} ${statusText}`, nextVal ? 'success' : 'info');
      } else {
        // Automatic rollback if the network call fails
        setControls(prev => ({ ...prev, [key]: currentVal }));
        addToast(data.error || `Failed to update ${featureName}`, 'error');
      }
    } catch {
      // Automatic rollback if network call fails
      setControls(prev => ({ ...prev, [key]: currentVal }));
      addToast(`Error updating ${featureName}. Reverted to previous state.`, 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleExportManualSnapshot = async () => {
    if (!token) return;
    setExportingManualSnapshot(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/export-db-snapshot`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `db_backup_manual_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        addToast('Database snapshot exported successfully!', 'success');
      } else {
        addToast('Failed to export database snapshot', 'error');
      }
    } catch {
      addToast('Error downloading database snapshot', 'error');
    } finally {
      setExportingManualSnapshot(false);
    }
  };

  const handlePurgeScreenshotsNow = async () => {
    if (!token) return;
    if (!confirm('Purge all task submission screenshots older than 30 days? This will permanently free storage.')) return;
    setPurgingScreenshots(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/purge-old-screenshots`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Purged screenshots older than 30 days!', 'success');
      } else {
        addToast(data.error || 'Failed to purge screenshots', 'error');
      }
    } catch {
      addToast('Error purging screenshots', 'error');
    } finally {
      setPurgingScreenshots(false);
    }
  };

  return (
    <Card className="p-6 bg-white border-zinc-200 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-zinc-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-md shadow-zinc-950/20 shrink-0">
            <Shield size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              System Automation & Backup Controls
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                Master Switches
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              Easily toggle background Telegram automations and automated database backup snapshot services
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50 shrink-0 flex items-center gap-1.5"
          onClick={fetchControls}
          disabled={loading}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
          <span>Refresh Controls</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Telegram Automation Control */}
        <div className={`p-5 rounded-2xl border transition-all ${
          controls.telegram_automation_enabled 
            ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
            : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  controls.telegram_automation_enabled ? 'bg-emerald-600 text-white shadow-sm' : 'bg-zinc-200 text-zinc-500'
                }`}>
                  <Send size={16} className="-rotate-12" />
                </div>
                <h4 className="font-extrabold text-zinc-900 text-sm">Telegram Automation</h4>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Controls automated morning/evening group summaries, 24-hr deadline alerts, and 1-to-1 reminders.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between">
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
              controls.telegram_automation_enabled
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-zinc-200/80 text-zinc-700 border-zinc-300'
            }`}>
              {controls.telegram_automation_enabled ? '🟢 ACTIVE' : '⏸️ PAUSED (OFF)'}
            </span>

            {/* Switch Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={controls.telegram_automation_enabled}
                disabled={toggling === 'telegram_automation_enabled'}
                onClick={() => handleToggle('telegram_automation_enabled')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  controls.telegram_automation_enabled ? 'bg-emerald-600' : 'bg-zinc-300'
                } ${toggling === 'telegram_automation_enabled' ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span className="sr-only">Toggle Telegram Automation</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    controls.telegram_automation_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <Button
                variant={controls.telegram_automation_enabled ? 'outline' : 'primary'}
                className={`text-xs py-1.5 px-3 font-black ${
                  controls.telegram_automation_enabled
                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                }`}
                disabled={toggling === 'telegram_automation_enabled'}
                onClick={() => handleToggle('telegram_automation_enabled')}
              >
                {toggling === 'telegram_automation_enabled' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : controls.telegram_automation_enabled ? (
                  <span>Turn OFF</span>
                ) : (
                  <span>Turn ON</span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Automated Backup Service Control */}
        <div className={`p-5 rounded-2xl border transition-all ${
          controls.backup_service_enabled 
            ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
            : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  controls.backup_service_enabled ? 'bg-indigo-600 text-white shadow-sm' : 'bg-zinc-200 text-zinc-500'
                }`}>
                  <Archive size={16} />
                </div>
                <h4 className="font-extrabold text-zinc-900 text-sm">Automated Backup Service</h4>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Controls scheduled database snapshots, pre-deadline task ZIP archives, and GitHub auto-commits.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between">
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
              controls.backup_service_enabled
                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                : 'bg-zinc-200/80 text-zinc-700 border-zinc-300'
            }`}>
              {controls.backup_service_enabled ? '🟢 ACTIVE' : '⏸️ PAUSED (OFF)'}
            </span>

            {/* Switch Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={controls.backup_service_enabled}
                disabled={toggling === 'backup_service_enabled'}
                onClick={() => handleToggle('backup_service_enabled')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  controls.backup_service_enabled ? 'bg-indigo-600' : 'bg-zinc-300'
                } ${toggling === 'backup_service_enabled' ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span className="sr-only">Toggle Backup Service</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    controls.backup_service_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <Button
                variant={controls.backup_service_enabled ? 'outline' : 'primary'}
                className={`text-xs py-1.5 px-3 font-black ${
                  controls.backup_service_enabled
                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }`}
                disabled={toggling === 'backup_service_enabled'}
                onClick={() => handleToggle('backup_service_enabled')}
              >
                {toggling === 'backup_service_enabled' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : controls.backup_service_enabled ? (
                  <span>Turn OFF</span>
                ) : (
                  <span>Turn ON</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Manual Emergency Actions */}
      <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Manual Supreme Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold border-zinc-200 text-zinc-800 hover:bg-zinc-50 flex items-center gap-1.5"
            onClick={handleExportManualSnapshot}
            disabled={exportingManualSnapshot}
          >
            {exportingManualSnapshot ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>Export Manual DB Snapshot</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1.5"
            onClick={handlePurgeScreenshotsNow}
            disabled={purgingScreenshots}
          >
            {purgingScreenshots ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            <span>Purge 30-Day Screenshots</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}


export default SystemAutomationControlsCard;
