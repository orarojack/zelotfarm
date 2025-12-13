import { Target, Eye, Heart, Shield, CheckCircle, TrendingUp, DollarSign, Users } from 'lucide-react';

export default function About() {
  const benefits = [
    {
      icon: Shield,
      title: 'High Quality',
      description: 'Our products are fresh, nutritious, and fully traceable from farm to table, ensuring customers enjoy only the best every time.'
    },
    {
      icon: CheckCircle,
      title: 'Hygienic Production',
      description: 'We maintain strict hygiene and safety protocols throughout our processes to guarantee clean, safe, and premium-quality food products.'
    },
    {
      icon: TrendingUp,
      title: 'Consistency',
      description: 'Zealot AgriWorks ensures a reliable, year-round supply through efficient production planning and sustainable farming practices.'
    },
    {
      icon: DollarSign,
      title: 'Affordability',
      description: 'We offer competitive pricing designed to make quality dairy and poultry products accessible across all market segments.'
    },
    {
      icon: Heart,
      title: 'Customer Satisfaction',
      description: 'Our operations are built around our customers\' needs, providing personalized services and dependable delivery.'
    },
    {
      icon: Users,
      title: 'Local Impact',
      description: 'By sourcing and partnering with local farmers, we support rural livelihoods, stimulate local economies, and create employment opportunities within our communities.'
    }
  ];

  const clientele = [
    'Households seeking daily fresh milk and eggs',
    'Retailers, hotels, and restaurants demanding consistent supply',
    'Wholesalers and distributors serving urban markets such as Nairobi',
    'Institutions (schools, hospitals, etc.) requiring bulk, reliable deliveries'
  ];

  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            About Zealot AgriWorks Limited
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Leading in innovative and sustainable agribusiness
          </p>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#5a8a3d] mb-6">Background</h3>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="mb-4">
              Zealot AgriWorks Limited began in 2023 as a small-scale family farm specializing in dairy and poultry farming. Over the years, the enterprise has transformed into a full-fledged agribusiness venture through commitment to quality, innovation, and sustainability.
            </p>
            <p className="mb-4">
              From an initial 10 kg of milk per day, the company now produces over 250 kg daily, supported by a healthy herd of 17 dairy cows. Its broiler production has expanded from 1,000 to 5,000 birds per flock, while its layer unit consistently produces around 30 trays of eggs per day.
            </p>
            <p>
              This steady growth reflects Zealot AgriWorks Limited's vision to become a leader in sustainable agribusiness, improving livelihoods and delivering value to consumers.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-[#5a8a3d] to-[#4a7a2d] p-8 rounded-xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <Eye size={32} className="text-white" />
              <h3 className="text-2xl font-bold">Vision</h3>
            </div>
            <p className="text-white/95 text-lg leading-relaxed">
              "To lead in innovative and sustainable agribusiness that adds value and drives profitability."
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#dc7f35] to-[#c66f25] p-8 rounded-xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <Target size={32} className="text-white" />
              <h3 className="text-2xl font-bold">Mission</h3>
            </div>
            <p className="text-white/95 text-lg leading-relaxed">
              "To drive innovation and value in dairy and poultry agribusiness."
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Heart size={28} className="text-[#5a8a3d]" />
            <h3 className="text-2xl font-bold text-gray-900">Our Commitment</h3>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">
            We don't just sell food — we deliver trust, nutrition, and reliability. By combining modern agricultural practices with ethical livestock management, Zealot AgriWorks continues to be a dependable partner in providing nutritious products that nourish families and communities.
          </p>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-gradient-to-br from-[#5a8a3d] to-[#4a7a2d] p-8 md:p-12 rounded-2xl text-white mb-12 shadow-xl">
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Choose Us</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <benefit.icon size={24} className="text-white" />
                  </div>
                  <h4 className="font-bold text-lg">{benefit.title}</h4>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Clientele Section */}
        <div className="bg-white border-2 border-gray-200 p-8 md:p-10 rounded-2xl shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Our Clientele</h3>
          <p className="text-gray-700 mb-6 text-center leading-relaxed max-w-3xl mx-auto">
            Zealot AgriWorks Limited positions itself as a trusted supplier known for dependability, hygiene, and freshness. Our clientele includes:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {clientele.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <CheckCircle size={20} className="text-[#5a8a3d] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

