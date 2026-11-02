import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import {
  DollarSign,
  CreditCard,
  Clock,
  UserCheck,
  Receipt,
  FileSpreadsheet,
  RefreshCw,
  Building,
  ArrowRight
} from 'lucide-react';

export default function AccountsOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/fees/stats');
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to load accounts financial stats:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Institutional Financial Overview
            </h1>
            <p className="text-xs text-slate-500">
              Campus Revenue, Fee Collections, Outstanding Arrears & Staff Liabilities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData} disabled={loading}>
              Refresh Financials
            </Button>
            <Link to="/accounts/pos">
              <Button variant="primary" size="sm" icon={Receipt}>
                Open Fee POS Counter
              </Button>
            </Link>
          </div>
        </div>

        {stats && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Billed Invoices"
                value={`PKR ${stats.total_billed.toLocaleString()}`}
                subtitle="All generated fee vouchers"
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
                title="Outstanding Arrears"
                value={`PKR ${stats.outstanding_dues.toLocaleString()}`}
                subtitle="Pending student fee balances"
                icon={Clock}
                color="rose"
              />
              <StatCard
                title="Pending Staff Payroll"
                value={`PKR ${stats.pending_payroll.toLocaleString()}`}
                subtitle="Undisbursed faculty liabilities"
                icon={UserCheck}
                color="amber"
              />
            </div>

            {/* Quick Actions & Bank Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Financial Operations Shortcuts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link
                    to="/accounts/pos"
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition group block"
                  >
                    <Receipt className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-sm text-slate-900">Fee POS Counter</div>
                    <div className="text-xs text-slate-500 mt-1">Collect fees & issue 3-copy bank challans</div>
                  </Link>

                  <Link
                    to="/accounts/vouchers"
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition group block"
                  >
                    <FileSpreadsheet className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-sm text-slate-900">Bulk Vouchers</div>
                    <div className="text-xs text-slate-500 mt-1">Generate monthly invoices for classes</div>
                  </Link>

                  <Link
                    to="/accounts/payroll"
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 transition group block"
                  >
                    <UserCheck className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-sm text-slate-900">Staff Payroll</div>
                    <div className="text-xs text-slate-500 mt-1">Process and disburse faculty salaries</div>
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Configure Fee Pricing Rules</div>
                    <div className="text-xs text-slate-500">Manage Tuition, Lab, and Examination fee rates per grade</div>
                  </div>
                  <Link to="/accounts/fees">
                    <Button variant="outline" size="sm">
                      Configure Rates
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Building className="w-5 h-5 text-emerald-600" />
                  <h3>Designated Fee Collection Account</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div className="font-semibold text-emerald-800">Primary Bank</div>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">Meezan Bank Limited</div>
                    <div className="text-slate-500">F-8 Markaz Branch (Branch Code 0102)</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-500">Account Title</div>
                    <div className="font-bold text-slate-900">Al Suffa Education System (MIS)</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-500">Account / IBAN Number</div>
                    <div className="font-mono font-bold text-slate-900">0102-0103984712</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

