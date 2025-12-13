import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EcommerceProduct, LiveBid, ProductCategory, Farm } from '../../types';
import { Plus, Edit, Trash2, ShoppingCart, Gavel, Tag, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from 'react-datepicker';

export default function Ecommerce() {
  const [activeTab, setActiveTab] = useState<'products' | 'bids' | 'categories'>('products');
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [liveBids, setLiveBids] = useState<LiveBid[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EcommerceProduct | null>(null);
  const [editingBid, setEditingBid] = useState<LiveBid | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    stock_quantity: '',
    stock_unit: '',
    location: '',
    image_url: '',
    category_id: '',
    farm_id: '',
    is_featured: false,
    is_active: true,
    display_order: '0',
  });
  const [bidFormData, setBidFormData] = useState({
    name: '',
    description: '',
    starting_price: '',
    current_price: '',
    unit: '',
    available_quantity: '',
    location: '',
    image_url: '',
    category_id: '',
    farm_id: '',
    start_time: new Date(),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    is_trending: false,
    is_active: true,
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon_name: '',
    display_order: '0',
    is_active: true,
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchFarms();
    fetchCategories();
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'bids') {
      fetchLiveBids();
    } else {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('ecommerce_products')
        .select('*')
        .order('display_order')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveBids = async () => {
    try {
      const { data, error } = await supabase
        .from('live_bids')
        .select('*')
        .order('end_time', { ascending: true });

      if (error) throw error;
      setLiveBids(data || []);
    } catch (error) {
      console.error('Error fetching live bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const productData = {
        name: productFormData.name,
        description: productFormData.description || null,
        price: parseFloat(productFormData.price),
        unit: productFormData.unit,
        stock_quantity: parseFloat(productFormData.stock_quantity),
        stock_unit: productFormData.stock_unit,
        location: productFormData.location,
        image_url: productFormData.image_url || null,
        category_id: productFormData.category_id || null,
        farm_id: productFormData.farm_id || null,
        is_featured: productFormData.is_featured,
        is_active: productFormData.is_active,
        display_order: parseInt(productFormData.display_order),
        created_by: user.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('ecommerce_products')
          .update({ ...productData, updated_at: new Date().toISOString() })
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ecommerce_products').insert([productData]);
        if (error) throw error;
      }

      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const bidData = {
        name: bidFormData.name,
        description: bidFormData.description || null,
        starting_price: parseFloat(bidFormData.starting_price),
        current_price: parseFloat(bidFormData.current_price),
        unit: bidFormData.unit,
        available_quantity: bidFormData.available_quantity,
        location: bidFormData.location,
        image_url: bidFormData.image_url || null,
        category_id: bidFormData.category_id || null,
        farm_id: bidFormData.farm_id || null,
        start_time: bidFormData.start_time.toISOString(),
        end_time: bidFormData.end_time.toISOString(),
        is_trending: bidFormData.is_trending,
        is_active: bidFormData.is_active,
        created_by: user.id,
      };

      if (editingBid) {
        const { error } = await supabase
          .from('live_bids')
          .update({ ...bidData, updated_at: new Date().toISOString() })
          .eq('id', editingBid.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('live_bids').insert([bidData]);
        if (error) throw error;
      }

      setShowBidModal(false);
      setEditingBid(null);
      resetBidForm();
      fetchLiveBids();
    } catch (error) {
      console.error('Error saving live bid:', error);
      alert('Error saving live bid');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const categoryData = {
        name: categoryFormData.name,
        icon_name: categoryFormData.icon_name || null,
        display_order: parseInt(categoryFormData.display_order),
        is_active: categoryFormData.is_active,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('product_categories')
          .update({ ...categoryData, updated_at: new Date().toISOString() })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_categories').insert([categoryData]);
        if (error) throw error;
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      description: '',
      price: '',
      unit: '',
      stock_quantity: '',
      stock_unit: '',
      location: '',
      image_url: '',
      category_id: '',
      farm_id: '',
      is_featured: false,
      is_active: true,
      display_order: '0',
    });
  };

  const resetBidForm = () => {
    setBidFormData({
      name: '',
      description: '',
      starting_price: '',
      current_price: '',
      unit: '',
      available_quantity: '',
      location: '',
      image_url: '',
      category_id: '',
      farm_id: '',
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      is_trending: false,
      is_active: true,
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      icon_name: '',
      display_order: '0',
      is_active: true,
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('ecommerce_products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  const handleDeleteBid = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live bid?')) return;

    try {
      const { error } = await supabase.from('live_bids').delete().eq('id', id);
      if (error) throw error;
      fetchLiveBids();
    } catch (error) {
      console.error('Error deleting live bid:', error);
      alert('Error deleting live bid');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Ecommerce Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Products
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bids'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gavel size={20} />
              Live Bids
            </div>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag size={20} />
              Categories
            </div>
          </button>
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingProduct(null);
                resetProductForm();
                setShowProductModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.is_featured && (
                            <span className="text-xs text-green-600 font-medium">Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      KES {product.price.toLocaleString()} <span className="text-gray-500">{product.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock_quantity} {product.stock_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <Eye size={16} />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-sm">
                          <EyeOff size={16} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setProductFormData({
                              name: product.name,
                              description: product.description || '',
                              price: product.price.toString(),
                              unit: product.unit,
                              stock_quantity: product.stock_quantity.toString(),
                              stock_unit: product.stock_unit,
                              location: product.location,
                              image_url: product.image_url || '',
                              category_id: product.category_id || '',
                              farm_id: product.farm_id || '',
                              is_featured: product.is_featured,
                              is_active: product.is_active,
                              display_order: product.display_order.toString(),
                            });
                            setShowProductModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Bids Tab */}
      {activeTab === 'bids' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingBid(null);
                resetBidForm();
                setShowBidModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Live Bid
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Starting Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ends</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bids</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {liveBids.map((bid) => {
                  const endDate = new Date(bid.end_time);
                  const isActive = bid.is_active && endDate > new Date();
                  return (
                    <tr key={bid.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {bid.image_url && (
                            <img src={bid.image_url} alt={bid.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bid.name}</div>
                            {bid.is_trending && (
                              <span className="text-xs text-orange-600 font-medium">Trending</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        KES {bid.current_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        KES {bid.starting_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {endDate.toLocaleDateString()} {endDate.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bid.total_bids}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="text-green-600 text-sm font-medium">Active</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Ended</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingBid(bid);
                              setBidFormData({
                                name: bid.name,
                                description: bid.description || '',
                                starting_price: bid.starting_price.toString(),
                                current_price: bid.current_price.toString(),
                                unit: bid.unit,
                                available_quantity: bid.available_quantity,
                                location: bid.location,
                                image_url: bid.image_url || '',
                                category_id: bid.category_id || '',
                                farm_id: bid.farm_id || '',
                                start_time: new Date(bid.start_time),
                                end_time: new Date(bid.end_time),
                                is_trending: bid.is_trending,
                                is_active: bid.is_active,
                              });
                              setShowBidModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteBid(bid.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingCategory(null);
                resetCategoryForm();
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Category
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.icon_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.display_order}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.is_active ? (
                        <span className="text-green-600 text-sm">Active</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryFormData({
                            name: category.name,
                            icon_name: category.icon_name || '',
                            display_order: category.display_order.toString(),
                            is_active: category.is_active,
                          });
                          setShowCategoryModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={productFormData.category_id}
                    onChange={(e) => setProductFormData({ ...productFormData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={productFormData.unit}
                    onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                    placeholder="/tray, /liter, /kg"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productFormData.stock_quantity}
                    onChange={(e) => setProductFormData({ ...productFormData, stock_quantity: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Unit *</label>
                  <input
                    type="text"
                    value={productFormData.stock_unit}
                    onChange={(e) => setProductFormData({ ...productFormData, stock_unit: e.target.value })}
                    placeholder="trays, liters, kg"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={productFormData.location}
                    onChange={(e) => setProductFormData({ ...productFormData, location: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                  <select
                    value={productFormData.farm_id}
                    onChange={(e) => setProductFormData({ ...productFormData, farm_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={productFormData.image_url}
                    onChange={(e) => setProductFormData({ ...productFormData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={productFormData.display_order}
                    onChange={(e) => setProductFormData({ ...productFormData, display_order: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productFormData.is_featured}
                    onChange={(e) => setProductFormData({ ...productFormData, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productFormData.is_active}
                    onChange={(e) => setProductFormData({ ...productFormData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
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

      {/* Live Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingBid ? 'Edit Live Bid' : 'Add Live Bid'}
            </h2>
            <form onSubmit={handleBidSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={bidFormData.name}
                    onChange={(e) => setBidFormData({ ...bidFormData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={bidFormData.category_id}
                    onChange={(e) => setBidFormData({ ...bidFormData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bidFormData.starting_price}
                    onChange={(e) => setBidFormData({ ...bidFormData, starting_price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bidFormData.current_price}
                    onChange={(e) => setBidFormData({ ...bidFormData, current_price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={bidFormData.unit}
                    onChange={(e) => setBidFormData({ ...bidFormData, unit: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity *</label>
                  <input
                    type="text"
                    value={bidFormData.available_quantity}
                    onChange={(e) => setBidFormData({ ...bidFormData, available_quantity: e.target.value })}
                    placeholder="50 trays available"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={bidFormData.location}
                    onChange={(e) => setBidFormData({ ...bidFormData, location: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                  <select
                    value={bidFormData.farm_id}
                    onChange={(e) => setBidFormData({ ...bidFormData, farm_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <DatePicker
                    selected={bidFormData.start_time}
                    onChange={(date: Date) => setBidFormData({ ...bidFormData, start_time: date })}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd HH:mm"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <DatePicker
                    selected={bidFormData.end_time}
                    onChange={(date: Date) => setBidFormData({ ...bidFormData, end_time: date })}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd HH:mm"
                    minDate={bidFormData.start_time}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={bidFormData.image_url}
                    onChange={(e) => setBidFormData({ ...bidFormData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={bidFormData.description}
                  onChange={(e) => setBidFormData({ ...bidFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bidFormData.is_trending}
                    onChange={(e) => setBidFormData({ ...bidFormData, is_trending: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Trending</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bidFormData.is_active}
                    onChange={(e) => setBidFormData({ ...bidFormData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingBid ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(false);
                    setEditingBid(null);
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

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon Name (Lucide)</label>
                <input
                  type="text"
                  value={categoryFormData.icon_name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, icon_name: e.target.value })}
                  placeholder="Egg, Milk, Beef, etc."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryFormData.display_order}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, display_order: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={categoryFormData.is_active}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
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

