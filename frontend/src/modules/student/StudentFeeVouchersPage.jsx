import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import {
  Receipt,
  Printer,
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';

export default function StudentFeeVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [challanData, setChallanData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/fees/vouchers');
      if (res.success) setVouchers(res.data || []);
    } catch (err) {
      console.error('Failed to load student fee vouchers:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fee Ledger & Printable Challans
            </h1>
            <p className="text-xs text-slate-500">
              Review Issued Monthly Vouchers, Paid Receipts, and Print 3-Copy Bank Challans
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Net Arrears Due:</span>
              <span
                className={`text-lg font-bold ${
                  totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                PKR {totalOutstanding.toLocaleString()}
              </span>
            </div>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadVouchers} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Bank Deposit Instruction Card */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-emerald-700" />
            <div>
              <div className="font-bold text-emerald-950 text-sm">Designated Fee Deposit Account</div>
              <div className="text-xs text-emerald-800">
                Deposit at any Meezan Bank branch across Pakistan &bull; A/C: <strong>0102-0103984712</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Vouchers Table */}
        <Table
          columns={[
            {
              title: 'Challan / Voucher #',
              key: 'voucher_no',
              render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.voucher_no}</span>
            },
            { title: 'Billing Month', key: 'month_year' },
            {
              title: 'Due Date',
              key: 'due_date',
              render: (r) => <span className="text-xs font-semibold text-rose-700">{r.due_date}</span>
            },
            {
              title: 'Total Payable',
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
              title: 'Remaining Due',
              key: 'remaining',
              render: (r) => {
                const rem = parseFloat(r.total_amount) - parseFloat(r.discount_amount) - parseFloat(r.paid_amount);
                return (
                  <span className={`font-bold ${rem > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    PKR {rem.toLocaleString()}
                  </span>
                );
              }
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
          emptyMessage="No fee vouchers have been issued to your account."
        />

        {/* MODAL: 3-COPY CHALLAN */}
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
                        <span>Father Name:</span>
                        <span>{challanData.voucher.father_name}</span>
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

