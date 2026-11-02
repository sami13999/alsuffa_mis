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
  Receipt,
  Search,
  Printer,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function FeeCollectionPOSPage() {
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [challanData, setChallanData] = useState(null);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_method: 'cash',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/fees/vouchers', {
        params: { search, status: statusFilter || undefined }
      });
      if (res.success) setVouchers(res.data || []);
    } catch (err) {
      console.error('Failed to load POS vouchers:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  // Handle Payment Submit
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post('/fees/payments/collect', {
        voucher_id: selectedVoucher.id,
        ...paymentForm
      });
      setMessage(res.message);
      setPayModalOpen(false);
      loadVouchers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Challan Modal
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fee Collection Point of Sale (POS)
            </h1>
            <p className="text-xs text-slate-500">
              Live Cashier Counter: Search Vouchers, Process Partial/Full Payments & Print 3-Copy Challans
            </p>
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

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, admission #, or student name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Payment Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid (Settled)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Vouchers Found: <strong className="text-slate-800">{vouchers.length}</strong>
          </div>
        </div>

        {/* Vouchers Table */}
        <Table
          columns={[
            {
              title: 'Voucher Number',
              key: 'voucher_no',
              render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.voucher_no}</span>
            },
            {
              title: 'Student & Father',
              key: 'student',
              render: (r) => (
                <div>
                  <div className="font-semibold text-slate-900">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-slate-500">Adm: {r.admission_no} &bull; S/O {r.father_name}</div>
                </div>
              )
            },
            {
              title: 'Class',
              key: 'class',
              render: (r) => `${r.class_name || 'N/A'} - ${r.section_name || ''} (Roll #${r.roll_number || 'N/A'})`
            },
            { title: 'Billing Month', key: 'month_year' },
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
              title: 'Actions',
              key: 'actions',
              render: (r) => (
                <div className="flex items-center gap-2">
                  {r.status !== 'paid' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedVoucher(r);
                        const remaining = parseFloat(r.total_amount) - parseFloat(r.discount_amount) - parseFloat(r.paid_amount);
                        setPaymentForm({
                          amount_paid: remaining,
                          payment_method: 'cash',
                          transaction_reference: '',
                          payment_date: new Date().toISOString().split('T')[0]
                        });
                        setError(null);
                        setPayModalOpen(true);
                      }}
                    >
                      Collect Fee
                    </Button>
                  )}
                  <button
                    onClick={() => handleOpenChallan(r.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    title="Print 3-Copy Challan"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Challan</span>
                  </button>
                </div>
              )
            }
          ]}
          data={vouchers}
        />

        {/* MODAL: COLLECT PAYMENT */}
        <Modal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          title="Collect Fee Payment (POS Counter)"
          subtitle={`Voucher: ${selectedVoucher?.voucher_no} - Student: ${selectedVoucher?.first_name} ${selectedVoucher?.last_name}`}
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <div className="text-slate-500">Total Voucher Amount</div>
                <div className="font-bold text-slate-900 text-sm">
                  PKR {parseFloat(selectedVoucher?.total_amount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Already Paid</div>
                <div className="font-bold text-emerald-600 text-sm">
                  PKR {parseFloat(selectedVoucher?.paid_amount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Remaining Balance</div>
                <div className="font-bold text-rose-600 text-sm">
                  PKR {(parseFloat(selectedVoucher?.total_amount || 0) - parseFloat(selectedVoucher?.paid_amount || 0)).toLocaleString()}
                </div>
              </div>
            </div>

            <Input
              label="Amount to Collect (PKR)"
              type="number"
              step="0.01"
              value={paymentForm.amount_paid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Payment Method"
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                options={[
                  { value: 'cash', label: 'Cash Counter' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'cheque', label: 'Cheque' },
                  { value: 'online', label: 'Online Deposit' }
                ]}
                required
              />
              <Input
                label="Payment Date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                required
              />
            </div>

            <Input
              label="Transaction / Deposit Reference"
              value={paymentForm.transaction_reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
              placeholder="e.g. Cash Receipt # or Bank Slip ID"
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading} icon={DollarSign}>
                Record Payment & Issue Receipt
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: 3-COPY CHALLAN */}
        <Modal
          isOpen={challanModalOpen}
          onClose={() => setChallanModalOpen(false)}
          title="Printable 3-Copy Fee Challan"
          subtitle="Official Bank, School, and Student copies conforming to Pakistani banking standards"
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
                      <div className="text-[10px] text-slate-500">Sector H-11, Islamabad &bull; Ph: 051-1234567</div>
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
                      <div className="font-bold text-[10px] text-slate-500 uppercase">Fee Breakdown:</div>
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
                        <div className="font-semibold text-slate-800">Bank Details:</div>
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

