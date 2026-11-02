import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { CalendarCheck, RefreshCw } from 'lucide-react';

export default function StudentTimetablePage() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/timetables/my-student-schedule');
      if (res.success) setTimetable(res.data || []);
    } catch (err) {
      console.error('Failed to load student timetable:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Class Academic Timetable
            </h1>
            <p className="text-xs text-slate-500">
              Enrolled Class: <strong className="text-slate-800">{user?.enrollment?.class_name} ({user?.enrollment?.section_name})</strong> &bull; Academic Session 2026-2027
            </p>
          </div>

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadTimetable} disabled={loading}>
            Refresh Schedule
          </Button>
        </div>

        {/* Timetable Table */}
        <Table
          columns={[
            {
              title: 'Day of Week',
              key: 'day_of_week',
              render: (r) => <span className="font-bold text-slate-900">{r.day_of_week}</span>
            },
            {
              title: 'Timing Window',
              key: 'time',
              render: (r) => (
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}
                </span>
              )
            },
            {
              title: 'Curricular Subject',
              key: 'subject',
              render: (r) => (
                <Badge variant="info">
                  {r.subject_name} ({r.subject_code})
                </Badge>
              )
            },
            {
              title: 'Faculty Instructor',
              key: 'teacher',
              render: (r) => `${r.teacher_first_name} ${r.teacher_last_name}`
            },
            { title: 'Room / Facility', key: 'room_number' }
          ]}
          data={timetable}
          emptyMessage="No scheduled lectures found for your enrolled class section."
        />
      </div>
    </DashboardLayout>
  );
}

