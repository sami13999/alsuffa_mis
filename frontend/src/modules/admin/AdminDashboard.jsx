import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  BookOpen,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Academic state
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Students state
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Staff state
  const [staffList, setStaffList] = useState([]);

  // Timetable state
  const [timetables, setTimetables] = useState([]);
  const [ttClassFilter, setTtClassFilter] = useState('');

  // Modals state
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);

  // Form states
  const [admitForm, setAdmitForm] = useState({
    admission_no: '',
    first_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '2010-01-01',
    father_name: '',
    guardian_phone: '',
    address: '',
    academic_year_id: 1,
    class_id: 1,
    section_id: 1,
    roll_number: 3,
    custom_password: 'password123'
  });

  const [staffForm, setStaffForm] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    gender: 'male',
    phone: '',
    designation: 'Lecturer',
    qualification: 'M.Sc.',
    basic_salary: 50000,
    role: 'teacher',
    custom_password: 'password123'
  });

  const [ttForm, setTtForm] = useState({
    academic_year_id: 1,
    class_id: 1,
    section_id: 1,
    subject_id: 1,
    teacher_id: 2,
    day_of_week: 'Thursday',
    start_time: '11:30',
    end_time: '12:20',
    room_number: 'Room 201'
  });

  const [classForm, setClassForm] = useState({ name: '', numeric_value: '' });
  const [sectionForm, setSectionForm] = useState({ class_id: '', name: '' });

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Fetch Dashboard Metrics & Master Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, hierarchyRes, sessionsRes] = await Promise.all([
        axiosClient.get('/dashboard/metrics'),
        axiosClient.get('/academics/hierarchy'),
        axiosClient.get('/academics/sessions')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (hierarchyRes.success) {
        setClasses(hierarchyRes.data.classes || []);
        setSubjects(hierarchyRes.data.allSubjects || []);
      }
      if (sessionsRes.success) setSessions(sessionsRes.data || []);

      // Preload first class for timetable form
      if (hierarchyRes.data?.classes?.length > 0) {
        const c1 = hierarchyRes.data.classes[0];
        if (c1.sections?.length > 0) {
          setTtForm((prev) => ({
            ...prev,
            class_id: c1.id,
            section_id: c1.sections[0].id
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load initial admin data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load specific tab data on demand
  useEffect(() => {
    if (activeTab === 'students') {
      axiosClient.get('/students', { params: { search: studentSearch, classId: filterClass || undefined } })
        .then((res) => setStudents(res.data || []))
        .catch(console.error);
    } else if (activeTab === 'staff') {
      axiosClient.get('/staff')
        .then((res) => setStaffList(res.data || []))
        .catch(console.error);
    } else if (activeTab === 'academics') {
      axiosClient.get('/academics/sections')
        .then((res) => setSections(res.data || []))
        .catch(console.error);
    } else if (activeTab === 'timetables') {
      axiosClient.get('/timetables', { params: { classId: ttClassFilter || undefined } })
        .then((res) => setTimetables(res.data || []))
        .catch(console.error);
      axiosClient.get('/staff', { params: { role: 'teacher' } })
        .then((res) => setStaffList(res.data || []))
        .catch(console.error);
    }
  }, [activeTab, studentSearch, filterClass, ttClassFilter]);

  // Handle Student Admission Submit
  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);
    try {
      const res = await axiosClient.post('/students/admit', admitForm);
      setFormSuccess(`Student ${res.data.admission_no} enrolled successfully with username: ${res.data.username}`);
      setAdmitModalOpen(false);
      loadData();
      if (activeTab === 'students') {
        const sRes = await axiosClient.get('/students');
        setStudents(sRes.data || []);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Staff Registration Submit
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);
    try {
      const res = await axiosClient.post('/staff/register', staffForm);
      setFormSuccess(`Staff ${res.data.employee_code} registered with username: ${res.data.username}`);
      setStaffModalOpen(false);
      loadData();
      const sRes = await axiosClient.get('/staff');
      setStaffList(sRes.data || []);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Timetable Slot Submit with collision detection
  const handleTimetableSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);
    try {
      await axiosClient.post('/timetables', ttForm);
      setFormSuccess('Timetable slot allocated successfully with zero conflicts.');
      setTimetableModalOpen(false);
      const ttRes = await axiosClient.get('/timetables', { params: { classId: ttClassFilter || undefined } });
      setTimetables(ttRes.data || []);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Timetable slot
  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Delete this schedule slot?')) return;
    try {
      await axiosClient.delete(`/timetables/${id}`);
      setTimetables((prev) => prev.filter((t) => t.id !== id));
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
              Super Admin Executive Portal
            </h1>
            <p className="text-xs text-slate-500">
              Campus Governance, Academic Hierarchy, Admissions & Scheduling
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
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setAdmitModalOpen(true);
              }}
            >
              New Admission
            </Button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {formSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
            <button onClick={() => setFormSuccess(null)} className="text-emerald-700 font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1 text-sm font-medium">
          {[
            { id: 'overview', label: 'Executive Overview', icon: Layers },
            { id: 'academics', label: 'Academic Management', icon: GraduationCap },
            { id: 'students', label: 'Student Admissions', icon: Users },
            { id: 'staff', label: 'Staff Management', icon: BookOpen },
            { id: 'timetables', label: 'Timetable Builder', icon: CalendarCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition ${
                  active
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Active Students"
                value={stats.total_students}
                subtitle="Enrolled in active session"
                icon={Users}
                color="emerald"
              />
              <StatCard
                title="Teaching & Staff"
                value={stats.total_staff}
                subtitle="Active payroll faculty"
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
                title="Pending Arrears"
                value={`PKR ${stats.financials.pending_arrears.toLocaleString()}`}
                subtitle="Outstanding dues to collect"
                icon={Clock}
                color="amber"
              />
            </div>

            {/* Quick Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Admissions */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Recent Student Admissions</h3>
                  <button
                    onClick={() => setActiveTab('students')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View All Students &rarr;
                  </button>
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
                <h3 className="font-bold text-slate-900 text-sm">Academic Structure Snapshot</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Active Academic Year</span>
                    <Badge variant="success">{stats.active_session}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Configured Classes</span>
                    <span className="text-sm font-bold text-slate-900">{stats.total_classes}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Total Sections</span>
                    <span className="text-sm font-bold text-slate-900">{stats.total_sections}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab('academics')}
                  >
                    Configure Classes & Subjects
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACADEMIC MANAGEMENT */}
        {activeTab === 'academics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Academic Hierarchy & Subjects</h2>
                <p className="text-xs text-slate-500">Manage Classes, Sections, and Subject Mappings</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" icon={Plus} onClick={() => setClassModalOpen(true)}>
                  Add Class
                </Button>
                <Button size="sm" variant="outline" icon={Plus} onClick={() => setSectionModalOpen(true)}>
                  Add Section
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                      <p className="text-xs text-slate-500">Numeric Level: {c.numeric_value}</p>
                    </div>
                    <Badge variant="purple">{c.sections?.length || 0} Sections</Badge>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Sections:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {c.sections?.length > 0 ? (
                        c.sections.map((s) => (
                          <span
                            key={s.id}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No sections added yet</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Mapped Subjects ({c.subjectIds?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects
                        .filter((sub) => c.subjectIds?.includes(sub.id))
                        .map((sub) => (
                          <Badge key={sub.id} variant="info" size="sm">
                            {sub.name} ({sub.code})
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT ADMISSIONS */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by name or admission #..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setFormError(null);
                  setAdmitModalOpen(true);
                }}
              >
                Admit Student
              </Button>
            </div>

            <Table
              columns={[
                { title: 'Admission No', key: 'admission_no' },
                {
                  title: 'Student Name',
                  key: 'name',
                  render: (r) => (
                    <div>
                      <div className="font-semibold text-slate-900">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">@{r.username}</div>
                    </div>
                  )
                },
                { title: "Father's Name", key: 'father_name' },
                {
                  title: 'Class & Section',
                  key: 'class_section',
                  render: (r) => (
                    <Badge variant="default">
                      {r.class_name} - {r.section_name} (Roll #{r.roll_number})
                    </Badge>
                  )
                },
                { title: 'Guardian Phone', key: 'guardian_phone' },
                {
                  title: 'Status',
                  key: 'status',
                  render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
                }
              ]}
              data={students}
            />
          </div>
        )}

        {/* TAB 4: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Faculty & System Personnel</h2>
                <p className="text-xs text-slate-500">Employee records, designations, base salaries & system roles</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setFormError(null);
                  setStaffModalOpen(true);
                }}
              >
                Register Employee
              </Button>
            </div>

            <Table
              columns={[
                { title: 'Emp Code', key: 'employee_code' },
                {
                  title: 'Name & Username',
                  key: 'name',
                  render: (r) => (
                    <div>
                      <div className="font-semibold text-slate-900">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">@{r.username}</div>
                    </div>
                  )
                },
                { title: 'Designation', key: 'designation' },
                {
                  title: 'System Role',
                  key: 'role',
                  render: (r) => (
                    <Badge
                      variant={
                        r.role === 'admin'
                          ? 'danger'
                          : r.role === 'accountant'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {r.role?.toUpperCase()}
                    </Badge>
                  )
                },
                { title: 'Phone', key: 'phone' },
                {
                  title: 'Base Salary',
                  key: 'basic_salary',
                  render: (r) => `PKR ${parseFloat(r.basic_salary).toLocaleString()}`
                }
              ]}
              data={staffList}
            />
          </div>
        )}

        {/* TAB 5: TIMETABLE BUILDER */}
        {activeTab === 'timetables' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Timetable Matrix & Clash Prevention</h2>
                <p className="text-xs text-slate-500">
                  Real-time collision checks: blocks dual scheduling of teachers & sections
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={ttClassFilter}
                  onChange={(e) => setTtClassFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setFormError(null);
                    setTimetableModalOpen(true);
                  }}
                >
                  Schedule Period
                </Button>
              </div>
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
                  key: 'subject_name',
                  render: (r) => (
                    <Badge variant="info">
                      {r.subject_name} ({r.subject_code})
                    </Badge>
                  )
                },
                {
                  title: 'Teacher',
                  key: 'teacher',
                  render: (r) => `${r.teacher_first_name} ${r.teacher_last_name}`
                },
                { title: 'Room', key: 'room_number' },
                {
                  title: 'Action',
                  key: 'action',
                  render: (r) => (
                    <button
                      onClick={() => handleDeleteTimetable(r.id)}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded transition"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                }
              ]}
              data={timetables}
            />
          </div>
        )}

        {/* MODAL: ADMIT STUDENT */}
        <Modal
          isOpen={admitModalOpen}
          onClose={() => setAdmitModalOpen(false)}
          title="Student Admission & Academic Enrollment"
          subtitle="Generates user credentials and links enrollment in one atomic transaction"
        >
          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAdmitSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Admission Number"
                value={admitForm.admission_no}
                onChange={(e) => setAdmitForm({ ...admitForm, admission_no: e.target.value })}
                placeholder="e.g. AS-2026-003"
                required
              />
              <Input
                label="Roll Number"
                type="number"
                value={admitForm.roll_number}
                onChange={(e) => setAdmitForm({ ...admitForm, roll_number: parseInt(e.target.value, 10) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={admitForm.first_name}
                onChange={(e) => setAdmitForm({ ...admitForm, first_name: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={admitForm.last_name}
                onChange={(e) => setAdmitForm({ ...admitForm, last_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Father's Name"
                value={admitForm.father_name}
                onChange={(e) => setAdmitForm({ ...admitForm, father_name: e.target.value })}
                required
              />
              <Input
                label="Guardian Phone"
                value={admitForm.guardian_phone}
                onChange={(e) => setAdmitForm({ ...admitForm, guardian_phone: e.target.value })}
                placeholder="+92 300 0000000"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Class"
                value={admitForm.class_id}
                onChange={(e) => setAdmitForm({ ...admitForm, class_id: parseInt(e.target.value, 10) })}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                required
              />
              <Select
                label="Section"
                value={admitForm.section_id}
                onChange={(e) => setAdmitForm({ ...admitForm, section_id: parseInt(e.target.value, 10) })}
                options={
                  classes.find((c) => c.id === admitForm.class_id)?.sections?.map((s) => ({
                    value: s.id,
                    label: s.name
                  })) || []
                }
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setAdmitModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Complete Admission
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: STAFF REGISTRATION */}
        <Modal
          isOpen={staffModalOpen}
          onClose={() => setStaffModalOpen(false)}
          title="Register Faculty or Administrative Staff"
          subtitle="Provision system role and salary details"
        >
          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleStaffSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Employee Code"
                value={staffForm.employee_code}
                onChange={(e) => setStaffForm({ ...staffForm, employee_code: e.target.value })}
                placeholder="e.g. EMP-TCH-003"
                required
              />
              <Select
                label="System Role"
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                options={[
                  { value: 'teacher', label: 'Teacher (Academic Faculty)' },
                  { value: 'accountant', label: 'Accountant (Billing & POS)' },
                  { value: 'admin', label: 'Administrator' }
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={staffForm.first_name}
                onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={staffForm.last_name}
                onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Designation"
                value={staffForm.designation}
                onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                placeholder="e.g. Senior Lecturer"
                required
              />
              <Input
                label="Basic Salary (PKR)"
                type="number"
                value={staffForm.basic_salary}
                onChange={(e) => setStaffForm({ ...staffForm, basic_salary: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                placeholder="+92 300 0000000"
                required
              />
              <Input
                label="Default Password"
                value={staffForm.custom_password}
                onChange={(e) => setStaffForm({ ...staffForm, custom_password: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setStaffModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Register Employee
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: TIMETABLE ALLOCATION */}
        <Modal
          isOpen={timetableModalOpen}
          onClose={() => setTimetableModalOpen(false)}
          title="Allocate Weekly Period Slot"
          subtitle="Checks for teacher conflicts and room collisions before committing"
        >
          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleTimetableSubmit} className="space-y-4">
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
                label="Class"
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
                label="Assigned Teacher"
                value={ttForm.teacher_id}
                onChange={(e) => setTtForm({ ...ttForm, teacher_id: parseInt(e.target.value, 10) })}
                options={staffList
                  .filter((st) => st.role === 'teacher')
                  .map((t) => ({ value: t.id, label: `${t.first_name} ${t.last_name} (${t.designation})` }))}
                required
              />
            </div>

            <Input
              label="Room Number / Facility"
              value={ttForm.room_number}
              onChange={(e) => setTtForm({ ...ttForm, room_number: e.target.value })}
              placeholder="e.g. Room 102 or Computer Lab 1"
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setTimetableModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Schedule Slot
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: ADD CLASS */}
        <Modal
          isOpen={classModalOpen}
          onClose={() => setClassModalOpen(false)}
          title="Add New Academic Class"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await axiosClient.post('/academics/classes', classForm);
                setClassModalOpen(false);
                loadData();
              } catch (err) {
                alert(err.message);
              }
            }}
            className="space-y-4"
          >
            <Input
              label="Class Name"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              placeholder="e.g. Grade 11"
              required
            />
            <Input
              label="Numeric Grade Level"
              type="number"
              value={classForm.numeric_value}
              onChange={(e) => setClassForm({ ...classForm, numeric_value: e.target.value })}
              placeholder="e.g. 11"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setClassModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Class</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: ADD SECTION */}
        <Modal
          isOpen={sectionModalOpen}
          onClose={() => setSectionModalOpen(false)}
          title="Add Section to Class"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await axiosClient.post('/academics/sections', sectionForm);
                setSectionModalOpen(false);
                loadData();
              } catch (err) {
                alert(err.message);
              }
            }}
            className="space-y-4"
          >
            <Select
              label="Parent Class"
              value={sectionForm.class_id}
              onChange={(e) => setSectionForm({ ...sectionForm, class_id: parseInt(e.target.value, 10) })}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
            <Input
              label="Section Name"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="e.g. Section C"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSectionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Section</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

