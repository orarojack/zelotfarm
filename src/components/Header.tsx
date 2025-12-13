import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search, Heart, Sprout, LogOut } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { customer, signOut } = useCustomerAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="bg-[#5a8a3d] text-white py-2">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-xs md:text-sm">
          <div className="flex items-center gap-4">
            <span>📞 +254 708 500 722</span>
            <span className="hidden md:inline">📧 isaaczealot2024@gmail.com</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">🚚 Free Delivery on Orders Over KES 5,000</span>
            <span>📍 Mutuya, Ikinu Ward, Githunguri, Kiambu</span>
          </div>
        </div>
      </div>

      <nav className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-blue-800 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-green-100 to-green-200 rounded-full"></div>
                <Sprout className="text-blue-800 absolute -top-2 left-1" size={20} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-500 leading-tight">
                ZEALOT
              </span>
              <span className="text-sm font-bold text-blue-800 -mt-1 leading-tight">
                AGRIWORKS LTD
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                location.pathname === '/' 
                  ? 'text-[#5a8a3d] bg-[#5a8a3d]/10' 
                  : 'text-gray-700 hover:text-[#5a8a3d] hover:bg-[#5a8a3d]/5'
              }`}
            >
              Home
            </Link>
            <Link
              to="/products"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                location.pathname === '/products' 
                  ? 'text-[#5a8a3d] bg-[#5a8a3d]/10' 
                  : 'text-gray-700 hover:text-[#5a8a3d] hover:bg-[#5a8a3d]/5'
              }`}
            >
              Products
            </Link>
            <a
              href="#live-bids"
              className="px-4 py-2 text-gray-700 hover:text-[#dc7f35] hover:bg-[#dc7f35]/5 rounded-lg transition-all font-medium relative"
            >
              Live Bids
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </a>
            <Link
              to="/about"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                location.pathname === '/about' 
                  ? 'text-[#5a8a3d] bg-[#5a8a3d]/10' 
                  : 'text-gray-700 hover:text-[#5a8a3d] hover:bg-[#5a8a3d]/5'
              }`}
            >
              About
            </Link>
            <a
              href="#contact"
              className="px-4 py-2 text-gray-700 hover:text-[#5a8a3d] hover:bg-[#5a8a3d]/5 rounded-lg transition-all font-medium"
            >
              Contact
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden md:flex p-2 text-gray-700 hover:text-[#5a8a3d] hover:bg-gray-100 rounded-lg transition-colors">
              <Search size={20} />
            </button>

            <button className="hidden md:flex p-2 text-gray-700 hover:text-[#dc7f35] hover:bg-gray-100 rounded-lg transition-colors relative">
              <Heart size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#dc7f35] text-white text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            <Link
              to="/customer/cart"
              className="hidden md:flex p-2 text-gray-700 hover:text-[#5a8a3d] hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#5a8a3d] text-white text-xs rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <div className="hidden lg:flex items-center gap-2 ml-2 border-l pl-4">
              {customer ? (
                <>
                  <Link
                    to="/customer/orders"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#5a8a3d] hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    <User size={18} />
                    {customer.full_name.split(' ')[0]}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/customer/login"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#5a8a3d] hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    <User size={18} />
                    Login
                  </Link>
                  <Link
                    to="/customer/signup"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#5a8a3d] to-[#4a7a2d] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                location.pathname === '/' 
                  ? 'text-[#5a8a3d] bg-[#5a8a3d]/10' 
                  : 'text-gray-700 hover:bg-[#5a8a3d]/5 hover:text-[#5a8a3d]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                location.pathname === '/products' 
                  ? 'text-[#5a8a3d] bg-[#5a8a3d]/10' 
                  : 'text-gray-700 hover:bg-[#5a8a3d]/5 hover:text-[#5a8a3d]'
              }`}
            >
              Products
            </Link>
            <a
              href="#live-bids"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-[#dc7f35]/5 hover:text-[#dc7f35] rounded-lg transition-colors font-medium flex items-center justify-between"
            >
              Live Bids
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </a>
            <Link
              to="/about"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                location.pathname === '/about' 
                  ? 'text-[#5a8a3d] bg-[#5a8a3d]/10' 
                  : 'text-gray-700 hover:bg-[#5a8a3d]/5 hover:text-[#5a8a3d]'
              }`}
            >
              About
            </Link>
            <a
              href="#contact"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-[#5a8a3d]/5 hover:text-[#5a8a3d] rounded-lg transition-colors font-medium"
            >
              Contact
            </a>

            <div className="flex gap-2 pt-4 border-t">
              {customer ? (
                <>
                  <Link
                    to="/customer/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 px-4 py-3 text-gray-700 border-2 border-gray-300 hover:border-[#5a8a3d] hover:text-[#5a8a3d] rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    {customer.full_name.split(' ')[0]}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/customer/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 px-4 py-3 text-gray-700 border-2 border-gray-300 hover:border-[#5a8a3d] hover:text-[#5a8a3d] rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    Login
                  </Link>
                  <Link
                    to="/customer/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#5a8a3d] to-[#4a7a2d] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Search size={18} />
                Search
              </button>
              <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors relative">
                <Heart size={18} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#dc7f35] text-white text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
              <Link
                to="/customer/cart"
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors relative"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#5a8a3d] text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
