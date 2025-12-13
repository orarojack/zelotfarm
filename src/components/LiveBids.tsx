import { MapPin, ArrowRight, Clock, TrendingUp, Users, Flame, AlertCircle, Loader2, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LiveBid } from '../types';
import { useCart } from '../contexts/CartContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

export default function LiveBids() {
  const [liveBids, setLiveBids] = useState<LiveBid[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { customer } = useCustomerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveBids();
    // Refresh every 30 seconds to get updated bids
    const interval = setInterval(fetchLiveBids, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveBids = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('live_bids')
        .select('*')
        .eq('is_active', true)
        .gt('end_time', now)
        .order('is_trending', { ascending: false })
        .order('end_time', { ascending: true })
        .limit(6);

      if (error) throw error;
      setLiveBids(data || []);
    } catch (error) {
      console.error('Error fetching live bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = (endTime: string): number => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((end - now) / 1000));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getPriceIncrease = (current: number, starting: number) => {
    return Math.round(((current - starting) / starting) * 100);
  };

  // Update time left every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdown
      setLiveBids(prev => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section id="live-bids" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (liveBids.length === 0) {
    return (
      <section id="live-bids" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-semibold text-sm">LIVE BIDDING NOW</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Active Auctions
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Place your bids on premium livestock products from verified farmers. Limited time offers!
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No active auctions at the moment. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="live-bids" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-semibold text-sm">LIVE BIDDING NOW</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Active Auctions
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Place your bids on premium livestock products from verified farmers. Limited time offers!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {liveBids.map((bid) => {
            const timeLeft = calculateTimeLeft(bid.end_time);
            const priceIncrease = getPriceIncrease(bid.current_price, bid.starting_price);
            const isEndingSoon = timeLeft < 1800;

            return (
              <div
                key={bid.id}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#dc7f35]"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={bid.image_url || 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={bid.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {bid.is_trending && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Flame size={14} />
                      HOT
                    </div>
                  )}

                  <div className={`absolute top-3 right-3 ${isEndingSoon ? 'bg-red-500 animate-pulse' : 'bg-gray-900/80'} text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 backdrop-blur-sm`}>
                    <Clock size={14} />
                    {timeLeft > 0 ? formatTime(timeLeft) : 'Ended'}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                      <MapPin size={12} />
                      <span>{bid.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                      <Users size={12} />
                      <span>{bid.total_bids} bids</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-[#dc7f35] transition-colors">
                    {bid.name}
                  </h3>

                  <div className="bg-gradient-to-br from-[#5a8a3d]/10 to-[#dc7f35]/10 rounded-lg p-3 mb-3">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-gray-600 font-medium">Current Bid</span>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-green-600" />
                        <span className="text-xs font-bold text-green-600">+{priceIncrease}%</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        KES {bid.current_price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600">{bid.unit}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Starting: KES {bid.starting_price.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} className="text-gray-400 flex-shrink-0" />
                    <span>{bid.available_quantity}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await addToCart(undefined, bid.id, 1);
                          alert('Bid added to cart!');
                        } catch (error: any) {
                          alert(error.message || 'Failed to add to cart');
                        }
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-[#5a8a3d] to-[#4a7a2d] text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                    <button className="px-4 py-3 bg-gradient-to-r from-[#dc7f35] to-[#c56d2a] text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 group">
                      <span>Place Bid</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {liveBids.some(bid => calculateTimeLeft(bid.end_time) === 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-3" size={24} />
              <p className="text-yellow-800">
                <span className="font-semibold">Auction Ended!</span> Some bids have closed. Refresh to see new auctions.
              </p>
            </div>
          </div>
        )}

        <div className="text-center">
          <button className="px-8 py-4 border-2 border-[#dc7f35] text-[#dc7f35] rounded-xl font-bold text-lg hover:bg-[#dc7f35] hover:text-white transition-all duration-300 inline-flex items-center gap-3 shadow-md hover:shadow-xl">
            <span>View All Active Auctions</span>
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}
