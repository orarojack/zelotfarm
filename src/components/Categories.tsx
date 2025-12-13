import { useEffect, useState } from 'react';
import { 
  Egg, Milk, Beef, Drumstick, Fish, Droplets, PackagePlus, Wheat, Carrot, Leaf, Heart, Scaling, 
  Loader2, Circle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductCategory } from '../types';

// Icon mapping for dynamic icon loading
const iconMap: Record<string, any> = {
  Egg, Milk, Beef, Drumstick, Fish, Droplets, PackagePlus, Wheat, Carrot, Leaf, Heart, Scaling,
  Circle // fallback
};

export default function Categories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Circle; // Default icon
    // Get icon from iconMap
    return iconMap[iconName] || Circle;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null; // Don't show categories section if no categories
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Categories
          </h2>
          <p className="text-gray-600">
            Discover our wide range of livestock products
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => {
            const IconComponent = getIcon(category.icon_name);
            return (
              <button
                key={category.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:-translate-y-1 group"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <IconComponent size={32} className="text-[#5a8a3d] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {category.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
