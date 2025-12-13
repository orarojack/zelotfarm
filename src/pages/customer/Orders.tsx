import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem } from '../../types';
import { Package, CheckCircle, Clock, XCircle, Truck, MapPin, Phone } from 'lucide-react';

export default function Orders() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !customer) {
      navigate('/customer/login');
      return;
    }

    if (customer) {
      fetchOrders();
    }
  }, [customer, authLoading, navigate]);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const fetchOrders = async () => {
    if (!customer) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setSelectedOrder(order);

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(items || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={20} />;
      case 'shipped':
        return <Truck className="text-blue-600" size={20} />;
      default:
        return <Clock className="text-yellow-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a8a3d]"></div>
      </div>
    );
  }

  if (id && selectedOrder) {
    // Order detail view
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5a8a3d] mb-6"
          >
            ← Back to Orders
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order {selectedOrder.order_number}</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="font-semibold capitalize">{selectedOrder.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin size={18} />
                  Shipping Address
                </h3>
                <p className="text-gray-600 text-sm">
                  {selectedOrder.shipping_address}
                  <br />
                  {selectedOrder.shipping_city}
                  {selectedOrder.shipping_county && `, ${selectedOrder.shipping_county}`}
                  {selectedOrder.shipping_postal_code && ` ${selectedOrder.shipping_postal_code}`}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Phone size={18} />
                  Contact
                </h3>
                <p className="text-gray-600 text-sm">{selectedOrder.shipping_phone}</p>
                {selectedOrder.payment_method && (
                  <p className="text-gray-600 text-sm mt-1">
                    Payment: {selectedOrder.payment_method}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4 border-b last:border-0">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x KES {item.unit_price.toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">
                    KES {item.total_price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-[#5a8a3d]">
                KES {selectedOrder.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Orders list view
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5a8a3d] text-white rounded-lg hover:bg-[#4a7a2d] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/customer/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order {order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-bold text-gray-900">
                        KES {order.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="font-semibold capitalize">{order.status}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

