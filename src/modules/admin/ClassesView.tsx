import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Building2, ClipboardList, Users, Download, Loader2 } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatCard } from '../../components/ui/StatCard';
import { API_URL } from '../../config';
import type { Class, Department, User, ToastType } from '../../types';

export interface ClassesViewProps {
  isAdvisorMode?: boolean;
  classes: Class[];
  departments: Department[];
  myClass: Class | null;
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  onRefresh: () => void;
  addToast?: (msg: string, type?: ToastType) => void;
}

export function ClassesView({
  isAdvisorMode = false,
  classes,
  departments,
  myClass,
  user,
  token,
  isAdmin,
  isHOD,
  isAdvisor,
  onRefresh,
  addToast = () => {},
}: ClassesViewProps) {
  const [newClass, setNewClass] = useState({
    name: '',
    year: '',
    batch: '',
    department_id: user?.department_id ? String(user.department_id) : (departments[0]?.id ? String(departments[0].id) : ''),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingBulkResumes, setIsExportingBulkResumes] = useState(false);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim() || !newClass.year || !newClass.batch) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newClass.name,
          year: parseInt(newClass.year, 10),
          batch: newClass.batch,
          department_id: isAdmin ? newClass.department_id : user?.department_id,
        }),
      });
      if (res.ok) {
        setNewClass({
          name: '',
          year: '',
          batch: '',
          department_id: user?.department_id ? String(user.department_id) : (departments[0]?.id ? String(departments[0].id) : ''),
        });
        addToast('Class section created successfully', 'success');
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to create class section', 'error');
      }
    } catch {
      addToast('Network error while creating class section', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteClass = async (id: string | number) => {
    if (!confirm('Are you sure? This will delete all students and tasks associated with this class.')) return;
    try {
      const res = await fetch(`${API_URL}/api/classes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        addToast('Class section deleted successfully', 'success');
        onRefresh();
      } else {
        addToast('Failed to delete class section', 'error');
      }
    } catch {
      addToast('Network error while deleting class section', 'error');
    }
  };

  const handleBulkDownloadProfiles = async (classId?: string) => {
    if (!classId) return;
    setIsExportingBulkResumes(true);
    addToast('Querying student profiles for class resume export...', 'info');
    try {
      const res = await fetch(`${API_URL}/api/student/bulk-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ class_id: classId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch student profiles for export');
      }

      const data = await res.json();
      const profiles: any[] = data.profiles || [];
      if (profiles.length === 0) {
        addToast('No student profile data found to export', 'warning');
        return;
      }

      addToast(`Compiling Resume PDFs for ${profiles.length} students...`, 'info');

      const [jszipModule, { generateStudentResumePdf }] = await Promise.all([
        import('jszip'),
        import('../../utils/pdf/studentProfilePdfGenerator'),
      ]);
      const JSZip = (jszipModule.default || jszipModule) as any;
      const zip = new JSZip();

      for (const p of profiles) {
        try {
          const doc = await generateStudentResumePdf(p);
          const pdfBlob = doc.output('blob');
          const regNo = p.academic?.register_number || 'Student';
          const name = (p.academic?.full_name || 'Profile').trim().replace(/\s+/g, '_');
          zip.file(`${regNo}_${name}_Resume.pdf`, pdfBlob);
        } catch (docErr) {
          console.warn('Failed to generate PDF for student:', p.academic?.register_number, docErr);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      const classNameClean = (myClass?.name || classId).replace(/\s+/g, '_');
      link.download = `Class_${classNameClean}_Resumes_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(`Successfully downloaded ${profiles.length} student resumes (.zip)!`, 'success');
    } catch (err: any) {
      console.error('Bulk download error:', err);
      addToast(err.message || 'Failed to download class resumes', 'error');
    } finally {
      setIsExportingBulkResumes(false);
    }
  };

  if (isAdvisorMode && isAdvisor) {
    return (
      <motion.div
        key="my-class"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full flex flex-col min-h-0"
      >
        <PageLayout>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Class Details</h3>
            <form onSubmit={createClass} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Class Name</label>
                  <Input
                    value={newClass.name !== undefined && newClass.name !== '' ? newClass.name : (myClass?.name || '')}
                    onChange={e => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Year</label>
                  <Input
                    type="number"
                    value={newClass.year !== undefined && newClass.year !== '' ? newClass.year : (myClass?.year || '')}
                    onChange={e => setNewClass(prev => ({ ...prev, year: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Batch</label>
                  <Input
                    value={newClass.batch !== undefined && newClass.batch !== '' ? newClass.batch : (myClass?.batch || '')}
                    onChange={e => setNewClass(prev => ({ ...prev, batch: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                <Plus size={18} /> Update Class Info
              </Button>
            </form>
          </Card>

          {myClass && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Class Name" value={myClass.name as any} icon={<Building2 />} color="indigo" />
                <StatCard title="Year" value={myClass.year as any} icon={<ClipboardList />} color="emerald" />
                <StatCard title="Batch" value={myClass.batch as any} icon={<Users />} color="amber" />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleBulkDownloadProfiles(myClass.id?.toString())}
                  disabled={isExportingBulkResumes}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  {isExportingBulkResumes ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isExportingBulkResumes ? 'Compiling Class Resumes...' : `Download All ${myClass.name} Resumes (.zip)`}</span>
                </button>
              </div>
            </div>
          )}
        </PageLayout>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="classes"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col min-h-0"
    >
      <PageLayout>
        <Card className="p-6 mb-6">
          <h3 className="text-base font-extrabold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Plus size={18} className="text-indigo-600" /> Create New Class Section
          </h3>
          <form onSubmit={createClass} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class Name</label>
                <Input
                  placeholder="e.g. IT-A"
                  value={newClass.name}
                  onChange={e => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Year</label>
                <select
                  value={newClass.year}
                  onChange={e => setNewClass(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#181820] text-zinc-700 dark:text-zinc-200"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Batch</label>
                <Input
                  placeholder="e.g. 2023-2027"
                  value={newClass.batch}
                  onChange={e => setNewClass(prev => ({ ...prev, batch: e.target.value }))}
                  required
                />
              </div>
              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Department</label>
                  <select
                    value={newClass.department_id}
                    onChange={e => setNewClass(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#181820] text-zinc-700 dark:text-zinc-200"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                <Plus size={18} /> {isSubmitting ? 'Adding...' : 'Add Class Section'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes
            .slice()
            .sort((a, b) => (a.year || 0) - (b.year || 0) || (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }))
            .map(c => (
              <Card key={c.id} className="relative overflow-hidden group border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors p-5">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -mr-4 -mt-4 rounded-full" />
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Building2 size={20} />
                    </div>
                    <button
                      onClick={() => deleteClass(c.id)}
                      className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                      title="Delete Class"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h4 className="font-black text-lg text-zinc-900 dark:text-zinc-100 mb-1">{c.name}</h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-tight">
                    <span>Year {c.year}</span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                    <span>{c.batch}</span>
                  </div>
                  <div className="mt-auto pt-6 flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Class ID: {c.id}</span>
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">Class Pool</span>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </PageLayout>
    </motion.div>
  );
}

export default ClassesView;
