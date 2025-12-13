import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EcommerceProduct, ProductCategory } from '../types';
import { ShoppingCart, MapPin, Loader2, Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function Products() {
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EcommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price_low' | 'price_high' | 'newest'>('newest');

  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategories, priceRange, selectedLocations, stockFilter, featuredOnly, sortBy]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('ecommerce_products')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => 
        product.category_id && selectedCategories.includes(product.category_id)
      );
    }

    // Filter by price range
    if (priceRange.min) {
      const min = parseFloat(priceRange.min);
      if (!isNaN(min)) {
        filtered = filtered.filter((product) => product.price >= min);
      }
    }
    if (priceRange.max) {
      const max = parseFloat(priceRange.max);
      if (!isNaN(max)) {
        filtered = filtered.filter((product) => product.price <= max);
      }
    }

    // Filter by locations
    if (selectedLocations.length > 0) {
      filtered = filtered.filter((product) => 
        selectedLocations.includes(product.location)
      );
    }

    // Filter by stock
    if (stockFilter === 'in_stock') {
      filtered = filtered.filter((product) => product.stock_quantity > 0);
    } else if (stockFilter === 'low_stock') {
      filtered = filtered.filter((product) => product.stock_quantity > 0 && product.stock_quantity < 50);
    } else if (stockFilter === 'out_of_stock') {
      filtered = filtered.filter((product) => product.stock_quantity === 0);
    }

    // Filter by featured
    if (featuredOnly) {
      filtered = filtered.filter((product) => product.is_featured);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, undefined, 1);
      alert('Item added to cart!');
    } catch (error: any) {
      alert(error.message || 'Failed to add to cart');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((loc) => loc !== location)
        : [...prev, location]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: '', max: '' });
    setSelectedLocations([]);
    setStockFilter('all');
    setFeaturedOnly(false);
    setSearchTerm('');
  };

  // Get unique locations from products
  const uniqueLocations = Array.from(new Set(products.map((p) => p.location))).sort();
  
  // Get price range from products
  const prices = products.map((p) => p.price);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 0);

  const activeFiltersCount = 
    selectedCategories.length +
    (priceRange.min || priceRange.max ? 1 : 0) +
    selectedLocations.length +
    (stockFilter !== 'all' ? 1 : 0) +
    (featuredOnly ? 1 : 0);

  return (
    <section id="products" className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Products
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Browse our complete selection of fresh, high-quality agricultural products. All products are sourced directly from our farms and verified suppliers.
          </p>
        </div>

        {/* Search and Mobile Filter Toggle */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={20} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-[#5a8a3d] text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`lg:w-64 flex-shrink-0 ${
              showFilters ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Filter size={20} />
                  Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#5a8a3d] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="w-4 h-4 text-[#5a8a3d] border-gray-300 rounded focus:ring-[#5a8a3d]"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Price Range (KES)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                    <input
                      type="number"
                      placeholder={minPrice.toString()}
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                    <input
                      type="number"
                      placeholder={maxPrice.toString()}
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                    />
                  </div>
                </div>
        </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Location</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uniqueLocations.map((location) => (
                    <label
                      key={location}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location)}
                        onChange={() => toggleLocation(location)}
                        className="w-4 h-4 text-[#5a8a3d] border-gray-300 rounded focus:ring-[#5a8a3d]"
                      />
                      <span className="text-sm text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Stock Status</h4>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Products' },
                    { value: 'in_stock', label: 'In Stock' },
                    { value: 'low_stock', label: 'Low Stock' },
                    { value: 'out_of_stock', label: 'Out of Stock' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="radio"
                        name="stock"
                        value={option.value}
                        checked={stockFilter === option.value}
                        onChange={(e) => setStockFilter(e.target.value as any)}
                        className="w-4 h-4 text-[#5a8a3d] border-gray-300 focus:ring-[#5a8a3d]"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
            ))}
          </div>
        </div>

              {/* Featured Filter */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => setFeaturedOnly(e.target.checked)}
                    className="w-4 h-4 text-[#5a8a3d] border-gray-300 rounded focus:ring-[#5a8a3d]"
                  />
                  <span className="text-sm font-semibold text-gray-900">Featured Only</span>
                </label>
              </div>

              {/* Sort By */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5a8a3d] focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#5a8a3d] animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-600 text-lg mb-4">No products found.</p>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search term.</p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[#5a8a3d] hover:underline font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-[#5a8a3d] group"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={product.image_url || 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400';
                          }}
                        />
                        {product.is_featured && (
                          <div className="absolute top-3 left-3 bg-[#5a8a3d] text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Featured
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold text-[#5a8a3d]">
                          KES {product.price.toLocaleString()}
                        </div>
                        {product.stock_quantity === 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                          <MapPin size={14} />
                          <span className="line-clamp-1">{product.location}</span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm">
                            <span className="text-gray-600">Stock: </span>
                            <span className={`font-semibold ${product.stock_quantity === 0 ? 'text-red-600' : product.stock_quantity < 50 ? 'text-orange-600' : 'text-gray-900'}`}>
                              {product.stock_quantity.toLocaleString()} {product.stock_unit}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            /{product.unit}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock_quantity === 0}
                          className="w-full py-2.5 bg-[#5a8a3d] text-white rounded-lg hover:bg-[#4a7a2d] transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart size={18} />
                          {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
