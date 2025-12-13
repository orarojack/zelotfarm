import { useEffect, useState } from 'react';
import { MapPin, ShoppingCart, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EcommerceProduct } from '../types';
import { useCart } from '../contexts/CartContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { customer } = useCustomerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('ecommerce_products')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(18);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-KE');
  };

  const formatStock = (quantity: number, unit: string) => {
    return `Stock ${quantity.toLocaleString()} ${unit}`;
  };

  if (loading) {
    return (
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Featured Products
            </h2>
            <p className="text-gray-600">
              Explore our hand-picked selection of quality livestock products
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at the moment. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Featured Products
          </h2>
          <p className="text-gray-600">
            Explore our hand-picked selection of quality livestock products
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="relative h-40">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
                <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={16} className="text-gray-700" />
                </button>
                {product.is_featured && (
                  <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    Featured
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <div className="text-xl font-bold text-[#5a8a3d] mb-1">
                  KES {formatPrice(product.price)} <span className="text-sm text-gray-600">{product.unit}</span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {formatStock(product.stock_quantity, product.stock_unit)}
                </div>
                <div className="flex items-start gap-1 text-sm text-gray-600 mb-4">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{product.location}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await addToCart(product.id, undefined, 1);
                        alert('Item added to cart!');
                      } catch (error: any) {
                        alert(error.message || 'Failed to add to cart');
                      }
                    }}
                    className="flex-1 py-2 bg-[#5a8a3d] text-white rounded hover:bg-[#4a7a2d] transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Eye size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="px-6 py-3 border-2 border-[#5a8a3d] text-[#5a8a3d] rounded-lg font-semibold hover:bg-[#5a8a3d] hover:text-white transition-colors inline-flex items-center gap-2">
            View More Products
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
