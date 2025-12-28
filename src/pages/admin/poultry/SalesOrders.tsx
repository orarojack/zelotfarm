import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PoultryOrder, PoultryOrderItem, CustomerEnhanced, ProductType, PoultryBatch, OrderStatus } from '../../../types';
import { Plus, Edit, Search, ShoppingCart, Package } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function SalesOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PoultryOrder[]>([]);
  const [orderItems, setOrderItems] = useState<PoultryOrderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerEnhanced[]>([]);
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PoultryOrder | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    customer: '',
    status: '' as OrderStatus | '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date(),
    delivery_date: undefined as Date | undefined,
    status: 'Pending' as OrderStatus,
    notes: '',
  });

  const [orderItemsData, setOrderItemsData] = useState<Array<{
    item_type: ProductType;
    item_name: string;
    quantity: string;
    unit: string;
    unit_price: string;
    batch_id: string;
    notes: string;
  }>>([{
    item_type: 'Eggs',
    item_name: '',
    quantity: '',
    unit: 'eggs',
    unit_price: '',
    batch_id: '',
    notes: '',
  }]);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchBatches();
  }, []);

  useEffect(() => {
    if (editingOrder) {
      fetchOrderItems(editingOrder.id);
    }
  }, [editingOrder]);

  const generateOrderReference = async (): Promise<string> => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
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
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('poultry_order_items')
        .select('*')
        .eq('order_id', orderId);
      if (error) throw error;
      if (data && data.length > 0) {
        setOrderItemsData(data.map(item => ({
          item_type: item.item_type,
          item_name: item.item_name,
          quantity: item.quantity.toString(),
          unit: item.unit,
          unit_price: item.unit_price.toString(),
          batch_id: item.batch_id || '',
          notes: item.notes || '',
        })));
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
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

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_batches')
        .select('*')
        .order('placement_date', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const calculateTotalAmount = (): number => {
    return orderItemsData.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const orderReference = editingOrder?.order_reference || await generateOrderReference();
      const totalAmount = calculateTotalAmount();

      if (orderItemsData.length === 0 || orderItemsData.some(item => !item.item_name || !item.quantity || !item.unit_price)) {
        alert('Please add at least one order item with name, quantity, and unit price');
        return;
      }

      const orderData: any = {
        order_reference: orderReference,
        customer_id: formData.customer_id,
        order_date: formData.order_date.toISOString().split('T')[0],
        delivery_date: formData.delivery_date?.toISOString().split('T')[0] || null,
        status: formData.status,
        total_amount: totalAmount,
        notes: formData.notes || null,
        created_by: user.id,
      };

      let orderId: string;

      if (editingOrder) {
        const { data, error } = await supabase
          .from('poultry_orders')
          .update({ ...orderData, updated_at: new Date().toISOString() })
          .eq('id', editingOrder.id)
          .select()
          .single();
        if (error) throw error;
        orderId = editingOrder.id;
        
        // Delete existing items
        await supabase.from('poultry_order_items').delete().eq('order_id', orderId);
      } else {
        const { data, error } = await supabase
          .from('poultry_orders')
          .insert([orderData])
          .select()
          .single();
        if (error) throw error;
        orderId = data.id;
      }

      // Insert order items
      const itemsToInsert = orderItemsData
        .filter(item => item.item_name && item.quantity && item.unit_price)
        .map(item => ({
          order_id: orderId,
          item_type: item.item_type,
          item_name: item.item_name,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
          batch_id: item.batch_id || null,
          notes: item.notes || null,
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('poultry_order_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      setShowModal(false);
      setEditingOrder(null);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      order_date: new Date(),
      delivery_date: undefined,
      status: 'Pending',
      notes: '',
    });
    setOrderItemsData([{
      item_type: 'Eggs',
      item_name: '',
      quantity: '',
      unit: 'eggs',
      unit_price: '',
      batch_id: '',
      notes: '',
    }]);
  };

  const addOrderItem = () => {
    setOrderItemsData([...orderItemsData, {
      item_type: 'Eggs',
      item_name: '',
      quantity: '',
      unit: 'eggs',
      unit_price: '',
      batch_id: '',
      notes: '',
    }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItemsData(orderItemsData.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItemsData];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItemsData(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const customer = customers.find((c) => c.id === order.customer_id);
    const matchesSearch = filter.search === '' || 
      order.order_reference.toLowerCase().includes(filter.search.toLowerCase()) ||
      customer?.customer_name.toLowerCase().includes(filter.search.toLowerCase());
    const matchesCustomer = filter.customer === '' || order.customer_id === filter.customer;
    const matchesStatus = filter.status === '' || order.status === filter.status;
    const matchesDateFrom = filter.dateFrom === '' || new Date(order.order_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(order.order_date) <= new Date(filter.dateTo);
    return matchesSearch && matchesCustomer && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders..."
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
            onChange={(e) => setFilter({ ...filter, status: e.target.value as OrderStatus | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
            placeholder="From Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
            placeholder="To Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingOrder(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
          <TableActions
            tableId="orders-table"
            title="Orders"
            data={filteredOrders}
            filteredData={filteredOrders}
            columns={[
              { key: 'order_reference', label: 'Order Ref' },
              { key: 'customer_id', label: 'Customer' },
              { key: 'order_date', label: 'Date' },
              { key: 'total_amount', label: 'Amount' },
              { key: 'status', label: 'Status' },
            ]}
            getRowData={(order) => {
              const customer = customers.find((c) => c.id === order.customer_id);
              return {
                'order_reference': order.order_reference,
                'customer_id': customer?.customer_name || 'N/A',
                'order_date': order.order_date,
                'total_amount': order.total_amount,
                'status': order.status,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="orders-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const customer = customers.find((c) => c.id === order.customer_id);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.order_reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{customer?.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      KES {order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Dispatched' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={async () => {
                          setEditingOrder(order);
                          setFormData({
                            customer_id: order.customer_id,
                            order_date: new Date(order.order_date),
                            delivery_date: order.delivery_date ? new Date(order.delivery_date) : undefined,
                            status: order.status,
                            notes: order.notes || '',
                          });
                          await fetchOrderItems(order.id);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl my-8">
            <h2 className="text-2xl font-bold mb-3">
              {editingOrder ? 'Edit Order' : 'Create Order'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {editingOrder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Reference <span className="text-xs text-gray-500">(Auto-generated unique order number)</span>
                  </label>
                  <input
                    type="text"
                    value={editingOrder.order_reference}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date * <span className="text-xs text-gray-500">(Date order is placed)</span>
                  </label>
                  <DatePicker
                    selected={formData.order_date}
                    onChange={(date: Date) => setFormData({ ...formData, order_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date <span className="text-xs text-gray-500">(Expected delivery date)</span>
                  </label>
                  <DatePicker
                    selected={formData.delivery_date}
                    onChange={(date: Date | null) => setFormData({ ...formData, delivery_date: date || undefined })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Status * <span className="text-xs text-gray-500">(Pending, Confirmed, Dispatched, Delivered, Cancelled)</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Order Items</h3>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <Plus size={18} />
                    Add Item
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orderItemsData.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-12 gap-2 mb-2">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Item Type</label>
                          <select
                            value={item.item_type}
                            onChange={(e) => updateOrderItem(index, 'item_type', e.target.value as ProductType)}
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                          >
                            <option value="Eggs">Eggs</option>
                            <option value="Broilers">Broilers</option>
                            <option value="Layers">Layers</option>
                            <option value="Feed">Feed</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => updateOrderItem(index, 'item_name', e.target.value)}
                            required
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                            placeholder="Item name"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                            required
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateOrderItem(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                            placeholder="eggs, kg, etc."
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeOrderItem(index)}
                            className="mt-6 text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateOrderItem(index, 'unit_price', e.target.value)}
                            required
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total Price</label>
                          <input
                            type="text"
                            value={item.quantity && item.unit_price 
                              ? (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)
                              : '0.00'}
                            disabled
                            className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Batch (Optional)</label>
                          <select
                            value={item.batch_id}
                            onChange={(e) => updateOrderItem(index, 'batch_id', e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Select Batch</option>
                            {batches.map((batch) => (
                              <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="text-sm font-semibold">
                    Total Amount: KES {calculateTotalAmount().toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Instructions <span className="text-xs text-gray-500">(Optional customer instructions)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingOrder ? 'Update' : 'Create Order'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
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

