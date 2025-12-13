import { useState, useEffect } from 'react';

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Live Bids',
      subtitle: 'Bid on Fresh Agricultural Products Daily',
      description: 'Fair Price, E-azy & Safe Trade',
      buttonText: 'View Bids',
      image: 'https://cdn.tuko.co.ke/images/1120/0fgjhs6ji48econ22.jpeg?v=1'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-2xl mx-auto px-8 text-center text-white">
                  <h2 className="text-5xl font-bold mb-2">{slide.title}</h2>
                  <p className="text-xl mb-2">{slide.subtitle}</p>
                  <p className="text-2xl font-semibold mb-6">{slide.description}</p>
                  <button className="px-8 py-3 bg-[#dc7f35] text-white rounded-lg font-semibold hover:bg-[#c56d2a] transition-colors">
                    {slide.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
