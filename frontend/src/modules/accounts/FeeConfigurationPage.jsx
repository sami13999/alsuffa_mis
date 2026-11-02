import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function FeeConfigurationPage() {
  const [feeHeads, setFeeHeads] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // Forms
  const [newHeadForm, setNewHeadForm] = useState({ name: '', description: '' });
  const [newRuleForm, setNewRuleForm] = useState({
    academic_year_id: 1,
    class_id: 1,
    fee_head_id: 1,
    amount: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [headsRes, structsRes, classesRes, sessionsRes] = await Promise.all([
        axiosClient.get('/fees/heads'),
        axiosClient.get('/fees/structures'),
        axiosClient.get('/academics/classes'),
        axiosClient.get('/academics/sessions')
      ]);

      if (headsRes.success) setFeeHeads(headsRes.data || []);
      if (structsRes.success) setFeeStructures(structsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (sessionsRes.success) setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load fee configuration data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Fee Head
  const handleCreateHead = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/fees/heads', newHeadForm);
      setMessage(`Fee head "${newHeadForm.name}" created successfully.`);
      setHeadModalOpen(false);
      setNewHeadForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Set Class Pricing Rule
  const handleSetRule = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/fees/structures', newRuleForm);
      setMessage('Class fee rule updated successfully in fee_structures.');
      setRuleModalOpen(false);
      setNewRuleForm({ academic_year_id: 1, class_id: 1, fee_head_id: 1, amount: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fee Heads & Class Pricing Rules
            </h1>
            <p className="text-xs text-slate-500">
              Manage Institutional Billing Categories and Configure Monthly Class Dues
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={Plus} onClick={() => setHeadModalOpen(true)}>
              New Fee Head
            </Button>
            <Button size="sm" variant="primary" icon={Plus} onClick={() => setRuleModalOpen(true)}>
              Set Class Fee Rule
            </Button>
          </div>
        </div>

        {/* Global Feedback */}
        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold">&times;</button>
          </div>
        )}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 font-bold">&times;</button>
          </div>
        )}

        {/* Available Heads */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Configured Fee Heads ({feeHeads.length})</h3>
            <span className="text-xs text-slate-400">Master entity catalog (`fee_heads`)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {feeHeads.map((h) => (
              <div key={h.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="font-bold text-sm text-slate-900">{h.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{h.description || 'Standard institutional charge'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Structures Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Class Fee Structure Rules ({feeStructures.length})</h3>
            <span className="text-xs text-slate-500">Connected to `fee_structures`</span>
          </div>
          <Table
            columns={[
              { title: 'Academic Session', key: 'session_name' },
              { title: 'Class', key: 'class_name' },
              {
                title: 'Fee Head',
                key: 'fee_head_name',
                render: (r) => <Badge variant="info">{r.fee_head_name}</Badge>
              },
              {
                title: 'Amount (PKR)',
                key: 'amount',
                render: (r) => (
                  <span className="font-bold text-slate-900">
                    PKR {parseFloat(r.amount).toLocaleString()}
                  </span>
                )
              }
            ]}
            data={feeStructures}
          />
        </div>

        {/* MODAL: ADD HEAD */}
        <Modal
          isOpen={headModalOpen}
          onClose={() => setHeadModalOpen(false)}
          title="Create New Fee Head"
        >
          <form onSubmit={handleCreateHead} className="space-y-4">
            <Input
              label="Fee Head Title"
              value={newHeadForm.name}
              onChange={(e) => setNewHeadForm({ ...newHeadForm, name: e.target.value })}
              placeholder="e.g. Science Laboratory Fee"
              required
            />
            <Input
              label="Description"
              value={newHeadForm.description}
              onChange={(e) => setNewHeadForm({ ...newHeadForm, description: e.target.value })}
              placeholder="e.g. Practical examination & apparatus maintenance"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setHeadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>Create Head</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: SET CLASS FEE RULE */}
        <Modal
          isOpen={ruleModalOpen}
          onClose={() => setRuleModalOpen(false)}
          title="Set Class Fee Structure Rule"
        >
          <form onSubmit={handleSetRule} className="space-y-4">
            <Select
              label="Academic Session"
              value={newRuleForm.academic_year_id}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, academic_year_id: parseInt(e.target.value, 10) })}
              options={sessions.map((s) => ({ value: s.id, label: s.session_name }))}
              required
            />
            <Select
              label="Target Class"
              value={newRuleForm.class_id}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, class_id: parseInt(e.target.value, 10) })}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
            <Select
              label="Fee Head"
              value={newRuleForm.fee_head_id}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, fee_head_id: parseInt(e.target.value, 10) })}
              options={feeHeads.map((h) => ({ value: h.id, label: h.name }))}
              required
            />
            <Input
              label="Monthly Fee Amount (PKR)"
              type="number"
              value={newRuleForm.amount}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, amount: e.target.value })}
              placeholder="e.g. 6500"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRuleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>Save Rule</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

