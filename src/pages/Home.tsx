import Hero from '../components/Hero';
import HeroBanner from '../components/HeroBanner';
import Categories from '../components/Categories';
import LiveBids from '../components/LiveBids';
import FeaturedProducts from '../components/FeaturedProducts';
import HowItWorks from '../components/HowItWorks';

export default function Home() {
  return (
    <>
      <Hero />
      <HeroBanner />
      <Categories />
      <LiveBids />
      <FeaturedProducts />
      <HowItWorks />
    </>
  );
}

