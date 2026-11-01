import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import {
  CreditCard,
  DollarSign,
  Clock,
  Printer,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  UserCheck
} from 'lucide-react';

export default function AccountsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Fee configuration state
  const [feeHeads, setFeeHeads] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Bulk Generation state
  const [genForm, setGenForm] = useState({
    academic_year_id: 1,
    class_id: 1,
    month_year: '2026-11',
    issue_date: '2026-11-01',
    due_date: '2026-11-15'
  });

  // POS & Vouchers state
  const [vouchers, setVouchers] = useState([]);
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherStatusFilter, setVoucherStatusFilter] = useState('');

  // Payment Collection Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_method: 'cash',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  // Challan Print Modal
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [challanData, setChallanData] = useState(null);

  // Payroll state
  const [payrollMonth, setPayrollMonth] = useState('2026-10');
  const [payrollRecords, setPayrollRecords] = useState([]);

  // Add Head / Rule Modal
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
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

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, headsRes, classesRes, sessionsRes] = await Promise.all([
        axiosClient.get('/fees/stats'),
        axiosClient.get('/fees/heads'),
        axiosClient.get('/academics/classes'),
        axiosClient.get('/academics/sessions')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (headsRes.success) setFeeHeads(headsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (sessionsRes.success) setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load accounts stats:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Tab-specific data fetch
  useEffect(() => {
    if (activeTab === 'structures') {
      axiosClient.get('/fees/structures').then((res) => setFeeStructures(res.data || [])).catch(console.error);
    } else if (activeTab === 'pos') {
      axiosClient.get('/fees/vouchers', {
        params: { search: voucherSearch, status: voucherStatusFilter || undefined }
      }).then((res) => setVouchers(res.data || [])).catch(console.error);
    } else if (activeTab === 'payroll') {
      axiosClient.get('/staff/payroll', { params: { monthYear: payrollMonth } })
        .then((res) => setPayrollRecords(res.data || [])).catch(console.error);
    }
  }, [activeTab, voucherSearch, voucherStatusFilter, payrollMonth]);

  // Bulk Generation Handler
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await axiosClient.post('/fees/vouchers/generate', genForm);
      setMessage(res.message);
      loadInitialData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Payment Submit Handler
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post('/fees/payments/collect', {
        voucher_id: selectedVoucher.id,
        ...paymentForm
      });
      setMessage(res.message);
      setPayModalOpen(false);
      // Reload vouchers & stats
      const vRes = await axiosClient.get('/fees/vouchers', {
        params: { search: voucherSearch, status: voucherStatusFilter || undefined }
      });
      setVouchers(vRes.data || []);
      loadInitialData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Challan Print View
  const handleOpenChallan = async (voucherId) => {
    try {
      const res = await axiosClient.get(`/fees/vouchers/${voucherId}/challan`);
      if (res.success) {
        setChallanData(res.data);
        setChallanModalOpen(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Payroll Generation Handler
  const handleGeneratePayroll = async () => {
    if (!payrollMonth) return;
    setActionLoading(true);
    try {
      const res = await axiosClient.post('/staff/payroll/generate', { monthYear: payrollMonth });
      setMessage(res.message);
      const pRes = await axiosClient.get('/staff/payroll', { params: { monthYear: payrollMonth } });
      setPayrollRecords(pRes.data || []);
      loadInitialData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Disburse individual salary
  const handleDisburseSalary = async (payrollId) => {
    try {
      await axiosClient.patch(`/staff/payroll/${payrollId}/pay`, {});
      const pRes = await axiosClient.get('/staff/payroll', { params: { monthYear: payrollMonth } });
      setPayrollRecords(pRes.data || []);
      loadInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Accounts & Financial Operations
            </h1>
            <p className="text-xs text-slate-500">
              Fee Structure Rules, Bulk Billing, POS Collection & Payroll
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadInitialData} disabled={loading}>
              Sync Financials
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={() => setActiveTab('pos')}
            >
              Fee Collection POS
            </Button>
          </div>
        </div>

        {/* Global Alert Messages */}
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

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1 text-sm font-medium">
          {[
            { id: 'overview', label: 'Financial Overview', icon: DollarSign },
            { id: 'structures', label: 'Fee Configuration', icon: CreditCard },
            { id: 'vouchers', label: 'Bulk Voucher Generation', icon: FileText },
            { id: 'pos', label: 'Fee Collection POS', icon: Building },
            { id: 'payroll', label: 'Staff Payroll Disbursement', icon: UserCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition ${
                  active
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: FINANCIAL OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Billed Invoices"
                value={`PKR ${stats.total_billed.toLocaleString()}`}
                subtitle="Total voucher billing"
                icon={CreditCard}
                color="blue"
              />
              <StatCard
                title="Total Collected"
                value={`PKR ${stats.total_collected.toLocaleString()}`}
                subtitle={`${stats.collection_rate}% Overall Collection Rate`}
                icon={DollarSign}
                color="emerald"
              />
              <StatCard
                title="Outstanding Dues"
                value={`PKR ${stats.outstanding_dues.toLocaleString()}`}
                subtitle="Pending student arrears"
                icon={Clock}
                color="rose"
              />
              <StatCard
                title="Pending Payroll"
                value={`PKR ${stats.pending_payroll.toLocaleString()}`}
                subtitle="Undisbursed staff salaries"
                icon={UserCheck}
                color="amber"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Financial Flow Summary</h3>
              <p className="text-xs text-slate-500 mb-6">
                Real-time ledger analysis connected directly to MySQL 8.0 `fee_vouchers`, `fee_payments`, and `payroll` tables.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <div className="text-xs font-semibold uppercase text-emerald-800">Net Campus Revenue</div>
                  <div className="text-2xl font-bold text-emerald-950 mt-1">
                    PKR {(stats.total_collected - stats.pending_payroll).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">Gross Collections minus Pending Payroll</div>
                </div>
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                  <div className="text-xs font-semibold uppercase text-blue-800">Target Monthly Recovery</div>
                  <div className="text-2xl font-bold text-blue-950 mt-1">
                    {stats.collection_rate}%
                  </div>
                  <div className="text-[11px] text-blue-700 mt-1">Target baseline: 85%+</div>
                </div>
                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
                  <div className="text-xs font-semibold uppercase text-purple-800">Operational Accounts</div>
                  <div className="text-2xl font-bold text-purple-950 mt-1">Meezan Bank</div>
                  <div className="text-[11px] text-purple-700 mt-1">A/C: 0102-0103984712 (Active)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FEE CONFIGURATION */}
        {activeTab === 'structures' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Fee Heads & Class Pricing Rules</h2>
                <p className="text-xs text-slate-500">Configure itemized heads and map monthly amounts per class</p>
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

            {/* Fee Heads List */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Available Fee Heads ({feeHeads.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {feeHeads.map((h) => (
                  <div key={h.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="font-bold text-sm text-slate-900">{h.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{h.description || 'Standard academic head'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Structures Table */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Class Structure Matrix (`fee_structures`)</h3>
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
          </div>
        )}

        {/* TAB 3: BULK VOUCHER GENERATION */}
        {activeTab === 'vouchers' && (
          <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bulk Fee Voucher Generator</h2>
              <p className="text-xs text-slate-500">
                Populates `fee_vouchers` and itemized `fee_voucher_items` for every active enrolled student in the selected class. Skips duplicates automatically.
              </p>
            </div>

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Academic Session"
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Billing Month (YYYY-MM)"
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

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <Button type="submit" loading={actionLoading} icon={FileText} size="lg">
                  Run Bulk Voucher Generation
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: FEE COLLECTION POS */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Fee Collection Point of Sale (POS)</h2>
                <p className="text-xs text-slate-500">
                  Search by student name, admission number, or voucher code. Collect payments & print 3-copy Challans.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search voucher or student..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={voucherStatusFilter}
                  onChange={(e) => setVoucherStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <Table
              columns={[
                {
                  title: 'Voucher Number',
                  key: 'voucher_no',
                  render: (r) => <span className="font-mono text-xs font-semibold text-slate-900">{r.voucher_no}</span>
                },
                {
                  title: 'Student & Father',
                  key: 'student',
                  render: (r) => (
                    <div>
                      <div className="font-semibold text-slate-900">{r.first_name} {r.last_name}</div>
                      <div className="text-xs text-slate-500">Adm: {r.admission_no} | S/O {r.father_name}</div>
                    </div>
                  )
                },
                {
                  title: 'Class',
                  key: 'class',
                  render: (r) => `${r.class_name || 'N/A'} - ${r.section_name || ''} (Roll #${r.roll_number || 'N/A'})`
                },
                { title: 'Billing Month', key: 'month_year' },
                {
                  title: 'Total Payable',
                  key: 'total',
                  render: (r) => `PKR ${parseFloat(r.total_amount).toLocaleString()}`
                },
                {
                  title: 'Paid Amount',
                  key: 'paid',
                  render: (r) => (
                    <span className="font-semibold text-emerald-700">
                      PKR {parseFloat(r.paid_amount).toLocaleString()}
                    </span>
                  )
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
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      {r.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedVoucher(r);
                            const remaining = parseFloat(r.total_amount) - parseFloat(r.discount_amount) - parseFloat(r.paid_amount);
                            setPaymentForm({
                              amount_paid: remaining,
                              payment_method: 'cash',
                              transaction_reference: '',
                              payment_date: new Date().toISOString().split('T')[0]
                            });
                            setError(null);
                            setPayModalOpen(true);
                          }}
                        >
                          Collect Fee
                        </Button>
                      )}
                      <button
                        onClick={() => handleOpenChallan(r.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        title="Print 3-Copy Challan"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Challan</span>
                      </button>
                    </div>
                  )
                }
              ]}
              data={vouchers}
            />
          </div>
        )}

        {/* TAB 5: STAFF PAYROLL */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Staff Payroll Disbursement</h2>
                <p className="text-xs text-slate-500">
                  Generate monthly payroll from base salaries & process employee disbursements
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
                <Button size="sm" variant="primary" onClick={handleGeneratePayroll} loading={actionLoading}>
                  Generate Payroll ({payrollMonth})
                </Button>
              </div>
            </div>

            <Table
              columns={[
                { title: 'Emp Code', key: 'employee_code' },
                {
                  title: 'Staff Member',
                  key: 'name',
                  render: (r) => (
                    <div>
                      <div className="font-semibold text-slate-900">{r.first_name} {r.last_name}</div>
                      <div className="text-xs text-slate-500">{r.designation}</div>
                    </div>
                  )
                },
                { title: 'Month', key: 'month_year' },
                {
                  title: 'Basic Salary',
                  key: 'basic',
                  render: (r) => `PKR ${parseFloat(r.basic_salary).toLocaleString()}`
                },
                {
                  title: 'Net Salary',
                  key: 'net',
                  render: (r) => (
                    <span className="font-bold text-slate-900">
                      PKR {parseFloat(r.net_salary).toLocaleString()}
                    </span>
                  )
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (r) => (
                    <Badge variant={r.payment_status === 'paid' ? 'success' : 'warning'}>
                      {r.payment_status?.toUpperCase()}
                    </Badge>
                  )
                },
                {
                  title: 'Disbursement Date',
                  key: 'date',
                  render: (r) => (r.payment_date ? new Date(r.payment_date).toLocaleDateString() : 'Pending')
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (r) =>
                    r.payment_status !== 'paid' ? (
                      <Button size="sm" variant="success" onClick={() => handleDisburseSalary(r.id)}>
                        Mark as Paid
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                      </span>
                    )
                }
              ]}
              data={payrollRecords}
            />
          </div>
        )}

        {/* MODAL: COLLECT PAYMENT */}
        <Modal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          title="Collect Fee Payment (POS Counter)"
          subtitle={`Voucher: ${selectedVoucher?.voucher_no} - Student: ${selectedVoucher?.first_name} ${selectedVoucher?.last_name}`}
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <div className="text-slate-500">Total Voucher Amount</div>
                <div className="font-bold text-slate-900 text-sm">
                  PKR {parseFloat(selectedVoucher?.total_amount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Already Paid</div>
                <div className="font-bold text-emerald-600 text-sm">
                  PKR {parseFloat(selectedVoucher?.paid_amount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Remaining Balance</div>
                <div className="font-bold text-rose-600 text-sm">
                  PKR {(parseFloat(selectedVoucher?.total_amount || 0) - parseFloat(selectedVoucher?.paid_amount || 0)).toLocaleString()}
                </div>
              </div>
            </div>

            <Input
              label="Amount to Collect (PKR)"
              type="number"
              step="0.01"
              value={paymentForm.amount_paid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Payment Method"
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                options={[
                  { value: 'cash', label: 'Cash Counter' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'cheque', label: 'Cheque' },
                  { value: 'online', label: 'Online Deposit' }
                ]}
                required
              />
              <Input
                label="Payment Date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                required
              />
            </div>

            <Input
              label="Transaction / Deposit Reference"
              value={paymentForm.transaction_reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
              placeholder="e.g. Cash Receipt # or Bank Slip ID"
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading} icon={DollarSign}>
                Record Payment & Issue Receipt
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: 3-COPY CHALLAN PRINT PREVIEW */}
        <Modal
          isOpen={challanModalOpen}
          onClose={() => setChallanModalOpen(false)}
          title="Printable 3-Copy Fee Challan"
          subtitle="Official Bank, School, and Student copies conforming to Pakistani banking standards"
          maxWidth="max-w-5xl"
        >
          {challanData && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print Challan
                </Button>
              </div>

              {/* 3 Columns for 3 Copies */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] border border-slate-300 p-3 bg-white rounded-lg">
                {['Bank Copy', 'School Copy', 'Student Copy'].map((copyTitle) => (
                  <div key={copyTitle} className="border border-slate-300 p-3 rounded space-y-2 bg-slate-50/40">
                    <div className="text-center border-b border-slate-300 pb-2">
                      <div className="font-extrabold text-xs text-slate-900">AL SUFFA EDUCATION SYSTEM</div>
                      <div className="text-[10px] text-slate-500">Sector H-11, Islamabad &bull; Ph: 051-1234567</div>
                      <div className="font-bold text-emerald-800 uppercase tracking-widest mt-1 text-[10px]">
                        -- {copyTitle} --
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span className="font-medium">Challan No:</span>
                        <span className="font-bold font-mono">{challanData.voucher.voucher_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span className="font-semibold text-rose-700">{challanData.voucher.due_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student:</span>
                        <span className="font-semibold text-slate-900">
                          {challanData.voucher.first_name} {challanData.voucher.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Father Name:</span>
                        <span>{challanData.voucher.father_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Admission No:</span>
                        <span className="font-mono">{challanData.voucher.admission_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Class & Section:</span>
                        <span>{challanData.voucher.class_name} ({challanData.voucher.section_name})</span>
                      </div>
                    </div>

                    <div className="border-t border-b border-slate-300 py-1.5 space-y-1">
                      <div className="font-bold text-[10px] text-slate-500 uppercase">Fee Breakdown:</div>
                      {challanData.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.fee_head_name}</span>
                          <span className="font-mono">PKR {parseFloat(item.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between font-bold text-xs pt-1 text-slate-900">
                      <span>Total Payable:</span>
                      <span>PKR {parseFloat(challanData.voucher.total_amount).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-xs text-emerald-800">
                      <span>Paid Amount:</span>
                      <span>PKR {parseFloat(challanData.voucher.paid_amount).toLocaleString()}</span>
                    </div>

                    <div className="border-t border-slate-300 pt-3 text-[10px] space-y-3">
                      <div>
                        <div className="font-semibold text-slate-800">Bank Details:</div>
                        <div>{challanData.bank_details.bank_name}</div>
                        <div>A/C: {challanData.bank_details.account_number}</div>
                      </div>
                      <div className="flex justify-between pt-6 border-t border-dashed border-slate-300 text-slate-500">
                        <span>Bank Officer Stamp</span>
                        <span>Cashier Sign</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: ADD FEE HEAD */}
        <Modal
          isOpen={headModalOpen}
          onClose={() => setHeadModalOpen(false)}
          title="Create New Fee Head"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await axiosClient.post('/fees/heads', newHeadForm);
                setHeadModalOpen(false);
                const hRes = await axiosClient.get('/fees/heads');
                setFeeHeads(hRes.data || []);
              } catch (err) {
                alert(err.message);
              }
            }}
            className="space-y-4"
          >
            <Input
              label="Fee Head Name"
              value={newHeadForm.name}
              onChange={(e) => setNewHeadForm({ ...newHeadForm, name: e.target.value })}
              placeholder="e.g. Sports & Physical Education Fee"
              required
            />
            <Input
              label="Description"
              value={newHeadForm.description}
              onChange={(e) => setNewHeadForm({ ...newHeadForm, description: e.target.value })}
              placeholder="e.g. Term sports equipment and ground maintenance"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setHeadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Head</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: SET CLASS FEE RULE */}
        <Modal
          isOpen={ruleModalOpen}
          onClose={() => setRuleModalOpen(false)}
          title="Set Class Fee Structure Rule"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await axiosClient.post('/fees/structures', newRuleForm);
                setRuleModalOpen(false);
                const fsRes = await axiosClient.get('/fees/structures');
                setFeeStructures(fsRes.data || []);
              } catch (err) {
                alert(err.message);
              }
            }}
            className="space-y-4"
          >
            <Select
              label="Academic Session"
              value={newRuleForm.academic_year_id}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, academic_year_id: parseInt(e.target.value, 10) })}
              options={sessions.map((s) => ({ value: s.id, label: s.session_name }))}
              required
            />
            <Select
              label="Class"
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
              <Button type="submit">Save Fee Rule</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

