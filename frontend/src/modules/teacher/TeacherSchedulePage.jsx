import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { CalendarCheck, RefreshCw } from 'lucide-react';

export default function TeacherSchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/timetables/my-teacher-schedule');
      if (res.success) setSchedule(res.data || []);
    } catch (err) {
      console.error('Failed to load teacher schedule:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const filteredSchedule = selectedDay
    ? schedule.filter((s) => s.day_of_week === selectedDay)
    : schedule;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Weekly Teaching Schedule
            </h1>
            <p className="text-xs text-slate-500">
              Assigned Lectures, Room Allocations, and Timing Windows for Current Session 2026-2027
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Days (Mon - Sat)</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadSchedule} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Schedule Table */}
        <Table
          columns={[
            {
              title: 'Day',
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
              title: 'Class & Section',
              key: 'class_section',
              render: (r) => (
                <span className="font-semibold text-slate-900">
                  {r.class_name} ({r.section_name})
                </span>
              )
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
              title: 'Allocated Facility / Room',
              key: 'room_number',
              render: (r) => r.room_number || 'Room 101'
            }
          ]}
          data={filteredSchedule}
          emptyMessage="No teaching periods found for the selected day."
        />
      </div>
    </DashboardLayout>
  );
}

