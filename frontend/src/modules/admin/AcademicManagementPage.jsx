import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import {
  GraduationCap,
  Plus,
  RefreshCw,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Layers,
  Settings
} from 'lucide-react';

export default function AcademicManagementPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Modals
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedClassForMapping, setSelectedClassForMapping] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  // Forms
  const [classForm, setClassForm] = useState({ name: '', numeric_value: '' });
  const [sectionForm, setSectionForm] = useState({ class_id: '', name: '' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', type: 'theory' });
  const [sessionForm, setSessionForm] = useState({
    session_name: '',
    start_date: '2026-08-01',
    end_date: '2027-06-30',
    is_current: 1
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hierarchyRes, sessionsRes] = await Promise.all([
        axiosClient.get('/academics/hierarchy'),
        axiosClient.get('/academics/sessions')
      ]);

      if (hierarchyRes.success) {
        setClasses(hierarchyRes.data.classes || []);
        setSubjects(hierarchyRes.data.allSubjects || []);
      }
      if (sessionsRes.success) {
        setSessions(sessionsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load academic data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Class Creation
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/academics/classes', classForm);
      setMessage(`Class "${classForm.name}" created successfully.`);
      setClassModalOpen(false);
      setClassForm({ name: '', numeric_value: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Section Creation
  const handleCreateSection = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/academics/sections', sectionForm);
      setMessage(`Section "${sectionForm.name}" created successfully.`);
      setSectionModalOpen(false);
      setSectionForm({ class_id: '', name: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Subject Creation
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/academics/subjects', subjectForm);
      setMessage(`Subject "${subjectForm.name}" (${subjectForm.code}) registered.`);
      setSubjectModalOpen(false);
      setSubjectForm({ code: '', name: '', type: 'theory' });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Session Creation
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await axiosClient.post('/academics/sessions', sessionForm);
      setMessage(`Academic Session "${sessionForm.session_name}" created.`);
      setSessionModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Subject Mapping Modal
  const openSubjectMapping = (c) => {
    setSelectedClassForMapping(c);
    setSelectedSubjectIds(c.subjectIds || []);
    setMappingModalOpen(true);
  };

  // Save Subject Mapping
  const handleSaveMapping = async () => {
    if (!selectedClassForMapping) return;
    setActionLoading(true);
    try {
      await axiosClient.post(`/academics/classes/${selectedClassForMapping.id}/subjects`, {
        subjectIds: selectedSubjectIds
      });
      setMessage(`Subjects mapped to ${selectedClassForMapping.name} successfully.`);
      setMappingModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Academic Hierarchy Management
            </h1>
            <p className="text-xs text-slate-500">
              Manage Academic Sessions, Classes, Sections, and Curricular Subject Mappings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" icon={Calendar} onClick={() => setSessionModalOpen(true)}>
              New Session
            </Button>
            <Button size="sm" variant="outline" icon={Plus} onClick={() => setClassModalOpen(true)}>
              Add Class
            </Button>
            <Button size="sm" variant="outline" icon={Plus} onClick={() => setSectionModalOpen(true)}>
              Add Section
            </Button>
            <Button size="sm" variant="primary" icon={BookOpen} onClick={() => setSubjectModalOpen(true)}>
              Register Subject
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

        {/* Sessions Strip */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Academic Years / Sessions
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {sessions.map((s) => (
                  <Badge key={s.id} variant={s.is_current ? 'success' : 'default'} size="md">
                    {s.session_name} {s.is_current ? '(Current Session)' : ''}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Classes & Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                  <p className="text-xs text-slate-500">Numeric Level: {c.numeric_value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="purple">{c.sections?.length || 0} Sections</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Settings}
                    onClick={() => openSubjectMapping(c)}
                  >
                    Map Subjects
                  </Button>
                </div>
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
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
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
                  Curricular Subjects ({c.subjectIds?.length || 0}):
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

        {/* Master Registered Subjects List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Institutional Registered Subjects ({subjects.length})</h3>
            <span className="text-xs text-slate-500">Master database catalog (`subjects`)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <div key={sub.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800">{sub.code}</span>
                  <Badge variant="outline" size="sm">{sub.type}</Badge>
                </div>
                <div className="font-semibold text-sm text-slate-900 mt-1">{sub.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL: ADD CLASS */}
        <Modal
          isOpen={classModalOpen}
          onClose={() => setClassModalOpen(false)}
          title="Add New Academic Class"
        >
          <form onSubmit={handleCreateClass} className="space-y-4">
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
              <Button type="submit" loading={actionLoading}>Create Class</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: ADD SECTION */}
        <Modal
          isOpen={sectionModalOpen}
          onClose={() => setSectionModalOpen(false)}
          title="Add Section to Class"
        >
          <form onSubmit={handleCreateSection} className="space-y-4">
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
              <Button type="submit" loading={actionLoading}>Create Section</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: REGISTER SUBJECT */}
        <Modal
          isOpen={subjectModalOpen}
          onClose={() => setSubjectModalOpen(false)}
          title="Register Master Subject"
        >
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <Input
              label="Subject Code"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              placeholder="e.g. BIO-101"
              required
            />
            <Input
              label="Subject Name"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="e.g. Biology"
              required
            />
            <Select
              label="Subject Type"
              value={subjectForm.type}
              onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
              options={[
                { value: 'theory', label: 'Theory Only' },
                { value: 'practical', label: 'Practical Lab Only' },
                { value: 'both', label: 'Both Theory & Practical' }
              ]}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSubjectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>Register Subject</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: NEW SESSION */}
        <Modal
          isOpen={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
          title="Create Academic Session"
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <Input
              label="Session Name"
              value={sessionForm.session_name}
              onChange={(e) => setSessionForm({ ...sessionForm, session_name: e.target.value })}
              placeholder="e.g. 2027-2028"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={sessionForm.start_date}
                onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={sessionForm.end_date}
                onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isCurrent"
                checked={sessionForm.is_current === 1}
                onChange={(e) => setSessionForm({ ...sessionForm, is_current: e.target.checked ? 1 : 0 })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isCurrent" className="text-xs text-slate-700 font-medium">
                Set as Active Current Session
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSessionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>Create Session</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: MAP SUBJECTS TO CLASS */}
        <Modal
          isOpen={mappingModalOpen}
          onClose={() => setMappingModalOpen(false)}
          title={`Map Subjects to ${selectedClassForMapping?.name}`}
          subtitle="Select curricular subjects allocated for this grade level"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
              {subjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                        } else {
                          setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== sub.id));
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-mono font-bold text-emerald-700">{sub.code}</div>
                      <div className="text-sm">{sub.name}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setMappingModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMapping} loading={actionLoading}>
                Save Subject Mapping
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

