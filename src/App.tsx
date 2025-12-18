import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Farms from './pages/admin/Farms';
import Cattle from './pages/admin/Cattle';
import Milking from './pages/admin/Milking';
import Poultry from './pages/admin/Poultry';
import Inventory from './pages/admin/Inventory';
import Finance from './pages/admin/Finance';
import Staff from './pages/admin/Staff';
import Users from './pages/admin/Users';
import RolePermissions from './pages/admin/RolePermissions';
import Reports from './pages/admin/Reports';
import Approvals from './pages/admin/Approvals';
import Ecommerce from './pages/admin/Ecommerce';
import Profile from './pages/admin/Profile';
import CustomerLogin from './pages/customer/Login';
import CustomerSignup from './pages/customer/Signup';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import CustomerOrders from './pages/customer/Orders';

function App() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={
              <div className="min-h-screen bg-white">
                <Header />
                <Home />
                <Footer />
              </div>
            } />
            <Route path="/about" element={
              <div className="min-h-screen bg-white">
                <Header />
                <About />
                <Footer />
              </div>
            } />
            <Route path="/products" element={
              <div className="min-h-screen bg-white">
                <Header />
                <Products />
                <Footer />
              </div>
            } />

            {/* Customer routes */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/signup" element={<CustomerSignup />} />
            <Route path="/customer/cart" element={
              <div className="min-h-screen bg-white">
                <Header />
                <Cart />
                <Footer />
              </div>
            } />
            <Route path="/customer/checkout" element={
              <div className="min-h-screen bg-white">
                <Header />
                <Checkout />
                <Footer />
              </div>
            } />
            <Route path="/customer/orders" element={
              <div className="min-h-screen bg-white">
                <Header />
                <CustomerOrders />
                <Footer />
              </div>
            } />
            <Route path="/customer/orders/:id" element={
              <div className="min-h-screen bg-white">
                <Header />
                <CustomerOrders />
                <Footer />
              </div>
            } />

            {/* Admin routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="farms" element={<Farms />} />
              <Route path="cattle" element={<Cattle />} />
              <Route path="milking" element={<Milking />} />
              <Route path="poultry" element={<Poultry />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="finance" element={<Finance />} />
              <Route path="staff" element={<Staff />} />
              <Route path="users" element={<Users />} />
              <Route path="role-permissions" element={<RolePermissions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="ecommerce" element={<Ecommerce />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}

export default App;
