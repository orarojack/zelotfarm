import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#4a7a2d] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">
              Zealot AgriWorks Limited
            </h3>
            <p className="text-white/90 mb-4 text-sm">
              Leading in innovative and sustainable agribusiness that adds value and drives profitability. Driving innovation and value in dairy and poultry agribusiness.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-[#dc7f35] transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-[#dc7f35] transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-[#dc7f35] transition-colors">
                <Youtube size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/90 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-white/90 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-white/90 hover:text-white transition-colors">
                  Products
                </a>
              </li>
              <li>
                <a href="#" className="text-white/90 hover:text-white transition-colors">
                  Live Bids
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="flex-shrink-0 mt-1" />
                <span className="text-white/90">Mutuya, Ikinu Ward, Githunguri Sub-County, Kiambu County, Kenya</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0" />
                <a href="tel:+254708500722" className="text-white/90 hover:text-white transition-colors">
                  +254 708 500 722
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0" />
                <a href="mailto:isaaczealot2024@gmail.com" className="text-white/90 hover:text-white transition-colors">
                  isaaczealot2024@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Safety & Help</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/90 hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <div className="bg-orange-500 text-white px-3 py-2 rounded text-xs flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Warning: Beware of scam! Never send purchases for platform verifications.</span>
                </div>
              </li>
              <li>
                <a href="#" className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Safety Tips for Buyers
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-white/80">
              © {new Date().getFullYear()} Zealot AgriWorks Limited. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
