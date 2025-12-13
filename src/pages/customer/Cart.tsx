import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cartItems, loading, totalAmount, removeFromCart, updateQuantity } = useCart();
  const { customer } = useCustomerAuth();

  // Allow viewing cart even when not logged in (temp cart)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a8a3d]"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Start adding items to your cart</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5a8a3d] text-white rounded-lg hover:bg-[#4a7a2d] transition-colors"
          >
            Browse Products
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.product;
              const bid = item.bid;
              const name = product?.name || bid?.name || 'Unknown Item';
              const image = product?.image_url || bid?.image_url || '';
              const price = item.unit_price;

              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 flex gap-4">
                  <img
                    src={image || 'https://via.placeholder.com/150'}
                    alt={name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.item_type === 'product' ? 'Product' : 'Live Bid'}
                    </p>
                    <p className="text-lg font-bold text-[#5a8a3d] mb-4">
                      KES {price.toLocaleString()} per unit
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-gray-900">
                          KES {(item.quantity * price).toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>KES {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={totalAmount >= 5000 ? 'text-green-600' : ''}>
                    {totalAmount >= 5000 ? 'Free' : 'KES 500'}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-[#5a8a3d]">
                    KES {(totalAmount + (totalAmount >= 5000 ? 0 : 500)).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                to="/customer/checkout"
                className="w-full block text-center py-3 px-4 bg-gradient-to-r from-[#5a8a3d] to-[#4a7a2d] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                {customer ? 'Proceed to Checkout' : 'Continue to Checkout'}
              </Link>
              {!customer && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  You'll be able to login or create an account during checkout
                </p>
              )}

              {totalAmount < 5000 && (
                <p className="text-sm text-gray-600 text-center mt-4">
                  Add KES {(5000 - totalAmount).toLocaleString()} more for free shipping!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

