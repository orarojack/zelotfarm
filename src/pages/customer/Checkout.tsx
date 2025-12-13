import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { MapPin, Phone, CreditCard, ArrowLeft, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Checkout() {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { customer, signIn, signUp, loading: authContextLoading } = useCustomerAuth();
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(true); // true for login, false for signup
  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [formData, setFormData] = useState({
    shipping_address: customer?.address || '',
    shipping_city: customer?.city || '',
    shipping_county: customer?.county || '',
    shipping_postal_code: customer?.postal_code || '',
    shipping_phone: customer?.phone || '',
    payment_method: 'MPesa' as 'MPesa' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'Card',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/customer/cart');
      return;
    }

    if (customer) {
      // Update form data with customer info
      setFormData({
        shipping_address: customer.address || '',
        shipping_city: customer.city || '',
        shipping_county: customer.county || '',
        shipping_postal_code: customer.postal_code || '',
        shipping_phone: customer.phone || '',
        payment_method: 'MPesa',
        notes: '',
      });
    }
  }, [customer, cartItems, navigate]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (showLogin) {
        // Login
        await signIn(authFormData.email, authFormData.password);
        // Temp cart will be synced automatically via useEffect in CartContext
      } else {
        // Signup
        if (authFormData.password !== authFormData.confirmPassword) {
          setAuthError('Passwords do not match');
          return;
        }
        if (authFormData.password.length < 6) {
          setAuthError('Password must be at least 6 characters');
          return;
        }
        await signUp(
          authFormData.email,
          authFormData.password,
          authFormData.fullName,
          authFormData.phone || undefined
        );
        // Temp cart will be synced automatically
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!customer) throw new Error('Not logged in');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customer.id,
          total_amount: totalAmount + (totalAmount >= 5000 ? 0 : 500),
          shipping_address: formData.shipping_address,
          shipping_city: formData.shipping_city,
          shipping_county: formData.shipping_county,
          shipping_postal_code: formData.shipping_postal_code,
          shipping_phone: formData.shipping_phone,
          payment_method: formData.payment_method,
          notes: formData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        bid_id: item.bid_id || null,
        item_name: item.product?.name || item.bid?.name || 'Unknown Item',
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart();

      // Navigate to order confirmation
      navigate(`/customer/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  const shippingCost = totalAmount >= 5000 ? 0 : 500;
  const finalTotal = totalAmount + shippingCost;

  // Show authentication if not logged in
  if (!customer && !authContextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/customer/cart"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5a8a3d] mb-6"
          >
            <ArrowLeft size={20} />
            Back to Cart
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Authentication Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setAuthError('');
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      showLogin
                        ? 'bg-[#5a8a3d] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <LogIn size={20} className="inline mr-2" />
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setShowLogin(false);
                      setAuthError('');
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      !showLogin
                        ? 'bg-[#5a8a3d] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <UserPlus size={20} className="inline mr-2" />
                    Sign Up
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {showLogin ? 'Login to Continue' : 'Create Account to Continue'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {showLogin
                    ? 'Sign in to complete your order'
                    : 'Create an account to complete your order and track your purchases'}
                </p>

                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {!showLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          required={!showLogin}
                          value={authFormData.fullName}
                          onChange={(e) => setAuthFormData({ ...authFormData, fullName: e.target.value })}
                          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        required
                        value={authFormData.email}
                        onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                        className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {!showLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="tel"
                          value={authFormData.phone}
                          onChange={(e) => setAuthFormData({ ...authFormData, phone: e.target.value })}
                          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                          placeholder="+254 700 000 000"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="password"
                        required
                        value={authFormData.password}
                        onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                        className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {!showLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          required={!showLogin}
                          value={authFormData.confirmPassword}
                          onChange={(e) => setAuthFormData({ ...authFormData, confirmPassword: e.target.value })}
                          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#5a8a3d] to-[#4a7a2d] text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                        {showLogin ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      showLogin ? 'Sign In & Continue' : 'Create Account & Continue'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span>
                        {item.product?.name || item.bid?.name} x {item.quantity}
                      </span>
                      <span>KES {(item.quantity * item.unit_price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>KES {totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                      {shippingCost === 0 ? 'Free' : `KES ${shippingCost.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-[#5a8a3d]">KES {finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show checkout form if logged in
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/customer/cart"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5a8a3d] mb-6"
        >
          <ArrowLeft size={20} />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={24} />
                Shipping Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.shipping_city}
                      onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                    <input
                      type="text"
                      value={formData.shipping_county}
                      onChange={(e) => setFormData({ ...formData, shipping_county: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={formData.shipping_postal_code}
                      onChange={(e) =>
                        setFormData({ ...formData, shipping_postal_code: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Phone size={16} />
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.shipping_phone}
                      onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={24} />
                Payment Method
              </h2>
              <div className="space-y-3">
                {(['MPesa', 'Cash', 'Bank Transfer', 'Cheque', 'Card'] as const).map((method) => (
                  <label
                    key={method}
                    className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method}
                      checked={formData.payment_method === method}
                      onChange={(e) =>
                        setFormData({ ...formData, payment_method: e.target.value as any })
                      }
                      className="mr-3 text-[#5a8a3d] focus:ring-[#5a8a3d]"
                    />
                    <span className="font-medium">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span>
                      {item.product?.name || item.bid?.name} x {item.quantity}
                    </span>
                    <span>KES {(item.quantity * item.unit_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>KES {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'Free' : `KES ${shippingCost.toLocaleString()}`}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-[#5a8a3d]">KES {finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-[#5a8a3d] to-[#4a7a2d] text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
