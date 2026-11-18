import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { API_URL } from '../../config';
import type { Department, ToastType } from '../../types';

export interface DepartmentsViewProps {
  departments: Department[];
  token: string | null;
  onRefresh: () => void;
  addToast?: (msg: string, type?: ToastType) => void;
}

export function DepartmentsView({
  departments,
  token,
  onRefresh,
  addToast = () => {},
}: DepartmentsViewProps) {
  const [newDept, setNewDept] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newDept }),
      });
      if (res.ok) {
        setNewDept('');
        addToast('Department created successfully', 'success');
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to create department', 'error');
      }
    } catch {
      addToast('Network error while creating department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDepartment = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`${API_URL}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        addToast('Department deleted successfully', 'success');
        onRefresh();
      } else {
        addToast('Failed to delete department', 'error');
      }
    } catch {
      addToast('Network error while deleting department', 'error');
    }
  };

  return (
    <motion.div
      key="departments"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col min-h-0"
    >
      <PageLayout>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Create New Department</h3>
          <form onSubmit={createDepartment} className="flex gap-4">
            <Input
              placeholder="Enter official department name (e.g. Information Technology)"
              value={newDept}
              onChange={e => setNewDept(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSubmitting} className="whitespace-nowrap flex items-center gap-2">
              <Plus size={18} /> {isSubmitting ? 'Creating...' : 'Create Department'}
            </Button>
          </form>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <Card key={dept.id} className="flex items-center justify-between group p-5">
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{dept.name}</p>
                <p className="text-xs text-zinc-500">ID: {dept.id}</p>
              </div>
              <button
                onClick={() => deleteDepartment(dept.id)}
                className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                title="Delete Department"
              >
                <Trash2 size={18} />
              </button>
            </Card>
          ))}
        </div>
      </PageLayout>
    </motion.div>
  );
}

export default DepartmentsView;
