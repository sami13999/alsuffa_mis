import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import {
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Search
} from 'lucide-react';

export default function BulkVouchersPage() {
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [monthFilter, setMonthFilter] = useState('2026-11');
  const [loading, setLoading] = useState(true);

  // Form
  const [genForm, setGenForm] = useState({
    academic_year_id: 1,
    class_id: 1,
    month_year: '2026-11',
    issue_date: '2026-11-01',
    due_date: '2026-11-15'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, sessionsRes, vouchersRes] = await Promise.all([
        axiosClient.get('/academics/classes'),
        axiosClient.get('/academics/sessions'),
        axiosClient.get('/fees/vouchers', { params: { monthYear: monthFilter } })
      ]);

      if (classesRes.success) setClasses(classesRes.data || []);
      if (sessionsRes.success) setSessions(sessionsRes.data || []);
      if (vouchersRes.success) setVouchers(vouchersRes.data || []);
    } catch (err) {
      console.error('Failed to load vouchers:', err.message);
    } finally {
      setLoading(false);
    }
  }, [monthFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bulk Generation Handler
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await axiosClient.post('/fees/vouchers/generate', genForm);
      setMessage(res.message);
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
              Bulk Monthly Fee Voucher Generation
            </h1>
            <p className="text-xs text-slate-500">
              Bulk populate `fee_vouchers` and itemized `fee_voucher_items` for active class enrollments
            </p>
          </div>

          <Link to="/accounts/pos">
            <Button variant="outline" size="sm" icon={Receipt}>
              Open POS Payment Counter
            </Button>
          </Link>
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

        {/* Generator Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2>Batch Invoice Engine</h2>
          </div>

          <form onSubmit={handleBulkGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select
                label="Session"
                value={genForm.academic_year_id}
                onChange={(e) => setGenForm({ ...genForm, academic_year_id: parseInt(e.target.value, 10) })}
                options={sessions.map((s) => ({ value: s.id, label: s.session_name }))}
                required
              />
              <Select
                label="Target Class"
                value={genForm.class_id}
                onChange={(e) => setGenForm({ ...genForm, class_id: parseInt(e.target.value, 10) })}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                required
              />
              <Input
                label="Billing Month"
                value={genForm.month_year}
                onChange={(e) => setGenForm({ ...genForm, month_year: e.target.value })}
                placeholder="2026-11"
                required
              />
              <Input
                label="Issue Date"
                type="date"
                value={genForm.issue_date}
                onChange={(e) => setGenForm({ ...genForm, issue_date: e.target.value })}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={genForm.due_date}
                onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={actionLoading} icon={FileText} size="md">
                Generate Invoices For Class
              </Button>
            </div>
          </form>
        </div>

        {/* Generated Invoices Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">
              Vouchers for Month ({vouchers.length})
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Filter Month:</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <Table
            columns={[
              {
                title: 'Voucher Number',
                key: 'voucher_no',
                render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.voucher_no}</span>
              },
              {
                title: 'Student Name',
                key: 'student',
                render: (r) => (
                  <div>
                    <div className="font-semibold text-slate-900">{r.first_name} {r.last_name}</div>
                    <div className="text-xs text-slate-500">Adm: {r.admission_no}</div>
                  </div>
                )
              },
              {
                title: 'Class & Section',
                key: 'class',
                render: (r) => `${r.class_name || 'N/A'} - ${r.section_name || ''} (Roll #${r.roll_number || 'N/A'})`
              },
              { title: 'Due Date', key: 'due_date' },
              {
                title: 'Total Payable',
                key: 'total',
                render: (r) => `PKR ${parseFloat(r.total_amount).toLocaleString()}`
              },
              {
                title: 'Paid Amount',
                key: 'paid',
                render: (r) => `PKR ${parseFloat(r.paid_amount).toLocaleString()}`
              },
              {
                title: 'Status',
                key: 'status',
                render: (r) => (
                  <Badge
                    variant={
                      r.status === 'paid'
                        ? 'success'
                        : r.status === 'partially_paid'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {r.status?.toUpperCase()}
                  </Badge>
                )
              }
            ]}
            data={vouchers}
            emptyMessage="No fee vouchers found for the selected billing month."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

