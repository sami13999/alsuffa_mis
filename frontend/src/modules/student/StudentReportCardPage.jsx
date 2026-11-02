import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import {
  Award,
  Printer,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export default function StudentReportCardPage() {
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReportCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/examinations/report-card');
      if (res.success) setReportCards(res.data || []);
    } catch (err) {
      console.error('Failed to load student report card:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportCards();
  }, [loadReportCards]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Official Examination Report Cards
            </h1>
            <p className="text-xs text-slate-500">
              Verified Academic Results, Subject Marks Breakdowns, Cumulative Percentages & Grades
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>
              Print Report Card
            </Button>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadReportCards} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Report Cards Feed */}
        {reportCards.length > 0 ? (
          reportCards.map((rc) => (
            <div
              key={rc.exam_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
            >
              {/* Exam Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-bold text-slate-900">{rc.exam_name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Student: <strong className="text-slate-800">{rc.student.first_name} {rc.student.last_name}</strong> (Roll #{rc.student.roll_number}) &bull; Class: {rc.student.class_name} ({rc.student.section_name})
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Marks</div>
                    <div className="text-lg font-bold text-slate-900">
                      {rc.total_obtained_marks} / {rc.total_max_marks}
                    </div>
                  </div>

                  <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Percentage</div>
                    <div className="text-lg font-bold text-emerald-950">{rc.percentage}%</div>
                  </div>

                  <div className="text-center px-4 py-2 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-[10px] uppercase font-bold text-purple-700">Grade</div>
                    <div className="text-lg font-bold text-purple-950">{rc.overall_grade}</div>
                  </div>

                  <div className="text-center px-4 py-2 bg-slate-900 text-white rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-300">Status</div>
                    <div className="text-lg font-bold text-emerald-400">{rc.overall_status}</div>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <Table
                columns={[
                  {
                    title: 'Subject',
                    key: 'subject',
                    render: (r) => (
                      <div>
                        <div className="font-semibold text-slate-900">{r.subject_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.subject_code}</div>
                      </div>
                    )
                  },
                  { title: 'Total Maximum', key: 'total_marks' },
                  { title: 'Passing Minimum', key: 'passing_marks' },
                  {
                    title: 'Marks Obtained',
                    key: 'marks_obtained',
                    render: (r) => (
                      <span className="font-bold text-slate-900 text-sm">
                        {r.marks_obtained}
                      </span>
                    )
                  },
                  {
                    title: 'Passing Status',
                    key: 'is_passed',
                    render: (r) => (
                      <Badge variant={r.is_passed ? 'success' : 'danger'}>
                        {r.is_passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    )
                  },
                  {
                    title: 'Teacher Evaluation Remarks',
                    key: 'teacher_remarks',
                    render: (r) => (
                      <span className="text-xs text-slate-600 italic">
                        "{r.teacher_remarks || 'Satisfactory academic progress'}"
                      </span>
                    )
                  }
                ]}
                data={rc.subjects}
              />
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            No published terminal report cards are available for your account at this time.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

