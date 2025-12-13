import { User, Users, Award } from 'lucide-react';

export default function Management() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Management & Team
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A dedicated team committed to excellence in agribusiness
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-[#5a8a3d] to-[#4a7a2d] p-8 rounded-xl text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Managing Director & Founder</h3>
                <p className="text-white/90 text-lg">Mr. Isaac Macharia Njuguna</p>
              </div>
            </div>
            <p className="text-white/95 leading-relaxed">
              Mr. Njuguna provides overall leadership and strategic direction for Zealot AgriWorks Limited. With a strong background in agribusiness management and a passion for sustainable food systems, he spearheads business development, partnership building, and innovation initiatives. His vision drives the company's growth, ensuring alignment with modern agricultural standards and community development goals.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#dc7f35] to-[#c66f25] p-8 rounded-xl text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Operations Manager</h3>
                <p className="text-white/90 text-lg">Mr. Michael Irungu</p>
              </div>
            </div>
            <p className="text-white/95 leading-relaxed">
              Mr. Irungu oversees the day-to-day operations of the dairy, poultry, and broiler units. He is responsible for ensuring production efficiency, quality assurance, and adherence to biosecurity and hygiene standards. His practical experience in farm management and technical know-how ensures that every process — from feeding and breeding to product handling — meets the company's high standards.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-[#5a8a3d] rounded-full flex items-center justify-center">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Support Team</h3>
              <p className="text-gray-600">10 skilled casual staff members</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            A team of 10 skilled casual staff provides essential support in livestock management, feeding, cleaning, and packaging. Their dedication ensures smooth daily operations, animal welfare, and timely product delivery. The team is regularly trained in modern farming practices and safety protocols, fostering continuous improvement and accountability.
          </p>
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-gray-200">
            <Award size={20} className="text-[#5a8a3d]" />
            <p className="text-gray-700 font-medium">
              <span className="font-bold">Team Philosophy:</span> Together, the Zealot AgriWorks team embodies commitment, discipline, and teamwork. Each member plays a vital role in upholding the company's reputation for reliability, freshness, and quality — ensuring that customers consistently receive premium dairy and poultry products.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

