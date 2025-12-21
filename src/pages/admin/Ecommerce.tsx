import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EcommerceProduct, LiveBid, ProductCategory, Farm, Order, OrderItem, Customer } from '../../types';
import { Plus, Edit, Trash2, ShoppingCart, Gavel, Tag, Eye, EyeOff, Package, DollarSign, CheckCircle, Clock, XCircle, Truck, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import TableActions from '../../components/admin/TableActions';

export default function Ecommerce() {
  const [activeTab, setActiveTab] = useState<'products' | 'bids' | 'categories' | 'orders' | 'revenue'>('products');
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [liveBids, setLiveBids] = useState<LiveBid[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Filter states for Products tab
  const [productFilters, setProductFilters] = useState({
    search: '',
    farmName: '',
    farmType: '',
    farmLocation: '',
    category: '',
    status: 'all', // all, active, inactive
  });

  // Filter states for Live Bids tab
  const [bidFilters, setBidFilters] = useState({
    search: '',
    farmName: '',
    farmType: '',
    farmLocation: '',
    category: '',
    status: 'all', // all, active, inactive, ended
  });

  // Filter states for Categories tab
  const [categoryFilters, setCategoryFilters] = useState({
    search: '',
    status: 'all', // all, active, inactive
  });

  // Filter states for Orders tab
  const [orderFilters, setOrderFilters] = useState({
    search: '',
    status: 'all',
    farmName: '',
    farmType: '',
    farmLocation: '',
  });

  // Filter states for Revenue tab
  const [revenueFilters, setRevenueFilters] = useState({
    dateRange: 'month', // week, month, year, custom
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });
  const [ecommerceRevenue, setEcommerceRevenue] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
    orderCount: 0,
  });
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
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'revenue') {
      fetchEcommerceRevenue();
    } else {
      fetchCategories();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetails(selectedOrder.id);
    }
  }, [selectedOrder]);

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
      let query = supabase
        .from('ecommerce_products')
        .select('*, farms(name, type, location)')
        .order('display_order')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

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
      let query = supabase
        .from('live_bids')
        .select('*, farms(name, type, location)')
        .order('end_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setLiveBids(data || []);
    } catch (error) {
      console.error('Error fetching live bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      // Fetch customer details
      const customerIds = [...new Set((data || []).map((o) => o.customer_id))];
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);

      if (customersData) {
        const customersMap: Record<string, Customer> = {};
        customersData.forEach((c) => {
          customersMap[c.id] = c;
        });
        setCustomers(customersMap);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(items || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const fetchEcommerceRevenue = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      // Determine date range based on filter
      let startDate = new Date();
      if (revenueFilters.dateRange === 'week') {
        startDate = weekAgo;
      } else if (revenueFilters.dateRange === 'month') {
        startDate = monthAgo;
      } else if (revenueFilters.dateRange === 'year') {
        startDate = yearAgo;
      } else if (revenueFilters.dateRange === 'custom') {
        startDate = revenueFilters.startDate;
      }

      // Fetch orders based on date range
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', (revenueFilters.dateRange === 'custom' ? revenueFilters.endDate : now).toISOString());

      if (error) throw error;

      const ordersData = allOrders || [];
      
      const total = ordersData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const todayRevenue = ordersData
        .filter((o) => new Date(o.created_at) >= today)
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const weekRevenue = ordersData
        .filter((o) => new Date(o.created_at) >= weekAgo)
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const monthRevenue = ordersData
        .filter((o) => new Date(o.created_at) >= monthAgo)
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setEcommerceRevenue({
        total,
        thisMonth: monthRevenue,
        thisWeek: weekRevenue,
        today: todayRevenue,
        orderCount: ordersData.length,
      });
    } catch (error) {
      console.error('Error fetching ecommerce revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updateData });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
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

  // Filter functions
  const filteredProducts = products.filter((product) => {
    const farm = farms.find(f => f.id === product.farm_id);
    const matchesSearch = productFilters.search === '' || 
      product.name.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.description?.toLowerCase().includes(productFilters.search.toLowerCase());
    const matchesFarmName = productFilters.farmName === '' || farm?.name === productFilters.farmName;
    const matchesFarmType = productFilters.farmType === '' || farm?.type === productFilters.farmType;
    const matchesFarmLocation = productFilters.farmLocation === '' || farm?.location === productFilters.farmLocation;
    const matchesCategory = productFilters.category === '' || product.category_id === productFilters.category;
    const matchesStatus = productFilters.status === 'all' || 
      (productFilters.status === 'active' && product.is_active) ||
      (productFilters.status === 'inactive' && !product.is_active);
    
    return matchesSearch && matchesFarmName && matchesFarmType && matchesFarmLocation && matchesCategory && matchesStatus;
  });

  const filteredBids = liveBids.filter((bid) => {
    const farm = farms.find(f => f.id === bid.farm_id);
    const endDate = new Date(bid.end_time);
    const isEnded = endDate < new Date();
    
    const matchesSearch = bidFilters.search === '' || 
      bid.name.toLowerCase().includes(bidFilters.search.toLowerCase()) ||
      bid.description?.toLowerCase().includes(bidFilters.search.toLowerCase());
    const matchesFarmName = bidFilters.farmName === '' || farm?.name === bidFilters.farmName;
    const matchesFarmType = bidFilters.farmType === '' || farm?.type === bidFilters.farmType;
    const matchesFarmLocation = bidFilters.farmLocation === '' || farm?.location === bidFilters.farmLocation;
    const matchesCategory = bidFilters.category === '' || bid.category_id === bidFilters.category;
    const matchesStatus = bidFilters.status === 'all' || 
      (bidFilters.status === 'active' && bid.is_active && !isEnded) ||
      (bidFilters.status === 'inactive' && !bid.is_active) ||
      (bidFilters.status === 'ended' && isEnded);
    
    return matchesSearch && matchesFarmName && matchesFarmType && matchesFarmLocation && matchesCategory && matchesStatus;
  });

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = categoryFilters.search === '' || 
      category.name.toLowerCase().includes(categoryFilters.search.toLowerCase());
    const matchesStatus = categoryFilters.status === 'all' || 
      (categoryFilters.status === 'active' && category.is_active) ||
      (categoryFilters.status === 'inactive' && !category.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = orderFilters.search === '' ||
      order.order_number.toLowerCase().includes(orderFilters.search.toLowerCase()) ||
      customers[order.customer_id]?.full_name.toLowerCase().includes(orderFilters.search.toLowerCase()) ||
      customers[order.customer_id]?.email.toLowerCase().includes(orderFilters.search.toLowerCase());
    const matchesStatus = orderFilters.status === 'all' || order.status === orderFilters.status;
    
    // Note: Orders don't have direct farm relationship, but we can filter by order items' products' farms
    // For now, we'll skip farm filters for orders unless we add that relationship
    return matchesSearch && matchesStatus;
  });

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
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={20} />
              Orders
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'revenue'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={20} />
              Revenue
            </div>
          </button>
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productFilters.search}
                  onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={productFilters.farmName}
                onChange={(e) => setProductFilters({ ...productFilters, farmName: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Farms</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.name}>{farm.name}</option>
                ))}
              </select>
              <select
                value={productFilters.farmType}
                onChange={(e) => setProductFilters({ ...productFilters, farmType: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Dairy">Dairy</option>
                <option value="Broiler">Broiler</option>
                <option value="Layer">Layer</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={productFilters.farmLocation}
                onChange={(e) => setProductFilters({ ...productFilters, farmLocation: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                {[...new Set(farms.map(f => f.location))].map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <select
                value={productFilters.category}
                onChange={(e) => setProductFilters({ ...productFilters, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={productFilters.status}
                onChange={(e) => setProductFilters({ ...productFilters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

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
                {filteredProducts.map((product) => {
                  const farm = farms.find(f => f.id === product.farm_id);
                  return (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {farm?.location || product.location}
                    </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Bids Tab */}
      {activeTab === 'bids' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search bids..."
                  value={bidFilters.search}
                  onChange={(e) => setBidFilters({ ...bidFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={bidFilters.farmName}
                onChange={(e) => setBidFilters({ ...bidFilters, farmName: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Farms</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.name}>{farm.name}</option>
                ))}
              </select>
              <select
                value={bidFilters.farmType}
                onChange={(e) => setBidFilters({ ...bidFilters, farmType: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Dairy">Dairy</option>
                <option value="Broiler">Broiler</option>
                <option value="Layer">Layer</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={bidFilters.farmLocation}
                onChange={(e) => setBidFilters({ ...bidFilters, farmLocation: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                {[...new Set(farms.map(f => f.location))].map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <select
                value={bidFilters.category}
                onChange={(e) => setBidFilters({ ...bidFilters, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={bidFilters.status}
                onChange={(e) => setBidFilters({ ...bidFilters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

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
                {filteredBids.map((bid) => {
                  const endDate = new Date(bid.end_time);
                  const isActive = bid.is_active && endDate > new Date();
                  const farm = farms.find(f => f.id === bid.farm_id);
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
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categoryFilters.search}
                  onChange={(e) => setCategoryFilters({ ...categoryFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={categoryFilters.status}
                onChange={(e) => setCategoryFilters({ ...categoryFilters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

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
                {filteredCategories.map((category) => (
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
          <div className="bg-white rounded-lg p-5 w-full max-w-6xl">
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
          <div className="bg-white rounded-lg p-5 w-full max-w-6xl">
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

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by order number, customer name, or email..."
                  value={orderFilters.search}
                  onChange={(e) => setOrderFilters({ ...orderFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={orderFilters.status}
                onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const customer = customers[order.customer_id];
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{customer?.email || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          KES {order.total_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No orders found</p>
              </div>
            )}
          </div>

          {/* Order Detail Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-6xl w-full">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Order {selectedOrder.order_number}
                    </h2>
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setOrderItems([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">Name:</span> {customers[selectedOrder.customer_id]?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {customers[selectedOrder.customer_id]?.email || 'Unknown'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> {selectedOrder.shipping_phone}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">
                        {selectedOrder.shipping_address}
                        <br />
                        {selectedOrder.shipping_city}
                        {selectedOrder.shipping_county && `, ${selectedOrder.shipping_county}`}
                        {selectedOrder.shipping_postal_code && ` ${selectedOrder.shipping_postal_code}`}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.item_name}</p>
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
                    <div className="mt-4 pt-4 border-t flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600">
                        KES {selectedOrder.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Update Status</h3>
                    <div className="flex gap-2 flex-wrap">
                      {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(selectedOrder.id, status)}
                            disabled={selectedOrder.status === status}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              selectedOrder.status === status
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={revenueFilters.dateRange}
                onChange={(e) => {
                  const range = e.target.value;
                  const now = new Date();
                  let startDate = new Date();
                  
                  if (range === 'week') {
                    startDate.setDate(now.getDate() - 7);
                  } else if (range === 'month') {
                    startDate.setMonth(now.getMonth() - 1);
                  } else if (range === 'year') {
                    startDate.setFullYear(now.getFullYear() - 1);
                  }
                  
                  setRevenueFilters({
                    ...revenueFilters,
                    dateRange: range,
                    startDate: range === 'custom' ? revenueFilters.startDate : startDate,
                    endDate: now,
                  });
                  
                  if (range !== 'custom') {
                    fetchEcommerceRevenue();
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
              {revenueFilters.dateRange === 'custom' && (
                <>
                  <DatePicker
                    selected={revenueFilters.startDate}
                    onChange={(date: Date) => {
                      setRevenueFilters({ ...revenueFilters, startDate: date });
                    }}
                    selectsStart
                    startDate={revenueFilters.startDate}
                    endDate={revenueFilters.endDate}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                    placeholderText="Start Date"
                  />
                  <DatePicker
                    selected={revenueFilters.endDate}
                    onChange={(date: Date) => {
                      setRevenueFilters({ ...revenueFilters, endDate: date });
                    }}
                    selectsEnd
                    startDate={revenueFilters.startDate}
                    endDate={revenueFilters.endDate}
                    minDate={revenueFilters.startDate}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                    placeholderText="End Date"
                  />
                  <button
                    onClick={() => fetchEcommerceRevenue()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Apply
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Revenue Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    KES {ecommerceRevenue.total.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    KES {ecommerceRevenue.thisMonth.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    KES {ecommerceRevenue.thisWeek.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <DollarSign className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    KES {ecommerceRevenue.today.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <DollarSign className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {ecommerceRevenue.orderCount}
                  </p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Package className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ecommerce Revenue Overview</h2>
            <p className="text-gray-600">
              This section shows all revenue generated from ecommerce orders. Revenue is calculated from orders with status: 
              Confirmed, Processing, Shipped, or Delivered.
            </p>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> Revenue is automatically calculated from completed and active orders. 
                Cancelled orders are excluded from revenue calculations.
              </p>
            </div>
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

