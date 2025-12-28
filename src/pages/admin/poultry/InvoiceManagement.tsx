import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Invoice, InvoiceItem, PoultryOrder, CustomerEnhanced, InvoiceStatus } from '../../../types';
import { Plus, Edit, Search, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function InvoiceManagement() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [orders, setOrders] = useState<PoultryOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    customer: '',
    status: '' as InvoiceStatus | '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    order_id: '',
    customer_id: '',
    invoice_date: new Date(),
    billing_address: '',
    subtotal: '0',
    tax_amount: '0',
    discount_amount: '0',
    status: 'Draft' as InvoiceStatus,
    notes: '',
  });

  const [itemsData, setItemsData] = useState<Array<{
    item_name: string;
    quantity: string;
    unit: string;
    unit_price: string;
  }>>([{
    item_name: '',
    quantity: '',
    unit: '',
    unit_price: '',
  }]);

  useEffect(() => {
    fetchInvoices();
    fetchOrders();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (editingInvoice) {
      fetchInvoiceItems(editingInvoice.id);
    }
  }, [editingInvoice]);

  const generateInvoiceNumber = async (): Promise<string> => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${dateStr}-${random}`;
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
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceItems = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      if (error) throw error;
      if (data && data.length > 0) {
        setItemsData(data.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity.toString(),
          unit: item.unit,
          unit_price: item.unit_price.toString(),
        })));
      }
    } catch (error) {
      console.error('Error fetching invoice items:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_orders')
        .select('*')
        .order('order_date', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('customer_name');
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('poultry_order_items')
        .select('*')
        .eq('order_id', orderId);
      if (error) throw error;
      if (data && data.length > 0) {
        setItemsData(data.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity.toString(),
          unit: item.unit,
          unit_price: item.unit_price.toString(),
        })));
        const subtotal = data.reduce((sum, item) => sum + item.total_price, 0);
        setFormData({ ...formData, subtotal: subtotal.toString() });
      }
    } catch (error) {
      console.error('Error loading order items:', error);
    }
  };

  const calculateSubtotal = (): number => {
    return itemsData.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const calculateTotal = (): number => {
    const subtotal = parseFloat(formData.subtotal) || calculateSubtotal();
    const tax = parseFloat(formData.tax_amount) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    return subtotal + tax - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const invoiceNumber = editingInvoice?.invoice_number || await generateInvoiceNumber();
      const subtotal = parseFloat(formData.subtotal) || calculateSubtotal();
      const taxAmount = parseFloat(formData.tax_amount) || 0;
      const discountAmount = parseFloat(formData.discount_amount) || 0;
      const totalAmount = calculateTotal();

      if (itemsData.length === 0 || itemsData.some(item => !item.item_name || !item.quantity || !item.unit_price)) {
        alert('Please add at least one invoice item');
        return;
      }

      const invoiceData: any = {
        invoice_number: invoiceNumber,
        order_id: formData.order_id || null,
        customer_id: formData.customer_id,
        invoice_date: formData.invoice_date.toISOString().split('T')[0],
        billing_address: formData.billing_address || null,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: formData.status,
        notes: formData.notes || null,
        created_by: user.id,
      };

      let invoiceId: string;

      if (editingInvoice) {
        const { error } = await supabase
          .from('invoices')
          .update({ ...invoiceData, updated_at: new Date().toISOString() })
          .eq('id', editingInvoice.id);
        if (error) throw error;
        invoiceId = editingInvoice.id;
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select()
          .single();
        if (error) throw error;
        invoiceId = data.id;
      }

      const itemsToInsert = itemsData
        .filter(item => item.item_name && item.quantity && item.unit_price)
        .map(item => ({
          invoice_id: invoiceId,
          item_name: item.item_name,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      order_id: '',
      customer_id: '',
      invoice_date: new Date(),
      billing_address: '',
      subtotal: '0',
      tax_amount: '0',
      discount_amount: '0',
      status: 'Draft',
      notes: '',
    });
    setItemsData([{
      item_name: '',
      quantity: '',
      unit: '',
      unit_price: '',
    }]);
  };

  const addItem = () => {
    setItemsData([...itemsData, {
      item_name: '',
      quantity: '',
      unit: '',
      unit_price: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItemsData(itemsData.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...itemsData];
    updated[index] = { ...updated[index], [field]: value };
    setItemsData(updated);
    if (field === 'quantity' || field === 'unit_price') {
      const subtotal = calculateSubtotal();
      setFormData({ ...formData, subtotal: subtotal.toString() });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const customer = customers.find((c) => c.id === invoice.customer_id);
    const matchesSearch = filter.search === '' || 
      invoice.invoice_number.toLowerCase().includes(filter.search.toLowerCase()) ||
      customer?.customer_name.toLowerCase().includes(filter.search.toLowerCase());
    const matchesCustomer = filter.customer === '' || invoice.customer_id === filter.customer;
    const matchesStatus = filter.status === '' || invoice.status === filter.status;
    const matchesDateFrom = filter.dateFrom === '' || new Date(invoice.invoice_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(invoice.invoice_date) <= new Date(filter.dateTo);
    return matchesSearch && matchesCustomer && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.customer}
            onChange={(e) => setFilter({ ...filter, customer: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.customer_name}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as InvoiceStatus | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
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
            setEditingInvoice(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
          <TableActions
            tableId="invoices-table"
            title="Invoices"
            data={filteredInvoices}
            filteredData={filteredInvoices}
            columns={[
              { key: 'invoice_number', label: 'Invoice #' },
              { key: 'customer_id', label: 'Customer' },
              { key: 'invoice_date', label: 'Date' },
              { key: 'total_amount', label: 'Amount' },
              { key: 'status', label: 'Status' },
            ]}
            getRowData={(invoice) => {
              const customer = customers.find((c) => c.id === invoice.customer_id);
              return {
                'invoice_number': invoice.invoice_number,
                'customer_id': customer?.customer_name || 'N/A',
                'invoice_date': invoice.invoice_date,
                'total_amount': invoice.total_amount,
                'status': invoice.status,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="invoices-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => {
                const customer = customers.find((c) => c.id === invoice.customer_id);
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{customer?.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">KES {invoice.subtotal.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">KES {invoice.tax_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">KES {invoice.discount_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      KES {invoice.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={async () => {
                          setEditingInvoice(invoice);
                          setFormData({
                            order_id: invoice.order_id || '',
                            customer_id: invoice.customer_id,
                            invoice_date: new Date(invoice.invoice_date),
                            billing_address: invoice.billing_address || '',
                            subtotal: invoice.subtotal.toString(),
                            tax_amount: invoice.tax_amount.toString(),
                            discount_amount: invoice.discount_amount.toString(),
                            status: invoice.status,
                            notes: invoice.notes || '',
                          });
                          await fetchInvoiceItems(invoice.id);
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingInvoice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number <span className="text-xs text-gray-500">(Auto-generated unique invoice number)</span>
                  </label>
                  <input
                    type="text"
                    value={editingInvoice.invoice_number}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linked Order ID <span className="text-xs text-gray-500">(Reference to the originating order)</span>
                  </label>
                  <select
                    value={formData.order_id}
                    onChange={(e) => {
                      setFormData({ ...formData, order_id: e.target.value });
                      if (e.target.value) {
                        loadOrderItems(e.target.value);
                        const order = orders.find(o => o.id === e.target.value);
                        if (order) {
                          setFormData(prev => ({ ...prev, customer_id: order.customer_id }));
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Order (Optional)</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>{order.order_reference}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer * <span className="text-xs text-gray-500">(Select from Customer database)</span>
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.customer_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date * <span className="text-xs text-gray-500">(Date invoice is issued)</span>
                  </label>
                  <DatePicker
                    selected={formData.invoice_date}
                    onChange={(date: Date) => setFormData({ ...formData, invoice_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Status * <span className="text-xs text-gray-500">(Draft, Sent, Paid, Overdue)</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Address <span className="text-xs text-gray-500">(Customer address for invoicing)</span>
                </label>
                <textarea
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Invoice Items */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Itemized Products</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <Plus size={18} />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {itemsData.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 border rounded p-2 bg-gray-50">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                          placeholder="Item name"
                          required
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          required
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          placeholder="Unit"
                          required
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          placeholder="Unit Price"
                          required
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={item.quantity && item.unit_price 
                            ? (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)
                            : '0.00'}
                          disabled
                          className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-lg font-semibold text-green-700">
                  Total Amount: KES {calculateTotal().toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Remarks <span className="text-xs text-gray-500">(Any special invoice instructions)</span>
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
                  {editingInvoice ? 'Update' : 'Create Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInvoice(null);
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

