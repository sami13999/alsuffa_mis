import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function PayrollDisbursementPage() {
  const [payrollMonth, setPayrollMonth] = useState('2026-10');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/staff/payroll', {
        params: { monthYear: payrollMonth }
      });
      if (res.success) setRecords(res.data || []);
    } catch (err) {
      console.error('Failed to load payroll records:', err.message);
    } finally {
      setLoading(false);
    }
  }, [payrollMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate monthly payroll
  const handleGeneratePayroll = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await axiosClient.post('/staff/payroll/generate', {
        monthYear: payrollMonth
      });
      setMessage(res.message);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Disburse individual salary
  const handleDisburse = async (payrollId) => {
    try {
      await axiosClient.patch(`/staff/payroll/${payrollId}/pay`, {});
      setMessage('Salary marked as disbursed and paid.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPending = records
    .filter((r) => r.payment_status !== 'paid')
    .reduce((sum, r) => sum + parseFloat(r.net_salary), 0);

  const totalDisbursed = records
    .filter((r) => r.payment_status === 'paid')
    .reduce((sum, r) => sum + parseFloat(r.net_salary), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Faculty & Staff Payroll Disbursement
            </h1>
            <p className="text-xs text-slate-500">
              Generate Monthly Salary Roll, Calculate Allowances/Deductions & Record Disbursements
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={handleGeneratePayroll}
              loading={actionLoading}
            >
              Generate Month Payroll
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

        {/* Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">Selected Month</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{payrollMonth}</div>
            <div className="text-xs text-slate-400 mt-0.5">{records.length} Employees On Roll</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase text-emerald-700">Total Disbursed</div>
            <div className="text-xl font-bold text-emerald-950 mt-1">
              PKR {totalDisbursed.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5">Paid out to faculty</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase text-amber-700">Pending Disbursement</div>
            <div className="text-xl font-bold text-amber-950 mt-1">
              PKR {totalPending.toLocaleString()}
            </div>
            <div className="text-xs text-amber-600 mt-0.5">Awaiting cashier release</div>
          </div>
        </div>

        {/* Payroll Records Table */}
        <Table
          columns={[
            { title: 'Emp Code', key: 'employee_code' },
            {
              title: 'Faculty / Staff Member',
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
              title: 'Allowances',
              key: 'allowances',
              render: (r) => `PKR ${parseFloat(r.allowances).toLocaleString()}`
            },
            {
              title: 'Deductions',
              key: 'deductions',
              render: (r) => `PKR ${parseFloat(r.deductions).toLocaleString()}`
            },
            {
              title: 'Net Payable',
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
                  <Button size="sm" variant="success" onClick={() => handleDisburse(r.id)}>
                    Disburse Salary
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                  </span>
                )
            }
          ]}
          data={records}
          emptyMessage="No payroll records generated for this month. Click 'Generate Month Payroll' above."
        />
      </div>
    </DashboardLayout>
  );
}

