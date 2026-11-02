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
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  GraduationCap
} from 'lucide-react';

export default function StudentAdmissionsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Admit Form
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

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        axiosClient.get('/students', {
          params: { search, classId: classFilter || undefined }
        }),
        axiosClient.get('/academics/classes')
      ]);

      if (studentsRes.success) setStudents(studentsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
    } catch (err) {
      console.error('Failed to load students:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, classFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Admission Submit
  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post('/students/admit', admitForm);
      setMessage(
        `Student admitted successfully! Admission No: ${res.data.admission_no} | Login Username: @${res.data.username}`
      );
      setAdmitModalOpen(false);
      setAdmitForm({
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
        roll_number: 4,
        custom_password: 'password123'
      });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Detailed Profile
  const handleViewProfile = async (id) => {
    try {
      const res = await axiosClient.get(`/students/${id}`);
      if (res.success) {
        setSelectedStudent(res.data);
        setProfileModalOpen(true);
      }
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
              Student Information & Admissions
            </h1>
            <p className="text-xs text-slate-500">
              Manage Enrolled Students, Guardian Details, Roll Numbers & Credentials
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => {
              setError(null);
              setAdmitModalOpen(true);
            }}
          >
            Admit New Student
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

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, father name, or admission #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
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
            Total Results: <strong className="text-slate-800">{students.length}</strong>
          </div>
        </div>

        {/* Students Data Table */}
        <Table
          columns={[
            {
              title: 'Admission No',
              key: 'admission_no',
              render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.admission_no}</span>
            },
            {
              title: 'Student Name & Login',
              key: 'name',
              render: (r) => (
                <div>
                  <div className="font-semibold text-slate-900">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-slate-400 font-mono">@{r.username}</div>
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
              render: (r) => (
                <Badge variant={r.is_active ? 'success' : 'danger'}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )
            },
            {
              title: 'Action',
              key: 'action',
              render: (r) => (
                <button
                  onClick={() => handleViewProfile(r.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  title="View Profile"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>
              )
            }
          ]}
          data={students}
        />

        {/* MODAL: ADMIT STUDENT */}
        <Modal
          isOpen={admitModalOpen}
          onClose={() => setAdmitModalOpen(false)}
          title="Student Admission & Academic Enrollment"
          subtitle="Generates user credentials and links enrollment in one atomic transaction"
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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

            <Input
              label="Residential Address"
              value={admitForm.address}
              onChange={(e) => setAdmitForm({ ...admitForm, address: e.target.value })}
              placeholder="House, Street, Sector / Area"
            />

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

        {/* MODAL: VIEW PROFILE */}
        <Modal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          title="Student Academic & Fee Profile"
          subtitle={`Admission No: ${selectedStudent?.admission_no}`}
        >
          {selectedStudent && (
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Father Name:</span>
                  <span className="font-semibold">{selectedStudent.father_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrolled Class:</span>
                  <span className="font-semibold text-emerald-800">{selectedStudent.class_name} ({selectedStudent.section_name})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-mono font-bold">{selectedStudent.roll_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guardian Contact:</span>
                  <span>{selectedStudent.guardian_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">System Username:</span>
                  <span className="font-mono text-xs">@{selectedStudent.username}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setProfileModalOpen(false)}>
                  Close Profile
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

