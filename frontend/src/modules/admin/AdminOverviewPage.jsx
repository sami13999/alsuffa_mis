import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import {
  Users,
  GraduationCap,
  CreditCard,
  Clock,
  BookOpen,
  RefreshCw,
  UserPlus,
  ArrowRight,
  School,
  Layers
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/dashboard/metrics');
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err.message);
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
              Executive Administration Overview
            </h1>
            <p className="text-xs text-slate-500">
              Campus Governance, High-Level Key Performance Indicators & Admissions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadData}
              disabled={loading}
            >
              Refresh KPI Data
            </Button>
            <Link to="/admin/students">
              <Button variant="primary" size="sm" icon={UserPlus}>
                Student Admissions
              </Button>
            </Link>
          </div>
        </div>

        {stats && (
          <>
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Active Enrolled Students"
                value={stats.total_students}
                subtitle="Active in session 2026-2027"
                icon={Users}
                color="emerald"
              />
              <StatCard
                title="Teaching & Staff"
                value={stats.total_staff}
                subtitle="Faculty on institutional payroll"
                icon={BookOpen}
                color="blue"
              />
              <StatCard
                title="Fee Collection"
                value={`PKR ${stats.financials.total_collected.toLocaleString()}`}
                subtitle={`${stats.financials.recovery_ratio}% Recovery Ratio`}
                icon={CreditCard}
                color="indigo"
              />
              <StatCard
                title="Outstanding Arrears"
                value={`PKR ${stats.financials.pending_arrears.toLocaleString()}`}
                subtitle="Uncollected student fee dues"
                icon={Clock}
                color="rose"
              />
            </div>

            {/* Quick Action & Snapshot Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Admissions */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Recent Student Admissions</h3>
                  <Link
                    to="/admin/students"
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>View All Admissions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <Table
                  columns={[
                    { title: 'Admission No', key: 'admission_no' },
                    {
                      title: 'Student Name',
                      key: 'name',
                      render: (r) => (
                        <span className="font-semibold text-slate-900">
                          {r.first_name} {r.last_name}
                        </span>
                      )
                    },
                    {
                      title: 'Class & Section',
                      key: 'class',
                      render: (r) => `${r.class_name || 'N/A'} - ${r.section_name || ''} (Roll #${r.roll_number || 'N/A'})`
                    },
                    {
                      title: 'Admission Date',
                      key: 'admission_date',
                      render: (r) => new Date(r.admission_date).toLocaleDateString()
                    }
                  ]}
                  data={stats.recent_admissions || []}
                />
              </div>

              {/* Campus Hierarchy Snapshot */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Campus Hierarchy Snapshot</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Active Academic Session</span>
                    <Badge variant="success">{stats.active_session}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Configured Classes</span>
                    <span className="text-sm font-bold text-slate-900">{stats.total_classes} Classes</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Total Sections</span>
                    <span className="text-sm font-bold text-slate-900">{stats.total_sections} Sections</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Link to="/admin/academics" className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Configure Academic Hierarchy
                    </Button>
                  </Link>
                  <Link to="/admin/timetables" className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Open Timetable Scheduler
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

