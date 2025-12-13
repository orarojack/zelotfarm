import { TrendingUp, Users, Package, MapPin, Handshake } from 'lucide-react';

export default function Achievements() {
  const achievements = [
    {
      icon: TrendingUp,
      title: 'Expanded Dairy Herd to 17 Milkers',
      description: 'Producing up to 300 kg/day through consistent investment in livestock breeding, feeding, and veterinary care. Grown from a single calf to 17 active milkers.',
      color: 'from-[#5a8a3d] to-[#4a7a2d]'
    },
    {
      icon: Package,
      title: 'Scaled Broiler Capacity',
      description: 'Broiler production has risen from 1,000 to 5,000 birds per flock, demonstrating our ability to scale operations efficiently while maintaining high standards.',
      color: 'from-[#dc7f35] to-[#c66f25]'
    },
    {
      icon: Package,
      title: 'Consistent Egg Production',
      description: 'The layer unit has sustained an average of 30 trays of eggs daily, ensuring a continuous supply to local markets and distributors throughout the year.',
      color: 'from-[#5a8a3d] to-[#4a7a2d]'
    },
    {
      icon: MapPin,
      title: 'Strong Distribution Network',
      description: 'Established reliable distribution links in Githunguri, Kiambu, and Nairobi, connecting rural production points with urban markets.',
      color: 'from-[#dc7f35] to-[#c66f25]'
    },
    {
      icon: Handshake,
      title: 'Loyal Customer Base',
      description: 'Built long-term relationships with local retailers and cooperatives such as the Githunguri Dairy Farmers Cooperative Society.',
      color: 'from-[#5a8a3d] to-[#4a7a2d]'
    }
  ];

  const projects = [
    {
      title: 'Dairy Unit – Mutuya (Ikinu Ward)',
      period: 'Operational since mid-2023',
      description: 'Grown from a single calf to 17 productive dairy cows, achieving an impressive daily milk output of 250–300 kilograms. Integrates modern dairy management practices including balanced feeding, mechanized milking, and proper waste management systems.',
      impact: 'Boosted regional milk availability and supported local livelihoods through sustainable production.'
    },
    {
      title: 'Layers Unit – Mutuya (Ikinu Ward)',
      period: 'Launched in early 2023',
      description: 'Grown into a fully operational unit housing 1,000 healthy layers. Consistently produces an average of 30 trays of eggs daily, ensuring reliable supply to households, retailers, and hotels.',
      impact: 'Contributed to food security and created steady income streams through local egg distribution networks.'
    },
    {
      title: 'Broilers Unit – Githunguri Town',
      period: 'Established in mid-2024',
      description: 'Began with 3,000 Kenchic broilers per flock and has since scaled up to 5,000 birds per cycle. Employs efficient feeding systems, temperature control, and modern housing design.',
      impact: 'Strengthened Zealot AgriWorks\' presence in the regional poultry market and enhanced supply capacity to urban distributors and restaurants.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Achievements & Milestones
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Remarkable progress marked by steady growth, operational expansion, and strengthened market presence
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {achievements.map((achievement, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className={`w-14 h-14 bg-gradient-to-br ${achievement.color} rounded-full flex items-center justify-center mb-4`}>
                <achievement.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {achievement.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {achievement.description}
              </p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-[#5a8a3d] mb-8 text-center">
            Major Projects Completed
          </h3>
          <div className="space-y-6">
            {projects.map((project, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-2 md:mb-0">
                    {project.title}
                  </h4>
                  <span className="text-sm font-semibold text-[#5a8a3d] bg-[#5a8a3d]/10 px-4 py-1 rounded-full">
                    {project.period}
                  </span>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="bg-green-50 border-l-4 border-[#5a8a3d] p-4 rounded">
                  <p className="text-sm font-semibold text-[#5a8a3d] mb-1">Impact:</p>
                  <p className="text-gray-700">{project.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

