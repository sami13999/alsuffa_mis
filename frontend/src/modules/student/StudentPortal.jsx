import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import {
  CalendarCheck,
  Receipt,
  Award,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap
} from 'lucide-react';

export default function StudentPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(true);

  // Timetable
  const [timetable, setTimetable] = useState([]);

  // Fees
  const [vouchers, setVouchers] = useState([]);
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [challanData, setChallanData] = useState(null);

  // Report Card
  const [reportCards, setReportCards] = useState([]);

  const loadStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const [ttRes, feesRes, rcRes] = await Promise.all([
        axiosClient.get('/timetables/my-student-schedule'),
        axiosClient.get('/fees/vouchers'),
        axiosClient.get('/examinations/report-card')
      ]);

      if (ttRes.success) setTimetable(ttRes.data || []);
      if (feesRes.success) setVouchers(feesRes.data || []);
      if (rcRes.success) setReportCards(rcRes.data || []);
    } catch (err) {
      console.error('Failed to load student data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Open Challan for download / print
  const handleOpenChallan = async (voucherId) => {
    try {
      const res = await axiosClient.get(`/fees/vouchers/${voucherId}/challan`);
      if (res.success) {
        setChallanData(res.data);
        setChallanModalOpen(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const totalOutstanding = vouchers.reduce(
    (sum, v) => sum + (parseFloat(v.total_amount) - parseFloat(v.discount_amount) - parseFloat(v.paid_amount)),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Profile Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-200">
              {user?.profile?.first_name?.[0] || 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {user?.profile?.first_name} {user?.profile?.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold">
                  Adm: {user?.profile?.admission_no}
                </span>
                <span>&bull;</span>
                <span>
                  {user?.enrollment?.class_name} ({user?.enrollment?.section_name})
                </span>
                <span>&bull;</span>
                <span className="font-semibold text-slate-700">Roll #{user?.enrollment?.roll_number}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">Outstanding Balance</div>
              <div
                className={`text-xl font-bold ${
                  totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                PKR {totalOutstanding.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

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
            <span>Class Timetable</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'fees'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Fee Vouchers & Challans</span>
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'grades'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Report Card & Grades</span>
          </button>
        </div>

        {/* TAB 1: CLASS TIMETABLE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Weekly Class Timetable ({user?.enrollment?.class_name} - {user?.enrollment?.section_name})
                </h2>
                <p className="text-xs text-slate-500">Official scheduled periods for Academic Session 2026-2027</p>
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
                  title: 'Time',
                  key: 'time',
                  render: (r) => (
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}
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
                  title: 'Instructor',
                  key: 'teacher',
                  render: (r) => `${r.teacher_first_name} ${r.teacher_last_name}`
                },
                { title: 'Room', key: 'room_number' }
              ]}
              data={timetable}
              emptyMessage="No timetable slots found for your class section."
            />
          </div>
        )}

        {/* TAB 2: FEE VOUCHERS */}
        {activeTab === 'fees' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Fee Ledger & Payment Challans</h2>
              <p className="text-xs text-slate-500">
                View monthly bills, paid amounts, and download official 3-copy bank challans
              </p>
            </div>

            <Table
              columns={[
                {
                  title: 'Challan / Voucher #',
                  key: 'voucher_no',
                  render: (r) => <span className="font-mono text-xs font-semibold text-slate-900">{r.voucher_no}</span>
                },
                { title: 'Month', key: 'month_year' },
                {
                  title: 'Due Date',
                  key: 'due_date',
                  render: (r) => (
                    <span className="text-xs font-semibold text-rose-700">{r.due_date}</span>
                  )
                },
                {
                  title: 'Total Amount',
                  key: 'total',
                  render: (r) => `PKR ${parseFloat(r.total_amount).toLocaleString()}`
                },
                {
                  title: 'Paid Amount',
                  key: 'paid',
                  render: (r) => (
                    <span className="font-semibold text-emerald-700">
                      PKR {parseFloat(r.paid_amount).toLocaleString()}
                    </span>
                  )
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (r) => (
                    <Badge
                      variant={
                        r.status === 'paid'
                          ? 'success'
                          : r.status === 'partially_paid'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {r.status?.toUpperCase()}
                    </Badge>
                  )
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (r) => (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Printer}
                      onClick={() => handleOpenChallan(r.id)}
                    >
                      Print Challan
                    </Button>
                  )
                }
              ]}
              data={vouchers}
              emptyMessage="No fee vouchers issued for your account."
            />
          </div>
        )}

        {/* TAB 3: REPORT CARDS & GRADES */}
        {activeTab === 'grades' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official Examination Report Cards</h2>
              <p className="text-xs text-slate-500">
                Verified marks obtained, subject breakdowns, grades, and teacher remarks
              </p>
            </div>

            {reportCards.length > 0 ? (
              reportCards.map((rc) => (
                <div
                  key={rc.exam_id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
                >
                  {/* Exam Term Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-xl font-bold text-slate-900">{rc.exam_name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Academic Session 2026-2027 &bull; {rc.student.class_name} ({rc.student.section_name})
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
                      { title: 'Total Marks', key: 'total_marks' },
                      { title: 'Passing Marks', key: 'passing_marks' },
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
                        title: 'Result Status',
                        key: 'is_passed',
                        render: (r) => (
                          <Badge variant={r.is_passed ? 'success' : 'danger'}>
                            {r.is_passed ? 'PASSED' : 'FAILED'}
                          </Badge>
                        )
                      },
                      {
                        title: 'Teacher Remarks',
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
                No published exam report cards available for your account yet.
              </div>
            )}
          </div>
        )}

        {/* MODAL: 3-COPY CHALLAN VIEW */}
        <Modal
          isOpen={challanModalOpen}
          onClose={() => setChallanModalOpen(false)}
          title="Print Official Fee Challan"
          subtitle="3-Copy Bank, School, and Student Challan"
          maxWidth="max-w-5xl"
        >
          {challanData && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" variant="primary" icon={Printer} onClick={() => window.print()}>
                  Print Challan
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] border border-slate-300 p-3 bg-white rounded-lg">
                {['Bank Copy', 'School Copy', 'Student Copy'].map((copyTitle) => (
                  <div key={copyTitle} className="border border-slate-300 p-3 rounded space-y-2 bg-slate-50/40">
                    <div className="text-center border-b border-slate-300 pb-2">
                      <div className="font-extrabold text-xs text-slate-900">AL SUFFA EDUCATION SYSTEM</div>
                      <div className="text-[10px] text-slate-500">Sector H-11, Islamabad</div>
                      <div className="font-bold text-emerald-800 uppercase tracking-widest mt-1 text-[10px]">
                        -- {copyTitle} --
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span className="font-medium">Challan No:</span>
                        <span className="font-bold font-mono">{challanData.voucher.voucher_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span className="font-semibold text-rose-700">{challanData.voucher.due_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student:</span>
                        <span className="font-semibold text-slate-900">
                          {challanData.voucher.first_name} {challanData.voucher.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Admission No:</span>
                        <span className="font-mono">{challanData.voucher.admission_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Class & Section:</span>
                        <span>{challanData.voucher.class_name} ({challanData.voucher.section_name})</span>
                      </div>
                    </div>

                    <div className="border-t border-b border-slate-300 py-1.5 space-y-1">
                      <div className="font-bold text-[10px] text-slate-500 uppercase">Itemized Dues:</div>
                      {challanData.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.fee_head_name}</span>
                          <span className="font-mono">PKR {parseFloat(item.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between font-bold text-xs pt-1 text-slate-900">
                      <span>Total Payable:</span>
                      <span>PKR {parseFloat(challanData.voucher.total_amount).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-xs text-emerald-800">
                      <span>Paid Amount:</span>
                      <span>PKR {parseFloat(challanData.voucher.paid_amount).toLocaleString()}</span>
                    </div>

                    <div className="border-t border-slate-300 pt-3 text-[10px] space-y-3">
                      <div>
                        <div className="font-semibold text-slate-800">Deposit at:</div>
                        <div>{challanData.bank_details.bank_name}</div>
                        <div>A/C: {challanData.bank_details.account_number}</div>
                      </div>
                      <div className="flex justify-between pt-6 border-t border-dashed border-slate-300 text-slate-500">
                        <span>Bank Officer Stamp</span>
                        <span>Cashier Sign</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

