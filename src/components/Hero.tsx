import { Search } from 'lucide-react';

export default function Hero() {
  const popularItems = ['Eggs', 'Milk', 'Chicken', 'Beef', 'Honey'];

  return (
    <section id="home" className="bg-[#dc7f35] text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Find Quality Livestock Products
          </h1>
          <p className="text-white/90">
            Search from thousands of fresh livestock products from verified farmers
          </p>
        </div>

        <div className="bg-white rounded-lg p-2 shadow-lg max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="What livestock product are you looking for?"
              className="flex-1 px-4 py-3 rounded text-gray-900 focus:outline-none"
            />
            <select className="px-4 py-3 rounded text-gray-700 focus:outline-none bg-white border-l">
              <option>All Categories</option>
              <option>Eggs</option>
              <option>Dairy Products</option>
              <option>Beef & Red Meat</option>
              <option>Poultry & Chicken</option>
              <option>Fish & Seafood</option>
              <option>Honey & Bee Products</option>
            </select>
            <select className="px-4 py-3 rounded text-gray-700 focus:outline-none bg-white border-l">
              <option>All Locations</option>
              <option>Nairobi</option>
              <option>Mombasa</option>
              <option>Kisumu</option>
              <option>Nakuru</option>
              <option>Eldoret</option>
            </select>
            <button className="px-8 py-3 bg-[#5a8a3d] text-white rounded hover:bg-[#4a7a2d] transition-colors flex items-center justify-center gap-2">
              <Search size={20} />
              Search
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center gap-4 mt-6 text-sm">
          <span className="text-white/80">Popular:</span>
          {popularItems.map((item, index) => (
            <button
              key={index}
              className="text-white hover:underline"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
