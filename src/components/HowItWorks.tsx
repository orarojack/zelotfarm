import { Search, CheckCircle, ShoppingCart, Truck } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Search Products',
      description: 'Browse through thousands of agricultural products from verified farmers and suppliers'
    },
    {
      icon: CheckCircle,
      title: 'Select & Verify',
      description: 'Choose your desired products, check seller ratings, and verify product details'
    },
    {
      icon: ShoppingCart,
      title: 'Place Order',
      description: 'Add to cart and place your order securely with multiple payment options'
    },
    {
      icon: Truck,
      title: 'Receive Delivery',
      description: 'Get your fresh products delivered directly to your location'
    }
  ];

  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple steps to connect farmers and buyers for fair and safe trade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center">
                <div className="w-16 h-16 bg-[#42682d] rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon size={32} className="text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#dc7f35] rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
