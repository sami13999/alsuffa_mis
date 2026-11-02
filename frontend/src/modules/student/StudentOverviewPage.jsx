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
  Receipt,
  Award,
  CreditCard,
  Printer,
  ArrowRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const [feesRes, ttRes, rcRes] = await Promise.all([
        axiosClient.get('/fees/vouchers'),
        axiosClient.get('/timetables/my-student-schedule'),
        axiosClient.get('/examinations/report-card')
      ]);

      if (feesRes.success) setVouchers(feesRes.data || []);
      if (ttRes.success) setTimetable(ttRes.data || []);
      if (rcRes.success) setReportCards(rcRes.data || []);
    } catch (err) {
      console.error('Failed to load student data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const totalOutstanding = vouchers.reduce(
    (sum, v) => sum + (parseFloat(v.total_amount) - parseFloat(v.discount_amount) - parseFloat(v.paid_amount)),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Student Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-emerald-200">
              {user?.profile?.first_name?.[0] || 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {user?.profile?.first_name} {user?.profile?.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold">
                  Admission No: {user?.profile?.admission_no}
                </span>
                <span>&bull;</span>
                <span className="font-semibold text-slate-700">
                  {user?.enrollment?.class_name} ({user?.enrollment?.section_name})
                </span>
                <span>&bull;</span>
                <span className="font-semibold text-slate-700">Roll #{user?.enrollment?.roll_number}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Outstanding Fee Balance</div>
            <div
              className={`text-2xl font-bold ${
                totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              PKR {totalOutstanding.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quick Portal Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/student/timetable"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition group block"
          >
            <CalendarCheck className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 text-base">Class Timetable</h3>
            <p className="text-xs text-slate-500 mt-1">
              View your enrolled section's weekly period schedule, teachers & room numbers.
            </p>
            <div className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>Open Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/student/fees"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition group block"
          >
            <Receipt className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 text-base">Fee Vouchers & Bills</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check monthly voucher dues, payment receipts, and download printable 3-copy challans.
            </p>
            <div className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1">
              <span>View Fee Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/student/report-card"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-purple-500 hover:shadow-md transition group block"
          >
            <Award className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 text-base">Report Card & Grades</h3>
            <p className="text-xs text-slate-500 mt-1">
              View official examination results, subject marks breakdowns, percentage, and GPA grade.
            </p>
            <div className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1">
              <span>View Academic Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Recent Timetable Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Upcoming Weekly Lectures</h3>
            <Link
              to="/student/timetable"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Full Schedule</span>
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
                title: 'Subject',
                key: 'subject',
                render: (r) => (
                  <Badge variant="info">
                    {r.subject_name} ({r.subject_code})
                  </Badge>
                )
              },
              {
                title: 'Instructor',
                key: 'teacher',
                render: (r) => `${r.teacher_first_name} ${r.teacher_last_name}`
              },
              { title: 'Room', key: 'room_number' }
            ]}
            data={timetable.slice(0, 3)}
            emptyMessage="No timetable slots found for your class."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

