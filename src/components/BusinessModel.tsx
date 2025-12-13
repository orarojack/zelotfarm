import { ArrowRight, TrendingUp, CheckCircle2, Sparkles, Target, Zap, Users, BarChart3 } from 'lucide-react';

export default function BusinessModel() {
  const stages = [
    {
      title: 'Livestock Rearing',
      description: 'Careful rearing of dairy cows and poultry under optimal conditions. We prioritize animal health, nutrition, and welfare, using balanced feeds and routine veterinary care to promote productivity and disease resistance.',
      color: 'from-[#5a8a3d] to-[#4a7a2d]',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-300',
      icon: Target,
      features: ['Animal health monitoring', 'Balanced nutrition', 'Veterinary care'],
      stats: '17 Dairy Cows'
    },
    {
      title: 'Product Collection',
      description: 'Fresh milk and eggs are collected daily under strict hygienic conditions. Milk undergoes immediate cooling and storage in sanitized containers, while eggs are carefully sorted and handled.',
      color: 'from-[#dc7f35] to-[#c66f25]',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-300',
      icon: Zap,
      features: ['Daily collection', 'Hygienic handling', 'Immediate cooling'],
      stats: '250+ kg/day'
    },
    {
      title: 'Processing & Packaging',
      description: 'Focus on preserving natural quality while meeting food safety standards. Milk is pasteurized and packaged under controlled conditions, while poultry and eggs are processed with precision.',
      color: 'from-[#5a8a3d] to-[#4a7a2d]',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-300',
      icon: Sparkles,
      features: ['Food safety standards', 'Quality preservation', 'Controlled processing'],
      stats: '30 Trays/day'
    },
    {
      title: 'Distribution',
      description: 'Robust distribution network supported by reliable transportation and cold-chain systems. Partnerships with retailers, wholesalers, and institutional buyers ensure products reach consumers quickly and in perfect condition.',
      color: 'from-[#dc7f35] to-[#c66f25]',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-300',
      icon: BarChart3,
      features: ['Cold-chain systems', 'Reliable transportation', 'Wide network'],
      stats: 'Nationwide'
    },
    {
      title: 'Customer Feedback & Improvement',
      description: 'Strong feedback loop with customers to continuously refine processes, improve service delivery, and innovate offerings. We view our clients as partners in growth.',
      color: 'from-[#5a8a3d] to-[#4a7a2d]',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-300',
      icon: Users,
      features: ['Continuous improvement', 'Customer partnership', 'Service innovation'],
      stats: '100% Satisfaction'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5a8a3d] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#dc7f35] rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5a8a3d] to-[#4a7a2d] text-white px-6 py-3 rounded-full mb-6 shadow-lg">
            <TrendingUp size={22} />
            <span className="text-sm font-semibold">Integrated Value Chain</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Business Model
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
            Zealot AgriWorks Limited operates an integrated agribusiness model designed to maximize efficiency, maintain quality control, and ensure value creation at every stage — from livestock rearing to the final delivery of fresh products.
          </p>
          <div className="inline-flex items-center gap-3 bg-white px-8 py-5 rounded-2xl shadow-xl border-2 border-[#5a8a3d]/20 hover:shadow-2xl transition-all">
            <div className="bg-[#5a8a3d]/10 p-3 rounded-xl">
              <CheckCircle2 size={28} className="text-[#5a8a3d]" />
            </div>
            <span className="text-gray-800 font-bold text-lg md:text-xl">Full traceability, cost optimization, and consistent customer satisfaction</span>
          </div>
        </div>

        <div className="relative">
          {/* Horizontal cards layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <div key={index} className="relative">
                  <div className={`${stage.bgColor} border-2 ${stage.borderColor} rounded-3xl p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-[1.02] relative overflow-hidden group h-full flex flex-col`}>
                    {/* Decorative corner element */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stage.color} opacity-10 rounded-bl-full transform rotate-90`}></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Header with icon and number */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`bg-gradient-to-br ${stage.color} p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon size={24} className="text-white" />
                          </div>
                          <div className={`bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border-2 ${stage.borderColor} shadow-lg`}>
                            <p className="text-xs font-semibold text-gray-700">{stage.stats}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl font-bold text-gray-400">0{index + 1}</span>
                          <div className="h-6 w-1 bg-gradient-to-b from-[#5a8a3d] to-[#dc7f35] rounded-full"></div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                          {stage.title}
                        </h3>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-6 flex-grow">
                        {stage.description}
                      </p>

                      {/* Features list */}
                      <div className="space-y-2 pt-6 border-t-2 border-gray-200">
                        {stage.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-gray-200">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${stage.color} shadow-md flex-shrink-0`}></div>
                            <span className="text-xs font-semibold text-gray-800">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Bottom CTA */}
        <div className="mt-24 text-center">
          <div className="relative bg-gradient-to-r from-[#5a8a3d] via-[#4a7a2d] to-[#5a8a3d] rounded-3xl p-10 md:p-16 text-white shadow-2xl overflow-hidden group">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div 
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              ></div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-6 group-hover:scale-105 transition-transform">
                Integrated Value Chain
              </h3>
              <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed">
                Our comprehensive approach ensures quality, traceability, and value at every step, from farm to table.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                  <span className="font-semibold">✓ Quality Assured</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                  <span className="font-semibold">✓ Fully Traceable</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                  <span className="font-semibold">✓ Sustainable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
