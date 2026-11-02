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
  UserCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  BookOpen
} from 'lucide-react';

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form
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

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/staff', {
        params: { role: roleFilter || undefined, search }
      });
      if (res.success) setStaffList(res.data || []);
    } catch (err) {
      console.error('Failed to load staff list:', err.message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post('/staff/register', staffForm);
      setMessage(
        `Staff registered successfully! Code: ${res.data.employee_code} | Login Username: @${res.data.username}`
      );
      setRegisterModalOpen(false);
      setStaffForm({
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
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // View Staff Details
  const handleViewDetails = async (id) => {
    try {
      const res = await axiosClient.get(`/staff/${id}`);
      if (res.success) {
        setSelectedStaff(res.data);
        setDetailsModalOpen(true);
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
              Faculty & Staff Management
            </h1>
            <p className="text-xs text-slate-500">
              Institutional Personnel, Base Salaries, Designations & Authentication Roles
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setError(null);
              setRegisterModalOpen(true);
            }}
          >
            Register Employee
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

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, code, or designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All System Roles</option>
              <option value="teacher">Teacher (Faculty)</option>
              <option value="accountant">Accountant (Bursar)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Staff: <strong className="text-slate-800">{staffList.length}</strong>
          </div>
        </div>

        {/* Staff Table */}
        <Table
          columns={[
            {
              title: 'Emp Code',
              key: 'employee_code',
              render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.employee_code}</span>
            },
            {
              title: 'Name & System Login',
              key: 'name',
              render: (r) => (
                <div>
                  <div className="font-semibold text-slate-900">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-slate-400 font-mono">@{r.username}</div>
                </div>
              )
            },
            { title: 'Designation', key: 'designation' },
            {
              title: 'Role',
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
            },
            {
              title: 'Action',
              key: 'action',
              render: (r) => (
                <button
                  onClick={() => handleViewDetails(r.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  title="View Staff Record"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
              )
            }
          ]}
          data={staffList}
        />

        {/* MODAL: REGISTER STAFF */}
        <Modal
          isOpen={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          title="Register Faculty or Personnel"
          subtitle="Provisions system credentials, salary, and designation"
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                placeholder="e.g. Lecturer in Chemistry"
                required
              />
              <Input
                label="Base Salary (PKR)"
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
              <Button variant="outline" onClick={() => setRegisterModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Register Employee
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: STAFF DETAILS */}
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Staff Record & Payroll Summary"
          subtitle={`Employee Code: ${selectedStaff?.employee_code}`}
        >
          {selectedStaff && (
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee Name:</span>
                  <span className="font-bold text-slate-900">{selectedStaff.first_name} {selectedStaff.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Designation:</span>
                  <span className="font-semibold text-emerald-800">{selectedStaff.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">System Role:</span>
                  <Badge variant="info">{selectedStaff.role?.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Basic Monthly Salary:</span>
                  <span className="font-bold font-mono">PKR {parseFloat(selectedStaff.basic_salary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Phone:</span>
                  <span>{selectedStaff.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Institutional Email:</span>
                  <span className="font-mono text-xs">{selectedStaff.email}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

