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
  Award,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export default function ExamManagementPage() {
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Forms
  const [examForm, setExamForm] = useState({
    academic_year_id: 1,
    name: '',
    start_date: '2026-10-15',
    end_date: '2026-10-25',
    is_published: 0
  });

  const [schedForm, setSchedForm] = useState({
    exam_id: 1,
    class_id: 1,
    subject_id: 1,
    exam_date: '2026-10-16',
    start_time: '09:00',
    end_time: '12:00',
    total_marks: 100,
    passing_marks: 40
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, classesRes, subjectsRes, sessionsRes] = await Promise.all([
        axiosClient.get('/examinations'),
        axiosClient.get('/academics/classes'),
        axiosClient.get('/academics/subjects'),
        axiosClient.get('/academics/sessions')
      ]);

      if (examsRes.success) {
        setExams(examsRes.data || []);
        if (examsRes.data?.length > 0 && !selectedExamId) {
          setSelectedExamId(examsRes.data[0].id);
          setSchedForm((prev) => ({ ...prev, exam_id: examsRes.data[0].id }));
        }
      }
      if (classesRes.success) setClasses(classesRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (sessionsRes.success) setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load exam data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load schedules for selected exam
  useEffect(() => {
    if (selectedExamId) {
      axiosClient
        .get('/examinations/schedules', { params: { examId: selectedExamId } })
        .then((res) => setSchedules(res.data || []))
        .catch(console.error);
    }
  }, [selectedExamId]);

  // Create Exam Term
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/examinations', examForm);
      setMessage(`Exam Term "${examForm.name}" created successfully.`);
      setExamModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule Paper
  const handleSchedulePaper = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/examinations/schedules', schedForm);
      setMessage('Exam paper scheduled successfully.');
      setScheduleModalOpen(false);
      const sRes = await axiosClient.get('/examinations/schedules', { params: { examId: selectedExamId } });
      setSchedules(sRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Publication
  const handleTogglePublish = async (examId, currentStatus) => {
    try {
      await axiosClient.patch(`/examinations/${examId}/publish`, {
        is_published: currentStatus ? 0 : 1
      });
      loadData();
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
              Examination Terms & Gradebook Papers
            </h1>
            <p className="text-xs text-slate-500">
              Manage Institutional Examination Terms, Scheduled Subject Papers & Results Publication
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => {
                setError(null);
                setExamModalOpen(true);
              }}
            >
              New Exam Term
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setError(null);
                setScheduleModalOpen(true);
              }}
            >
              Schedule Paper
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
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 font-bold">&times;</button>
          </div>
        )}

        {/* Exam Terms Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((ex) => (
            <div
              key={ex.id}
              onClick={() => setSelectedExamId(ex.id)}
              className={`p-5 rounded-xl border cursor-pointer transition ${
                selectedExamId === ex.id
                  ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-base">{ex.name}</span>
                <Badge variant={ex.is_published ? 'success' : 'warning'}>
                  {ex.is_published ? 'PUBLISHED' : 'DRAFT'}
                </Badge>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Session: <strong className="text-slate-700">{ex.session_name}</strong></div>
                <div>Dates: {ex.start_date} to {ex.end_date}</div>
                <div>Scheduled Papers: {ex.schedule_count}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {selectedExamId === ex.id ? 'Active Selection' : 'Click to View Papers'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePublish(ex.id, ex.is_published);
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  {ex.is_published ? 'Unpublish' : 'Publish Results'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Scheduled Papers for Selected Exam */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">
              Scheduled Subject Papers ({schedules.length})
            </h3>
            <span className="text-xs text-slate-500">Connected to `exam_schedules`</span>
          </div>

          <Table
            columns={[
              { title: 'Class', key: 'class_name' },
              {
                title: 'Subject',
                key: 'subject',
                render: (r) => (
                  <Badge variant="info">
                    {r.subject_name} ({r.subject_code})
                  </Badge>
                )
              },
              { title: 'Exam Date', key: 'exam_date' },
              {
                title: 'Timing',
                key: 'timing',
                render: (r) => `${r.start_time.slice(0, 5)} - ${r.end_time.slice(0, 5)}`
              },
              { title: 'Total Marks', key: 'total_marks' },
              {
                title: 'Passing Marks',
                key: 'passing_marks',
                render: (r) => <span className="font-semibold text-emerald-700">{r.passing_marks}</span>
              }
            ]}
            data={schedules}
            emptyMessage="No subject papers scheduled for this examination term yet."
          />
        </div>

        {/* MODAL: CREATE EXAM TERM */}
        <Modal
          isOpen={examModalOpen}
          onClose={() => setExamModalOpen(false)}
          title="Create New Examination Term"
        >
          <form onSubmit={handleCreateExam} className="space-y-4">
            <Select
              label="Academic Session"
              value={examForm.academic_year_id}
              onChange={(e) => setExamForm({ ...examForm, academic_year_id: parseInt(e.target.value, 10) })}
              options={sessions.map((s) => ({ value: s.id, label: s.session_name }))}
              required
            />
            <Input
              label="Exam Term Title"
              value={examForm.name}
              onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
              placeholder="e.g. Final Term Examinations 2027"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={examForm.start_date}
                onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={examForm.end_date}
                onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setExamModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Create Term
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: SCHEDULE PAPER */}
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title="Schedule Subject Exam Paper"
        >
          <form onSubmit={handleSchedulePaper} className="space-y-4">
            <Select
              label="Examination Term"
              value={schedForm.exam_id}
              onChange={(e) => setSchedForm({ ...schedForm, exam_id: parseInt(e.target.value, 10) })}
              options={exams.map((ex) => ({ value: ex.id, label: ex.name }))}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Class"
                value={schedForm.class_id}
                onChange={(e) => setSchedForm({ ...schedForm, class_id: parseInt(e.target.value, 10) })}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                required
              />
              <Select
                label="Subject"
                value={schedForm.subject_id}
                onChange={(e) => setSchedForm({ ...schedForm, subject_id: parseInt(e.target.value, 10) })}
                options={subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Exam Date"
                type="date"
                value={schedForm.exam_date}
                onChange={(e) => setSchedForm({ ...schedForm, exam_date: e.target.value })}
                required
              />
              <Input
                label="Start Time"
                type="time"
                value={schedForm.start_time}
                onChange={(e) => setSchedForm({ ...schedForm, start_time: e.target.value })}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={schedForm.end_time}
                onChange={(e) => setSchedForm({ ...schedForm, end_time: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Maximum Marks"
                type="number"
                value={schedForm.total_marks}
                onChange={(e) => setSchedForm({ ...schedForm, total_marks: parseFloat(e.target.value) })}
                required
              />
              <Input
                label="Passing Minimum Marks"
                type="number"
                value={schedForm.passing_marks}
                onChange={(e) => setSchedForm({ ...schedForm, passing_marks: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Schedule Paper
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

