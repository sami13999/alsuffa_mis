import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import {
  CalendarCheck,
  Award,
  BookOpen,
  GraduationCap,
  RefreshCw,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function TeacherOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, schedRes] = await Promise.all([
        axiosClient.get('/dashboard/metrics'),
        axiosClient.get('/timetables/my-teacher-schedule')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (schedRes.success) setSchedule(schedRes.data || []);
    } catch (err) {
      console.error('Failed to load teacher stats:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Today's classes
  const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todayClasses = schedule.filter((s) => s.day_of_week === todayDayName || s.day_of_week === 'Monday');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Teacher Faculty Overview
            </h1>
            <p className="text-xs text-slate-500">
              Welcome, {user?.profile?.first_name} {user?.profile?.last_name} &bull; {user?.profile?.designation}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData} disabled={loading}>
              Refresh
            </Button>
            <Link to="/teacher/marks">
              <Button variant="primary" size="sm" icon={Award}>
                Gradebook Marks Entry
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Weekly Scheduled Lectures"
            value={stats?.total_weekly_lectures || schedule.length}
            subtitle="Allocated timetable periods"
            icon={CalendarCheck}
            color="blue"
          />
          <StatCard
            title="Academic Subjects"
            value={new Set(schedule.map((s) => s.subject_id)).size}
            subtitle="Assigned disciplines"
            icon={BookOpen}
            color="emerald"
          />
          <StatCard
            title="Classes Covered"
            value={new Set(schedule.map((s) => s.class_id)).size}
            subtitle="Grade 9 & Grade 10"
            icon={GraduationCap}
            color="purple"
          />
        </div>

        {/* Today's Schedule & Quick Marks Action */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h2>Lecture Periods Overview</h2>
              </div>
              <Link
                to="/teacher/schedule"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Full Timetable Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Table
              columns={[
                {
                  title: 'Day',
                  key: 'day_of_week',
                  render: (r) => <span className="font-bold text-slate-900">{r.day_of_week}</span>
                },
                {
                  title: 'Time Window',
                  key: 'time',
                  render: (r) => `${r.start_time.slice(0, 5)} - ${r.end_time.slice(0, 5)}`
                },
                {
                  title: 'Class & Section',
                  key: 'class_section',
                  render: (r) => `${r.class_name} (${r.section_name})`
                },
                {
                  title: 'Subject',
                  key: 'subject',
                  render: (r) => <Badge variant="info">{r.subject_name}</Badge>
                },
                { title: 'Room', key: 'room_number' }
              ]}
              data={schedule.slice(0, 4)}
              emptyMessage="No teaching periods allocated yet."
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Award className="w-5 h-5 text-emerald-600" />
              <h2>Gradebook Action</h2>
            </div>
            <p className="text-xs text-slate-500">
              Submit terminal examination marks, validate passing/failing benchmarks, and post individual student remarks.
            </p>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 space-y-2">
              <div className="font-semibold">Active Exam Term:</div>
              <div className="font-bold text-sm">Mid-Term Examinations 2026</div>
              <div className="text-slate-600">Grade 9 Mathematics & Physics papers ready for grade input.</div>
            </div>
            <Link to="/teacher/marks" className="block pt-2">
              <Button variant="primary" size="md" className="w-full">
                Enter Exam Marks Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

