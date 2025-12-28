import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Payment, Invoice, PaymentMethod, PaymentStatusType } from '../../../types';
import { Plus, Edit, Search, DollarSign } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function PaymentManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    invoice: '',
    status: '' as PaymentStatusType | '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    invoice_id: '',
    payment_date: new Date(),
    payment_method: 'Cash' as PaymentMethod,
    amount_paid: '',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  const generatePaymentReference = async (): Promise<string> => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAY-${dateStr}-${random}`;
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const calculateOutstandingBalance = (invoiceId: string, paymentAmount: number): number => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return 0;
    
    const existingPayments = payments
      .filter(p => p.invoice_id === invoiceId && p.id !== editingPayment?.id)
      .reduce((sum, p) => sum + p.amount_paid, 0);
    
    const totalPaid = existingPayments + paymentAmount;
    return Math.max(0, invoice.total_amount - totalPaid);
  };

  const getPaymentStatus = (outstandingBalance: number, invoiceTotal: number): PaymentStatusType => {
    if (outstandingBalance === 0) return 'Fully Paid';
    if (outstandingBalance < invoiceTotal) return 'Partially Paid';
    return 'Pending';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const paymentReference = editingPayment?.payment_reference || await generatePaymentReference();
      const amountPaid = parseFloat(formData.amount_paid);
      const invoice = invoices.find(i => i.id === formData.invoice_id);
      
      if (!invoice) {
        alert('Please select an invoice');
        return;
      }

      if (amountPaid <= 0) {
        alert('Payment amount must be greater than 0');
        return;
      }

      const outstandingBalance = calculateOutstandingBalance(formData.invoice_id, amountPaid);
      const status = getPaymentStatus(outstandingBalance, invoice.total_amount);

      const paymentData: any = {
        payment_reference: paymentReference,
        invoice_id: formData.invoice_id,
        payment_date: formData.payment_date.toISOString().split('T')[0],
        payment_method: formData.payment_method,
        amount_paid: amountPaid,
        outstanding_balance: outstandingBalance,
        status: status,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingPayment) {
        const { error } = await supabase
          .from('payments')
          .update({ ...paymentData, updated_at: new Date().toISOString() })
          .eq('id', editingPayment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('payments').insert([paymentData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error saving payment');
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      payment_date: new Date(),
      payment_method: 'Cash',
      amount_paid: '',
      notes: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filteredPayments = payments.filter((payment) => {
    const invoice = invoices.find((i) => i.id === payment.invoice_id);
    const matchesSearch = filter.search === '' || 
      payment.payment_reference.toLowerCase().includes(filter.search.toLowerCase()) ||
      invoice?.invoice_number.toLowerCase().includes(filter.search.toLowerCase());
    const matchesInvoice = filter.invoice === '' || payment.invoice_id === filter.invoice;
    const matchesStatus = filter.status === '' || payment.status === filter.status;
    const matchesDateFrom = filter.dateFrom === '' || new Date(payment.payment_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(payment.payment_date) <= new Date(filter.dateTo);
    return matchesSearch && matchesInvoice && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search payments..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.invoice}
            onChange={(e) => setFilter({ ...filter, invoice: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Invoices</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>{invoice.invoice_number}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as PaymentStatusType | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Fully Paid">Fully Paid</option>
          </select>
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingPayment(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Record Payment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Payments</h3>
          <TableActions
            tableId="payments-table"
            title="Payments"
            data={filteredPayments}
            filteredData={filteredPayments}
            columns={[
              { key: 'payment_reference', label: 'Payment Ref' },
              { key: 'invoice_id', label: 'Invoice' },
              { key: 'payment_date', label: 'Date' },
              { key: 'amount_paid', label: 'Amount' },
              { key: 'status', label: 'Status' },
            ]}
            getRowData={(payment) => {
              const invoice = invoices.find((i) => i.id === payment.invoice_id);
              return {
                'payment_reference': payment.payment_reference,
                'invoice_id': invoice?.invoice_number || 'N/A',
                'payment_date': payment.payment_date,
                'amount_paid': payment.amount_paid,
                'status': payment.status,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="payments-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const invoice = invoices.find((i) => i.id === payment.invoice_id);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{payment.payment_reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice?.invoice_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.payment_method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      KES {payment.amount_paid.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {payment.outstanding_balance !== undefined ? `KES ${payment.outstanding_balance.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === 'Fully Paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingPayment(payment);
                          setFormData({
                            invoice_id: payment.invoice_id,
                            payment_date: new Date(payment.payment_date),
                            payment_method: payment.payment_method,
                            amount_paid: payment.amount_paid.toString(),
                            notes: payment.notes || '',
                          });
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPayment ? 'Edit Payment' : 'Record Payment'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingPayment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Reference <span className="text-xs text-gray-500">(Unique identifier for each payment)</span>
                  </label>
                  <input
                    type="text"
                    value={editingPayment.payment_reference}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Linked Invoice Number * <span className="text-xs text-gray-500">(Reference invoice being paid)</span>
                </label>
                <select
                  value={formData.invoice_id}
                  onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Invoice</option>
                  {invoices.map((invoice) => {
                    const existingPayments = payments
                      .filter(p => p.invoice_id === invoice.id && p.id !== editingPayment?.id)
                      .reduce((sum, p) => sum + p.amount_paid, 0);
                    const remaining = invoice.total_amount - existingPayments;
                    return (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - Total: KES {invoice.total_amount.toFixed(2)} 
                        {remaining > 0 ? ` (Remaining: KES ${remaining.toFixed(2)})` : ' (Fully Paid)'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date * <span className="text-xs text-gray-500">(Date payment is received)</span>
                  </label>
                  <DatePicker
                    selected={formData.payment_date}
                    onChange={(date: Date) => setFormData({ ...formData, payment_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method * <span className="text-xs text-gray-500">(Cash, Bank Transfer, M-Pesa, Cheque, Card)</span>
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="MPesa">M-Pesa</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Paid * <span className="text-xs text-gray-500">(Amount received from customer)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                {formData.invoice_id && formData.amount_paid && (
                  <div className="mt-2 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-700">
                      Outstanding Balance: KES {calculateOutstandingBalance(formData.invoice_id, parseFloat(formData.amount_paid) || 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Remarks <span className="text-xs text-gray-500">(Optional details for internal records)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingPayment ? 'Update' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPayment(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

