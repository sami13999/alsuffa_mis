import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import {
  CalendarCheck,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  RefreshCw,
  GraduationCap
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Timetable schedule state
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');

  // Exam Marks Entry state
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examSchedules, setExamSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [sheetData, setSheetData] = useState(null);
  const [marksState, setMarksState] = useState({});
  const [remarksState, setRemarksState] = useState({});

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Load teacher schedule and active exams
  const loadTeacherData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, schedRes, examsRes] = await Promise.all([
        axiosClient.get('/dashboard/metrics'),
        axiosClient.get('/timetables/my-teacher-schedule'),
        axiosClient.get('/examinations')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (schedRes.success) setSchedule(schedRes.data || []);
      if (examsRes.success) {
        setExams(examsRes.data || []);
        if (examsRes.data?.length > 0) {
          setSelectedExamId(examsRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load teacher data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeacherData();
  }, [loadTeacherData]);

  // When selected exam changes, fetch available schedules
  useEffect(() => {
    if (selectedExamId) {
      axiosClient
        .get('/examinations/schedules', { params: { examId: selectedExamId } })
        .then((res) => {
          setExamSchedules(res.data || []);
          if (res.data?.length > 0) {
            setSelectedScheduleId(res.data[0].id);
          } else {
            setSelectedScheduleId('');
            setSheetData(null);
          }
        })
        .catch(console.error);
    }
  }, [selectedExamId]);

  // When selected schedule paper changes, fetch marks entry sheet
  useEffect(() => {
    if (selectedScheduleId) {
      setLoading(true);
      axiosClient
        .get(`/examinations/schedules/${selectedScheduleId}/marks-sheet`)
        .then((res) => {
          if (res.success && res.data) {
            setSheetData(res.data);
            const initialMarks = {};
            const initialRemarks = {};
            res.data.students.forEach((st) => {
              initialMarks[st.student_id] = st.marks_obtained !== null ? st.marks_obtained : '';
              initialRemarks[st.student_id] = st.teacher_remarks || '';
            });
            setMarksState(initialMarks);
            setRemarksState(initialRemarks);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [selectedScheduleId]);

  // Handle Mark input change
  const handleMarkChange = (studentId, val) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: val
    }));
  };

  // Handle Remarks change
  const handleRemarksChange = (studentId, val) => {
    setRemarksState((prev) => ({
      ...prev,
      [studentId]: val
    }));
  };

  // Mass Save Marks
  const handleSaveMarks = async () => {
    if (!sheetData || !selectedScheduleId) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const marksPayload = Object.keys(marksState)
        .filter((studentId) => marksState[studentId] !== '')
        .map((studentId) => ({
          student_id: parseInt(studentId, 10),
          marks_obtained: parseFloat(marksState[studentId]),
          teacher_remarks: remarksState[studentId] || ''
        }));

      if (marksPayload.length === 0) {
        throw new Error('Please enter marks for at least one student before saving.');
      }

      const res = await axiosClient.post(
        `/examinations/schedules/${selectedScheduleId}/marks`,
        { marks: marksPayload }
      );
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
              Teacher Faculty Portal
            </h1>
            <p className="text-xs text-slate-500">
              Welcome back, {user?.profile?.first_name} {user?.profile?.last_name} ({user?.profile?.designation})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadTeacherData} disabled={loading}>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Award}
              onClick={() => setActiveTab('marks')}
            >
              Gradebook Marks Entry
            </Button>
          </div>
        </div>

        {/* Global Feedback Messages */}
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
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'schedule'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>My Teaching Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'marks'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Exam Marks Entry</span>
          </button>
        </div>

        {/* TAB 1: TEACHING SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Weekly Lectures"
                value={stats?.total_weekly_lectures || schedule.length}
                subtitle="Allocated timetable periods"
                icon={CalendarCheck}
                color="blue"
              />
              <StatCard
                title="Active Subjects"
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

            {/* Filter Day */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Weekly Allocated Class Periods</h2>
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
            </div>

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
                    <span className="font-medium text-slate-900">
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
                  title: 'Room Number',
                  key: 'room_number',
                  render: (r) => r.room_number || 'Room 101'
                }
              ]}
              data={filteredSchedule}
            />
          </div>
        )}

        {/* TAB 2: EXAM MARKS ENTRY */}
        {activeTab === 'marks' && (
          <div className="space-y-6">
            {/* Control Bar: Select Exam Term & Scheduled Paper */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Examination Assessment Sheet Selection
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="1. Select Exam Term"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(parseInt(e.target.value, 10))}
                  options={exams.map((ex) => ({
                    value: ex.id,
                    label: `${ex.name} (${ex.is_published ? 'Published' : 'Draft / Unofficial'})`
                  }))}
                  required
                />

                <Select
                  label="2. Select Scheduled Subject Paper"
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(parseInt(e.target.value, 10))}
                  options={examSchedules.map((es) => ({
                    value: es.id,
                    label: `${es.class_name} - ${es.subject_name} (${es.exam_date} | Total: ${es.total_marks} | Pass: ${es.passing_marks})`
                  }))}
                  required
                />
              </div>
            </div>

            {/* Assessment Sheet Table with Mass Marks Input */}
            {sheetData ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
                  <div>
                    <h3 className="font-bold text-emerald-950 text-base">
                      {sheetData.schedule.class_name} &bull; {sheetData.schedule.subject_name}
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Total Maximum Marks: <strong className="font-mono">{sheetData.schedule.total_marks}</strong> &bull; Passing Marks:{' '}
                      <strong className="font-mono">{sheetData.schedule.passing_marks}</strong> &bull; Students Enrolled:{' '}
                      {sheetData.students.length}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    icon={Save}
                    onClick={handleSaveMarks}
                    loading={saving}
                  >
                    Save All Gradebook Marks
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Roll #</th>
                        <th className="px-4 py-3 text-left">Admission No</th>
                        <th className="px-4 py-3 text-left">Student Name</th>
                        <th className="px-4 py-3 text-left">Section</th>
                        <th className="px-4 py-3 text-left w-36">Marks Obtained ({sheetData.schedule.total_marks})</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sheetData.students.map((st) => {
                        const markVal = marksState[st.student_id];
                        const numericMark = parseFloat(markVal);
                        const total = parseFloat(sheetData.schedule.total_marks);
                        const pass = parseFloat(sheetData.schedule.passing_marks);

                        const isInvalid = !isNaN(numericMark) && (numericMark < 0 || numericMark > total);
                        const isPassed = !isNaN(numericMark) && numericMark >= pass;
                        const isFailed = !isNaN(numericMark) && numericMark < pass;

                        return (
                          <tr key={st.student_id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">{st.roll_number}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{st.admission_no}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {st.first_name} {st.last_name}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{st.section_name}</td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={total}
                                value={markVal}
                                onChange={(e) => handleMarkChange(st.student_id, e.target.value)}
                                placeholder="0.0"
                                className={`w-28 px-3 py-1.5 border rounded-lg text-sm font-bold font-mono focus:outline-none focus:ring-2 ${
                                  isInvalid
                                    ? 'border-rose-500 text-rose-600 bg-rose-50 focus:ring-rose-500'
                                    : 'border-slate-300 text-slate-900 focus:ring-emerald-500'
                                }`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              {markVal === '' ? (
                                <Badge variant="outline">Pending</Badge>
                              ) : isInvalid ? (
                                <Badge variant="danger">Invalid (&gt; {total})</Badge>
                              ) : isPassed ? (
                                <Badge variant="success">PASSED</Badge>
                              ) : (
                                <Badge variant="danger">FAILED</Badge>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={remarksState[st.student_id] || ''}
                                onChange={(e) => handleRemarksChange(st.student_id, e.target.value)}
                                placeholder="e.g. Excellent analytical performance"
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    icon={Save}
                    onClick={handleSaveMarks}
                    loading={saving}
                  >
                    Save All Gradebook Marks
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                Please select an examination term and subject paper above to load the enrolled students list.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

