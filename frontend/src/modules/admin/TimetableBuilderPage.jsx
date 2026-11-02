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
  CalendarCheck,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function TimetableBuilderPage() {
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Form
  const [modalOpen, setModalOpen] = useState(false);
  const [ttForm, setTtForm] = useState({
    academic_year_id: 1,
    class_id: 1,
    section_id: 1,
    subject_id: 1,
    teacher_id: 2,
    day_of_week: 'Monday',
    start_time: '08:30',
    end_time: '09:20',
    room_number: 'Room 101'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ttRes, hierarchyRes, teachersRes] = await Promise.all([
        axiosClient.get('/timetables', { params: { classId: classFilter || undefined } }),
        axiosClient.get('/academics/hierarchy'),
        axiosClient.get('/staff', { params: { role: 'teacher' } })
      ]);

      if (ttRes.success) setTimetables(ttRes.data || []);
      if (hierarchyRes.success) {
        setClasses(hierarchyRes.data.classes || []);
        setSubjects(hierarchyRes.data.allSubjects || []);
        if (hierarchyRes.data?.classes?.length > 0 && !classFilter) {
          const firstClass = hierarchyRes.data.classes[0];
          setTtForm((prev) => ({
            ...prev,
            class_id: firstClass.id,
            section_id: firstClass.sections?.[0]?.id || 1
          }));
        }
      }
      if (teachersRes.success) {
        setTeachers(teachersRes.data || []);
        if (teachersRes.data?.length > 0) {
          setTtForm((prev) => ({ ...prev, teacher_id: teachersRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load timetable data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Schedule Submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/timetables', ttForm);
      setMessage('Period slot scheduled successfully with zero teacher or room collisions.');
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this allocated timetable slot?')) return;
    try {
      await axiosClient.delete(`/timetables/${id}`);
      setTimetables((prev) => prev.filter((t) => t.id !== id));
      setMessage('Timetable slot removed successfully.');
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
              Timetable Builder & Conflict Prevention
            </h1>
            <p className="text-xs text-slate-500">
              Allocates periods with real-time teacher and section time-slot collision validation
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
          >
            Schedule Period Slot
          </Button>
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

        {/* Class Filter Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase text-slate-500">Filter By Class:</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Academic Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Scheduled Periods: <strong className="text-slate-800">{timetables.length}</strong>
          </div>
        </div>

        {/* Timetable Slots Table */}
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
              render: (r) => `${r.class_name} (${r.section_name})`
            },
            {
              title: 'Subject',
              key: 'subject_name',
              render: (r) => (
                <Badge variant="info">
                  {r.subject_name} ({r.subject_code})
                </Badge>
              )
            },
            {
              title: 'Assigned Teacher',
              key: 'teacher',
              render: (r) => `${r.teacher_first_name} ${r.teacher_last_name}`
            },
            { title: 'Room / Facility', key: 'room_number' },
            {
              title: 'Action',
              key: 'action',
              render: (r) => (
                <button
                  onClick={() => handleDeleteSlot(r.id)}
                  className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition"
                  title="Delete Slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            }
          ]}
          data={timetables}
        />

        {/* MODAL: ALLOCATE PERIOD SLOT */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Schedule Weekly Lecture Period"
          subtitle="Verifies teacher availability and room allocation before saving"
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Day of Week"
                value={ttForm.day_of_week}
                onChange={(e) => setTtForm({ ...ttForm, day_of_week: e.target.value })}
                options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
                required
              />
              <Input
                label="Start Time"
                type="time"
                value={ttForm.start_time}
                onChange={(e) => setTtForm({ ...ttForm, start_time: e.target.value })}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={ttForm.end_time}
                onChange={(e) => setTtForm({ ...ttForm, end_time: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Class"
                value={ttForm.class_id}
                onChange={(e) => {
                  const cId = parseInt(e.target.value, 10);
                  const selClass = classes.find((c) => c.id === cId);
                  setTtForm({
                    ...ttForm,
                    class_id: cId,
                    section_id: selClass?.sections?.[0]?.id || 1
                  });
                }}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                required
              />
              <Select
                label="Section"
                value={ttForm.section_id}
                onChange={(e) => setTtForm({ ...ttForm, section_id: parseInt(e.target.value, 10) })}
                options={
                  classes.find((c) => c.id === ttForm.class_id)?.sections?.map((s) => ({
                    value: s.id,
                    label: s.name
                  })) || []
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Subject"
                value={ttForm.subject_id}
                onChange={(e) => setTtForm({ ...ttForm, subject_id: parseInt(e.target.value, 10) })}
                options={subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                required
              />
              <Select
                label="Faculty Teacher"
                value={ttForm.teacher_id}
                onChange={(e) => setTtForm({ ...ttForm, teacher_id: parseInt(e.target.value, 10) })}
                options={teachers.map((t) => ({ value: t.id, label: `${t.first_name} ${t.last_name} (${t.designation})` }))}
                required
              />
            </div>

            <Input
              label="Room / Facility"
              value={ttForm.room_number}
              onChange={(e) => setTtForm({ ...ttForm, room_number: e.target.value })}
              placeholder="e.g. Room 102 or Computer Lab 1"
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Allocate Schedule Slot
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

